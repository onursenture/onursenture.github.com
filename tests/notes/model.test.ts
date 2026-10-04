import { describe, expect, it } from "vitest";
import { graphemeCount, truncateGraphemes } from "@/lib/notes/graphemes";
import { publishIssues } from "@/lib/notes/rules";
import { noteContentSchema } from "@/lib/notes/schema";
import type { NoteContent } from "@/lib/notes/types";

const content = (patch: Partial<NoteContent> = {}): NoteContent => ({ text: "Hello.", side: "work", lang: "en", embed: null, ...patch });
const image = (alt = "A dog") => ({ key: "photos/kizilcikli", alt, width: 2560, height: 1600, widths: [640, 1280, 2560] });

describe("graphemeCount", () => {
  it("counts user-perceived characters, not code units", () => {
    expect(graphemeCount("👍🏽")).toBe(1);
    expect(graphemeCount("👨‍👩‍👧‍👦")).toBe(1);
    expect(graphemeCount("🇹🇷")).toBe(1);
    expect(graphemeCount("ğüşıöç")).toBe(6);
    expect(graphemeCount("é")).toBe(1);
    expect(graphemeCount("")).toBe(0);
  });

  it("truncates on grapheme boundaries with an ellipsis", () => {
    expect(truncateGraphemes("short", 10)).toBe("short");
    expect(truncateGraphemes("👍🏽👍🏽👍🏽", 2)).toBe("👍🏽👍🏽…");
    expect(truncateGraphemes("  two words  ", 4)).toBe("two…");
  });
});

describe("noteContentSchema", () => {
  it("accepts every attachment kind", () => {
    expect(noteContentSchema.safeParse(content()).success).toBe(true);
    expect(noteContentSchema.safeParse(content({ embed: { kind: "images", images: [image()] } })).success).toBe(true);
    expect(noteContentSchema.safeParse(content({ embed: { kind: "link", url: "https://w00f.org/", title: "", description: "", siteName: "" } })).success).toBe(true);
  });

  it("refuses an unknown side, lang or attachment, and more than 4 images", () => {
    expect(noteContentSchema.safeParse({ ...content(), side: "home" }).success).toBe(false);
    expect(noteContentSchema.safeParse({ ...content(), lang: "de" }).success).toBe(false);
    expect(noteContentSchema.safeParse({ ...content(), embed: { kind: "video" } }).success).toBe(false);
    expect(noteContentSchema.safeParse(content({ embed: { kind: "images", images: [image(), image(), image(), image(), image()] } })).success).toBe(false);
  });
});

describe("publishIssues", () => {
  it("passes a plain note", () => {
    expect(publishIssues(content())).toEqual([]);
  });

  it("refuses more than 300 graphemes, and counts emoji as one", () => {
    expect(publishIssues(content({ text: "👍🏽".repeat(300) }))).toEqual([]);
    expect(publishIssues(content({ text: "x".repeat(301) }))).toEqual([{ at: "text", message: "The text is 301 characters; the limit is 300." }]);
  });

  it("needs text unless there are images", () => {
    expect(publishIssues(content({ text: "  " }))).toEqual([{ at: "text", message: "Write something or add an image." }]);
    expect(publishIssues(content({ text: "", embed: { kind: "images", images: [image()] } }))).toEqual([]);
  });

  it("needs alt text on every image and at least one image", () => {
    expect(publishIssues(content({ embed: { kind: "images", images: [image(), image(" ")] } }))).toEqual([{ at: "embed/images/1/alt", message: "Image 2 needs alt text." }]);
    expect(publishIssues(content({ embed: { kind: "images", images: [] } }))).toEqual([{ at: "embed", message: "Add an image or remove the attachment." }]);
  });

  it("needs an http(s) link", () => {
    const link = (url: string) => content({ embed: { kind: "link", url, title: "", description: "", siteName: "" } });
    expect(publishIssues(link("https://w00f.org/"))).toEqual([]);
    expect(publishIssues(link("javascript:alert(1)"))).toEqual([{ at: "embed/url", message: "Use an http or https link." }]);
  });
});
