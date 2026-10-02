const USER_AGENT = "Mozilla/5.0 (compatible; onursenture.com-sync/2.0)";
// Keep one slow upstream from eating the whole sync request.
const TIMEOUT_MS = 10_000;

// Fetch a URL and return its body as text, throwing on non-2xx so callers
// never parse an error page as data.
export async function fetchText(
  fetchImpl: typeof globalThis.fetch,
  url: string,
  init: RequestInit = {},
): Promise<string> {
  const response = await fetchImpl(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...init,
    headers: { "User-Agent": USER_AGENT, ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.text();
}

export async function fetchJson(
  fetchImpl: typeof globalThis.fetch,
  url: string,
  init: RequestInit = {},
): Promise<unknown> {
  const text = await fetchText(fetchImpl, url, {
    ...init,
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
  });
  return JSON.parse(text);
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Convert any parseable date string to ISO 8601; empty string if unusable.
export function toIso(value: string | undefined | null): string {
  if (!value) return "";
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? "" : new Date(time).toISOString();
}
