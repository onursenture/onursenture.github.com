import { describe, expect, it, vi } from "vitest";

// next/cache only works inside Next; loadPhotos and parsePhoto don't need it.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

const { loadPhotos, parsePhoto } = await import("@/lib/content/photos");
const { hasImage } = await import("@/lib/images/manifest");

describe("parsePhoto", () => {
  it("normalizes YAML dates and keeps optional fields", () => {
    const photo = parsePhoto(
      "x",
      "---\ntitle: X\ndate: 2026-02-10\nimage: photos/x\ncamera: iPhone 17\n---\n",
    );
    expect(photo).toEqual({
      slug: "x",
      title: "X",
      date: "2026-02-10",
      image: "photos/x",
      camera: "iPhone 17",
    });
  });

  it("names the file when frontmatter is invalid", () => {
    expect(() => parsePhoto("bad", "---\ntitle: Bad\n---\n")).toThrow("content/photos/bad.mdx");
  });
});

describe("content/photos", () => {
  it("loads newest first and every image exists in the manifest", async () => {
    const photos = await loadPhotos();
    expect(photos.length).toBeGreaterThan(0);
    const dates = photos.map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
    for (const photo of photos) {
      expect(hasImage(photo.image), `${photo.slug} → ${photo.image}`).toBe(true);
    }
  });
});
