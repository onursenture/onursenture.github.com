import { describe, expect, it } from "vitest";
import { checkDimensions, checkType } from "@/lib/media/rules";

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
  it("accept PNG and JPEG only", () => {
    expect(checkType("image/png")).toBeNull();
    expect(checkType("image/jpeg")).toBeNull();
    expect(checkType("image/gif")).toBe("Use a PNG or JPEG.");
  });
});
