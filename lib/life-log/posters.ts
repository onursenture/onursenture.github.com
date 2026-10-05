import { HttpError, USER_AGENT, fetchText, httpUrl } from "../sources/http";
import { filmDataSchema, posterCrop } from "./films";
import type { LifeLogStore } from "./types";

// /film/<slug>/ in a diary URL (letterboxd.com/onur/film/<slug>/[n/]) or a
// film URL (letterboxd.com/film/<slug>/).
export function filmSlug(urlOrPath: string): string | null {
  const match = /\/film\/([^/]+)\//.exec(urlOrPath);
  return match ? match[1] : null;
}

const JSON_LD_IMAGE = /"image"\s*:\s*"([^"]+)"/;

// One request's limit. A lookup is one or two requests.
const REQUEST_TIMEOUT_MS = 10_000;

// "missing" is a real answer (no slug, no image, a non-2xx) and is stamped,
// so the row waits a week. "error" (a request aborted by its timeout or the
// run's deadline, or a network failure) says nothing about the film and is
// not stamped: the row is simply tried on the next run.
export type PosterLookup =
  | { status: "found"; poster: string }
  | { status: "missing" }
  | { status: "error"; error: string };

// A request never runs past the deadline.
const requestSignal = (deadline: number) =>
  AbortSignal.timeout(Math.max(0, Math.min(REQUEST_TIMEOUT_MS, deadline - Date.now())));

// The film page's JSON-LD image, at the archive crop. Imported rows link to
// a boxd.it short URL: only its redirect's Location is read (profile pages
// 403 server requests; film pages don't).
export async function resolvePoster(
  fetchImpl: typeof globalThis.fetch,
  link: string,
  deadline = Number.POSITIVE_INFINITY,
): Promise<PosterLookup> {
  try {
    let slug = filmSlug(link);
    if (!slug && /^https:\/\/boxd\.it\//.test(link)) {
      const response = await fetchImpl(link, {
        redirect: "manual",
        headers: { "User-Agent": USER_AGENT },
        signal: requestSignal(deadline),
      });
      await response.body?.cancel().catch(() => {});
      slug = filmSlug(response.headers.get("location") ?? "");
    }
    if (!slug) return { status: "missing" };
    const html = await fetchText(fetchImpl, `https://letterboxd.com/film/${slug}/`, { signal: requestSignal(deadline) });
    const image = JSON_LD_IMAGE.exec(html)?.[1]?.replace(/\\\//g, "/") ?? "";
    const poster = posterCrop(httpUrl(image));
    return poster ? { status: "found", poster } : { status: "missing" };
  } catch (e) {
    if (e instanceof HttpError) return { status: "missing" };
    return { status: "error", error: e instanceof Error ? e.message : String(e) };
  }
}

// A failed lookup is not retried for a week, so permanent failures stop
// crowding the newest-first window.
const RETRY_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fills posters on the newest film rows that have none, one request chain at
// a time. A row with no poster to find stays empty, is stamped with
// posterTriedAt and is tried again after a week; a row whose lookup errored
// is not stamped. Stops before a row that might not finish by `deadline`
// (epoch ms; Infinity for the import script).
export async function fillPosters(
  store: LifeLogStore,
  fetchImpl: typeof globalThis.fetch,
  { limit, delayMs = 0, at, deadline }: { limit: number; delayMs?: number; at: Date; deadline: number },
): Promise<{ filled: number; failed: number; errors: number }> {
  const missing = (await store.list("letterboxd"))
    .filter((row) => {
      const film = filmDataSchema.safeParse(row.data).data;
      if (film?.poster) return false;
      const tried = film?.posterTriedAt ? Date.parse(film.posterTriedAt) : Number.NaN;
      return Number.isNaN(tried) || at.getTime() - tried >= RETRY_AFTER_MS;
    })
    .slice(0, limit);
  let filled = 0;
  let failed = 0;
  let errors = 0;
  for (const [index, row] of missing.entries()) {
    if (index > 0 && delayMs > 0) await sleep(delayMs);
    if (Date.now() + REQUEST_TIMEOUT_MS > deadline) break;
    const lookup = await resolvePoster(fetchImpl, String(row.data.link ?? ""), deadline);
    if (lookup.status === "error") {
      errors++;
      continue;
    }
    if (lookup.status === "missing") {
      failed++;
      await store.upsert([{ ...row, data: { posterTriedAt: at.toISOString() } }], { redate: false, at });
      continue;
    }
    await store.upsert([{ ...row, data: { poster: lookup.poster } }], { redate: false, at });
    filled++;
  }
  return { filled, failed, errors };
}
