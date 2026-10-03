@AGENTS.md

# CLAUDE.md

onursenture.com v2: Next.js 16 on Vercel, Postgres (Neon) via Drizzle. A professional-first personal site in two sides: Work (the home, and later work, Lab and resume pages) and Life (films, books, photos and the rest). Branch `v2` replaces the Eleventy site on `master` at launch.

- Foundation spec (mechanics, sprint roadmap): `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md`
- Sprint 4 visual direction (tokens, type, grid, Dither Kit, Work and Life sides): `docs/superpowers/specs/2026-10-03-sprint-4-visual-direction-design.md`
- S1 visual direction (only the "Faces to avoid" list still binds): `docs/superpowers/specs/2026-10-02-s1-visual-direction-design.md`
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
npm run figma          # export the Figma frames in figma.local.json (needs FIGMA_TOKEN in .env.local), then npm run images
npm run db:generate    # drizzle-kit generate; db:migrate applies it (--force)
npm run screenshots -- <dir> <path>...  # 1440 + 390, both themes (build first)
```

CI runs typecheck, lint, test, build, e2e, then a fixture build and `e2e:fixtures`, and uploads the Playwright traces when a run fails. Finish with a plain `npm run build` so the local `.next` isn't left in fixture mode.

## Environment

- `DATABASE_URL`: Neon Postgres. Unset means every source renders its empty state.
- `SYNC_SECRET`: bearer token for `POST /api/sync/`.
- `GH_PAT`: GitHub GraphQL token for the contributions source.
- `GOODREADS_USER_ID`: optional; the code has a default.
- `SOURCE_FIXTURES=1`: dev/CI only. Serves `tests/fixtures/` through the real parsers. Never set it on Vercel.
- `FIGMA_TOKEN`: local only (`.env.local`), for `npm run figma`. A Figma personal access token with `file_content:read`. Never set it on Vercel or in CI.
- `figma.local.json` (repo root, gitignored): the frames `npm run figma` exports, `{ "frames": { "work/<slug>/<media id>": { "fileKey", "nodeId" } } }`. Copy `figma.example.json`. `figma.lock.local.json` (also gitignored) is its export lock.

## Rules

- Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an API.
- `cacheComponents` is on: page data comes from `"use cache"` functions; pages never read `cookies()` / `headers()`.
- Two sides: Work (`app/(work)/`) and Life (`app/life/`, always dark via `data-side="life"`). The Life switch navigates between them; never link to a removed `/site/` or `/dashboard/` URL.
- `trailingSlash: true`: internal links and API URLs end with `/` (a POST doesn't survive the redirect).
- Faces to avoid: see the S1 spec's "Faces to avoid" list. Allowed: IBM Plex Mono, IBM Plex Sans, Doto.
- OG images are always JPEG with an absolute URL (via `metadataBase`). Pages without a real image omit `og:image`.
- Titles come from one format, `TITLE_TEMPLATE` / `fullTitle()` in `lib/metadata.ts`; build page metadata with `pageMetadata()`.
- English only.
- `primeicons` is pinned to exactly `7.0.0`, the last MIT release (the PrimeIcons case study renders it live). 8.x is under PrimeTek's commercial PrimeUI license (license key, no redistribution): never upgrade it, and keep it out of automated dependency bumps.

## Design system (Sprint 4)

- Tokens live in `app/globals.css` (`@theme static`): `--color-bg`, `fg`, `fg-muted`, `fg-soft`, `line`, `accent`, `danger`, `danger-bg`, each with a light and a dark value (`tests/tokens.test.ts` pins them), plus `--radius-control`. Tailwind's default palette, text sizes, radii and shadows are cleared, so only token utilities exist (`bg-bg`, `text-fg-muted`, `border` = a `--color-line` rule, `rounded-control`). There is no `bg-white` or `text-white`: use a token or an arbitrary value (`text-[#fff]`).
- Type comes only from six classes: `type-name` (Doto), `type-lead` (Plex Sans 20), `type-body` (Plex Mono 13), `type-meta` (12), `type-label` (11) and `type-boot` (the Life readout, 14). Fonts are IBM Plex Mono, IBM Plex Sans and Doto, loaded with `next/font/google` in `app/layout.tsx`.
- Square corners except form controls (`rounded-control`). No shadows. Monochrome plus the one accent; `--color-danger` only for errors.
- The Life side (`[data-side="life"]`) always uses the dark token column, whatever the theme. The same attribute also lands on `<html>` (`SideSync`), so in e2e select the shell with `div[data-side="life"]` or use role locators. There is no theme toggle on Life.
- Dither Kit is vendored in `components/dither-kit/` (MIT; see its README for the local changes). Re-vendor with `npx tsx scripts/vendor-dither-kit.ts` and reapply those changes. `components/ui/` wrappers (`DitherStrip`, `DitherRule`, `FooterWash`, `MediaPlaceholder`, `PrimaryButton`, `LabAvatar`, `ContributionChart`) read token colours with `useTokenColor`, so canvases repaint when the theme changes and inside a Life subtree. Every canvas is decorative: its wrapper is `aria-hidden="true"` and meaning lives in adjacent text. Reduced motion disables the kit entrances, the typewriter and the Life switch transition.
- `MediaPlaceholder` renders a dither wash with a `FIG. NN · TITLE` caption. Its `image` prop swaps in a `<Picture>`: that is the hook for Sprint 7 uploads.
- `SectionRow` (`components/ui/section-row.tsx`) is the grid row for every section: label, content (480px, or `wide`), action. The label is an `h2` by default; pass `labelAs="div"` when the content holds the page `h1` (home identity, the 404s). `SectionRow` renders no rule itself: pages put a `DitherRule` between rows (the home, `/life/`). On a `wide` row the action sits under the label from lg and after the content below lg.
- Glyphs: `→` internal links, `↗` external links (both added by `TextLink`, behind a non-breaking space so the arrow never orphans), `←` for "Previous", `●` ok, `○` empty, `◐` late or partial, `×` close, `├─` / `└─` in the experience tree. Never `★`: ratings are plain numbers in mono (`formatRating`), and `grep -rn "★" app components lib` must stay empty. `ItemLink` (list and table rows) adds no arrow; the Lab grid adds its own `↗`. Status glyphs go through `<StatusGlyph>`.
- The primary button's label is `#fff` on the light accent and the page's dark ink in dark mode and on Life (white on the dark accent is about 3:1).
- Primitives are in `components/ui/`. `/system/` is the Sprint 4 style tile (not in the nav, `noindex`): every token, type class, dither specimen and primitive, plus a Life palette block that proves the dark tokens and dither repaint inside a Life subtree on a light page. Each specimen has a `data-primitive` attribute; add new primitives there and check it in both themes after UI changes.
- Shells are in `components/shell/` (`WorkShell`, `LifeShell`). The nav comes from `lib/nav.ts`: flip `ready` when a section ships.
- The Life switch (`components/life-switch.tsx`) is a real link with `role="switch"`. A plain click runs `router.push` inside a React transition tagged `life-enter` or `life-exit` (`lib/side.ts`); `SideFade` (a `ViewTransition` named `side` in both shells) animates the pair, and every other navigation stays instant. It works across the two layouts only through `router.push`.
- Entering Life with the switch sets a boot flag (`components/life/boot-flag.ts`, `sessionStorage`) so the boot readout types itself in. The flag expires after 3s, so a stale one never types on a later direct load; a direct load always gets the final server HTML.
- Unknown URLs 404 inside the shell (`app/(work)/[...missing]`, `app/life/[...missing]`). Under Cache Components these 404s are served as an error shell that React renders on the client, so the inline theme script never runs there; `ThemeToggle` re-applies the cookie, and `ThemeSync` does the same on the root 404 (`app/not-found.tsx`, for paths outside both layouts).
- After a client navigation, Next keeps the previous tree mounted but hidden. In e2e, prefer role locators (they skip hidden elements) or filter with `:visible`.
- Only confirmed facts go in `content/profile.ts`, `content/work-index.ts` and `content/lab-index.ts`. Contribution figures always name their period ("12 months").

## Work (Sprint 5)

- Spec: `docs/superpowers/specs/2026-10-03-sprint-5-work-primetek-design.md`.
- **Content and reads.**
  - Case studies are typed data in `content/work/` (`types.ts`; registry `index.ts`: `caseStudies`, `archive`).
  - Pages read them only through `lib/work/` (`index.ts`). Sprint 7's admin overlay merges in there.
  - `lib/work/derive.ts` builds serialisable views: FIG labels, year groups, chips, credits and resolved images.
  - `tests/content/work.test.ts` runs `validateWork` on the registry.
- **Ids are permanent once published.** They key `?fig=` URLs and image files.
- **Images.**
  - A media slot shows `image` when set, otherwise `work/<slug>/<media id>` when the manifest has it, otherwise the dither placeholder.
  - FIG numbers count from the oldest entry (02 upwards; the hero is 01), so new entries don't renumber.
  - No work images are committed yet: Onur prepares them (the auto-exported Figma frames were removed after PR #27 review), so every slot is a placeholder until they land in `images-src/work/<slug>/<media id>.png`.
- **Layout.** The hero sits in the content column (480px, 16/10) on the section grid. The Log shows every media item of a release as an equal grid in the media column (1 item single, 2 items 2 columns, 3+ items 2 columns from md and 3 from xl); there is no "+N in Grid" link.
- **View state.**
  - It lives in the query (`?view`, `?tag`, `?density`, `?fig`; `lib/work/url-state.ts`).
  - The server always renders the default Log as a `<Suspense>` fallback, and `StudyBrowser` (`useSearchParams`) applies the query after hydration. Never read `searchParams` in these pages: one HTML per path keeps the CDN cache.
- **Viewer.**
  - `MediaViewer` is a native `<dialog>` in the Life palette.
  - Opening pushes `?fig=`, so Back closes it; stepping replaces it.
- **Posts.** A fourth view (`?view=posts`), shown only when a case study has `posts`. Data lives in `content/work/posts/<slug>.ts` (`Post`: date, account, status id, `entryId`); the URL is derived. Summaries are our own one-liners, never PrimeTek's text (Onur's @w00f posts may quote him). The chips filter by entry (`?tag=<entry id>`); verify every id against `.superpowers/research/`.
- **Credits.** Onur's role is a case-study fact. `credits` on an entry or a media item names colleagues, and Templates uses media-level credits for pages others designed.
- **Numbers.** Coverage (Templates) and the icon count (PrimeIcons) are computed, never written by hand.
- **Filling media from Figma.** Figma refs stay out of the public repo: no content file sets `figma` (the `Media.figma` type remains for `figmaLinks`, should it ever be turned on with committed refs).
  1. List each frame in the gitignored `figma.local.json` at the repo root, keyed by the slot's manifest key: `"work/<slug>/<media id>": { "fileKey": "...", "nodeId": "12:345" }` (the URL's `node-id=12-345` works too). `figma.example.json` shows the shape.
  2. Run `npm run figma`. It writes `images-src/work/<slug>/<id>.png`, records its export lock in the gitignored `figma.lock.local.json` (skipping frames whose file hasn't changed), and runs `npm run images`. A slot with a hand-set `image` is skipped.
  3. Commit the PNGs, the renditions and `lib/images/manifest.json`; never the two local Figma files.

  Some sources were hand-processed (cropped tall pages, JPEG for large frames). Remove their entries from `figma.local.json`, or re-crop afterwards, before running `npm run figma`: a refresh writes an uncropped PNG next to them.

  `embed: true` (on a `figma` ref) adds the click-to-load embed in the viewer; it only applies if refs are ever committed and `figmaLinks` is on.
- **Figma switch.** `workSettings.figmaLinks` (`content/work/settings.ts`) is **off by default**: PrimeTek may not want its files linked. Off, `getStudyView` / `getArchiveView` null every `figma` ref, so no "Open in Figma ↗", no embed control and no `fileKey`/`nodeId` in the HTML or RSC payload.

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
- The Life portrait: put a photo at `images-src/portrait.jpg` (or `.jpeg` / `.png`) and run `npm run images`. It writes `public/images/portrait-dither.png` (a 1-bit dither, 96×120 cells at 2×) and `lib/images/portrait.json`, which `DitherPortrait` reads. Without a source `DitherPortrait` falls back to a framed `LabAvatar` dither avatar seeded "w00f".
- Deleting a photo: remove its `content/photos/<slug>.mdx`, its `images-src/photos/` file, its renditions `public/images/photos/<slug>-*`, and the legacy `public/images/photos/<slug>.jpeg` and `.avif`, then run `npm run images`. Renditions are not pruned automatically.

## Tests

Vitest for `lib/` and section logic (`tests/`, fixtures in `tests/fixtures/`). Playwright smoke tests in `e2e/` run against a production build; `e2e-fixtures/` covers populated data.
