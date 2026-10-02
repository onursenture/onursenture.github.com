# S3 Design System and Shell — Design Spec

## Overview

S3 turns the S1 visual direction into code. It covers:
- the token layer
- a small set of primitives
- the two shells: the site top bar and the dashboard sidebar
- a mode-switch transition
- the two-tier home page in both views
- `/life` in both views
- restyled photo pages

It builds on:
- `2026-10-02-site-v2-foundation-design.md` (mechanics)
- `2026-10-02-s1-visual-direction-design.md` (visual language, tokens, Adobe Fonts kit)
- the S2 platform (`[view]` routing, sections, `readSource`, `<Picture>`)

It also closes the S3 items in `docs/superpowers/plans/2026-10-02-s2-followups.md`.

Case-study content, career data and the career timeline belong to S4. In S3, the home work index shows only facts Onur has confirmed.

## Decisions

| Topic | Decision |
|---|---|
| Home, site view, first screen | **Work-index first.** A one-line identity, a mono meta line, then the selected work index. |
| Identity (approved 2026-10-03) | Headline: **"From components to complete apps, designed and built end to end."** Meta line: **`DESIGNER + BUILDER · ANKARA 14:32 · OPEN TO ROLES`**. The time is a live Europe/Istanbul clock, and "OPEN TO ROLES" shows only while `available` is true. The positioning is designer + builder: Onur designs and ships whole apps. |
| Lab on home | **Added in S3.** A second index, "Lab", sits below the work index. It lists things Onur builds, so the home page shows both what he designed and what he built. |
| "Off the clock" strip | **Four-column visual strip**: the book currently being read (cover), the latest film (poster and rating), the latest photo, the latest saved article (text tile). It links to `/life/`. |
| Home, dashboard view (Overview) | **Metric row plus panel grid**: Work, Status, Activity, Sources. A career Gantt panel is added in S4. |
| `/life`, site view | **Full-width bands.** Each section has a header rule, then its content. |
| Build approach | **Our own primitives on Tailwind v4 tokens.** No component library. Native `<dialog>` and the Popover API cover overlays. A headless library may be added later, per component, only if S7 needs one. |

## 1. Tokens, theme and fonts

**Colour.** The CSS custom properties use exactly the Figma variable names:
- `--color-bg`, `--color-surface`, `--color-fg`, `--color-fg-muted`
- `--color-line`, `--color-line-strong`
- `--color-danger`, `--color-danger-bg`

They are declared in Tailwind's `@theme`, which generates `bg-bg`, `text-fg`, `text-fg-muted`, `border-line` and the like. The same properties are redefined under `[data-theme="dark"]`. Components never branch on the theme. The light and dark values are the ones in the S1 spec.

**No-JS fallback.** Add `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }`, so visitors without JavaScript get the system theme.

**Type.** There is one utility class per Figma text style, with the same names:
- `type-display-160`, `-96`, `-64`, `-40`
- `type-text-28`, `-20`, `-16`, `-14`, `-13`, each with a `-medium` variant
- `type-mono-13`, `-12`, `-11`

Each class sets family, size, line-height, letter-spacing and weight, with the values in the S1 spec. Display classes encode Adobe's shifted weights: 65 Medium is `font-weight: 600`. Uppercase mono labels use `+0.02em` tracking. `body` sets `font-variant-numeric: tabular-nums`.

**Fonts.**
- Neue Haas Grotesk comes from the Adobe kit `jgu1ygn` (`font-display: swap`). The root layout adds a `<link rel="stylesheet">` for it, plus `preconnect` to `https://use.typekit.net` and `https://p.typekit.net`.
- Fragment Mono comes from `next/font/google` and is exposed as `--font-mono`.
- The fallback for both grotesk families is `"Helvetica Neue", Helvetica, Arial, sans-serif`.

**Space and shape.**
- Tailwind's default 4px spacing unit matches the S1 scale.
- One radius token, `--radius-control: 4px`, is used only on buttons, inputs and toggles. Everything else is square.
- There are no shadows.

**Drift guard.** A Vitest test parses `app/globals.css` and asserts that every colour token has its S1 light and dark value.

## 2. Primitives (`components/ui/`)

| Primitive | Responsibility |
|---|---|
| `Band` | Full-width section. A top rule, a header row with a `MetaLabel` (label and source) on the left and an optional `TextLink` ("All →") on the right, then children. |
| `MetaLabel` | A mono uppercase label (`type-mono-11`, `fg-muted`), with an optional leading `StatusGlyph`. |
| `IndexRow` | One work-index row: year (mono), title plus inline meta, role (mono), `→`. The whole row is a link when `href` is set; the title underlines on hover. With no `href`, it renders as plain, non-interactive text. Empty fields render as nothing, never as dashes or invented values. |
| `EraStamp` | `● 2013 · iOS 6 · pre-flat` in `type-mono-11`. |
| `Cover` | A remote poster or book cover at a fixed 2:3 ratio, with explicit width and height, square corners and `loading="lazy"`. If there is no `src`, it renders a `--color-line` block. |
| `Stat` | A metric tile: a `MetaLabel` and a large number (`type-text-28-medium`). |
| `Panel` | A dashboard container. A header row (title `MetaLabel`, an optional count, a right slot) above a body. 1px `--color-line` border, `--color-surface` background, square corners. |
| `DataTable` | A dense table with real `<thead>`/`<th scope="col">`. A column config sets `header`, `align` and `mono`, and there is an empty-state row. |
| `StatusGlyph`, `Chip` | `●` ok, `○` empty, `◐` late, and a danger-coloured `●` for error. Glyphs are set in Neue Haas Grotesk Text. `Chip` is either inverted or uses danger-bg. |
| `Button` | Primary is inverted (`bg-fg text-bg`); ghost is the other variant. Both use `--radius-control`. |
| `TextLink` | A link with a trailing `→`, underlined on hover. All links use `→`, including external ones (S1: no `↗`). External links get `rel="noopener noreferrer"`. |
| `Toggle` | A segmented control with `aria-pressed` on each option, used for theme (Light / Dark / Auto) and view (Site / Dashboard). |
| `RelativeTime` | A client component. It server-renders the absolute `formatDateTime`, then shows "2h ago" after hydration, with the absolute time in `title` and `dateTime`. |

The existing `<Picture>` is unchanged. `Empty` is restyled with tokens.

**`/system/`** is a page under `app/[view]/system/`. It is excluded from navigation, has `robots: noindex` and is left out of the sitemap. It renders every primitive and the full type scale. This lets one URL show both views (`?view=`) and both themes. It is the in-code style tile, and it is the review surface for S3.

## 3. Shells, toggles, transition

**Navigation config (`lib/nav.ts`).** Items follow the foundation IA order (Work, Lab, Resume, Notes, Life), each with a `ready` flag. Only ready items render, so S3 shows Life only. Photos is not a nav item: it is reached from the Life photos band and the "Off the clock" strip. "Book a call →" renders only when `profile.bookingUrl` is set (S6).

**Site shell.**
- A top bar with the name on the left (it links home), the nav, then "Book a call" and the two toggles.
- A footer: one mono line with © year and the social links from `profile.ts` (GitHub, Letterboxd, Goodreads, X, Dribbble). It also holds an empty `data-slot="paddle"` element reserved for S9.

**Dashboard shell.**
- A 240px sidebar holding:
  - the name
  - nav as a vertical list, with "Overview" first (it links home)
  - the two toggles at the bottom
  - a sync line underneath, e.g. `● 5/5 synced · 12m ago`, built from source health
- A 48px top bar with the page title and a right-hand context slot.
- Content on a 12-column panel grid with 16px gutters.

**Mobile, below 768px.**
- Site: the name and a "Menu" text button. It opens a full-screen native `<dialog>` with the nav and the toggles.
- Dashboard: the sidebar is hidden, and a top bar with "Menu" opens the same sidebar content in a slide-over `<dialog>`. Panels stack into one column.

**Toggles and cookies.** Cookie writing and reading are centralized in `lib/view/cookies.ts`, the single source of name, max-age and SameSite for `proxy.ts` and both toggles. Terminate the theme-cookie regex with `(?:;|$)`.

**Mode-switch transition.**
- Use React's `<ViewTransition>` with Next 16's view transition support. The toggle wraps `router.refresh()` in `startTransition`.
- The site top-bar nav and the dashboard sidebar share `view-transition-name: shell-nav`, so one morphs into the other. Content cross-fades. 250ms, ease-out.
- With `prefers-reduced-motion: reduce`, there is no animation.
- The plan's **first task is a spike** proving this works on Next 16.3.8 with `cacheComponents`. If it doesn't, the toggle keeps the instant swap, and the spike's findings are recorded in this spec.

**404 inside the shell.** Add `app/[view]/[...missing]/page.tsx`, which calls `notFound()`, plus `app/[view]/not-found.tsx`. Unknown URLs then render inside the view layout, with nav and toggles, in both views. Cache Components needs at least one prerendered param, so `generateStaticParams` returns a single placeholder param.

## 4. Pages and data

**New content files.**
- `content/profile.ts`:
  - `name`
  - `identity`: `"From components to complete apps, designed and built end to end."`
  - `meta`: an ordered list of segments, each one of:
    - `{ text }`: a static fact
    - `{ clock: "Europe/Istanbul", label: "ANKARA" }`: the label plus a live `HH:mm` time
    - `{ availability: true }`: renders "OPEN TO ROLES" only when `available` is true

    S3 ships `[{ text: "DESIGNER + BUILDER" }, { clock: "Europe/Istanbul", label: "ANKARA" }, { availability: true }]`, joined by ` · `.
  - `available: true`
  - `bookingUrl?`
  - `social` (the old `site.json` handles: x `w00f`, dribbble `onursenture`, github `onursenture`, goodreads `onur`, letterboxd `onur`, instapaper `w00f`)
  - `metrics?`: career metrics such as years and components, shown only when present
- `content/work-index.ts`: an ordered list of `{ title, meta?, years?, role?, era?, href? }`.

**Rule:** only facts Onur has confirmed are published. S3 ships these entries:
- PrimeOne: "80+ components"
- PrimeBlocks: "500 UI blocks"
- PrimeIcons: "hand-drawn icon set"
- "Premium admin dashboards"
- nebuu: "ongoing, Orkestra"

They have no years, roles, eras or links; S4 fills those in.
- `content/lab-index.ts`: an ordered list of `{ title, description, year?, href?, status?: "live" | "wip", placeholder?: boolean }`. While the list is empty, the Lab section and panel do not render. Onur approved placeholders until he supplies real entries. S3 ships:
  1. `{ title: "onursenture.com", description: "This site — designed in Figma, built in Next.js with an AI-agent workflow.", year: "2026", href: "https://github.com/onursenture/onursenture.github.com", status: "wip" }` (real)
  2. `{ title: "Project 02", description: "Details coming soon.", status: "wip", placeholder: true }`
  3. `{ title: "Project 03", description: "Details coming soon.", status: "wip", placeholder: true }`

  `placeholder` is data-only. It does not change rendering, and it marks the entries to replace.
- **Live clock:** `components/ui/live-clock.tsx` is a client component. It server-renders `--:--` (pages are prerendered), then shows `HH:mm` for the given time zone after hydration and ticks every minute. It uses `<time>` with `aria-label="Local time in Ankara"`.

**Home, site view (`app/[view]/page.tsx` → `HomeSite`).**
1. The identity line (`type-display-40`) and the mono meta line.
2. The work index (`IndexRow` per entry).
3. The **Lab** index: a `Band` titled "LAB" with one row per `lab-index` entry. Each row shows title, description, year and an optional status glyph (● live, ◐ wip), with `→` when `href` is set. External links use `rel="noopener noreferrer"`. The band has no "All →" link until `/lab` ships in S5.
4. The "Off the clock" `Band` with four columns:
   - `currentlyReading[0]` (Goodreads) as `Cover` + title + author
   - `films[0]` as `Cover` + title + stars
   - the newest photo as `<Picture>` + title + camera
   - `articles[0]` as a text tile: title, domain, minutes

   Each column links to its `/life/` section. If a source is empty, its column is omitted.
5. The footer.

**Home, dashboard view (`HomeDashboard`).**
- A `Stat` row:
  - films synced
  - books (reading + read)
  - GitHub contributions
  - each `profile.metrics` entry, when present
- `Panel`s:
  - **Work:** a `DataTable` of the work index.
  - **Lab:** a `DataTable` of the lab index. It is hidden while the list is empty.
  - **Status:** availability and the booking link.
  - **Activity:** `lib/activity.ts` merges the latest films (watched), read books (finished) and articles (saved), sorts them by date and keeps 8. Each item is a glyph, a verb, a title and a `RelativeTime`.
  - **Sources:** the five sources, each with a `StatusGlyph` from `lib/sources/health.ts`. `●` means `lastSuccessAt` falls within 2× the interval, `◐` means it is older, and `○` means it never synced. There is no error state publicly; error details are admin-only (S7).

**`/life`.**
- **Site view:** one `Band` per section, in order:
  - Films: `Cover` row with stars
  - Books: currently-reading covers plus a read list with stars
  - Saved: title · domain · minutes
  - Writing: list, with an empty state while w00f.org has no posts
  - GitHub: a contribution heatmap in five monochrome steps from `--color-line` to `--color-fg`, plus the total
  - Photos: a grid linking to `/photos/`
- **Dashboard view:** the same data as `Panel`s and `DataTable`s, plus the heatmap with stats (total, active days, longest streak) and the Sources panel.
- Stars are derived from `ratingValue`, not from the title regex. Writing `lib/sources/stars.ts` closes that S2 follow-up.

**Photos.**
- `/photos/` and `/photos/[slug]/` are restyled with tokens.
- The detail page gets previous/next links.
- The grid's `sizes` must match the real layout.
- Linked thumbnails use `alt=""`.

**Metadata.** The root layout defines shared Open Graph and Twitter defaults (site name, `twitter:card=summary`, no default image). Pages spread these defaults into their own metadata rather than replacing them. Photo pages keep their JPEG `summary_large_image`.

**Fixtures.** Add `tests/fixtures/goodreads-currently-reading.xml`, so fixture mode no longer duplicates the read shelf into currently-reading.

## Testing and review

- **Vitest:**
  - the token drift guard
  - `lib/activity.ts`: merge, order and limit
  - `lib/sources/health.ts`: the ok/late/never boundaries
  - `lib/sources/stars.ts`
  - the cookie helpers
- **Playwright (normal build):**
  - home in both views renders the identity, index and metrics, or the name only when `identity` is unset
  - `/system/` renders every primitive in both views
  - every theme × view combination
  - back/forward after a view toggle
  - a 404 renders inside the shell in both views
  - the mobile menu opens and closes, in a 390px viewport
  - with `prefers-reduced-motion`, no transition is applied
- **Playwright (`e2e:fixtures`):**
  - the "Off the clock" strip shows four columns with real titles
  - `/life` site bands and dashboard panels show fixture rows
  - the Activity and Sources panels populate
- **Visual review:** after each UI task, the implementer screenshots the preview at 1440 and 390, in both views and both themes, for the task reviewer. At sprint end, Onur reviews `/system/`, `/` and `/life/` on the Vercel deployment.

## Out of scope

- Case studies, the career Gantt panel, era-stamp content, and work years/roles: S4.
- Resume and the booking embed: S6.
- Admin and notes: S7.
- Instapaper card redesign and theatre: S8.
- Changelog and the paddle effect: S9. S3 only reserves the footer slot.
