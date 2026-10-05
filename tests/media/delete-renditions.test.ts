import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const del = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@vercel/blob", () => ({ del, put: vi.fn() }));

import { BlobMediaStorage, LocalMediaStorage, renditionNames } from "@/lib/media/storage";

beforeEach(() => del.mockClear());

describe("renditionNames", () => {
  it("lists every width as AVIF and JPEG", () => {
    expect(renditionNames("media/photos/a", [640, 1280])).toEqual(["media/photos/a-640.avif", "media/photos/a-640.jpg", "media/photos/a-1280.avif", "media/photos/a-1280.jpg"]);
  });
});

describe("LocalMediaStorage.deleteRenditions", () => {
  it("removes the files and ignores ones already gone", async () => {
    const storage = new LocalMediaStorage(mkdtempSync(join(tmpdir(), "media-")));
    const baseUrl = (await storage.putFile("media/photos/a-640.jpg", Buffer.from("x"), "image/jpeg")).slice(0, -"-640.jpg".length);
    await storage.deleteRenditions({ key: "media/photos/a", widths: [640], baseUrl });
    expect(existsSync(storage.resolveLocal("media/photos/a-640.jpg")!)).toBe(false);
  });

  it("never touches a repo image (no baseUrl) or a key outside media/", async () => {
    const storage = new LocalMediaStorage(mkdtempSync(join(tmpdir(), "media-")));
    await storage.putFile("photos/x-640.jpg", Buffer.from("x"), "image/jpeg");
    await storage.deleteRenditions({ key: "photos/x", widths: [640] });
    await storage.deleteRenditions({ key: "photos/x", widths: [640], baseUrl: "/api/media-dev/photos/x" });
    expect(existsSync(storage.resolveLocal("photos/x-640.jpg")!)).toBe(true);
  });
});

describe("BlobMediaStorage.deleteRenditions", () => {
  it("deletes every rendition URL in one call", async () => {
    const baseUrl = "https://b.public.blob.vercel-storage.com/media/photos/a";
    await new BlobMediaStorage().deleteRenditions({ key: "media/photos/a", widths: [640, 1280], baseUrl });
    expect(del).toHaveBeenCalledWith([`${baseUrl}-640.avif`, `${baseUrl}-640.jpg`, `${baseUrl}-1280.avif`, `${baseUrl}-1280.jpg`]);
  });

  it("skips images that are not in Blob", async () => {
    await new BlobMediaStorage().deleteRenditions({ key: "photos/x", widths: [640] });
    await new BlobMediaStorage().deleteRenditions({ key: "media/photos/a", widths: [640], baseUrl: "https://evil.test/media/photos/a" });
    expect(del).not.toHaveBeenCalled();
  });
});
