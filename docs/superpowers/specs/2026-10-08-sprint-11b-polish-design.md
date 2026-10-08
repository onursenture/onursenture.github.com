# Sprint 11b: Polish — Design Spec

## Overview

Sprint 11b is the last sprint before the launch (Sprint 12). It adds three small public surfaces that tell the site's own story (a changelog, a colophon, and an agent-readable profile with `llms.txt`) and makes one accessibility and performance pass over the site, with an automated guard so the result holds.

The decisions come from a brainstorm with Onur on 2026-10-08, held in Turkish. The mockups are in `2026-10-08-sprint-11b-mockups/`; both show options that were dropped.

| Mockup | Outcome |
|---|---|
| `paddle-glyph.html` | Rejected: a spinning paddle glyph in three drawings. |
| `paddle-rally.html` | Rejected: a paddle and ball rally on the footer hairline in three forms. Onur then dropped the paddle. |

## Decisions

| Topic | Decision |
|---|---|
| Scope | Changelog, colophon, `onur.md` + `llms.txt`, and a performance and accessibility pass. |
| Dropped | **The Konami easter egg** and **the paddle effect**. The footer's empty `data-slot="paddle"` is removed. Neither is scheduled later. |
| Changelog source | **Hand-written in the repo**, as a typed list. Not generated from git, not edited in the admin. |
| Changelog depth | Detailed entries for v2. One short "Earlier" row lists the eras, with dates taken from git. |
| Versions | **Numbered.** Each era is a major version (v0 Jekyll, v1 Eleventy, v2 Next). Each v2 sprint merge is a minor version, and a follow-up fix is a patch. `package.json`'s version equals the newest entry, enforced by a test. The footer's version links to its entry. |
| Pages | `/changelog/` and `/colophon/` are **two pages**, both on the Work side, linked from the footer and from each other. |
| `onur.md` | **Hybrid:** a short intro Onur approves, then sections generated from the site's published content. `llms.txt` is generated from the same data. |
| Email | **Not in `onur.md`.** Contact goes through the booking links, the social links and `/resume/`, where the address stays obfuscated. |
| Accessibility target | WCAG 2.2 AA. |
| A11y scope | Public pages fully. The admin gets keyboard, focus and form-label fixes only (Onur is its only user). |
| Guard | A Playwright + axe e2e over every public route, on both sides (Work is always light, Life always dark), in CI. No Lighthouse budget in CI. |
| Copy | Claude drafts the changelog entries, the colophon text and the `onur.md` intro. Onur approves them on production, as with Notes and the resume. |

## 1. Changelog

### 1.1 Data: `content/changelog.ts`

```ts
export interface Release {
  version: string;   // "2.8.1": major.minor.patch
  date: string;      // YYYY-MM-DD, the merge date into v2
  title: string;     // one line, sentence case
  items: string[];   // 1–5 plain-sentence bullets
}

export interface Era {
  major: number;     // 0, 1, 2
  name: string;      // "Jekyll", "Eleventy", "Next.js"
  from: string;      // YYYY-MM-DD
  to: string | null; // null for the current era
  summary: string;   // one sentence
}

export const releases: Release[];  // newest first
export const eras: Era[];          // newest first
```

`lib/changelog.ts` holds the pure helpers: `anchorOf(version)` (`"2.8.1"` → `"v2-8-1"`), `compareVersions`, and `latestRelease()`.

### 1.2 Rules (unit-tested)

- Versions are valid `major.minor.patch`, unique and strictly descending.
- Dates are valid and non-increasing in list order.
- Every v2 release's major is 2. Eras are contiguous: each era's `to` equals the next newer era's `from`.
- `package.json`'s `version` equals `releases[0].version`. A sprint that ships without an entry fails CI.
- Each release has 1–5 items, and no item is empty.

### 1.3 Initial releases

The dates are the merge commits on `v2`.

| Version | Date | Title |
|---|---|---|
| 2.9.0 | the Sprint 11b merge day | Changelog, colophon and onur.md; an accessibility pass |
| 2.8.1 | 2026-10-07 | In-page admin confirmations |
| 2.8.0 | 2026-10-05 | Photos in the admin |
| 2.7.0 | 2026-10-05 | Life archives |
| 2.6.0 | 2026-10-05 | Notes |
| 2.5.0 | 2026-10-04 | Resume and Book a call |
| 2.4.1 | 2026-10-04 | Admin follow-ups: readable issues, pin notes, manual draft save |
| 2.4.0 | 2026-10-04 | Admin |
| 2.3.0 | 2026-10-04 | Orkestra and two PrimeTek pages |
| 2.2.0 | 2026-10-03 | Product pages and the polish rounds |
| 2.1.0 | 2026-10-03 | New visual direction and the Work/Life split |
| 2.0.0 | 2026-10-03 | Next.js platform and design system |

The items are drafted from each sprint's spec and merge commit, in plain language for a visitor (what changed on the site, not how). Sprint 12 decides whether the launch is 3.0.0 or 2.10.0.

### 1.4 Eras

| Era | From | To | Source |
|---|---|---|---|
| v2 · Next.js | 2026-10-02 | — | `5801201 Replace Eleventy with a Next.js 16 scaffold on v2` |
| v1 · Eleventy | 2026-02-18 | 2026-10-02 | `bb871c6 Migrate from Jekyll to Eleventy with live data widgets` |
| v0 · Jekyll | 2011-12-30 | 2026-02-18 | `version 0.0.1`, the first commit |

### 1.5 Page: `/changelog/`

- Work side, `PageHeader` "Changelog" with a one-line lede.
- One `SectionRow` per release, with `id={anchorOf(version)}`:
  - the label is `v2.8.1`, with the formatted date below it in `type-meta`;
  - the content is the title, then the items as a list.
- A final "Earlier" row lists the eras, one line each: `v1 · Eleventy · 2026`, `v0 · Jekyll · 2011–2026`, with the summary.
- The page links to `/colophon/`.
- Static and prerendered. The metadata uses `pageMetadata("Changelog", …)`.
- It isn't in the header nav, the sitemap (there is none) or `/feed.xml`.

### 1.6 Version in `package.json`

`package.json` moves from `2.0.0` to `2.9.0` in this sprint. `buildLine()` keeps reading it through `NEXT_PUBLIC_BUILD_VERSION`.

## 2. Colophon

### 2.1 Data: `content/colophon.ts`

Hand-written sections, each `{ label, body }`, where `body` is a list of paragraphs or link lines. The draft:

| Label | Content |
|---|---|
| Built | Designed and built by Onur, with Claude Code. |
| Stack | Next.js, React, Tailwind CSS, Drizzle with Neon Postgres, Vercel (hosting and Blob storage), GitHub OAuth for the admin, react-pdf for the resume PDF. |
| Type | IBM Plex Mono, IBM Plex Sans, Doto. |
| Texture | Dither Kit by Tripwire (MIT), with a link. The vendored kit's README is the attribution source. |
| Data | Letterboxd, Goodreads, Instapaper, GitHub, tiyatrolar.com.tr, w00f.org and cal.com, each linked; notes cross-post to Bluesky. Sources sync hourly (`sync.yml`, minute 17). |
| Source | The GitHub repository (public). |
| Agent | `onur.md` and `llms.txt`, each linked, for AI agents reading the site. |
| History | Running since 2011, with a link to `/changelog/`. |

### 2.2 Versions from `package.json`

The Stack row shows each library's major version (for example "Next.js 16"), read at build from the root `package.json` `dependencies` by `lib/colophon.ts`. A package that's missing from `package.json` is left out rather than shown without a version, so the row can't go stale or lie.

### 2.3 Page: `/colophon/`

- Work side, `PageHeader` "Colophon", one `SectionRow` per section.
- Static and prerendered, with `pageMetadata("Colophon", …)`.

## 3. `onur.md` and `llms.txt`

### 3.1 `/onur.md`

- A route handler (`app/onur.md/route.ts`) that returns `text/markdown; charset=utf-8`.
- Its body is built by a `"use cache"` function tagged with `CONTENT_TAG`, so a publish in the admin regenerates it. It is prerendered at build, like `/feed.xml`.
- Pure builder: `lib/agent/onur-md.ts`, `buildOnurMd(input)`, unit-tested. It contains, in order:
  1. `# Onur Senture`, then the intro from `content/agent-intro.md` (hand-written, Onur approves).
  2. **Profile:** role, location, and "Open to work" only when the published `available` is true.
  3. **Experience:** org, role, years, from the published Experience.
  4. **Selected work:** each pinned page's title, one-line summary and absolute URL.
  5. **Lab:** each entry's name, year and URL when it has one.
  6. **Resume:** `/resume/` and `/resume.pdf`.
  7. **Contact:** the Book a call links when booking is enabled, then the social links. **No email.**
  8. **More:** Notes, Life, Changelog and Colophon, with absolute URLs.
- Every value comes from `getPublishedContent()` and the existing content modules. An empty section is left out, never filled with placeholder text.

### 3.2 `/llms.txt`

- A route handler (`app/llms.txt/route.ts`) that returns `text/plain; charset=utf-8`, with the same caching as `onur.md`.
- Pure builder: `lib/agent/llms-txt.ts`, following llmstxt.org:
  - `# Onur Senture`, then a one-sentence `>` summary (the profile role and the first sentence of the intro);
  - `## Profile`, linking `onur.md` first, then `/resume/` and `/resume.pdf`;
  - `## Work`, linking each pinned product page;
  - `## Optional`, linking Notes, Life, Changelog and Colophon.

### 3.3 Discovery

- The root layout's metadata adds `alternates.types["text/markdown"] = "/onur.md"`, which renders `<link rel="alternate" type="text/markdown" href="/onur.md">` on every page.
- The Life boot readout gets one more static line after "Human detected.": `Not human? → onur.md`, where `onur.md` links to `/onur.md`. It types in with the boot lines, and the server HTML holds it complete.
- The colophon's "Agent" row names both files.
- `robots.ts` only disallows `/admin/` and `/api/`, so both files are crawlable. No change is needed.

## 4. Footer

- The build line splits: `v2.9.0` becomes a link to `/changelog/#v2-9-0`, and the date and commit stay plain text. A "Colophon" link follows the commit.
- The empty `data-slot="paddle"` div and its comment are removed.
- Link styling follows the existing footer links (`hover:text-fg hover:underline`), plus the focus style from §5.

## 5. Accessibility and performance

### 5.1 Baseline (production, 2026-10-08)

A Lighthouse 13 run (mobile and desktop, better of two) and axe-core via Playwright (15 public pages at 390 and 1440) measured production before this sprint:
- **Performance:** desktop 96–100 everywhere. Mobile 97–100 on the Work side, but 86–90 on `/life/`, `/life/photos/` and `/life/films/`, with simulated LCP 3.7–4.2 s. CLS is 0 and TBT 0–10 ms on every page.
- **Accessibility:** Lighthouse 100 everywhere except `/resume/` (92). axe found violations only on `/resume/`, `/system/` and, at 390, `/`.
- **Keyboard:** there is no skip link; focus outlines are 1px and clipped inside `truncate` rows; reduced motion is respected except for one 150 ms transition.
- There is no theme toggle: the Work side is always light and the Life side always dark, so "both themes" means both sides.

The raw outputs were kept outside the repo; the findings below are the record.

### 5.2 Accessibility fixes (public)

| # | Finding | Fix |
|---|---|---|
| A1 | `link-in-text-block` on `/resume/`: accent links in body text are 2.93:1 against the text and only underline on hover. | **Links inside running text are always underlined** (`underline decoration-1 underline-offset-2`, accent colour kept). Nav, footer, rows and buttons keep hover-only underlines. A `prose-link` style is used by every inline link in body copy, not only on the resume. |
| A2 | `target-size` on `/resume/`: "Download PDF" and "Book a call" are 18px tall. | Each action gets a hit area of at least 24px (vertical padding, no visual change). |
| A3 | `color-contrast` on `/system/`: the danger chip is `#D92D20` on `#FEF3F2`, 4.44:1. | The light `--color-danger` token becomes `#C9281C` (5.08:1 on the danger background, 5.28:1 on the page). The dark token already passes. |
| A4 | `scrollable-region-focusable` at 390: the home heatmap scroller and the `/system/` data table. | The scroll containers in `components/ui/heatmap.tsx` and `components/ui/data-table.tsx` get `tabIndex={0}`, `role="region"` and an `aria-label`, and the focus style. |
| A5 | `label-content-name-mismatch` on product pages: the figure button's label "Open FIG. 01: Marketplace" doesn't start with its visible text "FIG. 01 · Marketplace". | The `aria-label` is removed; the visible caption names the button, and "opens the viewer" is conveyed by `aria-haspopup="dialog"`. |
| A6 | `aria-prohibited-attr` (needs review): `<time aria-label="Local time in Ankara">` in `live-clock.tsx`. | The `aria-label` goes; a visually hidden "Local time in Ankara:" precedes the `<time>`. |
| A7 | No skip link. | A "Skip to content" link is the first focusable element in both shells, visible only on focus, targeting `<main id="content">`. |
| A8 | Focus outlines are 1px and clipped by `truncate` parents (15 Experience links on `/`, two list items on `/life/` at 390). | One global `:focus-visible` style: a 2px accent outline with a 2px offset. Where a link sits in an `overflow:hidden` truncation box, the truncation moves to an inner span so the link's box (and its outline) isn't clipped. |
| A9 | The Life switch's 150 ms transition runs under reduced motion. | It is removed under `prefers-reduced-motion: reduce`. |
| A10 | The 404 page's title is only "Onur Senture". | Its title becomes "Not found · Onur Senture". |

### 5.3 Accessibility fixes (admin, basic)

The admin is checked for keyboard, focus and labels only:
- the global focus style (A8) covers it, including "+ Add photo" (Sprint 11 follow-up) and the Notes equivalent;
- the admin e2e runs axe on each console page, limited to the rules for names and labels (`label`, `button-name`, `link-name`, `aria-input-field-name`, `select-name`) and `scrollable-region-focusable`, and its findings are fixed;
- a keyboard walk of Photos and Notes (add, edit, publish, delete through the in-page confirm dialog) is part of the controller's visual check.

### 5.4 Performance fixes

| # | Finding | Fix |
|---|---|---|
| P1 | The LCP image is lazy-loaded on Life pages: `PhotoGrid` never passes `priority`, and `RemoteImage` and `Cover` hard-code `loading="lazy"`. | `PhotoGrid`, `RemoteImage` and `Cover` take a `priority` prop. Images in the first visible row get `loading="eager"` and `fetchPriority="high"`: the first 4 photos on `/life/photos/`, the first row on the archive pages, and the Films row's first poster on `/life/`. Everything else stays lazy. |
| P2 | Third-party covers are far larger than shown (1.0–2.2 MiB on Life pages): the Films row on `/life/` uses the raw 600×900 RSS poster at about 86px, and Goodreads covers are forced to `_SY475_`. | The Films row uses the existing `posterCrop` (the same size as the archive). Goodreads covers request `_SY345_` (the film posters' 345px; `_SY160_` scales the height, so 2:3 tiles 84–113px wide and up to 170px tall would have been below 1x). Theatre posters have no size parameter upstream and stay as they are. |
| P3 | `meta-description` is missing on `/`, `/life/`, `/life/photos/` and `/life/films/`. | Each gets a one-sentence description (Claude drafts; Onur approves on production). The other Life pages get one too, so every public page has a description. |

Deliberately not done: a 320w photo rendition (it would need a backfill of every stored photo for 14–50 KiB per page), the shared-chunk and polyfill savings (about 40 KiB, owned by Next's build), and the fonts (already self-hosted with `swap`).

**Target:** after the merge, the same audit on production shows mobile performance of at least 90 on `/life/`, `/life/photos/` and `/life/films/`, and no LCP image with `loading="lazy"`. The numbers go into the follow-ups file. Simulated mobile scores vary by up to 9 points between runs, so the better of two runs counts, as in the baseline.

### 5.5 Guard: axe in e2e

- A new `e2e/a11y.spec.ts` (with `@axe-core/playwright`) runs axe with the WCAG 2.2 A/AA tags on every public route at 390 and 1440 and fails on any violation:
  - `/`, `/resume/`, `/notes/`, `/book/`, `/system/`, one product page, `/changelog/`, `/colophon/`, the 404;
  - `/life/`, `/life/photos/`, one photo page, `/life/films/`, `/life/books/`, `/life/saved/`, `/life/theatre/`, `/life/notes/`.
- It runs in the plain `e2e` build (empty states) and the `e2e:fixtures` build (populated content), so both shapes of each page are covered.
- The route list lives in one module, and a unit test fails if an `app/**/page.tsx` route outside `admin` isn't in it, so a new page can't skip the guard.

## 6. Testing

**Unit (Vitest):**
- the changelog rules in §1.2, including the `package.json` match;
- `anchorOf` and `compareVersions`;
- `buildOnurMd`: section order, no email anywhere, "Open to work" only when available, empty sections omitted, absolute URLs;
- `buildLlmsTxt`: the llmstxt.org shape (one H1, a blockquote, H2 sections of `- [title](url)` lines);
- the colophon's version reader leaves out missing packages.

**E2E (Playwright):**
- `/changelog/` lists the releases newest first, and the footer version link lands on the matching anchor;
- `/colophon/` renders, and the footer's "Colophon" link reaches it;
- `/onur.md` returns 200 `text/markdown` and doesn't contain the resume's email address; `/llms.txt` returns 200 `text/plain`;
- every page has the `text/markdown` alternate link;
- the Life readout's `onur.md` line links to `/onur.md`;
- the footer has no paddle slot;
- the axe guard in §5.5, and the admin axe pass in §5.3.

**Visual checks (never skipped):** `npm run screenshots` at 1440 and 390 for `/changelog/`, `/colophon/`, `/`, `/life/`, `/resume/` (underlined links) and both footers, plus a Tab walk of `/` and `/life/` to see the skip link and focus rings. Also check the Life readout's typing with the new line, freeze-framed mid-line.

## 7. Rollout

1. CI green on the PR.
2. Merge into `v2` (a production deploy).
3. Production checks: the four new routes return 200 with CDN HIT, the footer links work, and the §5.4 audit is rerun.
4. Onur reads and approves the changelog entries, the colophon and the `onur.md` intro on production. Edits come as a follow-up commit.

## 8. Out of scope

- The Konami easter egg and the paddle effect (dropped).
- A changelog RSS feed, or changelog entries in `/feed.xml`.
- Admin editing of the changelog, the colophon or the `onur.md` intro.
- A Lighthouse performance budget in CI.
- A deep accessibility audit of the admin beyond keyboard, focus and labels.
- The launch version number (Sprint 12).

## Errata (planning)

- §1.5 / §2.3: both pages open with the `/book/` header pattern (`← Home` and an `h1` lead with a muted continuation) instead of `PageHeader`, like every other Work page.
- §2.1: notes do not cross-post to Bluesky (only their text format follows Bluesky's, through `@atproto/api` facets); the Data row says that instead.
- §2.2: versions are read from `dependencies` and `devDependencies` (Tailwind is a dev dependency). A 0.x package shows `major.minor` ("Drizzle 0.45"). Neon, Vercel and GitHub OAuth carry no version.
- §3.1: the intro is a TS module (`content/agent-intro.ts`), not Markdown, so a runtime regeneration needs no file tracing. It is in the first person, like the home bio, and says nothing about availability (the Profile section adds "Open to work" from the published switch). Booking links go to cal.com directly.
- §3.3: the `text/markdown` alternate is a `<link>` in the root layout's `<head>`, not `metadata.alternates`, because note pages set their own `alternates` (canonical), which would replace it.
- §5.2 A5: the figure button keeps an `aria-label`, now starting with its visible text ("FIG. 01 · Marketplace, open in viewer"). Removing it would leave the button nameless: its visible label is `aria-hidden`.
- §5.2 A8: Experience moves the truncation onto the link; the Life readout lines (text with a link inside) get the `focus-room` utility instead.
- §5.2 A1: the resume's contact line, products line and Projects, the 404 sentences, and the new colophon and changelog prose use `underline="always"`. Notes already underlined their links.
- §5.4 P1: four leading images (`EAGER_TILES`, the first phone row) load eagerly; on Saved, one.
- §5.5: the admin axe pass runs in `e2e-admin/a11y.spec.ts`; `/life/films/[year]` isn't audited separately (same component as `/life/films/`).

### Errata (implementation)

- Task 3: the 404 title comes from `export const metadata = pageMetadata("Not found")` in both `[...missing]/page.tsx` files; the `not-found.tsx` fallback wasn't needed.
- Task 5: `TextLink` renders a plain `<a>` for an internal href ending in a file extension (route handlers such as `/onur.md`), instead of `next/link`.
- Task 7: `bioPlain`, `workSummary`, `oneLine` and `selectedWork` live in the pure `lib/agent/onur-md.ts`. Work summaries are the lead's continuation (`lead.rest`, falling back to `lead.strong`), because `lead.strong` is the product name. Selected work is derived with `buildPins` (the same function the home uses), deduped by slug, so stale or unlisted pins match the home. Work summaries and lab descriptions are collapsed to one line. The resume email is `resume.contact.email`.
- Tasks 7–8: both routes write `cacheLife` as an `if`/`else` (the ternary form failed TS2769), like `lib/resume/pdf/published.ts`.
- Task 9: the readout `<ul>` is `flex flex-col`, because `focus-room`'s negative margins collapsed between block siblings (a 28px pitch instead of 24); `e2e-fixtures/life.spec.ts` measures the readout line's content box. `focus-room` needs a flex (or grid) parent to stay layout-neutral.
- Task 10: the first tile row on each archive page loads eagerly: Reading now on Books when present (else the first month), the first month on a films year page, the undated row on `/life/films/undated/`, the first year on Theatre, the first item on Saved; the first `EAGER_TILES` photos on `/life/photos/` and posters in the `/life/` Films row. A first row with fewer than 4 tiles loads fewer eagerly.
- Task 11: the fixture a11y spec also checks that a note page (own `alternates`) keeps the `text/markdown` alternate link; no violations needed fixing.
