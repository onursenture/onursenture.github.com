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
