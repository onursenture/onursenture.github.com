import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processImage, processImageWith } from "@/lib/media/process";
import { checkDimensions, checkNoteDimensions } from "@/lib/media/rules";
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
    async deleteRenditions() {},
    resolveLocal() {
      return null;
    },
  };
}

const png = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#2F55F5" } }).png().toBuffer();

describe("checkNoteDimensions", () => {
  it("takes any ratio from 1:3 to 3:1, at least 320px wide", () => {
    expect(checkNoteDimensions(1600, 1200)).toBeNull();
    expect(checkNoteDimensions(1170, 2532)).toBeNull();
    expect(checkNoteDimensions(900, 2700)).toBeNull();
    expect(checkNoteDimensions(400, 1300)).toBe("The image is 400×1300; notes take ratios from 1:3 to 3:1.");
    expect(checkNoteDimensions(1300, 400)).toBe("The image is 1300×400; notes take ratios from 1:3 to 3:1.");
    expect(checkNoteDimensions(300, 300)).toBe("The image is 300px wide; it needs at least 320px.");
  });

  it("leaves the product-page rule as it was", () => {
    expect(checkDimensions(1600, 1200)).not.toBeNull();
  });
});

describe("processImageWith", () => {
  it("renders a 4:3 note image under the given key", async () => {
    const storage = memory();
    const result = await processImageWith(await png(800, 600), { key: (hash) => `media/notes/${hash.slice(0, 16)}`, check: checkNoteDimensions }, storage, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record).toMatchObject({ width: 800, height: 600, widths: [640, 800] });
    expect(result.record.key).toMatch(/^media\/notes\/[0-9a-f]{16}$/);
    expect([...storage.files.keys()].sort()).toEqual([`${result.record.key}-640.avif`, `${result.record.key}-640.jpg`, `${result.record.key}-800.avif`, `${result.record.key}-800.jpg`].sort());
  });

  it("refuses what the check refuses, writing nothing", async () => {
    const storage = memory();
    const result = await processImageWith(await png(1300, 400), { key: () => "k", check: checkNoteDimensions }, storage, now);
    expect(result).toEqual({ ok: false, reason: "The image is 1300×400; notes take ratios from 1:3 to 3:1." });
    expect(storage.files.size).toBe(0);
  });

  it("keeps processImage on the work rules and keys", async () => {
    const storage = memory();
    const result = await processImage(await png(1280, 800), { slug: "nebuu", imageId: "game" }, storage, now);
    expect(result.ok && result.record.key).toMatch(/^media\/work\/nebuu\/game-[0-9a-f]{8}$/);
  });
});
