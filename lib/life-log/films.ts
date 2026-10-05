import { z } from "zod";
import type { LifeLogRow } from "./types";

// What a film row's data holds. poster is "" until filled (posters.ts).
export const filmDataSchema = z.object({
  title: z.string(),
  year: z.number().nullable(),
  link: z.string(),
  poster: z.string().default(""),
  rewatch: z.boolean().default(false),
  // ISO time of the last failed poster lookup; fillPosters skips the row for a week.
  posterTriedAt: z.string().optional(),
});
export type FilmData = z.infer<typeof filmDataSchema>;

// One diary entry, from the CSV export or the RSS feed. watchedOn is
// YYYY-MM-DD, or null for a film marked watched without a diary date.
export interface FilmEntry {
  title: string;
  year: number | null;
  link: string;
  poster?: string;
  rewatch: boolean;
  watchedOn: string | null;
}

export function normaliseTitle(title: string): string {
  return title.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

// Letterboxd poster URLs carry their crop size; the archive tiles want 230×345.
export function posterCrop(url: string): string {
  return url.replace(/-0-\d+-0-\d+-crop/, "-0-230-0-345-crop");
}

// Rows for a batch of entries, OLDEST FIRST. The key is the same whichever
// side (CSV or RSS) sees the entry: watch date, normalised title, release
// year, plus a counter for the same film twice on one day.
export function filmRows(entries: FilmEntry[]): LifeLogRow[] {
  const seen = new Map<string, number>();
  return entries.map((entry) => {
    const base = `${entry.watchedOn ?? "undated"}|${normaliseTitle(entry.title)}|${entry.year ?? ""}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const data: Record<string, unknown> = {
      title: entry.title.trim(),
      year: entry.year,
      link: entry.link,
      rewatch: entry.rewatch,
    };
    if (entry.poster) data.poster = entry.poster;
    return {
      source: "letterboxd",
      key: `${base}|${n}`,
      occurredOn: entry.watchedOn,
      precision: entry.watchedOn ? "day" : "none",
      data,
    };
  });
}
