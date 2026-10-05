# Sprint 10: Life archives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build four Life archive pages and wire them into `/life/`:
- `/life/films/` (one page per year, plus `/life/films/undated/`);
- `/life/books/`;
- `/life/theatre/`;
- `/life/saved/`.

**Architecture:**
- **Snapshot sources.** Sources keep their snapshot model. A source may declare an optional `archive` step, which `syncSource` runs after a successful sync with the database stores it needs.
- **Two new tables.**
  - `life_log` accumulates Films (from a one-time Letterboxd CSV import plus RSS) and Theatre (from a committed history file plus a new `theatre` source over tiyatrolar.com.tr's activity endpoint).
  - `link_enrichments` holds og:image and og:description for Saved.
- **Page reads.** Pages read through cached, tagged functions. Pure view functions group the rows into years, months and tiles. Shared archive components render them on the existing Sprint 4 grid.

**Tech Stack:** Next.js 16 (`cacheComponents`, `"use cache"`), Drizzle on Neon (PGlite in tests), zod 4, cheerio, rss-parser, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-05-sprint-10-life-archives-design.md` (mockups in `2026-10-05-sprint-10-mockups/`).

## Global Constraints

- **No ratings render anywhere.** `grep -rn "★" app components lib` stays empty. Parsers may keep rating fields.
- **Film captions** are the title, then `Sep 8` (watch day), with ` · ↻` on a rewatch. **No release year** in film captions on the archive pages.
- **Book captions** are title · author · read day. A series suffix like ` (Harry Potter, #7)` is dropped from the caption; the full title goes in the tile's `title` attribute.
- **Theatre captions** are title · company. Years only, with no months. The oldest backfilled year carries `and earlier`.
- **Every count** shown is the real number of items in that group, never a capped sample. The singular is used for 1 (`1 film`, `9 films`).
- **Saved** is named "Saved" at `/life/saved/`, never "Reading".
- **Ledes are drafts:**

  | Page | Lede |
  |---|---|
  | Films | "What I watched." |
  | Books | "What I read." |
  | Theatre | "Plays I saw." |
  | Saved | "Articles I liked." |

- **Links.**
  - `trailingSlash: true`: every internal link ends with `/`.
  - External links use `rel="noopener noreferrer"`.
  - Glyphs: `→` internal, `↗` external (added by `TextLink`).
- **Fonts and type.** Only IBM Plex Mono, IBM Plex Sans and Doto. Type comes only from the `type-*` classes; tokens only (no Tailwind palette colours).
- **External fetchers.**
  - A fetcher **throws** on failure, and never fetches during render.
  - The archive and enrichment steps never throw for a single item: per-item failures are counted.
- **Migrations are expand-only.** Add tables and columns; never drop.
- **Commits.**
  - Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  - No "Task N" prefixes in subjects.
- **Scripts.** Modules imported by `scripts/*.ts` (run by `tsx`) must not import `server-only` and must use **relative** imports, not `@/`.
- **Rules from `CLAUDE.md`.**
  - Pages never read `cookies()` or `headers()`.
  - A GET route that reads env per request needs `await connection()`.
  - After a client navigation, e2e counts use `:visible` or role locators.

## Spike results (done during planning, 2026-10-05)

- `fetch("https://boxd.it/2bg8", { redirect: "manual" })` returns **302**, with `Location: https://letterboxd.com/film/heat-1995/`.
- `https://letterboxd.com/film/pickled/` answers a plain server `fetch` with **200**. The page JSON-LD has `"image":"https://a.ltrbxd.com/resized/film-poster/…-0-600-0-900-crop.jpg?v=…"`. Profile pages (`letterboxd.com/onur/`) return **403**: never fetch them.
- RSS item links are `https://letterboxd.com/onur/film/<slug>/`, so the slug comes straight from the link.
- The tiyatrolar endpoint `POST https://tiyatrolar.com.tr/posts/load_more_user_item_via_ajax/` accepts form fields:

  ```
  item_type=user_item&page=activity&lazy_load=1&username=onursenture&item_type_detail=&is_locked=0&area=area_wall&wall_type=wall&controller=posts&limit=5&user_id=1702&query=&offset=<n>
  ```

  - It answers the site's own sync user agent, with or without `X-Requested-With`.
  - The response is `{"sta":1,"msg":"Başarılı","html":"<li class=\"postli_…\">…","html_btn":true,"new_offset":5}`.
  - It returns 5 items per call whatever `limit` says.
  - The full crawl has 272 activity items and 77 "tiyatro izledi" posts. The 17 watches marked "11 yıl önce" have ids 94778–94791.
- tiyatrolar posters at `…/files/activity/<l>/<slug>/image/<slug>.jpg` (the `-41x59` suffix removed) return 200 with `cache-control: public`. They rendered hot-linked in the brainstorm companion.

## File structure

| File | Responsibility |
|---|---|
| `lib/sources/http.ts` (modify) | Header merging, `HttpError`, `httpUrl()` validation |
| `lib/sources/github.ts`, `writing.ts`, `goodreads.ts`, `instapaper.ts`, `letterboxd.ts` (modify) | Hardening and paging; the `archive` steps for Letterboxd and Instapaper |
| `lib/sources/theatre.ts` (new) | The tiyatrolar source: fragment parser, incremental fetch, archive step |
| `lib/sources/types.ts`, `registry.ts`, `fixtures.ts` (modify) | The `theatre` id; `ArchiveStores` / `archive` on `SourceDefinition` |
| `lib/db/schema.ts` + `drizzle/0003_*.sql` | `life_log`, `link_enrichments`, `source_snapshots.archive_note` |
| `lib/life-log/types.ts` | `LifeLogRow`, `LifeLogStore`, `Enrichment`, `EnrichmentStore` |
| `lib/life-log/drizzle-store.ts`, `memory-store.ts` | Store implementations (no `server-only`) |
| `lib/life-log/tags.ts` | Cache tags `life:<source>` and `enrichments` |
| `lib/life-log/films.ts` | Film keys, `filmRows`, `posterCrop`, `filmDataSchema` |
| `lib/life-log/letterboxd-csv.ts` | CSV parser and export → rows |
| `lib/life-log/posters.ts` | `resolvePoster`, `fillPosters` |
| `lib/life-log/relative-year.ts` | "5 ay önce" → year |
| `lib/life-log/enrich.ts` | og: metadata parse and the enrichment batch |
| `lib/life-log/read.ts` | `readLifeLog`, `readEnrichments` (`"use cache"`, server-only) |
| `lib/life/archive.ts` | Pure views: year/month grouping, films, books, theatre, saved |
| `content/theatre-history.ts` | The 77 backfilled watches with their years (generated, then checked by Onur) |
| `scripts/import-letterboxd.ts`, `scripts/theatre-history.ts` | One-off controller scripts |
| `lib/sync/run.ts`, `respond.ts`, `context.ts`, `store.ts`, `memory-store.ts`, `drizzle-store.ts` (modify) | Run the archive step, record its note, revalidate its tags |
| `components/life/archive/*` | `ArchiveHeader`, `ArchiveTile`, `TileFallback`, `YearMonths`, `TheatreYears`, `YearIndex`, `SavedList`, and the four page bodies |
| `app/life/films/page.tsx`, `films/[year]/page.tsx`, `books/page.tsx`, `theatre/page.tsx`, `saved/page.tsx` | Routes |
| `components/sections/*` (modify) + `components/sections/theatre/index.tsx` | Life home sections |
| `lib/life/readout.ts`, `app/life/page.tsx` (modify) | `last play:` line; hiding Writing while it is empty |
| `components/admin/sources-panel.tsx`, `lib/admin/sources.ts`, `app/admin/actions.ts` (modify) | Archive note and tag revalidation in the admin |

---

## Task 1: Onur's Letterboxd export (controller)

The controller does this, not a subagent. It can run while Tasks 2–8 are executed.

- [ ] **Step 1: Ask Onur for the export** (AskUserQuestion, in Turkish):

  > "Letterboxd → Settings → Import & Export → Export your data ile zip'i indirip yolunu yazar mısın?"

  Options: "İndirdim, yolu notlara yazıyorum" / "Sonra".
- [ ] **Step 2: Store the zip** at `../letterboxd-export.zip`, outside the repo, so it is never committed. Run `unzip -l` on it and confirm it lists `diary.csv` and `watched.csv`.
- [ ] **Step 3: Note the headers.** Run `unzip -p ../letterboxd-export.zip diary.csv | head -3` and `… watched.csv | head -3`. Expected headers:
  - `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date`
  - `Date,Name,Year,Letterboxd URI`

  If they differ, record the actual headers in the ledger and tell the Task 5 implementer.

The theatre year check with Onur comes after Task 6 (see Task 13).

---

## Task 2: Source hardening (http, GitHub, Writing)

**Files:**
- Modify: `lib/sources/http.ts`
- Modify: `lib/sources/github.ts`
- Modify: `lib/sources/writing.ts`
- Modify: `tests/fixtures/github.json`
- Test: `tests/sources/http.test.ts` (new), `tests/sources/github.test.ts`, `tests/sources/writing.test.ts`

**Interfaces:**
- Produces:
  - `class HttpError extends Error { url: string; status: number }`, thrown by `fetchText` and `fetchJson` on non-2xx;
  - `httpUrl(value: string | null | undefined): string`, which returns the trimmed value when it parses as an `http:`/`https:` URL, else `""`;
  - `fetchText(fetchImpl, url, init?)`, now merging `Headers` instances and tuple arrays;
  - `export const USER_AGENT`.

- [ ] **Step 1: Write the failing http tests**

Create `tests/sources/http.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { HttpError, fetchJson, fetchText, httpUrl } from "@/lib/sources/http";

function recordingFetch(status = 200, body = "ok") {
  const calls: { url: string; headers: Headers }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), headers: new Headers(init?.headers) });
    return new Response(body, { status });
  }) as typeof globalThis.fetch;
  return { impl, calls };
}

describe("fetchText", () => {
  it("merges Headers instances and tuple arrays with the user agent", async () => {
    const { impl, calls } = recordingFetch();
    await fetchText(impl, "https://a.test/", { headers: new Headers({ "X-One": "1" }) });
    await fetchText(impl, "https://a.test/", { headers: [["X-Two", "2"]] });
    expect(calls[0].headers.get("x-one")).toBe("1");
    expect(calls[0].headers.get("user-agent")).toMatch(/onursenture/);
    expect(calls[1].headers.get("x-two")).toBe("2");
    expect(calls[1].headers.get("user-agent")).toMatch(/onursenture/);
  });

  it("throws an HttpError carrying the status", async () => {
    const { impl } = recordingFetch(404, "Not found");
    const error = await fetchText(impl, "https://a.test/x").catch((e) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(404);
    expect(error.message).toBe("https://a.test/x returned 404");
  });

  it("fetchJson keeps an explicit Accept and adds the user agent", async () => {
    const { impl, calls } = recordingFetch(200, "{}");
    await fetchJson(impl, "https://a.test/", { headers: { Accept: "text/plain" } });
    expect(calls[0].headers.get("accept")).toBe("text/plain");
    expect(calls[0].headers.get("user-agent")).toMatch(/onursenture/);
  });
});

describe("httpUrl", () => {
  it("keeps http and https URLs as given", () => {
    expect(httpUrl(" https://a.test/x?y=1 ")).toBe("https://a.test/x?y=1");
    expect(httpUrl("http://a.test")).toBe("http://a.test");
  });
  it("drops anything else", () => {
    for (const bad of ["javascript:alert(1)", "data:image/png;base64,AA", "//a.test/x", "/x", "", null, undefined]) {
      expect(httpUrl(bad)).toBe("");
    }
  });
});
```

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/sources/http.test.ts`
Expected: FAIL. `HttpError` and `httpUrl` aren't exported, and the tuple header is missing.

- [ ] **Step 3: Implement in `lib/sources/http.ts`**

Replace the top of the file, through the end of `fetchJson`, with:

```ts
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
```

Leave `hostname` and `toIso` as they are.

- [ ] **Step 4: Run the http tests and see them pass**

Run: `npx vitest run tests/sources/http.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Rewrite the GitHub fixture for `contributionLevel`**

Replace `tests/fixtures/github.json` with:

```json
{
  "data": {
    "user": {
      "contributionsCollection": {
        "contributionCalendar": {
          "totalContributions": 7,
          "weeks": [
            { "contributionDays": [
              { "contributionCount": 0, "date": "2026-09-27", "contributionLevel": "NONE" },
              { "contributionCount": 1, "date": "2026-09-28", "contributionLevel": "FIRST_QUARTILE" },
              { "contributionCount": 2, "date": "2026-09-29", "contributionLevel": "SECOND_QUARTILE" }
            ] },
            { "contributionDays": [
              { "contributionCount": 4, "date": "2026-09-30", "contributionLevel": "FOURTH_QUARTILE" },
              { "contributionCount": 0, "date": "2026-10-01", "contributionLevel": "SOMETHING_NEW" }
            ] }
          ]
        }
      }
    }
  }
}
```

- [ ] **Step 6: Update the GitHub tests**

In `tests/sources/github.test.ts`:
- Replace the first `it(...)` with the version below.
- Add the errors test inside `describe("parseGithub")`.

```ts
  it("maps contributionLevel to 0–4, unknown levels to 0", () => {
    const data = parseGithub(JSON.parse(fixture("github.json")));
    expect(data.total).toBe(7);
    expect(data.weeks.flatMap((w) => w.days.map((d) => d.level))).toEqual([0, 1, 2, 4, 0]);
    expect(data.weeks[0].days[1]).toEqual({ count: 1, date: "2026-09-28", level: 1 });
  });

  it("surfaces the first GraphQL error message", () => {
    expect(() => parseGithub({ data: null, errors: [{ message: "Bad credentials" }] })).toThrow(
      "GitHub GraphQL: Bad credentials",
    );
  });
```

- [ ] **Step 7: Implement the GitHub changes in `lib/sources/github.ts`**

1. In `QUERY`, replace `contributionDays { contributionCount date color }` with `contributionDays { contributionCount date contributionLevel }`.
2. Replace the `COLOR_TO_LEVEL` comment and constant with:

   ```ts
   // GitHub's own quartile for each day (ContributionLevel enum), mapped to 0–4
   // so the heatmap matches github.com. An unknown value counts as 0.
   const LEVELS: Record<string, number> = {
     NONE: 0,
     FIRST_QUARTILE: 1,
     SECOND_QUARTILE: 2,
     THIRD_QUARTILE: 3,
     FOURTH_QUARTILE: 4,
   };

   const errorsSchema = z.object({ errors: z.array(z.object({ message: z.string() })).min(1) });
   ```

3. In `responseSchema`, replace `color: z.string().nullish(),` with `contributionLevel: z.string().nullish(),`.
4. In `parseGithub`, add the errors check as the first statement, and change the level line:

   ```ts
   export function parseGithub(json: unknown): Contributions {
     const failed = errorsSchema.safeParse(json);
     if (failed.success) throw new Error(`GitHub GraphQL: ${failed.data.errors[0].message}`);
     const calendar =
       responseSchema.parse(json).data.user.contributionsCollection
         .contributionCalendar;
     return {
       total: calendar.totalContributions,
       weeks: calendar.weeks.map((week) => ({
         days: week.contributionDays.map((day) => ({
           count: day.contributionCount,
           date: day.date,
           level: LEVELS[day.contributionLevel ?? ""] ?? 0,
         })),
       })),
     };
   }
   ```

- [ ] **Step 8: Write the failing Writing tests**

Append to `tests/sources/writing.test.ts`:

```ts
import { writing } from "@/lib/sources/writing";
import { fakeFetch } from "../helpers/fixtures";

describe("writing.fetch", () => {
  it("treats a 404 feed as no posts yet (w00f.org has none)", async () => {
    const fetch = fakeFetch({});
    expect(await writing.fetch({ fetch, env: {} })).toEqual([]);
  });

  it("still throws on other failures", async () => {
    const fetch = fakeFetch({ "https://w00f.org/feed/": { status: 500, body: "oops" } });
    await expect(writing.fetch({ fetch, env: {} })).rejects.toThrow("returned 500");
  });

  it("drops entries whose link is not http(s)", async () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Bad</title><link href="javascript:alert(1)"/><updated>2026-09-20T10:00:00Z</updated></entry></feed>`;
    const fetch = fakeFetch({ "https://w00f.org/feed/": { body: xml } });
    expect(await writing.fetch({ fetch, env: {} })).toEqual([]);
  });
});
```

Merge the two new imports into the file's existing import block at the top. `fakeFetch` already exists in `tests/helpers/fixtures.ts`.

- [ ] **Step 9: Implement the Writing changes in `lib/sources/writing.ts`**

Replace the imports, `parseWriting` and the `fetch` line:

```ts
import Parser from "rss-parser";
import { z } from "zod";
import { HttpError, fetchText, httpUrl, toIso } from "./http";
import type { SourceDefinition } from "./types";
```

```ts
export async function parseWriting(xml: string): Promise<Post[]> {
  const feed = await new Parser().parseString(xml);
  return feed.items
    .slice(0, LIMIT)
    .map((item) => ({
      title: (item.title ?? "").trim(),
      link: httpUrl(item.link || item.id),
      date: toIso(item.isoDate ?? item.pubDate),
    }))
    .filter((post) => post.link);
}

// w00f.org has no posts yet, and Bear Blog answers 404 for an empty blog's
// feed. That is "no posts", not an error: the Life section hides until the
// first post. Any other failure still throws (the snapshot is kept).
async function fetchWriting(fetchImpl: typeof globalThis.fetch): Promise<Post[]> {
  try {
    return await parseWriting(await fetchText(fetchImpl, FEED_URL));
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return [];
    throw e;
  }
}
```

In the definition, use `fetch: ({ fetch }) => fetchWriting(fetch),`.

- [ ] **Step 10: Run the source tests**

Run: `npx vitest run tests/sources`
Expected: PASS. The existing `parseWriting` fixture test still passes, because both fixture links are https.

- [ ] **Step 11: Typecheck, lint and commit**

```bash
npm run typecheck && npm run lint
git add lib/sources/http.ts lib/sources/github.ts lib/sources/writing.ts tests/sources/http.test.ts tests/sources/github.test.ts tests/sources/writing.test.ts tests/fixtures/github.json
git commit -m "Harden fetches: merged headers, http(s)-only URLs, GitHub levels, an empty w00f.org

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 3: Paging and complete data for Goodreads, Instapaper and Letterboxd

**Files:**
- Modify: `lib/sources/goodreads.ts`
- Modify: `lib/sources/instapaper.ts`
- Modify: `lib/sources/letterboxd.ts`
- Modify: `lib/sources/fixtures.ts`
- Modify: `components/sections/films/index.tsx`
- Modify: `components/sections/books/index.tsx`
- Modify: `components/sections/articles/index.tsx`
- Test: `tests/sources/goodreads.test.ts`, `tests/sources/instapaper.test.ts`, `tests/sources/letterboxd.test.ts`

**Interfaces:**
- Consumes: `fetchText`, `fetchJson` and `httpUrl` from Task 2.
- Produces:
  - **`Book`** gains `readAt: string` (ISO, or `""` when the shelf has no read date) and `addedAt: string` (ISO). `date` keeps meaning `readAt || addedAt`. Both new fields have zod `.default("")`, so stored snapshots keep parsing.
  - **`Books.read`** holds **every** read book, newest first by `date`.
  - **`Film`** gains `rewatch: boolean` (zod `.default(false)`). The `letterboxd` snapshot keeps **all** RSS items (up to 50).
  - **`Article[]`** holds every liked bookmark across pages, in API order. The `instapaper` snapshot keeps all of them.
  - **Home sections** slice for themselves: films 6, books read 5, articles 5.

- [ ] **Step 1: Write the failing Goodreads tests**

Append to `tests/sources/goodreads.test.ts`:

```ts
import { goodreads, parseGoodreadsShelf } from "@/lib/sources/goodreads";
import { fakeFetch } from "../helpers/fixtures";

const item = (title: string, readAt: string, added: string, review = "") => `
  <item>
    <title>${title}</title>
    <link>https://www.goodreads.com/review/show/${title.length}</link>
    <pubDate>${added}</pubDate>
    <author_name>Someone</author_name>
    <book_image_url>https://i.gr-assets.com/x._SY75_.jpg</book_image_url>
    <user_rating>0</user_rating>
    <user_read_at>${readAt}</user_read_at>
    <user_review><![CDATA[${review}]]></user_review>
  </item>`;
const shelf = (...items: string[]) => `<?xml version="1.0"?><rss version="2.0"><channel><title>s</title>${items.join("")}</channel></rss>`;

describe("parseGoodreadsShelf dates", () => {
  it("keeps the read date and the shelf-add date apart", async () => {
    const [read, undated] = await parseGoodreadsShelf(
      shelf(
        item("Read one", "Fri, 25 Sep 2026 00:00:00 -0700", "Sat, 26 Sep 2026 10:00:00 -0700"),
        item("No date", "", "Mon, 01 Jun 2026 10:00:00 -0700"),
      ),
    );
    expect(read.readAt).toBe("2026-09-25T07:00:00.000Z");
    expect(read.addedAt).toBe("2026-09-26T17:00:00.000Z");
    expect(read.date).toBe(read.readAt);
    expect(undated.readAt).toBe("");
    expect(undated.date).toBe(undated.addedAt);
  });

  it("turns <br> in a review into line breaks", async () => {
    const [book] = await parseGoodreadsShelf(shelf(item("R", "", "Mon, 01 Jun 2026 10:00:00 -0700", "One<br>Two<br/>Three")));
    expect(book.review).toBe("One\nTwo\nThree");
  });
});

describe("goodreads.fetch", () => {
  it("reads every page of the read shelf until an empty one", async () => {
    const base = "https://www.goodreads.com/review/list_rss/8143905?shelf=";
    const fetch = fakeFetch({
      [`${base}currently-reading`]: { body: shelf() },
      [`${base}read&page=1`]: { body: shelf(item("A", "Fri, 25 Sep 2026 00:00:00 -0700", "Fri, 25 Sep 2026 00:00:00 -0700")) },
      [`${base}read&page=2`]: { body: shelf(item("Bb", "Fri, 21 Aug 2026 00:00:00 -0700", "Fri, 21 Aug 2026 00:00:00 -0700")) },
      [`${base}read&page=3`]: { body: shelf() },
    });
    const books = await goodreads.fetch({ fetch, env: {} });
    expect(books.read.map((b) => b.title)).toEqual(["A", "Bb"]);
  });
});
```

Merge the imports into the file's existing import block.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/sources/goodreads.test.ts`
Expected: FAIL. `parseGoodreadsShelf` requires a limit, `readAt` and `addedAt` are missing, and the fetch reads one page.

- [ ] **Step 3: Implement the Goodreads changes**

In `lib/sources/goodreads.ts`:
- Remove `READ_LIMIT`.
- Add `const MAX_READ_PAGES = 10;`.
- Change `bookSchema`:

  ```ts
  export const bookSchema = z.object({
    title: z.string(),
    author: z.string(),
    cover: z.string(),
    numRating: z.number(),
    review: z.string(),
    link: z.string(),
    // ISO timestamp: the read date when known, else the shelf-add date (the
    // Life home orders by this).
    date: z.string(),
    // ISO read date, "" when the shelf has none (the archive's "Undated").
    // Defaults keep snapshots stored before Sprint 10 parsing.
    readAt: z.string().default(""),
    // ISO shelf-add date.
    addedAt: z.string().default(""),
  });
  ```

- Change the import to `import { fetchText, httpUrl, toIso } from "./http";`.
- Replace `parseGoodreadsShelf` with:

  ```ts
  export async function parseGoodreadsShelf(xml: string, limit = Infinity): Promise<Book[]> {
    const parser = new Parser<Record<string, never>, GoodreadsItem>({
      customFields: {
        item: [
          ["book_image_url", "bookImageUrl"],
          ["author_name", "authorName"],
          ["user_rating", "userRating"],
          ["user_review", "userReview"],
          ["user_read_at", "userReadAt"],
        ],
      },
    });
    const feed = await parser.parseString(xml);

    const books = feed.items.map((item) => {
      const numRating = Number.parseInt(item.userRating ?? "", 10) || 0;
      const rawCover =
        item.bookImageUrl ||
        cheerio.load(item.content ?? "")("img").attr("src") ||
        "";
      const readAt = toIso(item.userReadAt);
      const addedAt = toIso(item.pubDate);
      // <br> would otherwise glue paragraphs together in .text().
      const review = item.userReview
        ? cheerio.load(item.userReview.replace(/<br\s*\/?>/gi, "\n")).text().trim()
        : "";
      return {
        title: (item.title ?? "").trim(),
        author: (item.authorName ?? "").trim(),
        cover: rawCover ? httpUrl(upgradeCover(rawCover)) : "",
        numRating,
        // Only the explicit review field; the old description-scraping
        // fallback picked up book blurbs and is intentionally gone.
        review,
        link: httpUrl(item.link),
        date: readAt || addedAt,
        readAt,
        addedAt,
      };
    });

    // The feed is ordered by shelf-add date; rank by the date shown instead.
    books.sort((a, b) => dateValue(b.date) - dateValue(a.date));
    return books.slice(0, limit);
  }

  // Every page of the read shelf (100 books each) until an empty page.
  async function readShelf(fetchImpl: typeof globalThis.fetch, userId: string): Promise<Book[]> {
    const books: Book[] = [];
    for (let page = 1; page <= MAX_READ_PAGES; page++) {
      const batch = await parseGoodreadsShelf(await fetchText(fetchImpl, `${shelfUrl(userId, "read")}&page=${page}`));
      if (batch.length === 0) break;
      books.push(...batch);
    }
    books.sort((a, b) => dateValue(b.date) - dateValue(a.date));
    return books;
  }
  ```

- Replace the definition's `fetch` with:

  ```ts
    fetch: async ({ fetch, env }) => {
      const userId = env.GOODREADS_USER_ID || DEFAULT_USER_ID;
      const [currentlyXml, read] = await Promise.all([
        fetchText(fetch, shelfUrl(userId, "currently-reading")),
        readShelf(fetch, userId),
      ]);
      // The read shelf is never legitimately empty for this account, so an
      // empty one means a bad response. (Currently-reading may well be empty.)
      if (read.length === 0) throw new Error("goodreads read shelf returned no books");
      return {
        currentlyReading: await parseGoodreadsShelf(currentlyXml, CURRENTLY_READING_LIMIT),
        read,
      };
    },
  ```

- [ ] **Step 4: Update the fixture loader**

In `lib/sources/fixtures.ts`:
- Delete `READ_LIMIT` and its comment line.
- Change the goodreads loader's read line to `read: await parseGoodreadsShelf(await readFixture("goodreads-read.xml")),`.

- [ ] **Step 5: Run the Goodreads tests**

Run: `npx vitest run tests/sources/goodreads.test.ts`
Expected: PASS. If an existing test asserted the 5-item cap, change it to assert all fixture items (3).

- [ ] **Step 6: Write the failing Instapaper tests**

Append to `tests/sources/instapaper.test.ts`:

```ts
import { instapaper } from "@/lib/sources/instapaper";
import { fakeFetch } from "../helpers/fixtures";

const bookmark = (n: number, extra: Record<string, unknown> = {}) => ({
  url: `https://site${n}.test/a`,
  title: `Article ${n}`,
  site_name: `site${n}.test`,
  words: 100,
  time: 1784190218,
  estimated_total_time: 3,
  ...extra,
});

describe("parseInstapaper resilience", () => {
  it("skips a bookmark with a bad field instead of failing the page", () => {
    const articles = parseInstapaper({ bookmarks: [bookmark(1), bookmark(2, { words: "lots" }), bookmark(3)] });
    expect(articles.map((a) => a.title)).toEqual(["Article 1", "Article 3"]);
  });

  it("drops non-http links and images", () => {
    const [a] = parseInstapaper({ bookmarks: [bookmark(1, { og_image: "data:image/png;base64,AA" })] });
    expect(a.image).toBeNull();
    expect(parseInstapaper({ bookmarks: [bookmark(2, { url: "javascript:x" })] })).toEqual([]);
  });
});

describe("instapaper.fetch", () => {
  it("follows has_next across pages", async () => {
    const page = (n: number) => `https://www.instapaper.com/data/profile/w00f?page=${n}`;
    const fetch = fakeFetch({
      [page(1)]: { body: JSON.stringify({ bookmarks: [bookmark(1), bookmark(2)], has_next: true }) },
      [page(2)]: { body: JSON.stringify({ bookmarks: [bookmark(3)], has_next: false }) },
    });
    const articles = await instapaper.fetch({ fetch, env: {} });
    expect(articles.map((a) => a.title)).toEqual(["Article 1", "Article 2", "Article 3"]);
  });
});
```

Merge the imports into the existing import block. Next, check the existing "maps card fields" test. Its expected image `https://blog.unitedheroes.net/JRS_128x128.jpg` stays, because the small-image rule belongs to the Saved view (Task 8), not the parser.

- [ ] **Step 7: Implement the Instapaper changes**

Rewrite `lib/sources/instapaper.ts` from the `PROFILE_URL` line down. Keep `articleSchema`, `articlesSchema` and `Article` as they are.

```ts
import { z } from "zod";
import { fetchJson, hostname, httpUrl } from "./http";
import type { SourceDefinition } from "./types";

// The public profile (instapaper.com/p/w00f) is a client-rendered SPA; this
// is the JSON endpoint it calls. It works unauthenticated and pages with
// ?page=n while has_next is true.
const PROFILE_URL = "https://www.instapaper.com/data/profile/w00f";
const MAX_PAGES = 10;

// …articleSchema, articlesSchema, Article unchanged…

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
};
```

Keep any fields of the existing definition that this listing doesn't show, such as its `empty` and `count` comments.

- [ ] **Step 8: Write the failing Letterboxd test**

Append to `tests/sources/letterboxd.test.ts`:

```ts
describe("parseLetterboxd rewatch and limit", () => {
  const entry = (n: number, rewatch: "Yes" | "No") => `
    <item>
      <title>Film ${n}, 2020</title>
      <link>https://letterboxd.com/onur/film/film-${n}/</link>
      <pubDate>Sat, 26 Sep 2026 10:00:00 +1200</pubDate>
      <letterboxd:watchedDate>2026-09-${String(n).padStart(2, "0")}</letterboxd:watchedDate>
      <letterboxd:rewatch>${rewatch}</letterboxd:rewatch>
      <letterboxd:filmTitle>Film ${n}</letterboxd:filmTitle>
      <letterboxd:filmYear>2020</letterboxd:filmYear>
      <description><![CDATA[<p><img src="https://a.ltrbxd.com/p-${n}-0-600-0-900-crop.jpg"/></p>]]></description>
    </item>`;
  const feed = (items: string) =>
    `<?xml version="1.0"?><rss version="2.0" xmlns:letterboxd="https://letterboxd.com"><channel><title>x</title>${items}</channel></rss>`;

  it("keeps every feed item and reads the rewatch flag", async () => {
    const items = Array.from({ length: 12 }, (_, i) => entry(i + 1, i === 0 ? "Yes" : "No")).join("");
    const films = await parseLetterboxd(feed(items));
    expect(films).toHaveLength(12);
    expect(films[0].rewatch).toBe(true);
    expect(films[1].rewatch).toBe(false);
  });
});
```

The file already imports `parseLetterboxd` and `describe/it/expect`. Check the existing tests; if one asserts the 6-item cap, change it to the fixture's full count (3).

- [ ] **Step 9: Implement the Letterboxd changes**

In `lib/sources/letterboxd.ts`:
- Delete `const LIMIT = 6;`.
- Import `httpUrl`: `import { fetchText, httpUrl, toIso } from "./http";`.
- Add to `filmSchema`, after `date`:

  ```ts
    // A rewatch diary entry. Defaults keep older snapshots parsing.
    rewatch: z.boolean().default(false),
  ```

- Add `rewatch?: string;` to `LetterboxdItem`, and `["letterboxd:rewatch", "rewatch"],` to `customFields.item`.
- Change `feed.items.slice(0, LIMIT).map((item) => {` to `feed.items.map((item) => {`.
- In the returned object, use:

  ```ts
        link: httpUrl(item.link),
        poster: httpUrl($("img").attr("src")),
  ```

  and add `rewatch: item.rewatch === "Yes",`.

- [ ] **Step 10: Make the home sections slice**

`components/sections/films/index.tsx`: change the definition's `load` to:

```ts
  // The snapshot keeps the whole RSS window (it feeds the archive); the home
  // row shows the latest six.
  load: async () => {
    const view = await readSource("letterboxd");
    return { ...view, data: view.data.slice(0, 6) };
  },
```

`components/sections/books/index.tsx`: change `load` to:

```ts
  // The snapshot keeps the whole read shelf (the archive page); the home
  // lists the latest five.
  load: async () => {
    const view = await readSource("goodreads");
    return { ...view, data: { ...view.data, read: view.data.read.slice(0, 5) } };
  },
```

`components/sections/articles/index.tsx`: change `load` to:

```ts
  // Every liked article is on /life/saved/; the home lists the latest five.
  load: async () => {
    const view = await readSource("instapaper");
    return { ...view, data: view.data.slice(0, 5) };
  },
```

- [ ] **Step 11: Run all unit tests, typecheck and lint**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS. `tests/sources/fixtures.test.ts` may assert item counts; if a count changes because limits moved to the sections, update it to the fixture's full count.

- [ ] **Step 12: Commit**

```bash
git add lib/sources components/sections tests/sources
git commit -m "Page through every read book and liked article, keep the whole Letterboxd window

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 4: Tables, stores and the sync archive hook

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0003_*.sql` (generated) and `drizzle/meta/*` (generated)
- Create: `lib/life-log/types.ts`
- Create: `lib/life-log/tags.ts`
- Create: `lib/life-log/drizzle-store.ts`
- Create: `lib/life-log/memory-store.ts`
- Modify: `lib/sources/types.ts`
- Modify: `lib/sync/store.ts`, `lib/sync/memory-store.ts`, `lib/sync/drizzle-store.ts`
- Modify: `lib/sync/run.ts`, `lib/sync/respond.ts`, `lib/sync/context.ts`
- Modify: `app/admin/actions.ts`, `lib/admin/sources.ts`, `components/admin/sources-panel.tsx`
- Test: `tests/helpers/life-log-store-contract.ts` (new), `tests/life-log/stores.test.ts` (new), `tests/sync/run.test.ts`, `tests/sync/drizzle-store.test.ts`, `tests/sync/respond.test.ts`

**Interfaces:**
- Produces (`lib/life-log/types.ts`):

  ```ts
  export const LIFE_LOG_SOURCES = ["letterboxd", "theatre"] as const;
  export type LifeLogSource = (typeof LIFE_LOG_SOURCES)[number];
  export type DatePrecision = "day" | "year" | "none";
  export interface LifeLogRow { source: LifeLogSource; key: string; occurredOn: string | null; precision: DatePrecision; data: Record<string, unknown> }
  export interface UpsertCounts { inserted: number; updated: number }
  export interface LifeLogStore {
    list(source: LifeLogSource): Promise<LifeLogRow[]>;
    keys(source: LifeLogSource): Promise<Set<string>>;
    upsert(rows: LifeLogRow[], options: { redate: boolean; at: Date }): Promise<UpsertCounts>;
  }
  export interface Enrichment { url: string; title: string | null; description: string | null; imageUrl: string | null; imageWidth: number | null; siteName: string | null; fetchedAt: string; error: string | null }
  export interface EnrichmentStore { all(): Promise<Enrichment[]>; put(enrichment: Enrichment): Promise<void> }
  export interface ArchiveStores { lifeLog: LifeLogStore; enrichments: EnrichmentStore }
  ```

- Produces (`lib/life-log/tags.ts`): `lifeLogTag(source: LifeLogSource): string` (`"life:<source>"`) and `ENRICHMENTS_TAG = "enrichments"`.
- Produces (`lib/sources/types.ts`):
  - `SourceContext` gains `stores?: ArchiveStores`.
  - `SourceDefinition<T>` gains `archive?: (data: T, args: ArchiveArgs) => Promise<ArchiveOutcome>`, where `ArchiveArgs = { stores: ArchiveStores; fetch: typeof globalThis.fetch; now: Date }` and `ArchiveOutcome = { note: string; tags: string[] }`.
- Produces (`lib/sync/run.ts`): `SyncResult`'s ok variant becomes `{ source; status: "ok"; itemCount: number; archive?: ArchiveOutcome }`.
- Produces (`lib/sync/respond.ts`): `revalidateResults(results: SyncResult[]): void`.
- Produces (`lib/sync/store.ts`): `Snapshot.archiveNote: string | null`, and `SnapshotStore.recordArchive(source, note, at)`.
- Produces (`lib/life-log/drizzle-store.ts`): `DrizzleLifeLogStore`, `DrizzleEnrichmentStore` and `archiveStores(db): ArchiveStores`.
- Produces (`lib/life-log/memory-store.ts`): `MemoryLifeLogStore` and `MemoryEnrichmentStore`.
- **Upsert semantics** (both implementations):
  - A new `(source, key)` is inserted with `first_seen_at = updated_at = at`.
  - An existing key gets `data = stored || incoming`, so keys the incoming row leaves out survive.
  - `occurredOn` and `precision` are replaced only when `redate` is true.
  - `inserted` counts new keys and `updated` counts existing ones.
  - `list()` returns rows ordered by `occurred_on DESC NULLS LAST, key DESC`.

- [ ] **Step 1: Add the schema**

In `lib/db/schema.ts`:
- Extend the import to `import { date, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";`.
- Add `archiveNote: text("archive_note"),` to `sourceSnapshots`, after `itemCount`. Above it, add the comment `// The last archive step's summary (Sprint 10), shown in the admin.`
- Append:

```ts
// Life archives that must outlive their upstream windows (Sprint 10): Films
// (Letterboxd CSV import + RSS) and Theatre (history file + activity feed).
// occurred_on is the watch date, or Jan 1 of the year when precision is
// "year"; null when undated. Expand-only migration.
export const lifeLog = pgTable(
  "life_log",
  {
    source: text("source").notNull(),
    key: text("key").notNull(),
    occurredOn: date("occurred_on", { mode: "string" }),
    precision: text("precision").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.source, table.key] })],
);

// og: metadata for Saved articles (Sprint 10), fetched once per URL.
export const linkEnrichments = pgTable("link_enrichments", {
  url: text("url").primaryKey(),
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url"),
  imageWidth: integer("image_width"),
  siteName: text("site_name"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  error: text("error"),
});
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: a new `drizzle/0003_<name>.sql` with `CREATE TABLE "life_log"`, `CREATE TABLE "link_enrichments"` and `ALTER TABLE "source_snapshots" ADD COLUMN "archive_note" text`. It must contain no `DROP`. Open it and check.

- [ ] **Step 3: Write the store types and tags**

Create `lib/life-log/types.ts` with exactly the Produces block above, plus these comments:
- above `LifeLogRow`: `// One archived item. occurredOn is YYYY-MM-DD (Jan 1 for a "year" row), null when undated.`
- above `upsert`: `// Insert by (source, key). On an existing key data is merged (stored || incoming: fields the incoming row leaves out survive) and the date is replaced only when redate is true.`

Create `lib/life-log/tags.ts`:

```ts
import type { LifeLogSource } from "./types";

// Cache tags: readLifeLog / readEnrichments assign them, and the sync route
// revalidates them when an archive step wrote rows.
export function lifeLogTag(source: LifeLogSource): string {
  return `life:${source}`;
}

export const ENRICHMENTS_TAG = "enrichments";
```

- [ ] **Step 4: Write the store contract (the failing tests)**

Create `tests/helpers/life-log-store-contract.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { EnrichmentStore, LifeLogRow, LifeLogStore } from "@/lib/life-log/types";

const t0 = new Date("2026-10-05T10:00:00Z");
const t1 = new Date("2026-10-05T11:00:00Z");
const row = (key: string, occurredOn: string | null, data: Record<string, unknown>): LifeLogRow => ({
  source: "letterboxd",
  key,
  occurredOn,
  precision: occurredOn ? "day" : "none",
  data,
});

export function lifeLogStoreContract(name: string, make: () => Promise<{ log: LifeLogStore; enrichments: EnrichmentStore }>) {
  describe(name, () => {
    let log: LifeLogStore;
    let enrichments: EnrichmentStore;
    beforeEach(async () => {
      ({ log, enrichments } = await make());
    });

    it("inserts, lists newest first with undated last, and counts", async () => {
      const counts = await log.upsert(
        [row("a", "2026-09-01", { title: "A" }), row("b", null, { title: "B" }), row("c", "2026-09-20", { title: "C" })],
        { redate: false, at: t0 },
      );
      expect(counts).toEqual({ inserted: 3, updated: 0 });
      expect((await log.list("letterboxd")).map((r) => r.key)).toEqual(["c", "a", "b"]);
      expect(await log.list("theatre")).toEqual([]);
      expect(await log.keys("letterboxd")).toEqual(new Set(["a", "b", "c"]));
    });

    it("merges data and keeps the date unless redate is set", async () => {
      await log.upsert([row("a", "2026-09-01", { title: "A", poster: "p1" })], { redate: false, at: t0 });
      const counts = await log.upsert([row("a", "2026-01-01", { title: "A2" })], { redate: false, at: t1 });
      expect(counts).toEqual({ inserted: 0, updated: 1 });
      const [kept] = await log.list("letterboxd");
      expect(kept).toEqual({ ...row("a", "2026-09-01", { title: "A2", poster: "p1" }) });
      await log.upsert([{ ...row("a", "2025-01-01", {}), precision: "year" }], { redate: true, at: t1 });
      const [redated] = await log.list("letterboxd");
      expect(redated.occurredOn).toBe("2025-01-01");
      expect(redated.precision).toBe("year");
      expect(redated.data).toEqual({ title: "A2", poster: "p1" });
    });

    it("upserts nothing for an empty batch", async () => {
      expect(await log.upsert([], { redate: false, at: t0 })).toEqual({ inserted: 0, updated: 0 });
    });

    it("stores enrichments by URL, replacing on put", async () => {
      const base = { title: "T", description: "D", imageUrl: null, imageWidth: null, siteName: null, error: null };
      await enrichments.put({ url: "https://a.test/", fetchedAt: t0.toISOString(), ...base });
      await enrichments.put({ url: "https://a.test/", fetchedAt: t1.toISOString(), ...base, title: "T2" });
      expect(await enrichments.all()).toEqual([{ url: "https://a.test/", fetchedAt: t1.toISOString(), ...base, title: "T2" }]);
    });
  });
}
```

Create `tests/life-log/stores.test.ts`:

```ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DrizzleEnrichmentStore, DrizzleLifeLogStore } from "@/lib/life-log/drizzle-store";
import { MemoryEnrichmentStore, MemoryLifeLogStore } from "@/lib/life-log/memory-store";
import { lifeLogStoreContract } from "../helpers/life-log-store-contract";

lifeLogStoreContract("MemoryLifeLogStore", async () => ({
  log: new MemoryLifeLogStore(),
  enrichments: new MemoryEnrichmentStore(),
}));

lifeLogStoreContract("DrizzleLifeLogStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return { log: new DrizzleLifeLogStore(db), enrichments: new DrizzleEnrichmentStore(db) };
});
```

Run: `npx vitest run tests/life-log/stores.test.ts`
Expected: FAIL (the store modules don't exist).

- [ ] **Step 5: Implement the stores**

Create `lib/life-log/memory-store.ts`:

```ts
import type { Enrichment, EnrichmentStore, LifeLogRow, LifeLogSource, LifeLogStore, UpsertCounts } from "./types";

// In-memory stores for unit tests; same semantics as the Drizzle ones.
export class MemoryLifeLogStore implements LifeLogStore {
  private rows = new Map<string, LifeLogRow>();

  async list(source: LifeLogSource): Promise<LifeLogRow[]> {
    return [...this.rows.values()]
      .filter((r) => r.source === source)
      .map((r) => structuredClone(r))
      .sort((a, b) => {
        if (a.occurredOn !== b.occurredOn) {
          if (a.occurredOn === null) return 1;
          if (b.occurredOn === null) return -1;
          return a.occurredOn < b.occurredOn ? 1 : -1;
        }
        return a.key < b.key ? 1 : a.key > b.key ? -1 : 0;
      });
  }

  async keys(source: LifeLogSource): Promise<Set<string>> {
    return new Set((await this.list(source)).map((r) => r.key));
  }

  async upsert(rows: LifeLogRow[], { redate }: { redate: boolean; at: Date }): Promise<UpsertCounts> {
    const counts = { inserted: 0, updated: 0 };
    for (const row of rows) {
      const id = `${row.source}\u0000${row.key}`;
      const stored = this.rows.get(id);
      if (!stored) {
        this.rows.set(id, structuredClone(row));
        counts.inserted++;
        continue;
      }
      this.rows.set(id, {
        ...stored,
        data: { ...stored.data, ...structuredClone(row.data) },
        ...(redate ? { occurredOn: row.occurredOn, precision: row.precision } : {}),
      });
      counts.updated++;
    }
    return counts;
  }
}

export class MemoryEnrichmentStore implements EnrichmentStore {
  private rows = new Map<string, Enrichment>();

  async all(): Promise<Enrichment[]> {
    return [...this.rows.values()].map((r) => ({ ...r }));
  }

  async put(enrichment: Enrichment): Promise<void> {
    this.rows.set(enrichment.url, { ...enrichment });
  }
}
```

Create `lib/life-log/drizzle-store.ts`. It uses relative imports and no `server-only`, because `scripts/import-letterboxd.ts` uses it.

```ts
import { asc, desc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { lifeLog, linkEnrichments } from "../db/schema";
import type {
  ArchiveStores,
  DatePrecision,
  Enrichment,
  EnrichmentStore,
  LifeLogRow,
  LifeLogSource,
  LifeLogStore,
  UpsertCounts,
} from "./types";

// Any Postgres Drizzle database: neon-http in production, PGlite in tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

// neon-http sends one statement per request; keep each under the parameter
// limit (7 columns per row).
const CHUNK = 500;

export class DrizzleLifeLogStore implements LifeLogStore {
  constructor(private db: AnyPgDatabase) {}

  async list(source: LifeLogSource): Promise<LifeLogRow[]> {
    const rows = await this.db
      .select()
      .from(lifeLog)
      .where(eq(lifeLog.source, source))
      .orderBy(sql`${lifeLog.occurredOn} DESC NULLS LAST`, desc(lifeLog.key));
    return rows.map((r) => ({
      source,
      key: r.key,
      occurredOn: r.occurredOn,
      precision: r.precision as DatePrecision,
      data: r.data,
    }));
  }

  async keys(source: LifeLogSource): Promise<Set<string>> {
    const rows = await this.db.select({ key: lifeLog.key }).from(lifeLog).where(eq(lifeLog.source, source)).orderBy(asc(lifeLog.key));
    return new Set(rows.map((r) => r.key));
  }

  async upsert(rows: LifeLogRow[], { redate, at }: { redate: boolean; at: Date }): Promise<UpsertCounts> {
    const counts = { inserted: 0, updated: 0 };
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const result = await this.db
        .insert(lifeLog)
        .values(
          chunk.map((r) => ({
            source: r.source,
            key: r.key,
            occurredOn: r.occurredOn,
            precision: r.precision,
            data: r.data,
            firstSeenAt: at,
            updatedAt: at,
          })),
        )
        .onConflictDoUpdate({
          target: [lifeLog.source, lifeLog.key],
          set: {
            data: sql`${lifeLog.data} || excluded.data`,
            updatedAt: at,
            ...(redate ? { occurredOn: sql`excluded.occurred_on`, precision: sql`excluded.precision` } : {}),
          },
        })
        // xmax is 0 on a freshly inserted row and non-zero on an updated one.
        .returning({ inserted: sql<boolean>`(xmax = 0)` });
      for (const r of result) {
        if (r.inserted) counts.inserted++;
        else counts.updated++;
      }
    }
    return counts;
  }
}

export class DrizzleEnrichmentStore implements EnrichmentStore {
  constructor(private db: AnyPgDatabase) {}

  async all(): Promise<Enrichment[]> {
    const rows = await this.db.select().from(linkEnrichments);
    return rows.map((r) => ({ ...r, fetchedAt: r.fetchedAt.toISOString() }));
  }

  async put(enrichment: Enrichment): Promise<void> {
    const values = { ...enrichment, fetchedAt: new Date(enrichment.fetchedAt) };
    await this.db
      .insert(linkEnrichments)
      .values(values)
      .onConflictDoUpdate({ target: linkEnrichments.url, set: values });
  }
}

export function archiveStores(db: AnyPgDatabase): ArchiveStores {
  return { lifeLog: new DrizzleLifeLogStore(db), enrichments: new DrizzleEnrichmentStore(db) };
}
```

- [ ] **Step 6: Run the contract tests**

Run: `npx vitest run tests/life-log/stores.test.ts`
Expected: PASS for both stores (8 tests). If PGlite rejects `xmax` in `RETURNING`, replace the returning clause with a pre-read: before the insert, `select key where source = ? and key in (chunk keys)`, and count from that set. Record the change in the ledger.

- [ ] **Step 7: Add the archive hook to the source types**

In `lib/sources/types.ts`:
- Add `import type { ArchiveStores } from "../life-log/types";` to the imports.
- Replace `SourceContext` with:

  ```ts
  // What a source's fetch receives. Injected so tests can pass a fake fetch
  // and env instead of hitting the network. `stores` is set by the sync
  // routes (and the admin's Sync now) when a database is available.
  export interface SourceContext {
    fetch: typeof globalThis.fetch;
    env: Record<string, string | undefined>;
    stores?: ArchiveStores;
  }

  export interface ArchiveArgs {
    stores: ArchiveStores;
    fetch: typeof globalThis.fetch;
    now: Date;
  }

  // What an archive step reports: a one-line summary for the admin and the
  // cache tags it made stale.
  export interface ArchiveOutcome {
    note: string;
    tags: string[];
  }
  ```

- In `SourceDefinition`, after `count`, add:

  ```ts
    // Optional (Sprint 10): runs after a successful sync, with the stored
    // data, to write archive rows (life_log, link_enrichments). Must not throw
    // for one bad item; a thrown error is recorded as the note.
    archive?: (data: T, args: ArchiveArgs) => Promise<ArchiveOutcome>;
  ```

- [ ] **Step 8: Add `archiveNote` to snapshots**

In `lib/sync/store.ts`:
- Add `archiveNote: string | null;` to `Snapshot`.
- Add to `SnapshotStore`:

  ```ts
    // Records the last archive step's summary; touches nothing else.
    recordArchive(source: SourceId, note: string, at: Date): Promise<void>;
  ```

In `lib/sync/memory-store.ts`:
- Set `archiveNote: existing?.archiveNote ?? null` in both `recordSuccess` and `recordFailure`.
- Add:

  ```ts
    async recordArchive(source: SourceId, note: string): Promise<void> {
      const existing = this.rows.get(source);
      if (existing) this.rows.set(source, { ...existing, archiveNote: note });
    }
  ```

In `lib/sync/drizzle-store.ts`:
- Add `archiveNote: row.archiveNote,` to the object `get` returns.
- Add:

  ```ts
    async recordArchive(source: SourceId, note: string): Promise<void> {
      await this.db.update(sourceSnapshots).set({ archiveNote: note }).where(eq(sourceSnapshots.source, source));
    }
  ```

Every `Snapshot` object literal in the tests (for example `isDue` cases in `tests/sync/run.test.ts`, or `tests/sources/snapshot-view.test.ts`) needs `archiveNote: null` too. `npm run typecheck` lists them.

In `tests/sync/drizzle-store.test.ts`, add `archiveNote: null,` to every `toEqual` snapshot object, and add:

```ts
  it("records an archive note without touching the snapshot", async () => {
    await store.recordSuccess("letterboxd", [{ title: "A" }], 1, t0);
    await store.recordArchive("letterboxd", "+2 films", t1);
    expect(await store.get("letterboxd")).toMatchObject({ payload: [{ title: "A" }], itemCount: 1, archiveNote: "+2 films" });
  });
```

- [ ] **Step 9: Write the failing sync tests**

Append to `tests/sync/run.test.ts`:

```ts
import { MemoryEnrichmentStore, MemoryLifeLogStore } from "@/lib/life-log/memory-store";
import type { ArchiveArgs } from "@/lib/sources/types";

describe("syncSource archive step", () => {
  const stores = () => ({ lifeLog: new MemoryLifeLogStore(), enrichments: new MemoryEnrichmentStore() });

  it("runs after a successful sync and records its note", async () => {
    const store = new MemorySnapshotStore();
    const seen: unknown[] = [];
    const def = {
      ...source(async () => ["a"]),
      archive: async (data: string[], args: ArchiveArgs) => {
        seen.push(data, args.now);
        return { note: "+1 thing", tags: ["life:letterboxd"] };
      },
    };
    const result = await syncSource(def, store, { ...ctx, stores: stores() }, t0, null);
    expect(result).toEqual({ source: "writing", status: "ok", itemCount: 1, archive: { note: "+1 thing", tags: ["life:letterboxd"] } });
    expect(seen).toEqual([["a"], t0]);
    expect((await store.get("writing"))?.archiveNote).toBe("+1 thing");
  });

  it("is skipped without stores and never runs after a failed fetch", async () => {
    let calls = 0;
    const archive = async () => {
      calls++;
      return { note: "x", tags: [] };
    };
    const store = new MemorySnapshotStore();
    await syncSource({ ...source(async () => ["a"]), archive }, store, ctx, t0, null);
    await syncSource({ ...source(async () => { throw new Error("down"); }), archive }, store, { ...ctx, stores: stores() }, t0, null);
    expect(calls).toBe(0);
  });

  it("keeps the sync ok when the archive step throws, and notes the error", async () => {
    const store = new MemorySnapshotStore();
    const def = { ...source(async () => ["a"]), archive: async () => { throw new Error("db gone"); } };
    const result = await syncSource(def, store, { ...ctx, stores: stores() }, t0, null);
    expect(result).toEqual({ source: "writing", status: "ok", itemCount: 1, archive: { note: "archive failed: db gone", tags: [] } });
  });
});
```

Run: `npx vitest run tests/sync/run.test.ts`
Expected: FAIL (`archive` is not called and `result.archive` is missing).

- [ ] **Step 10: Run the archive step in `syncSource`**

In `lib/sync/run.ts`:
- Change the import to:

  ```ts
  import type {
    AnySourceDefinition,
    ArchiveOutcome,
    SourceContext,
    SourceDefinition,
    SourceId,
  } from "../sources/types";
  ```

- Change the ok variant of `SyncResult` to `| { source: SourceId; status: "ok"; itemCount: number; archive?: ArchiveOutcome }`.
- In `syncSource`, replace the two lines `await store.recordSuccess(...)` and `return { source: definition.id, status: "ok", itemCount };` with:

  ```ts
      await store.recordSuccess(definition.id, data, itemCount, now);
      const archive = await runArchive(definition, data, store, ctx, now);
      return { source: definition.id, status: "ok", itemCount, ...(archive ? { archive } : {}) };
  ```

- Add above `syncSource`:

  ```ts
  // The optional archive step (Sprint 10). It runs only with database stores
  // and after the snapshot is saved; its own failure never fails the sync,
  // because the snapshot is already good. Its note is kept for the admin.
  async function runArchive<T>(
    definition: SourceDefinition<T>,
    data: T,
    store: SnapshotStore,
    ctx: SourceContext,
    now: Date,
  ): Promise<ArchiveOutcome | undefined> {
    if (!definition.archive || !ctx.stores) return undefined;
    let outcome: ArchiveOutcome;
    try {
      outcome = await definition.archive(data, { stores: ctx.stores, fetch: ctx.fetch, now });
    } catch (e) {
      outcome = { note: `archive failed: ${e instanceof Error ? e.message : String(e)}`, tags: [] };
    }
    await store.recordArchive(definition.id, outcome.note, now);
    return outcome;
  }
  ```

- [ ] **Step 11: Revalidate archive tags in one place**

Replace the body of `lib/sync/respond.ts` below the imports with:

```ts
// 502 when any source failed so the GitHub Actions run goes red and emails;
// the body still lists every result.
export function syncStatusCode(results: SyncResult[]): number {
  return results.some((r) => r.status === "error") ? 502 : 200;
}

// Stale-while-revalidate for every source that synced, plus the archive tags
// (life:<source>, enrichments) its archive step reported.
export function revalidateResults(results: SyncResult[]): void {
  for (const result of results) {
    if (result.status !== "ok") continue;
    revalidateTag(sourceTag(result.source), "max");
    for (const tag of result.archive?.tags ?? []) revalidateTag(tag, "max");
  }
}

export function syncResponse(results: SyncResult[]): Response {
  revalidateResults(results);
  return Response.json({ results }, { status: syncStatusCode(results) });
}
```

In `tests/sync/respond.test.ts`, add one test, following the file's existing `revalidateTag` mock pattern:

```ts
  it("revalidates an ok result's archive tags too", () => {
    syncResponse([{ source: "letterboxd", status: "ok", itemCount: 1, archive: { note: "+1", tags: ["life:letterboxd"] } }]);
    expect(revalidateTag).toHaveBeenCalledWith("source:letterboxd", "max");
    expect(revalidateTag).toHaveBeenCalledWith("life:letterboxd", "max");
  });
```

Keep the file's own mock name (it might be imported as `revalidateTag` from a `vi.mock("next/cache")`). Adapt the two `expect` lines to it.

- [ ] **Step 12: Give the sync routes and Sync now the stores**

In `lib/sync/context.ts`:
- Add `import { archiveStores } from "../life-log/drizzle-store";`.
- Change the returned context to `ctx: { fetch: globalThis.fetch, env: process.env, stores: archiveStores(db) },`.

In `app/admin/actions.ts`'s `syncNowAction`:
- Pass `{ fetch: globalThis.fetch, env: process.env, stores: archiveStores(db) }` as the context.
- Replace the `for (const result of results) if (...) revalidateTag(...)` line with `revalidateResults(results);`.
- Add the imports `import { archiveStores } from "@/lib/life-log/drizzle-store";` and `import { revalidateResults } from "@/lib/sync/respond";`.
- Remove the `sourceTag` import if it is now unused. Leave `revalidateTag` if another action still uses it.

- [ ] **Step 13: Show the archive note in the admin**

In `lib/admin/sources.ts`:
- Add `archiveNote: string | null;` to `SourceRow`.
- Add `archiveNote: snapshot?.archiveNote ?? null,` to the mapped row.

In `components/admin/sources-panel.tsx`, inside the `<li>` after the item-count span, add:

```tsx
            {row.archiveNote ? (
              <span className="col-start-2 col-end-4 truncate text-fg-muted" title={row.archiveNote}>
                {row.archiveNote}
              </span>
            ) : null}
```

- [ ] **Step 14: Run everything, then commit**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

```bash
git add lib/db/schema.ts drizzle lib/life-log lib/sources/types.ts lib/sync app/admin/actions.ts lib/admin/sources.ts components/admin/sources-panel.tsx tests/helpers/life-log-store-contract.ts tests/life-log tests/sync
git commit -m "Add life_log and link_enrichments, and an archive step after each sync

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 5: Films archive: keys, CSV import, RSS archive and posters

**Files:**
- Create: `lib/life-log/films.ts`
- Create: `lib/life-log/letterboxd-csv.ts`
- Create: `lib/life-log/posters.ts`
- Create: `scripts/import-letterboxd.ts`
- Modify: `lib/sources/letterboxd.ts` (add `archive`)
- Modify: `package.json` (script `import:letterboxd`)
- Test: `tests/life-log/films.test.ts`, `tests/life-log/letterboxd-csv.test.ts`, `tests/life-log/posters.test.ts`, `tests/sources/letterboxd.test.ts`

**Interfaces:**
- Consumes: `LifeLogRow`, `LifeLogStore` and `ArchiveArgs` from Task 4; `fetchText`, `httpUrl` and `USER_AGENT` from Task 2; `Film` (with `rewatch`) from Task 3.
- Produces (`lib/life-log/films.ts`):
  - `filmDataSchema` (zod) and `type FilmData = { title: string; year: number | null; link: string; poster: string; rewatch: boolean }`;
  - `interface FilmEntry { title: string; year: number | null; link: string; poster?: string; rewatch: boolean; watchedOn: string | null }`;
  - `normaliseTitle(title: string): string`;
  - `filmRows(entries: FilmEntry[]): LifeLogRow[]`. Entries go **oldest first**. Keys are `<watchedOn|"undated">|<normalised title>|<year or "">|<n>`. `poster` is left out of `data` when empty, so a merge never wipes a filled poster;
  - `posterCrop(url: string): string`, which rewrites `-0-<w>-0-<h>-crop` to `-0-230-0-345-crop`.
- Produces (`lib/life-log/letterboxd-csv.ts`): `parseCsv(text: string): Record<string, string>[]` and `exportRows(diaryCsv: string, watchedCsv: string): LifeLogRow[]`.
- Produces (`lib/life-log/posters.ts`):
  - `filmSlug(urlOrPath: string): string | null`;
  - `resolvePoster(fetchImpl, link: string): Promise<string>`, which returns `""` on any failure;
  - `fillPosters(store: LifeLogStore, fetchImpl, options: { limit: number; delayMs?: number; at: Date }): Promise<{ filled: number; failed: number }>`.

- [ ] **Step 1: Write the failing film-key tests**

Create `tests/life-log/films.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filmRows, normaliseTitle, posterCrop } from "@/lib/life-log/films";

const entry = (title: string, watchedOn: string | null, extra: Partial<Parameters<typeof filmRows>[0][number]> = {}) => ({
  title,
  year: 2010,
  link: "https://letterboxd.com/onur/film/x/",
  rewatch: false,
  watchedOn,
  ...extra,
});

describe("filmRows", () => {
  it("keys by watch date, normalised title, year and a same-key counter", () => {
    const rows = filmRows([entry("Heat", "2026-05-18"), entry("  HEAT ", "2026-05-18"), entry("Heat", null)]);
    expect(rows.map((r) => r.key)).toEqual(["2026-05-18|heat|2010|0", "2026-05-18|heat|2010|1", "undated|heat|2010|0"]);
    expect(rows[0]).toMatchObject({ source: "letterboxd", occurredOn: "2026-05-18", precision: "day" });
    expect(rows[2]).toMatchObject({ occurredOn: null, precision: "none" });
  });

  it("leaves an empty poster out of data so a merge keeps a filled one", () => {
    const [noPoster, withPoster] = filmRows([entry("A", "2026-01-01"), entry("B", "2026-01-02", { poster: "https://p/x.jpg" })]);
    expect(noPoster.data).toEqual({ title: "A", year: 2010, link: "https://letterboxd.com/onur/film/x/", rewatch: false });
    expect(withPoster.data.poster).toBe("https://p/x.jpg");
  });

  it("normalises NFC, case and whitespace", () => {
    expect(normaliseTitle("  Ölü̈  Deniz ")).toBe(normaliseTitle("ölü̈ deniz"));
  });
});

describe("posterCrop", () => {
  it("asks for the 230×345 crop", () => {
    expect(posterCrop("https://a.ltrbxd.com/resized/film-poster/9/4/947019-pickled-0-600-0-900-crop.jpg?v=1")).toBe(
      "https://a.ltrbxd.com/resized/film-poster/9/4/947019-pickled-0-230-0-345-crop.jpg?v=1",
    );
    expect(posterCrop("")).toBe("");
  });
});
```

Run: `npx vitest run tests/life-log/films.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 2: Implement `lib/life-log/films.ts`**

```ts
import { z } from "zod";
import type { LifeLogRow } from "./types";

// What a film row's data holds. poster is "" until filled (posters.ts).
export const filmDataSchema = z.object({
  title: z.string(),
  year: z.number().nullable(),
  link: z.string(),
  poster: z.string().default(""),
  rewatch: z.boolean().default(false),
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
```

Run: `npx vitest run tests/life-log/films.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the failing CSV tests**

Create `tests/life-log/letterboxd-csv.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { exportRows, parseCsv } from "@/lib/life-log/letterboxd-csv";

const diary = [
  "﻿Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date",
  '2026-05-19,Heat,1995,https://boxd.it/aaaa,5,Yes,,2026-05-18',
  '2026-04-21,"Howl\'s Moving Castle",2004,https://boxd.it/bbbb,4.5,,,2026-04-20',
  '2026-04-21,"Soyut Dışavurumcu Bir Dostluğun Anatomisi Veyahut Yan Yana",2025,https://boxd.it/cccc,,,"a, b",2026-04-18',
].join("\r\n");
const watched = [
  "Date,Name,Year,Letterboxd URI",
  "2015-01-01,Heat,1995,https://boxd.it/w1",
  '2015-01-01,"The ""Odd"" One",1999,https://boxd.it/w2',
].join("\n");

describe("parseCsv", () => {
  it("handles a BOM, CRLF, quoted commas and doubled quotes", () => {
    const rows = parseCsv(diary);
    expect(rows).toHaveLength(3);
    expect(rows[2].Tags).toBe("a, b");
    expect(rows[1].Name).toBe("Howl's Moving Castle");
    expect(parseCsv(watched)[1].Name).toBe('The "Odd" One');
  });
});

describe("exportRows", () => {
  it("makes dated diary rows, oldest first, and undated rows for watched-only films", () => {
    const rows = exportRows(diary, watched);
    expect(rows.map((r) => r.key)).toEqual([
      "2026-04-18|soyut dışavurumcu bir dostluğun anatomisi veyahut yan yana|2025|0",
      "2026-04-20|howl's moving castle|2004|0",
      "2026-05-18|heat|1995|0",
      'undated|the "odd" one|1999|0',
    ]);
    expect(rows[2].data).toEqual({ title: "Heat", year: 1995, link: "https://boxd.it/aaaa", rewatch: true });
    expect(rows[3]).toMatchObject({ occurredOn: null, precision: "none" });
  });
});
```

Run: `npx vitest run tests/life-log/letterboxd-csv.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement `lib/life-log/letterboxd-csv.ts`**

```ts
import { httpUrl } from "../sources/http";
import { type FilmEntry, filmRows, normaliseTitle } from "./films";
import type { LifeLogRow } from "./types";

// RFC 4180: quoted fields may hold commas, newlines and doubled quotes. A
// leading BOM is dropped; CRLF and LF both end a record.
export function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const [header, ...rows] = records.filter((r) => r.some((cell) => cell !== ""));
  if (!header) return [];
  return rows.map((cells) => Object.fromEntries(header.map((name, i) => [name.trim(), cells[i] ?? ""])));
}

const year = (value: string) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
};

// Letterboxd's export: diary.csv has one row per diary entry (Watched Date
// is the day watched; Date is when it was logged), watched.csv one row per
// film marked watched. A watched film without any diary entry is "undated".
export function exportRows(diaryCsv: string, watchedCsv: string): LifeLogRow[] {
  const diary: FilmEntry[] = parseCsv(diaryCsv)
    .map((row) => ({
      title: row.Name ?? "",
      year: year(row.Year ?? ""),
      link: httpUrl(row["Letterboxd URI"]),
      rewatch: row.Rewatch === "Yes",
      watchedOn: (row["Watched Date"] || row.Date || "").trim() || null,
    }))
    .filter((entry) => entry.title && entry.watchedOn)
    // Oldest first, stable, so a same-day pair gets the counter in log order.
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => (a.entry.watchedOn! < b.entry.watchedOn! ? -1 : a.entry.watchedOn! > b.entry.watchedOn! ? 1 : a.index - b.index))
    .map(({ entry }) => entry);

  const inDiary = new Set(diary.map((e) => `${normaliseTitle(e.title)}|${e.year ?? ""}`));
  const undated: FilmEntry[] = parseCsv(watchedCsv)
    .map((row) => ({
      title: row.Name ?? "",
      year: year(row.Year ?? ""),
      link: httpUrl(row["Letterboxd URI"]),
      rewatch: false,
      watchedOn: null,
    }))
    .filter((entry) => entry.title && !inDiary.has(`${normaliseTitle(entry.title)}|${entry.year ?? ""}`));

  return filmRows([...diary, ...undated]);
}
```

Run: `npx vitest run tests/life-log/letterboxd-csv.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing poster tests**

Create `tests/life-log/posters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MemoryLifeLogStore } from "@/lib/life-log/memory-store";
import { filmSlug, fillPosters, resolvePoster } from "@/lib/life-log/posters";

const filmPage = (image: string) =>
  `<html><script type="application/ld+json">{"@type":"Movie","image":"${image}","name":"X"}</script></html>`;

function routes(map: Record<string, Response | (() => Response)>): typeof globalThis.fetch {
  return (async (input: RequestInfo | URL) => {
    const hit = map[String(input)];
    if (!hit) return new Response("nope", { status: 404 });
    return typeof hit === "function" ? hit() : hit.clone();
  }) as typeof globalThis.fetch;
}

describe("filmSlug", () => {
  it("reads the slug from a diary or film URL", () => {
    expect(filmSlug("https://letterboxd.com/onur/film/pickled/")).toBe("pickled");
    expect(filmSlug("https://letterboxd.com/film/heat-1995/")).toBe("heat-1995");
    expect(filmSlug("https://letterboxd.com/onur/film/heat-1995/1/")).toBe("heat-1995");
    expect(filmSlug("https://boxd.it/aaaa")).toBeNull();
  });
});

describe("resolvePoster", () => {
  it("uses the slug in a diary link directly", async () => {
    const fetch = routes({ "https://letterboxd.com/film/pickled/": new Response(filmPage("https://a.ltrbxd.com/p-0-600-0-900-crop.jpg?v=1")) });
    expect(await resolvePoster(fetch, "https://letterboxd.com/onur/film/pickled/")).toBe("https://a.ltrbxd.com/p-0-230-0-345-crop.jpg?v=1");
  });

  it("follows a boxd.it redirect by its Location header only", async () => {
    const fetch = routes({
      "https://boxd.it/aaaa": () => new Response(null, { status: 302, headers: { Location: "https://letterboxd.com/onur/film/heat-1995/" } }),
      "https://letterboxd.com/film/heat-1995/": new Response(filmPage("https://a.ltrbxd.com/h-0-600-0-900-crop.jpg")),
    });
    expect(await resolvePoster(fetch, "https://boxd.it/aaaa")).toBe("https://a.ltrbxd.com/h-0-230-0-345-crop.jpg");
  });

  it("returns empty on any failure", async () => {
    expect(await resolvePoster(routes({}), "https://letterboxd.com/onur/film/gone/")).toBe("");
    expect(await resolvePoster(routes({}), "https://boxd.it/zzzz")).toBe("");
    expect(await resolvePoster(routes({}), "")).toBe("");
  });
});

describe("fillPosters", () => {
  it("fills the newest rows without a poster, up to the limit, and counts failures", async () => {
    const store = new MemoryLifeLogStore();
    const at = new Date("2026-10-05T10:00:00Z");
    const row = (key: string, occurredOn: string, link: string, poster?: string) => ({
      source: "letterboxd" as const,
      key,
      occurredOn,
      precision: "day" as const,
      data: { title: key, year: null, link, rewatch: false, ...(poster ? { poster } : {}) },
    });
    await store.upsert(
      [
        row("old", "2020-01-01", "https://letterboxd.com/onur/film/old/"),
        row("new", "2026-01-01", "https://letterboxd.com/onur/film/new/"),
        row("mid", "2023-01-01", "https://letterboxd.com/onur/film/gone/"),
        row("has", "2026-02-01", "https://letterboxd.com/onur/film/has/", "https://p/has.jpg"),
      ],
      { redate: false, at },
    );
    const fetch = routes({
      "https://letterboxd.com/film/new/": new Response(filmPage("https://a.ltrbxd.com/n-0-600-0-900-crop.jpg")),
    });
    expect(await fillPosters(store, fetch, { limit: 2, at })).toEqual({ filled: 1, failed: 1 });
    const byKey = Object.fromEntries((await store.list("letterboxd")).map((r) => [r.key, r.data.poster]));
    expect(byKey).toEqual({ has: "https://p/has.jpg", new: "https://a.ltrbxd.com/n-0-230-0-345-crop.jpg", mid: undefined, old: undefined });
  });
});
```

Run: `npx vitest run tests/life-log/posters.test.ts`
Expected: FAIL.

- [ ] **Step 6: Implement `lib/life-log/posters.ts`**

```ts
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
```

`list()` returns newest first (Task 4), so `slice(0, limit)` takes the newest rows. Undated rows come last.

Run: `npx vitest run tests/life-log/posters.test.ts`
Expected: PASS.

- [ ] **Step 7: Write the failing Letterboxd archive test**

Append to `tests/sources/letterboxd.test.ts`:

```ts
import { MemoryEnrichmentStore, MemoryLifeLogStore } from "@/lib/life-log/memory-store";
import { letterboxd } from "@/lib/sources/letterboxd";

describe("letterboxd.archive", () => {
  it("upserts dated RSS entries with the archive crop, fills posters, and reports its tag", async () => {
    const lifeLog = new MemoryLifeLogStore();
    const films = [
      { title: "Newer", year: 2026, link: "https://letterboxd.com/onur/film/newer/", poster: "https://a.ltrbxd.com/n-0-600-0-900-crop.jpg", ratingValue: null, watchedDate: "2026-09-26", date: "", rewatch: false },
      { title: "No date", year: 2020, link: "https://letterboxd.com/onur/film/nd/", poster: "", ratingValue: null, watchedDate: "", date: "", rewatch: false },
      { title: "Older", year: 1995, link: "https://letterboxd.com/onur/film/older/", poster: "https://a.ltrbxd.com/o-0-600-0-900-crop.jpg", ratingValue: null, watchedDate: "2026-05-18", date: "", rewatch: true },
    ];
    const fetch = (async () => new Response("", { status: 404 })) as typeof globalThis.fetch;
    const outcome = await letterboxd.archive!(films, {
      stores: { lifeLog, enrichments: new MemoryEnrichmentStore() },
      fetch,
      now: new Date("2026-10-05T10:00:00Z"),
    });
    const rows = await lifeLog.list("letterboxd");
    expect(rows.map((r) => r.key)).toEqual(["2026-09-26|newer|2026|0", "2026-05-18|older|1995|0"]);
    expect(rows[1].data).toMatchObject({ rewatch: true, poster: "https://a.ltrbxd.com/o-0-230-0-345-crop.jpg" });
    expect(outcome).toEqual({ note: "+2 films · 0 posters filled", tags: ["life:letterboxd"] });
  });
});
```

Run: `npx vitest run tests/sources/letterboxd.test.ts`
Expected: FAIL (`archive` is undefined).

- [ ] **Step 8: Add `archive` to the Letterboxd source**

In `lib/sources/letterboxd.ts`:
- Add the imports:

  ```ts
  import { filmRows, posterCrop } from "../life-log/films";
  import { fillPosters } from "../life-log/posters";
  import { lifeLogTag } from "../life-log/tags";
  ```

- Add `const POSTERS_PER_RUN = 30;` under `FEED_URL`.
- Add to the definition:

```ts
  // Sprint 10: every dated diary entry in the feed goes into life_log (the
  // /life/films/ archive), then up to 30 rows without a poster get one.
  archive: async (films, { stores, fetch, now }) => {
    const rows = filmRows(
      films
        .filter((film) => film.watchedDate)
        .reverse() // the feed is newest first; filmRows wants oldest first
        .map((film) => ({
          title: film.title,
          year: film.year,
          link: film.link,
          poster: posterCrop(film.poster),
          rewatch: film.rewatch,
          watchedOn: film.watchedDate,
        })),
    );
    const counts = await stores.lifeLog.upsert(rows, { redate: false, at: now });
    const posters = await fillPosters(stores.lifeLog, fetch, { limit: POSTERS_PER_RUN, at: now });
    const failed = posters.failed ? ` · ${posters.failed} failed` : "";
    return {
      note: `+${counts.inserted} films · ${posters.filled} posters filled${failed}`,
      tags: counts.inserted + counts.updated + posters.filled > 0 ? [lifeLogTag("letterboxd")] : [],
    };
  },
```

Run: `npx vitest run tests/sources/letterboxd.test.ts`
Expected: PASS. The "No date" film is skipped. Both rows have posters, so nothing is fetched; failed is 0.

- [ ] **Step 9: Write the import script**

Create `scripts/import-letterboxd.ts`:

```ts
// One-off: imports a Letterboxd export into life_log (Sprint 10).
//
//   DATABASE_URL=… npm run import:letterboxd -- ../letterboxd-export.zip [--posters]
//
// diary.csv rows become dated films, watched.csv-only films "undated". Safe
// to re-run: rows upsert by key, the date is rewritten from the CSV, and a
// poster already filled is kept. --posters then fills every missing poster
// (one film page per second). Relative imports only: tsx runs this outside
// Next.
import { execFileSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { DrizzleLifeLogStore } from "../lib/life-log/drizzle-store";
import { exportRows } from "../lib/life-log/letterboxd-csv";
import { fillPosters } from "../lib/life-log/posters";

function readFromZip(zip: string, name: string): string {
  return execFileSync("unzip", ["-p", zip, name], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

async function main() {
  const zip = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  const url = process.env.DATABASE_URL;
  if (!zip || !url) {
    console.error("usage: DATABASE_URL=… npm run import:letterboxd -- <export.zip> [--posters]");
    process.exit(1);
  }
  const rows = exportRows(readFromZip(zip, "diary.csv"), readFromZip(zip, "watched.csv"));
  const store = new DrizzleLifeLogStore(drizzle(neon(url)));
  const counts = await store.upsert(rows, { redate: true, at: new Date() });
  const dated = rows.filter((r) => r.occurredOn).length;
  console.log(`[letterboxd] ${rows.length} rows (${dated} dated, ${rows.length - dated} undated): +${counts.inserted} new, ${counts.updated} updated`);

  if (process.argv.includes("--posters")) {
    let total = 0;
    for (;;) {
      const batch = await fillPosters(store, globalThis.fetch, { limit: 50, delayMs: 1000, at: new Date() });
      total += batch.filled;
      console.log(`[letterboxd] posters: +${batch.filled} (${batch.failed} failed), ${total} so far`);
      if (batch.filled === 0) break;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

The `--posters` loop stops when a batch fills nothing. That covers both "every poster filled" and "only failures left".

In `package.json` `scripts`, add after `"db:migrate"`:

```json
    "import:letterboxd": "tsx scripts/import-letterboxd.ts",
```

- [ ] **Step 10: Check the script typechecks and loads under tsx**

Run: `npm run typecheck && npx tsx scripts/import-letterboxd.ts; echo "exit $?"`
Expected: typecheck passes. The script prints the usage line and exits 1, because no zip or DATABASE_URL was given. That proves the relative imports resolve under tsx.

- [ ] **Step 11: Run all tests and commit**

Run: `npm test && npm run lint`
Expected: PASS.

```bash
git add lib/life-log lib/sources/letterboxd.ts scripts/import-letterboxd.ts package.json tests/life-log tests/sources/letterboxd.test.ts
git commit -m "Archive every Letterboxd diary entry: CSV import, RSS upsert and poster fill

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 6: Theatre source (tiyatrolar.com.tr)

**Files:**
- Create: `lib/life-log/relative-year.ts`
- Create: `lib/sources/theatre.ts`
- Create: `scripts/theatre-history.ts`
- Create: `content/theatre-history.ts` (generated by the script, then committed)
- Create: `tests/fixtures/theatre-activity.json` (recorded)
- Modify: `lib/sources/types.ts` (id and label), `lib/sources/registry.ts`, `lib/sources/fixtures.ts`
- Modify: `e2e/system.spec.ts` (5 → 6 sources)
- Test: `tests/life-log/relative-year.test.ts`, `tests/sources/theatre.test.ts`

**Interfaces:**
- Consumes: `fetchText`, `httpUrl` and `USER_AGENT` (Task 2); `LifeLogRow`, `ArchiveArgs` and `lifeLogTag` (Task 4).
- Produces (`lib/life-log/relative-year.ts`): `yearFromAgo(ago: string, now: Date): number | null`. It handles `"<n> saniye|dakika|saat|gün|hafta|ay|yıl önce"` and `"az önce"`, computed in Europe/Istanbul.
- Produces (`lib/sources/theatre.ts`):
  - `type TheatreWatch = { id: string; title: string; slug: string; company: string; poster: string; link: string; ago: string }`;
  - `parseActivity(html: string): { ids: string[]; watches: TheatreWatch[] }`, where `ids` are all activity post ids on the page, in order;
  - `fetchActivityPage(fetchImpl, offset: number): Promise<{ ids: string[]; watches: TheatreWatch[]; more: boolean; next: number }>`;
  - `theatre: SourceDefinition<TheatreWatch[], "theatre">`;
  - `historyRows(): LifeLogRow[]`;
  - `theatreDataSchema` (zod) with `type TheatreData = { title; slug; company; poster; link; andEarlier: boolean }`.
- Produces (`content/theatre-history.ts`): `interface TheatreHistoryRow { id: string; title: string; slug: string; company: string; poster: string; link: string; year: number; andEarlier?: true }` and `export const theatreHistory: TheatreHistoryRow[]`.

- [ ] **Step 1: Write the failing relative-year tests**

Create `tests/life-log/relative-year.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { yearFromAgo } from "@/lib/life-log/relative-year";

const oct5 = new Date("2026-10-05T09:00:00Z"); // 12:00 in Istanbul
const jan2 = new Date("2026-01-02T09:00:00Z");

describe("yearFromAgo", () => {
  it("reads every unit tiyatrolar uses", () => {
    expect(yearFromAgo("3 gün önce", oct5)).toBe(2026);
    expect(yearFromAgo("2 hafta önce", oct5)).toBe(2026);
    expect(yearFromAgo("5 ay önce", oct5)).toBe(2026);
    expect(yearFromAgo("11 ay önce", oct5)).toBe(2025);
    expect(yearFromAgo("11 yıl önce", oct5)).toBe(2015);
    expect(yearFromAgo("4 saat önce", oct5)).toBe(2026);
    expect(yearFromAgo("az önce", oct5)).toBe(2026);
  });

  it("crosses the year boundary in Istanbul time", () => {
    expect(yearFromAgo("3 gün önce", jan2)).toBe(2025);
    expect(yearFromAgo("1 hafta önce", jan2)).toBe(2025);
    // 2025-12-31T22:30Z is already 2026-01-01 01:30 in Istanbul.
    expect(yearFromAgo("1 saat önce", new Date("2025-12-31T23:30:00Z"))).toBe(2026);
  });

  it("returns null for anything else", () => {
    expect(yearFromAgo("", oct5)).toBeNull();
    expect(yearFromAgo("yesterday", oct5)).toBeNull();
  });
});
```

Run: `npx vitest run tests/life-log/relative-year.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement `lib/life-log/relative-year.ts`**

```ts
// tiyatrolar.com.tr shows only relative times ("5 ay önce"). The year is
// worked out from them at sync time, in Istanbul, which is the precision the
// Theatre archive shows (spec §2.4).
const istanbulDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function istanbulParts(at: Date): { y: number; m: number; d: number } {
  const [y, m, d] = istanbulDay.format(at).split("-").map(Number);
  return { y, m, d };
}

const MS = { saniye: 1_000, dakika: 60_000, saat: 3_600_000 } as const;

export function yearFromAgo(ago: string, now: Date): number | null {
  const text = ago.trim();
  if (text === "az önce") return istanbulParts(now).y;
  const match = /^(\d+)\s+(saniye|dakika|saat|gün|hafta|ay|yıl)\s+önce$/.exec(text);
  if (!match) return null;
  const n = Number(match[1]);
  const unit = match[2];
  if (unit === "saniye" || unit === "dakika" || unit === "saat") {
    return istanbulParts(new Date(now.getTime() - n * MS[unit])).y;
  }
  const { y, m, d } = istanbulParts(now);
  if (unit === "yıl") return y - n;
  // Calendar arithmetic on the Istanbul date, in UTC to avoid DST shifts.
  const date = new Date(Date.UTC(y, m - 1, d));
  if (unit === "gün") date.setUTCDate(date.getUTCDate() - n);
  if (unit === "hafta") date.setUTCDate(date.getUTCDate() - 7 * n);
  if (unit === "ay") date.setUTCMonth(date.getUTCMonth() - n);
  return date.getUTCFullYear();
}
```

Run: `npx vitest run tests/life-log/relative-year.test.ts`
Expected: PASS.

- [ ] **Step 3: Record the activity fixture**

Run from the worktree root:

```bash
curl -s -A "Mozilla/5.0 (compatible; onursenture.com-sync/2.0)" -X POST https://tiyatrolar.com.tr/posts/load_more_user_item_via_ajax/ \
  --data "item_type=user_item&page=activity&lazy_load=1&username=onursenture&item_type_detail=&is_locked=0&area=area_wall&wall_type=wall&controller=posts&limit=5&user_id=1702&query=&offset=0" \
  | python3 -m json.tool --no-ensure-ascii > tests/fixtures/theatre-activity.json
head -c 400 tests/fixtures/theatre-activity.json
```

Expected:
- a JSON object with `"sta": 1`, `"html": "<li class=\"postli_…`, `"html_btn": true` and `"new_offset": 5`;
- its 5 items include at least one "tiyatro izledi" post. On 2026-10-05 that was post `1481396` "Adel Seni Seçti / Ankara Devlet Tiyatrosu".

If the first page has no watch post when you run this, record `offset=5` or `offset=10` instead, and note which in the test's comment. Open the file and read the watch `<li>` markup before writing the parser.

- [ ] **Step 4: Write the failing theatre tests**

Create `tests/sources/theatre.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MemoryEnrichmentStore, MemoryLifeLogStore } from "@/lib/life-log/memory-store";
import { historyRows, parseActivity, theatre } from "@/lib/sources/theatre";
import { theatreHistory } from "@/content/theatre-history";
import { fixture } from "../helpers/fixtures";

const watchLi = (id: string, ago: string, slug: string, title: string, company: string) => `
<li class="postli_${id}">
  <div class="post-header comment-handler follow-item">
    <a class="" href="/u/onursenture/izledikleri"><div class="icon-holder view"></div></a>
    <p><a href="https://tiyatrolar.com.tr/u/onursenture">Onur Senture</a>, tiyatro
      <a href="https://tiyatrolar.com.tr/u/onursenture/post/${id}"> izledi</a><br /><span>${ago}</span></p>
  </div>
  <div class="comment-figure"><ul class="image-list follow-list center-text"><li class="follow-item">
    <figure class="rating level-5">4.9</figure>
    <a href="https://tiyatrolar.com.tr/tiyatro/${slug}">
      <img src="https://tiyatrolar.com.tr/files/activity/a/${slug}/image/${slug}-41x59.jpg">
      <div class="act exhibition-img-title"><h6>${title}<span class="wall_extra_info"> / ${company}</span></h6></div>
    </a>
  </li></ul></div>
  <div class="post-actions"></div>
</li>`;
const otherLi = (id: string) => `
<li class="postli_${id}"><div class="post-header comment-handler follow-item"><p>
  <a href="https://tiyatrolar.com.tr/u/onursenture">Onur Senture</a>, tiyatroyu
  <a href="https://tiyatrolar.com.tr/u/onursenture/post/${id}"> alkışladı</a><br /><span>3 gün önce</span></p></div>
  <div class="post-actions"></div></li>`;
const page = (items: string[], more: boolean, next: number) =>
  JSON.stringify({ sta: 1, msg: "Başarılı", html: items.join(""), html_btn: more, new_offset: next });

describe("parseActivity", () => {
  it("keeps only watch posts and reads title, company, slug and the full-size poster", () => {
    const { ids, watches } = parseActivity(
      [otherLi("9"), watchLi("8", "3 gün önce", "adel-seni-secti-1", "Adel Seni Seçti", "Ankara Devlet Tiyatrosu")].join(""),
    );
    expect(ids).toEqual(["9", "8"]);
    expect(watches).toEqual([
      {
        id: "8",
        title: "Adel Seni Seçti",
        slug: "adel-seni-secti-1",
        company: "Ankara Devlet Tiyatrosu",
        poster: "https://tiyatrolar.com.tr/files/activity/a/adel-seni-secti-1/image/adel-seni-secti-1.jpg",
        link: "https://tiyatrolar.com.tr/tiyatro/adel-seni-secti-1",
        ago: "3 gün önce",
      },
    ]);
  });

  it("parses the recorded page", () => {
    const json = JSON.parse(fixture("theatre-activity.json"));
    const { ids, watches } = parseActivity(json.html);
    expect(ids.length).toBeGreaterThan(0);
    expect(watches.length).toBeGreaterThan(0);
    for (const watch of watches) {
      expect(watch.link).toMatch(/^https:\/\/tiyatrolar\.com\.tr\/tiyatro\//);
      expect(watch.poster).not.toContain("-41x59");
      expect(watch.title).not.toContain("/");
    }
  });
});

describe("theatre.fetch", () => {
  const endpoint = "https://tiyatrolar.com.tr/posts/load_more_user_item_via_ajax/";

  function pagedFetch(pages: string[]) {
    const offsets: number[] = [];
    const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input) !== endpoint) return new Response("no", { status: 404 });
      const offset = Number(new URLSearchParams(String(init?.body)).get("offset"));
      offsets.push(offset);
      return new Response(pages[offset / 5] ?? page([], false, offset));
    }) as typeof globalThis.fetch;
    return { impl, offsets };
  }

  it("stops at the first page holding a known post id", async () => {
    const lifeLog = new MemoryLifeLogStore();
    await lifeLog.upsert(
      [{ source: "theatre", key: "50", occurredOn: "2026-01-01", precision: "year", data: {} }],
      { redate: false, at: new Date() },
    );
    const { impl, offsets } = pagedFetch([
      page([watchLi("90", "3 gün önce", "a", "A", "X"), otherLi("89")], true, 5),
      page([watchLi("70", "1 hafta önce", "b", "B", "Y"), otherLi("50")], true, 10),
      page([watchLi("40", "1 ay önce", "c", "C", "Z")], false, 15),
    ]);
    const watches = await theatre.fetch({ fetch: impl, env: {}, stores: { lifeLog, enrichments: new MemoryEnrichmentStore() } });
    expect(offsets).toEqual([0, 5]);
    expect(watches.map((w) => w.id)).toEqual(["90", "70"]);
  });

  it("throws when no watch post was found", async () => {
    const { impl } = pagedFetch([page([otherLi("1")], false, 5)]);
    await expect(theatre.fetch({ fetch: impl, env: {} })).rejects.toThrow("no watches");
  });
});

describe("theatre.archive", () => {
  it("seeds the history file and adds new watches with their year", async () => {
    const lifeLog = new MemoryLifeLogStore();
    const now = new Date("2026-10-05T09:00:00Z");
    const outcome = await theatre.archive!(
      [
        { id: "9999999", title: "New Play", slug: "new-play", company: "Co", poster: "https://p/x.jpg", link: "https://tiyatrolar.com.tr/tiyatro/new-play", ago: "2 gün önce" },
      ],
      { stores: { lifeLog, enrichments: new MemoryEnrichmentStore() }, fetch: globalThis.fetch, now },
    );
    const rows = await lifeLog.list("theatre");
    expect(rows).toHaveLength(theatreHistory.length + 1);
    expect(rows.find((r) => r.key === "9999999")).toMatchObject({ occurredOn: "2026-01-01", precision: "year", data: { title: "New Play", andEarlier: false } });
    expect(outcome.note).toBe("+1 plays");
    expect(outcome.tags).toEqual(["life:theatre"]);
  });

  it("history rows carry the file's year and the and-earlier flag", () => {
    const rows = historyRows();
    expect(rows).toHaveLength(theatreHistory.length);
    const oldest = Math.min(...theatreHistory.map((r) => r.year));
    for (const row of rows) {
      const source = theatreHistory.find((r) => r.id === row.key)!;
      expect(row.occurredOn).toBe(`${source.year}-01-01`);
      expect(row.data.andEarlier).toBe(source.year === oldest);
    }
  });
});
```

Run: `npx vitest run tests/sources/theatre.test.ts tests/life-log/relative-year.test.ts`
Expected: FAIL (the modules don't exist).

- [ ] **Step 5: Add the id and label**

In `lib/sources/types.ts`:
- Add `"theatre"` to `SOURCE_IDS`, after `"github"`.
- Add `theatre: "tiyatrolar.com.tr",` to `SOURCE_LABELS`.

- [ ] **Step 6: Write a placeholder history file so the module compiles**

Create `content/theatre-history.ts`:

```ts
// The 77 theatre watches before the theatre source started (Sprint 10), with
// the year each was logged, read once from tiyatrolar.com.tr's relative
// times by scripts/theatre-history.ts. Onur checked the years; edit a year
// here to correct it (the theatre archive step re-seeds every run). The
// oldest year carries andEarlier: it is the 2015 bulk entry made when the
// account was set up, which also holds plays seen before 2015.
//
// Generated file: re-run `npx tsx scripts/theatre-history.ts` only to
// rebuild it from scratch, then re-apply Onur's corrections.

export interface TheatreHistoryRow {
  // The tiyatrolar activity post id ("izledi").
  id: string;
  title: string;
  slug: string;
  company: string;
  poster: string;
  link: string;
  year: number;
  andEarlier?: true;
}

export const theatreHistory: TheatreHistoryRow[] = [];
```

Step 9 replaces the empty array with the generated rows.

- [ ] **Step 7: Implement `lib/sources/theatre.ts`**

```ts
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

// The committed history as life_log rows; the oldest year is "and earlier".
export function historyRows(): LifeLogRow[] {
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
      andEarlier: row.andEarlier === true,
    },
  }));
}

export const theatre: SourceDefinition<TheatreWatch[], "theatre"> = {
  id: "theatre",
  intervalMinutes: 24 * 60,
  empty: [],
  schema: watchesSchema,
  // Newest activity first, stopping at the first page that holds a post the
  // archive already has (from the history file or an earlier sync).
  fetch: async ({ fetch, stores }) => {
    const known = new Set(theatreHistory.map((row) => row.id));
    for (const key of (await stores?.lifeLog.keys("theatre")) ?? []) known.add(key);
    const watches: TheatreWatch[] = [];
    let offset = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await fetchActivityPage(fetch, offset);
      watches.push(...result.watches.filter((watch) => !known.has(watch.id)));
      if (!result.more || result.ids.some((id) => known.has(id))) break;
      offset = result.next;
    }
    if (watches.length === 0) {
      // Nothing new is the normal case once the archive is current; report the
      // newest known watch on the first page so the snapshot isn't empty.
      const first = await fetchActivityPage(fetch, 0);
      if (first.watches.length === 0) throw new Error("tiyatrolar activity returned no watches");
      return first.watches;
    }
    return watches;
  },
  count: (watches) => watches.length,
  // Re-seeds the committed history (its years win, so a corrected year takes
  // effect), then adds watches the history doesn't have, dated by the year of
  // their relative time. A row added by an earlier sync is never re-dated.
  archive: async (watches, { stores, now }) => {
    await stores.lifeLog.upsert(historyRows(), { redate: true, at: now });
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
    return { note: `+${added.inserted} plays`, tags: added.inserted > 0 ? [lifeLogTag("theatre")] : [] };
  },
};
```

There is a subtlety in `fetch`.
- The "stops at a known id" test above expects `["90", "70"]` and offsets `[0, 5]`. Page 2 holds `50` (known), so the crawl stops there, and `70` (unknown) is kept.
- The "no watches" test expects a throw. There, the first page has no watch, so the fallback also finds none.
- When the archive is current, the fetch returns the first page's watches, which are already known. Their archive upsert uses `redate: false`, so it changes nothing.

Check the fixture's `<li>` markup against the selectors. If a selector misses (for example the play anchor's `href` is relative), fix the parser to match the real markup and keep the synthetic test passing.

- [ ] **Step 8: Register the source and its fixture loader**

In `lib/sources/registry.ts`:
- Add `import { theatre } from "./theatre";`.
- Add `theatre,` to the `sources` object, after `github`.

In `lib/sources/fixtures.ts`:
- Add `import { parseActivity } from "./theatre";`.
- Add the loader:

```ts
  theatre: async () => parseActivity(JSON.parse(await readFixture("theatre-activity.json")).html).watches,
```

- [ ] **Step 9: Generate the history file**

Create `scripts/theatre-history.ts`:

```ts
// One-off (Sprint 10): crawls the whole tiyatrolar.com.tr activity feed and
// writes content/theatre-history.ts with every watch and the year read from
// its relative time. Run: npx tsx scripts/theatre-history.ts
// Onur then checks the years by hand (spec §2.4). Relative imports only.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { yearFromAgo } from "../lib/life-log/relative-year";
import { fetchActivityPage, type TheatreWatch } from "../lib/sources/theatre";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const now = new Date();
  const watches: TheatreWatch[] = [];
  for (let offset = 0, page = 0; page < 200; page++) {
    const result = await fetchActivityPage(globalThis.fetch, offset);
    watches.push(...result.watches);
    if (!result.more) break;
    offset = result.next;
    await sleep(300);
  }
  const rows = watches.map((watch) => {
    const year = yearFromAgo(watch.ago, now);
    if (year === null) throw new Error(`unreadable time "${watch.ago}" on ${watch.id}`);
    return { ...watch, year };
  });
  const oldest = Math.min(...rows.map((row) => row.year));
  const body = rows
    .map((row) => {
      const fields = {
        id: row.id,
        title: row.title,
        slug: row.slug,
        company: row.company,
        poster: row.poster,
        link: row.link,
        year: row.year,
        ...(row.year === oldest ? { andEarlier: true as const } : {}),
      };
      return `  ${JSON.stringify(fields)}, // ${row.ago}`;
    })
    .join("\n");
  const path = join(process.cwd(), "content", "theatre-history.ts");
  const source = readFileSync(path, "utf8");
  const head = source.slice(0, source.indexOf("export const theatreHistory"));
  writeFileSync(path, `${head}export const theatreHistory: TheatreHistoryRow[] = [\n${body}\n];\n`);
  console.log(`[theatre] ${rows.length} watches, ${oldest}–${Math.max(...rows.map((r) => r.year))}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

The script imports `lib/sources/theatre.ts`, which imports `content/theatre-history.ts`. The empty file from Step 6 satisfies that import.

Run: `npx tsx scripts/theatre-history.ts`
Expected:
- the output is `[theatre] 77 watches, 2015–2026`, or more watches if Onur logged a play since 2026-10-05;
- the file has one row per watch, each with a `// N … önce` comment;
- the 17 rows from 2015 carry `"andEarlier":true`.

Then run `npx prettier --check content/theatre-history.ts 2>/dev/null || true`. The repo has no prettier config, so a JSON-per-line file is fine. Run `npm run lint` on it.

- [ ] **Step 10: Update the system e2e count**

In `e2e/system.spec.ts`, change both `toHaveCount(5)` in the Sources assertions to `toHaveCount(6)`.

- [ ] **Step 11: Run all tests and commit**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS, including `tests/sources/registry.test.ts` and `tests/sources/fixtures.test.ts`, which iterate over `SOURCE_IDS`. If `fixtures.test.ts` asserts a count per source, add `theatre`'s.

```bash
git add lib/life-log/relative-year.ts lib/sources content/theatre-history.ts scripts/theatre-history.ts tests/fixtures/theatre-activity.json tests/life-log/relative-year.test.ts tests/sources/theatre.test.ts e2e/system.spec.ts
git commit -m "Add the tiyatrolar.com.tr theatre source with the 77-watch history

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 7: Saved enrichment (og: metadata)

**Files:**
- Create: `lib/life-log/enrich.ts`
- Modify: `lib/sources/instapaper.ts` (add `archive`)
- Test: `tests/life-log/enrich.test.ts`, `tests/sources/instapaper.test.ts`

**Interfaces:**
- Consumes: `Enrichment` and `EnrichmentStore` (Task 4); `httpUrl` and `USER_AGENT` (Task 2); `ENRICHMENTS_TAG` (Task 4).
- Produces:
  - `parseMeta(html: string, pageUrl: string): { title: string | null; description: string | null; imageUrl: string | null; imageWidth: number | null; siteName: string | null }`. It reads `og:*`, falls back to `twitter:*` and `name=description`, and resolves the image against `pageUrl`;
  - `enrichUrl(fetchImpl, url: string, now: Date): Promise<Enrichment>`, which never throws and fills `error` instead;
  - `enrichPending(store: EnrichmentStore, fetchImpl, urls: string[], now: Date, limit?: number): Promise<{ fetched: number; failed: number }>`.

- [ ] **Step 1: Write the failing tests**

Create `tests/life-log/enrich.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { enrichPending, enrichUrl, parseMeta } from "@/lib/life-log/enrich";
import { MemoryEnrichmentStore } from "@/lib/life-log/memory-store";

const page = `<html><head>
  <meta property="og:title" content="Designing Depth">
  <meta property="og:description" content="  How do you   distill a 3D world?  ">
  <meta property="og:image" content="/static/og-depth.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:site_name" content="rauno.me">
</head><body>…</body></html>`;

describe("parseMeta", () => {
  it("reads og tags and resolves a relative image", () => {
    expect(parseMeta(page, "https://rauno.me/craft/depth")).toEqual({
      title: "Designing Depth",
      description: "How do you distill a 3D world?",
      imageUrl: "https://rauno.me/static/og-depth.png",
      imageWidth: 1200,
      siteName: "rauno.me",
    });
  });

  it("falls back to twitter and name=description, and drops non-http images", () => {
    const meta = parseMeta(
      `<meta name="description" content="Plain"><meta name="twitter:image" content="data:image/png;base64,AA">`,
      "https://a.test/",
    );
    expect(meta).toMatchObject({ description: "Plain", imageUrl: null, imageWidth: null });
  });
});

describe("enrichUrl", () => {
  it("records an error instead of throwing", async () => {
    const fetch = (async () => new Response("no", { status: 500 })) as typeof globalThis.fetch;
    const result = await enrichUrl(fetch, "https://a.test/x", new Date("2026-10-05T10:00:00Z"));
    expect(result).toMatchObject({ url: "https://a.test/x", error: "https://a.test/x returned 500", fetchedAt: "2026-10-05T10:00:00.000Z" });
  });
});

describe("enrichPending", () => {
  const now = new Date("2026-10-05T10:00:00Z");
  const ok = (async () => new Response(page)) as typeof globalThis.fetch;

  it("fetches only URLs without a row, up to the limit", async () => {
    const store = new MemoryEnrichmentStore();
    await store.put({ url: "https://done.test/", title: "x", description: null, imageUrl: null, imageWidth: null, siteName: null, fetchedAt: now.toISOString(), error: null });
    const result = await enrichPending(store, ok, ["https://done.test/", "https://a.test/", "https://b.test/", "https://c.test/"], now, 2);
    expect(result).toEqual({ fetched: 2, failed: 0 });
    expect((await store.all()).map((e) => e.url).sort()).toEqual(["https://a.test/", "https://b.test/", "https://done.test/"]);
  });

  it("retries an errored row only after 7 days", async () => {
    const store = new MemoryEnrichmentStore();
    const errored = (days: number) => ({
      url: `https://e${days}.test/`,
      title: null, description: null, imageUrl: null, imageWidth: null, siteName: null,
      fetchedAt: new Date(now.getTime() - days * 86_400_000).toISOString(),
      error: "boom",
    });
    await store.put(errored(3));
    await store.put(errored(8));
    const result = await enrichPending(store, ok, ["https://e3.test/", "https://e8.test/"], now);
    expect(result).toEqual({ fetched: 1, failed: 0 });
  });
});
```

Append to `tests/sources/instapaper.test.ts`:

```ts
import { MemoryEnrichmentStore, MemoryLifeLogStore } from "@/lib/life-log/memory-store";

describe("instapaper.archive", () => {
  it("enriches new article URLs and reports the enrichments tag", async () => {
    const enrichments = new MemoryEnrichmentStore();
    const fetch = (async () => new Response('<meta property="og:title" content="T">')) as typeof globalThis.fetch;
    const articles = parseInstapaper({ bookmarks: [bookmark(1), bookmark(2)] });
    const outcome = await instapaper.archive!(articles, {
      stores: { lifeLog: new MemoryLifeLogStore(), enrichments },
      fetch,
      now: new Date("2026-10-05T10:00:00Z"),
    });
    expect(outcome).toEqual({ note: "2 links enriched", tags: ["enrichments"] });
    expect(await enrichments.all()).toHaveLength(2);
  });
});
```

`bookmark` and `instapaper` are already in this file from Task 3. Merge the import.

Run: `npx vitest run tests/life-log/enrich.test.ts tests/sources/instapaper.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement `lib/life-log/enrich.ts`**

```ts
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
```

- [ ] **Step 3: Add `archive` to Instapaper**

In `lib/sources/instapaper.ts`, add the imports:

```ts
import { enrichPending } from "../life-log/enrich";
import { ENRICHMENTS_TAG } from "../life-log/tags";
```

Add to the definition:

```ts
  // Sprint 10: og: image and description for /life/saved/, ten new links a run.
  archive: async (articles, { stores, fetch, now }) => {
    const { fetched, failed } = await enrichPending(stores.enrichments, fetch, articles.map((a) => a.link), now);
    return {
      note: `${fetched} links enriched${failed ? ` · ${failed} failed` : ""}`,
      tags: fetched + failed > 0 ? [ENRICHMENTS_TAG] : [],
    };
  },
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/life-log/enrich.test.ts tests/sources/instapaper.test.ts`
Expected: PASS.

- [ ] **Step 5: Run all tests and commit**

Run: `npm test && npm run typecheck && npm run lint`

```bash
git add lib/life-log/enrich.ts lib/sources/instapaper.ts tests/life-log/enrich.test.ts tests/sources/instapaper.test.ts
git commit -m "Enrich liked articles with og: image and description

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 8: Read layer and archive views

**Files:**
- Create: `lib/life-log/read.ts`
- Create: `lib/life/archive.ts`
- Create: `tests/fixtures/life-log.json`, `tests/fixtures/enrichments.json`
- Test: `tests/life/archive.test.ts`

**Interfaces:**
- Consumes: `LifeLogRow` and `Enrichment` (Task 4); `filmDataSchema` (Task 5); `theatreDataSchema` (Task 6); `Book` with `readAt` and `Books` (Task 3); `Article` (Task 3); `httpUrl` (Task 2).
- Produces (`lib/life-log/read.ts`, server-only):
  - `readLifeLog(source: LifeLogSource): Promise<LifeLogRow[]>`, tagged `life:<source>`;
  - `readEnrichments(): Promise<Enrichment[]>`, tagged `enrichments`.
  - In fixture mode both read `tests/fixtures/life-log.json` / `enrichments.json`. With no database they return `[]`. A database error is cached for minutes.
- Produces (`lib/life/archive.ts`, pure):

  ```ts
  export interface ArchiveItem { key: string; title: string; fullTitle?: string; meta: string[]; href: string; image: string }
  export interface MonthGroup { month: number; label: string; items: ArchiveItem[] }
  export interface YearGroup { year: number; months: MonthGroup[] }
  export interface TheatreYear { year: number; andEarlier: boolean; items: ArchiveItem[] }
  export interface SavedItem { link: string; title: string; site: string; minutes: number | null; description: string; image: string }
  export function monthDay(date: string): string                    // "2026-09-08" → "Sep 8"
  export function countLabel(count: number, noun: string): string   // (1,"film") → "1 film"
  export function groupByMonth(entries: { date: string; item: ArchiveItem }[]): YearGroup[]
  export function filmArchive(rows: LifeLogRow[]): { years: YearGroup[]; undated: ArchiveItem[] }
  export function bookArchive(books: Books): { reading: ArchiveItem[]; years: YearGroup[]; undated: ArchiveItem[] }
  export function theatreArchive(rows: LifeLogRow[]): TheatreYear[]
  export function latestPlays(rows: LifeLogRow[], count: number): ArchiveItem[]
  export function savedItems(articles: Article[], enrichments: Enrichment[]): SavedItem[]
  ```

- [ ] **Step 1: Write the fixtures**

Create `tests/fixtures/life-log.json`. The rows are deliberately unsorted, because the views must sort by themselves.

```json
[
  { "source": "letterboxd", "key": "2026-08-25|disclosure day|2026|0", "occurredOn": "2026-08-25", "precision": "day",
    "data": { "title": "Disclosure Day", "year": 2026, "link": "https://letterboxd.com/onur/film/disclosure-day/", "poster": "https://a.ltrbxd.com/resized/film-poster/1/1/5/9/2/disclosure-day-0-230-0-345-crop.jpg", "rewatch": false } },
  { "source": "letterboxd", "key": "2026-09-26|love & other drugs|2010|0", "occurredOn": "2026-09-26", "precision": "day",
    "data": { "title": "Love & Other Drugs", "year": 2010, "link": "https://letterboxd.com/onur/film/love-other-drugs/", "poster": "https://a.ltrbxd.com/resized/film-poster/2/1/8/0/1/21801-love-other-drugs-0-230-0-345-crop.jpg", "rewatch": false } },
  { "source": "letterboxd", "key": "2026-09-08|pickled|2022|0", "occurredOn": "2026-09-08", "precision": "day",
    "data": { "title": "Pickled", "year": 2022, "link": "https://letterboxd.com/onur/film/pickled/", "poster": "https://a.ltrbxd.com/resized/film-poster/9/4/7/0/1/9/947019-pickled-0-230-0-345-crop.jpg", "rewatch": false } },
  { "source": "letterboxd", "key": "2025-12-14|heat|1995|0", "occurredOn": "2025-12-14", "precision": "day",
    "data": { "title": "Heat", "year": 1995, "link": "https://boxd.it/aaaa", "rewatch": true } },
  { "source": "letterboxd", "key": "undated|the matrix|1999|0", "occurredOn": null, "precision": "none",
    "data": { "title": "The Matrix", "year": 1999, "link": "https://boxd.it/m1", "rewatch": false } },
  { "source": "letterboxd", "key": "undated|amélie|2001|0", "occurredOn": null, "precision": "none",
    "data": { "title": "Amélie", "year": 2001, "link": "https://boxd.it/m2", "rewatch": false } },
  { "source": "theatre", "key": "1481396", "occurredOn": "2026-01-01", "precision": "year",
    "data": { "title": "Adel Seni Seçti", "slug": "adel-seni-secti-1", "company": "Ankara Devlet Tiyatrosu", "poster": "https://tiyatrolar.com.tr/files/activity/a/adel-seni-secti-1/image/adel-seni-secti-1.jpg", "link": "https://tiyatrolar.com.tr/tiyatro/adel-seni-secti-1", "andEarlier": false } },
  { "source": "theatre", "key": "1477481", "occurredOn": "2026-01-01", "precision": "year",
    "data": { "title": "İki", "slug": "iki", "company": "Bilkent International Laboratory Theatre (BILT)", "poster": "", "link": "https://tiyatrolar.com.tr/tiyatro/iki", "andEarlier": false } },
  { "source": "theatre", "key": "94791", "occurredOn": "2015-01-01", "precision": "year",
    "data": { "title": "Woyzeck Masalı", "slug": "woyzeck-masali", "company": "Tatbikat Sahnesi", "poster": "", "link": "https://tiyatrolar.com.tr/tiyatro/woyzeck-masali", "andEarlier": true } },
  { "source": "theatre", "key": "94778", "occurredOn": "2015-01-01", "precision": "year",
    "data": { "title": "Söylentiler", "slug": "soylentiler", "company": "Ankara Devlet Tiyatrosu", "poster": "", "link": "https://tiyatrolar.com.tr/tiyatro/soylentiler", "andEarlier": true } }
]
```

Create `tests/fixtures/enrichments.json`. The URLs are the two titled bookmarks in `tests/fixtures/instapaper.json`.

```json
[
  { "url": "https://fabiensanglard.net/jurrasic_park_computers/index.html", "title": "Jurassic Park computers in excruciating detail",
    "description": "I watched the movie again and researched every computer and piece of software I spotted.",
    "imageUrl": "https://fabiensanglard.net/jurrasic_park_computers/og.jpg", "imageWidth": 1200, "siteName": null,
    "fetchedAt": "2026-10-05T10:00:00.000Z", "error": null },
  { "url": "https://blog.unitedheroes.net/5751", "title": "Leaving Mozilla", "description": "Leaving Mozilla",
    "imageUrl": "https://blog.unitedheroes.net/JRS_128x128.jpg", "imageWidth": null, "siteName": null,
    "fetchedAt": "2026-10-05T10:00:00.000Z", "error": null }
]
```

- [ ] **Step 2: Write the failing view tests**

Create `tests/life/archive.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  bookArchive,
  countLabel,
  filmArchive,
  latestPlays,
  monthDay,
  savedItems,
  theatreArchive,
} from "@/lib/life/archive";
import type { LifeLogRow } from "@/lib/life-log/types";
import type { Book } from "@/lib/sources/goodreads";
import { parseInstapaper } from "@/lib/sources/instapaper";
import { fixture } from "../helpers/fixtures";

const rows = JSON.parse(fixture("life-log.json")) as LifeLogRow[];

describe("labels", () => {
  it("formats days and counts", () => {
    expect(monthDay("2026-09-08")).toBe("Sep 8");
    expect(countLabel(1, "film")).toBe("1 film");
    expect(countLabel(9, "film")).toBe("9 films");
    expect(countLabel(2, "play")).toBe("2 plays");
  });
});

describe("filmArchive", () => {
  const archive = filmArchive(rows);

  it("groups dated films by year and month, newest first, with real counts", () => {
    expect(archive.years.map((y) => y.year)).toEqual([2026, 2025]);
    expect(archive.years[0].months.map((m) => [m.label, m.items.map((i) => i.title)])).toEqual([
      ["September", ["Love & Other Drugs", "Pickled"]],
      ["August", ["Disclosure Day"]],
    ]);
  });

  it("captions with the watch day, ↻ on a rewatch, and never the release year", () => {
    const [love] = archive.years[0].months[0].items;
    expect(love.meta).toEqual(["Sep 26"]);
    const [heat] = archive.years[1].months[0].items;
    expect(heat.meta).toEqual(["Dec 14 · ↻"]);
    expect(heat.image).toBe("");
    const captions = archive.years.flatMap((y) => y.months.flatMap((m) => m.items.flatMap((i) => [i.title, ...i.meta])));
    expect(captions.join(" ")).not.toMatch(/1995|2010|2022/);
  });

  it("lists undated films alphabetically", () => {
    expect(archive.undated.map((i) => i.title)).toEqual(["Amélie", "The Matrix"]);
  });

  it("skips rows from other sources and rows whose data doesn't parse", () => {
    const broken: LifeLogRow = { source: "letterboxd", key: "x", occurredOn: "2026-01-01", precision: "day", data: { nope: 1 } };
    expect(filmArchive([...rows, broken]).years[0].months).toHaveLength(2);
  });
});

describe("bookArchive", () => {
  const book = (title: string, readAt: string, extra: Partial<Book> = {}): Book => ({
    title,
    author: "Author",
    cover: "https://i.gr-assets.com/c.jpg",
    numRating: 0,
    review: "",
    link: `https://www.goodreads.com/review/show/${title.length}`,
    date: readAt || "2026-01-01T00:00:00.000Z",
    readAt,
    addedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  });

  it("puts reading now first, dated reads by Istanbul month, then undated", () => {
    const archive = bookArchive({
      currentlyReading: [book("Harry Potter and the Deathly Hallows (Harry Potter, #7)", "")],
      read: [book("Annem Şefika", "2026-09-24T21:30:00.000Z"), book("No Date", ""), book("Hacı Komünist", "2026-07-18T00:00:00.000Z")],
    });
    expect(archive.reading[0]).toMatchObject({
      title: "Harry Potter and the Deathly Hallows",
      fullTitle: "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
      meta: ["Author"],
    });
    // 21:30 UTC on Sep 24 is Sep 25 in Istanbul.
    expect(archive.years[0].months[0]).toMatchObject({ label: "September", items: [{ title: "Annem Şefika", meta: ["Author", "Sep 25"] }] });
    expect(archive.years[0].months[1].label).toBe("July");
    expect(archive.undated.map((i) => i.title)).toEqual(["No Date"]);
  });
});

describe("theatreArchive", () => {
  it("groups by year, newest first, newest post first, and flags and-earlier", () => {
    const years = theatreArchive(rows);
    expect(years.map((y) => [y.year, y.andEarlier, y.items.map((i) => i.title)])).toEqual([
      [2026, false, ["Adel Seni Seçti", "İki"]],
      [2015, true, ["Woyzeck Masalı", "Söylentiler"]],
    ]);
    expect(years[0].items[0].meta).toEqual(["Ankara Devlet Tiyatrosu"]);
  });

  it("latestPlays takes the newest across years", () => {
    expect(latestPlays(rows, 3).map((i) => i.title)).toEqual(["Adel Seni Seçti", "İki", "Woyzeck Masalı"]);
  });
});

describe("savedItems", () => {
  const articles = parseInstapaper(JSON.parse(fixture("instapaper.json")));
  const enrichments = JSON.parse(fixture("enrichments.json"));

  it("prefers the enriched description and a wide enough image", () => {
    const [jurassic] = savedItems(articles, enrichments);
    expect(jurassic).toEqual({
      link: "https://fabiensanglard.net/jurrasic_park_computers/index.html",
      title: "Jurassic Park computers in excruciating detail",
      site: "fabiensanglard.net",
      minutes: 13,
      description: "I watched the movie again and researched every computer and piece of software I spotted.",
      image: "https://fabiensanglard.net/jurrasic_park_computers/og.jpg",
    });
  });

  it("drops a small avatar image and a description that only repeats the title", () => {
    const [, mozilla] = savedItems(articles, enrichments);
    expect(mozilla.image).toBe("");
    expect(mozilla.description).toMatch(/^After more than 15 years/);
  });

  it("works with no enrichments at all", () => {
    expect(savedItems(articles, []).map((i) => i.title)).toEqual(articles.map((a) => a.title));
  });
});
```

Run: `npx vitest run tests/life/archive.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `lib/life/archive.ts`**

```ts
import { filmDataSchema } from "../life-log/films";
import type { Enrichment, LifeLogRow } from "../life-log/types";
import { httpUrl } from "../sources/http";
import type { Book, Books } from "../sources/goodreads";
import type { Article } from "../sources/instapaper";
import { theatreDataSchema } from "../sources/theatre";

// Pure views for the Life archive pages (spec §1): rows in, tiles grouped by
// year and month out. No ratings, no release years in film captions, and
// every count is the real size of its group.

export interface ArchiveItem {
  key: string;
  title: string;
  // The untrimmed title when the caption shortened it (a series suffix).
  fullTitle?: string;
  // Muted caption lines under the title.
  meta: string[];
  href: string;
  image: string;
}
export interface MonthGroup {
  month: number;
  label: string;
  items: ArchiveItem[];
}
export interface YearGroup {
  year: number;
  months: MonthGroup[];
}
export interface TheatreYear {
  year: number;
  andEarlier: boolean;
  items: ArchiveItem[];
}
export interface SavedItem {
  link: string;
  title: string;
  site: string;
  minutes: number | null;
  description: string;
  image: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "2026-09-08" → "Sep 8".
export function monthDay(date: string): string {
  const [, month, day] = date.split("-").map(Number);
  return `${MONTHS[month - 1].slice(0, 3)} ${day}`;
}

export function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

const last = <T>(list: T[]): T | undefined => list[list.length - 1];

// Newest first by YYYY-MM-DD; entries on the same day keep their input order.
export function groupByMonth(entries: { date: string; item: ArchiveItem }[]): YearGroup[] {
  const sorted = entries
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => (a.date === b.date ? a.index - b.index : a.date < b.date ? 1 : -1));
  const years: YearGroup[] = [];
  for (const { date, item } of sorted) {
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(5, 7));
    let group = last(years);
    if (!group || group.year !== year) {
      group = { year, months: [] };
      years.push(group);
    }
    let bucket = last(group.months);
    if (!bucket || bucket.month !== month) {
      bucket = { month, label: MONTHS[month - 1], items: [] };
      group.months.push(bucket);
    }
    bucket.items.push(item);
  }
  return years;
}

export function filmArchive(rows: LifeLogRow[]): { years: YearGroup[]; undated: ArchiveItem[] } {
  const dated: { date: string; item: ArchiveItem }[] = [];
  const undated: ArchiveItem[] = [];
  for (const row of rows) {
    if (row.source !== "letterboxd") continue;
    const parsed = filmDataSchema.safeParse(row.data);
    if (!parsed.success) continue;
    const film = parsed.data;
    const base = { key: row.key, title: film.title, href: httpUrl(film.link), image: httpUrl(film.poster) };
    if (row.occurredOn) {
      dated.push({ date: row.occurredOn, item: { ...base, meta: [`${monthDay(row.occurredOn)}${film.rewatch ? " · ↻" : ""}`] } });
    } else {
      undated.push({ ...base, meta: [] });
    }
  }
  undated.sort((a, b) => a.title.localeCompare(b.title, "en"));
  return { years: groupByMonth(dated), undated };
}

const istanbulDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// " (Harry Potter, #7)" and similar series suffixes.
const SERIES_SUFFIX = /\s*\([^()]*#\d+(?:\.\d+)?\)\s*$/;

function bookItem(book: Book, meta: string[]): ArchiveItem {
  const title = book.title.replace(SERIES_SUFFIX, "").trim() || book.title;
  return {
    key: book.link || book.title,
    title,
    ...(title !== book.title ? { fullTitle: book.title } : {}),
    meta,
    href: httpUrl(book.link),
    image: httpUrl(book.cover),
  };
}

export function bookArchive(books: Books): { reading: ArchiveItem[]; years: YearGroup[]; undated: ArchiveItem[] } {
  const dated: { date: string; item: ArchiveItem }[] = [];
  const undated: ArchiveItem[] = [];
  for (const book of books.read) {
    const time = book.readAt ? Date.parse(book.readAt) : NaN;
    if (Number.isNaN(time)) {
      undated.push(bookItem(book, [book.author]));
      continue;
    }
    const date = istanbulDate.format(time);
    dated.push({ date, item: bookItem(book, [book.author, monthDay(date)]) });
  }
  return {
    reading: books.currentlyReading.map((book) => bookItem(book, [book.author])),
    years: groupByMonth(dated),
    undated,
  };
}

export function theatreArchive(rows: LifeLogRow[]): TheatreYear[] {
  const byYear = new Map<number, { andEarlier: boolean; entries: { id: number; item: ArchiveItem }[] }>();
  for (const row of rows) {
    if (row.source !== "theatre" || !row.occurredOn) continue;
    const parsed = theatreDataSchema.safeParse(row.data);
    if (!parsed.success) continue;
    const play = parsed.data;
    const year = Number(row.occurredOn.slice(0, 4));
    const group = byYear.get(year) ?? { andEarlier: false, entries: [] };
    group.andEarlier ||= play.andEarlier;
    group.entries.push({
      id: Number(row.key),
      item: { key: row.key, title: play.title, meta: play.company ? [play.company] : [], href: httpUrl(play.link), image: httpUrl(play.poster) },
    });
    byYear.set(year, group);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, group]) => ({
      year,
      andEarlier: group.andEarlier,
      // Activity post ids grow over time: higher is newer.
      items: group.entries.sort((a, b) => b.id - a.id).map((entry) => entry.item),
    }));
}

export function latestPlays(rows: LifeLogRow[], count: number): ArchiveItem[] {
  return theatreArchive(rows)
    .flatMap((year) => year.items)
    .slice(0, count);
}

const MIN_IMAGE_WIDTH = 400;
// "…_128x128.jpg"-style avatars in the URL.
const SIZE_IN_URL = /(?:^|[^0-9])(\d{2,4})x(\d{2,4})(?:[^0-9]|$)/;

function usableImage(url: string | null | undefined, width: number | null | undefined): string {
  if (!url || !url.startsWith("https:")) return "";
  if (width != null && width < MIN_IMAGE_WIDTH) return "";
  const size = SIZE_IN_URL.exec(url);
  if (size && Number(size[1]) < MIN_IMAGE_WIDTH && Number(size[2]) < MIN_IMAGE_WIDTH) return "";
  return url;
}

function usableDescription(candidates: (string | null | undefined)[], title: string): string {
  for (const candidate of candidates) {
    const text = (candidate ?? "").replace(/\s+/g, " ").trim();
    if (text && text.toLowerCase() !== title.trim().toLowerCase()) return text;
  }
  return "";
}

export function savedItems(articles: Article[], enrichments: Enrichment[]): SavedItem[] {
  const byUrl = new Map(enrichments.map((enrichment) => [enrichment.url, enrichment]));
  return articles.map((article) => {
    const enrichment = byUrl.get(article.link);
    return {
      link: article.link,
      title: article.title,
      site: article.domain,
      minutes: article.minutes,
      description: usableDescription([enrichment?.description, article.description], article.title),
      image: usableImage(enrichment?.imageUrl, enrichment?.imageWidth) || usableImage(article.image, null),
    };
  });
}
```

Run: `npx vitest run tests/life/archive.test.ts`
Expected: PASS. If the Mozilla fixture article's own description doesn't start with "After more than 15 years", adapt the regex to its first words. The test only proves the fallback to Instapaper's description.

- [ ] **Step 4: Implement `lib/life-log/read.ts`**

```ts
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "../db/client";
import { DrizzleEnrichmentStore, DrizzleLifeLogStore } from "./drizzle-store";
import { ENRICHMENTS_TAG, lifeLogTag } from "./tags";
import type { Enrichment, LifeLogRow, LifeLogSource } from "./types";

// Page-side reads of the archive tables, cached and tagged like readSource:
// pages are prerendered and regenerate when a sync's archive step
// revalidates the tag. Never throws: no database or an error renders empty
// (an error only for minutes, since it is probably transient).

async function fixtureJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(join(process.cwd(), "tests", "fixtures", name), "utf8")) as T;
}

export async function readLifeLog(source: LifeLogSource): Promise<LifeLogRow[]> {
  "use cache";
  cacheTag(lifeLogTag(source));
  if (process.env.SOURCE_FIXTURES === "1") {
    cacheLife("hours");
    return (await fixtureJson<LifeLogRow[]>("life-log.json")).filter((row) => row.source === source);
  }
  const db = getDb();
  if (!db) {
    cacheLife("hours");
    return [];
  }
  try {
    const rows = await new DrizzleLifeLogStore(db).list(source);
    cacheLife("hours");
    return rows;
  } catch (e) {
    console.warn(`[life-log] reading ${source} failed:`, e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return [];
  }
}

export async function readEnrichments(): Promise<Enrichment[]> {
  "use cache";
  cacheTag(ENRICHMENTS_TAG);
  if (process.env.SOURCE_FIXTURES === "1") {
    cacheLife("hours");
    return fixtureJson<Enrichment[]>("enrichments.json");
  }
  const db = getDb();
  if (!db) {
    cacheLife("hours");
    return [];
  }
  try {
    const rows = await new DrizzleEnrichmentStore(db).all();
    cacheLife("hours");
    return rows;
  } catch (e) {
    console.warn("[life-log] reading enrichments failed:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return [];
  }
}
```

The fixture files are read with `process.cwd()`, the same way `lib/sources/fixtures.ts` reads them. That works in `next start` from the repo root, which is how `e2e:fixtures` runs.

- [ ] **Step 5: Run all tests, typecheck and lint, then commit**

Run: `npm test && npm run typecheck && npm run lint`

```bash
git add lib/life-log/read.ts lib/life/archive.ts tests/fixtures/life-log.json tests/fixtures/enrichments.json tests/life/archive.test.ts
git commit -m "Group archive rows into years, months and tiles for the Life pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 9: Archive components

**Files:**
- Create: `components/life/archive/archive-header.tsx`
- Create: `components/life/archive/archive-main.tsx`
- Create: `components/life/archive/archive-tile.tsx`
- Create: `components/life/archive/tile-fallback.tsx`
- Create: `components/life/archive/tile-row.tsx`
- Create: `components/life/archive/year-months.tsx`
- Create: `components/life/archive/year-index.tsx`
- Create: `components/life/archive/saved-list.tsx`
- Modify: `app/(work)/system/page.tsx` (`ArchiveTile` specimen), `e2e/system.spec.ts` (`PRIMITIVES` gains `"ArchiveTile"`)
- Test: `tests/life/archive-components.test.tsx`

**Interfaces:**
- Consumes: `ArchiveItem`, `YearGroup`, `SavedItem` and `countLabel` (Task 8); `SectionRow` and `ROW_GRID` (`components/ui/section-row.tsx`); `Cover`; `DitherRule`; `TextLink`; `ItemLink`; `Empty`; `DitherGradient`; `useTokenColor`.
- Produces:
  - `ArchiveHeader({ title, lede, source: { label, href } })`;
  - `ArchiveMain({ rows: ReactNode[] })`, which puts a `DitherRule` between rows;
  - `ArchiveTile({ item })` and `TILE_GRID`;
  - `TileFallback({ initial, shape?: "poster" | "wide", className? })`;
  - `TileRow({ heading, lines?, items, as?: "h2" | "h3", id? })`;
  - `YearMonths({ group, noun })`;
  - `YearIndex({ entries: { label: string; href: string; current: boolean; doto: boolean }[] })`;
  - `SavedList({ items })`;
  - `initialOf(title: string): string`.

- [ ] **Step 1: Write the failing render tests**

Create `tests/life/archive-components.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArchiveTile, initialOf } from "@/components/life/archive/archive-tile";
import { SavedList } from "@/components/life/archive/saved-list";
import { TileRow } from "@/components/life/archive/tile-row";
import { YearIndex } from "@/components/life/archive/year-index";
import { YearMonths } from "@/components/life/archive/year-months";

const item = { key: "k", title: "Pickled", meta: ["Sep 8"], href: "https://letterboxd.com/onur/film/pickled/", image: "https://a.ltrbxd.com/p.jpg" };

describe("ArchiveTile", () => {
  it("links the poster and caption upstream, with the meta line", () => {
    const html = renderToStaticMarkup(<ArchiveTile item={item} />);
    expect(html).toContain('href="https://letterboxd.com/onur/film/pickled/"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('src="https://a.ltrbxd.com/p.jpg"');
    expect(html).toContain("Pickled");
    expect(html).toContain("Sep 8");
  });

  it("falls back to the dither tile with the initial, and keeps the full title", () => {
    const html = renderToStaticMarkup(<ArchiveTile item={{ ...item, image: "", title: "İki", fullTitle: "İki (Series, #2)" }} />);
    expect(html).not.toContain("<img");
    expect(html).toContain(">İ<");
    expect(html).toContain('title="İki (Series, #2)"');
  });

  it("initialOf uppercases with Turkish rules", () => {
    expect(initialOf("iki")).toBe("İ");
    expect(initialOf("  ölü deniz")).toBe("Ö");
  });
});

describe("YearMonths and TileRow", () => {
  it("renders the year, each month with its real count, and tiles", () => {
    const html = renderToStaticMarkup(
      <YearMonths group={{ year: 2026, months: [{ month: 9, label: "September", items: [item, { ...item, key: "k2" }] }, { month: 8, label: "August", items: [item] }] }} noun="film" />,
    );
    expect(html).toContain(">2026<");
    expect(html).toContain("September");
    expect(html).toContain("2 films");
    expect(html).toContain("1 film<");
  });

  it("TileRow prints its extra label lines", () => {
    const html = renderToStaticMarkup(<TileRow heading="2015" lines={["17 plays", "and earlier"]} items={[item]} as="h2" />);
    expect(html).toContain("17 plays");
    expect(html).toContain("and earlier");
  });
});

describe("YearIndex", () => {
  it("marks the current year and links the others with trailing slashes", () => {
    const html = renderToStaticMarkup(
      <YearIndex
        entries={[
          { label: "2026", href: "/life/films/2026/", current: true, doto: true },
          { label: "Undated", href: "/life/films/undated/", current: false, doto: false },
        ]}
      />,
    );
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/life/films/undated/"');
  });
});

describe("SavedList", () => {
  it("renders site, minutes, title, description and the image", () => {
    const html = renderToStaticMarkup(
      <SavedList items={[{ link: "https://rauno.me/craft/depth", title: "Designing Depth", site: "rauno.me", minutes: 6, description: "How do you distill…", image: "https://rauno.me/og.png" }]} />,
    );
    for (const text of ["rauno.me", "6 min", "Designing Depth", "How do you distill…", 'src="https://rauno.me/og.png"', 'href="https://rauno.me/craft/depth"']) {
      expect(html).toContain(text);
    }
  });
});
```

Run: `npx vitest run tests/life/archive-components.test.tsx`
Expected: FAIL (modules missing).

- [ ] **Step 2: Implement the components**

`components/life/archive/archive-header.tsx`:

```tsx
import { ItemLink } from "@/components/sections/item-link";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";

// The archive pages' first row, the /life/notes/ pattern: ← Life, the title
// with its muted lede, and the upstream profile as the action.
export function ArchiveHeader({ title, lede, source }: { title: string; lede: string; source: { label: string; href: string } }) {
  return (
    <SectionRow
      labelAs="div"
      label={
        <ItemLink href="/life/" className="text-fg-muted">
          ← Life
        </ItemLink>
      }
      action={<TextLink href={source.href}>{source.label}</TextLink>}
    >
      <h1 className="type-lead">
        {title} <span className="text-fg-muted">{lede}</span>
      </h1>
    </SectionRow>
  );
}
```

`components/life/archive/archive-main.tsx`:

```tsx
import { Fragment, type ReactNode } from "react";
import { DitherRule } from "@/components/ui/dither";

// Rows of an archive page with the dither rule between them, like /life/.
export function ArchiveMain({ rows }: { rows: ReactNode[] }) {
  return (
    <main className="pb-8">
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          {row}
        </Fragment>
      ))}
    </main>
  );
}
```

`components/life/archive/tile-fallback.tsx`:

```tsx
"use client";

import { useState } from "react";
import { DitherGradient } from "@/components/dither-kit/gradient";
import { useTokenColor } from "@/components/ui/use-token-color";
import { cx } from "@/lib/cx";

// An archive tile with no image: the accent dither rising from the bottom
// and the title's initial in Doto. Decorative; the caption names the item.
export function TileFallback({
  initial,
  shape = "poster",
  className,
}: {
  initial: string;
  shape?: "poster" | "wide";
  className?: string;
}) {
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  const accent = useTokenColor(el, "--color-accent");
  return (
    <span
      ref={setEl}
      aria-hidden="true"
      className={cx(
        "relative flex w-full items-center justify-center overflow-hidden bg-line",
        shape === "poster" ? "aspect-[2/3]" : "aspect-[16/10]",
        className,
      )}
    >
      <span className="absolute inset-0 block">
        {accent ? <DitherGradient from={accent} direction="up" cell={3} opacity={0.55} /> : null}
      </span>
      <span className="relative bg-bg px-1.5 py-0.5 type-name">{initial}</span>
    </span>
  );
}
```

`components/life/archive/archive-tile.tsx`:

```tsx
import { Cover } from "@/components/ui/cover";
import type { ArchiveItem } from "@/lib/life/archive";
import { TileFallback } from "./tile-fallback";

// Tiles at least 84px wide, as many as fit: 3–4 across at 390px.
export const TILE_GRID = "grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-x-2.5 gap-y-3";

export function initialOf(title: string): string {
  const first = Array.from(title.trim())[0];
  return first ? first.toLocaleUpperCase("tr") : "·";
}

// A 2:3 poster or cover with up to two caption lines (title) and its meta
// lines. The whole tile links to the item upstream.
export function ArchiveTile({ item }: { item: ArchiveItem }) {
  const body = (
    <>
      {item.image ? (
        <Cover src={item.image} alt="" width={84} className="mb-1" />
      ) : (
        <TileFallback initial={initialOf(item.title)} className="mb-1" />
      )}
      <span className="line-clamp-2 type-label text-fg group-hover:underline group-hover:underline-offset-[0.2em]">
        {item.title}
      </span>
      {item.meta.map((line, index) => (
        <span key={index} className="truncate type-label text-fg-muted">
          {line}
        </span>
      ))}
    </>
  );
  return (
    <li title={item.fullTitle}>
      {item.href ? (
        <a href={item.href} rel="noopener noreferrer" className="group flex flex-col gap-0.5">
          {body}
        </a>
      ) : (
        <div className="flex flex-col gap-0.5">{body}</div>
      )}
    </li>
  );
}
```

`components/life/archive/tile-row.tsx`:

```tsx
import type { ReactNode } from "react";
import type { ArchiveItem } from "@/lib/life/archive";
import { ArchiveTile, TILE_GRID } from "./archive-tile";

// A label column (heading plus muted lines) and a strip of tiles that runs to
// the page's right edge. Rows in a group are split by a hairline.
export const TILE_ROW = "grid grid-cols-1 gap-3 px-4 py-5 md:px-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-7";

export function TileRow({
  heading,
  lines = [],
  items,
  as: Heading = "h3",
  id,
}: {
  heading: ReactNode;
  lines?: string[];
  items: ArchiveItem[];
  as?: "h2" | "h3";
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t first:border-t-0">
      <div className={TILE_ROW}>
        <Heading className="type-body font-normal text-fg">
          {heading}
          {lines.map((line) => (
            <span key={line} className="block type-meta text-fg-muted">
              {line}
            </span>
          ))}
        </Heading>
        <ul className={TILE_GRID}>
          {items.map((item) => (
            <ArchiveTile key={item.key} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
}
```

`components/life/archive/year-months.tsx`:

```tsx
import { type YearGroup, countLabel } from "@/lib/life/archive";
import { TILE_ROW, TileRow } from "./tile-row";

// One year: its Doto heading, then one row per month (name and real count in
// the label column, the month's tiles beside it).
export function YearMonths({ group, noun }: { group: YearGroup; noun: string }) {
  return (
    <section id={`year-${group.year}`} aria-labelledby={`year-${group.year}-heading`} className="scroll-mt-20">
      <div className={TILE_ROW}>
        <h2 id={`year-${group.year}-heading`} className="type-name">
          {group.year}
        </h2>
      </div>
      <div className="border-t">
        {group.months.map((month) => (
          <TileRow
            key={month.month}
            heading={month.label}
            lines={[countLabel(month.items.length, noun)]}
            items={month.items}
          />
        ))}
      </div>
    </section>
  );
}
```

`components/life/archive/year-index.tsx`:

```tsx
import Link from "next/link";
import { cx } from "@/lib/cx";

// The Films year index: every year with films (Doto) plus Undated.
export function YearIndex({ entries }: { entries: { label: string; href: string; current: boolean; doto: boolean }[] }) {
  return (
    <nav aria-label="Years">
      <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {entries.map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              aria-current={entry.current ? "page" : undefined}
              className={cx(
                entry.doto ? "type-name" : "type-body",
                entry.current ? "text-fg" : "text-fg-muted hover:text-fg hover:underline hover:underline-offset-[0.2em]",
              )}
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

`components/life/archive/saved-list.tsx`:

```tsx
import type { SavedItem } from "@/lib/life/archive";
import { cx } from "@/lib/cx";
import { initialOf } from "./archive-tile";
import { TileFallback } from "./tile-fallback";

// The Saved list (mockup reading-list option 3): site and length in the label
// column, title and description in the 480px column, a 16:10 image on the
// right. Below lg: image on top, then the text, then site and length.
const SAVED_ROW = "grid grid-cols-1 gap-3 px-4 py-5 md:px-10 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7";

export function SavedList({ items }: { items: SavedItem[] }) {
  return (
    <ul aria-label="Saved articles">
      {items.map((item) => (
        <li key={item.link} className="border-t first:border-t-0">
          <a href={item.link} rel="noopener noreferrer" className={cx(SAVED_ROW, "group")}>
            <span className="order-3 flex flex-col type-meta text-fg-muted lg:order-1">
              <span className="truncate">{item.site}</span>
              {item.minutes ? <span>{item.minutes} min</span> : null}
            </span>
            <span className="order-2 flex min-w-0 flex-col gap-1">
              <span className="type-lead text-fg group-hover:underline group-hover:underline-offset-[0.2em]">{item.title}</span>
              {item.description ? <span className="line-clamp-2 type-meta text-fg-soft">{item.description}</span> : null}
            </span>
            <span className="order-1 block w-full lg:order-3 lg:w-[104px] lg:justify-self-end">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote og:image; no optimization by design
                <img
                  src={item.image}
                  alt=""
                  width={208}
                  height={130}
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[16/10] w-full bg-line object-cover"
                />
              ) : (
                <TileFallback initial={initialOf(item.site)} shape="wide" />
              )}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Run the render tests**

Run: `npx vitest run tests/life/archive-components.test.tsx`
Expected: PASS. `TileFallback` is a client component; under `renderToStaticMarkup` it renders the initial with no canvas, because `accent` is null on the server.

- [ ] **Step 4: Add the `/system/` specimen**

In `app/(work)/system/page.tsx`:
- Import `ArchiveTile` from `@/components/life/archive/archive-tile`.
- Add after the `Cover` specimen:

```tsx
        <Specimen name="ArchiveTile">
          <ul className="grid w-48 grid-cols-2 gap-x-2.5">
            <ArchiveTile item={{ key: "a", title: "A film title that wraps", meta: ["Sep 8 · ↻"], href: "", image: "" }} />
            <ArchiveTile item={{ key: "b", title: "İki", meta: ["Ankara Devlet Tiyatrosu"], href: "", image: "" }} />
          </ul>
        </Specimen>
```

Add `"ArchiveTile",` to `PRIMITIVES` in `e2e/system.spec.ts`.

- [ ] **Step 5: Run all tests, typecheck and lint, then commit**

Run: `npm test && npm run typecheck && npm run lint`

```bash
git add components/life/archive "app/(work)/system/page.tsx" e2e/system.spec.ts tests/life/archive-components.test.tsx
git commit -m "Add the archive tiles, rows, year index and Saved list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 10: Archive pages

**Files:**
- Create: `components/life/archive/films-archive.tsx`
- Create: `components/life/archive/books-archive.tsx`
- Create: `components/life/archive/theatre-archive.tsx`
- Create: `components/life/archive/saved-archive.tsx`
- Create: `app/life/films/page.tsx`, `app/life/films/[year]/page.tsx`, `app/life/books/page.tsx`, `app/life/theatre/page.tsx`, `app/life/saved/page.tsx`
- Modify: `lib/sources/theatre.ts` (export `THEATRE_PROFILE_URL`)
- Test: `e2e/life-archives.spec.ts` (new; no database), `e2e-fixtures/life-archives.spec.ts` (new; fixture data)

**Interfaces:**
- Consumes: everything from Tasks 8–9, plus `readSource` and `pageMetadata`.
- Produces: the routes `/life/films/`, `/life/films/<year>/`, `/life/films/undated/`, `/life/books/`, `/life/theatre/` and `/life/saved/`.

- [ ] **Step 1: Write the page bodies**

In `lib/sources/theatre.ts`, add below `PROFILE`:

```ts
// Onur's watched list, the Theatre archive's upstream link.
export const THEATRE_PROFILE_URL = "https://tiyatrolar.com.tr/u/onursenture/izledikleri";
```

`components/life/archive/films-archive.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Empty } from "@/components/sections/empty";
import { SectionRow } from "@/components/ui/section-row";
import { profile } from "@/content/profile";
import { countLabel, filmArchive } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { ArchiveHeader } from "./archive-header";
import { ArchiveMain } from "./archive-main";
import { TileRow } from "./tile-row";
import { YearIndex } from "./year-index";
import { YearMonths } from "./year-months";

const SOURCE = { label: "Letterboxd", href: `https://letterboxd.com/${profile.social.letterboxd}/` };
const base = "/life/films/";

// /life/films/ (year = null: the newest year) and /life/films/<year|undated>/.
export async function FilmsArchive({ year }: { year: string | null }) {
  const archive = filmArchive(await readLifeLog("letterboxd"));
  const header = <ArchiveHeader title="Films" lede="What I watched." source={SOURCE} />;
  const current = year ?? (archive.years[0] ? String(archive.years[0].year) : archive.undated.length > 0 ? "undated" : null);
  if (current === null) {
    return (
      <ArchiveMain
        rows={[
          header,
          <SectionRow key="empty" label={null}>
            <Empty>No films yet.</Empty>
          </SectionRow>,
        ]}
      />
    );
  }

  let body: ReactNode;
  if (current === "undated") {
    if (archive.undated.length === 0) notFound();
    body = (
      <div>
        <TileRow id="undated" as="h2" heading="Undated" lines={[countLabel(archive.undated.length, "film")]} items={archive.undated} />
      </div>
    );
  } else {
    const group = /^\d{4}$/.test(current) ? archive.years.find((g) => g.year === Number(current)) : undefined;
    if (!group) notFound();
    body = <YearMonths group={group} noun="film" />;
  }

  const entries = [
    ...archive.years.map((g) => ({ label: String(g.year), href: `${base}${g.year}/`, current: String(g.year) === current, doto: true })),
    ...(archive.undated.length > 0 ? [{ label: "Undated", href: `${base}undated/`, current: current === "undated", doto: false }] : []),
  ];
  return (
    <ArchiveMain
      rows={[
        header,
        <SectionRow key="years" label="Years" wide>
          <YearIndex entries={entries} />
        </SectionRow>,
        body,
      ]}
    />
  );
}
```

`components/life/archive/books-archive.tsx`:

```tsx
import { Empty } from "@/components/sections/empty";
import { SectionRow } from "@/components/ui/section-row";
import { profile } from "@/content/profile";
import { bookArchive, countLabel } from "@/lib/life/archive";
import { readSource } from "@/lib/sources/read";
import { ArchiveHeader } from "./archive-header";
import { ArchiveMain } from "./archive-main";
import { TileRow } from "./tile-row";
import { YearMonths } from "./year-months";

const SOURCE = { label: "Goodreads", href: `https://www.goodreads.com/${profile.social.goodreads}` };

export async function BooksArchive() {
  const archive = bookArchive((await readSource("goodreads")).data);
  const rows = [<ArchiveHeader key="header" title="Books" lede="What I read." source={SOURCE} />];
  if (archive.reading.length > 0) {
    // Wrapped so the row is a first child: no hairline next to the dither rule.
    rows.push(
      <div key="reading">
        <TileRow as="h2" heading="Reading now" items={archive.reading} />
      </div>,
    );
  }
  for (const group of archive.years) rows.push(<YearMonths key={group.year} group={group} noun="book" />);
  if (archive.undated.length > 0) {
    rows.push(
      <div key="undated">
        <TileRow as="h2" heading="Undated" lines={[countLabel(archive.undated.length, "book")]} items={archive.undated} />
      </div>,
    );
  }
  if (rows.length === 1) {
    rows.push(
      <SectionRow key="empty" label={null}>
        <Empty>No books yet.</Empty>
      </SectionRow>,
    );
  }
  return <ArchiveMain rows={rows} />;
}
```

`components/life/archive/theatre-archive.tsx`:

```tsx
import { Empty } from "@/components/sections/empty";
import { SectionRow } from "@/components/ui/section-row";
import { countLabel, theatreArchive } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { THEATRE_PROFILE_URL } from "@/lib/sources/theatre";
import { ArchiveHeader } from "./archive-header";
import { ArchiveMain } from "./archive-main";
import { TileRow } from "./tile-row";

const SOURCE = { label: "tiyatrolar.com.tr", href: THEATRE_PROFILE_URL };

// One row per year (spec §1.4): no months, since tiyatrolar only shows
// relative times. The oldest backfilled year is "and earlier".
export async function TheatreArchive() {
  const years = theatreArchive(await readLifeLog("theatre"));
  const header = <ArchiveHeader title="Theatre" lede="Plays I saw." source={SOURCE} />;
  if (years.length === 0) {
    return (
      <ArchiveMain
        rows={[
          header,
          <SectionRow key="empty" label={null}>
            <Empty>No plays yet.</Empty>
          </SectionRow>,
        ]}
      />
    );
  }
  return (
    <ArchiveMain
      rows={[
        header,
        <div key="years">
          {years.map((group) => (
            <TileRow
              key={group.year}
              id={`year-${group.year}`}
              as="h2"
              heading={<span className="block type-name">{group.year}</span>}
              lines={[countLabel(group.items.length, "play"), ...(group.andEarlier ? ["and earlier"] : [])]}
              items={group.items}
            />
          ))}
        </div>,
      ]}
    />
  );
}
```

`components/life/archive/saved-archive.tsx`:

```tsx
import { Empty } from "@/components/sections/empty";
import { SectionRow } from "@/components/ui/section-row";
import { profile } from "@/content/profile";
import { savedItems } from "@/lib/life/archive";
import { readEnrichments } from "@/lib/life-log/read";
import { readSource } from "@/lib/sources/read";
import { ArchiveHeader } from "./archive-header";
import { ArchiveMain } from "./archive-main";
import { SavedList } from "./saved-list";

const SOURCE = { label: "Instapaper", href: `https://www.instapaper.com/p/${profile.social.instapaper}` };

export async function SavedArchive() {
  const [articles, enrichments] = await Promise.all([readSource("instapaper"), readEnrichments()]);
  const items = savedItems(articles.data, enrichments);
  return (
    <ArchiveMain
      rows={[
        <ArchiveHeader key="header" title="Saved" lede="Articles I liked." source={SOURCE} />,
        items.length > 0 ? (
          <SavedList key="list" items={items} />
        ) : (
          <SectionRow key="empty" label={null}>
            <Empty>Nothing saved yet.</Empty>
          </SectionRow>
        ),
      ]}
    />
  );
}
```

- [ ] **Step 2: Add the routes**

`app/life/films/page.tsx`:

```tsx
import type { Metadata } from "next";
import { FilmsArchive } from "@/components/life/archive/films-archive";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Films");

export default function FilmsPage() {
  return <FilmsArchive year={null} />;
}
```

`app/life/films/[year]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { FilmsArchive } from "@/components/life/archive/films-archive";
import { filmArchive } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { pageMetadata } from "@/lib/metadata";

// cacheComponents needs at least one param: with no films yet, "undated"
// stands in (it 404s until there are undated films). Other years render on
// demand and are cached.
export async function generateStaticParams() {
  const archive = filmArchive(await readLifeLog("letterboxd"));
  const params = [
    ...archive.years.map((group) => ({ year: String(group.year) })),
    ...(archive.undated.length > 0 ? [{ year: "undated" }] : []),
  ];
  return params.length > 0 ? params : [{ year: "undated" }];
}

export async function generateMetadata({ params }: PageProps<"/life/films/[year]">): Promise<Metadata> {
  const { year } = await params;
  return pageMetadata(year === "undated" ? "Films · Undated" : `Films · ${year}`);
}

export default async function FilmsYearPage({ params }: PageProps<"/life/films/[year]">) {
  return <FilmsArchive year={(await params).year} />;
}
```

`app/life/books/page.tsx`, `app/life/theatre/page.tsx` and `app/life/saved/page.tsx` follow the same shape:

```tsx
import type { Metadata } from "next";
import { BooksArchive } from "@/components/life/archive/books-archive";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Books");

export default function BooksPage() {
  return <BooksArchive />;
}
```

```tsx
import type { Metadata } from "next";
import { TheatreArchive } from "@/components/life/archive/theatre-archive";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Theatre");

export default function TheatrePage() {
  return <TheatreArchive />;
}
```

```tsx
import type { Metadata } from "next";
import { SavedArchive } from "@/components/life/archive/saved-archive";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Saved");

export default function SavedPage() {
  return <SavedArchive />;
}
```

Run: `rm -rf .next && npm run typecheck`
Expected: PASS. `next typegen` creates the `PageProps<"/life/films/[year]">` type.

- [ ] **Step 3: Write the e2e tests**

Create `e2e/life-archives.spec.ts`. It runs with no database, so every archive is empty.

```ts
import { expect, test } from "@playwright/test";

test("every archive route renders inside the Life shell, empty without a database", async ({ page }) => {
  for (const [path, title] of [
    ["/life/films/", "Films"],
    ["/life/books/", "Books"],
    ["/life/theatre/", "Theatre"],
    ["/life/saved/", "Saved"],
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('div[data-side="life"]')).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    await expect(page.getByRole("link", { name: "← Life" })).toHaveAttribute("href", "/life/");
  }
  expect((await page.goto("/life/films/1999/"))?.status()).toBe(404);
});
```

Create `e2e-fixtures/life-archives.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

// SOURCE_FIXTURES=1: tests/fixtures/life-log.json, enrichments.json and the
// recorded source responses.

test("/life/films/ shows the newest year by month with real counts and no release years", async ({ page }) => {
  await page.goto("/life/films/");
  await expect(page.getByRole("heading", { level: 2, name: "2026" })).toBeVisible();
  // The year section contains the month section too; the month is the innermost (last) match.
  const september = page.locator("section", { has: page.getByRole("heading", { level: 3, name: /September/ }) }).last();
  await expect(september).toContainText("2 films");
  await expect(september.locator("li")).toHaveCount(2);
  await expect(september).toContainText("Sep 26");
  await expect(september).not.toContainText("2010");
  await expect(page.locator('[aria-current="page"]')).toHaveText("2026");
  await expect(page.locator("main")).not.toContainText("★");
});

test("the year index moves between years and to the undated films", async ({ page }) => {
  await page.goto("/life/films/");
  await page.getByRole("navigation", { name: "Years" }).getByRole("link", { name: "2025" }).click();
  await expect(page).toHaveURL(/\/life\/films\/2025\/$/);
  await expect(page.getByRole("heading", { level: 3, name: /December/ }).first()).toBeVisible();
  await expect(page.locator("main:visible")).toContainText("Dec 14 · ↻");
  await page.getByRole("navigation", { name: "Years" }).getByRole("link", { name: "Undated" }).click();
  await expect(page).toHaveURL(/\/life\/films\/undated\/$/);
  await expect(page.locator("main:visible #undated li")).toHaveText([/Amélie/, /The Matrix/]);
});

test("/life/books/ has Reading now, then reads by month", async ({ page }) => {
  await page.goto("/life/books/");
  await expect(page.getByRole("heading", { level: 2, name: "Reading now" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "2026" })).toBeVisible();
  for (const month of ["August", "July", "June"]) {
    await expect(page.getByRole("heading", { level: 3, name: new RegExp(month) })).toBeVisible();
  }
  await expect(page.locator("main")).toContainText("Hacı Komünist");
  await expect(page.locator("main")).toContainText("Jul 18");
});

test("/life/theatre/ shows years with the company and 'and earlier' on the oldest", async ({ page }) => {
  await page.goto("/life/theatre/");
  const y2015 = page.locator("section#year-2015");
  await expect(y2015).toContainText("2 plays");
  await expect(y2015).toContainText("and earlier");
  await expect(page.locator("section#year-2026")).toContainText("Ankara Devlet Tiyatrosu");
  await expect(page.locator("section#year-2026")).not.toContainText("and earlier");
});

test("/life/saved/ lists articles with the enriched description and the image fallback", async ({ page }) => {
  await page.goto("/life/saved/");
  const rows = page.getByRole("list", { name: "Saved articles" }).locator("li");
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("fabiensanglard.net");
  await expect(rows.first()).toContainText("13 min");
  await expect(rows.first()).toContainText("researched every computer");
  await expect(rows.first().locator("img")).toHaveAttribute("src", "https://fabiensanglard.net/jurrasic_park_computers/og.jpg");
  await expect(rows.nth(1).locator("img")).toHaveCount(0);
});
```

- [ ] **Step 4: Build and run both e2e suites**

```bash
lsof -ti :3217 -ti :3219 | xargs kill 2>/dev/null; rm -rf .next
npm run build && npx playwright test e2e/life-archives.spec.ts e2e/system.spec.ts
SOURCE_FIXTURES=1 npm run build && npx playwright test --config playwright.fixtures.config.ts e2e-fixtures/life-archives.spec.ts
npm run build
```

Expected: all pass. The final plain build keeps `.next` out of fixture mode.

- [ ] **Step 5: Screenshot check**

Run: `SOURCE_FIXTURES=1 npm run build && npm run screenshots -- .superpowers/sprint-10-shots /life/films/ /life/films/undated/ /life/books/ /life/theatre/ /life/saved/`. Then run `npm run build` again.

Look at every 1440 and 390 shot:
- tiles 3–4 across at 390;
- months hairline-separated, with the label column stacked above the tiles below lg;
- Dither fallback tiles showing an initial;
- Saved rows: image above the title at 390, on the right at 1440.

Report anything off in your summary.

- [ ] **Step 6: Commit**

```bash
git add components/life/archive app/life/films app/life/books app/life/theatre app/life/saved lib/sources/theatre.ts e2e/life-archives.spec.ts e2e-fixtures/life-archives.spec.ts
git commit -m "Add the Films, Books, Theatre and Saved archive pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 11: Life home: links, Theatre section, readout, Writing

**Files:**
- Create: `components/sections/theatre/index.tsx`
- Modify: `components/sections/films/index.tsx`, `books/index.tsx`, `articles/index.tsx` (internal `href`)
- Modify: `components/sections/life.ts` (order), `components/sections/section-block.tsx` (`WIDE` gains `theatre`)
- Modify: `lib/life/readout.ts` (`play` line), `app/life/page.tsx`
- Test: `tests/life-readout.test.ts`, `e2e-fixtures/life.spec.ts`, `e2e/life.spec.ts`

**Interfaces:**
- Consumes: `readLifeLog`, `latestPlays` (Task 8) and `THEATRE_PROFILE_URL` (Task 10).
- Produces:
  - `ReadoutInput.play?: { title: string; link: string }`, which renders the line `last play: <title>` right after `last watched:`;
  - the section `theatre` (id `theatre`, title "Theatre", source "tiyatrolar.com.tr", href `/life/theatre/`).

- [ ] **Step 1: Write the failing readout test**

Add to `tests/life-readout.test.ts`:

```ts
  it("puts last play right after last watched", () => {
    const lines = buildReadout({
      film: { title: "Pickled", link: "https://letterboxd.com/onur/film/pickled/" },
      play: { title: "Adel Seni Seçti", link: "https://tiyatrolar.com.tr/tiyatro/adel-seni-secti-1" },
      photo: { title: "Stabilo", slug: "stabilo" },
    });
    expect(lines.map((l) => l.key)).toEqual(["film", "play", "photo"]);
    expect(lines[1]).toEqual({ key: "play", label: "last play", value: "Adel Seni Seçti", href: "https://tiyatrolar.com.tr/tiyatro/adel-seni-secti-1" });
  });
```

Put it inside the file's existing `describe("buildReadout")` (or the file's equivalent). Import `buildReadout` the way the file already does.

Run: `npx vitest run tests/life-readout.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement the readout line**

In `lib/life/readout.ts`:
- Add `play?: { title: string; link: string };` to `ReadoutInput`, after `film`, with the comment `// The newest play from the theatre archive.`
- Destructure `play` in `buildReadout`, and add right after the film line:

```ts
  if (play) lines.push({ key: "play", label: "last play", value: play.title, href: play.link });
```

Run: `npx vitest run tests/life-readout.test.ts`
Expected: PASS.

- [ ] **Step 3: Add the Theatre section and point the "All" links inside the site**

Create `components/sections/theatre/index.tsx`:

```tsx
import { COVER_GRID, Cover } from "@/components/ui/cover";
import { initialOf } from "@/components/life/archive/archive-tile";
import { TileFallback } from "@/components/life/archive/tile-fallback";
import { type ArchiveItem, latestPlays } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";

// The latest six plays as a cover row, like Films: poster, title, company.
function Render({ data }: { data: ArchiveItem[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className={COVER_GRID}>
      {data.map((play) => (
        <li key={play.key}>
          <a href={play.href} rel="noopener noreferrer" className="group flex flex-col gap-1">
            {play.image ? (
              <Cover src={play.image} alt="" width={96} className="mb-1" />
            ) : (
              <TileFallback initial={initialOf(play.title)} className="mb-1" />
            )}
            <span className="type-label truncate text-fg group-hover:underline group-hover:underline-offset-[0.2em]">
              {play.title}
            </span>
            <span className="type-label truncate text-fg-muted">{play.meta[0] ?? ""}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export const theatre: SectionDefinition<ArchiveItem[]> = {
  id: "theatre",
  title: "Theatre",
  load: async () => ({ data: latestPlays(await readLifeLog("theatre"), 6), lastSuccessAt: null }),
  Render,
  source: "tiyatrolar.com.tr",
  href: "/life/theatre/",
};
```

Change `href` in the three existing sections:
- `films`: `href: "/life/films/",`
- `books`: `href: "/life/books/",`
- `articles`: `href: "/life/saved/",`

Then remove each now-unused `profile` import.

In `components/sections/section-block.tsx`, change `WIDE` to `new Set(["films", "books", "theatre", "photos"])`.

In `components/sections/life.ts`, import `theatre` and set the order:

```ts
// Order of sections on /life (Sprint 10): the archives first, then the
// authored and synced streams.
export const lifeSections: AnySectionDefinition[] = [
  films,
  books,
  theatre,
  articles,
  notes,
  writing,
  photos,
];
```

- [ ] **Step 4: Wire `/life/` (readout and hiding Writing)**

In `app/life/page.tsx`:
- Add the imports `import { latestPlays } from "@/lib/life/archive";` and `import { readLifeLog } from "@/lib/life-log/read";`.
- Add `readLifeLog("theatre")` to the `Promise.all` as `theatreRows`.
- Add `const [latestPlay] = latestPlays(theatreRows, 1);`.
- Add to the `buildReadout` input: `play: latestPlay ? { title: latestPlay.title, link: latestPlay.href } : undefined,`.
- Replace the section filter with:

```tsx
      {lifeSections
        .filter((section) => section.id !== "notes" || lifeNotes.length > 0)
        // w00f.org has no posts yet: the Writing row appears with the first one.
        .filter((section) => section.id !== "writing" || writing.data.length > 0)
        .map((section) => (
```

- [ ] **Step 5: Update the e2e tests**

`e2e/life.spec.ts`: this run has no database, so Writing is empty and now hidden. Find any assertion that expects the Writing section, or a "Nothing here yet." count that included it, and adjust it. Add:

```ts
test("the archive sections link their All to the archive pages", async ({ page }) => {
  await page.goto("/life/");
  for (const [section, href] of [
    ["films", "/life/films/"],
    ["books", "/life/books/"],
    ["theatre", "/life/theatre/"],
    ["articles", "/life/saved/"],
  ] as const) {
    await expect(page.locator(`[data-section="${section}"]`).getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", href);
  }
  await expect(page.locator('[data-section="writing"]')).toHaveCount(0);
});
```

`e2e-fixtures/life.spec.ts`: keep the existing assertions. Writing has fixture posts, so it still shows. Add:

```ts
test("the Theatre row and the readout's last play come from the theatre archive", async ({ page }) => {
  await page.goto("/life/");
  const theatre = page.locator('[data-section="theatre"]');
  await expect(theatre.locator("li")).toHaveCount(4);
  await expect(theatre.locator("li").first()).toContainText("Adel Seni Seçti");
  await expect(theatre.locator("li").first()).toContainText("Ankara Devlet Tiyatrosu");
  const order = await page.locator("[data-section]").evaluateAll((els) => els.map((el) => el.getAttribute("data-section")));
  expect(order.slice(0, 4)).toEqual(["films", "books", "theatre", "articles"]);
  await expect(page.getByRole("region", { name: "Now" }).locator("li", { hasText: "last play:" })).toContainText("Adel Seni Seçti");
});

test("Saved on the home shows at most five articles", async ({ page }) => {
  await page.goto("/life/");
  expect(await page.locator('[data-section="articles"] li').count()).toBeLessThanOrEqual(5);
});
```

`[data-section]` may also match non-section elements on `/life/`. If it does, filter to the `SectionBlock` ids before comparing.

- [ ] **Step 6: Run everything**

```bash
lsof -ti :3217 -ti :3219 | xargs kill 2>/dev/null; rm -rf .next
npm test && npm run typecheck && npm run lint
npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add components/sections lib/life/readout.ts app/life/page.tsx tests/life-readout.test.ts e2e/life.spec.ts e2e-fixtures/life.spec.ts
git commit -m "Link Life's rows to the archives, add Theatre and last play, hide an empty Writing

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 12: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md` (roadmap row note only)
- Create: `docs/superpowers/plans/2026-10-05-sprint-10-followups.md`

- [ ] **Step 1: Update `CLAUDE.md`**

1. Add the spec to the list at the top:

   ```
   - Sprint 10 (Life archives): `docs/superpowers/specs/2026-10-05-sprint-10-life-archives-design.md`
   ```

2. Add `npm run import:letterboxd -- <export.zip> [--posters]  # one-off: Letterboxd export → life_log (needs DATABASE_URL)` to Commands.
3. Add a section before "## Sources and sync":

```markdown
## Life archives (Sprint 10)

- Spec: `docs/superpowers/specs/2026-10-05-sprint-10-life-archives-design.md`.
- **Pages.**
  - `/life/films/` shows the newest year; `/life/films/<year>/` and `/life/films/undated/` show the others.
  - `/life/books/`, `/life/theatre/` and `/life/saved/` are single pages.
  - Bodies are in `components/life/archive/`; the pure views are in `lib/life/archive.ts`.
  - Films and Books are captioned month strips (`YearMonths` → `TileRow` → `ArchiveTile`). Film captions are the title plus `Sep 8` (`· ↻` on a rewatch), **never the release year**. Book captions are title · author · day; a series suffix is trimmed, and the full title is in `title`.
  - Theatre is one strip per year (no months: tiyatrolar only shows relative times), captioned with the company. The oldest year reads "and earlier".
  - Saved is a list (`SavedList`): site and minutes in the label column, a 16:10 image on the right.
  - Missing images use `TileFallback`: the accent dither plus the initial.
- **Storage.**
  - `life_log` (source, key) holds Films (`letterboxd`) and Theatre (`theatre`), read with `readLifeLog(source)` (tag `life:<source>`).
  - `link_enrichments` holds og: metadata for Saved, read with `readEnrichments()` (tag `enrichments`).
  - Both have fixture files in `tests/fixtures/`.
  - Upserts merge `data` (`stored || incoming`) and re-date only with `redate: true`.
- **Archive steps.**
  - A source may define `archive(data, { stores, fetch, now })`. `syncSource` runs it after a successful sync when `ctx.stores` is set (the sync routes and Sync now set it).
  - The step records `source_snapshots.archive_note`, shown in the admin, and returns tags that `revalidateResults` revalidates.
  - A thrown archive step never fails the sync.
- **Films.**
  - Keys are `<watched date|undated>|<normalised title>|<release year>|<n>`, the same for the CSV export and RSS.
  - The `letterboxd` snapshot keeps the whole RSS window (50); the Life home slices 6.
  - Each sync fills up to 30 missing posters from film pages (boxd.it Location only). **Never fetch a Letterboxd profile page**: they 403 server requests.
- **Theatre.**
  - `lib/sources/theatre.ts` POSTs to tiyatrolar's `load_more_user_item_via_ajax` endpoint and stops at the first page with a known post id.
  - `content/theatre-history.ts` is the backfill (Onur-checked years). The archive step re-seeds it every run, so editing a year there corrects it.
  - New watches get the year of their relative time at sync and are never re-dated.
- **Books.** `Book.readAt` (read date, may be "") and `addedAt` are separate. The archive groups by `readAt` only; the home orders by `date` (`readAt || addedAt`).
- **Writing** is hidden on `/life/` while it has no posts. A 404 feed is "no posts", not an error.
```

4. In "Design system (Sprint 4)", in the `/life/` paragraph, change "Books Reading maps every `currentlyReading` book (the source keeps up to 10)." to add: "Films, Books and Saved rows link "All →" to their archive pages; Theatre (the latest six plays) follows Books; the readout has a `last play:` line."
5. In "Sources and sync", change the "Adding a source" bullet to also mention the optional `archive` step and `SOURCE_LABELS`.

- [ ] **Step 2: Write the follow-ups file**

Create `docs/superpowers/plans/2026-10-05-sprint-10-followups.md`:

```markdown
# Sprint 10 follow-ups

## Before merge (controller)

- [ ] Letterboxd import ran against production (`npm run import:letterboxd -- ../letterboxd-export.zip --posters`); the row counts are in the PR body.
- [ ] Onur checked `content/theatre-history.ts` (years; 2015 "and earlier").

## After merge (Onur, on production)

- [ ] Draft ledes: "What I watched." / "What I read." / "Plays I saw." / "Articles I liked."
- [ ] Look at /life/films/ (current year and an older one), /life/books/, /life/theatre/, /life/saved/ on a phone.

## Later

- (filled in by the final review)
```

- [ ] **Step 3: Add an Errata section to the Sprint 10 spec**

Append `## Errata (implementation)` to the spec with:
- `/life/films/<year>/` uses `generateStaticParams`. It returns the years, or `undated` as a placeholder, because `cacheComponents` needs one param; this is the notes routes' pattern. The spec said "no generateStaticParams".
- Saved titles use `type-lead` (Plex Sans 20). The mockup's 15px isn't a type class, and type comes only from `type-*`.
- `theatre.fetch` returns the first page's watches when nothing new was found, so the snapshot (health only) is never empty. The archive step ignores watches that are already known.
- Add any further execution rulings from the ledger.

- [ ] **Step 4: Note the roadmap**

In the foundation spec's roadmap table, change the Sprint 10 row's text to `Personal layer and Life sub-pages (spec: 2026-10-05-sprint-10-life-archives-design.md)`.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/superpowers
git commit -m "Document the Life archives, the archive step and the Sprint 10 follow-ups

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Task 13: Data, Onur's check, verification and the PR (controller)

The controller does this, not a subagent.

- [ ] **Step 1: Theatre years with Onur.** Show Onur the generated `content/theatre-history.ts` grouped by year: title, company and year, plus the `// … önce` comment. Show it as a short table in chat, or as a companion screen if he wants it visual. Ask with AskUserQuestion: "Yıllar doğru mu?" with the options "Doğru (Önerilen)" / "Düzelteceklerim var (notlara)". Apply his corrections to the file and commit `Correct theatre years from Onur's check`.
- [ ] **Step 2: Final whole-branch review.** Dispatch an **opus** reviewer over `git diff v2...sprint-10` against the spec and this plan's Global Constraints. Fix the findings in one wave. Ask Onur (batched, once) only about findings that change content or behaviour.
- [ ] **Step 3: Full local verification** (fresh evidence; see superpowers:verification-before-completion):

  ```bash
  lsof -ti :3217 -ti :3219 -ti :3221 | xargs kill 2>/dev/null; rm -rf .next
  npm run typecheck && npm run lint && npm test
  npm run build && npm run e2e && npm run e2e:admin
  SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
  npm run build
  grep -rn "★" app components lib || echo "no stars"
  ```

- [ ] **Step 4: Visual check.** Take screenshots of the fixture build (Task 10 Step 5 list plus `/life/`) at 1440 and 390, and look at each one. Freeze-frame nothing; there are no new animations.
- [ ] **Step 5: Push and open the PR** after asking Onur (AskUserQuestion: "Push edip PR açayım mı?"). The PR body covers the scope, the new tables and their migration (expand-only), the import plan, and the follow-ups. End it with the attribution line. After it opens, call `get_status` and `bind_pr` if needed.
- [ ] **Step 6: After CI is green, ask Onur to merge** (he checks on production). After the merge, the migration runs on the production build. Then:
  1. `DATABASE_URL=<prod> npm run import:letterboxd -- ../letterboxd-export.zip --posters` (about 15 minutes for the posters).
  2. `curl -X POST -H "Authorization: Bearer $SYNC_SECRET" "https://onursenture.vercel.app/api/sync/?force=1"`. This seeds Theatre, archives the RSS window, starts the enrichments, and revalidates every archive tag.
  3. Check on production:
     - `/life/films/`, `/life/films/2025/`, `/life/books/`, `/life/theatre/` and `/life/saved/` return 200 and are CDN-cached (`x-vercel-cache` HIT on the second request);
     - the year counts are plausible against Letterboxd's "This year";
     - posters fill;
     - the admin Sources panel shows the archive notes.
- [ ] **Step 7: Clean up and record.**
  - Remove the sprint-10 worktree and branch locally and on origin.
  - Update the memory file `site-v2-redesign.md` (Sprint 10 done; next Sprint 11 polish).
  - Mark the Onur items in the follow-ups file.
