import { describe, expect, it, vi } from "vitest";
import { type NoteActions, NoteComposerState } from "@/lib/admin/note-composer";
import type { NoteActionResult, NoteInput, NoteRef } from "@/lib/notes/operations";
import type { Note, NoteImage } from "@/lib/notes/types";

const NOW = new Date("2026-10-04T11:07:00.000Z"); // 14:07 in Istanbul

function stored(patch: Partial<Note> = {}): Note {
  return {
    id: "n1",
    text: "Stored.",
    side: "work",
    lang: "en",
    embed: null,
    status: "draft",
    tid: null,
    publishAt: null,
    publishedAt: null,
    createdAt: "2026-10-04T10:00:00.000Z",
    updatedAt: "2026-10-04T10:00:00.000Z",
    ...patch,
  };
}

const image = (key = "media/notes/a"): NoteImage => ({ key, alt: "", width: 800, height: 600, widths: [640, 800], baseUrl: `/api/media-dev/${key}` });

function actions(overrides: Partial<NoteActions> = {}): NoteActions {
  const ok = async (input: { content?: unknown }): Promise<NoteActionResult> => ({
    status: "ok",
    note: stored({ id: "saved", ...(input.content as object), updatedAt: "2026-10-04T11:07:00.000Z" }),
  });
  return {
    save: vi.fn(ok),
    publish: vi.fn(async (input: NoteInput): Promise<NoteActionResult> => ({
      status: "ok",
      note: stored({ id: "live", ...(input.content as object), status: "published", tid: "3m2k7xq4ab2c2", publishedAt: NOW.toISOString() }),
    })),
    schedule: vi.fn(async (input: NoteInput & { publishAt: string }): Promise<NoteActionResult> => ({
      status: "ok",
      note: stored({ id: "later", ...(input.content as object), status: "scheduled", publishAt: input.publishAt }),
    })),
    unschedule: vi.fn(async (ref: NoteRef): Promise<NoteActionResult> => ({ status: "ok", note: stored({ id: ref.id, status: "draft", updatedAt: "2026-10-04T11:08:00.000Z" }) })),
    remove: vi.fn(async (ref: NoteRef): Promise<NoteActionResult> => ({ status: "ok", note: stored({ id: ref.id }) })),
    ...overrides,
  };
}

const make = (notes: Note[] = [], a = actions()) => new NoteComposerState({ notes, available: true, side: "work" }, a, () => NOW);

describe("a new note", () => {
  it("starts empty on the given side, with nothing to save or publish", () => {
    const s = make().getSnapshot();
    expect(s.value).toEqual({ text: "", side: "work", lang: "en", embed: null });
    expect(s).toMatchObject({ dirty: false, canSave: false, canPrimary: false, primaryLabel: "Publish", saveLabel: "Save draft" });
  });

  it("follows the remembered side until it is edited", () => {
    const c = make();
    c.setDefaultSide("life");
    expect(c.getSnapshot()).toMatchObject({ value: { side: "life" }, dirty: false, lastSide: "life" });
  });

  it("counts graphemes and blocks publishing past 300", () => {
    const c = make();
    c.edit({ text: "👍🏽".repeat(300) });
    expect(c.getSnapshot()).toMatchObject({ count: 300, over: false, canPrimary: true });
    c.edit({ text: "x".repeat(301) });
    expect(c.getSnapshot()).toMatchObject({ over: true, canPrimary: false, canSave: true });
  });
});

describe("saving and publishing", () => {
  it("saves a draft, then edits the stored note", async () => {
    const a = actions();
    const c = make([], a);
    c.edit({ text: "Draft." });
    await c.save();
    expect(a.save).toHaveBeenCalledWith({ id: null, expected: null, content: { text: "Draft.", side: "work", lang: "en", embed: null } });
    expect(c.getSnapshot()).toMatchObject({ status: "saved", dirty: false, editing: { id: "saved" } });
    expect(c.getSnapshot().notes.map((n) => n.id)).toEqual(["saved"]);
    c.edit({ text: "Draft two." });
    await c.save();
    expect(a.save).toHaveBeenLastCalledWith({ id: "saved", expected: "2026-10-04T11:07:00.000Z", content: expect.objectContaining({ text: "Draft two." }) });
  });

  it("publishes and clears the box for the next note, keeping the side", async () => {
    const a = actions();
    const c = make([], a);
    c.edit({ text: "Live.", side: "both" });
    await c.primaryAction();
    expect(a.publish).toHaveBeenCalledOnce();
    expect(c.getSnapshot()).toMatchObject({ status: "published", editing: null, value: { text: "", side: "both" }, dirty: false, lastSide: "both" });
    expect(c.getSnapshot().notes[0]).toMatchObject({ id: "live", status: "published" });
  });

  it("ignores a second action while one is in flight", async () => {
    let release: (r: NoteActionResult) => void = () => {};
    const a = actions({ save: vi.fn(() => new Promise<NoteActionResult>((resolve) => (release = resolve))) });
    const c = make([], a);
    c.edit({ text: "Once." });
    const first = c.save();
    expect(c.getSnapshot()).toMatchObject({ busy: true, canSave: false, canPrimary: false });
    await c.save();
    await c.primaryAction();
    release({ status: "ok", note: stored({ id: "saved", text: "Once." }) });
    await first;
    expect(a.save).toHaveBeenCalledOnce();
    expect(a.publish).not.toHaveBeenCalled();
  });

  it("shows issues until the next edit", async () => {
    const c = make([], actions({ publish: vi.fn(async () => ({ status: "invalid" as const, issues: [{ at: "embed/images/0/alt", message: "Image 1 needs alt text." }] })) }));
    c.edit({ text: "x" });
    await c.primaryAction();
    expect(c.getSnapshot()).toMatchObject({ status: "invalid", issues: [{ message: "Image 1 needs alt text." }] });
    c.edit({ text: "xy" });
    expect(c.getSnapshot()).toMatchObject({ status: "idle", issues: [] });
  });

  it("blocks every write after a conflict, but lets an unavailable store be retried", async () => {
    const conflicted = make([], actions({ save: vi.fn(async () => ({ status: "conflict" as const })) }));
    conflicted.edit({ text: "x" });
    await conflicted.save();
    expect(conflicted.getSnapshot()).toMatchObject({ status: "conflict", blocked: true, canSave: false, canPrimary: false });

    const down = make([], actions({ save: vi.fn(async () => ({ status: "unavailable" as const })) }));
    down.edit({ text: "x" });
    await down.save();
    expect(down.getSnapshot()).toMatchObject({ status: "unavailable", blocked: false, canSave: true });
  });

  it("reads a thrown action (a dropped network) as unavailable", async () => {
    const c = make([], actions({ save: vi.fn(async () => Promise.reject(new Error("offline"))) }));
    c.edit({ text: "x" });
    await c.save();
    expect(c.getSnapshot()).toMatchObject({ status: "unavailable", busy: false, dirty: true });
  });

  it("starts blocked without a database", () => {
    const c = new NoteComposerState({ notes: [], available: false, side: "work" }, actions(), () => NOW);
    c.edit({ text: "x" });
    expect(c.getSnapshot()).toMatchObject({ blocked: true, canSave: false });
  });
});

describe("scheduling", () => {
  it("turns on at the next quarter hour in Istanbul and schedules that instant", async () => {
    const a = actions();
    const c = make([], a);
    c.edit({ text: "Later." });
    c.setSchedule({ on: true });
    expect(c.getSnapshot()).toMatchObject({ schedule: { on: true, date: "2026-10-04", time: "14:15" }, primary: "schedule", primaryLabel: "Schedule" });
    c.setSchedule({ time: "09:00", date: "2026-10-06" });
    await c.primaryAction();
    expect(a.schedule).toHaveBeenCalledWith(expect.objectContaining({ publishAt: "2026-10-06T06:00:00.000Z" }));
    expect(c.getSnapshot()).toMatchObject({ status: "scheduled", editing: null });
  });

  it("offers Publish now, Reschedule, Save and Unschedule on a scheduled note", async () => {
    const a = actions();
    const c = make([stored({ status: "scheduled", publishAt: "2026-10-06T06:00:00.000Z" })], a);
    c.open("n1");
    expect(c.getSnapshot()).toMatchObject({ schedule: { on: true, date: "2026-10-06", time: "09:00" }, primaryLabel: "Reschedule", saveLabel: "Save", dirty: false });
    c.setSchedule({ on: false });
    expect(c.getSnapshot()).toMatchObject({ primary: "publish", primaryLabel: "Publish now", dirty: true });
    c.setSchedule({ on: true });
    expect(c.getSnapshot().dirty).toBe(false);
    await c.unschedule();
    expect(a.unschedule).toHaveBeenCalledWith({ id: "n1", expected: "2026-10-04T10:00:00.000Z" });
    expect(c.getSnapshot()).toMatchObject({ status: "unscheduled", schedule: { on: false }, editing: { status: "draft" } });
  });
});

describe("a published note", () => {
  it("saves in place with one Save button, enabled only when changed", async () => {
    const a = actions({
      save: vi.fn(async (input: NoteInput): Promise<NoteActionResult> => ({
        status: "ok",
        note: stored({ id: "n1", ...(input.content as object), status: "published", tid: "3m2k7xq4ab2c2", publishedAt: NOW.toISOString(), updatedAt: "2026-10-04T11:09:00.000Z" }),
      })),
    });
    const c = make([stored({ status: "published", tid: "3m2k7xq4ab2c2", publishedAt: NOW.toISOString() })], a);
    c.open("n1");
    expect(c.getSnapshot()).toMatchObject({ primary: "update", primaryLabel: "Save", saveLabel: null, canPrimary: false });
    c.edit({ text: "Fixed a typo." });
    expect(c.getSnapshot().canPrimary).toBe(true);
    await c.primaryAction();
    expect(a.save).toHaveBeenCalledOnce();
    expect(c.getSnapshot()).toMatchObject({ status: "saved", dirty: false, editing: { id: "n1", text: "Fixed a typo." } });
  });
});

describe("attachments", () => {
  it("keeps one kind: images replace a link card and a link card replaces images", () => {
    const c = make();
    c.setLink({ kind: "link", url: "https://w00f.org/", title: "", description: "", siteName: "w00f.org" });
    c.addImage(image());
    expect(c.getSnapshot().value.embed).toEqual({ kind: "images", images: [image()] });
    c.setLink({ kind: "link", url: "https://w00f.org/", title: "", description: "", siteName: "w00f.org" });
    expect(c.getSnapshot().value.embed).toMatchObject({ kind: "link" });
  });

  it("takes four images at most, edits alt text and drops the attachment with the last image", () => {
    const c = make();
    for (const key of ["a", "b", "c", "d", "e"]) c.addImage(image(`media/notes/${key}`));
    const embed = c.getSnapshot().value.embed;
    expect(embed?.kind === "images" && embed.images.map((i) => i.key)).toEqual(["media/notes/a", "media/notes/b", "media/notes/c", "media/notes/d"]);
    c.setAlt(1, "Second");
    const after = c.getSnapshot().value.embed;
    expect(after?.kind === "images" && after.images[1].alt).toBe("Second");
    for (let i = 0; i < 4; i++) c.removeImage(0);
    expect(c.getSnapshot().value.embed).toBeNull();
  });

  it("blocks saving and publishing while an upload runs", () => {
    const c = make();
    c.edit({ text: "x" });
    c.uploadStarted();
    expect(c.getSnapshot()).toMatchObject({ uploads: 1, canSave: false, canPrimary: false });
    c.uploadFinished();
    expect(c.getSnapshot()).toMatchObject({ uploads: 0, canSave: true, canPrimary: true });
  });
});

describe("deleting and switching", () => {
  it("deletes the open note and starts a new one", async () => {
    const a = actions();
    const c = make([stored()], a);
    c.open("n1");
    await c.remove();
    expect(a.remove).toHaveBeenCalledWith({ id: "n1", expected: "2026-10-04T10:00:00.000Z" });
    expect(c.getSnapshot()).toMatchObject({ status: "deleted", editing: null, notes: [] });
  });

  it("reports unsaved changes, including an action in flight", () => {
    const c = make([stored()]);
    expect(c.hasUnsaved).toBe(false);
    c.open("n1");
    c.edit({ text: "Changed." });
    expect(c.hasUnsaved).toBe(true);
    c.startNew();
    expect(c.hasUnsaved).toBe(false);
  });
});
