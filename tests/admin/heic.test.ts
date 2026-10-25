import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// heic-to needs a browser (a Worker and a canvas), so it is mocked: what is
// under test is which files go through it and what comes back. The real
// decode runs in the admin e2e (e2e-admin/photos.spec.ts, editor.spec.ts).
const heicTo = vi.hoisted(() => vi.fn());
vi.mock("heic-to", () => ({ heicTo }));

import { HEIC_FAILED, decodeImage, heicToJpeg } from "@/components/admin/heic";

const heicBytes = readFileSync("tests/fixtures/photos/wide.heic");
const heic = (name: string, type: string) => new File([heicBytes], name, { type });
const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff])], "IMG_0001.jpg", { type: "image/jpeg" });

const bitmap = { width: 1280, height: 800, close() {} } as ImageBitmap;
const createImageBitmap = vi.fn(async () => bitmap);

beforeEach(() => {
  heicTo.mockReset();
  createImageBitmap.mockClear();
  vi.stubGlobal("createImageBitmap", createImageBitmap);
});
afterEach(() => vi.unstubAllGlobals());

describe("heicToJpeg", () => {
  it("turns a HEIC into a JPEG named after it", async () => {
    heicTo.mockResolvedValue(new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }));
    const file = heic("IMG_0001.HEIC", "image/heic");
    const converted = await heicToJpeg(file);
    expect(heicTo).toHaveBeenCalledWith({ blob: file, type: "image/jpeg", quality: 0.92 });
    expect(converted).toBeInstanceOf(File);
    expect((converted as File).type).toBe("image/jpeg");
    expect((converted as File).name).toBe("IMG_0001.jpg");
  });

  it("spots a HEIC Chrome reports without a type", async () => {
    heicTo.mockResolvedValue(new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }));
    expect(await heicToJpeg(heic("IMG_0001.heic", ""))).toMatchObject({ type: "image/jpeg" });
    expect(heicTo).toHaveBeenCalledOnce();
  });

  it("leaves a JPEG or PNG as it is, without loading heic-to", async () => {
    expect(await heicToJpeg(jpeg)).toBe(jpeg);
    expect(heicTo).not.toHaveBeenCalled();
  });

  it("says so when the HEIC can't be decoded", async () => {
    heicTo.mockRejectedValue("HEIF image not found");
    expect(await heicToJpeg(heic("broken.heic", "image/heic"))).toBe(HEIC_FAILED);
  });
});

describe("decodeImage", () => {
  it("decodes a HEIC with heic-to, which applies its rotation", async () => {
    heicTo.mockResolvedValue(bitmap);
    const file = heic("IMG_0001.HEIC", "");
    expect(await decodeImage(file)).toBe(bitmap);
    expect(heicTo).toHaveBeenCalledWith({ blob: file, type: "bitmap" });
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it("leaves everything else to the browser", async () => {
    expect(await decodeImage(jpeg)).toBe(bitmap);
    expect(createImageBitmap).toHaveBeenCalledWith(jpeg);
    expect(heicTo).not.toHaveBeenCalled();
  });
});
