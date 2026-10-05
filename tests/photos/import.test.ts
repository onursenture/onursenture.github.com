import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { LocalMediaStorage } from "@/lib/media/storage";
import { FilePhotoStore } from "@/lib/photos/file-store";
import { databaseHost, importPhotos, localImportAllowed, parseRepoPhoto } from "@/lib/photos/import";

const now = new Date("2026-10-06T09:00:00.000Z");

describe("parseRepoPhoto", () => {
  it("reads the frontmatter, with YAML dates and an optional camera", () => {
    expect(parseRepoPhoto("stabilo", "---\ntitle: Stabilo\ndate: 2026-04-11\nimage: photos/stabilo\ncamera: iPhone 17\n---\n")).toEqual({
      slug: "stabilo",
      title: "Stabilo",
      date: "2026-04-11",
      image: "photos/stabilo",
      camera: "iPhone 17",
    });
    expect(parseRepoPhoto("x", "---\ntitle: X\ndate: 2026-01-01\nimage: photos/x\n---\n").camera).toBe("");
  });

  it("names the file when the frontmatter is invalid", () => {
    expect(() => parseRepoPhoto("bad", "---\ntitle: Bad\n---\n")).toThrow("content/photos/bad.mdx");
  });
});

describe("importPhotos", () => {
  async function setup() {
    const dir = mkdtempSync(join(tmpdir(), "import-"));
    const store = new FilePhotoStore(join(dir, "c.photos.json"));
    const storage = new LocalMediaStorage(join(dir, "media"));
    const bytes = await sharp({ create: { width: 2560, height: 1440, channels: 3, background: "#2F55F5" } }).jpeg().toBuffer();
    const items = [{ photo: { slug: "stabilo", title: "Stabilo", date: "2026-04-11", image: "photos/stabilo", camera: "iPhone 17" }, bytes }];
    return { dir, store, storage, items };
  }

  it("imports a published photo under its old slug, dated at midnight", async () => {
    const { store, storage, items } = await setup();
    expect(await importPhotos(store, storage, items, now, { dryRun: false })).toEqual({ imported: ["stabilo"], skipped: [] });
    const [photo] = await store.listPublished();
    expect(photo).toMatchObject({ slug: "stabilo", title: "Stabilo", alt: "", takenAt: "2026-04-11T00:00:00", camera: "iPhone 17", exif: { takenAt: null, camera: null }, publishedAt: now.toISOString() });
    expect(photo.image.key).toMatch(/^media\/photos\/[0-9a-f]{16}-[0-9a-f]{8}$/);
    expect(photo.image.widths).toEqual([640, 1280, 2560]);
  });

  it("skips a slug that is already there, so it can run again", async () => {
    const { store, storage, items } = await setup();
    await importPhotos(store, storage, items, now, { dryRun: false });
    expect(await importPhotos(store, storage, items, now, { dryRun: false })).toEqual({ imported: [], skipped: ["stabilo"] });
    expect(await store.list()).toHaveLength(1);
  });

  it("writes nothing on a dry run", async () => {
    const { dir, store, storage, items } = await setup();
    expect(await importPhotos(store, storage, items, now, { dryRun: true })).toEqual({ imported: ["stabilo"], skipped: [] });
    expect(await store.list()).toEqual([]);
    expect(readdirSync(dir)).not.toContain("media");
  });
});

describe("databaseHost and localImportAllowed", () => {
  it("allows --local for localhost, 127.0.0.1 and ::1", () => {
    for (const url of ["postgres://u:p@localhost:5432/db", "postgres://127.0.0.1/db", "postgres://u@[::1]:5432/db"]) {
      expect(localImportAllowed(url)).toBe(true);
    }
  });

  it("refuses --local for a remote host or an unparseable URL", () => {
    expect(localImportAllowed("postgres://u:p@ep-xyz.eu-central-1.aws.neon.tech/db?sslmode=require")).toBe(false);
    expect(localImportAllowed("postgres://localhost.evil.example/db")).toBe(false);
    expect(localImportAllowed("not a url")).toBe(false);
    expect(localImportAllowed("")).toBe(false);
  });

  it("names the host only, without credentials, path or query", () => {
    expect(databaseHost("postgres://user:secret@ep-xyz.eu-central-1.aws.neon.tech:5432/neondb?sslmode=require")).toBe("ep-xyz.eu-central-1.aws.neon.tech");
    expect(databaseHost("postgres://u@[::1]:5432/db")).toBe("::1");
    expect(databaseHost("garbage")).toBeNull();
  });
});
