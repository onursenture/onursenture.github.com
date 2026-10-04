import { RichText } from "@atproto/api";
import { describe, expect, it } from "vitest";
import { noteSegments } from "@/lib/notes/facets";
import { graphemeCount } from "@/lib/notes/graphemes";

describe("noteSegments", () => {
  it("links URLs, including bare domains with a real TLD, but not file names", () => {
    expect(noteSegments("See onursenture.com/resume/ and https://w00f.org/x. notes.ts stays text.")).toEqual([
      { kind: "text", text: "See " },
      { kind: "link", text: "onursenture.com/resume/", href: "https://onursenture.com/resume/" },
      { kind: "text", text: " and " },
      { kind: "link", text: "https://w00f.org/x", href: "https://w00f.org/x" },
      { kind: "text", text: ". notes.ts stays text." },
    ]);
  });

  it("finds dotted @handles and #tags, not bare @names or numeric tags", () => {
    expect(noteSegments("ping @w00f.org and @w00f #atproto #2026")).toEqual([
      { kind: "text", text: "ping " },
      { kind: "mention", text: "@w00f.org", handle: "w00f.org" },
      { kind: "text", text: " and @w00f " },
      { kind: "tag", text: "#atproto", tag: "atproto" },
      { kind: "text", text: " #2026" },
    ]);
  });

  it("returns one text segment for plain text, and nothing for empty text", () => {
    expect(noteSegments("Just text.")).toEqual([{ kind: "text", text: "Just text." }]);
    expect(noteSegments("")).toEqual([]);
  });
});

describe("grapheme parity with Bluesky", () => {
  it.each(["👍🏽 👨‍👩‍👧‍👦 🇹🇷", "ğüşıöç é", "plain ascii", "é́", "日本語のテキスト", "tab\tand\nnewline"])("%s", (text) => {
    expect(graphemeCount(text)).toBe(new RichText({ text }).graphemeLength);
  });
});
