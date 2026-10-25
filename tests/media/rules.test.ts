import { describe, expect, it } from "vitest";
import { checkDimensions, checkType, isHeic } from "@/lib/media/rules";

describe("upload rules", () => {
  it("accept 16:10 within 1% from 1280px wide", () => {
    expect(checkDimensions(2560, 1600)).toBeNull();
    expect(checkDimensions(1280, 800)).toBeNull();
    expect(checkDimensions(2560, 1590)).toBeNull();
  });
  it("reject other ratios and small images with the reason", () => {
    expect(checkDimensions(1600, 1200)).toBe("The image is 1600×1200; it must be 16:10, for example 2560×1600.");
    expect(checkDimensions(1000, 625)).toBe("The image is 1000px wide; it needs at least 1280px.");
  });
  it("accept PNG and JPEG only on the server, and name HEIC in the hint", () => {
    expect(checkType("image/png")).toBeNull();
    expect(checkType("image/jpeg")).toBeNull();
    expect(checkType("image/heic")).toBe("Use a PNG, JPEG or HEIC.");
    expect(checkType("image/gif")).toBe("Use a PNG, JPEG or HEIC.");
  });
  it("spot HEIC by type, or by extension when Chrome reports no type", () => {
    expect(isHeic({ name: "IMG_0001.HEIC", type: "image/heic" })).toBe(true);
    expect(isHeic({ name: "photo", type: "image/heif" })).toBe(true);
    expect(isHeic({ name: "IMG_0001.HEIC", type: "" })).toBe(true);
    expect(isHeic({ name: "scan.heif", type: "application/octet-stream" })).toBe(true);
    expect(isHeic({ name: "IMG_0001.jpg", type: "image/jpeg" })).toBe(false);
    expect(isHeic({ name: "heic.png", type: "image/png" })).toBe(false);
  });
});
