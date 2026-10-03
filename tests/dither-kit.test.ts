import { describe, expect, it } from "vitest";
import { PALETTE, seedOfColor } from "@/components/dither-kit/palette";
import { fillOf } from "@/components/dither-kit/pixel";

describe("Dither Kit colour inputs", () => {
  it("keeps the named palette", () => {
    expect(seedOfColor("blue")).toEqual(PALETTE.blue);
    expect(fillOf("blue")).toEqual(PALETTE.blue.fill);
  });

  it("accepts a raw rgb tuple as a fill", () => {
    expect(fillOf([47, 85, 245])).toEqual([47, 85, 245]);
  });

  it("derives a seed from a raw rgb tuple: line and star lighten toward white", () => {
    const seed = seedOfColor([47, 85, 245]);
    expect(seed.fill).toEqual([47, 85, 245]);
    expect(seed.line[0]).toBeGreaterThan(47);
    expect(seed.star[0]).toBeGreaterThan(seed.line[0]);
    for (const channel of [...seed.line, ...seed.star]) expect(channel).toBeLessThanOrEqual(255);
  });

  it("still treats a number as a hue", () => {
    expect(fillOf(228)).toHaveLength(3);
  });
});
