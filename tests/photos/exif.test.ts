import { readFileSync } from "node:fs";
import exifr from "exifr";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { EXIF_TAGS, cameraFrom, readExif, takenAtFrom } from "@/lib/photos/exif";

const heic = readFileSync("tests/fixtures/photos/exif.heic");
const jpeg = readFileSync("tests/fixtures/photos/exif-gps.jpg");

describe("takenAtFrom", () => {
  it("turns EXIF's date shape into wall-clock text", () => {
    expect(takenAtFrom("2026:08:17 18:42:10")).toBe("2026-08-17T18:42:10");
    expect(takenAtFrom("2026-08-17T18:42:10")).toBe("2026-08-17T18:42:10");
  });

  it("refuses blanks, zeros and other types", () => {
    expect(takenAtFrom("0000:00:00 00:00:00")).toBeNull();
    expect(takenAtFrom("    :  :     :  :  ")).toBeNull();
    expect(takenAtFrom(new Date())).toBeNull();
    expect(takenAtFrom(undefined)).toBeNull();
  });
});

describe("cameraFrom", () => {
  it("names cameras the way people say them", () => {
    expect(cameraFrom("Apple", "iPhone 17 Pro")).toBe("iPhone 17 Pro");
    expect(cameraFrom("FUJIFILM", "X100VI")).toBe("Fujifilm X100VI");
    expect(cameraFrom("Canon", "Canon EOS R5")).toBe("Canon EOS R5");
    expect(cameraFrom("NIKON CORPORATION", "NIKON Z 6")).toBe("NIKON Z 6");
    expect(cameraFrom("SONY", "ILCE-7M4")).toBe("Sony ILCE-7M4");
    expect(cameraFrom(undefined, "Pixel 9")).toBe("Pixel 9");
  });

  it("has no camera without a model", () => {
    expect(cameraFrom("Apple", undefined)).toBeNull();
    expect(cameraFrom(undefined, "  ")).toBeNull();
  });
});

describe("readExif", () => {
  it("reads an iPhone HEIC", async () => {
    expect(await readExif(heic)).toEqual({ takenAt: "2026-10-04T18:22:05", camera: "iPhone 17 Pro" });
  });

  it("reads a JPEG", async () => {
    expect(await readExif(jpeg)).toEqual({ takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" });
  });

  it("never parses GPS, although both fixtures carry it", async () => {
    expect((await exifr.gps(jpeg))?.latitude).toBe(41);
    const tags = await exifr.parse(jpeg, { pick: EXIF_TAGS, reviveValues: false });
    expect(Object.keys(tags).sort()).toEqual(["DateTimeOriginal", "Make", "Model"]);
  });

  it("gives no EXIF for a file without it or a file it can't read", async () => {
    const plain = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#ffffff" } }).jpeg().toBuffer();
    expect(await readExif(plain)).toEqual({ takenAt: null, camera: null });
    expect(await readExif(Buffer.from("not an image"))).toEqual({ takenAt: null, camera: null });
  });
});
