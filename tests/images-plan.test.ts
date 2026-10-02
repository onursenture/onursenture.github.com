import { describe, expect, it } from "vitest";
import { IMAGE_SETTINGS, isUpToDate, renditionUrl, srcSet, widthsFor } from "@/lib/images/plan";

describe("widthsFor", () => {
  it("generates every target for large sources", () => {
    expect(widthsFor(4032)).toEqual([640, 1280, 2560]);
    expect(widthsFor(2560)).toEqual([640, 1280, 2560]);
  });

  it("adds the source width instead of upscaling", () => {
    expect(widthsFor(1800)).toEqual([640, 1280, 1800]);
    expect(widthsFor(500)).toEqual([500]);
  });

  it("does not duplicate a source width equal to a target", () => {
    expect(widthsFor(1280)).toEqual([640, 1280]);
  });
});

describe("srcSet", () => {
  it("lists every rendition with its width descriptor", () => {
    const entry = { width: 1800, height: 1200, widths: [640, 1280, 1800] };
    expect(srcSet("photos/x", entry, "avif")).toBe(
      "/images/photos/x-640.avif 640w, /images/photos/x-1280.avif 1280w, /images/photos/x-1800.avif 1800w",
    );
    expect(renditionUrl("photos/x", 640, "jpg")).toBe("/images/photos/x-640.jpg");
  });
});

describe("isUpToDate", () => {
  const hash = "abc123";
  const otherHash = "def456";

  it("returns false when there is no previous entry", () => {
    expect(isUpToDate(undefined, hash, IMAGE_SETTINGS, true)).toBe(false);
  });

  it("returns false when the source hash differs", () => {
    const previous = { width: 100, height: 100, widths: [640], sourceHash: otherHash, settings: IMAGE_SETTINGS };
    expect(isUpToDate(previous, hash, IMAGE_SETTINGS, true)).toBe(false);
  });

  it("returns false when the settings differ", () => {
    const previous = { width: 100, height: 100, widths: [640], sourceHash: hash, settings: "v0 old settings" };
    expect(isUpToDate(previous, hash, IMAGE_SETTINGS, true)).toBe(false);
  });

  it("returns false when outputs do not exist", () => {
    const previous = { width: 100, height: 100, widths: [640], sourceHash: hash, settings: IMAGE_SETTINGS };
    expect(isUpToDate(previous, hash, IMAGE_SETTINGS, false)).toBe(false);
  });

  it("returns true when hash, settings, and outputs all match", () => {
    const previous = { width: 100, height: 100, widths: [640], sourceHash: hash, settings: IMAGE_SETTINGS };
    expect(isUpToDate(previous, hash, IMAGE_SETTINGS, true)).toBe(true);
  });
});
