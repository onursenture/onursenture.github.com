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
npm run db:generate    # drizzle-kit generate; db:migrate applies it (--force)
npm run screenshots -- <dir> <path>...  # 1440 + 390 (build first; Work is light, Life dark)
```

CI runs typecheck, lint, test, build, e2e, then a fixture build and `e2e:fixtures`, and uploads the Playwright traces when a run fails. Finish with a plain `npm run build` so the local `.next` isn't left in fixture mode.

## Environment

- `DATABASE_URL`: Neon Postgres. Unset means every source renders its empty state.
- `SYNC_SECRET`: bearer token for `POST /api/sync/`.
- `GH_PAT`: GitHub GraphQL token for the contributions source.
- `GOODREADS_USER_ID`: optional; the code has a default.
- `SOURCE_FIXTURES=1`: dev/CI only. Serves `tests/fixtures/` through the real parsers. Never set it on Vercel.

## Rules

- Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an API.
- `cacheComponents` is on: page data comes from `"use cache"` functions; pages never read `cookies()` / `headers()`.
- Two sides: Work (`app/(work)/`) and Life (`app/life/`, always dark via `data-side="life"`). The Life switch navigates between them; never link to a removed `/site/` or `/dashboard/` URL.
- `trailingSlash: true`: internal links and API URLs end with `/` (a POST doesn't survive the redirect).
- Faces to avoid: see the S1 spec's "Faces to avoid" list. Allowed: IBM Plex Mono, IBM Plex Sans, Doto.
- OG images are always JPEG with an absolute URL (via `metadataBase`). Pages without a real image omit `og:image`.
- Titles come from one format, `TITLE_TEMPLATE` / `fullTitle()` in `lib/metadata.ts`; build page metadata with `pageMetadata()`.
- English only.
- `primeicons` is pinned to exactly `7.0.0`, the last MIT release (the PrimeIcons product page renders it live). 8.x is under PrimeTek's commercial PrimeUI license (license key, no redistribution): never upgrade it, and keep it out of automated dependency bumps.

## Design system (Sprint 4)

- Tokens live in `app/globals.css` (`@theme static`): `--color-bg`, `fg`, `fg-muted`, `fg-soft`, `line`, `accent`, `danger`, `danger-bg`, each with a light value (the Work side) and a dark value (the Life side) (`tests/tokens.test.ts` pins them), plus `--radius-control`. Tailwind's default palette, text sizes, radii and shadows are cleared, so only token utilities exist (`bg-bg`, `text-fg-muted`, `border` = a `--color-line` rule, `rounded-control`). There is no `bg-white` or `text-white`: use a token or an arbitrary value (`text-[#fff]`).
- Type comes only from six classes: `type-name` (Doto), `type-lead` (Plex Sans 20), `type-body` (Plex Mono 13), `type-meta` (12), `type-label` (11) and `type-boot` (the Life readout, 14). Fonts are IBM Plex Mono, IBM Plex Sans and Doto, loaded with `next/font/google` in `app/layout.tsx`.
- Square corners except form controls (`rounded-control`). No shadows. Monochrome plus the one accent; `--color-danger` only for errors.
- The Work side is light only: there is no theme toggle, no theme cookie and no `prefers-color-scheme` rule, so it stays light whatever the OS prefers. The Life side (`[data-side="life"]`) is the one dark context and always uses the dark token column; the `dark:` Tailwind variant matches only inside `[data-side="life"]` (the media viewer sets that attribute on its `<dialog>`). The same attribute also lands on `<html>` (`SideSync`), so in e2e select the shell with `div[data-side="life"]` or use role locators.
- Dither Kit is vendored in `components/dither-kit/` (MIT; see its README for the local changes). Re-vendor with `npx tsx scripts/vendor-dither-kit.ts` and reapply those changes. `components/ui/` wrappers (`DitherStrip`, `DitherRule`, `FooterWash`, `PlaceholderWash`, `PrimaryButton`) read token colours with `useTokenColor`, so a canvas inside a Life subtree reads the dark values. Every canvas is decorative: its wrapper is `aria-hidden="true"` and meaning lives in adjacent text. Reduced motion disables the kit entrances, the typewriter and the Life switch transition.
- `PlaceholderWash` is the faint ink dither behind every image slot that has no image yet. Work images resolve through the manifest key `work/<slug>/<id>` (see "Work (product pages)"); `MediaFigure` shows the image when the manifest has it, otherwise the wash with a `FIG. NN · Caption` label.
- `SectionRow` (`components/ui/section-row.tsx`) is the grid row for every section: label, content (480px, or `wide`), action. The label is an `h2` by default; pass `labelAs="div"` when the content holds the page `h1` (home identity, the 404s). `SectionRow` renders no rule itself: pages put a `DitherRule` between rows (the home, `/life/`). On a `wide` row the action sits under the label from lg and after the content below lg.
- Glyphs: `→` internal links, `↗` external links (both added by `TextLink`, behind a non-breaking space so the arrow never orphans), `←` for "Previous", `●` ok, `○` empty, `◐` late or partial, `×` close, `├─` / `└─` in the experience tree. Never `★`, and no ratings are rendered anywhere (the parsers keep the rating fields in the data, nothing displays them); `grep -rn "★" app components lib` must stay empty. `ItemLink` (list and table rows) adds no arrow; the Lab rows add their own `↗`. Status glyphs go through `<StatusGlyph>`.
- The primary button's label is `#fff` on the light accent and the page's dark ink on Life (white on the dark accent is about 3:1).
- Primitives are in `components/ui/`. `/system/` is the Sprint 4 style tile (not in the nav, `noindex`): every token, type class, dither specimen and primitive, plus a Life palette block that proves the dark tokens and dither repaint inside a Life subtree on a light page. Each specimen has a `data-primitive` attribute; add new primitives there.
- The Work home (`components/home/home-site.tsx`) runs identity, Lab, Selected work, Experience, Contributions, with a `DitherRule` between rows. The bio is justified mono with no first-line indent. Lab is a single column of text rows (`title ↗ · year`, the description under it), no status glyph or avatar, new entries appended at the end; the row is hidden while `labIndex` is empty and `labIndex` holds only real projects, no placeholders. Contributions is "N contributions in the last 12 months" over `components/ui/heatmap.tsx`, coloured in five accent steps (the line colour, the accent mixed in at 25/50/75%, then the accent). The GitHub source has no Life section: `/life/` only reads it for the boot readout.
- `/life/` opens with the "Now" block on the same grid as the home rows (`ROW_GRID` in `components/ui/section-row.tsx`, shared so they cannot drift): the avatar in the 200px label column and the boot readout in the 480px content column, so its left edge matches the home bio. Each readout line is one visual line (`truncate`; the full text stays in the DOM). The reading line lists every book on the currently-reading shelf, comma-separated, with no link; the film line is the title only. No ratings render on Life (films show the year, the Read list shows title and author). Films, the Books Reading shelf and the `/life/` photo row share `COVER_GRID` (`components/ui/cover.tsx`: 4 columns on mobile, 10 from md, 96px `Cover`s, a `type-label` title and a muted year or author, each on one truncated line); `PhotoGrid` takes `density="compact"` for that row with `PHOTO_GRID_COMPACT_SIZES`, and `/life/photos/` keeps the default density. Books Reading maps every `currentlyReading` book (the source keeps up to 10).
- Shells are in `components/shell/` (`WorkShell`, `LifeShell`). Both headers are the same: the dot-matrix name with the Life switch right after it, in one left group, so the switch sits in the same place on both sides. The Work header adds the nav on the right only when an item in `lib/nav.ts` is `ready` (desktop `NavLinks`, below md a `MenuDialog` Menu button holding the same links); no item is ready yet, so today there is no nav and no Menu button. Flip `ready` when Lab or Resume ships. The product pages are reached from the home page (Selected work and Experience), not the header.
- The Life switch (`components/life-switch.tsx`) is a real link with `role="switch"`. A plain click runs `router.push` inside a React transition tagged `life-enter` or `life-exit` (`lib/side.ts`); `SideFade` (a `ViewTransition` named `side` in both shells) animates the pair, and every other navigation stays instant. It works across the two layouts only through `router.push`.
- Entering Life with the switch sets a boot flag (`components/life/boot-flag.ts`, `sessionStorage`) so the boot readout types itself in. The flag expires after 3s, so a stale one never types on a later direct load; a direct load always gets the final server HTML.
- Unknown URLs 404 inside the shell (`app/(work)/[...missing]`, `app/life/[...missing]`). `app/not-found.tsx` covers paths outside both layouts.
- After a client navigation, Next keeps the previous tree mounted but hidden. In e2e, prefer role locators (they skip hidden elements) or filter with `:visible`.
- Only confirmed facts go in `content/profile.ts`, `content/work/` and `content/lab-index.ts`. Contribution figures always name their period ("12 months").

## Work (product pages)

- Spec: `docs/superpowers/specs/2026-10-03-work-rethink-design.md` (it replaced Sprint 5's release-log case studies, posts, the `/work/` index, the Archive and the Figma export path).
- **Content and reads.**
  - Each product is one typed `ProductPage` in `content/work/<slug>.ts` (`types.ts`; registry `index.ts`: `productPages`): a header (`lead`, one-paragraph `intro`, `facts` Role / Years / At) and ordered `blocks`.
  - Blocks: `text` (heading + body paragraphs), `images` (optional heading, `columns` 1, 2 or 3, `images: WorkImage[]`) and `icons` (PrimeIcons only: the live set).
  - Pages read them only through `lib/work/` (`index.ts`: `getProductSlugs`, `getProductPage`, `getPins`). Sprint 7's admin overlay merges in there. `lib/work/derive.ts` builds the serialisable views: resolved images, FIG numbers (1-based, block order across the page), `pageImages`, pins.
  - `validateWork` (`lib/work/validate.ts`) checks: no duplicate page slug; kebab-case block and image ids, unique within a page; pin `order` unique across all pages; `columns` 1, 2 or 3; `icons` only on `primeicons`; a non-empty `intro`; at least one block; an explicit `image` key exists in the manifest; a credit `href` is https. `lib/work/index.ts` throws on any error at build time, and `tests/content/work.test.ts` runs it in CI.
  - Copy reuses confirmed facts only: no new claims, no numbers that aren't literally true.
- **Ids are permanent once published.** Block ids are the anchors Selected work links to (`#highlights`); image ids key `?fig=` URLs and image files.
- **Images.**
  - All 16:10. Onur delivers them at 2560×1600 into `images-src/work/<slug>/<image id>.(png|jpg)`; `npm run images` builds them. An image shows `image` (a manifest key) when set, otherwise `work/<slug>/<id>` when the manifest has it, otherwise the faint dither placeholder labelled `FIG. 01 · Caption`.
  - No work images are committed yet, so every slot is a placeholder and no product page has an `og:image`. The OG image is the first block image with a real image (JPEG).
- **Pins and Selected work.** A `WorkImage.pin` (`order`, a 2–4 word `title`, a one-line `note`) puts that image on the home's Selected work (`components/home/selected-work.tsx`): a wide `SectionRow` with no action, `grid gap-4 md:grid-cols-2 lg:grid-cols-3`, sorted by `order`. Each item is the 16:10 frame (placeholder label `FIG. <order> · <title>`), the title, the muted truncated note, and the source `TextLink` to `/work/<slug>/#<blockId>`. The frame links there too, with `aria-hidden` and `tabIndex={-1}`, so each item has one link for keyboard and screen-reader users. The row is hidden while there are no pins. Today each page pins the first image of its `highlights` block (orders 1–4: PrimeOne, PrimeBlocks, PrimeIcons, Templates).
- **Layout.** Everything is on `ROW_GRID`, with a `DitherRule` between rows (`components/work/blocks.tsx`, `product-header.tsx`):
  - Header: `← Home` in the label column; the `h1` lead, the intro and the facts list in the wide content.
  - `text`: heading in the label column, body in the 480px column (`type-body text-fg-soft`).
  - `images`: heading in the label column; the grid spans the wide content (`columns` from md; 3 is `md:grid-cols-2 lg:grid-cols-3`; always 1 below md). Each image is a button that opens the viewer, with the caption and the `Design: Name` credit under it in `type-meta`. The row's `id` is the block id. `imageGridSizes(columns)` gives the `sizes` (the wide content is `100vw - 308px` from lg; Selected work uses the 3-column value).
  - `icons`: the PrimeIcons grid (search, copy, licence line) in a wide row, server-rendered so the icons and the licence line are in the static HTML.
- **Query state and viewer.**
  - The only param is `?fig=<image id>` (`lib/work/url-state.ts`); `?view`, `?tag` and unknown ids are ignored. Never read `searchParams` in these pages: one HTML per path keeps the CDN cache.
  - `ProductBrowser` (client) wraps the server-rendered blocks. It renders `MediaViewer` inside its own `<Suspense fallback={null}>`, reads `?fig=` after hydration (`useViewState`, `useViewerHistory`) and hands `open` to the figure buttons through `OpenFigureContext`. So the static HTML is the whole page with no viewer, and the blocks (and the 313 icons) are rendered once.
  - `MediaViewer` is a native `<dialog>` with `data-side="life"` (dark): thumbnail strip, arrows, swipe, Esc. It steps through every image on the page in block order. Opening pushes `?fig=`, so Back closes it; stepping replaces it; focus returns to the opener.
- **Links.** No external links on `/work/**` except x.com/w00f status posts (there are none today). A credit's `href` is provenance and never rendered.
- **Credits.** Onur's role is a fact. `credits` on an image names colleagues who *designed* it (never developers), rendered as plain text.
- **Routes.** `/work/<slug>/` from the registry; unknown slugs 404 in the Work shell. `/work/` and `/work/archive/` redirect permanently to `/` (`next.config.ts`; the sources carry the trailing slash, and `/work` reaches them through Next's trailing-slash redirect).
- **PrimeIcons.** The icon count and version come from the pinned package, never written by hand.

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
- The Life avatar: Onur's illustration lives at `images-src/avatar.webp` (1254×1254). `npm run images` writes `public/images/avatar-192.webp` and `avatar-192.avif` (192×192, quality 80, the 2× rendition of 96px) and `lib/images/avatar.json` (`{ webp, avif, size }`, or `null` without a source), which `components/life/avatar.tsx` reads. It is decorative (`alt=""`) and full colour. Commit the outputs.
- Deleting a photo: remove its `content/photos/<slug>.mdx`, its `images-src/photos/` file, its renditions `public/images/photos/<slug>-*`, and the legacy `public/images/photos/<slug>.jpeg` and `.avif`, then run `npm run images`. Renditions are not pruned automatically.

## Tests

Vitest for `lib/` and section logic (`tests/`, fixtures in `tests/fixtures/`). Playwright smoke tests in `e2e/` run against a production build; `e2e-fixtures/` covers populated data.
