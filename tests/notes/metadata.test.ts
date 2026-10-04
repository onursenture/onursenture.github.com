import { describe, expect, it } from "vitest";
import { noteMetadata } from "@/lib/notes/metadata";
import type { PublishedNote } from "@/lib/notes/types";

const base: PublishedNote = {
  id: "a",
  tid: "3m2k7xq4ab2c2",
  text: "Notes editor, first pass.",
  side: "both",
  lang: "en",
  embed: null,
  status: "published",
  publishAt: null,
  publishedAt: "2026-10-03T11:15:00.000Z",
  createdAt: "2026-10-03T11:15:00.000Z",
  updatedAt: "2026-10-03T11:15:00.000Z",
};

describe("noteMetadata", () => {
  it("titles the page by the note and points the canonical URL at its side", () => {
    const meta = noteMetadata(base);
    expect(meta.title).toBe("Notes editor, first pass. · Notes");
    expect(meta.description).toBe("Notes editor, first pass.");
    expect(meta.alternates).toEqual({ canonical: "/notes/3m2k7xq4ab2c2/" });
    expect(meta.twitter).toMatchObject({ card: "summary" });
    expect(meta.openGraph).not.toHaveProperty("images");
  });

  it("uses the first image's largest JPEG as a large card", () => {
    const meta = noteMetadata({
      ...base,
      side: "life",
      embed: { kind: "images", images: [{ key: "media/notes/abc", alt: "The editor", width: 2560, height: 1600, widths: [640, 1280, 2560], baseUrl: "https://x.public.blob.vercel-storage.com/media/notes/abc" }] },
    });
    expect(meta.alternates).toEqual({ canonical: "/life/notes/3m2k7xq4ab2c2/" });
    expect(meta.openGraph).toMatchObject({ images: [{ url: "https://x.public.blob.vercel-storage.com/media/notes/abc-2560.jpg", width: 2560, height: 1600, alt: "The editor" }] });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });
});
