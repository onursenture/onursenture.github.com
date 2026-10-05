import { describe, expect, it } from "vitest";
import { PLACEHOLDER_PHOTO_SLUG, freeSlug, slugify } from "@/lib/photos/slug";

describe("slugify", () => {
  it("keeps the slugs the repo photos already have", () => {
    expect(slugify("Bold, Vakıf Building")).toBe("bold-vakif-building");
    expect(slugify("Kızılcıklı")).toBe("kizilcikli");
    expect(slugify("Bazı kötü alışkanlıkların politik tarihi")).toBe("bazi-kotu-aliskanliklarin-politik-tarihi");
    expect(slugify("Night Boulevard")).toBe("night-boulevard");
  });

  it("transliterates every Turkish letter, upper case included", () => {
    expect(slugify("Çğıİöşü ÇĞIÖŞÜ")).toBe("cgiiosu-cgiosu");
  });

  it("drops other accents and collapses everything else to single dashes", () => {
    expect(slugify("  Café — Crème brûlée!! ")).toBe("cafe-creme-brulee");
    expect(slugify("a/b\\c")).toBe("a-b-c");
  });

  it("falls back to photo when nothing is left", () => {
    expect(slugify("🌅🌅")).toBe("photo");
    expect(slugify("---")).toBe("photo");
  });

  it("caps the slug at 80 characters without a trailing dash", () => {
    const slug = slugify(`${"a".repeat(79)} b`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("never makes the placeholder", () => {
    expect(slugify("_")).not.toBe(PLACEHOLDER_PHOTO_SLUG);
  });
});

describe("freeSlug", () => {
  it("adds -2, -3 … on a collision", () => {
    expect(freeSlug("Stabilo", [])).toBe("stabilo");
    expect(freeSlug("Stabilo", ["stabilo"])).toBe("stabilo-2");
    expect(freeSlug("Stabilo", ["stabilo", "stabilo-2"])).toBe("stabilo-3");
  });
});
