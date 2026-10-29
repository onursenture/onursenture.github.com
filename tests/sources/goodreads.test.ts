import { describe, expect, it } from "vitest";
import {
  type Book,
  type Books,
  bookKey,
  booksSchema,
  goodreads,
  mergeBooks,
  parseProfile,
  parseYearInBooks,
  profileDate,
  yearsToFetch,
} from "@/lib/sources/goodreads";
import { fakeFetch, fixture } from "../helpers/fixtures";

const snapshot = (): Books => booksSchema.parse(JSON.parse(fixture("goodreads-snapshot.json")));
const NOW = new Date("2026-10-29T09:00:00.000Z");

const book = (title: string, fields: Partial<Book> = {}): Book => ({
  title,
  author: "Someone",
  cover: "",
  numRating: 0,
  review: "",
  link: `https://www.goodreads.com/review/show/${title.length}`,
  date: "2026-01-01T00:00:00.000Z",
  readAt: "",
  addedAt: "2026-01-01T00:00:00.000Z",
  ...fields,
});
const cover = (id: number) => `https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1600000000l/${id}._SY345_.jpg`;

describe("profileDate", () => {
  it("reads the profile's Istanbul time", () => {
    expect(profileDate("Aug 14, 2026 06:07AM")).toBe("2026-08-14T03:07:00.000Z");
    expect(profileDate("May 12, 2026 12:34PM")).toBe("2026-05-12T09:34:00.000Z");
    expect(profileDate("Jan 1, 2026 12:05AM")).toBe("2025-12-31T21:05:00.000Z");
  });

  it("returns empty for anything else", () => {
    expect(profileDate("yesterday")).toBe("");
  });
});

describe("parseProfile", () => {
  it("reads the shown currently-reading books and the shelf's real size", () => {
    const { visible, count } = parseProfile(fixture("goodreads-profile.html"));
    expect(count).toBe(4);
    expect(visible.map((b) => b.title)).toEqual([
      "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
      "Educated",
      "Mutluluğun Mimarisi",
    ]);
    expect(visible[0]).toMatchObject({
      author: "J.K. Rowling",
      cover: cover(58613224).replace("1600000000l", "1627042661l"),
      link: "https://www.goodreads.com/review/show/8221997918",
      addedAt: "2026-08-14T03:07:00.000Z",
      readAt: "",
    });
  });

  it("throws on a page without shelf counts (a sign-in page)", () => {
    expect(() => parseProfile("<html><title>Sign in</title></html>")).toThrow("no currently-reading shelf count");
  });

  it("accepts an empty shelf", () => {
    const html = '<a href="/review/list/1?shelf=currently-reading">currently-reading&lrm; (0)</a>';
    expect(parseProfile(html)).toEqual({ visible: [], count: 0 });
  });
});

describe("parseYearInBooks", () => {
  it("reads title, author, cover and book link of every cover", () => {
    const books = parseYearInBooks(fixture("goodreads-year-2026.html"));
    expect(books.map((b) => b.title).sort()).toEqual([
      "Bonsai",
      "Bozkır",
      "Hacı Komünist",
      "Joseph Müller-Brockman, Pioneer of Swiss Graphic Design",
    ]);
    const bonsai = books.find((b) => b.title === "Bonsai");
    expect(bonsai).toEqual({
      title: "Bonsai",
      author: "Alejandro Zambra",
      cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1320559832l/3374076.jpg",
      link: "https://www.goodreads.com/book/show/3374076-bonsai",
    });
  });

  it("returns nothing for a year with no books", () => {
    expect(parseYearInBooks("<html><head><title>Onur’s Year in Books</title></head></html>")).toEqual([]);
  });

  it("throws on any other page", () => {
    expect(() => parseYearInBooks("<html><head><title>Sign in</title></head></html>")).toThrow("unexpected title");
  });
});

describe("bookKey", () => {
  it("matches an RSS-era record and a page entry by the Goodreads book id", () => {
    const stored = snapshot().read.find((b) => b.title === "Hacı Komünist")!;
    const page = parseYearInBooks(fixture("goodreads-year-2026.html")).find((b) => b.title === "Hacı Komünist")!;
    expect(stored.link).toContain("/review/show/");
    expect(bookKey(stored)).toBe(bookKey(page));
    expect(bookKey(page)).toBe("id:9740107");
  });

  it("falls back to title and author without a cover", () => {
    expect(bookKey(book("Piranesi (Piranesi, #1)", { author: "Susanna Clarke", link: "" }))).toBe(
      "title:piranesi|susanna clarke",
    );
  });
});

describe("mergeBooks", () => {
  const profile = () => parseProfile(fixture("goodreads-profile.html"));
  const year = () => parseYearInBooks(fixture("goodreads-year-2026.html"));

  it("keeps every stored read book with its RSS-era fields", () => {
    const merged = mergeBooks({ profile: profile(), yearBooks: year(), previous: snapshot(), now: NOW });
    for (const stored of snapshot().read) expect(merged.read).toContainEqual(stored);
  });

  it("adds a book new to Year in Books as undated", () => {
    const merged = mergeBooks({ profile: profile(), yearBooks: year(), previous: snapshot(), now: NOW });
    expect(merged.read).toHaveLength(4);
    expect(merged.read.find((b) => b.title === "Bonsai")).toEqual({
      title: "Bonsai",
      author: "Alejandro Zambra",
      cover: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1320559832l/3374076.jpg",
      numRating: 0,
      review: "",
      link: "https://www.goodreads.com/book/show/3374076-bonsai",
      date: NOW.toISOString(),
      readAt: "",
      addedAt: NOW.toISOString(),
    });
  });

  it("dates a book finished since the last sync to this sync, keeping its stored record", () => {
    const reading = book("Finished", { cover: cover(42), addedAt: "2026-09-01T00:00:00.000Z", date: "2026-09-01T00:00:00.000Z" });
    const merged = mergeBooks({
      profile: { visible: [], count: 0 },
      yearBooks: [{ title: "Finished", author: "Someone", cover: cover(42), link: "https://www.goodreads.com/book/show/42" }],
      previous: { currentlyReading: [reading], read: [] },
      now: NOW,
    });
    expect(merged.currentlyReading).toEqual([]);
    expect(merged.read).toEqual([{ ...reading, readAt: NOW.toISOString(), date: NOW.toISOString() }]);
  });

  it("keeps the stored record of each shown book and fills the hidden rest of the shelf", () => {
    const merged = mergeBooks({ profile: profile(), yearBooks: year(), previous: snapshot(), now: NOW });
    const stored = snapshot().currentlyReading;
    // The profile shows three of four; the newest stored book it hides fills
    // the fourth place.
    expect(merged.currentlyReading).toEqual(stored.slice(0, 4));
  });

  it("doesn't fill past the shelf's size", () => {
    const merged = mergeBooks({ profile: { ...profile(), count: 3 }, yearBooks: [], previous: snapshot(), now: NOW });
    expect(merged.currentlyReading.map((b) => b.title)).toEqual([
      "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
      "Educated",
      "Mutluluğun Mimarisi",
    ]);
  });

  it("never fills the shelf with a book that has since been read", () => {
    const shown = book("Shown", { cover: cover(1) });
    const finished = book("Finished", { cover: cover(2), date: "2026-09-01T00:00:00.000Z" });
    const merged = mergeBooks({
      profile: { visible: [shown], count: 2 },
      yearBooks: [{ title: "Finished", author: "Someone", cover: cover(2), link: "https://www.goodreads.com/book/show/2" }],
      previous: { currentlyReading: [finished, shown], read: [book("Old", { cover: cover(3) })] },
      now: NOW,
    });
    expect(merged.currentlyReading.map((b) => b.title)).toEqual(["Shown"]);
  });

  it("dates a newly shown book by its profile date, or this sync without one", () => {
    const merged = mergeBooks({
      profile: { visible: [book("New", { cover: cover(7), date: "", addedAt: "" })], count: 1 },
      yearBooks: [],
      previous: null,
      now: NOW,
    });
    expect(merged.currentlyReading[0]).toMatchObject({ date: NOW.toISOString(), addedAt: NOW.toISOString() });
  });

  it("orders the read list newest first", () => {
    const merged = mergeBooks({ profile: profile(), yearBooks: year(), previous: snapshot(), now: NOW });
    expect(merged.read.map((b) => b.title)).toEqual([
      "Bonsai",
      "Joseph Müller-Brockman, Pioneer of Swiss Graphic Design",
      "Hacı Komünist",
      "Bozkır: Bir Yolculuk Hikâyesi",
    ]);
  });
});

describe("yearsToFetch", () => {
  it("reads this year, in Istanbul time", () => {
    expect(yearsToFetch(NOW)).toEqual([2026]);
    expect(yearsToFetch(new Date("2026-12-31T21:30:00.000Z"))).toEqual([2027, 2026]);
  });

  it("adds last year in January", () => {
    expect(yearsToFetch(new Date("2027-01-20T12:00:00.000Z"))).toEqual([2027, 2026]);
    expect(yearsToFetch(new Date("2027-02-01T12:00:00.000Z"))).toEqual([2027]);
  });
});

describe("goodreads.fetch", () => {
  const profileUrl = "https://www.goodreads.com/user/show/8143905";
  const yearUrl = "https://www.goodreads.com/user/year_in_books/2026/8143905";

  it("merges the profile and Year in Books into the stored snapshot", async () => {
    const fetch = fakeFetch({
      [profileUrl]: { body: fixture("goodreads-profile.html") },
      [yearUrl]: { body: fixture("goodreads-year-2026.html") },
    });
    const books = await goodreads.fetch({ fetch, env: {}, previous: snapshot(), now: NOW });
    expect(books.currentlyReading).toHaveLength(4);
    expect(books.read).toHaveLength(4);
  });

  it("throws when a page fails, so the stored snapshot is kept", async () => {
    const fetch = fakeFetch({ [profileUrl]: { body: fixture("goodreads-profile.html") } });
    await expect(goodreads.fetch({ fetch, env: {}, previous: snapshot(), now: NOW })).rejects.toThrow("404");
  });

  it("throws when nothing has been read, rather than store an empty shelf", async () => {
    const fetch = fakeFetch({
      [profileUrl]: { body: fixture("goodreads-profile.html") },
      [yearUrl]: { body: "<html><head><title>Onur’s Year in Books</title></head></html>" },
    });
    await expect(goodreads.fetch({ fetch, env: {}, previous: null, now: NOW })).rejects.toThrow(
      "goodreads read shelf returned no books",
    );
  });

  it("ignores a stored payload that doesn't validate", async () => {
    const fetch = fakeFetch({
      [profileUrl]: { body: fixture("goodreads-profile.html") },
      [yearUrl]: { body: fixture("goodreads-year-2026.html") },
    });
    const books = await goodreads.fetch({ fetch, env: {}, previous: { nope: true }, now: NOW });
    expect(books.read).toHaveLength(4);
    expect(books.read.every((b) => b.readAt === "")).toBe(true);
  });
});
