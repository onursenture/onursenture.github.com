import { describe, expect, it } from "vitest";
import { publishIssues } from "@/lib/photos/rules";
import { photoContentSchema, photoExifSchema, photoImageSchema } from "@/lib/photos/schema";
import { bySiteOrder, isPublishedPhoto, photoAlt, photoDay } from "@/lib/photos/types";

const content = { title: "Stabilo", alt: "", takenAt: "2026-04-11T12:00:00", camera: "iPhone 17" };

describe("photoContentSchema", () => {
  it("accepts a valid content and strips unknown keys", () => {
    expect(photoContentSchema.parse({ ...content, slug: "x" })).toEqual(content);
  });

  it("refuses an invalid date with a readable message", () => {
    const result = photoContentSchema.safeParse({ ...content, takenAt: "2026-02-30T00:00:00" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Use a valid date.");
  });
});

describe("photoImageSchema and photoExifSchema", () => {
  it("parse what an upload stores", () => {
    const image = { key: "media/photos/abc", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "https://b.public.blob.vercel-storage.com/media/photos/abc" };
    expect(photoImageSchema.parse(image)).toEqual(image);
    expect(photoExifSchema.parse({ takenAt: null, camera: null })).toEqual({ takenAt: null, camera: null });
    expect(photoExifSchema.safeParse({ takenAt: "yesterday", camera: null }).success).toBe(false);
  });
});

describe("publishIssues", () => {
  it("needs a title", () => {
    expect(publishIssues(content)).toEqual([]);
    expect(publishIssues({ ...content, title: "  " })).toEqual([{ at: "title", message: "Add a title." }]);
  });
});

describe("photo helpers", () => {
  it("photoDay is the date part; photoAlt falls back to the title", () => {
    expect(photoDay(content)).toBe("2026-04-11");
    expect(photoAlt(content)).toBe("Stabilo");
    expect(photoAlt({ ...content, alt: " A pen " })).toBe("A pen");
  });

  it("bySiteOrder is newest taken first, then id descending", () => {
    const a = { id: "a", takenAt: "2026-04-11T12:00:00" };
    const b = { id: "b", takenAt: "2026-04-11T12:00:00" };
    const c = { id: "c", takenAt: "2026-08-17T18:42:10" };
    expect([a, b, c].sort(bySiteOrder).map((p) => p.id)).toEqual(["c", "b", "a"]);
  });

  it("isPublishedPhoto needs a slug and a publish time", () => {
    const base = { ...content, id: "1", image: { key: "k", width: 1, height: 1, widths: [1] }, exif: { takenAt: null, camera: null }, createdAt: "x", updatedAt: "x" };
    expect(isPublishedPhoto({ ...base, slug: "s", status: "published", publishedAt: "2026-01-01T00:00:00.000Z" })).toBe(true);
    expect(isPublishedPhoto({ ...base, slug: null, status: "draft", publishedAt: null })).toBe(false);
  });
});
