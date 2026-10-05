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

  it("puts last play right after last watched", () => {
    const lines = buildReadout({
      film: { title: "Pickled", link: "https://letterboxd.com/onur/film/pickled/" },
      play: { title: "Adel Seni Seçti", link: "https://tiyatrolar.com.tr/tiyatro/adel-seni-secti-1" },
      photo: { title: "Stabilo", slug: "stabilo" },
    });
    expect(lines.map((l) => l.key)).toEqual(["film", "play", "photo"]);
    expect(lines[1]).toEqual({ key: "play", label: "last play", value: "Adel Seni Seçti", href: "https://tiyatrolar.com.tr/tiyatro/adel-seni-secti-1" });
  });

  it("adds the latest Life note on one line, after the photo", () => {
    const lines = buildReadout({
      photo: { title: "Night Boulevard", slug: "night-boulevard" },
      note: { text: "Yui found the sun\nagain.", href: "/life/notes/3m2k7xq4ab2c2/" },
      post: { title: "Hello", link: "https://w00f.org/hello" },
    });
    expect(lines.map(readoutText)).toEqual(["last photo: Night Boulevard", "note: Yui found the sun again.", "writing: Hello"]);
    expect(lines.find((l) => l.key === "note")!.href).toBe("/life/notes/3m2k7xq4ab2c2/");
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
