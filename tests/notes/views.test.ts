import { describe, expect, it } from "vitest";
import { tidFromTime } from "@/lib/notes/tid";
import type { NoteSide, PublishedNote } from "@/lib/notes/types";
import {
  NOTES_PAGE_SIZE,
  adjacentNotes,
  canonicalPath,
  frameRatio,
  groupByYear,
  noteTitle,
  notePathOn,
  onSide,
  pageCount,
  pageOf,
  pagePath,
  parsePage,
} from "@/lib/notes/views";

function note(at: string, side: NoteSide = "work", text = "Note."): PublishedNote {
  return {
    id: at,
    tid: tidFromTime(Date.parse(at)),
    text,
    side,
    lang: "en",
    embed: null,
    status: "published",
    publishAt: null,
    publishedAt: at,
    createdAt: at,
    updatedAt: at,
  };
}

describe("sides and paths", () => {
  const work = note("2026-10-04T10:00:00.000Z", "work");
  const life = note("2026-10-03T10:00:00.000Z", "life");
  const both = note("2026-10-02T10:00:00.000Z", "both");

  it("puts both-side notes on each side", () => {
    expect(onSide([work, life, both], "work")).toEqual([work, both]);
    expect(onSide([work, life, both], "life")).toEqual([life, both]);
  });

  it("links on the side you are on, with a canonical side per note", () => {
    expect(notePathOn(both, "life")).toBe(`/life/notes/${both.tid}/`);
    expect(canonicalPath(both)).toBe(`/notes/${both.tid}/`);
    expect(canonicalPath(life)).toBe(`/life/notes/${life.tid}/`);
    expect(pagePath("work", 1)).toBe("/notes/");
    expect(pagePath("life", 3)).toBe("/life/notes/page/3/");
  });
});

describe("pages", () => {
  const many = Array.from({ length: NOTES_PAGE_SIZE + 3 }, (_, i) => note(new Date(Date.UTC(2026, 0, 31 - i)).toISOString()));

  it("splits into pages of 30 and refuses out-of-range pages", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(many.length)).toBe(2);
    expect(pageOf(many, 1)?.items).toHaveLength(30);
    expect(pageOf(many, 2)).toMatchObject({ page: 2, pages: 2 });
    expect(pageOf(many, 2)?.items).toHaveLength(3);
    expect(pageOf(many, 3)).toBeNull();
    expect(pageOf([], 1)).toEqual({ items: [], page: 1, pages: 1 });
  });

  it("parses only positive integers", () => {
    expect(parsePage("2")).toBe(2);
    expect(parsePage("02")).toBeNull();
    expect(parsePage("0")).toBeNull();
    expect(parsePage("x")).toBeNull();
  });
});

describe("years, neighbours, titles and frames", () => {
  it("groups by the Istanbul year, newest first", () => {
    // 22:30 UTC on Dec 31 is already Jan 1 in Istanbul.
    const notes = [note("2026-02-01T10:00:00.000Z"), note("2025-12-31T22:30:00.000Z"), note("2025-06-01T10:00:00.000Z")];
    expect(groupByYear(notes).map((g) => [g.year, g.notes.length])).toEqual([
      ["2026", 2],
      ["2025", 1],
    ]);
  });

  it("finds the newer and older neighbour", () => {
    const [a, b, c] = [note("2026-03-01T00:00:00.000Z"), note("2026-02-01T00:00:00.000Z"), note("2026-01-01T00:00:00.000Z")];
    expect(adjacentNotes([a, b, c], b.tid)).toEqual({ newer: a, older: c });
    expect(adjacentNotes([a, b, c], a.tid)).toEqual({ newer: null, older: b });
  });

  it("titles a note by its first 60 graphemes, or 'Note'", () => {
    expect(noteTitle(note("2026-01-01T00:00:00.000Z", "work", "Short\nnote."))).toBe("Short note.");
    expect(noteTitle(note("2026-01-01T00:00:00.000Z", "work", "x".repeat(80)))).toBe(`${"x".repeat(60)}…`);
    expect(noteTitle(note("2026-01-01T00:00:00.000Z", "work", ""))).toBe("Note");
  });

  it("clamps list frames between 4:5 and 2:1", () => {
    expect(frameRatio(1600, 1000)).toBe(1.6);
    expect(frameRatio(1000, 3000)).toBe(0.8);
    expect(frameRatio(3000, 1000)).toBe(2);
  });
});
