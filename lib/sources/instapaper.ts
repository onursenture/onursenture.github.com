import { z } from "zod";
import { fetchJson, hostname } from "./http";
import type { SourceDefinition } from "./types";

// The public profile (instapaper.com/p/w00f) is a client-rendered SPA; this
// is the JSON endpoint it calls. It works unauthenticated.
const PROFILE_URL = "https://www.instapaper.com/data/profile/w00f?page=1";
const LIMIT = 15;

export const articleSchema = z.object({
  title: z.string(),
  link: z.string(),
  domain: z.string(),
  // ISO timestamp the article was saved; empty if missing.
  date: z.string(),
  description: z.string(),
  words: z.number(),
  // Estimated total reading time in minutes, null if unknown.
  minutes: z.number().nullable(),
  // og:image when Instapaper provides one, else null.
  image: z.string().nullable(),
});
export const articlesSchema = z.array(articleSchema);
export type Article = z.infer<typeof articleSchema>;

const bookmarkSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  site_name: z.string().nullish(),
  description: z.string().nullish(),
  words: z.number().nullish(),
  time: z.number().nullish(),
  og_image: z.string().nullish(),
  estimated_total_time: z.number().nullish(),
});
const responseSchema = z.object({ bookmarks: z.array(bookmarkSchema) });

export function parseInstapaper(json: unknown): Article[] {
  const { bookmarks } = responseSchema.parse(json);
  // Kept in API order, which matches the profile page; `time` is not
  // strictly descending because bulk-saved items share a timestamp.
  return bookmarks
    .filter((b) => b.title?.trim() && b.url)
    .slice(0, LIMIT)
    .map((b) => ({
      title: b.title!.trim(),
      link: b.url!,
      domain: b.site_name || hostname(b.url!),
      date: b.time ? new Date(b.time * 1000).toISOString() : "",
      description: (b.description ?? "").trim(),
      words: b.words ?? 0,
      minutes: b.estimated_total_time ?? null,
      image: b.og_image ?? null,
    }));
}

export const instapaper: SourceDefinition<Article[], "instapaper"> = {
  id: "instapaper",
  intervalMinutes: 60,
  empty: [],
  schema: articlesSchema,
  fetch: async ({ fetch }) => parseInstapaper(await fetchJson(fetch, PROFILE_URL)),
  count: (articles) => articles.length,
};
