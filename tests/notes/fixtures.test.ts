import { describe, expect, it } from "vitest";
import { fixtureNotes } from "@/lib/notes/fixtures";
import { publishIssues } from "@/lib/notes/rules";
import { TID_PATTERN } from "@/lib/notes/tid";
import { groupByYear, onSide } from "@/lib/notes/views";

describe("fixtureNotes", () => {
  const notes = fixtureNotes();

  it("are valid published notes with unique TIDs, newest first", () => {
    for (const note of notes) {
      expect(publishIssues(note)).toEqual([]);
      expect(note.tid).toMatch(TID_PATTERN);
    }
    expect(new Set(notes.map((n) => n.tid)).size).toBe(notes.length);
    const dates = notes.map((n) => n.publishedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("cover two Work pages, two years, both sides, images, a link card and Turkish", () => {
    const work = onSide(notes, "work");
    expect(work.length).toBeGreaterThan(30);
    expect(groupByYear(work).map((g) => g.year)).toEqual(["2026", "2025"]);
    expect(onSide(notes, "life").length).toBeGreaterThanOrEqual(3);
    expect(notes.some((n) => n.embed?.kind === "images" && n.embed.images.length === 2)).toBe(true);
    expect(notes.some((n) => n.embed?.kind === "link")).toBe(true);
    expect(notes.some((n) => n.lang === "tr")).toBe(true);
  });
});
