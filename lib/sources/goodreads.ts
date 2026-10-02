import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { z } from "zod";
import { fetchText, toIso } from "./http";
import type { SourceDefinition } from "./types";

// Goodreads RSS needs the numeric user ID; this is goodreads.com/onur.
const DEFAULT_USER_ID = "8143905";
const CURRENTLY_READING_LIMIT = 10;
const READ_LIMIT = 5;

export const bookSchema = z.object({
  title: z.string(),
  author: z.string(),
  cover: z.string(),
  rating: z.string(),
  numRating: z.number(),
  review: z.string(),
  link: z.string(),
  // ISO timestamp: the read date when known, else the shelf-add date.
  date: z.string(),
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

export async function parseGoodreadsShelf(
  xml: string,
  limit: number,
): Promise<Book[]> {
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
    return {
      title: (item.title ?? "").trim(),
      author: (item.authorName ?? "").trim(),
      cover: rawCover ? upgradeCover(rawCover) : "",
      rating: "★".repeat(numRating),
      numRating,
      // Only the explicit review field; the old description-scraping
      // fallback picked up book blurbs and is intentionally gone.
      review: item.userReview ? cheerio.load(item.userReview).text().trim() : "",
      link: item.link ?? "",
      date: toIso(item.userReadAt) || toIso(item.pubDate),
    };
  });

  // The feed is ordered by shelf-add date; rank by the date shown instead.
  books.sort((a, b) => dateValue(b.date) - dateValue(a.date));
  return books.slice(0, limit);
}

export const goodreads: SourceDefinition<Books> = {
  id: "goodreads",
  intervalMinutes: 180,
  empty: { currentlyReading: [], read: [] },
  schema: booksSchema,
  fetch: async ({ fetch, env }) => {
    const userId = env.GOODREADS_USER_ID || DEFAULT_USER_ID;
    const [currentlyXml, readXml] = await Promise.all([
      fetchText(fetch, shelfUrl(userId, "currently-reading")),
      fetchText(fetch, shelfUrl(userId, "read")),
    ]);
    return {
      currentlyReading: await parseGoodreadsShelf(
        currentlyXml,
        CURRENTLY_READING_LIMIT,
      ),
      read: await parseGoodreadsShelf(readXml, READ_LIMIT),
    };
  },
  count: (books) => books.currentlyReading.length + books.read.length,
};
