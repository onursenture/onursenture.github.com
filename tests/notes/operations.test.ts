import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { FileNoteStore } from "@/lib/notes/file-store";
import { type NoteOpResult, deleteNote, publishDue, publishNote, saveNote, scheduleNote, unscheduleNote } from "@/lib/notes/operations";
import type { NoteStore } from "@/lib/notes/store";
import { TID_PATTERN, tidTime } from "@/lib/notes/tid";
import type { Note, NoteContent } from "@/lib/notes/types";

const t0 = new Date("2026-10-04T10:00:00.000Z");
const t1 = new Date("2026-10-04T10:01:00.000Z");
const t2 = new Date("2026-10-04T10:02:00.000Z");
const content = (patch: Partial<NoteContent> = {}): NoteContent => ({ text: "Hello.", side: "work", lang: "en", embed: null, ...patch });

let store: NoteStore;
beforeEach(() => {
  store = new FileNoteStore(join(mkdtempSync(join(tmpdir(), "note-ops-")), "content.notes.json"));
});

async function ok(promise: Promise<NoteOpResult>): Promise<Note> {
  const result = await promise;
  if (result.status !== "ok") throw new Error(`expected ok, got ${JSON.stringify(result)}`);
  return result.note;
}

describe("saveNote", () => {
  it("creates a draft, even over the limit, then saves over it", async () => {
    const draft = await ok(saveNote(store, { id: null, expected: null, content: content({ text: "x".repeat(400) }) }, t0));
    expect(draft).toMatchObject({ status: "draft", tid: null, text: "x".repeat(400) });
    const next = await ok(saveNote(store, { id: draft.id, expected: draft.updatedAt, content: content({ text: "Shorter." }) }, t1));
    expect(next).toMatchObject({ status: "draft", text: "Shorter.", updatedAt: t1.toISOString() });
  });

  it("refuses a stale tab, a missing note and a bad shape", async () => {
    const draft = await ok(saveNote(store, { id: null, expected: null, content: content() }, t0));
    await ok(saveNote(store, { id: draft.id, expected: draft.updatedAt, content: content({ text: "One." }) }, t1));
    expect(await saveNote(store, { id: draft.id, expected: draft.updatedAt, content: content({ text: "Two." }) }, t2)).toEqual({ status: "conflict" });
    expect(await saveNote(store, { id: "00000000-0000-4000-8000-000000000000", expected: t0.toISOString(), content: content() }, t2)).toEqual({ status: "missing" });
    expect(await saveNote(store, { id: null, expected: null, content: { ...content(), side: "home" } }, t2)).toMatchObject({ status: "invalid" });
  });

  it("keeps a published note publishable and its TID unchanged", async () => {
    const live = await ok(publishNote(store, { id: null, expected: null, content: content() }, t0));
    expect(await saveNote(store, { id: live.id, expected: live.updatedAt, content: content({ text: "x".repeat(301) }) }, t1)).toMatchObject({ status: "invalid" });
    const edited = await ok(saveNote(store, { id: live.id, expected: live.updatedAt, content: content({ text: "Edited." }) }, t1));
    expect(edited).toMatchObject({ status: "published", tid: live.tid, publishedAt: live.publishedAt, text: "Edited." });
  });
});

describe("publishNote", () => {
  it("publishes a new note with a TID from now", async () => {
    const live = await ok(publishNote(store, { id: null, expected: null, content: content() }, t0));
    expect(live.status).toBe("published");
    expect(live.publishedAt).toBe(t0.toISOString());
    expect(live.tid).toMatch(TID_PATTERN);
    expect(tidTime(live.tid!)).toBe(t0.getTime());
  });

  it("publishes a saved draft, and a re-publish keeps the TID and date", async () => {
    const draft = await ok(saveNote(store, { id: null, expected: null, content: content() }, t0));
    const live = await ok(publishNote(store, { id: draft.id, expected: draft.updatedAt, content: content({ text: "Live." }) }, t1));
    expect(live).toMatchObject({ id: draft.id, status: "published", text: "Live.", publishedAt: t1.toISOString() });
    const again = await ok(publishNote(store, { id: live.id, expected: live.updatedAt, content: content({ text: "Again." }) }, t2));
    expect(again).toMatchObject({ tid: live.tid, publishedAt: t1.toISOString(), text: "Again." });
  });

  it("refuses what can't go live", async () => {
    expect(await publishNote(store, { id: null, expected: null, content: content({ text: " " }) }, t0)).toEqual({
      status: "invalid",
      issues: [{ at: "text", message: "Write something or add an image." }],
    });
  });
});

describe("scheduleNote and unscheduleNote", () => {
  it("schedules on a future quarter hour, without a TID", async () => {
    const scheduled = await ok(scheduleNote(store, { id: null, expected: null, content: content(), publishAt: "2026-10-04T10:15:00.000Z" }, t0));
    expect(scheduled).toMatchObject({ status: "scheduled", tid: null, publishedAt: null, publishAt: "2026-10-04T10:15:00.000Z" });
  });

  it("refuses a past or off-quarter time, and a published note", async () => {
    expect(await scheduleNote(store, { id: null, expected: null, content: content(), publishAt: "2026-10-04T09:45:00.000Z" }, t0)).toEqual({
      status: "invalid",
      issues: [{ at: "publishAt", message: "Pick a time in the future." }],
    });
    expect(await scheduleNote(store, { id: null, expected: null, content: content(), publishAt: "2026-10-04T10:20:00.000Z" }, t0)).toMatchObject({ status: "invalid" });
    const live = await ok(publishNote(store, { id: null, expected: null, content: content() }, t0));
    expect(await scheduleNote(store, { id: live.id, expected: live.updatedAt, content: content(), publishAt: "2026-10-04T10:15:00.000Z" }, t0)).toEqual({
      status: "invalid",
      issues: [{ at: "publishAt", message: "A published note can't be scheduled." }],
    });
  });

  it("unschedules back to a draft, and refuses a note that isn't scheduled", async () => {
    const scheduled = await ok(scheduleNote(store, { id: null, expected: null, content: content(), publishAt: "2026-10-04T10:15:00.000Z" }, t0));
    const draft = await ok(unscheduleNote(store, { id: scheduled.id, expected: scheduled.updatedAt }, t1));
    expect(draft).toMatchObject({ status: "draft", publishAt: null });
    expect(await unscheduleNote(store, { id: draft.id, expected: draft.updatedAt }, t2)).toMatchObject({ status: "invalid" });
  });
});

describe("deleteNote", () => {
  it("deletes only from the latest version", async () => {
    const draft = await ok(saveNote(store, { id: null, expected: null, content: content() }, t0));
    expect(await deleteNote(store, { id: draft.id, expected: t1.toISOString() })).toEqual({ status: "conflict" });
    await ok(deleteNote(store, { id: draft.id, expected: draft.updatedAt }));
    expect(await store.get(draft.id)).toBeNull();
  });
});

describe("publishDue", () => {
  it("publishes due notes with TIDs from their scheduled time, once", async () => {
    const at = "2026-10-04T10:15:00.000Z";
    const a = await ok(scheduleNote(store, { id: null, expected: null, content: content({ text: "A" }), publishAt: at }, t0));
    const b = await ok(scheduleNote(store, { id: null, expected: null, content: content({ text: "B" }), publishAt: at }, t0));
    await ok(scheduleNote(store, { id: null, expected: null, content: content({ text: "Later" }), publishAt: "2026-10-04T10:30:00.000Z" }, t0));

    const published = await publishDue(store, new Date("2026-10-04T10:16:00.000Z"));
    expect(published.map((n) => n.text).sort()).toEqual(["A", "B"]);
    for (const note of published) {
      expect(note).toMatchObject({ status: "published", publishedAt: at, publishAt: null });
      expect(tidTime(note.tid!)).toBe(Date.parse(at));
    }
    expect(new Set(published.map((n) => n.tid)).size).toBe(2);
    expect((await store.get(a.id))?.status).toBe("published");
    expect((await store.get(b.id))?.status).toBe("published");
    expect(await publishDue(store, new Date("2026-10-04T10:16:00.000Z"))).toEqual([]);
  });
});
