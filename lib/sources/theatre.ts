import * as cheerio from "cheerio";
import { z } from "zod";
import { theatreHistory } from "../../content/theatre-history";
import { yearFromAgo } from "../life-log/relative-year";
import { lifeLogTag } from "../life-log/tags";
import type { LifeLogRow } from "../life-log/types";
import { fetchText, httpUrl } from "./http";
import type { SourceDefinition } from "./types";

// tiyatrolar.com.tr: the profile's activity feed, through the endpoint behind
// its "Daha fazla yükle" button. Five activity items per call; "tiyatro
// izledi" posts are the watches. robots.txt allows everything.
const ENDPOINT = "https://tiyatrolar.com.tr/posts/load_more_user_item_via_ajax/";
const PROFILE = { username: "onursenture", user_id: "1702" };
// Onur's watched list, the Theatre archive's upstream link.
export const THEATRE_PROFILE_URL = "https://tiyatrolar.com.tr/u/onursenture/izledikleri";
const MAX_PAGES = 10;

export const watchSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  company: z.string(),
  poster: z.string(),
  link: z.string(),
  // The relative time shown ("3 gün önce"); the year is derived at sync.
  ago: z.string(),
});
export const watchesSchema = z.array(watchSchema);
export type TheatreWatch = z.infer<typeof watchSchema>;

export const theatreDataSchema = z.object({
  title: z.string(),
  slug: z.string(),
  company: z.string(),
  poster: z.string(),
  link: z.string(),
  andEarlier: z.boolean().default(false),
});
export type TheatreData = z.infer<typeof theatreDataSchema>;

const responseSchema = z.object({
  html: z.string(),
  html_btn: z.boolean().optional(),
  new_offset: z.number().optional(),
});

export function parseActivity(html: string): { ids: string[]; watches: TheatreWatch[] } {
  const $ = cheerio.load(html);
  const ids: string[] = [];
  const watches: TheatreWatch[] = [];
  $('li[class^="postli_"]').each((_, li) => {
    const id = /postli_(\d+)/.exec($(li).attr("class") ?? "")?.[1];
    if (!id) return;
    ids.push(id);
    const verb = $(li)
      .find(".post-header p a")
      .filter((__, a) => $(a).text().trim() === "izledi");
    if (verb.length === 0) return;
    const play = $(li).find('a[href*="/tiyatro/"]').first();
    const link = httpUrl(play.attr("href"));
    const slug = /\/tiyatro\/([^/?#]+)/.exec(link)?.[1] ?? "";
    const heading = play.find("h6").first();
    const company = heading.find(".wall_extra_info").text().replace(/^\s*\/\s*/, "").trim();
    const title = heading.clone().children().remove().end().text().trim();
    if (!link || !slug || !title) return;
    watches.push({
      id,
      title,
      slug,
      company,
      poster: httpUrl(play.find("img").attr("src")).replace(/-41x59(?=\.\w+$)/, ""),
      link,
      ago: $(li).find(".post-header p span").first().text().trim(),
    });
  });
  return { ids, watches };
}

export async function fetchActivityPage(
  fetchImpl: typeof globalThis.fetch,
  offset: number,
): Promise<{ ids: string[]; watches: TheatreWatch[]; more: boolean; next: number }> {
  const body = new URLSearchParams({
    item_type: "user_item",
    page: "activity",
    lazy_load: "1",
    username: PROFILE.username,
    item_type_detail: "",
    is_locked: "0",
    area: "area_wall",
    wall_type: "wall",
    controller: "posts",
    limit: "5",
    user_id: PROFILE.user_id,
    query: "",
    offset: String(offset),
  });
  const text = await fetchText(fetchImpl, ENDPOINT, {
    method: "POST",
    body,
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });
  const json = responseSchema.parse(JSON.parse(text));
  const { ids, watches } = parseActivity(json.html);
  const next = json.new_offset && json.new_offset > offset ? json.new_offset : offset + 5;
  return { ids, watches, more: Boolean(json.html_btn) && ids.length > 0, next };
}

// The committed history as life_log rows. The oldest year is "and earlier":
// it is the bulk entry made when the account was set up.
export function historyRows(): LifeLogRow[] {
  const oldest = Math.min(...theatreHistory.map((row) => row.year));
  return theatreHistory.map((row) => ({
    source: "theatre",
    key: row.id,
    occurredOn: `${row.year}-01-01`,
    precision: "year",
    data: {
      title: row.title,
      slug: row.slug,
      company: row.company,
      poster: row.poster,
      link: row.link,
      andEarlier: row.year === oldest,
    },
  }));
}

// The read side's view of the archive: the committed history merged into
// the database rows, so /life/theatre/ and the home row never depend on a
// successful tiyatrolar fetch (the archive step that seeds the history runs
// only after one). Database rows are kept by key; for a history id the
// file's year (occurredOn, precision) and andEarlier win, the same rule the
// re-seed applies. Newest first, like the store's list().
export function mergeTheatreHistory(rows: LifeLogRow[]): LifeLogRow[] {
  const merged = new Map(rows.map((row) => [row.key, row]));
  for (const history of historyRows()) {
    const stored = merged.get(history.key);
    merged.set(
      history.key,
      stored
        ? {
            ...stored,
            occurredOn: history.occurredOn,
            precision: history.precision,
            data: { ...stored.data, andEarlier: history.data.andEarlier },
          }
        : history,
    );
  }
  return [...merged.values()].sort((a, b) => {
    if (a.occurredOn !== b.occurredOn) {
      if (a.occurredOn === null) return 1;
      if (b.occurredOn === null) return -1;
      return a.occurredOn < b.occurredOn ? 1 : -1;
    }
    return a.key < b.key ? 1 : a.key > b.key ? -1 : 0;
  });
}

export const theatre: SourceDefinition<TheatreWatch[], "theatre"> = {
  id: "theatre",
  intervalMinutes: 24 * 60,
  empty: [],
  schema: watchesSchema,
  // Newest activity first, stopping at the first page that holds a post the
  // archive already has (from the history file or an earlier sync). Returns
  // every watch on the pages crawled, known ones included: a known post is a
  // watch, so the snapshot is never empty on a healthy feed. archive() skips
  // what it already has.
  fetch: async ({ fetch, stores }) => {
    const known = new Set(theatreHistory.map((row) => row.id));
    for (const key of (await stores?.lifeLog.keys("theatre")) ?? []) known.add(key);
    const watches: TheatreWatch[] = [];
    let offset = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await fetchActivityPage(fetch, offset);
      watches.push(...result.watches);
      if (!result.more || result.ids.some((id) => known.has(id))) break;
      offset = result.next;
    }
    if (watches.length === 0) throw new Error("tiyatrolar activity returned no watches");
    return watches;
  },
  count: (watches) => watches.length,
  // Re-seeds the committed history (its years win, so a corrected year takes
  // effect), then adds watches the history doesn't have, dated by the year of
  // their relative time. A row added by an earlier sync is never re-dated.
  archive: async (watches, { stores, now }) => {
    const seeded = await stores.lifeLog.upsert(historyRows(), { redate: true, at: now });
    const historyIds = new Set(theatreHistory.map((row) => row.id));
    const fresh: LifeLogRow[] = [];
    for (const watch of watches) {
      if (historyIds.has(watch.id)) continue;
      const year = yearFromAgo(watch.ago, now);
      if (year === null) continue;
      fresh.push({
        source: "theatre",
        key: watch.id,
        occurredOn: `${year}-01-01`,
        precision: "year",
        data: { title: watch.title, slug: watch.slug, company: watch.company, poster: watch.poster, link: watch.link, andEarlier: false },
      });
    }
    const added = await stores.lifeLog.upsert(fresh, { redate: false, at: now });
    const touched = seeded.inserted + seeded.updated + added.inserted + added.updated;
    return {
      note: `+${seeded.inserted + added.inserted} plays`,
      tags: touched > 0 ? [lifeLogTag("theatre")] : [],
    };
  },
};
