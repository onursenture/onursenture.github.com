import { describe, expect, it } from "vitest";
import { formatRating } from "@/lib/sources/rating";

describe("formatRating", () => {
  it("renders the number, dropping a trailing .0", () => {
    expect(formatRating(3.5)).toBe("3.5");
    expect(formatRating(4)).toBe("4");
    expect(formatRating(4.0)).toBe("4");
    expect(formatRating(0.5)).toBe("0.5");
    expect(formatRating(5)).toBe("5");
  });

  it("is empty when unrated", () => {
    expect(formatRating(null)).toBe("");
    expect(formatRating(0)).toBe("");
    expect(formatRating(Number.NaN)).toBe("");
    expect(formatRating(-1)).toBe("");
  });

  it("never produces star glyphs", () => {
    for (const value of [0.5, 1, 2.5, 3.5, 5]) expect(formatRating(value)).not.toMatch(/[★½]/);
  });
});
