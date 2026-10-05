import { beforeEach, describe, expect, it } from "vitest";
import type { PhotoFields, PhotoStore } from "@/lib/photos/store";

const t0 = new Date("2026-10-05T10:00:00.000Z");
const t1 = new Date("2026-10-05T10:00:05.000Z");

const image = { key: "media/photos/abc", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "https://b.public.blob.vercel-storage.com/media/photos/abc" };

export const draftFields = (patch: Partial<PhotoFields> = {}): PhotoFields => ({
  title: "",
  alt: "",
  takenAt: "2026-08-17T18:42:10",
  camera: "Fujifilm X100VI",
  slug: null,
  image,
  exif: { takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" },
  status: "draft",
  publishedAt: null,
  ...patch,
});

const published = (slug: string, takenAt: string) => draftFields({ title: slug, slug, takenAt, status: "published", publishedAt: t0 });

// The behaviour both PhotoStore implementations must share.
export function describePhotoStore(name: string, make: () => Promise<PhotoStore>) {
  describe(name, () => {
    let store: PhotoStore;
    beforeEach(async () => {
      store = await make();
    });

    it("starts empty", async () => {
      expect(await store.list()).toEqual([]);
      expect(await store.listPublished()).toEqual([]);
      expect(await store.slugs()).toEqual([]);
      expect(await store.get("00000000-0000-4000-8000-000000000000")).toBeNull();
    });

    it("creates a draft with a uuid and ISO times, and reads it back whole", async () => {
      const result = await store.create(draftFields(), t0);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.photo).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        title: "",
        alt: "",
        takenAt: "2026-08-17T18:42:10",
        camera: "Fujifilm X100VI",
        slug: null,
        image,
        exif: { takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" },
        status: "draft",
        publishedAt: null,
        createdAt: t0.toISOString(),
        updatedAt: t0.toISOString(),
      });
      expect(await store.get(result.photo.id)).toEqual(result.photo);
    });

    it("lists every photo in site order and only published ones as published", async () => {
      await store.create(published("old", "2026-01-01T09:00:00"), t0);
      await store.create(published("new", "2026-09-01T09:00:00"), t0);
      await store.create(draftFields({ takenAt: "2026-05-01T09:00:00" }), t0);
      expect((await store.list()).map((p) => p.takenAt)).toEqual(["2026-09-01T09:00:00", "2026-05-01T09:00:00", "2026-01-01T09:00:00"]);
      expect((await store.listPublished()).map((p) => p.slug)).toEqual(["new", "old"]);
      expect((await store.slugs()).sort()).toEqual(["new", "old"]);
    });

    it("breaks a takenAt tie by id, descending", async () => {
      const a = await store.create(published("a", "2026-01-01T00:00:00"), t0);
      const b = await store.create(published("b", "2026-01-01T00:00:00"), t0);
      if (!a.ok || !b.ok) throw new Error("create failed");
      const ids = [a.photo.id, b.photo.id].sort().reverse();
      expect((await store.listPublished()).map((p) => p.id)).toEqual(ids);
    });

    it("refuses a slug that is taken, on create and on update", async () => {
      await store.create(published("stabilo", "2026-01-01T00:00:00"), t0);
      expect(await store.create(published("stabilo", "2026-02-01T00:00:00"), t0)).toEqual({ ok: false, reason: "duplicate-slug" });
      const draft = await store.create(draftFields(), t0);
      if (!draft.ok) throw new Error("create failed");
      expect(await store.update(draft.photo.id, published("stabilo", "2026-03-01T00:00:00"), draft.photo.updatedAt, t1)).toEqual({ ok: false, reason: "duplicate-slug" });
    });

    it("updates only from the updatedAt it last saw", async () => {
      const created = await store.create(draftFields(), t0);
      if (!created.ok) throw new Error("create failed");
      const { id, updatedAt } = created.photo;
      const updated = await store.update(id, draftFields({ title: "Moda" }), updatedAt, t1);
      expect(updated.ok && updated.photo.title).toBe("Moda");
      expect(updated.ok && updated.photo.updatedAt).toBe(t1.toISOString());
      expect(updated.ok && updated.photo.createdAt).toBe(t0.toISOString());
      expect(await store.update(id, draftFields({ title: "Stale" }), updatedAt, t1)).toEqual({ ok: false, reason: "conflict" });
      expect(await store.update("00000000-0000-4000-8000-000000000000", draftFields(), updatedAt, t1)).toEqual({ ok: false, reason: "missing" });
    });

    it("removes only from the updatedAt it last saw, and returns the photo", async () => {
      const created = await store.create(draftFields(), t0);
      if (!created.ok) throw new Error("create failed");
      expect(await store.remove(created.photo.id, t1.toISOString())).toEqual({ ok: false, reason: "conflict" });
      expect(await store.remove(created.photo.id, created.photo.updatedAt)).toEqual({ ok: true, photo: created.photo });
      expect(await store.get(created.photo.id)).toBeNull();
      expect(await store.remove(created.photo.id, created.photo.updatedAt)).toEqual({ ok: false, reason: "missing" });
    });
  });
}
