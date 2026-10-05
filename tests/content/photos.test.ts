import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));

const { adjacentPhotos } = await import("@/lib/content/photos");

describe("adjacentPhotos", () => {
  const photo = (slug: string) => ({ slug });
  const photos = [photo("newest"), photo("middle"), photo("oldest")];

  it("returns the newer photo as previous and the older one as next", () => {
    expect(adjacentPhotos(photos, "middle")).toEqual({ previous: photos[0], next: photos[2] });
  });

  it("has no previous at the start, no next at the end, nothing for unknown slugs", () => {
    expect(adjacentPhotos(photos, "newest")).toEqual({ previous: null, next: photos[1] });
    expect(adjacentPhotos(photos, "oldest")).toEqual({ previous: photos[1], next: null });
    expect(adjacentPhotos(photos, "nope")).toEqual({ previous: null, next: null });
  });
});
