import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { z } from "zod";
import { filmRows, posterCrop } from "../life-log/films";
import { fillPosters } from "../life-log/posters";
import { lifeLogTag } from "../life-log/tags";
import { fetchText, httpUrl, toIso } from "./http";
import type { SourceDefinition } from "./types";

const FEED_URL = "https://letterboxd.com/onur/rss/";
// Small enough to fit the sync's time budget; the import's --posters does
// the bulk, and fillPosters stops early when the deadline is near anyway.
const POSTERS_PER_RUN = 15;

export const filmSchema = z.object({
  title: z.string(),
  year: z.number().nullable(),
  link: z.string(),
  poster: z.string(),
  // Numeric rating 0.5–5, null when unrated.
  ratingValue: z.number().nullable(),
  // YYYY-MM-DD the film was watched, empty if missing.
  watchedDate: z.string(),
  // ISO timestamp of the diary entry.
  date: z.string(),
  // A rewatch diary entry. Defaults keep older snapshots parsing.
  rewatch: z.boolean().default(false),
});
export const filmsSchema = z.array(filmSchema);
export type Film = z.infer<typeof filmSchema>;

type LetterboxdItem = {
  filmTitle?: string;
  filmYear?: string;
  memberRating?: string;
  watchedDate?: string;
  rewatch?: string;
};

// The star suffix at the end of the feed title (U+2605 and U+00BD).
const STARS_SUFFIX = /\s*-\s*[\u2605\u00bd]+\s*$/;

export async function parseLetterboxd(xml: string): Promise<Film[]> {
  const parser = new Parser<Record<string, never>, LetterboxdItem>({
    customFields: {
      item: [
        ["letterboxd:filmTitle", "filmTitle"],
        ["letterboxd:filmYear", "filmYear"],
        ["letterboxd:memberRating", "memberRating"],
        ["letterboxd:watchedDate", "watchedDate"],
        ["letterboxd:rewatch", "rewatch"],
      ],
    },
  });
  const feed = await parser.parseString(xml);

  return feed.items.map((item) => {
    const $ = cheerio.load(item.content ?? "");
    const titleRaw = item.title ?? "";
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
      link: httpUrl(item.link),
      poster: httpUrl($("img").attr("src")),
      ratingValue: Number.isNaN(ratingValue) ? null : ratingValue,
      watchedDate: item.watchedDate ?? "",
      date: toIso(item.pubDate),
      rewatch: item.rewatch === "Yes",
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
  // Sprint 10: every dated diary entry in the feed goes into life_log (the
  // /life/films/ archive), then up to 15 rows without a poster get one.
  archive: async (films, { stores, fetch, now, deadline }) => {
    const rows = filmRows(
      films
        .filter((film) => film.watchedDate)
        .reverse() // the feed is newest first; filmRows wants oldest first
        .map((film) => ({
          title: film.title,
          year: film.year,
          link: film.link,
          poster: posterCrop(film.poster),
          rewatch: film.rewatch,
          watchedOn: film.watchedDate,
        })),
    );
    const counts = await stores.lifeLog.upsert(rows, { redate: false, at: now });
    const posters = await fillPosters(stores.lifeLog, fetch, { limit: POSTERS_PER_RUN, at: now, deadline });
    const failed = posters.failed ? ` · ${posters.failed} failed` : "";
    const errors = posters.errors ? ` · ${posters.errors} errored` : "";
    return {
      note: `+${counts.inserted} films · ${posters.filled} posters filled${failed}${errors}`,
      tags: counts.inserted + counts.updated + posters.filled > 0 ? [lifeLogTag("letterboxd")] : [],
    };
  },
};
