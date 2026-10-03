@AGENTS.md

# CLAUDE.md

onursenture.com v2: Next.js 16 on Vercel, Postgres (Neon) via Drizzle. Branch `v2` replaces the Eleventy site on `master` at launch.

- Foundation spec: `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md`
- S1 visual direction (typography, color, density, faces to avoid): `docs/superpowers/specs/2026-10-02-s1-visual-direction-design.md`
- Plans: `docs/superpowers/plans/`

## Commands

```bash
npm run dev            # next dev
npm run dev:fixtures   # dev with recorded source data, no database
npm run build          # migrate (Vercel production only), then next build
npm run typecheck | lint | test
npm run e2e            # Playwright on port 3217; run `npm run build` first
npm run e2e:fixtures   # port 3219; run `SOURCE_FIXTURES=1 npm run build` first
npm run images         # optimize images-src/ into public/images/ + manifest
npm run db:generate    # drizzle-kit generate; db:migrate applies it (--force)
npm run screenshots -- <dir> <path>...  # 1440 + 390, both views, both themes (build first)
```

CI runs typecheck, lint, test, build, e2e, then a fixture build and `e2e:fixtures`, and uploads the Playwright traces when a run fails. Finish with a plain `npm run build` so the local `.next` isn't left in fixture mode.

## Environment

- `DATABASE_URL`: Neon Postgres. Unset means every source renders its empty state.
- `SYNC_SECRET`: bearer token for `POST /api/sync/`.
- `GH_PAT`: GitHub GraphQL token for the contributions source.
- `GOODREADS_USER_ID`: optional; the code has a default.
- `SOURCE_FIXTURES=1`: dev/CI only. Serves `tests/fixtures/` through the real parsers. Never set it on Vercel.

## Rules

- Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an API. `proxy.ts` replaces middleware.
- `cacheComponents` is on: page data comes from `"use cache"` functions; pages never read `cookies()` / `headers()`.
- Every public page lives under `app/[view]/` and is prerendered for `site` and `dashboard`; `proxy.ts` picks one from the cookie. Never link to `/site/...` or `/dashboard/...`. Branch on the `view` route param (layouts and sections) — never on the cookie. `dashboard:` Tailwind variants are fine for density tweaks.
- `trailingSlash: true`: internal links and API URLs end with `/` (a POST doesn't survive the redirect).
- Paths containing a dot bypass the proxy (it treats them as files), so keep slugs dot-free.
- Don't put a caching proxy or CDN in front of Vercel: responses vary by cookie without a `Vary: Cookie` header.
- Faces to avoid: see the S1 spec's "Faces to avoid" list.
- OG images are always JPEG with an absolute URL (via `metadataBase`). Pages without a real image omit `og:image`.
- English only.

## Design system (S3)

- Tokens live in `app/globals.css` (`@theme static`), named exactly as the Figma variables (`--color-bg`, `--color-fg-muted`, `--radius-control`, …). `tests/tokens.test.ts` pins them to the S1 values. Tailwind's default palette, text sizes, radii and shadows are cleared, so only token utilities exist: `bg-bg`, `text-fg-muted`, `border` (a `--color-line` rule), `rounded-control`.
- Type comes only from the `type-*` classes: one per Figma text style (`type-display-{96,64,40}`, `type-sans-{28,20,16,14,13}` plus `-medium`, `type-mono-{13,12,11}`), plus `type-display-160` from the S1 spec.
- Square corners except form controls (`rounded-control`). No shadows. Monochrome; `--color-danger` only for errors.
- No icons. Glyphs only: `→` (every link, internal or external; never `↗`), `●` ok, `○` empty, `◐` late or partial, `×` close. Status glyphs go through `<StatusGlyph>`.
- Primitives are in `components/ui/`. `/system/` renders all of them (not in the nav, `noindex`); check it in both views and themes after UI changes.
- Shells are in `components/shell/`. The nav comes from `lib/nav.ts`: flip `ready` when a section ships.
- The view switch cross-fades the whole page through React `<ViewTransition>` (`ShellFade`: each shell's outer element shares the name `shell`) and the `view-switch` transition type that `ViewToggle` adds; reduced motion skips it.
- Every proxied response is sent with `Cache-Control: private, no-cache` (`proxy.ts`). The two views share URLs, and Next keys its cached payloads only on its router headers, so without it Chrome serves the other view's prefetch after a toggle and the next link click mixes the two shells (`e2e/matrix.spec.ts`, round trip).
- Back/forward to a history entry rendered in the other view must not use Next's restore (it hangs on the stale cache); `ViewHistoryGuard` navigates to the URL instead. It reads Next's private `history.state`, so recheck the back/forward tests in `e2e/matrix.spec.ts` after a Next upgrade.
- Unknown URLs 404 inside the shell (`app/[view]/[...missing]`). Under Cache Components these 404s are served as an error shell that React renders on the client, so the inline theme script never runs there; `ThemeToggle` re-applies the cookie, and `ThemeSync` does the same on the root 404 (`app/not-found.tsx`).
- After a client navigation or a view switch, Next keeps the previous tree mounted but hidden. In e2e, prefer role locators (they skip hidden elements) or filter with `:visible`.
- Optional index columns (`years`, `role` in the work index, `year` in the Lab index) are not rendered at all while no entry has a value (`visibleColumns` in `lib/index-columns.ts`, used by `IndexList`, `workColumns` and `LabPanel`); they return on their own once an entry gets one.
- Ratings are plain numbers in mono (`formatRating` in `lib/sources/rating.ts`: `3.5`, `4`, unrated shows nothing). Never stars: neither face has `★`. `grep -rn "★" app components lib` must stay empty.
- Dashboard panel spans start at `xl` (1280px); below it panels stack full width, because the 240px sidebar leaves 4- and 6-column panels too narrow. Contribution figures always name their period ("12 mo").
- Only confirmed facts go in `content/profile.ts`, `content/work-index.ts` and `content/lab-index.ts`.

## Sources and sync

- A source lives in `lib/sources/<id>.ts`: a zod schema plus a `fetch` that **throws** on any failure, so the previous snapshot is kept. Never fetch upstream during render.
- `readSource(id)` is the only page-side read: `"use cache"` with one tag, `sourceTag(id)`. Sync revalidates that tag with `"max"`. A database error caches for minutes, anything else for hours.
- An empty upstream result never overwrites a good snapshot; it is recorded as a failure.
- Adding a source: add the id to `SOURCE_IDS`; write the module (a throwing `fetch` plus a zod schema); register it in `lib/sources/registry.ts` (the key must match the module's `id`); add a fixture in `tests/fixtures/` with a parser test and a loader in `lib/sources/fixtures.ts`; add a section under `components/sections/<id>/` and list it in `components/sections/life.ts`.
- Syncing: `curl -X POST -H "Authorization: Bearer $SYNC_SECRET" "$SITE_URL/api/sync/?force=1"` (trailing slash; without `?force=1` only due sources run). One source: `/api/sync/<id>/`. The hourly workflow `.github/workflows/sync.yml` lives on `master`, because GitHub only runs schedules from the default branch.

## Database

- Edit `lib/db/schema.ts`, run `npm run db:generate`, commit `drizzle/`.
- Migrations auto-run only on Vercel production builds. Preview deployments share the production database, so schema changes must be expand/contract: add first, remove in a later deploy.

## Images

- Put sources in `images-src/`, run `npm run images`, commit the outputs and `lib/images/manifest.json`, and render with `<Picture image="dir/name" />`.
- Deleting a photo: remove its `content/photos/<slug>.mdx`, its `images-src/photos/` file, its renditions `public/images/photos/<slug>-*`, and the legacy `public/images/photos/<slug>.jpeg` and `.avif`, then run `npm run images`. Renditions are not pruned automatically.

## Tests

Vitest for `lib/` and section logic (`tests/`, fixtures in `tests/fixtures/`). Playwright smoke tests in `e2e/` run against a production build; `e2e-fixtures/` covers populated data.
