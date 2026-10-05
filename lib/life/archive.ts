import { filmDataSchema } from "../life-log/films";
import type { Enrichment, LifeLogRow } from "../life-log/types";
import { httpUrl } from "../sources/http";
import type { Book, Books } from "../sources/goodreads";
import type { Article } from "../sources/instapaper";
import { theatreDataSchema } from "../sources/theatre";

// Pure views for the Life archive pages (spec §1): rows in, tiles grouped by
// year and month out. No ratings, no release years in film captions, and
// every count is the real size of its group.

export interface ArchiveItem {
  key: string;
  title: string;
  // The untrimmed title when the caption shortened it (a series suffix).
  fullTitle?: string;
  // Muted caption lines under the title.
  meta: string[];
  href: string;
  image: string;
}
export interface MonthGroup {
  month: number;
  label: string;
  items: ArchiveItem[];
}
export interface YearGroup {
  year: number;
  months: MonthGroup[];
}
export interface TheatreYear {
  year: number;
  andEarlier: boolean;
  items: ArchiveItem[];
}
export interface SavedItem {
  link: string;
  title: string;
  site: string;
  minutes: number | null;
  description: string;
  image: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "2026-09-08" → "Sep 8".
export function monthDay(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${MONTHS[month - 1].slice(0, 3)} ${day}`;
}

export function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

const last = <T>(list: T[]): T | undefined => list[list.length - 1];

// Newest first by YYYY-MM-DD; entries on the same day keep their input order.
export function groupByMonth(entries: { date: string; item: ArchiveItem }[]): YearGroup[] {
  const sorted = entries
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => (a.date === b.date ? a.index - b.index : a.date < b.date ? 1 : -1));
  const years: YearGroup[] = [];
  for (const { date, item } of sorted) {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    let group = last(years);
    if (!group || group.year !== year) {
      group = { year, months: [] };
      years.push(group);
    }
    let bucket = last(group.months);
    if (!bucket || bucket.month !== month) {
      bucket = { month, label: MONTHS[month - 1], items: [] };
      group.months.push(bucket);
    }
    bucket.items.push(item);
  }
  return years;
}

export function filmArchive(rows: LifeLogRow[]): { years: YearGroup[]; undated: ArchiveItem[] } {
  const dated: { date: string; item: ArchiveItem }[] = [];
  const undated: ArchiveItem[] = [];
  for (const row of rows) {
    if (row.source !== "letterboxd") continue;
    const parsed = filmDataSchema.safeParse(row.data);
    if (!parsed.success) continue;
    const film = parsed.data;
    const base = { key: row.key, title: film.title, href: httpUrl(film.link), image: httpUrl(film.poster) };
    if (row.occurredOn) {
      dated.push({ date: row.occurredOn, item: { ...base, meta: [`${monthDay(row.occurredOn)}${film.rewatch ? " · ↻" : ""}`] } });
    } else {
      undated.push({ ...base, meta: [] });
    }
  }
  undated.sort((a, b) => a.title.localeCompare(b.title, "en"));
  return { years: groupByMonth(dated), undated };
}

const istanbulDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// " (Harry Potter, #7)" and similar series suffixes.
const SERIES_SUFFIX = /\s*\([^()]*#\d+(?:\.\d+)?\)\s*$/;

function bookItem(book: Book, meta: string[]): ArchiveItem {
  const title = book.title.replace(SERIES_SUFFIX, "").trim() || book.title;
  return {
    key: book.link || book.title,
    title,
    ...(title !== book.title ? { fullTitle: book.title } : {}),
    meta,
    href: httpUrl(book.link),
    image: httpUrl(book.cover),
  };
}

export function bookArchive(books: Books): { reading: ArchiveItem[]; years: YearGroup[]; undated: ArchiveItem[] } {
  const dated: { date: string; item: ArchiveItem }[] = [];
  const undated: ArchiveItem[] = [];
  for (const book of books.read) {
    const time = book.readAt ? Date.parse(book.readAt) : NaN;
    if (Number.isNaN(time)) {
      undated.push(bookItem(book, [book.author]));
      continue;
    }
    const date = istanbulDate.format(time);
    dated.push({ date, item: bookItem(book, [book.author, monthDay(date)]) });
  }
  return {
    reading: books.currentlyReading.map((book) => bookItem(book, [book.author])),
    years: groupByMonth(dated),
    undated,
  };
}

export function theatreArchive(rows: LifeLogRow[]): TheatreYear[] {
  const byYear = new Map<number, { andEarlier: boolean; entries: { id: number; item: ArchiveItem }[] }>();
  for (const row of rows) {
    if (row.source !== "theatre" || !row.occurredOn) continue;
    const parsed = theatreDataSchema.safeParse(row.data);
    if (!parsed.success) continue;
    const play = parsed.data;
    const year = Number(row.occurredOn.slice(0, 4));
    const group = byYear.get(year) ?? { andEarlier: false, entries: [] };
    group.andEarlier ||= play.andEarlier;
    group.entries.push({
      id: Number(row.key),
      item: { key: row.key, title: play.title, meta: play.company ? [play.company] : [], href: httpUrl(play.link), image: httpUrl(play.poster) },
    });
    byYear.set(year, group);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, group]) => ({
      year,
      andEarlier: group.andEarlier,
      // Activity post ids grow over time: higher is newer.
      items: group.entries.sort((a, b) => b.id - a.id).map((entry) => entry.item),
    }));
}

export function latestPlays(rows: LifeLogRow[], count: number): ArchiveItem[] {
  return theatreArchive(rows)
    .flatMap((year) => year.items)
    .slice(0, count);
}

const MIN_IMAGE_WIDTH = 400;
// "…_128x128.jpg"-style avatars in the URL.
const SIZE_IN_URL = /(?:^|[^0-9])(\d{2,4})x(\d{2,4})(?:[^0-9]|$)/;

function usableImage(url: string | null | undefined, width: number | null | undefined): string {
  if (!url || !url.startsWith("https:")) return "";
  if (width != null && width < MIN_IMAGE_WIDTH) return "";
  const size = SIZE_IN_URL.exec(url);
  if (size && Number(size[1]) < MIN_IMAGE_WIDTH && Number(size[2]) < MIN_IMAGE_WIDTH) return "";
  return url;
}

function usableDescription(candidates: (string | null | undefined)[], title: string): string {
  for (const candidate of candidates) {
    const text = (candidate ?? "").replace(/\s+/g, " ").trim();
    if (text && text.toLowerCase() !== title.trim().toLowerCase()) return text;
  }
  return "";
}

export function savedItems(articles: Article[], enrichments: Enrichment[]): SavedItem[] {
  const byUrl = new Map(enrichments.map((enrichment) => [enrichment.url, enrichment]));
  return articles.map((article) => {
    const enrichment = byUrl.get(article.link);
    return {
      link: article.link,
      title: article.title,
      site: article.domain,
      minutes: article.minutes,
      description: usableDescription([enrichment?.description, article.description], article.title),
      image: usableImage(enrichment?.imageUrl, enrichment?.imageWidth) || usableImage(article.image, null),
    };
  });
}
