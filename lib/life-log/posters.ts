import { USER_AGENT, fetchText, httpUrl } from "../sources/http";
import { filmDataSchema, posterCrop } from "./films";
import type { LifeLogStore } from "./types";

// /film/<slug>/ in a diary URL (letterboxd.com/onur/film/<slug>/[n/]) or a
// film URL (letterboxd.com/film/<slug>/).
export function filmSlug(urlOrPath: string): string | null {
  const match = /\/film\/([^/]+)\//.exec(urlOrPath);
  return match ? match[1] : null;
}

const JSON_LD_IMAGE = /"image"\s*:\s*"([^"]+)"/;

// The film page's JSON-LD image, at the archive crop. Imported rows link to
// a boxd.it short URL: only its redirect's Location is read (profile pages
// 403 server requests; film pages don't). Returns "" on any failure.
export async function resolvePoster(fetchImpl: typeof globalThis.fetch, link: string): Promise<string> {
  try {
    let slug = filmSlug(link);
    if (!slug && /^https:\/\/boxd\.it\//.test(link)) {
      const response = await fetchImpl(link, {
        redirect: "manual",
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10_000),
      });
      slug = filmSlug(response.headers.get("location") ?? "");
    }
    if (!slug) return "";
    const html = await fetchText(fetchImpl, `https://letterboxd.com/film/${slug}/`);
    const image = JSON_LD_IMAGE.exec(html)?.[1]?.replace(/\\\//g, "/") ?? "";
    return posterCrop(httpUrl(image));
  } catch {
    return "";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fills posters on the newest film rows that have none, one request chain at
// a time. A row that fails stays empty and is tried again next run.
export async function fillPosters(
  store: LifeLogStore,
  fetchImpl: typeof globalThis.fetch,
  { limit, delayMs = 0, at }: { limit: number; delayMs?: number; at: Date },
): Promise<{ filled: number; failed: number }> {
  const missing = (await store.list("letterboxd"))
    .filter((row) => !filmDataSchema.safeParse(row.data).data?.poster)
    .slice(0, limit);
  let filled = 0;
  let failed = 0;
  for (const [index, row] of missing.entries()) {
    if (index > 0 && delayMs > 0) await sleep(delayMs);
    const poster = await resolvePoster(fetchImpl, String(row.data.link ?? ""));
    if (!poster) {
      failed++;
      continue;
    }
    await store.upsert([{ ...row, data: { poster } }], { redate: false, at });
    filled++;
  }
  return { filled, failed };
}
