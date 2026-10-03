import { describe, expect, it } from "vitest";
import { goodreads, parseGoodreadsShelf } from "@/lib/sources/goodreads";
import { fakeFetch, fixture } from "../helpers/fixtures";

describe("parseGoodreadsShelf", () => {
  it("sorts by read date, not feed (shelf-add) order", async () => {
    const books = await parseGoodreadsShelf(fixture("goodreads-read.xml"), 5);
    expect(books.map((b) => b.title)).toEqual([
      "Joseph Müller-Brockman, Pioneer of Swiss Graphic Design",
      "Hacı Komünist",
      "Bozkır: Bir Yolculuk Hikâyesi",
    ]);
    expect(books[2].date).toBe("2026-06-21T00:00:00.000Z");
  });

  it("upgrades cover thumbnails and reads the numeric rating", async () => {
    const [first] = await parseGoodreadsShelf(fixture("goodreads-read.xml"), 5);
    expect(first.cover).toBe(
      "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1347438784l/663561._SY475_.jpg",
    );
    expect(first).toMatchObject({ numRating: 2, author: "Lars Müller" });
  });

  it("extracts review text from user_review only", async () => {
    const books = await parseGoodreadsShelf(fixture("goodreads-read.xml"), 5);
    expect(books[1].review).toBe("Funny and sharp satire.");
    expect(books[0].review).toBe("");
  });

  it("applies the limit after sorting", async () => {
    const books = await parseGoodreadsShelf(fixture("goodreads-read.xml"), 1);
    expect(books.map((b) => b.title)).toEqual([
      "Joseph Müller-Brockman, Pioneer of Swiss Graphic Design",
    ]);
  });
});

describe("goodreads.fetch", () => {
  const base = "https://www.goodreads.com/review/list_rss/8143905";

  it("fetches both shelves", async () => {
    const fetch = fakeFetch({
      [`${base}?shelf=currently-reading`]: { body: fixture("goodreads-currently-reading.xml") },
      [`${base}?shelf=read`]: { body: fixture("goodreads-read.xml") },
    });
    const books = await goodreads.fetch({ fetch, env: {} });
    expect(books.currentlyReading.map((b) => b.title)).toEqual([
      "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
      "Educated",
      "Mutluluğun Mimarisi",
      "The Design of Everyday Things",
      "Piranesi",
    ]);
    // Nothing on the shelf is rated yet.
    expect(books.currentlyReading[0]).toMatchObject({ author: "J.K. Rowling", numRating: 0 });
    expect(books.read).toHaveLength(3);
  });

  it("throws if either shelf fails", async () => {
    const fetch = fakeFetch({
      [`${base}?shelf=read`]: { body: fixture("goodreads-read.xml") },
    });
    await expect(goodreads.fetch({ fetch, env: {} })).rejects.toThrow("404");
  });

  it("throws when the read shelf comes back empty", async () => {
    const emptyShelf =
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>read</title></channel></rss>';
    const fetch = fakeFetch({
      [`${base}?shelf=currently-reading`]: { body: fixture("goodreads-read.xml") },
      [`${base}?shelf=read`]: { body: emptyShelf },
    });
    await expect(goodreads.fetch({ fetch, env: {} })).rejects.toThrow(
      "goodreads read shelf returned no books",
    );
  });

  it("allows an empty currently-reading shelf", async () => {
    const emptyShelf =
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>reading</title></channel></rss>';
    const fetch = fakeFetch({
      [`${base}?shelf=currently-reading`]: { body: emptyShelf },
      [`${base}?shelf=read`]: { body: fixture("goodreads-read.xml") },
    });
    const books = await goodreads.fetch({ fetch, env: {} });
    expect(books.currentlyReading).toEqual([]);
    expect(books.read).toHaveLength(3);
  });
});
