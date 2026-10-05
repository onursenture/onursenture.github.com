import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { DrizzlePhotoStore } from "@/lib/photos/drizzle-store";
import { photos } from "@/lib/db/schema";
import { NO_EXIF } from "@/lib/photos/types";
import { describePhotoStore } from "../helpers/photo-store-contract";

describePhotoStore("DrizzlePhotoStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return new DrizzlePhotoStore(db);
});

describe("DrizzlePhotoStore unreadable data", () => {
  let db: ReturnType<typeof drizzle>;
  let store: DrizzlePhotoStore;

  beforeEach(async () => {
    db = drizzle(new PGlite());
    await migrate(db, { migrationsFolder: "./drizzle" });
    store = new DrizzlePhotoStore(db);
  });

  it("excludes photos with unreadable images from list, listPublished, and get; includes slug; warns", async () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const warnSpy = vi.spyOn(console, "warn");

    await db.insert(photos).values({
      id,
      title: "Bad Image",
      alt: "alt",
      takenAt: "2026-01-01T00:00:00",
      camera: "Camera",
      slug: "bad-image",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: { bogus: true } as any,
      exif: NO_EXIF,
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const list = await store.list();
    expect(list.map((p) => p.id)).not.toContain(id);

    const published = await store.listPublished();
    expect(published.map((p) => p.id)).not.toContain(id);

    const got = await store.get(id);
    expect(got).toBeNull();

    const slugs = await store.slugs();
    expect(slugs).toContain("bad-image");

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("has an unreadable image"));
    warnSpy.mockRestore();
  });

  it("returns photo with unreadable exif but valid image, with exif set to NO_EXIF", async () => {
    const id = "00000000-0000-4000-8000-000000000002";
    const image = { key: "media/photos/test", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "https://example.com" };

    await db.insert(photos).values({
      id,
      title: "Bad EXIF",
      alt: "alt",
      takenAt: "2026-01-01T00:00:00",
      camera: "Camera",
      slug: "bad-exif",
      image,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exif: { bogus: true } as any,
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const got = await store.get(id);
    expect(got).not.toBeNull();
    if (got) {
      expect(got.exif).toEqual(NO_EXIF);
      expect(got.image).toEqual(image);
    }
  });
});
