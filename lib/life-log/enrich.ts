import * as cheerio from "cheerio";
import { HttpError, USER_AGENT, httpUrl } from "../sources/http";
import type { Enrichment, EnrichmentStore } from "./types";

const TIMEOUT_MS = 8_000;
const MAX_BYTES = 300_000;
const RETRY_AFTER_MS = 7 * 86_400_000;

const clean = (value: string | undefined) => {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  return text || null;
};

export function parseMeta(html: string, pageUrl: string) {
  const $ = cheerio.load(html);
  const meta = (...names: string[]) => {
    for (const name of names) {
      const value = $(`meta[property="${name}"], meta[name="${name}"]`).first().attr("content");
      if (value?.trim()) return value;
    }
    return undefined;
  };
  let imageUrl: string | null = null;
  const rawImage = meta("og:image", "og:image:url", "twitter:image");
  if (rawImage) {
    try {
      imageUrl = httpUrl(new URL(rawImage.trim(), pageUrl).toString()) || null;
    } catch {
      imageUrl = null;
    }
  }
  const width = Number.parseInt(meta("og:image:width") ?? "", 10);
  return {
    title: clean(meta("og:title", "twitter:title")),
    description: clean(meta("og:description", "twitter:description", "description")),
    imageUrl,
    imageWidth: imageUrl && Number.isFinite(width) ? width : null,
    siteName: clean(meta("og:site_name")),
  };
}

// The head is all we need: read at most 300 KB, then stop the download.
async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => {});
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes.subarray(0, MAX_BYTES));
}

const blank = { title: null, description: null, imageUrl: null, imageWidth: null, siteName: null };

export async function enrichUrl(fetchImpl: typeof globalThis.fetch, url: string, now: Date): Promise<Enrichment> {
  const fetchedAt = now.toISOString();
  try {
    const response = await fetchImpl(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new HttpError(url, response.status);
    return { url, ...parseMeta(await readCapped(response), response.url || url), fetchedAt, error: null };
  } catch (e) {
    return { url, ...blank, fetchedAt, error: e instanceof Error ? e.message : String(e) };
  }
}

// URLs with no row, or whose row errored more than 7 days ago, up to `limit`.
export async function enrichPending(
  store: EnrichmentStore,
  fetchImpl: typeof globalThis.fetch,
  urls: string[],
  now: Date,
  limit = 10,
): Promise<{ fetched: number; failed: number }> {
  const known = new Map((await store.all()).map((row) => [row.url, row]));
  const pending = urls
    .filter((url) => {
      const row = known.get(url);
      return !row || (row.error !== null && now.getTime() - Date.parse(row.fetchedAt) > RETRY_AFTER_MS);
    })
    .slice(0, limit);
  let fetched = 0;
  let failed = 0;
  for (const url of pending) {
    const enrichment = await enrichUrl(fetchImpl, url, now);
    await store.put(enrichment);
    if (enrichment.error) failed++;
    else fetched++;
  }
  return { fetched, failed };
}
