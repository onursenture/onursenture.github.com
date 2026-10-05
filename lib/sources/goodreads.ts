import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { z } from "zod";
import { fetchText, httpUrl, toIso } from "./http";
import type { SourceDefinition } from "./types";

// Goodreads RSS needs the numeric user ID; this is goodreads.com/onur.
const DEFAULT_USER_ID = "8143905";
const CURRENTLY_READING_LIMIT = 10;
const MAX_READ_PAGES = 10;

export const bookSchema = z.object({
  title: z.string(),
  author: z.string(),
  cover: z.string(),
  numRating: z.number(),
  review: z.string(),
  link: z.string(),
  // ISO timestamp: the read date when known, else the shelf-add date (the
  // Life home orders by this).
  date: z.string(),
  // ISO read date, "" when the shelf has none (the archive's "Undated").
  // Defaults keep snapshots stored before Sprint 10 parsing.
  readAt: z.string().default(""),
  // ISO shelf-add date.
  addedAt: z.string().default(""),
});
export const booksSchema = z.object({
  currentlyReading: z.array(bookSchema),
  read: z.array(bookSchema),
});
export type Book = z.infer<typeof bookSchema>;
export type Books = z.infer<typeof booksSchema>;

type GoodreadsItem = {
  bookImageUrl?: string;
  authorName?: string;
  userRating?: string;
  userReview?: string;
  userReadAt?: string;
};

function shelfUrl(userId: string, shelf: string): string {
  return `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}`;
}

// Goodreads serves tiny thumbnails (._SY75_ / ._SX50_); ask for 475px.
function upgradeCover(url: string): string {
  return url.replace(/\._S[XY]\d+_/, "._SY475_").replace(/\/s\/[^/]+\//, "/l/");
}

function dateValue(iso: string): number {
  const time = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(time) ? -Infinity : time;
}

export async function parseGoodreadsShelf(xml: string, limit = Infinity): Promise<Book[]> {
  const parser = new Parser<Record<string, never>, GoodreadsItem>({
    customFields: {
      item: [
        ["book_image_url", "bookImageUrl"],
        ["author_name", "authorName"],
        ["user_rating", "userRating"],
        ["user_review", "userReview"],
        ["user_read_at", "userReadAt"],
      ],
    },
  });
  const feed = await parser.parseString(xml);

  const books = feed.items.map((item) => {
    const numRating = Number.parseInt(item.userRating ?? "", 10) || 0;
    const rawCover =
      item.bookImageUrl ||
      cheerio.load(item.content ?? "")("img").attr("src") ||
      "";
    const readAt = toIso(item.userReadAt);
    const addedAt = toIso(item.pubDate);
    // <br> would otherwise glue paragraphs together in .text().
    const review = item.userReview
      ? cheerio.load(item.userReview.replace(/<br\s*\/?>/gi, "\n")).text().trim()
      : "";
    return {
      title: (item.title ?? "").trim(),
      author: (item.authorName ?? "").trim(),
      cover: rawCover ? httpUrl(upgradeCover(rawCover)) : "",
      numRating,
      // Only the explicit review field; the old description-scraping
      // fallback picked up book blurbs and is intentionally gone.
      review,
      link: httpUrl(item.link),
      date: readAt || addedAt,
      readAt,
      addedAt,
    };
  });

  // The feed is ordered by shelf-add date; rank by the date shown instead.
  books.sort((a, b) => dateValue(b.date) - dateValue(a.date));
  return books.slice(0, limit);
}

// Every page of the read shelf (100 books each) until an empty page.
async function readShelf(fetchImpl: typeof globalThis.fetch, userId: string): Promise<Book[]> {
  const books: Book[] = [];
  for (let page = 1; page <= MAX_READ_PAGES; page++) {
    const batch = await parseGoodreadsShelf(await fetchText(fetchImpl, `${shelfUrl(userId, "read")}&page=${page}`));
    if (batch.length === 0) break;
    books.push(...batch);
  }
  books.sort((a, b) => dateValue(b.date) - dateValue(a.date));
  return books;
}

export const goodreads: SourceDefinition<Books, "goodreads"> = {
  id: "goodreads",
  intervalMinutes: 180,
  empty: { currentlyReading: [], read: [] },
  schema: booksSchema,
  fetch: async ({ fetch, env }) => {
    const userId = env.GOODREADS_USER_ID || DEFAULT_USER_ID;
    const [currentlyXml, read] = await Promise.all([
      fetchText(fetch, shelfUrl(userId, "currently-reading")),
      readShelf(fetch, userId),
    ]);
    // The read shelf is never legitimately empty for this account, so an
    // empty one means a bad response. (Currently-reading may well be empty.)
    if (read.length === 0) throw new Error("goodreads read shelf returned no books");
    return {
      currentlyReading: await parseGoodreadsShelf(currentlyXml, CURRENTLY_READING_LIMIT),
      read,
    };
  },
  count: (books) => books.currentlyReading.length + books.read.length,
};
