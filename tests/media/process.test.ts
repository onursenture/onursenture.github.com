import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { IMAGE_SETTINGS } from "@/lib/images/plan";
import { processImage } from "@/lib/media/process";
import type { MediaStorage } from "@/lib/media/storage";

const now = new Date("2026-10-04T10:00:00.000Z");

function memory(): MediaStorage & { files: Map<string, Buffer> } {
  const files = new Map<string, Buffer>();
  return {
    mode: "local",
    files,
    async saveSource() {
      return "local:uploads/x.png";
    },
    async readSource() {
      return Buffer.alloc(0);
    },
    async deleteSource() {},
    async putFile(pathname, body) {
      files.set(pathname, body);
      return `https://cdn.test/${pathname}`;
    },
    resolveLocal() {
      return null;
    },
  };
}

const png = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#2F55F5" } }).png().toBuffer();

describe("processImage", () => {
  it("renders AVIF and JPEG renditions and describes them", async () => {
    const storage = memory();
    const result = await processImage(await png(1280, 800), { slug: "nebuu", imageId: "cards" }, storage, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { record } = result;
    expect(record.key).toMatch(/^media\/work\/nebuu\/cards-[0-9a-f]{8}$/);
    expect(record).toMatchObject({ width: 1280, height: 800, widths: [640, 1280], settings: IMAGE_SETTINGS, createdAt: now });
    expect(record.baseUrl).toBe(`https://cdn.test/${record.key}`);
    expect([...storage.files.keys()].sort()).toEqual(
      [640, 1280].flatMap((w) => [`${record.key}-${w}.avif`, `${record.key}-${w}.jpg`]).sort(),
    );
    expect((await sharp(storage.files.get(`${record.key}-640.jpg`)!).metadata()).width).toBe(640);
  });

  it("rejects a 4:3 image and an unreadable file, writing nothing", async () => {
    const storage = memory();
    expect(await processImage(await png(1600, 1200), { slug: "nebuu", imageId: "cards" }, storage, now)).toEqual({
      ok: false,
      reason: "The image is 1600×1200; it must be 16:10, for example 2560×1600.",
    });
    expect(await processImage(Buffer.from("not an image"), { slug: "nebuu", imageId: "cards" }, storage, now)).toEqual({
      ok: false,
      reason: "The file is not a readable image.",
    });
    expect(storage.files.size).toBe(0);
  });
});
