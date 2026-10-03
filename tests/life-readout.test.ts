import { describe, expect, it } from "vitest";
import { buildReadout, readoutText } from "@/lib/life/readout";

describe("buildReadout", () => {
  it("builds one line per source that has data, in readout order", () => {
    const lines = buildReadout({
      film: { title: "Love & Other Drugs", link: "https://letterboxd.com/x" },
      books: [{ title: "Educated", link: "https://goodreads.com/x" }],
      article: { title: "Taste for Makers", link: "https://paulgraham.com/x", domain: "paulgraham.com", minutes: 18 },
      photo: { title: "Night Boulevard", slug: "night-boulevard" },
      post: { title: "Hello", link: "https://w00f.org/hello" },
      contributions: { total: 2133, weeks: [{ days: [{ count: 1, date: "2026-01-04", level: 1 }] }] },
    });
    expect(lines.map(readoutText)).toEqual([
      "last watched: Love & Other Drugs",
      "reading: Educated",
      "saved: Taste for Makers · paulgraham.com · 18 min",
      "last photo: Night Boulevard",
      "writing: Hello",
      "contributions, last 12 months: 2,133",
    ]);
    expect(lines.find((l) => l.key === "photo")!.href).toBe("/life/photos/night-boulevard/");
  });

  it("omits a source with no data instead of faking a line", () => {
    const lines = buildReadout({ film: undefined, contributions: { total: 0, weeks: [] } });
    expect(lines).toEqual([]);
  });

  it("lists every book being read on one line, and no film rating", () => {
    const lines = buildReadout({
      film: { title: "Love & Other Drugs", link: "https://letterboxd.com/x" },
      books: [
        { title: "Book A", link: "https://goodreads.com/a" },
        { title: "Book B", link: "https://goodreads.com/b" },
        { title: "Book C", link: "https://goodreads.com/c" },
      ],
    });
    expect(lines.map(readoutText)).toEqual(["last watched: Love & Other Drugs", "reading: Book A, Book B, Book C"]);
    const reading = lines.find((l) => l.key === "books")!;
    expect(reading.href).toBeUndefined();
    expect(reading.detail).toBeUndefined();
  });

  it("drops the reading line when no book is being read", () => {
    expect(buildReadout({ books: [] })).toEqual([]);
  });
});
