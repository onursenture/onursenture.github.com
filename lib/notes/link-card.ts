import * as cheerio from "cheerio";
import { hostname } from "@/lib/sources/http";
import type { NoteLinkCard } from "./types";

// A note's link card (spec §4.4), fetched once when the author adds the link
// and stored in the note; nothing is fetched at render time. A page that
// fails, times out or isn't HTML still gives a card: the URL and its host.

const TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 1_000_000;
const USER_AGENT = "Mozilla/5.0 (compatible; onursenture.com-notes/1.0)";

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

export function parseLinkCard(html: string, url: string): NoteLinkCard {
  const $ = cheerio.load(html);
  const meta = (name: string) => ($(`meta[property="${name}"]`).attr("content") ?? $(`meta[name="${name}"]`).attr("content") ?? "").trim();
  return {
    kind: "link",
    url,
    title: clip(meta("og:title") || $("title").first().text().trim(), 300),
    description: clip(meta("og:description") || meta("description"), 1000),
    siteName: clip(meta("og:site_name") || hostname(url), 200),
  };
}

function bareCard(url: string): NoteLinkCard {
  return { kind: "link", url, title: "", description: "", siteName: hostname(url) };
}

// Reads at most `max` bytes, so a huge page can't hold the action.
async function readCapped(response: Response, max: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < max) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => undefined);
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, max));
}

export async function fetchLinkCard(url: string, fetchImpl: typeof fetch = globalThis.fetch): Promise<NoteLinkCard | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const href = parsed.toString();
  try {
    const response = await fetchImpl(href, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
    if (!response.ok || !(response.headers.get("content-type") ?? "").includes("text/html")) return bareCard(href);
    return parseLinkCard(await readCapped(response, MAX_HTML_BYTES), href);
  } catch {
    return bareCard(href);
  }
}
