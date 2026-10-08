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
      "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1347438784l/663561._SY160_.jpg",
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
  const emptyPage =
    '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>read</title></channel></rss>';

  it("fetches both shelves", async () => {
    const fetch = fakeFetch({
      [`${base}?shelf=currently-reading`]: { body: fixture("goodreads-currently-reading.xml") },
      [`${base}?shelf=read&page=1`]: { body: fixture("goodreads-read.xml") },
      [`${base}?shelf=read&page=2`]: { body: emptyPage },
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
      [`${base}?shelf=read&page=1`]: { body: fixture("goodreads-read.xml") },
      [`${base}?shelf=read&page=2`]: { body: emptyPage },
    });
    await expect(goodreads.fetch({ fetch, env: {} })).rejects.toThrow("404");
  });

  it("throws when the read shelf comes back empty", async () => {
    const emptyShelf =
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>read</title></channel></rss>';
    const fetch = fakeFetch({
      [`${base}?shelf=currently-reading`]: { body: fixture("goodreads-read.xml") },
      [`${base}?shelf=read&page=1`]: { body: emptyShelf },
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
      [`${base}?shelf=read&page=1`]: { body: fixture("goodreads-read.xml") },
      [`${base}?shelf=read&page=2`]: { body: emptyPage },
    });
    const books = await goodreads.fetch({ fetch, env: {} });
    expect(books.currentlyReading).toEqual([]);
    expect(books.read).toHaveLength(3);
  });
});

const item = (title: string, readAt: string, added: string, review = "") => `
  <item>
    <title>${title}</title>
    <link>https://www.goodreads.com/review/show/${title.length}</link>
    <pubDate>${added}</pubDate>
    <author_name>Someone</author_name>
    <book_image_url>https://i.gr-assets.com/x._SY75_.jpg</book_image_url>
    <user_rating>0</user_rating>
    <user_read_at>${readAt}</user_read_at>
    <user_review><![CDATA[${review}]]></user_review>
  </item>`;
const shelf = (...items: string[]) => `<?xml version="1.0"?><rss version="2.0"><channel><title>s</title>${items.join("")}</channel></rss>`;

describe("parseGoodreadsShelf dates", () => {
  it("keeps the read date and the shelf-add date apart", async () => {
    const [read, undated] = await parseGoodreadsShelf(
      shelf(
        item("Read one", "Fri, 25 Sep 2026 00:00:00 -0700", "Sat, 26 Sep 2026 10:00:00 -0700"),
        item("No date", "", "Mon, 01 Jun 2026 10:00:00 -0700"),
      ),
    );
    expect(read.readAt).toBe("2026-09-25T07:00:00.000Z");
    expect(read.addedAt).toBe("2026-09-26T17:00:00.000Z");
    expect(read.date).toBe(read.readAt);
    expect(undated.readAt).toBe("");
    expect(undated.date).toBe(undated.addedAt);
  });

  it("turns <br> in a review into line breaks", async () => {
    const [book] = await parseGoodreadsShelf(shelf(item("R", "", "Mon, 01 Jun 2026 10:00:00 -0700", "One<br>Two<br/>Three")));
    expect(book.review).toBe("One\nTwo\nThree");
  });
});

describe("goodreads.fetch paging", () => {
  it("reads every page of the read shelf until an empty one", async () => {
    const base = "https://www.goodreads.com/review/list_rss/8143905?shelf=";
    const fetch = fakeFetch({
      [`${base}currently-reading`]: { body: shelf() },
      [`${base}read&page=1`]: { body: shelf(item("A", "Fri, 25 Sep 2026 00:00:00 -0700", "Fri, 25 Sep 2026 00:00:00 -0700")) },
      [`${base}read&page=2`]: { body: shelf(item("Bb", "Fri, 21 Aug 2026 00:00:00 -0700", "Fri, 21 Aug 2026 00:00:00 -0700")) },
      [`${base}read&page=3`]: { body: shelf() },
    });
    const books = await goodreads.fetch({ fetch, env: {} });
    expect(books.read.map((b) => b.title)).toEqual(["A", "Bb"]);
  });
});
