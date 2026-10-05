export const USER_AGENT = "Mozilla/5.0 (compatible; onursenture.com-sync/2.0)";
// Keep one slow upstream from eating the whole sync request.
const TIMEOUT_MS = 10_000;

// A non-2xx response. Callers that expect a status (a 404 feed) can check it.
export class HttpError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`${url} returned ${status}`);
    this.name = "HttpError";
  }
}

// Later inits win. Accepts every HeadersInit form: plain objects, Headers
// instances and [name, value] tuples (a spread drops the last two).
function mergeHeaders(...inits: (HeadersInit | undefined)[]): Headers {
  const headers = new Headers();
  for (const init of inits) {
    if (init) new Headers(init).forEach((value, name) => headers.set(name, value));
  }
  return headers;
}

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
    headers: mergeHeaders({ "User-Agent": USER_AGENT }, init.headers),
  });
  if (!response.ok) throw new HttpError(url, response.status);
  return response.text();
}

export async function fetchJson(
  fetchImpl: typeof globalThis.fetch,
  url: string,
  init: RequestInit = {},
): Promise<unknown> {
  const text = await fetchText(fetchImpl, url, {
    ...init,
    headers: mergeHeaders({ Accept: "application/json" }, init.headers),
  });
  return JSON.parse(text);
}

// An upstream URL is rendered only when it is http(s): never javascript:,
// data: or a relative path. Returns the trimmed input unchanged, or "".
export function httpUrl(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  try {
    const { protocol } = new URL(trimmed);
    return protocol === "http:" || protocol === "https:" ? trimmed : "";
  } catch {
    return "";
  }
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
