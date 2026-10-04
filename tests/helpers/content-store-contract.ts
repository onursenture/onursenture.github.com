import { beforeEach, describe, expect, it } from "vitest";
import type { ContentStore, MediaRecord } from "@/lib/content/store";

const t0 = new Date("2026-10-04T10:00:00.000Z");
const t1 = new Date("2026-10-04T10:00:05.000Z");
const t2 = new Date("2026-10-04T10:00:09.000Z");

export const sampleMedia: MediaRecord = {
  key: "media/work/nebuu/game-ab12cd34",
  baseUrl: "https://x.public.blob.vercel-storage.com/media/work/nebuu/game-ab12cd34",
  width: 2560,
  height: 1600,
  widths: [640, 1280, 2560],
  sourceHash: "ab12cd34",
  settings: "v1",
  createdAt: t0,
};

// The behaviour both ContentStore implementations must share.
export function describeContentStore(name: string, make: () => Promise<ContentStore>) {
  describe(name, () => {
    let store: ContentStore;
    beforeEach(async () => {
      store = await make();
    });

    it("starts empty", async () => {
      expect(await store.getDoc("lab")).toBeNull();
      expect(await store.listDocs()).toEqual([]);
      expect(await store.listMedia()).toEqual([]);
    });

    it("saves a first draft only when no draft is expected", async () => {
      expect(await store.saveDraft("lab", [{ title: "A", description: "B" }], null, t0)).toEqual({ ok: true, draftUpdatedAt: t0 });
      expect(await store.getDoc("lab")).toEqual({ key: "lab", draft: [{ title: "A", description: "B" }], published: null, draftUpdatedAt: t0, publishedAt: null });
      expect(await store.saveDraft("lab", [], null, t1)).toEqual({ ok: false });
    });

    it("saves over a draft only when the caller saw the latest one", async () => {
      await store.saveDraft("lab", ["one"], null, t0);
      expect(await store.saveDraft("lab", ["two"], t0, t1)).toEqual({ ok: true, draftUpdatedAt: t1 });
      expect(await store.saveDraft("lab", ["stale"], t0, t2)).toEqual({ ok: false });
      expect((await store.getDoc("lab"))?.draft).toEqual(["two"]);
    });

    it("refuses an expected draft that doesn't exist", async () => {
      expect(await store.saveDraft("lab", ["x"], t0, t1)).toEqual({ ok: false });
    });

    it("publishes: the value goes live and the draft is cleared", async () => {
      await store.saveDraft("lab", ["draft"], null, t0);
      await store.publish("lab", ["live"], t1);
      expect(await store.getDoc("lab")).toEqual({ key: "lab", draft: null, published: ["live"], draftUpdatedAt: null, publishedAt: t1 });
      expect(await store.saveDraft("lab", ["next"], null, t2)).toEqual({ ok: true, draftUpdatedAt: t2 });
    });

    it("discards a draft, keeping the published value, and drops a draft-only row", async () => {
      await store.publish("lab", ["live"], t0);
      await store.saveDraft("lab", ["draft"], null, t1);
      await store.discardDraft("lab");
      expect(await store.getDoc("lab")).toMatchObject({ draft: null, published: ["live"], draftUpdatedAt: null });
      await store.saveDraft("work/new-page", { slug: "new-page" }, null, t1);
      await store.discardDraft("work/new-page");
      expect(await store.getDoc("work/new-page")).toBeNull();
    });

    it("deletes a document and lists the rest", async () => {
      await store.publish("lab", ["a"], t0);
      await store.publish("pins", { order: [] }, t0);
      await store.deleteDoc("lab");
      expect((await store.listDocs()).map((doc) => doc.key)).toEqual(["pins"]);
    });

    it("stores media and replaces a record with the same key", async () => {
      await store.putMedia(sampleMedia);
      await store.putMedia({ ...sampleMedia, height: 1599 });
      expect(await store.listMedia()).toEqual([{ ...sampleMedia, height: 1599 }]);
    });
  });
}
