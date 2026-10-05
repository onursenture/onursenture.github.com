import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FilePhotoStore } from "@/lib/photos/file-store";
import { createPhotoDraft, deletePhoto, publishPhoto, savePhoto } from "@/lib/photos/operations";
import type { StoredPhoto } from "@/lib/photos/types";

const t0 = new Date("2026-10-05T10:00:00.000Z");
const t1 = new Date("2026-10-05T10:05:00.000Z");
const image = { key: "media/photos/abc-12345678", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "https://b.public.blob.vercel-storage.com/media/photos/abc-12345678" };
const exif = { takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" };

let store: FilePhotoStore;
beforeEach(() => {
  store = new FilePhotoStore(join(mkdtempSync(join(tmpdir(), "photo-ops-")), "c.photos.json"));
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

async function draft(): Promise<StoredPhoto> {
  const result = await createPhotoDraft(store, { image, exif }, t0);
  if (result.status !== "ok") throw new Error(result.status);
  return result.photo;
}

const content = (photo: StoredPhoto, patch: Record<string, string> = {}) => ({ title: photo.title, alt: photo.alt, takenAt: photo.takenAt, camera: photo.camera, ...patch });

describe("createPhotoDraft", () => {
  it("fills the date and camera from EXIF", async () => {
    const photo = await draft();
    expect(photo).toMatchObject({ status: "draft", slug: null, title: "", alt: "", takenAt: exif.takenAt, camera: exif.camera, exif, image });
  });

  it("dates a photo without EXIF now, on the Istanbul clock, with no camera", async () => {
    const result = await createPhotoDraft(store, { image, exif: { takenAt: null, camera: null } }, t0);
    expect(result.status === "ok" && result.photo).toMatchObject({ takenAt: "2026-10-05T13:00:00", camera: "" });
  });
});

describe("savePhoto", () => {
  it("saves a draft without a title", async () => {
    const photo = await draft();
    const result = await savePhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { alt: "A hill" }) }, t1);
    expect(result.status === "ok" && result.photo).toMatchObject({ alt: "A hill", status: "draft" });
  });

  it("refuses bad content with field issues", async () => {
    const photo = await draft();
    const result = await savePhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { takenAt: "2026-02-30T00:00:00" }) }, t1);
    expect(result).toEqual({ status: "invalid", issues: [{ at: "takenAt", message: "Use a valid date." }] });
  });

  it("keeps a live photo publishable", async () => {
    const photo = await draft();
    const live = await publishPhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { title: "Kızılcıklı" }) }, t1);
    if (live.status !== "ok") throw new Error(live.status);
    const result = await savePhoto(store, { id: live.photo.id, expected: live.photo.updatedAt, content: content(live.photo, { title: "" }) }, t1);
    expect(result).toEqual({ status: "invalid", issues: [{ at: "title", message: "Add a title." }] });
  });

  it("reports a stale tab and a deleted photo", async () => {
    const photo = await draft();
    expect(await savePhoto(store, { id: photo.id, expected: "2000-01-01T00:00:00.000Z", content: content(photo) }, t1)).toEqual({ status: "conflict" });
    expect(await savePhoto(store, { id: "00000000-0000-4000-8000-000000000000", expected: photo.updatedAt, content: content(photo) }, t1)).toEqual({ status: "missing" });
  });
});

describe("publishPhoto", () => {
  it("needs a title", async () => {
    const photo = await draft();
    expect(await publishPhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo) }, t1)).toEqual({
      status: "invalid",
      issues: [{ at: "title", message: "Add a title." }],
    });
  });

  it("assigns a slug from the title at first publish, and never changes it", async () => {
    const photo = await draft();
    const first = await publishPhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { title: "Kızılcıklı akşam" }) }, t1);
    if (first.status !== "ok") throw new Error(first.status);
    expect(first.photo).toMatchObject({ slug: "kizilcikli-aksam", status: "published", publishedAt: t1.toISOString() });
    const again = await publishPhoto(store, { id: photo.id, expected: first.photo.updatedAt, content: content(first.photo, { title: "Renamed" }) }, t1);
    expect(again.status === "ok" && again.photo).toMatchObject({ slug: "kizilcikli-aksam", title: "Renamed", publishedAt: t1.toISOString() });
  });

  it("adds -2 when the slug is taken", async () => {
    for (const expectedSlug of ["stabilo", "stabilo-2"]) {
      const photo = await draft();
      const result = await publishPhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { title: "Stabilo" }) }, t1);
      expect(result.status === "ok" && result.photo.slug).toBe(expectedSlug);
    }
  });

  // A store whose update reports a taken slug for the first `failures` calls.
  function racing(failures: number) {
    const update = vi.fn(async (...args: Parameters<FilePhotoStore["update"]>) => {
      if (update.mock.calls.length <= failures) return { ok: false as const, reason: "duplicate-slug" as const };
      return store.update(...args);
    });
    return { stub: Object.assign(Object.create(store), { update }) as FilePhotoStore, update };
  }

  it("retries when another publish takes the slug first", async () => {
    const photo = await draft();
    const { stub, update } = racing(1);
    const result = await publishPhoto(stub, { id: photo.id, expected: photo.updatedAt, content: content(photo, { title: "Stabilo" }) }, t1);
    expect(result.status === "ok" && result.photo).toMatchObject({ slug: "stabilo", status: "published" });
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("gives up with a conflict after three slug races", async () => {
    const photo = await draft();
    const { stub, update } = racing(Infinity);
    const result = await publishPhoto(stub, { id: photo.id, expected: photo.updatedAt, content: content(photo, { title: "Stabilo" }) }, t1);
    expect(result).toEqual({ status: "conflict" });
    expect(update).toHaveBeenCalledTimes(3);
  });
});

describe("deletePhoto", () => {
  it("removes the row, then its renditions", async () => {
    const photo = await draft();
    const storage = { deleteRenditions: vi.fn(async () => {}) };
    expect(await deletePhoto(store, storage, { id: photo.id, expected: photo.updatedAt })).toEqual({ status: "ok", photo });
    expect(storage.deleteRenditions).toHaveBeenCalledWith(image);
    expect(await store.get(photo.id)).toBeNull();
  });

  it("still deletes when the storage fails, and touches no files on a conflict", async () => {
    const photo = await draft();
    const failing = { deleteRenditions: vi.fn(async () => Promise.reject(new Error("blob down"))) };
    expect(await deletePhoto(store, failing, { id: photo.id, expected: "2000-01-01T00:00:00.000Z" })).toEqual({ status: "conflict" });
    expect(failing.deleteRenditions).not.toHaveBeenCalled();
    expect((await deletePhoto(store, failing, { id: photo.id, expected: photo.updatedAt })).status).toBe("ok");
    expect(console.warn).toHaveBeenCalled();
  });
});
