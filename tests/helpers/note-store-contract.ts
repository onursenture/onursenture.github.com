import { beforeEach, describe, expect, it } from "vitest";
import type { NoteFields, NoteStore } from "@/lib/notes/store";

const t0 = new Date("2026-10-04T10:00:00.000Z");
const t1 = new Date("2026-10-04T10:00:05.000Z");
const t2 = new Date("2026-10-04T10:00:09.000Z");

export const draftFields = (patch: Partial<NoteFields> = {}): NoteFields => ({
  text: "Hello.",
  side: "work",
  lang: "en",
  embed: null,
  status: "draft",
  tid: null,
  publishAt: null,
  publishedAt: null,
  ...patch,
});

const published = (tid: string, at: Date, patch: Partial<NoteFields> = {}) => draftFields({ status: "published", tid, publishedAt: at, ...patch });

// The behaviour both NoteStore implementations must share.
export function describeNoteStore(name: string, make: () => Promise<NoteStore>) {
  describe(name, () => {
    let store: NoteStore;
    beforeEach(async () => {
      store = await make();
    });

    it("starts empty", async () => {
      expect(await store.list()).toEqual([]);
      expect(await store.listPublished()).toEqual([]);
      expect(await store.get("00000000-0000-4000-8000-000000000000")).toBeNull();
    });

    it("creates a draft with a uuid and ISO times", async () => {
      const result = await store.create(draftFields({ embed: { kind: "link", url: "https://w00f.org/", title: "w00f", description: "", siteName: "" } }), t0);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.note).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        text: "Hello.",
        side: "work",
        lang: "en",
        embed: { kind: "link", url: "https://w00f.org/", title: "w00f", description: "", siteName: "" },
        status: "draft",
        tid: null,
        publishAt: null,
        publishedAt: null,
        createdAt: t0.toISOString(),
        updatedAt: t0.toISOString(),
      });
      expect(await store.get(result.note.id)).toEqual(result.note);
    });

    it("updates only when the caller saw the latest version", async () => {
      const created = await store.create(draftFields(), t0);
      if (!created.ok) throw new Error("create failed");
      const id = created.note.id;
      const first = await store.update(id, draftFields({ text: "Two." }), t0.toISOString(), t1);
      expect(first).toMatchObject({ ok: true, note: { text: "Two.", updatedAt: t1.toISOString(), createdAt: t0.toISOString() } });
      expect(await store.update(id, draftFields({ text: "Stale." }), t0.toISOString(), t2)).toEqual({ ok: false, reason: "conflict" });
      expect(await store.update("00000000-0000-4000-8000-000000000000", draftFields(), t0.toISOString(), t2)).toEqual({ ok: false, reason: "missing" });
      expect((await store.get(id))?.text).toBe("Two.");
    });

    it("refuses a TID another note already has", async () => {
      const a = await store.create(published("3m2k7xq4ab2c2", t0), t0);
      const b = await store.create(draftFields(), t0);
      if (!a.ok || !b.ok) throw new Error("create failed");
      expect(await store.update(b.note.id, published("3m2k7xq4ab2c2", t1), t0.toISOString(), t1)).toEqual({ ok: false, reason: "duplicate-tid" });
      expect(await store.create(published("3m2k7xq4ab2c2", t1), t1)).toEqual({ ok: false, reason: "duplicate-tid" });
    });

    it("lists every note by last update, and published notes by date then TID", async () => {
      const old = await store.create(published("3lzzzzzzzzzz2", new Date("2025-12-01T00:00:00.000Z")), t0);
      const draft = await store.create(draftFields({ text: "Draft." }), t1);
      const same1 = await store.create(published("3m22222222222", new Date("2026-10-01T00:00:00.000Z")), t2);
      const same2 = await store.create(published("3m22222222223", new Date("2026-10-01T00:00:00.000Z")), t2);
      if (!old.ok || !draft.ok || !same1.ok || !same2.ok) throw new Error("create failed");
      expect((await store.list()).map((n) => n.id).slice(0, 2).sort()).toEqual([same1.note.id, same2.note.id].sort());
      expect((await store.list()).map((n) => n.id).slice(2)).toEqual([draft.note.id, old.note.id]);
      expect((await store.listPublished()).map((n) => n.tid)).toEqual(["3m22222222223", "3m22222222222", "3lzzzzzzzzzz2"]);
    });

    it("removes only when the caller saw the latest version", async () => {
      const created = await store.create(draftFields(), t0);
      if (!created.ok) throw new Error("create failed");
      expect(await store.remove(created.note.id, t1.toISOString())).toEqual({ ok: false, reason: "conflict" });
      expect(await store.remove(created.note.id, t0.toISOString())).toEqual({ ok: true, note: created.note });
      expect(await store.get(created.note.id)).toBeNull();
      expect(await store.remove(created.note.id, t0.toISOString())).toEqual({ ok: false, reason: "missing" });
    });

    it("finds scheduled notes that are due, oldest first", async () => {
      const later = await store.create(draftFields({ status: "scheduled", publishAt: new Date("2026-10-04T10:15:00.000Z") }), t0);
      const earlier = await store.create(draftFields({ status: "scheduled", publishAt: new Date("2026-10-04T09:45:00.000Z") }), t0);
      await store.create(draftFields({ status: "scheduled", publishAt: new Date("2026-10-04T10:30:00.000Z") }), t0);
      await store.create(draftFields(), t0);
      if (!later.ok || !earlier.ok) throw new Error("create failed");
      expect((await store.due(new Date("2026-10-04T10:15:00.000Z"))).map((n) => n.id)).toEqual([earlier.note.id, later.note.id]);
    });
  });
}
