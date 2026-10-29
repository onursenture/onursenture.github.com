import * as cheerio from "cheerio";
import { z } from "zod";
import { fetchText, httpUrl } from "./http";
import type { SourceDefinition } from "./types";

// Goodreads retired its public shelf RSS feeds on 2026-10-28: every
// /review/list_rss/ URL now returns 404, and the shelf pages ask for a sign
// in. Two signed-out pages are still public and are read instead:
//   - the profile, which shows up to three currently-reading books (with
//     their review links and dates) and every shelf's size;
//   - Year in Books, which lists each book read in a year (title, author,
//     cover, book link) but no read dates.
// Neither lists the whole read shelf, so the read list grows from the stored
// snapshot: books already synced keep their RSS-era fields, and each book
// newly seen in Year in Books is added to them.

// The numeric user ID; this is goodreads.com/onur.
const DEFAULT_USER_ID = "8143905";
const CURRENTLY_READING_LIMIT = 10;
// Turkey has been on UTC+3 all year since 2016. The profile prints its dates
// in Onur's Goodreads time zone (Istanbul), and Year in Books is per year.
const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

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

function profileUrl(userId: string): string {
  return `https://www.goodreads.com/user/show/${userId}`;
}

function yearInBooksUrl(userId: string, year: number): string {
  return `https://www.goodreads.com/user/year_in_books/${year}/${userId}`;
}

function absolute(href: string | undefined): string {
  if (!href) return "";
  try {
    return httpUrl(new URL(href, "https://www.goodreads.com").toString());
  } catch {
    return "";
  }
}

// Goodreads serves small covers (._SY75_, ._SX98_, ._SY475_); ask for 345px
// of height, twice the tallest tile (170px at 2:3) and the same size as the
// film posters.
function upgradeCover(url: string): string {
  return url.replace(/\._S[XY]\d+_/, "._SY345_").replace(/\/s\/[^/]+\//, "/l/");
}

const SERIES_SUFFIX = /\s*\([^()]*#\d+(?:\.\d+)?\)\s*$/;

// One key per book across the RSS-era snapshot and the pages: the Goodreads
// book ID, which every cover URL (/books/<stamp>l/<id>.jpg) and book link
// (/book/show/<id>-slug) carries. Books with no cover fall back to title and
// author.
export function bookKey(book: Pick<Book, "title" | "author" | "cover" | "link">): string {
  const id =
    book.cover.match(/\/books\/\d+[a-z]\/(\d+)[._]/)?.[1] ??
    book.link.match(/\/book\/show\/(\d+)/)?.[1];
  if (id) return `id:${id}`;
  const title = book.title.replace(SERIES_SUFFIX, "").trim().toLowerCase();
  return `title:${title}|${book.author.trim().toLowerCase()}`;
}

// "Aug 14, 2026 06:07AM", Istanbul time, to ISO; "" if it doesn't parse.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function profileDate(text: string): string {
  const match = text.trim().match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2})(AM|PM)$/);
  if (!match) return "";
  const [, mon, day, year, hour, minute, half] = match;
  const month = MONTHS.indexOf(mon);
  if (month < 0) return "";
  const hours = (Number(hour) % 12) + (half === "PM" ? 12 : 0);
  const utc = Date.UTC(Number(year), month, Number(day), hours, Number(minute)) - ISTANBUL_OFFSET_MS;
  return new Date(utc).toISOString();
}

export interface ProfileShelf {
  // The books the profile shows (at most three).
  visible: Book[];
  // The shelf's real size, from its "currently-reading (N)" link.
  count: number;
}

export function parseProfile(html: string): ProfileShelf {
  const $ = cheerio.load(html);
  let count: number | undefined;
  $('a[href*="shelf=currently-reading"]').each((_, a) => {
    const n = $(a).text().match(/currently-reading\W*\((\d+)\)/)?.[1];
    if (n !== undefined && count === undefined) count = Number(n);
  });
  // No shelf count means the markup changed (or a sign-in page came back):
  // throw rather than store an empty shelf.
  if (count === undefined) throw new Error("goodreads profile has no currently-reading shelf count");

  const visible = $("#currentlyReadingReviews .Updates")
    .map((_, el): Book => {
      const item = $(el);
      const cover = item.find(".firstcol img").attr("src") ?? "";
      const reviewLink = item.find('a[href*="/review/show/"]').first();
      const addedAt = profileDate(reviewLink.text());
      return {
        title: item.find("a.bookTitle").first().text().trim(),
        author: item.find("a.authorName").first().text().trim(),
        cover: cover ? httpUrl(upgradeCover(cover)) : "",
        numRating: 0,
        review: "",
        link: absolute(reviewLink.attr("href") ?? item.find("a.bookTitle").attr("href")),
        date: addedAt,
        readAt: "",
        addedAt,
      };
    })
    .get()
    .filter((book) => book.title);
  return { visible, count };
}

export interface YearBook {
  title: string;
  author: string;
  cover: string;
  link: string;
}

// The books on a Year in Books page. A year with no books has no cover grid
// and comes back empty.
export function parseYearInBooks(html: string): YearBook[] {
  const $ = cheerio.load(html);
  if (!/Year in Books/i.test($("title").text())) {
    throw new Error("goodreads Year in Books page has an unexpected title");
  }
  const books = new Map<string, YearBook>();
  $('.bookCovers a[href*="/book/show/"]').each((_, a) => {
    const img = $(a).find("img");
    // alt is "<title> by <author>"; authors don't contain " by ", titles may.
    const alt = (img.attr("alt") ?? img.attr("title") ?? "").trim();
    const split = alt.lastIndexOf(" by ");
    const src = img.attr("src") ?? "";
    const book: YearBook = {
      title: split > 0 ? alt.slice(0, split).trim() : alt,
      author: split > 0 ? alt.slice(split + 4).trim() : "",
      cover: src ? httpUrl(upgradeCover(src)) : "",
      link: absolute($(a).attr("href")),
    };
    if (book.title && book.link) books.set(bookKey(book), book);
  });
  return [...books.values()];
}

function dateValue(iso: string): number {
  const time = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(time) ? -Infinity : time;
}

function newestFirst(books: Book[]): Book[] {
  return [...books].sort((a, b) => dateValue(b.date) - dateValue(a.date));
}

export interface MergeInput {
  profile: ProfileShelf;
  // Every Year in Books page fetched this run (this year, and last year in
  // January).
  yearBooks: YearBook[];
  previous: Books | null;
  now: Date;
}

// Pure: the new snapshot from this run's pages and the stored one.
export function mergeBooks({ profile, yearBooks, previous, now }: MergeInput): Books {
  const nowIso = now.toISOString();
  const previousReading = previous?.currentlyReading ?? [];
  const previousRead = previous?.read ?? [];
  const readingByKey = new Map(previousReading.map((book) => [bookKey(book), book]));

  // Read: everything already stored, plus each Year in Books entry not seen
  // before. A book that moved there from currently-reading was finished
  // between two syncs (a few hours apart), so that sync is its read date.
  // Any other new book has no known read date and goes to "Undated".
  const readKeys = new Set(previousRead.map(bookKey));
  const read = [...previousRead];
  for (const entry of yearBooks) {
    const key = bookKey(entry);
    if (readKeys.has(key)) continue;
    readKeys.add(key);
    const wasReading = readingByKey.get(key);
    const readAt = wasReading ? nowIso : "";
    const addedAt = wasReading?.addedAt || nowIso;
    read.push({
      title: wasReading?.title || entry.title,
      author: wasReading?.author || entry.author,
      cover: wasReading?.cover || entry.cover,
      numRating: 0,
      review: "",
      link: wasReading?.link || entry.link,
      date: readAt || addedAt,
      readAt,
      addedAt,
    });
  }

  // Currently reading: the books the profile shows, keeping the stored record
  // of each one it already had. The profile shows at most three; the rest of
  // the shelf (its count says how many) is filled from the stored shelf,
  // newest first, skipping books that have since been read.
  const shown = profile.visible.map(
    (book) => readingByKey.get(bookKey(book)) ?? { ...book, date: book.date || nowIso, addedAt: book.addedAt || nowIso },
  );
  const shownKeys = new Set(shown.map(bookKey));
  const hidden = newestFirst(previousReading).filter((book) => {
    const key = bookKey(book);
    return !shownKeys.has(key) && !readKeys.has(key);
  });
  const missing = Math.max(0, profile.count - shown.length);
  const currentlyReading = newestFirst([...shown, ...hidden.slice(0, missing)]).slice(0, CURRENTLY_READING_LIMIT);

  return { currentlyReading, read: newestFirst(read) };
}

// The Year in Books pages to read: this year, plus last year in January so a
// book finished on New Year's Eve isn't missed.
export function yearsToFetch(now: Date): number[] {
  const istanbul = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  const year = istanbul.getUTCFullYear();
  return istanbul.getUTCMonth() === 0 ? [year, year - 1] : [year];
}

export const goodreads: SourceDefinition<Books, "goodreads"> = {
  id: "goodreads",
  intervalMinutes: 180,
  empty: { currentlyReading: [], read: [] },
  schema: booksSchema,
  fetch: async ({ fetch, env, previous, now = new Date() }) => {
    const userId = env.GOODREADS_USER_ID || DEFAULT_USER_ID;
    const [profileHtml, ...yearPages] = await Promise.all([
      fetchText(fetch, profileUrl(userId)),
      ...yearsToFetch(now).map((year) => fetchText(fetch, yearInBooksUrl(userId, year))),
    ]);
    const stored = booksSchema.safeParse(previous);
    const books = mergeBooks({
      profile: parseProfile(profileHtml),
      yearBooks: yearPages.flatMap(parseYearInBooks),
      previous: stored.success ? stored.data : null,
      now,
    });
    // The read shelf is never legitimately empty for this account, so an
    // empty one means a bad response. (Currently-reading may well be empty.)
    if (books.read.length === 0) throw new Error("goodreads read shelf returned no books");
    return books;
  },
  count: (books) => books.currentlyReading.length + books.read.length,
};
