import { z } from "zod";
import { fetchJson, hostname, httpUrl } from "./http";
import { enrichPending } from "../life-log/enrich";
import { ENRICHMENTS_TAG } from "../life-log/tags";
import type { SourceDefinition } from "./types";

// The public profile (instapaper.com/p/w00f) is a client-rendered SPA; this
// is the JSON endpoint it calls. It works unauthenticated and pages with
// ?page=n while has_next is true.
const PROFILE_URL = "https://www.instapaper.com/data/profile/w00f";
const MAX_PAGES = 10;

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
// Bookmarks are checked one by one, so a single odd bookmark is skipped
// rather than failing the whole page.
const responseSchema = z.object({ bookmarks: z.array(z.unknown()), has_next: z.boolean().optional() });

function toArticle(raw: unknown): Article | null {
  const parsed = bookmarkSchema.safeParse(raw);
  if (!parsed.success) return null;
  const b = parsed.data;
  const link = httpUrl(b.url);
  const title = b.title?.trim();
  if (!link || !title) return null;
  return {
    title,
    link,
    domain: b.site_name || hostname(link),
    date: b.time ? new Date(b.time * 1000).toISOString() : "",
    description: (b.description ?? "").trim(),
    words: b.words ?? 0,
    minutes: b.estimated_total_time ?? null,
    image: httpUrl(b.og_image) || null,
  };
}

// Kept in API order, which matches the profile page; `time` is not
// strictly descending because bulk-saved items share a timestamp.
export function parseInstapaper(json: unknown): Article[] {
  return responseSchema
    .parse(json)
    .bookmarks.map(toArticle)
    .filter((a): a is Article => a !== null);
}

async function fetchAll(fetchImpl: typeof globalThis.fetch): Promise<Article[]> {
  const articles: Article[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const json = await fetchJson(fetchImpl, `${PROFILE_URL}?page=${page}`);
    articles.push(...parseInstapaper(json));
    if (!responseSchema.parse(json).has_next) break;
  }
  return articles;
}

export const instapaper: SourceDefinition<Article[], "instapaper"> = {
  id: "instapaper",
  intervalMinutes: 60,
  empty: [],
  schema: articlesSchema,
  fetch: ({ fetch }) => fetchAll(fetch),
  count: (articles) => articles.length,
  // Sprint 10: og: image and description for /life/saved/, five new links a
  // run, within the run's deadline.
  archive: async (articles, { stores, fetch, now, deadline }) => {
    const { fetched, failed } = await enrichPending(stores.enrichments, fetch, articles.map((a) => a.link), now, { deadline });
    return {
      note: `${fetched} links enriched${failed ? ` · ${failed} failed` : ""}`,
      tags: fetched + failed > 0 ? [ENRICHMENTS_TAG] : [],
    };
  },
};
