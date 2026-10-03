import { describe, expect, it } from "vitest";
import { stars } from "@/lib/sources/stars";

describe("stars", () => {
  it("renders whole and half stars from the numeric rating", () => {
    expect(stars(3.5)).toBe("★★★½");
    expect(stars(4)).toBe("★★★★");
    expect(stars(0.5)).toBe("½");
    expect(stars(5)).toBe("★★★★★");
  });

  it("is empty when unrated and caps at five", () => {
    expect(stars(null)).toBe("");
    expect(stars(0)).toBe("");
    expect(stars(Number.NaN)).toBe("");
    expect(stars(7)).toBe("★★★★★");
  });
});
