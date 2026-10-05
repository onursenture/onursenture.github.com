import { describe, expect, it } from "vitest";
import { fixturePhotos } from "@/lib/photos/fixtures";
import { isPublishedPhoto, photoAlt } from "@/lib/photos/types";

describe("fixturePhotos", () => {
  it("are three published photos, newest taken first, at three ratios", () => {
    const photos = fixturePhotos();
    expect(photos.map((p) => p.slug)).toEqual(["night-boulevard", "kizilcikli", "stabilo"]);
    expect(photos.every(isPublishedPhoto)).toBe(true);
    expect(photos.map((p) => [p.image.width, p.image.height])).toEqual([
      [2560, 1440],
      [2560, 1707],
      [1600, 2000],
    ]);
  });

  it("only Kızılcıklı has its own alt text", () => {
    expect(fixturePhotos().map(photoAlt)).toEqual(["Night Boulevard", "Evening light over a hillside village", "Stabilo"]);
  });
});
