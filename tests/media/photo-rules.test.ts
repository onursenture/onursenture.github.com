import { describe, expect, it } from "vitest";
import { checkPhotoDimensions } from "@/lib/media/rules";

describe("checkPhotoDimensions", () => {
  it("takes any ratio with at least 1280px on the long side", () => {
    expect(checkPhotoDimensions(1280, 300)).toBeNull();
    expect(checkPhotoDimensions(960, 1280)).toBeNull();
    expect(checkPhotoDimensions(4032, 3024)).toBeNull();
  });

  it("names the size and the rule when it is too small", () => {
    expect(checkPhotoDimensions(800, 600)).toBe("The image is 800×600; photos need at least 1280px on the long side.");
  });
});
