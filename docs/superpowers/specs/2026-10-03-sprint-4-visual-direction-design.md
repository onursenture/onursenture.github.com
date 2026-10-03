# Sprint 4: New Visual Direction, Work/Life Split — Design Spec

## Overview

Onur rejected the S1 look (pure monochrome Swiss index, Neue Haas Grotesk + Fragment Mono), calling it too sterile and without character. Sprint 4 replaces it with a new direction and reshapes the site around it.

The direction came out of three rounds of research on 2026-10-03:
- a Mobbin pass
- a full read of Onur's LinkedIn and X (@w00f)
- a study of 23 personal sites he likes (notes in `.superpowers/research/` of the main checkout; not in git)

He then picked a blend of four of those sites, led by alexcarpenter.me, with touches from scotthorsfall.com, edwin.computer and laurie.fyi. To that he added Dither Kit (tripwire.sh/dither-kit) as the texture used across the whole site.

Approved mockups (static HTML, open in a browser):
- `2026-10-03-sprint-4-mockups/dir1-dither.html`: the final direction (light, dark, Life)
- `2026-10-03-sprint-4-mockups/blend.html`: the blend round; option 1 is the one chosen

**This spec supersedes:**
- the S1 visual direction spec (`2026-10-02-s1-visual-direction-design.md`): tokens, type and the Figma style tile
- the parts of the S3 spec (`2026-10-03-s3-design-system-shell-design.md`) that are about the two views: the `[view]` routing, the dashboard shell, the view toggle and its transition

The S2 platform stays as it is: sources, sync, `readSource`, the database and `<Picture>`.

## Decisions

| Topic | Decision |
|---|---|
| Direction | **"Quiet system."** A three-column hairline grid: a label column, a narrow content column and an action column. Mono body text, a grotesk lead line, a bio with inline logos, experience as a file tree, live data, and a build-metadata footer. It must not read as a copy of alexcarpenter.me. Our own signatures (below) carry that. |
| Typeface | **IBM Plex Mono** for body, meta and UI. **IBM Plex Sans** (600) for lead lines and headings. **Doto** (900, dot-matrix) for the name and Life headings, in the language of Onur's X banner. All three come from `next/font/google`. The Adobe kit and Neue Haas are dropped, and with them the Creative Cloud dependency. |
| Accent | **One accent, ultramarine.** `#2F55F5` in light, `#6E8BFF` on dark. It is used for links in lists, the contribution chart, dither washes, the primary button and the Life toggle. `danger` stays for errors only. |
| Texture | **Dither Kit everywhere decoration is needed.** Ordered (Bayer 4×4) dither for the top strip, section rules, media placeholders, the primary button, Lab avatars, the contribution chart, the footer wash and the Life portrait. It is vendored into the repo (MIT). |
| Second view | **The site/dashboard view is removed.** In its place, Edwin's toggle becomes a **Life switch** that moves between two sides of the site with real URLs. The Work side is `/`, `/work/`, `/lab/` and `/resume/`. The Life side is `/life/` and everything under it. |
| Life look | **Always dark "terminal".** It ignores the theme preference. Switching to Life is a deliberate change of scene. |
| Signatures | Dot-matrix name; experience as a file tree (`├─ PrimeOne`); dither strip and rules in place of Alex's checkerboard; the Life boot readout; `w00f` touches. Konami code, `onur.md` and a colophon are planned but scheduled later (see Out of scope). |
| Placeholders | Every media slot that has no image yet renders a **labelled dither wash** ("FIG. 01 · PRIMEONE"). It is designed to look intentional, because it will be live for a while. The admin upload in Sprint 7 replaces it per slot. |

## 1. Information architecture and routing

**Two sides.**

| Side | Routes in Sprint 4 | Later |
|---|---|---|
| Work | `/` | `/work/`, `/work/<slug>/` (Sprint 5); `/lab/` (Sprint 6); `/resume/` (Sprint 8) |
| Life | `/life/`, `/life/photos/`, `/life/photos/<slug>/` | `/life/films/`, `/life/books/`, `/life/reading/`, `/life/theatre/` (Sprint 10) |

**Remove the view machinery.** Delete:
- the `app/[view]/` segment; pages move to plain `app/` routes
- the view cookie and `?view=` handling
- `lib/view/views.ts`, `lib/view/params.ts` and `lib/view/transition.ts`
- `ViewToggle`, `ViewHistoryGuard` and `ShellFade`
- the dashboard shell, `home-dashboard.tsx`, the `dashboard:` Tailwind variant
- the view half of `e2e/matrix.spec.ts`

Keep the theme cookie and the inline theme script. With one rendering per URL, `proxy.ts` has no job left. Remove it, unless the theme flow still needs it. If it stays, it must not send `private`/`no-cache`/`no-store`, as before. Recheck CDN caching on the preview with the S3 `curl` loop.

**Redirects (permanent, `next.config.ts`):**
- `/photos/` → `/life/photos/`
- `/photos/:slug/` → `/life/photos/:slug/`

A leftover `view` cookie is ignored.

**Dashboard-only content.**
- The home Overview metrics and panels are dropped.
- The source-health table stays on `/system/` (noindex, not in nav) until the admin page in Sprint 7.
- `sync-status` leaves the public Life page.

**Nav (`lib/nav.ts`).**
- Work side items: Work, Lab, Resume. Each keeps its `ready` flag.
- Notes moves to Sprint 9.
- Life is no longer a nav item; the switch reaches it.
- In Sprint 4 no Work-side item is ready yet, so the Work header shows only the name, the theme toggle and the Life switch.

## 2. Tokens, type, grid

**Colour.** Same mechanism as S3: `@theme static` in `app/globals.css`, redefined under `[data-theme="dark"]` and the no-JS `prefers-color-scheme` fallback. Values are neutral and very slightly warm, deliberately not Tailwind zinc. Final values may move by a step during the visual check, and `tests/tokens.test.ts` pins whatever is chosen.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#FAFAF8` | `#0B0B0C` | page |
| `--color-fg` | `#1F1F22` | `#EDEDED` | primary text |
| `--color-fg-muted` | `#6E6E73` | `#8A8A90` | meta, secondary |
| `--color-fg-soft` | `#52525A` | `#B4B4BA` | body paragraphs |
| `--color-line` | `#E6E6E1` | `#222225` | hairlines |
| `--color-accent` | `#2F55F5` | `#6E8BFF` | links in lists, charts, dither, primary button |
| `--color-danger` | as S3 | as S3 | errors only |

The Life side sets the dark values on its own root (`data-side="life"`), whatever the theme. That root is a full-viewport element with `color-scheme: dark`. The `<html>` background must not flash the light page colour around it, so the root layout also sets the background from the side.

**Type classes** replace the S3 set:
- `type-name` (Doto 900, 22px)
- `type-lead` (Plex Sans 600, 20/27, -0.01em; the muted continuation uses `text-fg-muted`)
- `type-body` (Plex Mono 13/21; justified with a 3ch first-line indent in bio paragraphs only)
- `type-meta` (Plex Mono 12/18)
- `type-label` (Plex Mono 11/16)
- `type-boot` (Plex Mono 14/24, Life readout)

Case-study display sizes arrive in Sprint 5. `body` keeps `tabular-nums`. The S1 "Faces to avoid" list still applies. Geist and Geist Mono stay banned even though alexcarpenter.me uses them.

**Grid.**
- At 1024px and up, each section is a row `[200px label] [minmax(0, 480px) content] [1fr action, right-aligned]` with 28px gaps and 40px side padding.
- Below 1024px, the label sits above the content and the action below it.
- Sections are separated by a full-bleed dither rule (§3), not a solid line.
- No shadows. Square corners except `--radius-control` (4px) on buttons, toggles and inputs.

**Glyphs.**
- The S3 glyph rules stay: `→` for links, `●`, `○`, `◐` and `×`, and never `★` (ratings are plain numbers).
- The S3 ban on `↗` is lifted for external links.
- Tree glyphs `├─` and `└─` are added for the experience tree.
- Plex covers all of these. The implementer must verify `↗`, `├`, `└` and `─` render in Plex and fall back only to a mono stack.

## 3. Dither Kit

**Install by vendoring, not the CLI.**
- The CLI needs a shadcn project (`components.json`), and v2 has none.
- Copy the registry items' files from `https://www.tripwire.sh/r/<item>.json` into `components/dither-kit/`. The items are `core`, `gradient`, `button`, `avatar` and `area-chart`.
- Add a header comment to each file with the source URL and the MIT notice. The repo's `package.json` declares MIT, but there is no LICENSE file, so record that in `components/dither-kit/README.md`.
- Add the npm dependencies the items declare: `motion`, `d3-scale`, `d3-shape`, `clsx` and `tailwind-merge`, plus `@types/d3-*`.
- Pie, radar and bar are not installed until something needs them.

**Colours.**
- Extend the kit's `PALETTE` with two seeds: `accent` and `ink`.
- Their RGB comes from the CSS tokens at paint time (`getComputedStyle`), so they follow the theme.
- Each canvas repaints when `data-theme` changes. A small `useThemeVersion()` hook observes the `<html>` attribute.
- Named kit colours (green, purple and the rest) are not used.

**Our components** (`components/ui/`, built on the kit):

| Component | Built on | Behaviour |
|---|---|---|
| `DitherStrip` | `DitherGradient` | 14px band at the very top of every page, `ink`, fading toward the centre. |
| `DitherRule` | `DitherGradient` | 4px section separator, `line` colour, low density. Full bleed. |
| `MediaPlaceholder` | `DitherGradient` | Fixed aspect ratio, 1px `line` border, `accent` or `ink` wash, and a mono label chip `FIG. NN · TITLE` at bottom left. Props: `label`, `index`, `ratio`, `tone`, optional `image`. When `image` is set, it renders `<Picture>` instead. That is the hook for Sprint 7 uploads. |
| `PrimaryButton` | `DitherButton` | Solid `accent` with a dither highlight on the top quarter; white label. Used for "Book a call". It renders only when `profile.bookingUrl` is set (Sprint 8), as in S3. |
| `LabAvatar` | `DitherAvatar` | 40px, seeded by the entry title. `accent` or `ink` picked by the hash. Used by Lab entries without an image. |
| `ContributionChart` | `AreaChart` | Weekly totals for the last 52 weeks from the existing `github` source (sum of each week's `days[].count`). `accent`, gradient variant, no axes, no legend, `interactive={false}`. The text above it names the period: "2,133 contributions in the last 12 months". The figure is the source's `total`. |
| `FooterWash` | `DitherGradient` | 120px `accent` wash rising from the bottom of the page under the footer text. |
| `DitherPortrait` | build-time | See §5. |

**Rules.**
- Every canvas is decorative: `aria-hidden="true"`, and meaning always lives in adjacent text.
- `prefers-reduced-motion: reduce` disables the kit's entrance animations (the kit already checks this) and our typewriter (§5).
- No canvas paints during server render. Each one mounts on the client inside a box with fixed dimensions, so there is no layout shift.

## 4. Work side

**Header.**
- Left: the name in `type-name`.
- Right: the theme toggle (Light / Dark / Auto, as S3) and the **Life switch**.
- Nav items appear between them once they are ready.
- Under 768px: name, then the Life switch, then "Menu". "Menu" opens the existing full-screen `<dialog>` with the nav and the theme toggle.

**Life switch.**
- A 40×22 switch (`role="switch"`, `aria-checked`), labelled "Life".
- Off on the Work side, on on the Life side.
- It is a link-like control: activating it navigates to `/life/` from the Work side and to `/` from the Life side. The Back button reverses it.
- Its knob uses `accent` when on.

**Home (`/`), in order:**
1. **Identity row.**
   - Label: name, "Designer who builds", and the live Ankara clock (existing `LiveClock`).
   - Content: the lead line, then two bio paragraphs with inline logos, then `PrimaryButton` once Sprint 8 sets a booking URL.
   - Action: "Open to work ●" while `profile.available` is true.
   - The final copy is Onur's. The mockup copy is a draft; only confirmed facts ship.
2. **Work row.** One `MediaPlaceholder` tile (2-up grid) for each of the first four entries in `content/work-index.ts` (Sprint 5 decides the final selection), each with a caption ("PrimeOne · design system"). Tiles link once Sprint 5 adds case studies. Action: "All work →" once `/work/` is ready.
3. **Experience row.** A file tree from a new `content/experience.ts`:
   - Orkestra Studios (Jun 2013–now, co-founder and designer)
     - └─ Nebuu
   - PrimeTek (May 2016–Apr 2026, design lead)
     - ├─ PrimeOne, ├─ PrimeBlocks, ├─ PrimeIcons
     - └─ Templates
   - Etiya (Apr 2014–Mar 2016, design specialist)

   These dates and roles are on Onur's LinkedIn. Product rows link to their case studies when those exist. Action: "Resume →" once `/resume/` is ready.
4. **Latest work row.** `ContributionChart` with its period line. Action: "GitHub ↗".
5. **Lab row.** Entries from `content/lab-index.ts` in a three-up grid: `LabAvatar`, title, description. The approved placeholders stay until real entries arrive. Action: "All lab →" once `/lab/` is ready.
6. **Footer.**
   - One mono line over `FooterWash`: `v<package version> · updated <build date> · <short commit SHA>` (from `VERCEL_GIT_COMMIT_SHA`, omitted locally), plus the social links.
   - The ±line counts in the mockup are dropped: they need an API call per build.
   - The `data-slot="paddle"` element stays for Sprint 11.

**Inline logos.**
- `content/logos/` holds small monochrome SVG marks: PrimeTek, Orkestra Studios, Etiya and Bilkent.
- Until Onur supplies or approves the marks, each renders as a 16px rounded monogram tile (`fg` on `bg`, inverted).
- An `<OrgMark org="primetek" />` component picks the SVG or the monogram.

## 5. Life side

**Shell.**
- Always dark (`data-side="life"`).
- Header: the name in `type-name` and the Life switch, on.
- No theme toggle. The footer is the same, with the wash in the dark accent.

**`/life/` boot readout.** One centred column, about 470px, in `type-boot`:

```
Local time: [10:42:17 GMT+3] Ankara
Booting w00f...
Human detected.

last watched: <film> <rating>
reading: <book>, <author>
saved: <article> · <site> · <minutes> min
last photo: <photo title>
writing: <latest w00f.org post>
commits, last 12 months: <total>

idle ▌
```

- Each line comes from the existing sources through `readSource`. A line whose source is empty is omitted, never faked.
- Values link to the item, or to its section below.
- The `DitherPortrait` sits beside the first block.
- `onur.md` is not linked until it exists (Sprint 8).

**Typewriter.**
- On a client navigation into `/life/`, the lines type in over about 1.5s, with a blinking block cursor at the end.
- On a direct load, the readout renders complete and static, so the server HTML is final and readable.
- Reduced motion: static, with no blinking cursor.

**Below the readout.**
- The existing sections (films, books, articles, writing, photos) as bands, restyled into the dark mono language.
- GitHub stays on the Work side: its total appears only as a readout line here.
- Each band has a label, its content and an "All →" action where one exists.
- `/life/photos/` and its detail pages move here with the same restyle. Photos themselves are not dithered: they are content, not decoration.

**`DitherPortrait`.**
- A 1-bit Bayer-dithered PNG generated at build time by the image script (`npm run images`) from `images-src/portrait.*`. It is light-on-dark at 2× density.
- Until Onur supplies a photo, it renders `LabAvatar` seeded with `"w00f"`.

**Switch transition.**
- Toggling triggers a navigation with a React `<ViewTransition>` of type `life-switch`.
- Work → Life: the old page dims to black (250ms), then the Life page appears and its readout types in.
- Life → Work: a 200ms cross-fade.
- Reduced motion: an instant swap.
- This reuses the S3 spike's finding that `addTransitionType` plus `startTransition` works on Next 16.3.8. Here it wraps `router.push`, not `router.refresh`.

## 6. Other pages

- **404:** a Work-side shell with a short mono message.
- **`/system/`:** restyled. It shows every primitive, the type classes, the dither components in both themes and the Life palette. It stays `noindex`, keeps the source-health table, and is the review surface for this sprint.

## 7. Carried over and closed

From `2026-10-03-s3-followups.md`:
- **S4 items:**
  - `TextLink`'s `→` must not orphan (use an nbsp); fix the overclaiming test name.
  - The photo detail "Previous" glyph: `←` is now allowed (Plex has it), so "← Previous / Next →".
  - Deduplicate the title format between `pageMetadata` and `title.template`.
  - The `PageHeader` site-branch test is moot because `PageHeader` loses its view branch.
- **Closed by removing the dashboard view:**
  - the scrolled dashboard→site slide (Onur's "scroll to top first" choice no longer applies)
  - cross-tab stale view
  - the `ViewHistoryGuard` private-API risk
  - the dashboard density items under S7
- **Still open:** the S6 items about DataTable at 390px, the ThemeToggle hydration flash, 404 titles, menu dialog tests and CSP. They move to Sprint 8 (launch).

**Roadmap update.** Rewrite the foundation spec's roadmap table with "Sprint N" naming and the order approved on 2026-10-03:

| Sprint | Contents |
|---|---|
| Sprint 4 | This spec |
| Sprint 5 | Work I: PrimeTek, with placeholder media |
| Sprint 6 | Work II: Orkestra and Lab |
| Sprint 7 | Admin: GitHub auth, media upload into placeholder slots, simple page editing |
| Sprint 8 | Resume, Book a call, launch |
| Sprint 9 | Notes |
| Sprint 10 | Personal layer and Life sub-pages |
| Sprint 11 | Polish: changelog, paddle effect, Konami easter egg, performance and accessibility |

Update `CLAUDE.md`'s design-system section to match this spec.

## Testing and review

**Unit (Vitest):**
- tokens test for the new values
- weekly aggregation for `ContributionChart` (52 buckets, sums, the total line uses `total`)
- boot-readout line builder (omits empty sources, formats ratings without stars)
- `OrgMark` fallback
- `MediaPlaceholder` renders `<Picture>` when `image` is set

**E2E (Playwright):**
- `/` and `/life/` render in both themes, and `/life/` is dark under the light theme
- the Life switch navigates both ways and Back returns
- `/photos/` and `/photos/<slug>/` redirect with 308
- no URL serves two different shells
- every `canvas` is `aria-hidden`
- reduced motion shows the readout complete with no typing
- the fixtures build covers populated data

**Visual checks (never skipped):**
- `npm run screenshots` at 1440 and 390, both themes, `/`, `/life/`, `/life/photos/` and `/system/`
- freeze-frame the Life switch mid-transition and the typewriter mid-line
- compare against `2026-10-03-sprint-4-mockups/dir1-dither.html`
- check every dither canvas for no layout shift and correct repaint after a theme toggle

**CDN check on the preview:** the S3 `curl` loop, so pages are still `HIT` after `proxy.ts` is removed or reduced.

## Out of scope

- Case studies and the `/work/` index (Sprint 5)
- `/lab/` (Sprint 6)
- Admin and uploads (Sprint 7). Sprint 4 only adds the `image` hook on `MediaPlaceholder`.
- Resume, `onur.md`, `llms.txt`, booking and the colophon page (Sprint 8)
- Life sub-pages for films, books, reading and theatre (Sprint 10)
- Konami code and the X-banner footer art (Sprint 11)
- A Figma update of the style tile. `/system/` is the style tile from now on.
