import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { z } from "zod";
import { fetchText, toIso } from "./http";
import type { SourceDefinition } from "./types";

const FEED_URL = "https://letterboxd.com/onur/rss/";
const LIMIT = 6;

export const filmSchema = z.object({
  title: z.string(),
  year: z.number().nullable(),
  link: z.string(),
  poster: z.string(),
  // Star string as Letterboxd renders it in the title. Empty when unrated.
  // Display uses ratingValue; this is kept as recorded.
  rating: z.string(),
  // Numeric rating 0.5–5, null when unrated.
  ratingValue: z.number().nullable(),
  // YYYY-MM-DD the film was watched, empty if missing.
  watchedDate: z.string(),
  // ISO timestamp of the diary entry.
  date: z.string(),
});
export const filmsSchema = z.array(filmSchema);
export type Film = z.infer<typeof filmSchema>;

type LetterboxdItem = {
  filmTitle?: string;
  filmYear?: string;
  memberRating?: string;
  watchedDate?: string;
};

// The star suffix at the end of the feed title (U+2605 and U+00BD).
const STARS_SUFFIX = /\s*-\s*([\u2605\u00bd]+)\s*$/;

export async function parseLetterboxd(xml: string): Promise<Film[]> {
  const parser = new Parser<Record<string, never>, LetterboxdItem>({
    customFields: {
      item: [
        ["letterboxd:filmTitle", "filmTitle"],
        ["letterboxd:filmYear", "filmYear"],
        ["letterboxd:memberRating", "memberRating"],
        ["letterboxd:watchedDate", "watchedDate"],
      ],
    },
  });
  const feed = await parser.parseString(xml);

  return feed.items.slice(0, LIMIT).map((item) => {
    const $ = cheerio.load(item.content ?? "");
    const titleRaw = item.title ?? "";
    const starsMatch = titleRaw.match(STARS_SUFFIX);
    // Prefer the structured field; fall back to stripping the star suffix and
    // ", 2024" from the display title.
    const title =
      item.filmTitle?.trim() ||
      titleRaw.replace(STARS_SUFFIX, "").replace(/,\s*\d{4}\s*$/, "").trim();
    const year = item.filmYear ? Number.parseInt(item.filmYear, 10) : NaN;
    const ratingValue = item.memberRating
      ? Number.parseFloat(item.memberRating)
      : NaN;

    return {
      title,
      year: Number.isNaN(year) ? null : year,
      link: item.link ?? "",
      poster: $("img").attr("src") ?? "",
      rating: starsMatch ? starsMatch[1] : "",
      ratingValue: Number.isNaN(ratingValue) ? null : ratingValue,
      watchedDate: item.watchedDate ?? "",
      date: toIso(item.pubDate),
    };
  });
}

export const letterboxd: SourceDefinition<Film[], "letterboxd"> = {
  id: "letterboxd",
  intervalMinutes: 180,
  empty: [],
  schema: filmsSchema,
  fetch: async ({ fetch }) => parseLetterboxd(await fetchText(fetch, FEED_URL)),
  count: (films) => films.length,
};
