# S2 Platform Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the v2 site on a `v2` branch: a Next.js 16 app with site/dashboard view routing, theme switching, all five external sources synced into Postgres snapshots, unstyled `/life` and photo pages, an authored-time image pipeline, CI, and a scheduled sync. The result deploys to a Vercel preview.

**Architecture:** Every public page lives under `app/[view]/` and is prerendered twice (`site`, `dashboard`). `proxy.ts` rewrites clean URLs to the right variant from `?view=` or a cookie. External sources are fetched only by `POST /api/sync/` (called hourly from GitHub Actions); the results are stored as snapshots in Neon Postgres. Pages read those snapshots through a cached, tagged `readSource()`, which the sync route revalidates. Images are optimized ahead of time by `npm run images` into AVIF + JPEG renditions plus a manifest.

**Tech Stack:** Next.js 16.3.8 (App Router, `cacheComponents`, `proxy.ts`), React 19, TypeScript 5, Tailwind CSS v4, Drizzle ORM 0.45 + Neon serverless driver, zod 4, rss-parser, cheerio, gray-matter, sharp, Vitest 5 (+ PGlite for database tests), Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md`

## Global Constraints

- All work happens on branch **`v2`**. Never commit to `master`, except in Task 9, which says so explicitly.
- Node **24** (`engines.node: "24.x"`, and CI uses Node 24).
- Pinned versions: `next@16.3.8`, `eslint-config-next@16.3.8`, `zod@4.6.5`, `drizzle-orm@0.45.3`, `drizzle-kit@0.31.11`, `@neondatabase/serverless@1.2.0`, `rss-parser@3.13.0`, `cheerio@1.2.0`, `gray-matter@4.0.3`, `vitest@5.0.3`, `@electric-sql/pglite@0.5.8`, `sharp@0.35.5`, `@playwright/test@1.63.0`, `@types/node@^24`. `typescript` stays at the `^5` that create-next-app installs.
- **This is Next.js 16, not the version in your training data.** The middleware file is `proxy.ts` (exporting `proxy`), `revalidateTag` takes two arguments, and `cacheComponents` replaces `dynamicIO` / `ppr`. Before using any Next.js API this plan doesn't spell out, read the matching guide in `node_modules/next/dist/docs/`, as `AGENTS.md` instructs.
- `cacheComponents: true`: page data comes from `"use cache"` functions. Pages and layouts never call `cookies()` or `headers()`.
- `trailingSlash: true`: every internal link and every API URL ends with `/`. `/api/sync` without the slash 308-redirects, and a POST does not survive that redirect.
- Fail soft. Page data never throws on a missing database or a missing snapshot; it renders the empty shape. A source's `fetch` **must throw** on failure, so the previous snapshot is kept.
- UI copy is English only.
- No visual design work. S1/S3 own the design. Use structural Tailwind classes only (spacing, grid, `dashboard:` density tweaks).
- Commit message style matches the repo: an imperative sentence (e.g. "Add Letterboxd source parser"), then a blank line, then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Verification commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run e2e`. A task is done only when the commands its last step lists are green.

## File Map

```
proxy.ts                         view routing (rewrite / redirect / cookie)
next.config.ts                   cacheComponents, trailingSlash
drizzle.config.ts, drizzle/      schema migrations
app/
  layout.tsx, globals.css        html shell, inline theme script, theme/view Tailwind variants
  [view]/layout.tsx              generateStaticParams(site|dashboard), header with toggles
  [view]/page.tsx                placeholder home
  [view]/life/page.tsx           all life sections
  [view]/photos/page.tsx         photo index
  [view]/photos/[slug]/page.tsx  photo page + OG metadata
  api/sync/route.ts              POST: sync due sources (?force=1 for all)
  api/sync/[source]/route.ts     POST: sync one source now
components/
  view-toggle.tsx, theme-toggle.tsx, picture.tsx
  sections/                      types, section-block, synced-at, empty, life.ts registry,
                                 films/ books/ articles/ writing/ github/ sync-status/
lib/
  site.ts, format.ts
  view/                          views.ts (pure), theme.ts (pure + inline script), params.ts
  sources/                       types, http, letterboxd, goodreads, instapaper, writing, github,
                                 registry, tags, snapshot-view (pure), read.ts (cached, server-only)
  sync/                          store (interface), memory-store, drizzle-store, run, auth,
                                 respond, context
  db/                            schema.ts, client.ts (server-only)
  images/                        plan.ts (pure), manifest.ts, manifest.json (generated)
  content/photos.ts
scripts/images.ts, scripts/migrate.ts
images-src/photos/*.jpeg         image sources (input to npm run images)
public/images/...                legacy assets (URLs preserved) + generated renditions
content/photos/*.mdx
tests/                           Vitest (fixtures/, helpers/, sources/, sync/, content/)
e2e/                             Playwright smoke specs
.github/workflows/ci.yml         (v2) typecheck, lint, test, build, e2e
.github/workflows/sync.yml       (master) hourly sync call
```

---

### Task 1: Create the `v2` branch and scaffold Next.js

Replaces the Eleventy source with a fresh create-next-app scaffold, moves the public assets so their URLs survive, and sets up the tooling (scripts, Vitest, ESLint ignores, CLAUDE.md). It ends with one real unit test passing and a clean build.

**Files:**
- Delete: `src/`, `.eleventy.js`, `package.json`, `package-lock.json`, `.github/workflows/build-deploy.yml`, `CNAME`
- Move: `images/` → `public/images/`, `favicon.ico` → `public/favicon.ico`, `keybase.txt` → `public/keybase.txt`
- Create (scaffold): `app/`, `public/`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `AGENTS.md`, `package.json`
- Create: `vitest.config.mts`, `.npmrc` (`save-exact=true`), `lib/format.ts`, `tests/format.test.ts`
- Replace: `CLAUDE.md`, `README.md`, `.gitignore`

**Interfaces:**
- Produces: `formatDate(iso: string): string` and `formatDateTime(iso: string): string` from `@/lib/format`, both pinned to Europe/Istanbul and returning `""` for unusable input. The `@/` import alias maps to the repo root (in tsconfig and in Vitest).

- [ ] **Step 1: Branch from master**

```bash
git checkout master
git checkout -b v2
```

- [ ] **Step 2: Remove Eleventy and move public assets**

```bash
git rm -r -q src .eleventy.js package.json package-lock.json .github/workflows/build-deploy.yml CNAME
mkdir -p public
git mv images public/images
git mv favicon.ico public/favicon.ico
git mv keybase.txt public/keybase.txt
rm -rf _site node_modules .cache
```

`public/images/**` keeps every legacy URL (`/images/forum-avatar-w00f.jpg`, `/images/photos/<slug>.jpeg`, …) working.

- [ ] **Step 3: Scaffold into a temp dir and copy it in**

```bash
SCAFFOLD="$(mktemp -d)/v2"
npx --yes create-next-app@16.3.8 "$SCAFFOLD" --ts --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --use-npm --agents-md --no-react-compiler --disable-git --skip-install --yes
rsync -a --exclude node_modules --exclude .git "$SCAFFOLD"/ ./
rm -f public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg app/favicon.ico
cat > app/page.tsx <<'TSX'
// Temporary; Task 4 deletes it when app/[view]/page.tsx takes over "/".
export default function Page() {
  return <main>v2</main>;
}
TSX
```

`app/favicon.ico` is removed because `public/favicon.ico` already serves `/favicon.ico`. The scaffold's `app/page.tsx` referenced the deleted SVGs, so it is replaced with a placeholder; the scaffold's `app/layout.tsx` stays until Task 4.

- [ ] **Step 4: Install dependencies**

```bash
npm install
npm install rss-parser@3.13.0 cheerio@1.2.0 zod@4.6.5 drizzle-orm@0.45.3 @neondatabase/serverless@1.2.0 gray-matter@4.0.3 server-only
npm install -D @types/node@^24 vitest@5.0.3 drizzle-kit@0.31.11 @electric-sql/pglite@0.5.8 sharp@0.35.5 tsx @playwright/test@1.63.0
```

`@types/node` must be `^24`: Vitest 5 rejects the scaffold's `^20` as a peer.

- [ ] **Step 5: Set package metadata and scripts**

```bash
npm pkg set name="onursenture.com" engines.node="24.x"
npm pkg set scripts.dev="next dev" \
  scripts.build="tsx scripts/migrate.ts && next build" \
  scripts.start="next start" \
  scripts.lint="eslint" \
  scripts.typecheck="next typegen && tsc --noEmit" \
  scripts.test="vitest run" \
  scripts.test:watch="vitest" \
  scripts.e2e="playwright test" \
  scripts.images="tsx scripts/images.ts" \
  scripts.db:generate="drizzle-kit generate" \
  scripts.db:migrate="tsx scripts/migrate.ts --force"
```

`build` calls `scripts/migrate.ts`, which Task 3 creates. Until then, build with `npx next build`.

- [ ] **Step 6: Configure Next.js**

Replace `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  trailingSlash: true,
};

export default nextConfig;
```

- [ ] **Step 7: Configure Vitest**

Create `vitest.config.mts` (`.mts` so Vite loads it as ESM without a warning), and `.npmrc` containing `save-exact=true` so package.json keeps exact versions:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 8: Ignore test output in ESLint and git**

In `eslint.config.mjs`, extend the `globalIgnores([...])` array with `"playwright-report/**"` and `"test-results/**"`.

Append to `.gitignore` (the scaffold's version, which already ignores `.env*`, `.next`, `node_modules`):

```gitignore

# testing output
/test-results/
/playwright-report/

# Claude Code local working dir, root-level local plans (not docs/superpowers/plans), brainstorm scratch
.claude/
/plans/
.superpowers/
```

- [ ] **Step 9: Replace CLAUDE.md and README.md**

Replace `CLAUDE.md` entirely. The first line imports the Next.js agent rules that create-next-app wrote to `AGENTS.md`.

```markdown
@AGENTS.md

# CLAUDE.md

onursenture.com v2: Next.js 16 on Vercel. Branch `v2` replaces the Eleventy site on `master` at launch.

- Design spec: `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md`
- Plans: `docs/superpowers/plans/`

## Commands

npm run dev | build | start | lint | typecheck | test | e2e | images | db:generate | db:migrate

## Rules

- Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an API. `proxy.ts` replaces middleware.
- `cacheComponents` is on: page data comes from `"use cache"` functions; pages never read `cookies()` / `headers()`.
- Every public page lives under `app/[view]/` and is prerendered for `site` and `dashboard`; `proxy.ts` picks one. Never link to `/site/...` or `/dashboard/...`. Branch on the view only through `components/sections` (or `dashboard:` Tailwind variants).
- `trailingSlash: true`: internal links and API URLs end with `/`.
- External sources live in `lib/sources/<id>.ts`. Their `fetch` throws on failure. `POST /api/sync/` stores them as snapshots in Postgres, and pages read them with `readSource()`. Never fetch upstream during render.
- Images: put sources in `images-src/`, run `npm run images`, commit the outputs and `lib/images/manifest.json`, and render with `<Picture image="dir/name" />`.
- OG images are always JPEG with an absolute URL (via `metadataBase`). Pages without a real image omit `og:image`.
- English only.
- Tests: Vitest for `lib/` (fixtures in `tests/fixtures/`); Playwright smoke tests in `e2e/`, run against a production build.
```

Replace `README.md`:

```markdown
# onursenture.com

Personal site of Onur Senture. Next.js on Vercel. See `CLAUDE.md` for how it fits together.
```

- [ ] **Step 10: Write the failing test**

Create `tests/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "@/lib/format";

describe("format", () => {
  it("formats in Europe/Istanbul", () => {
    expect(formatDate("2026-09-30T22:30:00.000Z")).toBe("Oct 1, 2026");
    expect(formatDateTime("2026-09-30T22:30:00.000Z")).toBe("Oct 1, 2026, 1:30 AM");
  });

  it("returns empty for unusable input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDateTime("nope")).toBe("");
  });
});
```

- [ ] **Step 11: Run it to verify it fails**

Run: `npm test`
Expected: FAIL, because `@/lib/format` cannot be resolved.

- [ ] **Step 12: Implement**

Create `lib/format.ts`:

```ts
// Dates render on prerendered pages, so they are absolute (a relative "2h
// ago" would go stale) and pinned to Onur's time zone for stable output.
const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "Europe/Istanbul",
});
const dateTimeFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function formatDate(iso: string): string {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? "" : dateFormat.format(time);
}

export function formatDateTime(iso: string): string {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? "" : dateTimeFormat.format(time);
}
```

- [ ] **Step 13: Verify**

Run: `npm test && npm run lint && npx next build`
Expected: the tests PASS, lint is clean, and the build succeeds (the route list shows `/` and `/_not-found`).

`npm run typecheck` waits until Task 4 creates routes.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "Replace Eleventy with a Next.js 16 scaffold on v2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: External source parsers

Ports the five Eleventy data fetchers into typed, zod-validated source definitions. Each one separates a pure `parse*` function (tested against recorded fixtures) from `fetch`, which throws on any upstream failure. Behavior changes from the Eleventy version:
- Letterboxd reads the structured `letterboxd:*` fields (title, year, rating, watched date) and falls back to the old title regex.
- Goodreads takes the review only from `user_review`. The old description-scraping fallback picked up book blurbs.
- Instapaper also keeps `description`, `words`, `minutes` and `image` for the S8 cards.
- GitHub throws when `GH_PAT` is missing, instead of returning empty data.

**Files:**
- Create: `lib/sources/types.ts`, `lib/sources/http.ts`, `lib/sources/letterboxd.ts`, `lib/sources/goodreads.ts`, `lib/sources/instapaper.ts`, `lib/sources/writing.ts`, `lib/sources/github.ts`, `lib/sources/registry.ts`
- Create: `tests/helpers/fixtures.ts`, `tests/sources/{letterboxd,goodreads,instapaper,writing,github}.test.ts`
- Copy: `docs/superpowers/plans/2026-10-02-s2-fixtures/*` → `tests/fixtures/`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `SOURCE_IDS`, `type SourceId = "letterboxd" | "goodreads" | "instapaper" | "writing" | "github"`, `isSourceId(value: string): value is SourceId`
  - `interface SourceContext { fetch: typeof globalThis.fetch; env: Record<string, string | undefined> }`
  - `interface SourceDefinition<T> { id; intervalMinutes; empty: T; schema: z.ZodType<T>; fetch(ctx): Promise<T>; count(data: T): number }`, plus `type AnySourceDefinition = SourceDefinition<any>`
  - Data types: `Film` (`@/lib/sources/letterboxd`), `Book` and `Books` (`goodreads`), `Article` (`instapaper`), `Post` (`writing`), `Contributions` (`github`)
  - `sources` (a record keyed by `SourceId`), `type SourceData<K>`, and `getSource<K>(id: K): SourceDefinition<SourceData<K>>` from `@/lib/sources/registry`
  - `fetchText`, `fetchJson`, `hostname`, `toIso` from `@/lib/sources/http`

- [ ] **Step 1: Copy fixtures**

```bash
mkdir -p tests/fixtures
cp docs/superpowers/plans/2026-10-02-s2-fixtures/* tests/fixtures/
```

These are trimmed copies of real responses captured on 2026-10-02. The Letterboxd "Pickled" entry was made unrated on purpose, and one Goodreads review was added on purpose, so the edge cases are covered. `writing.xml` is synthetic because the live w00f.org feed currently has no entries.

- [ ] **Step 2: Write the test helper and failing tests**

Create `tests/helpers/fixtures.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function fixture(name: string): string {
  return readFileSync(join(__dirname, "..", "fixtures", name), "utf8");
}

// A fetch stand-in that answers each URL from a map and 404s everything else.
export function fakeFetch(
  routes: Record<string, { status?: number; body: string }>,
): typeof globalThis.fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const route = routes[url];
    if (!route) return new Response("not found", { status: 404 });
    return new Response(route.body, { status: route.status ?? 200 });
  }) as typeof globalThis.fetch;
}
```

Create `tests/sources/letterboxd.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { letterboxd, parseLetterboxd } from "@/lib/sources/letterboxd";
import { fakeFetch, fixture } from "../helpers/fixtures";

describe("parseLetterboxd", () => {
  it("maps diary entries using the structured letterboxd fields", async () => {
    const films = await parseLetterboxd(fixture("letterboxd.xml"));
    expect(films).toHaveLength(3);
    expect(films[0]).toEqual({
      title: "Love & Other Drugs",
      year: 2010,
      link: "https://letterboxd.com/onur/film/love-other-drugs/",
      poster:
        "https://a.ltrbxd.com/resized/film-poster/2/1/8/0/1/21801-love-other-drugs-0-600-0-900-crop.jpg?v=08511b998f",
      rating: "★★★½",
      ratingValue: 3.5,
      watchedDate: "2026-09-26",
      date: "2026-09-26T14:18:59.000Z",
    });
  });

  it("leaves rating empty for unrated watches", async () => {
    const films = await parseLetterboxd(fixture("letterboxd.xml"));
    expect(films[2]).toMatchObject({ title: "Pickled", rating: "", ratingValue: null });
  });

  it("validates against its own schema", async () => {
    const films = await parseLetterboxd(fixture("letterboxd.xml"));
    expect(letterboxd.schema.parse(films)).toEqual(films);
  });
});

describe("letterboxd.fetch", () => {
  it("throws when upstream is not 2xx", async () => {
    const fetch = fakeFetch({
      "https://letterboxd.com/onur/rss/": { status: 503, body: "down" },
    });
    await expect(letterboxd.fetch({ fetch, env: {} })).rejects.toThrow("503");
  });
});
```

Create `tests/sources/goodreads.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { goodreads, parseGoodreadsShelf } from "@/lib/sources/goodreads";
import { fakeFetch, fixture } from "../helpers/fixtures";

describe("parseGoodreadsShelf", () => {
  it("sorts by read date, not feed (shelf-add) order", async () => {
    const books = await parseGoodreadsShelf(fixture("goodreads-read.xml"), 5);
    expect(books.map((b) => b.title)).toEqual([
      "Joseph Müller-Brockman, Pioneer of Swiss Graphic Design",
      "Hacı Komünist",
      "Bozkır: Bir Yolculuk Hikâyesi",
    ]);
    expect(books[2].date).toBe("2026-06-21T00:00:00.000Z");
  });

  it("upgrades cover thumbnails and converts ratings to stars", async () => {
    const [first] = await parseGoodreadsShelf(fixture("goodreads-read.xml"), 5);
    expect(first.cover).toBe(
      "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1347438784l/663561._SY475_.jpg",
    );
    expect(first).toMatchObject({ rating: "★★", numRating: 2, author: "Lars Müller" });
  });

  it("extracts review text from user_review only", async () => {
    const books = await parseGoodreadsShelf(fixture("goodreads-read.xml"), 5);
    expect(books[1].review).toBe("Funny and sharp satire.");
    expect(books[0].review).toBe("");
  });

  it("applies the limit after sorting", async () => {
    const books = await parseGoodreadsShelf(fixture("goodreads-read.xml"), 1);
    expect(books.map((b) => b.title)).toEqual([
      "Joseph Müller-Brockman, Pioneer of Swiss Graphic Design",
    ]);
  });
});

describe("goodreads.fetch", () => {
  const base = "https://www.goodreads.com/review/list_rss/8143905";

  it("fetches both shelves", async () => {
    const fetch = fakeFetch({
      [`${base}?shelf=currently-reading`]: { body: fixture("goodreads-read.xml") },
      [`${base}?shelf=read`]: { body: fixture("goodreads-read.xml") },
    });
    const books = await goodreads.fetch({ fetch, env: {} });
    expect(books.currentlyReading).toHaveLength(3);
    expect(books.read).toHaveLength(3);
  });

  it("throws if either shelf fails", async () => {
    const fetch = fakeFetch({
      [`${base}?shelf=read`]: { body: fixture("goodreads-read.xml") },
    });
    await expect(goodreads.fetch({ fetch, env: {} })).rejects.toThrow("404");
  });
});
```

Create `tests/sources/instapaper.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseInstapaper } from "@/lib/sources/instapaper";
import { fixture } from "../helpers/fixtures";

describe("parseInstapaper", () => {
  const articles = parseInstapaper(JSON.parse(fixture("instapaper.json")));

  it("drops bookmarks without a title", () => {
    expect(articles).toHaveLength(2);
  });

  it("maps card fields", () => {
    expect(articles[1]).toEqual({
      title: "Leaving Mozilla",
      link: "https://blog.unitedheroes.net/5751",
      domain: "blog.unitedheroes.net",
      date: "2026-06-20T16:41:25.000Z",
      description: expect.stringMatching(/^After more than 15 years/),
      words: 4297,
      minutes: 18,
      image: "https://blog.unitedheroes.net/JRS_128x128.jpg",
    });
    expect(articles[0].image).toBeNull();
  });

  it("rejects a response without a bookmarks array", () => {
    expect(() => parseInstapaper({ error: "nope" })).toThrow();
  });
});
```

Create `tests/sources/writing.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseWriting } from "@/lib/sources/writing";
import { fixture } from "../helpers/fixtures";

describe("parseWriting", () => {
  it("parses Bear Blog Atom entries", async () => {
    expect(await parseWriting(fixture("writing.xml"))).toEqual([
      { title: "Second post", link: "https://w00f.org/second-post/", date: "2026-09-20T10:00:00.000Z" },
      { title: "First post", link: "https://w00f.org/first-post/", date: "2026-08-01T08:30:00.000Z" },
    ]);
  });
});
```

Create `tests/sources/github.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { github, parseGithub } from "@/lib/sources/github";
import { fixture } from "../helpers/fixtures";

describe("parseGithub", () => {
  it("maps colors to levels case-insensitively, unknown colors to 0", () => {
    const data = parseGithub(JSON.parse(fixture("github.json")));
    expect(data.total).toBe(7);
    expect(data.weeks.flatMap((w) => w.days.map((d) => d.level))).toEqual([0, 1, 2, 4, 0]);
    expect(data.weeks[0].days[1]).toEqual({ count: 1, date: "2026-09-28", level: 1 });
  });
});

describe("github.fetch", () => {
  it("throws without a token instead of returning empty data", async () => {
    await expect(github.fetch({ fetch: globalThis.fetch, env: {} })).rejects.toThrow(
      "GH_PAT is not set",
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, because the `@/lib/sources/*` modules don't exist.

- [ ] **Step 4: Implement the shared types and HTTP helpers**

Create `lib/sources/types.ts`:

```ts
import type { z } from "zod";

export const SOURCE_IDS = [
  "letterboxd",
  "goodreads",
  "instapaper",
  "writing",
  "github",
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export function isSourceId(value: string): value is SourceId {
  return (SOURCE_IDS as readonly string[]).includes(value);
}

// What a source's fetch receives. Injected so tests can pass a fake fetch
// and env instead of hitting the network.
export interface SourceContext {
  fetch: typeof globalThis.fetch;
  env: Record<string, string | undefined>;
}

export interface SourceDefinition<T> {
  id: SourceId;
  // How often the scheduled sync should refresh this source.
  intervalMinutes: number;
  // Returned to pages when no snapshot exists yet.
  empty: T;
  // Validates both fresh fetches and snapshots read back from the database.
  schema: z.ZodType<T>;
  // Fetch upstream and return parsed data. Must THROW on any failure, so the
  // sync layer keeps the previous snapshot instead of saving an empty one.
  fetch: (ctx: SourceContext) => Promise<T>;
  // Number of items, recorded for the source-health panel.
  count: (data: T) => number;
}

// Heterogeneous collections of sources (the registry, syncAll) need to
// accept definitions of any payload type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySourceDefinition = SourceDefinition<any>;
```

Create `lib/sources/http.ts`:

```ts
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
```

- [ ] **Step 5: Implement the five sources**

Create `lib/sources/letterboxd.ts`:

```ts
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { z } from "zod";
import { fetchText, toIso } from "./http";
import type { SourceDefinition } from "./types";

const FEED_URL = "https://letterboxd.com/onur/rss/";
const LIMIT = 6;

export const filmSchema = z.object({
  title: z.string(),
  year: z.number().nullable(),
  link: z.string(),
  poster: z.string(),
  // Star string as Letterboxd renders it, e.g. "★★★½". Empty when unrated.
  rating: z.string(),
  // Numeric rating 0.5–5, null when unrated.
  ratingValue: z.number().nullable(),
  // YYYY-MM-DD the film was watched, empty if missing.
  watchedDate: z.string(),
  // ISO timestamp of the diary entry.
  date: z.string(),
});
export const filmsSchema = z.array(filmSchema);
export type Film = z.infer<typeof filmSchema>;

type LetterboxdItem = {
  filmTitle?: string;
  filmYear?: string;
  memberRating?: string;
  watchedDate?: string;
};

const STARS_SUFFIX = /\s*-\s*([★½]+)\s*$/;

export async function parseLetterboxd(xml: string): Promise<Film[]> {
  const parser = new Parser<Record<string, never>, LetterboxdItem>({
    customFields: {
      item: [
        ["letterboxd:filmTitle", "filmTitle"],
        ["letterboxd:filmYear", "filmYear"],
        ["letterboxd:memberRating", "memberRating"],
        ["letterboxd:watchedDate", "watchedDate"],
      ],
    },
  });
  const feed = await parser.parseString(xml);

  return feed.items.slice(0, LIMIT).map((item) => {
    const $ = cheerio.load(item.content ?? "");
    const titleRaw = item.title ?? "";
    const starsMatch = titleRaw.match(STARS_SUFFIX);
    // Prefer the structured field; fall back to stripping " - ★★★" and
    // ", 2024" from the display title.
    const title =
      item.filmTitle?.trim() ||
      titleRaw.replace(STARS_SUFFIX, "").replace(/,\s*\d{4}\s*$/, "").trim();
    const year = item.filmYear ? Number.parseInt(item.filmYear, 10) : NaN;
    const ratingValue = item.memberRating
      ? Number.parseFloat(item.memberRating)
      : NaN;

    return {
      title,
      year: Number.isNaN(year) ? null : year,
      link: item.link ?? "",
      poster: $("img").attr("src") ?? "",
      rating: starsMatch ? starsMatch[1] : "",
      ratingValue: Number.isNaN(ratingValue) ? null : ratingValue,
      watchedDate: item.watchedDate ?? "",
      date: toIso(item.pubDate),
    };
  });
}

export const letterboxd: SourceDefinition<Film[]> = {
  id: "letterboxd",
  intervalMinutes: 180,
  empty: [],
  schema: filmsSchema,
  fetch: async ({ fetch }) => parseLetterboxd(await fetchText(fetch, FEED_URL)),
  count: (films) => films.length,
};
```

Create `lib/sources/goodreads.ts`:

```ts
import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { z } from "zod";
import { fetchText, toIso } from "./http";
import type { SourceDefinition } from "./types";

// Goodreads RSS needs the numeric user ID; this is goodreads.com/onur.
const DEFAULT_USER_ID = "8143905";
const CURRENTLY_READING_LIMIT = 10;
const READ_LIMIT = 5;

export const bookSchema = z.object({
  title: z.string(),
  author: z.string(),
  cover: z.string(),
  rating: z.string(),
  numRating: z.number(),
  review: z.string(),
  link: z.string(),
  // ISO timestamp: the read date when known, else the shelf-add date.
  date: z.string(),
});
export const booksSchema = z.object({
  currentlyReading: z.array(bookSchema),
  read: z.array(bookSchema),
});
export type Book = z.infer<typeof bookSchema>;
export type Books = z.infer<typeof booksSchema>;

type GoodreadsItem = {
  bookImageUrl?: string;
  authorName?: string;
  userRating?: string;
  userReview?: string;
  userReadAt?: string;
};

function shelfUrl(userId: string, shelf: string): string {
  return `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}`;
}

// Goodreads serves tiny thumbnails (._SY75_ / ._SX50_); ask for 475px.
function upgradeCover(url: string): string {
  return url.replace(/\._S[XY]\d+_/, "._SY475_").replace(/\/s\/[^/]+\//, "/l/");
}

function dateValue(iso: string): number {
  const time = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(time) ? -Infinity : time;
}

export async function parseGoodreadsShelf(
  xml: string,
  limit: number,
): Promise<Book[]> {
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
    return {
      title: (item.title ?? "").trim(),
      author: (item.authorName ?? "").trim(),
      cover: rawCover ? upgradeCover(rawCover) : "",
      rating: "★".repeat(numRating),
      numRating,
      // Only the explicit review field; the old description-scraping
      // fallback picked up book blurbs and is intentionally gone.
      review: item.userReview ? cheerio.load(item.userReview).text().trim() : "",
      link: item.link ?? "",
      date: toIso(item.userReadAt) || toIso(item.pubDate),
    };
  });

  // The feed is ordered by shelf-add date; rank by the date shown instead.
  books.sort((a, b) => dateValue(b.date) - dateValue(a.date));
  return books.slice(0, limit);
}

export const goodreads: SourceDefinition<Books> = {
  id: "goodreads",
  intervalMinutes: 180,
  empty: { currentlyReading: [], read: [] },
  schema: booksSchema,
  fetch: async ({ fetch, env }) => {
    const userId = env.GOODREADS_USER_ID || DEFAULT_USER_ID;
    const [currentlyXml, readXml] = await Promise.all([
      fetchText(fetch, shelfUrl(userId, "currently-reading")),
      fetchText(fetch, shelfUrl(userId, "read")),
    ]);
    return {
      currentlyReading: await parseGoodreadsShelf(
        currentlyXml,
        CURRENTLY_READING_LIMIT,
      ),
      read: await parseGoodreadsShelf(readXml, READ_LIMIT),
    };
  },
  count: (books) => books.currentlyReading.length + books.read.length,
};
```

Create `lib/sources/instapaper.ts`:

```ts
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

export const instapaper: SourceDefinition<Article[]> = {
  id: "instapaper",
  intervalMinutes: 60,
  empty: [],
  schema: articlesSchema,
  fetch: async ({ fetch }) => parseInstapaper(await fetchJson(fetch, PROFILE_URL)),
  count: (articles) => articles.length,
};
```

Create `lib/sources/writing.ts`:

```ts
import Parser from "rss-parser";
import { z } from "zod";
import { fetchText, toIso } from "./http";
import type { SourceDefinition } from "./types";

// Bear Blog Atom feed for w00f.org.
const FEED_URL = "https://w00f.org/feed/";
const LIMIT = 10;

export const postSchema = z.object({
  title: z.string(),
  link: z.string(),
  date: z.string(),
});
export const postsSchema = z.array(postSchema);
export type Post = z.infer<typeof postSchema>;

export async function parseWriting(xml: string): Promise<Post[]> {
  const feed = await new Parser().parseString(xml);
  return feed.items.slice(0, LIMIT).map((item) => ({
    title: (item.title ?? "").trim(),
    link: item.link || item.id || "",
    date: toIso(item.isoDate ?? item.pubDate),
  }));
}

export const writing: SourceDefinition<Post[]> = {
  id: "writing",
  intervalMinutes: 180,
  empty: [],
  schema: postsSchema,
  fetch: async ({ fetch }) => parseWriting(await fetchText(fetch, FEED_URL)),
  count: (posts) => posts.length,
};
```

Create `lib/sources/github.ts`:

```ts
import { z } from "zod";
import { fetchJson } from "./http";
import type { SourceDefinition } from "./types";

const LOGIN = "onursenture";
const QUERY = `query {
  user(login: "${LOGIN}") {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { contributionCount date color } }
      }
    }
  }
}`;

export const contributionsSchema = z.object({
  total: z.number(),
  weeks: z.array(
    z.object({
      days: z.array(
        z.object({
          count: z.number(),
          date: z.string(),
          level: z.number().int().min(0).max(4),
        }),
      ),
    }),
  ),
});
export type Contributions = z.infer<typeof contributionsSchema>;

// GitHub encodes each day's level as one of five colors; map them to 0–4 so
// the distribution matches github.com exactly.
const COLOR_TO_LEVEL: Record<string, number> = {
  "#ebedf0": 0,
  "#9be9a8": 1,
  "#40c463": 2,
  "#30a14e": 3,
  "#216e39": 4,
};

const responseSchema = z.object({
  data: z.object({
    user: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({
          totalContributions: z.number(),
          weeks: z.array(
            z.object({
              contributionDays: z.array(
                z.object({
                  contributionCount: z.number(),
                  date: z.string(),
                  color: z.string().nullish(),
                }),
              ),
            }),
          ),
        }),
      }),
    }),
  }),
});

export function parseGithub(json: unknown): Contributions {
  const calendar =
    responseSchema.parse(json).data.user.contributionsCollection
      .contributionCalendar;
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((week) => ({
      days: week.contributionDays.map((day) => ({
        count: day.contributionCount,
        date: day.date,
        level: COLOR_TO_LEVEL[(day.color ?? "").toLowerCase()] ?? 0,
      })),
    })),
  };
}

export const github: SourceDefinition<Contributions> = {
  id: "github",
  intervalMinutes: 60,
  empty: { total: 0, weeks: [] },
  schema: contributionsSchema,
  fetch: async ({ fetch, env }) => {
    const token = env.GH_PAT || env.GITHUB_PAT;
    if (!token) throw new Error("GH_PAT is not set");
    const json = await fetchJson(fetch, "https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY }),
    });
    return parseGithub(json);
  },
  count: (data) => data.total,
};
```

- [ ] **Step 6: Implement the registry**

Create `lib/sources/registry.ts`:

```ts
import { github } from "./github";
import { goodreads } from "./goodreads";
import { instapaper } from "./instapaper";
import { letterboxd } from "./letterboxd";
import type { AnySourceDefinition, SourceDefinition, SourceId } from "./types";
import { writing } from "./writing";

export const sources = {
  letterboxd,
  goodreads,
  instapaper,
  writing,
  github,
} satisfies { [K in SourceId]: AnySourceDefinition };

export type SourceData<K extends SourceId> =
  (typeof sources)[K] extends SourceDefinition<infer T> ? T : never;

// Typed lookup. Indexing `sources` with a generic key yields a union of
// definitions TypeScript can't narrow; this restores the per-source type.
export function getSource<K extends SourceId>(id: K): SourceDefinition<SourceData<K>> {
  return sources[id] as unknown as SourceDefinition<SourceData<K>>;
}
```

- [ ] **Step 7: Verify**

Run: `npm test && npm run lint`
Expected: all source tests PASS (format + 5 source files), and lint is clean.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Port the five external sources as typed, fixture-tested parsers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Snapshot storage and the sync runner

Adds the Postgres snapshot table and its migration, a production store (Drizzle on Neon) and a test store (in memory), plus the pure sync logic: the due check with 5 minutes of cron slack, last-known-good on failure, schema validation of fetched data, bearer auth, and the fail-soft snapshot → page-data conversion. The Drizzle store is tested against real Postgres semantics with PGlite.

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/client.ts`, `drizzle.config.ts`, `drizzle/` (generated), `scripts/migrate.ts`
- Create: `lib/sync/store.ts`, `lib/sync/memory-store.ts`, `lib/sync/drizzle-store.ts`, `lib/sync/run.ts`, `lib/sync/auth.ts`, `lib/sources/snapshot-view.ts`
- Create: `tests/sync/run.test.ts`, `tests/sync/drizzle-store.test.ts`, `tests/sync/auth.test.ts`, `tests/sources/snapshot-view.test.ts`

**Interfaces:**
- Consumes: `SourceId`, `SourceDefinition<T>`, `AnySourceDefinition`, `SourceContext` (Task 2); `letterboxd` (used in a test).
- Produces:
  - `interface Snapshot { source; payload: unknown; lastSuccessAt: Date | null; lastAttemptAt: Date | null; lastError: string | null; itemCount: number }`
  - `interface SnapshotStore { get(source); recordSuccess(source, payload, itemCount, at); recordFailure(source, error, at) }`
  - `class MemorySnapshotStore`, and `class DrizzleSnapshotStore(db)`, which accepts any Postgres Drizzle db
  - `getDb(): Database | null` from `@/lib/db/client` (server-only; `null` when `DATABASE_URL` is unset)
  - `type SyncResult = { source; status: "ok"; itemCount } | { source; status: "error"; error } | { source; status: "skipped" }`
  - `isDue(def, snapshot, now)`, `syncSource<T>(def, store, ctx, now)`, `syncAll(defs, store, ctx, now, { force? })` from `@/lib/sync/run`
  - `isAuthorized(header: string | null, secret: string | undefined): boolean` from `@/lib/sync/auth`
  - `interface SourceView<T> { data: T; lastSuccessAt: string | null }` and `toSourceView(def, snapshot | null)` from `@/lib/sources/snapshot-view`

- [ ] **Step 1: Write the failing tests**

Create `tests/sync/run.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { SourceDefinition } from "@/lib/sources/types";
import { MemorySnapshotStore } from "@/lib/sync/memory-store";
import { isDue, syncAll, syncSource } from "@/lib/sync/run";

const ctx = { fetch: globalThis.fetch, env: {} };
const t0 = new Date("2026-10-02T12:00:00Z");
const minutes = (n: number) => new Date(t0.getTime() + n * 60_000);

function source(
  fetchImpl: () => Promise<string[]>,
  intervalMinutes = 60,
): SourceDefinition<string[]> {
  return {
    id: "writing",
    intervalMinutes,
    empty: [],
    schema: z.array(z.string()),
    fetch: fetchImpl,
    count: (items) => items.length,
  };
}

describe("syncSource", () => {
  it("stores the payload on success", async () => {
    const store = new MemorySnapshotStore();
    const result = await syncSource(source(async () => ["a", "b"]), store, ctx, t0);
    expect(result).toEqual({ source: "writing", status: "ok", itemCount: 2 });
    expect(await store.get("writing")).toMatchObject({
      payload: ["a", "b"],
      itemCount: 2,
      lastSuccessAt: t0,
      lastError: null,
    });
  });

  it("keeps the last good payload when a later sync fails", async () => {
    const store = new MemorySnapshotStore();
    await syncSource(source(async () => ["a"]), store, ctx, t0);
    const result = await syncSource(
      source(async () => {
        throw new Error("upstream down");
      }),
      store,
      ctx,
      minutes(60),
    );
    expect(result).toEqual({ source: "writing", status: "error", error: "upstream down" });
    expect(await store.get("writing")).toMatchObject({
      payload: ["a"],
      itemCount: 1,
      lastSuccessAt: t0,
      lastAttemptAt: minutes(60),
      lastError: "upstream down",
    });
  });

  it("treats a schema mismatch as a failure", async () => {
    const store = new MemorySnapshotStore();
    const bad = source(async () => [42] as unknown as string[]);
    const result = await syncSource(bad, store, ctx, t0);
    expect(result.status).toBe("error");
    expect((await store.get("writing"))?.payload).toBeNull();
  });
});

describe("isDue", () => {
  const def = source(async () => [], 60);

  it("is due when never attempted", () => {
    expect(isDue(def, null, t0)).toBe(true);
  });

  it("allows five minutes of cron slack", () => {
    const snapshot = {
      source: "writing" as const,
      payload: [],
      itemCount: 0,
      lastSuccessAt: t0,
      lastAttemptAt: t0,
      lastError: null,
    };
    expect(isDue(def, snapshot, minutes(54))).toBe(false);
    expect(isDue(def, snapshot, minutes(55))).toBe(true);
  });
});

describe("syncAll", () => {
  it("skips sources that are not due unless forced", async () => {
    const store = new MemorySnapshotStore();
    const def = source(async () => ["a"]);
    await syncAll([def], store, ctx, t0);
    expect(await syncAll([def], store, ctx, minutes(10))).toEqual([
      { source: "writing", status: "skipped" },
    ]);
    expect(await syncAll([def], store, ctx, minutes(10), { force: true })).toEqual([
      { source: "writing", status: "ok", itemCount: 1 },
    ]);
  });
});
```

Create `tests/sync/drizzle-store.test.ts`:

```ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { DrizzleSnapshotStore } from "@/lib/sync/drizzle-store";

const t0 = new Date("2026-10-02T12:00:00.000Z");
const t1 = new Date("2026-10-02T13:00:00.000Z");

describe("DrizzleSnapshotStore", () => {
  let store: DrizzleSnapshotStore;

  beforeEach(async () => {
    const db = drizzle(new PGlite());
    await migrate(db, { migrationsFolder: "./drizzle" });
    store = new DrizzleSnapshotStore(db);
  });

  it("returns null for an unknown source", async () => {
    expect(await store.get("github")).toBeNull();
  });

  it("round-trips a successful sync", async () => {
    await store.recordSuccess("letterboxd", [{ title: "A" }], 1, t0);
    expect(await store.get("letterboxd")).toEqual({
      source: "letterboxd",
      payload: [{ title: "A" }],
      lastSuccessAt: t0,
      lastAttemptAt: t0,
      lastError: null,
      itemCount: 1,
    });
  });

  it("keeps payload and success time when a failure is recorded", async () => {
    await store.recordSuccess("letterboxd", [{ title: "A" }], 1, t0);
    await store.recordFailure("letterboxd", "boom", t1);
    expect(await store.get("letterboxd")).toEqual({
      source: "letterboxd",
      payload: [{ title: "A" }],
      lastSuccessAt: t0,
      lastAttemptAt: t1,
      lastError: "boom",
      itemCount: 1,
    });
  });

  it("records a failure for a source that never succeeded", async () => {
    await store.recordFailure("github", "GH_PAT is not set", t0);
    expect(await store.get("github")).toMatchObject({
      payload: null,
      lastSuccessAt: null,
      lastError: "GH_PAT is not set",
      itemCount: 0,
    });
  });

  it("clears the error on the next success", async () => {
    await store.recordFailure("github", "boom", t0);
    await store.recordSuccess("github", { total: 1, weeks: [] }, 1, t1);
    expect(await store.get("github")).toMatchObject({ lastError: null, lastSuccessAt: t1 });
  });
});
```

Create `tests/sync/auth.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isAuthorized } from "@/lib/sync/auth";

describe("isAuthorized", () => {
  it("accepts the matching bearer token", () => {
    expect(isAuthorized("Bearer s3cret", "s3cret")).toBe(true);
  });

  it("rejects wrong, missing, or malformed tokens", () => {
    expect(isAuthorized("Bearer nope!!", "s3cret")).toBe(false);
    expect(isAuthorized("Bearer s3cre", "s3cret")).toBe(false);
    expect(isAuthorized(null, "s3cret")).toBe(false);
    expect(isAuthorized("s3cret", "s3cret")).toBe(false);
  });

  it("never authorizes when the secret is unset", () => {
    expect(isAuthorized("Bearer ", undefined)).toBe(false);
    expect(isAuthorized("Bearer ", "")).toBe(false);
  });
});
```

Create `tests/sources/snapshot-view.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { letterboxd } from "@/lib/sources/letterboxd";
import { toSourceView } from "@/lib/sources/snapshot-view";

const at = new Date("2026-10-02T12:00:00.000Z");
const film = {
  title: "A",
  year: 2020,
  link: "https://letterboxd.com/onur/film/a/",
  poster: "",
  rating: "★★★",
  ratingValue: 3,
  watchedDate: "2026-10-01",
  date: "2026-10-01T10:00:00.000Z",
};
const snapshot = (payload: unknown) => ({
  source: "letterboxd" as const,
  payload,
  lastSuccessAt: at,
  lastAttemptAt: at,
  lastError: null,
  itemCount: 1,
});

describe("toSourceView", () => {
  it("returns the empty shape when there is no snapshot", () => {
    expect(toSourceView(letterboxd, null)).toEqual({ data: [], lastSuccessAt: null });
  });

  it("returns validated data with an ISO sync time", () => {
    expect(toSourceView(letterboxd, snapshot([film]))).toEqual({
      data: [film],
      lastSuccessAt: "2026-10-02T12:00:00.000Z",
    });
  });

  it("fails soft when the payload no longer matches the schema", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(toSourceView(letterboxd, snapshot([{ title: 1 }]))).toEqual({
      data: [],
      lastSuccessAt: null,
    });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, because the `@/lib/sync/*` and `@/lib/sources/snapshot-view` modules don't exist.

- [ ] **Step 3: Implement the schema, client, and migration**

Create `lib/db/schema.ts`:

```ts
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// One row per external source. Written by the sync job, read by pages.
export const sourceSnapshots = pgTable("source_snapshots", {
  source: text("source").primaryKey(),
  payload: jsonb("payload"),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  lastError: text("last_error"),
  itemCount: integer("item_count").notNull().default(0),
});
```

Create `lib/db/client.ts`:

```ts
import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb(url: string) {
  return drizzle(neon(url), { schema });
}

export type Database = ReturnType<typeof createDb>;

let cached: Database | null | undefined;

// Returns null when DATABASE_URL is unset (local dev without a database,
// CI builds). Callers must treat null as "no data yet" and fail soft.
export function getDb(): Database | null {
  if (cached === undefined) {
    const url = process.env.DATABASE_URL;
    cached = url ? createDb(url) : null;
  }
  return cached;
}
```

Create `drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
```

Generate the migration (this needs no database connection):

```bash
npm run db:generate -- --name source_snapshots
```

Expected: `drizzle/0000_source_snapshots.sql` containing `CREATE TABLE "source_snapshots"` with the columns `source` (text, primary key), `payload` (jsonb), `last_success_at` and `last_attempt_at` (timestamptz), `last_error` (text), and `item_count` (integer, default 0, not null), plus `drizzle/meta/`.

Create `scripts/migrate.ts`:

```ts
// Applies Drizzle migrations from ./drizzle to DATABASE_URL.
//
// Runs automatically before `next build`, but only for Vercel production
// builds, so preview builds never migrate the shared database. Run it by
// hand with `npm run db:migrate` (needs DATABASE_URL in the environment).
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  const forced = process.argv.includes("--force");
  const production = process.env.VERCEL_ENV === "production";

  if (!url || !(forced || production)) {
    console.log("[migrate] skipped (needs DATABASE_URL and a production build or --force)");
    return;
  }
  await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
  console.log("[migrate] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 4: Implement the stores**

Create `lib/sync/store.ts`:

```ts
import type { SourceId } from "../sources/types";

export interface Snapshot {
  source: SourceId;
  payload: unknown;
  lastSuccessAt: Date | null;
  lastAttemptAt: Date | null;
  lastError: string | null;
  itemCount: number;
}

// Persistence for source snapshots. The Drizzle implementation backs
// production; the in-memory one backs unit tests.
export interface SnapshotStore {
  get(source: SourceId): Promise<Snapshot | null>;
  recordSuccess(
    source: SourceId,
    payload: unknown,
    itemCount: number,
    at: Date,
  ): Promise<void>;
  // Must leave payload, lastSuccessAt and itemCount untouched.
  recordFailure(source: SourceId, error: string, at: Date): Promise<void>;
}
```

Create `lib/sync/memory-store.ts`:

```ts
import type { SourceId } from "../sources/types";
import type { Snapshot, SnapshotStore } from "./store";

export class MemorySnapshotStore implements SnapshotStore {
  private rows = new Map<SourceId, Snapshot>();

  async get(source: SourceId): Promise<Snapshot | null> {
    return this.rows.get(source) ?? null;
  }

  async recordSuccess(
    source: SourceId,
    payload: unknown,
    itemCount: number,
    at: Date,
  ): Promise<void> {
    this.rows.set(source, {
      source,
      payload,
      itemCount,
      lastSuccessAt: at,
      lastAttemptAt: at,
      lastError: null,
    });
  }

  async recordFailure(source: SourceId, error: string, at: Date): Promise<void> {
    const existing = this.rows.get(source);
    this.rows.set(source, {
      source,
      payload: existing?.payload ?? null,
      itemCount: existing?.itemCount ?? 0,
      lastSuccessAt: existing?.lastSuccessAt ?? null,
      lastAttemptAt: at,
      lastError: error,
    });
  }
}
```

Create `lib/sync/drizzle-store.ts`:

```ts
import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { sourceSnapshots } from "../db/schema";
import type { SourceId } from "../sources/types";
import type { Snapshot, SnapshotStore } from "./store";

// Accepts any Postgres Drizzle database: neon-http in production, PGlite in
// tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export class DrizzleSnapshotStore implements SnapshotStore {
  constructor(private db: AnyPgDatabase) {}

  async get(source: SourceId): Promise<Snapshot | null> {
    const rows = await this.db
      .select()
      .from(sourceSnapshots)
      .where(eq(sourceSnapshots.source, source))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      source,
      payload: row.payload,
      lastSuccessAt: row.lastSuccessAt,
      lastAttemptAt: row.lastAttemptAt,
      lastError: row.lastError,
      itemCount: row.itemCount,
    };
  }

  async recordSuccess(
    source: SourceId,
    payload: unknown,
    itemCount: number,
    at: Date,
  ): Promise<void> {
    const values = {
      payload,
      itemCount,
      lastSuccessAt: at,
      lastAttemptAt: at,
      lastError: null,
    };
    await this.db
      .insert(sourceSnapshots)
      .values({ source, ...values })
      .onConflictDoUpdate({ target: sourceSnapshots.source, set: values });
  }

  async recordFailure(source: SourceId, error: string, at: Date): Promise<void> {
    // On conflict only the attempt fields change; payload stays as it was.
    await this.db
      .insert(sourceSnapshots)
      .values({ source, payload: null, lastAttemptAt: at, lastError: error })
      .onConflictDoUpdate({
        target: sourceSnapshots.source,
        set: { lastAttemptAt: at, lastError: error },
      });
  }
}
```

- [ ] **Step 5: Implement the runner, auth, and snapshot view**

Create `lib/sync/run.ts`:

```ts
import type {
  AnySourceDefinition,
  SourceContext,
  SourceDefinition,
  SourceId,
} from "../sources/types";
import type { Snapshot, SnapshotStore } from "./store";

// Cron fires on the hour but GitHub Actions can start a few minutes late or
// early; without slack an hourly source would skip every other run.
const SLACK_MINUTES = 5;

export type SyncResult =
  | { source: SourceId; status: "ok"; itemCount: number }
  | { source: SourceId; status: "error"; error: string }
  | { source: SourceId; status: "skipped" };

export function isDue(
  definition: Pick<AnySourceDefinition, "intervalMinutes">,
  snapshot: Snapshot | null,
  now: Date,
): boolean {
  if (!snapshot?.lastAttemptAt) return true;
  const elapsedMinutes =
    (now.getTime() - snapshot.lastAttemptAt.getTime()) / 60_000;
  return elapsedMinutes >= definition.intervalMinutes - SLACK_MINUTES;
}

export async function syncSource<T>(
  definition: SourceDefinition<T>,
  store: SnapshotStore,
  ctx: SourceContext,
  now: Date,
): Promise<SyncResult> {
  try {
    const data = definition.schema.parse(await definition.fetch(ctx));
    const itemCount = definition.count(data);
    await store.recordSuccess(definition.id, data, itemCount, now);
    return { source: definition.id, status: "ok", itemCount };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await store.recordFailure(definition.id, error, now);
    return { source: definition.id, status: "error", error };
  }
}

export async function syncAll(
  definitions: AnySourceDefinition[],
  store: SnapshotStore,
  ctx: SourceContext,
  now: Date,
  options: { force?: boolean } = {},
): Promise<SyncResult[]> {
  // Sequential on purpose: five small requests, and it keeps upstream
  // politeness and log ordering simple.
  const results: SyncResult[] = [];
  for (const definition of definitions) {
    const snapshot = await store.get(definition.id);
    if (!options.force && !isDue(definition, snapshot, now)) {
      results.push({ source: definition.id, status: "skipped" });
      continue;
    }
    results.push(await syncSource(definition, store, ctx, now));
  }
  return results;
}
```

Create `lib/sync/auth.ts`:

```ts
import { timingSafeEqual } from "node:crypto";

// True when the Authorization header is "Bearer <secret>". An unset secret
// never authorizes, so a missing env var can't open the endpoint.
export function isAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
```

Create `lib/sources/snapshot-view.ts`:

```ts
import type { Snapshot } from "../sync/store";
import type { SourceDefinition } from "./types";

// What pages receive for a source. Plain JSON (no Date) so it can cross the
// "use cache" boundary.
export interface SourceView<T> {
  data: T;
  // ISO timestamp of the last successful sync, null if never synced.
  lastSuccessAt: string | null;
}

// Turns a stored snapshot into page data, failing soft: a missing snapshot,
// an empty payload, or a payload that no longer matches the schema (e.g.
// after a schema change, before the next sync) all yield the empty shape.
export function toSourceView<T>(
  definition: SourceDefinition<T>,
  snapshot: Snapshot | null,
): SourceView<T> {
  const empty = { data: definition.empty, lastSuccessAt: null };
  if (!snapshot || snapshot.payload == null) return empty;
  const parsed = definition.schema.safeParse(snapshot.payload);
  if (!parsed.success) {
    console.warn(`[sources] ${definition.id} snapshot failed validation; showing empty`);
    return empty;
  }
  return {
    data: parsed.data,
    lastSuccessAt: snapshot.lastSuccessAt?.toISOString() ?? null,
  };
}
```

- [ ] **Step 6: Verify**

Run: `npm test && npm run lint && npx tsx scripts/migrate.ts`
Expected: all tests PASS; lint is clean; the migrate script prints `[migrate] skipped (needs DATABASE_URL and a production build or --force)`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add Postgres source snapshots and the sync runner

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: View routing, theme, and the app shell

Adds the mechanism from the spec's "View Mode, Theme and Admin Layer" section:
- `proxy.ts` rewrites clean URLs to `/site/...` or `/dashboard/...`, sets the cookie from `?view=`, and redirects direct hits on the prefixed URLs.
- `app/[view]` is prerendered for both values.
- An inline script sets `data-theme` before first paint.
- The header carries both toggles.
- Playwright is set up here, and its first smoke spec proves all of the above against a production build.

The View Transitions animation is deferred to S3. `router.refresh()` swaps instantly for now.

**Files:**
- Create: `lib/site.ts`, `lib/view/views.ts`, `lib/view/theme.ts`, `lib/view/params.ts`, `proxy.ts`
- Replace: `app/layout.tsx`, `app/globals.css`
- Delete: `app/page.tsx` (Task 1's placeholder)
- Create: `app/[view]/layout.tsx`, `app/[view]/page.tsx`, `components/view-toggle.tsx`, `components/theme-toggle.tsx`
- Create: `tests/view.test.ts`, `playwright.config.ts`, `e2e/view-and-theme.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `VIEWS`, `type View = "site" | "dashboard"`, `DEFAULT_VIEW`, `VIEW_COOKIE = "view"`, `VIEW_QUERY = "view"`, `isView()`, `resolveView(query, cookie)` from `@/lib/view/views`
  - `assertView(value: string): View` (calls `notFound()` on bad input) from `@/lib/view/params`
  - `THEME_PREFERENCES`, `type ThemePreference`, `THEME_COOKIE = "theme"`, `themeScript` from `@/lib/view/theme`
  - `site` (`title`, `url`, `author`) from `@/lib/site`
  - DOM contract: `<html data-theme="light|dark" data-theme-preference="light|dark|system">`; `<div data-view="site|dashboard">` wraps every page. The toggles have `data-testid="view-toggle"` and `data-testid="theme-toggle"`.
  - Tailwind variants `dark:` and `dashboard:`, keyed on those attributes.

- [ ] **Step 1: Write the failing unit test**

Create `tests/view.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isView, resolveView } from "@/lib/view/views";

describe("resolveView", () => {
  it("prefers a valid query over the cookie", () => {
    expect(resolveView("dashboard", "site")).toBe("dashboard");
  });

  it("falls back to the cookie, then to site", () => {
    expect(resolveView(null, "dashboard")).toBe("dashboard");
    expect(resolveView(null, undefined)).toBe("site");
  });

  it("ignores invalid values", () => {
    expect(resolveView("admin", "evil")).toBe("site");
    expect(isView("Site")).toBe(false);
  });
});
```

Run: `npm test`
Expected: FAIL, because `@/lib/view/views` is missing.

- [ ] **Step 2: Implement the view and theme modules**

Create `lib/view/views.ts`:

```ts
export const VIEWS = ["site", "dashboard"] as const;
export type View = (typeof VIEWS)[number];

export const DEFAULT_VIEW: View = "site";
export const VIEW_COOKIE = "view";
export const VIEW_QUERY = "view";

export function isView(value: unknown): value is View {
  return typeof value === "string" && (VIEWS as readonly string[]).includes(value);
}

// ?view= wins (so links can force a view), then the cookie, then the default.
export function resolveView(query: string | null, cookie: string | undefined): View {
  if (isView(query)) return query;
  if (isView(cookie)) return cookie;
  return DEFAULT_VIEW;
}
```

Create `lib/view/theme.ts`:

```ts
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export const THEME_COOKIE = "theme";

// Runs inline in <head> before first paint: reads the theme cookie, resolves
// "system" against the OS setting, and sets <html data-theme>. Kept tiny and
// dependency-free because it is injected as a string.
export const themeScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark|system)/);var p=m?m[1]:"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.dataset.theme=d?"dark":"light";r.dataset.themePreference=p;}catch(e){}})();`;
```

Create `lib/view/params.ts`:

```ts
import { notFound } from "next/navigation";
import { type View, isView } from "./views";

// Narrows the [view] route param. The proxy only ever rewrites to valid
// views, so anything else is a 404.
export function assertView(value: string): View {
  if (!isView(value)) notFound();
  return value;
}
```

Create `lib/site.ts`:

```ts
// Site-wide metadata (was src/_data/site.json).
export const site = {
  title: "Onur Senture",
  url: "https://onursenture.com",
  author: "Onur Senture",
};
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Implement the proxy**

Create `proxy.ts` (at the repo root, next to `app/`):

```ts
import { type NextRequest, NextResponse } from "next/server";
import { VIEW_COOKIE, VIEW_QUERY, isView, resolveView } from "@/lib/view/views";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Every public page exists twice, prerendered under /site/... and
// /dashboard/... (app/[view]). This picks the variant from ?view= or the
// view cookie and rewrites internally, so visitors only ever see clean URLs
// and pages never read cookies (which would make them dynamic).
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  // The prefixed URLs are an implementation detail; bounce direct hits.
  if (isView(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(firstSegment.length + 1) || "/";
    return NextResponse.redirect(url);
  }

  const query = searchParams.get(VIEW_QUERY);
  const cookie = request.cookies.get(VIEW_COOKIE)?.value;
  const view = resolveView(query, cookie);

  const url = request.nextUrl.clone();
  url.pathname = `/${view}${pathname}`;
  const response = NextResponse.rewrite(url);
  if (isView(query) && query !== cookie) {
    response.cookies.set(VIEW_COOKIE, query, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
  }
  return response;
}

export const config = {
  // Skip API routes, Next internals, and any path with a file extension
  // (public/ files such as /images/..., /favicon.ico, /keybase.txt).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
```

- [ ] **Step 4: Implement the root layout and CSS**

Replace `app/globals.css`:

```css
@import "tailwindcss";

/* Theme and view are attributes, not media queries, so both can be toggled.
   Usage: dark:bg-black, dashboard:text-xs. Design tokens arrive in S3. */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
@custom-variant dashboard (&:where([data-view="dashboard"], [data-view="dashboard"] *));

:root {
  color-scheme: light;
  --background: #ffffff;
  --foreground: #171717;
}

[data-theme="dark"] {
  color-scheme: dark;
  --background: #0a0a0a;
  --foreground: #ededed;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/view/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.title}` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by themeScript before hydration, so React must not
    // complain that the server HTML lacked it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Implement the toggles**

Create `components/view-toggle.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { VIEW_COOKIE, type View } from "@/lib/view/views";

export function ViewToggle({ current }: { current: View }) {
  const router = useRouter();
  const next: View = current === "site" ? "dashboard" : "site";

  function toggle() {
    document.cookie = `${VIEW_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Re-requests the current URL; the proxy now rewrites to the other
    // variant. Also drops the client router cache so later navigations
    // don't serve prefetched pages of the old view.
    router.refresh();
  }

  return (
    <button type="button" onClick={toggle} data-testid="view-toggle">
      {next === "dashboard" ? "Dashboard view" : "Site view"}
    </button>
  );
}
```

Create `components/theme-toggle.tsx`:

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { THEME_COOKIE, THEME_PREFERENCES, type ThemePreference } from "@/lib/view/theme";

function readPreference(): ThemePreference {
  const value = document.documentElement.dataset.themePreference;
  return (THEME_PREFERENCES as readonly string[]).includes(value ?? "")
    ? (value as ThemePreference)
    : "system";
}

function apply(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.dataset.themePreference = preference;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Follow OS changes while the preference is "system".
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (readPreference() === "system") apply("system");
  };
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onChange);
  };
}

export function ThemeToggle() {
  // Server render has no preference; "system" matches the script's default.
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  function cycle() {
    const index = THEME_PREFERENCES.indexOf(preference);
    const next = THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length];
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    apply(next);
    listeners.forEach((l) => l());
  }

  return (
    <button type="button" onClick={cycle} data-testid="theme-toggle">
      Theme: {preference}
    </button>
  );
}
```

- [ ] **Step 6: Implement the [view] layout and the placeholder home page**

Delete Task 1's placeholder: `git rm app/page.tsx`.

Create `app/[view]/layout.tsx`. The nav already links `/life/` and `/photos/`; those pages arrive in Tasks 5 and 7.

```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ViewToggle } from "@/components/view-toggle";
import { assertView } from "@/lib/view/params";
import { VIEWS } from "@/lib/view/views";

// Prerender every page once per view; the proxy picks which one a visitor gets.
export function generateStaticParams() {
  return VIEWS.map((view) => ({ view }));
}

export default async function ViewLayout({ children, params }: LayoutProps<"/[view]">) {
  const view = assertView((await params).view);
  return (
    <div data-view={view} className="mx-auto max-w-3xl p-4 dashboard:max-w-6xl dashboard:text-sm">
      <header className="flex gap-4 border-b pb-2">
        <nav className="flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/life/">Life</Link>
          <Link href="/photos/">Photos</Link>
        </nav>
        <div className="ml-auto flex gap-2">
          <ViewToggle current={view} />
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
```

Create `app/[view]/page.tsx`:

```tsx
import Link from "next/link";

// Placeholder until the two-tier home page lands in S3.
export default function HomePage() {
  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold">Onur Senture</h1>
      <p>
        Site v2 skeleton. See <Link href="/life/">Life</Link> and <Link href="/photos/">Photos</Link>.
      </p>
    </main>
  );
}
```

- [ ] **Step 7: Configure Playwright and write the smoke spec**

Create `playwright.config.ts`. Port 3217 is chosen to avoid other local dev servers. Locally, `reuseExistingServer` would otherwise silently test whatever already listens on the port.

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 3217;

// Smoke tests run against a production build (`npm run build` first).
// Without DATABASE_URL every source renders its empty state, which is what
// CI exercises.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

Create `e2e/view-and-theme.spec.ts`:

```ts
import { expect, type Page, test } from "@playwright/test";

const viewOf = (page: Page) => page.locator("[data-view]").getAttribute("data-view");

test("defaults to the site view", async ({ page }) => {
  await page.goto("/");
  expect(await viewOf(page)).toBe("site");
});

test("?view=dashboard switches and persists via cookie", async ({ page }) => {
  await page.goto("/?view=dashboard");
  expect(await viewOf(page)).toBe("dashboard");
  await page.goto("/");
  expect(await viewOf(page)).toBe("dashboard");
});

test("the toggle switches view in place and survives a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-toggle").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await page.reload();
  expect(await viewOf(page)).toBe("dashboard");
  await page.getByTestId("view-toggle").click();
  await expect(page.locator('[data-view="site"]')).toBeVisible();
});

test("internal view prefixes redirect to clean URLs", async ({ page }) => {
  await page.goto("/dashboard/");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
});

test("theme cookie applies before paint and the toggle cycles it", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByTestId("theme-toggle").click(); // dark → system
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await page.getByTestId("theme-toggle").click(); // system → light
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("unknown pages 404", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
});
```

- [ ] **Step 8: Verify**

```bash
npx playwright install chromium
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
```

Expected:
- The build route table lists `/site` and `/dashboard` as `○ (Static)` and ends with `ƒ Proxy (Middleware)`.
- All 6 e2e tests PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Route every page through site and dashboard views with a theme switch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Sections and the /life page

Adds the spec's core principle: each section is one loader plus a `Site` renderer and a `Dashboard` renderer, and pages never branch on the view themselves. `readSource()` is the cached, tagged, never-throwing read path from snapshot to page. `/life` renders the five source sections plus one dashboard-only section (sync status). The renderers are deliberately plain HTML; S3 styles them.

**Files:**
- Create: `lib/sources/tags.ts`, `lib/sources/read.ts`
- Create: `components/sections/types.ts`, `components/sections/section-block.tsx`, `components/sections/synced-at.tsx`, `components/sections/empty.tsx`, `components/sections/life.ts`
- Create: `components/sections/{films,books,articles,writing,github,sync-status}/index.tsx`
- Create: `app/[view]/life/page.tsx`
- Create: `tests/sections.test.ts`, `e2e/life.spec.ts`

**Interfaces:**
- Consumes: `getSource`, `SourceData` (Task 2); `getDb` (Task 3); `DrizzleSnapshotStore`, `toSourceView`, `SourceView` (Task 3); `View`, `assertView` (Task 4); `formatDate`, `formatDateTime` (Task 1).
- Produces:
  - `sourceTag(id: SourceId): string` (`"source:<id>"`) from `@/lib/sources/tags`. Task 6 revalidates these tags.
  - `readSource<K>(id: K): Promise<SourceView<SourceData<K>>>` from `@/lib/sources/read` (`"use cache"`, `cacheTag(sourceTag(id))`, `cacheLife("hours")`, server-only)
  - `type Visibility = "both" | "dashboard"`, `SectionDefinition<T>`, `AnySectionDefinition`, `visibleSections(sections, view)` from `@/components/sections/types`
  - `<SectionBlock section view />`, which renders `<section data-section="<id>">`
  - `lifeSections` (in order: films, books, articles, writing, github, sync-status)

- [ ] **Step 1: Write the failing unit test**

Create `tests/sections.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { visibleSections } from "@/components/sections/types";

describe("visibleSections", () => {
  const sections = [
    { id: "a", visibility: "both" as const },
    { id: "b", visibility: "dashboard" as const },
  ];

  it("hides dashboard-only sections in site view", () => {
    expect(visibleSections(sections, "site").map((s) => s.id)).toEqual(["a"]);
  });

  it("shows everything in dashboard view", () => {
    expect(visibleSections(sections, "dashboard").map((s) => s.id)).toEqual(["a", "b"]);
  });
});
```

Run: `npm test`
Expected: FAIL, because `@/components/sections/types` is missing.

- [ ] **Step 2: Implement the read path**

Create `lib/sources/tags.ts`:

```ts
import type { SourceId } from "./types";

// Cache tag shared by readSource (assigns it) and the sync route (revalidates it).
export function sourceTag(id: SourceId): string {
  return `source:${id}`;
}
```

Create `lib/sources/read.ts`:

```ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "../db/client";
import { DrizzleSnapshotStore } from "../sync/drizzle-store";
import { type SourceData, getSource } from "./registry";
import { type SourceView, toSourceView } from "./snapshot-view";
import { sourceTag } from "./tags";
import type { SourceId } from "./types";

// Page-side read of a source snapshot. Cached and tagged so pages are
// prerendered and only regenerate when the sync route revalidates the tag
// (or after an hour as a safety net). Never throws: no database, no row, or
// a database error all render the empty shape.
export async function readSource<K extends SourceId>(id: K): Promise<SourceView<SourceData<K>>> {
  "use cache";
  cacheTag(sourceTag(id));
  cacheLife("hours");

  const definition = getSource(id);
  const db = getDb();
  if (!db) return toSourceView(definition, null);
  try {
    return toSourceView(definition, await new DrizzleSnapshotStore(db).get(id));
  } catch (e) {
    console.warn(`[sources] reading ${id} failed:`, e instanceof Error ? e.message : e);
    return toSourceView(definition, null);
  }
}
```

- [ ] **Step 3: Implement the section framework**

Create `components/sections/types.ts`:

```ts
import type { ReactNode } from "react";
import type { SourceView } from "@/lib/sources/snapshot-view";
import type { View } from "@/lib/view/views";

export type Visibility = "both" | "dashboard";

// A section is one data loader plus a renderer per view. Pages never branch
// on view themselves; they hand the view to SectionBlock.
export interface SectionDefinition<T> {
  id: string;
  title: string;
  visibility: Visibility;
  load: () => Promise<SourceView<T>>;
  Site: (props: { data: T }) => ReactNode;
  Dashboard: (props: { data: T; lastSuccessAt: string | null }) => ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDefinition = SectionDefinition<any>;

export function visibleSections<S extends Pick<AnySectionDefinition, "visibility">>(
  sections: S[],
  view: View,
): S[] {
  return sections.filter((s) => s.visibility === "both" || view === "dashboard");
}
```

Create `components/sections/section-block.tsx`:

```tsx
import type { View } from "@/lib/view/views";
import type { AnySectionDefinition } from "./types";

export async function SectionBlock({
  section,
  view,
}: {
  section: AnySectionDefinition;
  view: View;
}) {
  const { data, lastSuccessAt } = await section.load();
  const { Site, Dashboard } = section;
  return (
    <section data-section={section.id} className="my-8">
      <h2 className="font-bold">{section.title}</h2>
      {view === "dashboard" ? (
        <Dashboard data={data} lastSuccessAt={lastSuccessAt} />
      ) : (
        <Site data={data} />
      )}
    </section>
  );
}
```

Create `components/sections/synced-at.tsx`:

```tsx
import { formatDateTime } from "@/lib/format";

export function SyncedAt({ at }: { at: string | null }) {
  return (
    <p className="text-xs opacity-60">
      {at ? (
        <>
          Synced <time dateTime={at}>{formatDateTime(at)}</time>
        </>
      ) : (
        "Not synced yet"
      )}
    </p>
  );
}
```

Create `components/sections/empty.tsx`:

```tsx
export function Empty() {
  return <p className="opacity-60">Nothing here yet.</p>;
}
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Implement the six sections**

Create `components/sections/films/index.tsx`:

```tsx
import { formatDate } from "@/lib/format";
import type { Film } from "@/lib/sources/letterboxd";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Film[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul>
      {data.map((film) => (
        <li key={film.link}>
          <a href={film.link}>{film.title}</a> {film.rating}
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data, lastSuccessAt }: { data: Film[]; lastSuccessAt: string | null }) {
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      {data.length === 0 ? (
        <Empty />
      ) : (
        <table>
          <tbody>
            {data.map((film) => (
              <tr key={film.link}>
                <td>{film.title}</td>
                <td>{film.year}</td>
                <td>{film.ratingValue ?? "–"}</td>
                <td>{film.watchedDate ? formatDate(film.watchedDate) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export const films: SectionDefinition<Film[]> = {
  id: "films",
  title: "Films",
  visibility: "both",
  load: () => readSource("letterboxd"),
  Site,
  Dashboard,
};
```

Create `components/sections/books/index.tsx`:

```tsx
import { formatDate } from "@/lib/format";
import type { Book, Books } from "@/lib/sources/goodreads";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function BookList({ books }: { books: Book[] }) {
  if (books.length === 0) return <Empty />;
  return (
    <ul>
      {books.map((book) => (
        <li key={book.link}>
          <a href={book.link}>{book.title}</a> · {book.author} {book.rating}
        </li>
      ))}
    </ul>
  );
}

function Site({ data }: { data: Books }) {
  return (
    <>
      <h3>Currently reading</h3>
      <BookList books={data.currentlyReading} />
      <h3>Read</h3>
      <BookList books={data.read} />
    </>
  );
}

function Dashboard({ data, lastSuccessAt }: { data: Books; lastSuccessAt: string | null }) {
  const rows = [
    ...data.currentlyReading.map((b) => ({ ...b, shelf: "reading" })),
    ...data.read.map((b) => ({ ...b, shelf: "read" })),
  ];
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      {rows.length === 0 ? (
        <Empty />
      ) : (
        <table>
          <tbody>
            {rows.map((book) => (
              <tr key={`${book.shelf}-${book.link}`}>
                <td>{book.shelf}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.numRating || "–"}</td>
                <td>{formatDate(book.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export const books: SectionDefinition<Books> = {
  id: "books",
  title: "Books",
  visibility: "both",
  load: () => readSource("goodreads"),
  Site,
  Dashboard,
};
```

Create `components/sections/articles/index.tsx`:

```tsx
import { formatDate } from "@/lib/format";
import type { Article } from "@/lib/sources/instapaper";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Article[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul>
      {data.map((article) => (
        <li key={article.link}>
          <a href={article.link}>{article.title}</a> · {article.domain}
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data, lastSuccessAt }: { data: Article[]; lastSuccessAt: string | null }) {
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      {data.length === 0 ? (
        <Empty />
      ) : (
        <table>
          <tbody>
            {data.map((article) => (
              <tr key={article.link}>
                <td>{article.title}</td>
                <td>{article.domain}</td>
                <td>{article.minutes ? `${article.minutes} min` : ""}</td>
                <td>{formatDate(article.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export const articles: SectionDefinition<Article[]> = {
  id: "articles",
  title: "Saved articles",
  visibility: "both",
  load: () => readSource("instapaper"),
  Site,
  Dashboard,
};
```

Create `components/sections/writing/index.tsx`:

```tsx
import { formatDate } from "@/lib/format";
import { readSource } from "@/lib/sources/read";
import type { Post } from "@/lib/sources/writing";
import { Empty } from "../empty";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Post[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul>
      {data.map((post) => (
        <li key={post.link}>
          <a href={post.link}>{post.title}</a> · {formatDate(post.date)}
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data, lastSuccessAt }: { data: Post[]; lastSuccessAt: string | null }) {
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      <Site data={data} />
    </>
  );
}

export const writing: SectionDefinition<Post[]> = {
  id: "writing",
  title: "Writing",
  visibility: "both",
  load: () => readSource("writing"),
  Site,
  Dashboard,
};
```

Create `components/sections/github/index.tsx`:

```tsx
import type { Contributions } from "@/lib/sources/github";
import { readSource } from "@/lib/sources/read";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Contributions }) {
  return <p>{data.total} contributions in the last year</p>;
}

function Dashboard({ data, lastSuccessAt }: { data: Contributions; lastSuccessAt: string | null }) {
  const days = data.weeks.flatMap((w) => w.days);
  const activeDays = days.filter((d) => d.count > 0).length;
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      <dl>
        <dt>Contributions</dt>
        <dd>{data.total}</dd>
        <dt>Active days</dt>
        <dd>
          {activeDays} / {days.length}
        </dd>
      </dl>
    </>
  );
}

export const github: SectionDefinition<Contributions> = {
  id: "github",
  title: "GitHub",
  visibility: "both",
  load: () => readSource("github"),
  Site,
  Dashboard,
};
```

Create `components/sections/sync-status/index.tsx`:

```tsx
import { formatDateTime } from "@/lib/format";
import { readSource } from "@/lib/sources/read";
import { SOURCE_IDS, type SourceId } from "@/lib/sources/types";
import type { SectionDefinition } from "../types";

type Status = { id: SourceId; lastSuccessAt: string | null }[];

async function load() {
  const views = await Promise.all(SOURCE_IDS.map((id) => readSource(id)));
  const data: Status = SOURCE_IDS.map((id, i) => ({
    id,
    lastSuccessAt: views[i].lastSuccessAt,
  }));
  return { data, lastSuccessAt: null };
}

function Dashboard({ data }: { data: Status }) {
  return (
    <table>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.lastSuccessAt ? formatDateTime(row.lastSuccessAt) : "never"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Dashboard-only: when each external source last synced.
export const syncStatus: SectionDefinition<Status> = {
  id: "sync-status",
  title: "Sources",
  visibility: "dashboard",
  load,
  Site: () => null,
  Dashboard,
};
```

Create `components/sections/life.ts`:

```ts
import { articles } from "./articles";
import { books } from "./books";
import { films } from "./films";
import { github } from "./github";
import { syncStatus } from "./sync-status";
import type { AnySectionDefinition } from "./types";
import { writing } from "./writing";

// Order of sections on /life.
export const lifeSections: AnySectionDefinition[] = [
  films,
  books,
  articles,
  writing,
  github,
  syncStatus,
];
```

- [ ] **Step 5: Implement the /life page**

Create `app/[view]/life/page.tsx`:

```tsx
import type { Metadata } from "next";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { visibleSections } from "@/components/sections/types";
import { assertView } from "@/lib/view/params";

export const metadata: Metadata = { title: "Life" };

export default async function LifePage({ params }: PageProps<"/[view]/life">) {
  const view = assertView((await params).view);
  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold">Life</h1>
      {visibleSections(lifeSections, view).map((section) => (
        <SectionBlock key={section.id} section={section} view={view} />
      ))}
    </main>
  );
}
```

- [ ] **Step 6: Write the e2e spec**

Create `e2e/life.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("site view renders every source section with an empty state", async ({ page }) => {
  await page.goto("/life/");
  for (const id of ["films", "books", "articles", "writing", "github"]) {
    await expect(page.locator(`[data-section="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
});

test("dashboard view adds dashboard-only sections", async ({ page }) => {
  await page.goto("/life/?view=dashboard");
  await expect(page.locator('[data-section="sync-status"]')).toBeVisible();
  await expect(page.locator('[data-section="films"]')).toContainText("Not synced yet");
});

test("client navigation after a toggle lands on the new view", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-toggle").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Life" }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await expect(page.locator('[data-section="sync-status"]')).toBeVisible();
});

test("/dashboard/life/ redirects to /life/", async ({ page }) => {
  await page.goto("/dashboard/life/");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/life\/$/);
});
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
Expected:
- The build lists `/site/life` and `/dashboard/life` as static, with `Revalidate 1h`.
- All 10 e2e tests PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Render life sections per view from cached source snapshots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Sync API routes

Exposes the runner over HTTP for the scheduled job:
- `POST /api/sync/` syncs every due source (`?force=1` syncs all of them).
- `POST /api/sync/<source>/` syncs one source now.

Both routes require `Authorization: Bearer $SYNC_SECRET`, answer 503 when no database is configured, revalidate the cache tag of each source that synced successfully (`"max"` stale-while-revalidate), and return 502 when any source failed. The 502 makes the GitHub Actions run go red.

**Files:**
- Create: `lib/sync/respond.ts`, `lib/sync/context.ts`, `app/api/sync/route.ts`, `app/api/sync/[source]/route.ts`
- Create: `tests/sync/respond.test.ts`, `e2e/sync-api.spec.ts`

**Interfaces:**
- Consumes: `sources`, `getSource`, `isSourceId` (Task 2); `getDb`, `DrizzleSnapshotStore`, `syncAll`, `syncSource`, `isAuthorized`, `SyncResult` (Task 3); `sourceTag` (Task 5).
- Produces:
  - `syncStatusCode(results): 200 | 502` and `syncResponse(results): Response` from `@/lib/sync/respond`
  - `prepareSync(request)` from `@/lib/sync/context`
  - HTTP: `POST /api/sync/[?force=1]` and `POST /api/sync/<source>/`. Status codes: 401 (bad or missing token), 404 (unknown source), 503 (no `DATABASE_URL`), 200 or 502 with body `{ results: SyncResult[] }`.

- [ ] **Step 1: Write the failing test**

Create `tests/sync/respond.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const { revalidateTag } = await import("next/cache");
const { syncResponse, syncStatusCode } = await import("@/lib/sync/respond");

describe("syncStatusCode", () => {
  it("is 200 when nothing failed, 502 otherwise", () => {
    expect(syncStatusCode([{ source: "github", status: "skipped" }])).toBe(200);
    expect(
      syncStatusCode([
        { source: "github", status: "ok", itemCount: 1 },
        { source: "writing", status: "error", error: "x" },
      ]),
    ).toBe(502);
  });
});

describe("syncResponse", () => {
  it("revalidates only sources that synced", async () => {
    const response = syncResponse([
      { source: "github", status: "ok", itemCount: 1 },
      { source: "writing", status: "error", error: "x" },
      { source: "letterboxd", status: "skipped" },
    ]);
    expect(revalidateTag).toHaveBeenCalledTimes(1);
    expect(revalidateTag).toHaveBeenCalledWith("source:github", "max");
    expect(response.status).toBe(502);
    expect((await response.json()).results).toHaveLength(3);
  });
});
```

Run: `npm test`
Expected: FAIL, because `@/lib/sync/respond` is missing.

- [ ] **Step 2: Implement the helpers**

Create `lib/sync/respond.ts`:

```ts
import { revalidateTag } from "next/cache";
import { sourceTag } from "../sources/tags";
import type { SyncResult } from "./run";

// 502 when any source failed so the GitHub Actions run goes red and emails;
// the body still lists every result.
export function syncStatusCode(results: SyncResult[]): number {
  return results.some((r) => r.status === "error") ? 502 : 200;
}

export function syncResponse(results: SyncResult[]): Response {
  for (const result of results) {
    // Stale-while-revalidate: the next visitor gets the old page while the
    // new one renders in the background.
    if (result.status === "ok") revalidateTag(sourceTag(result.source), "max");
  }
  return Response.json({ results }, { status: syncStatusCode(results) });
}
```

Create `lib/sync/context.ts`:

```ts
import "server-only";
import { getDb } from "../db/client";
import type { SourceContext } from "../sources/types";
import { isAuthorized } from "./auth";
import { DrizzleSnapshotStore } from "./drizzle-store";

// Shared preamble for the sync route handlers: checks the bearer token and
// the database, returning either a ready store/context or an error response.
export function prepareSync(
  request: Request,
): { error: Response } | { store: DrizzleSnapshotStore; ctx: SourceContext } {
  if (!isAuthorized(request.headers.get("authorization"), process.env.SYNC_SECRET)) {
    return { error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const db = getDb();
  if (!db) {
    return { error: Response.json({ error: "DATABASE_URL is not set" }, { status: 503 }) };
  }
  return {
    store: new DrizzleSnapshotStore(db),
    ctx: { fetch: globalThis.fetch, env: process.env },
  };
}
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Implement the routes**

Create `app/api/sync/route.ts`:

```ts
import { sources } from "@/lib/sources/registry";
import { prepareSync } from "@/lib/sync/context";
import { syncResponse } from "@/lib/sync/respond";
import { syncAll } from "@/lib/sync/run";

// POST /api/sync/          → sync every source that is due
// POST /api/sync/?force=1  → sync every source now
// Called hourly by .github/workflows/sync.yml with Authorization: Bearer $SYNC_SECRET.
export async function POST(request: Request) {
  const prepared = prepareSync(request);
  if ("error" in prepared) return prepared.error;
  const force = new URL(request.url).searchParams.get("force") === "1";
  const results = await syncAll(Object.values(sources), prepared.store, prepared.ctx, new Date(), {
    force,
  });
  return syncResponse(results);
}
```

Create `app/api/sync/[source]/route.ts`:

```ts
import { getSource } from "@/lib/sources/registry";
import { isSourceId } from "@/lib/sources/types";
import { prepareSync } from "@/lib/sync/context";
import { syncResponse } from "@/lib/sync/respond";
import { syncSource } from "@/lib/sync/run";

// POST /api/sync/<source>/ → sync one source now, regardless of schedule.
export async function POST(request: Request, { params }: RouteContext<"/api/sync/[source]">) {
  const { source } = await params;
  if (!isSourceId(source)) {
    return Response.json({ error: `unknown source "${source}"` }, { status: 404 });
  }
  const prepared = prepareSync(request);
  if ("error" in prepared) return prepared.error;
  const result = await syncSource(getSource(source), prepared.store, prepared.ctx, new Date());
  return syncResponse([result]);
}
```

- [ ] **Step 4: Write the e2e spec**

Create `e2e/sync-api.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("sync rejects requests without the secret", async ({ request }) => {
  const response = await request.post("/api/sync/");
  expect(response.status()).toBe(401);
});

test("sync 404s an unknown source", async ({ request }) => {
  const response = await request.post("/api/sync/nope/");
  expect(response.status()).toBe(404);
});
```

- [ ] **Step 5: Verify, including the no-database path by hand**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
Expected: all 12 e2e tests PASS.

Then check the authorized path without a database:

```bash
SYNC_SECRET=local npx next start -p 3218 &
sleep 3
curl -s -w " %{http_code}\n" -X POST -H "Authorization: Bearer local" http://localhost:3218/api/sync/
kill %1
```

Expected: `{"error":"DATABASE_URL is not set"} 503`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Expose source sync over an authenticated API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Image pipeline and photo pages

Replaces the manual `sips` / `avifenc` / `mozjpeg` flow with `npm run images`. It turns `images-src/**` into AVIF + JPEG renditions at 640/1280/2560 (never upscaling) plus `lib/images/manifest.json`. `<Picture>` renders from the manifest with explicit width and height. The five photos move to `content/photos/*.mdx`, and their pages keep the `/photos/<slug>/` URLs with JPEG `og:image` metadata.

**Files:**
- Create: `lib/images/plan.ts`, `scripts/images.ts`, `lib/images/manifest.ts`, `lib/images/manifest.json` (generated), `components/picture.tsx`
- Create: `images-src/photos/*.jpeg` (copied), `public/images/photos/*-{640,1280,2560}.{avif,jpg}` (generated)
- Create: `lib/content/photos.ts`, `content/photos/*.mdx`, `app/[view]/photos/page.tsx`, `app/[view]/photos/[slug]/page.tsx`
- Create: `tests/images-plan.test.ts`, `tests/content/photos.test.ts`, `e2e/photos.spec.ts`

**Interfaces:**
- Consumes: `formatDate` (Task 1); `site.url`, the `metadataBase` in the root layout (Task 4); the `[view]` layout (Task 4).
- Produces:
  - `TARGET_WIDTHS`, `ImageEntry { width; height; widths: number[] }`, `ImageManifest`, `widthsFor(sourceWidth)`, `renditionUrl(key, width, "avif" | "jpg")`, `srcSet(key, entry, format)` from `@/lib/images/plan`
  - `getImage(key): ImageEntry` (throws on an unknown key) and `hasImage(key)` from `@/lib/images/manifest`
  - `<Picture image alt sizes? priority? className? />`
  - `Photo { slug; title; date: "YYYY-MM-DD"; image; camera? }`, `parsePhoto(slug, source)`, `loadPhotos(dir?)`, `getPhotos()` (cached), `getPhoto(slug)` from `@/lib/content/photos`
  - Rendition URL scheme: `/images/<key>-<width>.<avif|jpg>`

- [ ] **Step 1: Write the failing tests**

Create `tests/images-plan.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renditionUrl, srcSet, widthsFor } from "@/lib/images/plan";

describe("widthsFor", () => {
  it("generates every target for large sources", () => {
    expect(widthsFor(4032)).toEqual([640, 1280, 2560]);
    expect(widthsFor(2560)).toEqual([640, 1280, 2560]);
  });

  it("adds the source width instead of upscaling", () => {
    expect(widthsFor(1800)).toEqual([640, 1280, 1800]);
    expect(widthsFor(500)).toEqual([500]);
  });

  it("does not duplicate a source width equal to a target", () => {
    expect(widthsFor(1280)).toEqual([640, 1280]);
  });
});

describe("srcSet", () => {
  it("lists every rendition with its width descriptor", () => {
    const entry = { width: 1800, height: 1200, widths: [640, 1280, 1800] };
    expect(srcSet("photos/x", entry, "avif")).toBe(
      "/images/photos/x-640.avif 640w, /images/photos/x-1280.avif 1280w, /images/photos/x-1800.avif 1800w",
    );
    expect(renditionUrl("photos/x", 640, "jpg")).toBe("/images/photos/x-640.jpg");
  });
});
```

Create `tests/content/photos.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

// next/cache only works inside Next; loadPhotos and parsePhoto don't need it.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

const { loadPhotos, parsePhoto } = await import("@/lib/content/photos");
const { hasImage } = await import("@/lib/images/manifest");

describe("parsePhoto", () => {
  it("normalizes YAML dates and keeps optional fields", () => {
    const photo = parsePhoto(
      "x",
      "---\ntitle: X\ndate: 2026-02-10\nimage: photos/x\ncamera: iPhone 17\n---\n",
    );
    expect(photo).toEqual({
      slug: "x",
      title: "X",
      date: "2026-02-10",
      image: "photos/x",
      camera: "iPhone 17",
    });
  });

  it("names the file when frontmatter is invalid", () => {
    expect(() => parsePhoto("bad", "---\ntitle: Bad\n---\n")).toThrow("content/photos/bad.mdx");
  });
});

describe("content/photos", () => {
  it("loads newest first and every image exists in the manifest", async () => {
    const photos = await loadPhotos();
    expect(photos.length).toBeGreaterThan(0);
    const dates = photos.map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
    for (const photo of photos) {
      expect(hasImage(photo.image), `${photo.slug} → ${photo.image}`).toBe(true);
    }
  });
});
```

Run: `npm test`
Expected: FAIL, because `@/lib/images/plan` and `@/lib/content/photos` are missing.

- [ ] **Step 2: Implement the rendition plan and the script**

Create `lib/images/plan.ts`:

```ts
export const TARGET_WIDTHS = [640, 1280, 2560] as const;

export interface ImageEntry {
  // Intrinsic size of the largest generated rendition.
  width: number;
  height: number;
  // Generated widths, ascending. Each exists as .avif and .jpg.
  widths: number[];
}

export type ImageManifest = Record<string, ImageEntry>;

// Widths to generate for a source of the given width: every target that
// fits, plus the source width itself when it is smaller than the largest
// target (so we never upscale and the full resolution is always available).
export function widthsFor(sourceWidth: number): number[] {
  const fitting = TARGET_WIDTHS.filter((w) => w <= sourceWidth);
  const largest = TARGET_WIDTHS[TARGET_WIDTHS.length - 1];
  if (sourceWidth < largest && !fitting.includes(sourceWidth as never)) {
    return [...fitting, sourceWidth];
  }
  return [...fitting];
}

// "photos/stabilo" + 640 + "avif" → "/images/photos/stabilo-640.avif"
export function renditionUrl(key: string, width: number, format: "avif" | "jpg"): string {
  return `/images/${key}-${width}.${format}`;
}

export function srcSet(key: string, entry: ImageEntry, format: "avif" | "jpg"): string {
  return entry.widths.map((w) => `${renditionUrl(key, w, format)} ${w}w`).join(", ");
}
```

Create `scripts/images.ts`:

```ts
// Optimizes source images into responsive AVIF + JPEG renditions.
//
//   npm run images
//
// Reads every .jpg/.jpeg/.png under images-src/, writes
// public/images/<path>-<width>.{avif,jpg}, and records sizes in
// lib/images/manifest.json (keyed by path without extension, e.g.
// "photos/stabilo"). Sources whose renditions are newer than the source are
// skipped, so re-running is cheap. Commit the outputs and the manifest.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";
import { type ImageManifest, widthsFor } from "../lib/images/plan";

// Run from the repo root (npm run images does this).
const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "images-src");
const OUT_DIR = join(ROOT, "public", "images");
const MANIFEST = join(ROOT, "lib", "images", "manifest.json");
const EXTENSIONS = /\.(jpe?g|png)$/i;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : EXTENSIONS.test(name) ? [path] : [];
  });
}

function isFresh(source: string, outputs: string[]): boolean {
  const sourceTime = statSync(source).mtimeMs;
  return outputs.every((o) => existsSync(o) && statSync(o).mtimeMs >= sourceTime);
}

async function main() {
  const previous: ImageManifest = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, "utf8"))
    : {};
  const manifest: ImageManifest = {};

  for (const source of walk(SRC_DIR).sort()) {
    const key = relative(SRC_DIR, source).replace(EXTENSIONS, "").split("\\").join("/");
    // rotate() applies EXIF orientation so width/height match what is shown.
    const meta = await sharp(source).rotate().metadata();
    const sourceWidth = meta.autoOrient?.width ?? meta.width;
    const sourceHeight = meta.autoOrient?.height ?? meta.height;
    if (!sourceWidth || !sourceHeight) throw new Error(`Cannot read size of ${source}`);

    const widths = widthsFor(sourceWidth);
    const outputs = widths.flatMap((w) =>
      (["avif", "jpg"] as const).map((f) => join(OUT_DIR, `${key}-${w}.${f}`)),
    );

    if (previous[key] && isFresh(source, outputs)) {
      manifest[key] = previous[key];
      console.log(`skip  ${key}`);
      continue;
    }

    mkdirSync(dirname(join(OUT_DIR, key)), { recursive: true });
    for (const w of widths) {
      const resized = sharp(source).rotate().resize({ width: w, withoutEnlargement: true });
      await resized
        .clone()
        .avif({ quality: 60, chromaSubsampling: "4:2:0" })
        .toFile(join(OUT_DIR, `${key}-${w}.avif`));
      await resized
        .clone()
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toFile(join(OUT_DIR, `${key}-${w}.jpg`));
    }

    const largest = widths[widths.length - 1];
    manifest[key] = {
      width: largest,
      height: Math.round((sourceHeight * largest) / sourceWidth),
      widths,
    };
    console.log(`wrote ${key} (${widths.join(", ")})`);
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Add the photo sources and generate renditions**

The originals aren't in the repo. The current 2560px JPEGs are the best available sources; replace any of them with the untouched originals later and re-run the script.

```bash
mkdir -p images-src/photos
for slug in bazi-kotu-aliskanliklarin-politik-tarihi bold-vakif-building kizilcikli night-boulevard stabilo; do
  cp "public/images/photos/$slug.jpeg" "images-src/photos/$slug.jpeg"
done
npm run images
```

Expected: five `wrote photos/<slug> (640, 1280, 2560)` lines; `lib/images/manifest.json` with five entries (`photos/stabilo` → `width 2560, height 1440`). Run `npm run images` again: it prints five `skip` lines.

The legacy `public/images/photos/<slug>.{jpeg,avif}` files stay, so old links and cached OG images keep working.

- [ ] **Step 4: Implement the manifest reader and `<Picture>`**

Create `lib/images/manifest.ts`:

```ts
import manifestJson from "./manifest.json";
import type { ImageEntry, ImageManifest } from "./plan";

const manifest: ImageManifest = manifestJson;

// Throws for an unknown key so a missing `npm run images` fails the build
// instead of shipping a broken <img>.
export function getImage(key: string): ImageEntry {
  const entry = manifest[key];
  if (!entry) throw new Error(`Unknown image "${key}". Add it under images-src/ and run npm run images.`);
  return entry;
}

export function hasImage(key: string): boolean {
  return key in manifest;
}
```

Create `components/picture.tsx`:

```tsx
import { getImage } from "@/lib/images/manifest";
import { renditionUrl, srcSet } from "@/lib/images/plan";

// Responsive AVIF + JPEG <picture> for an image produced by `npm run images`.
// `image` is the manifest key, e.g. "photos/stabilo".
export function Picture({
  image,
  alt,
  sizes = "100vw",
  priority = false,
  className,
}: {
  image: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const entry = getImage(image);
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(image, entry, "avif")} sizes={sizes} />
      <img
        src={renditionUrl(image, entry.width, "jpg")}
        srcSet={srcSet(image, entry, "jpg")}
        sizes={sizes}
        width={entry.width}
        height={entry.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
```

- [ ] **Step 5: Add the photo content and loader**

Create the five content files. They carry the Eleventy frontmatter, with `image` changed to the manifest key:

`content/photos/bazi-kotu-aliskanliklarin-politik-tarihi.mdx`

```yaml
---
title: Bazı Kötü Alışkanlıkların Politik Tarihi
date: 2026-05-21
image: photos/bazi-kotu-aliskanliklarin-politik-tarihi
camera: iPhone 17
---
```

`content/photos/bold-vakif-building.mdx`

```yaml
---
title: Bold, Vakıf Building
date: 2026-03-07
image: photos/bold-vakif-building
camera: iPhone 17
---
```

`content/photos/kizilcikli.mdx`

```yaml
---
title: Kızılcıklı
date: 2025-03-29
image: photos/kizilcikli
camera: Fujifilm X100VI
---
```

`content/photos/night-boulevard.mdx`

```yaml
---
title: Night Boulevard
date: 2026-03-13
image: photos/night-boulevard
camera: iPhone 17
---
```

`content/photos/stabilo.mdx`

```yaml
---
title: Stabilo
date: 2026-02-10
image: photos/stabilo
camera: iPhone 17
---
```

Create `lib/content/photos.ts`:

```ts
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { cacheLife } from "next/cache";
import { z } from "zod";

const PHOTOS_DIR = join(process.cwd(), "content", "photos");

// YAML turns `date: 2026-02-10` into a Date; normalize to YYYY-MM-DD.
const dateString = z
  .union([z.date(), z.string()])
  .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const photoFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: dateString,
  // Image manifest key, e.g. "photos/stabilo".
  image: z.string().min(1),
  camera: z.string().optional(),
});

export type Photo = z.infer<typeof photoFrontmatterSchema> & { slug: string };

export function parsePhoto(slug: string, source: string): Photo {
  const { data } = matter(source);
  const result = photoFrontmatterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`content/photos/${slug}.mdx: ${result.error.message}`);
  }
  return { slug, ...result.data };
}

export async function loadPhotos(dir: string = PHOTOS_DIR): Promise<Photo[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".mdx"));
  const photos = await Promise.all(
    files.map(async (file) =>
      parsePhoto(file.replace(/\.mdx$/, ""), await readFile(join(dir, file), "utf8")),
    ),
  );
  return photos.sort((a, b) => b.date.localeCompare(a.date));
}

// Cached for prerendering; content only changes with a deploy.
export async function getPhotos(): Promise<Photo[]> {
  "use cache";
  cacheLife("max");
  return loadPhotos();
}

export async function getPhoto(slug: string): Promise<Photo | undefined> {
  return (await getPhotos()).find((p) => p.slug === slug);
}
```

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Implement the photo pages**

Create `app/[view]/photos/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Picture } from "@/components/picture";
import { getPhotos } from "@/lib/content/photos";

export const metadata: Metadata = { title: "Photos" };

export default async function PhotosPage() {
  const photos = await getPhotos();
  return (
    <main className="py-8">
      <h1 className="text-2xl font-bold">Photos</h1>
      <ul className="grid grid-cols-2 gap-4 dashboard:grid-cols-4">
        {photos.map((photo) => (
          <li key={photo.slug}>
            <Link href={`/photos/${photo.slug}/`}>
              <Picture image={photo.image} alt={photo.title} sizes="(min-width: 768px) 50vw, 100vw" />
              {photo.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

Create `app/[view]/photos/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "@/components/picture";
import { getPhoto, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { getImage } from "@/lib/images/manifest";
import { renditionUrl } from "@/lib/images/plan";

export async function generateStaticParams() {
  return (await getPhotos()).map((photo) => ({ slug: photo.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[view]/photos/[slug]">): Promise<Metadata> {
  const photo = await getPhoto((await params).slug);
  if (!photo) return {};
  const image = getImage(photo.image);
  // Social crawlers don't reliably render AVIF: always the largest JPEG.
  const ogImage = {
    url: renditionUrl(photo.image, image.width, "jpg"),
    width: image.width,
    height: image.height,
    alt: photo.title,
  };
  return {
    title: photo.title,
    description: photo.title,
    openGraph: { title: photo.title, description: photo.title, type: "article", images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  };
}

export default async function PhotoPage({ params }: PageProps<"/[view]/photos/[slug]">) {
  const photo = await getPhoto((await params).slug);
  if (!photo) notFound();
  return (
    <main className="py-8">
      <Picture image={photo.image} alt={photo.title} priority />
      <h1 className="text-xl font-bold">{photo.title}</h1>
      <p>
        <time dateTime={photo.date}>{formatDate(photo.date)}</time>
        {photo.camera ? ` · ${photo.camera}` : null}
      </p>
    </main>
  );
}
```

- [ ] **Step 7: Write the e2e spec**

Create `e2e/photos.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("photo pages keep their URLs and serve AVIF with a JPEG fallback", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page.getByRole("heading", { name: "Stabilo" })).toBeVisible();
  await expect(page.locator('picture source[type="image/avif"]')).toHaveAttribute(
    "srcset",
    /\/images\/photos\/stabilo-640\.avif 640w/,
  );
  const img = page.locator("picture img");
  await expect(img).toHaveAttribute("width", "2560");
  await expect(img).toHaveAttribute("height", "1440");
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
});

test("photo pages emit an absolute JPEG og:image", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://onursenture.com/images/photos/stabilo-2560.jpg",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("the photos index links every photo", async ({ page }) => {
  await page.goto("/photos/");
  await expect(page.locator('main a[href^="/photos/"]')).toHaveCount(5);
});
```

- [ ] **Step 8: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`
Expected:
- The build lists the photo pages as static under both views.
- All 15 e2e tests PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Add the image pipeline and port photo pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: CI workflow on v2

Runs the full verification on every push to `v2` and on every pull request. It uses a production build without a database, so the e2e tests exercise the empty states.

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the npm scripts from Task 1; the Playwright config from Task 4.
- Produces: a `CI` workflow whose `check` job must be green before work merges into `v2`.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [v2]
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm

      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

- [ ] **Step 2: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "Run typecheck, lint, tests, build and smoke tests in CI

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin v2
```

- [ ] **Step 3: Verify**

Run: `gh run list --branch v2 --workflow CI --limit 1`, then `gh run watch <run-id> --exit-status`
Expected: the `CI` run on `v2` completes successfully.

If it fails, read the log with `gh run view <run-id> --log-failed`, fix the cause, and push again.

---

### Task 9: Scheduled sync workflow (on `master`)

GitHub only runs scheduled workflows from the default branch, so this one file goes to **`master`**. It does nothing until the repository variable `SITE_URL` exists (Task 10), so the Eleventy site is unaffected.

**Files:**
- Create (on `master`): `.github/workflows/sync.yml`

**Interfaces:**
- Consumes: `POST /api/sync/` (Task 6), the repository variable `SITE_URL`, and the repository secret `SYNC_SECRET`.
- Produces: an hourly authenticated call to the sync endpoint, plus a manual "Run workflow" button with a `force` checkbox.

- [ ] **Step 1: Switch to master**

```bash
git checkout master
```

- [ ] **Step 2: Write the workflow**

Create `.github/workflows/sync.yml`:

```yaml
name: Sync sources

# Lives on master because GitHub only runs scheduled workflows from the
# default branch. Calls the v2 site's sync endpoint; skipped until the
# SITE_URL repository variable is set.
on:
  schedule:
    - cron: "17 * * * *" # hourly, off the top of the hour to dodge cron congestion
  workflow_dispatch:
    inputs:
      force:
        description: "Sync every source now, ignoring schedules"
        type: boolean
        default: false

concurrency:
  group: sync
  cancel-in-progress: false

jobs:
  sync:
    if: ${{ vars.SITE_URL != '' }}
    runs-on: ubuntu-latest
    steps:
      - name: Call the sync endpoint
        env:
          SITE_URL: ${{ vars.SITE_URL }}
          SYNC_SECRET: ${{ secrets.SYNC_SECRET }}
          QUERY: ${{ inputs.force && '?force=1' || '' }}
        run: |
          curl --fail-with-body --silent --show-error --max-time 120 \
            -X POST "${SITE_URL%/}/api/sync/${QUERY}" \
            -H "Authorization: Bearer ${SYNC_SECRET}"
```

The trailing slash in `/api/sync/` is required (`trailingSlash: true`; a POST does not survive the 308).

- [ ] **Step 3: Commit, push, and return to v2**

```bash
git add .github/workflows/sync.yml
git commit -m "Add hourly source sync workflow for the v2 site

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin master
git checkout v2
```

Pushing to master also triggers the existing Eleventy deploy. That is harmless: it is the same site.

- [ ] **Step 4: Verify**

Run: `gh workflow list`
Expected: `Sync sources` is listed as active.

Its scheduled runs show as skipped until Task 10 sets `SITE_URL`.

---

### Task 10: Vercel, Neon, and the first sync (manual, Onur)

These steps happen in the Vercel and GitHub dashboards on Onur's accounts. An agent must not do them. The agent's part is to hand Onur this checklist and then run the verification in Step 7.

- [ ] **Step 1: Create the Vercel project.** In Vercel, choose Add New, then Project, and import `onursenture/onursenture.github.com`. Keep the framework preset at Next.js. Under Settings → Git, set **Production Branch to `v2`** until launch. This gives v2 a stable `https://<project>.vercel.app` URL and keeps master's Eleventy pushes out of production.
- [ ] **Step 2: Add Neon.** In the project, go to Storage, choose Create Database, then **Neon**, and connect it to all environments. This sets `DATABASE_URL`.
- [ ] **Step 3: Add the env vars** under Settings → Environment Variables:
  - `SYNC_SECRET`: generate it with `openssl rand -hex 32`.
  - `GH_PAT`: the same token as the existing `GH_PAT` GitHub secret, or a new fine-grained token with read access to the profile.
  - Set both for Production and Preview.
- [ ] **Step 4: Redeploy `v2`.** The build log must show `[migrate] done`.
- [ ] **Step 5: Configure GitHub.** In the repo, go to Settings → Secrets and variables → Actions:
  - Add the secret `SYNC_SECRET`, with the same value as in Vercel.
  - Add the **variable** `SITE_URL` = `https://<project>.vercel.app`.
- [ ] **Step 6: Force the first sync.** Go to Actions → Sync sources → Run workflow, and check **force**.
- [ ] **Step 7: Verify (agent).** Run `gh run watch <run-id> --exit-status`, then check the response.

  Expected:
  - The run succeeds.
  - Its log shows `{"results":[...]}` with `"status":"ok"` for all five sources.
  - Opening `https://<project>.vercel.app/life/?view=dashboard` shows real films, books, articles and GitHub totals, plus a Sources table with sync times. Writing stays empty, because the w00f.org feed has no posts.

## Out of Scope (later sprints)

- The visual design, the two-tier home page, the View Transitions animation, and relative "2h ago" times: S1 and S3.
- MDX body rendering, case studies, Lab content, the resume, and `/feed.xml`: S4–S6. Until launch, `master` keeps serving the old feed.
- `link_enrichments` and Instapaper `og:image` scraping: S8, with the cards.
- Auth, the admin layer, and the source-health panel (with `last_error`): S7.
