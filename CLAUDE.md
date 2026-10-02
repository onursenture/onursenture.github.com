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
```

CI runs typecheck, lint, test, build, e2e, then a fixture build and `e2e:fixtures`. Finish with a plain `npm run build` so the local `.next` isn't left in fixture mode.

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
