# Sprint 4: New Visual Direction and Work/Life Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the S1/S3 look and the site/dashboard dual view with the "Quiet system" direction: IBM Plex and Doto, one ultramarine accent, Dither Kit texture everywhere, and a Work side plus an always-dark Life side joined by a Life switch.

**Architecture:**
- The `[view]` route segment, the view cookie proxy and the dashboard shell are removed. Pages become plain routes: Work-side pages sit under `app/(work)/`, and the Life side is `app/life/`.
- Each side has its own layout and shell. The Life switch navigates between them with a React `<ViewTransition>`.
- Dither Kit (MIT) is vendored into `components/dither-kit/` and extended to accept raw RGB colours. Our own `components/ui/dither-*` wrappers feed it colours read from the CSS tokens, so it follows the theme.

**Tech Stack:** Next.js 16.3.8 (App Router, `cacheComponents`, `trailingSlash`), React 19.2.8, Tailwind CSS 4.3.3, `next/font/google`, Vitest 5, Playwright 1.63, Dither Kit (vendored; deps `motion`, `d3-scale`, `d3-shape`, `clsx`, `tailwind-merge`).

**Spec:** `docs/superpowers/specs/2026-10-03-sprint-4-visual-direction-design.md`. The approved mockup is `docs/superpowers/specs/2026-10-03-sprint-4-mockups/dir1-dither.html`; open it in a browser for visual reference.

## Global Constraints

- Work in the worktree `/Users/w00f/Documents/GitHub/onursenture.github.com-sprint-4` on branch `sprint-4`. Never touch `master` or `v2` directly.
- A task is done only when every check below passes:
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - `npm run e2e`
  - `SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures`
  - a final plain `npm run build`, so `.next` is not left in fixture mode
- Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an API.
- `cacheComponents` is on: pages never read `cookies()` or `headers()`, and page data comes from `"use cache"` functions.
- `trailingSlash: true`: every internal link ends with `/`.
- **Faces to avoid** (S1 list, still binding): Inter, Geist, Geist Mono, Instrument Serif/Sans, Söhne, Tiempos, Styrene, Space Grotesk, DM Sans, Manrope, Satoshi, Fraunces, PP Neue Montreal, PP Editorial New, JetBrains Mono. Allowed faces: IBM Plex Mono, IBM Plex Sans, Doto.
- **Tokens (exact):**

  | Token | Light | Dark |
  |---|---|---|
  | `--color-bg` | `#FAFAF8` | `#0B0B0C` |
  | `--color-fg` | `#1F1F22` | `#EDEDED` |
  | `--color-fg-muted` | `#6E6E73` | `#8A8A90` |
  | `--color-fg-soft` | `#52525A` | `#B4B4BA` |
  | `--color-line` | `#E6E6E1` | `#222225` |
  | `--color-accent` | `#2F55F5` | `#6E8BFF` |
  | `--color-danger` | `#D92D20` | `#F97066` |
  | `--color-danger-bg` | `#FEF3F2` | `#2A0F0C` |

  The Life side (`[data-side="life"]`) always uses the dark column.
- **Glyphs:**
  - `→` for internal links, `↗` for external links (the S3 ban on `↗` is lifted).
  - `●` ok, `○` empty, `◐` partial, `×` close, `←` for "Previous", and `├─` / `└─` in the experience tree.
  - Never `★`; ratings are plain numbers via `formatRating`. `grep -rn "★" app components lib` must stay empty.
- Only confirmed facts go in `content/*.ts`. Copy marked "draft" in this plan ships, and Onur reviews it on the PR preview.
- Every `<canvas>` is decorative: its wrapper has `aria-hidden="true"`, and meaning lives in adjacent text.
- `prefers-reduced-motion: reduce` disables every animation added here: the Life switch transition, the typewriter and the Dither Kit entrances.
- English only.
- Commits:
  - Subjects in the imperative, with no "Task N" prefix.
  - Every commit message ends with this trailer, and no other model name:

    ```
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    ```
- In e2e tests, prefer role locators or `:visible`. Next keeps the previous route's tree mounted but hidden after a client navigation.

## File structure

**Removed:**
- `app/[view]/` (contents move)
- `proxy.ts`
- `lib/view/views.ts`, `lib/view/params.ts`, `lib/view/transition.ts`
- `components/view-toggle.tsx`
- `components/shell/shell-fade.tsx`, `components/shell/dashboard-shell.tsx`
- `components/home/home-dashboard.tsx`, `components/home/off-the-clock.tsx`, `components/home/work-index.tsx`, `components/home/meta-line.tsx`
- `components/sections/sync-status/`
- `components/ui/panel.tsx`, `components/ui/stat.tsx`, `components/ui/index-row.tsx`, `components/ui/band.tsx`
- `components/sources/source-health.tsx`
- `lib/activity.ts`, `lib/sources/github-stats.ts`, `lib/index-columns.ts`
- the tests for all of the above

**Moved:**
- `lib/view/cookies.ts` → `lib/theme/cookies.ts`
- `lib/view/theme.ts` → `lib/theme/theme.ts`

**Created:**

| Path | Responsibility |
|---|---|
| `app/(work)/layout.tsx`, `page.tsx`, `not-found.tsx`, `[...missing]/page.tsx`, `system/page.tsx` | Work-side routes |
| `app/life/layout.tsx`, `page.tsx`, `not-found.tsx`, `[...missing]/page.tsx`, `photos/page.tsx`, `photos/[slug]/page.tsx` | Life-side routes |
| `components/dither-kit/*` | Vendored Dither Kit (gradient, button, avatar, area chart, core) + README |
| `components/ui/use-token-color.ts` | Reads a CSS colour token as RGB and follows theme changes |
| `components/ui/dither.tsx` | `DitherStrip`, `DitherRule`, `FooterWash` |
| `components/ui/media-placeholder.tsx` | Labelled dither wash; `<Picture>` when an image exists |
| `components/ui/primary-button.tsx` | Dithered primary call-to-action |
| `components/ui/lab-avatar.tsx` | Dithered generative avatar |
| `components/ui/contribution-chart.tsx`, `lib/sources/weekly.ts` | Weekly GitHub totals as a dithered area chart |
| `components/ui/section-row.tsx` | The three-column row: label, content, action |
| `components/ui/org-mark.tsx`, `content/orgs.ts` | Inline organisation marks (monogram fallback) |
| `components/shell/work-shell.tsx`, `components/shell/life-shell.tsx`, `components/shell/side-fade.tsx`, `components/shell/side-sync.tsx` | The two shells and their transition |
| `components/life-switch.tsx`, `lib/side.ts` | The Life switch and its constants |
| `lib/build-info.ts` | Version, build date and commit for the footer |
| `content/experience.ts`, `components/home/experience-tree.tsx`, `components/home/work-tiles.tsx`, `components/home/lab-grid.tsx`, `components/home/contributions-row.tsx` | Home sections |
| `lib/life/readout.ts`, `components/life/boot-readout.tsx`, `components/life/dither-portrait.tsx` | Life boot readout |

---

### Task 1: One view per URL — remove the site/dashboard machinery

This is a mechanical refactor that keeps today's look. When it is done, the site serves one rendering per URL. Work pages live under `app/(work)/` and Life pages under `app/life/`, both still using today's `SiteShell`. `/photos/…` redirects to `/life/photos/…`, and there is no view toggle, dashboard, proxy or `dashboard:` variant left.

**Model:** sonnet (many files, judgment on leftovers).

**Files:**
- Delete:
  - `proxy.ts`
  - `lib/view/views.ts`, `lib/view/params.ts`, `lib/view/transition.ts`
  - `components/view-toggle.tsx`
  - `components/shell/shell-fade.tsx`, `components/shell/dashboard-shell.tsx`
  - `components/home/home-dashboard.tsx`, `components/home/work-index.tsx`
  - `components/sections/sync-status/`
  - `components/ui/panel.tsx`, `components/ui/stat.tsx`
  - `components/sources/source-health.tsx`
  - `lib/activity.ts`, `lib/sources/github-stats.ts`
  - `tests/view.test.ts`, `tests/activity.test.ts`, `tests/sources/github-stats.test.ts`
  - `e2e/matrix.spec.ts`, `e2e/transition.spec.ts`, `e2e/view-and-theme.spec.ts`
- Move: `lib/view/cookies.ts` → `lib/theme/cookies.ts`, and `lib/view/theme.ts` → `lib/theme/theme.ts`. Update every import (`grep -rn "lib/view/" app components lib tests scripts e2e`).
- Move:
  - `app/[view]/page.tsx` → `app/(work)/page.tsx`
  - `app/[view]/layout.tsx` → `app/(work)/layout.tsx`
  - `app/[view]/not-found.tsx` → `app/(work)/not-found.tsx`
  - `app/[view]/[...missing]/page.tsx` → `app/(work)/[...missing]/page.tsx`
  - `app/[view]/system/page.tsx` → `app/(work)/system/page.tsx`
  - `app/[view]/life/page.tsx` → `app/life/page.tsx`
  - `app/[view]/photos/page.tsx` → `app/life/photos/page.tsx`
  - `app/[view]/photos/[slug]/page.tsx` → `app/life/photos/[slug]/page.tsx`
- Create: `app/life/layout.tsx`, `app/life/not-found.tsx`, `app/life/[...missing]/page.tsx`, `e2e/theme.spec.ts`
- Modify:
  - `next.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/not-found.tsx`
  - `lib/nav.ts`
  - `components/sections/types.ts`, `components/sections/section-block.tsx`, every `components/sections/*/index.tsx`, `components/sections/life.ts`
  - `components/shell/page-header.tsx`, `components/shell/site-shell.tsx`, `components/shell/shell-controls.tsx`, `components/shell/menu-dialog.tsx`, `components/shell/nav-links.tsx`
  - `components/photos/photo-grid.tsx`, `components/home/lab-index.tsx`, `components/home/home-site.tsx`
  - `components/sources/sources-table.tsx`
  - `scripts/screenshots.ts`
  - `tests/nav.test.ts`, `tests/sections.test.ts`, `tests/ui/home.test.tsx`, `tests/ui/layout-primitives.test.tsx`, `tests/cookies.test.ts`
  - `e2e/home.spec.ts`, `e2e/life.spec.ts`, `e2e/photos.spec.ts`, `e2e/shell.spec.ts`, `e2e/not-found.spec.ts`, `e2e/system.spec.ts`, `e2e/tokens.spec.ts`
  - `e2e-fixtures/home.spec.ts`, `e2e-fixtures/life.spec.ts`

**Interfaces:**
- Produces:
  - `lib/theme/cookies.ts`, which exports `PREFERENCE_COOKIE_MAX_AGE`, `PREFERENCE_COOKIE`, `serializeCookie`, `cookiePattern` (unchanged).
  - `lib/theme/theme.ts`, which exports `THEME_PREFERENCES`, `ThemePreference`, `THEME_COOKIE`, `THEME_COOKIE_PATTERN`, `themeScript` (unchanged).
  - `lib/nav.ts`, which exports `NavItem`, `NAV_ITEMS` (Work, Lab, Resume), `readyItems()` and `isActive(item, pathname)`.
  - `components/sections/types.ts`, which exports `SectionDefinition<T> { id; title; load; Render; source?; href? }` and `AnySectionDefinition`.
  - `SectionBlock({ section })`, `PageHeader({ title, meta? })`, `PhotoGrid({ photos })`, `PHOTO_GRID_SIZES` (a string).
  - `MenuDialog({ title, children })`, with no `variant`.

- [ ] **Step 1: Write the failing unit tests for the new nav and section contracts**

Replace `tests/nav.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActive, readyItems } from "@/lib/nav";

describe("nav config", () => {
  it("lists the Work-side items in IA order; Life is reached by the switch, not the nav", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Work", "Lab", "Resume"]);
  });

  it("renders only ready items (none yet in Sprint 4)", () => {
    expect(readyItems()).toEqual([]);
    expect(readyItems([{ label: "X", href: "/x/", ready: true }]).map((i) => i.label)).toEqual(["X"]);
  });

  it("matches an item by prefix", () => {
    const work = NAV_ITEMS[0];
    expect(isActive(work, "/work/")).toBe(true);
    expect(isActive(work, "/work/primeone/")).toBe(true);
    expect(isActive(work, "/")).toBe(false);
    expect(isActive(work, "/life/")).toBe(false);
  });
});
```

Replace `tests/sections.test.ts` with:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SectionBlock } from "@/components/sections/section-block";
import type { AnySectionDefinition } from "@/components/sections/types";

const section: AnySectionDefinition = {
  id: "films",
  title: "Films",
  source: "Letterboxd",
  href: "https://letterboxd.com/onur/",
  load: async () => ({ data: ["a", "b"], lastSuccessAt: null }),
  Render: ({ data }: { data: string[] }) => <p>{data.join(",")}</p>,
};

describe("SectionBlock", () => {
  it("renders the section as a band with its label, source, link and content", async () => {
    const html = renderToStaticMarkup(await SectionBlock({ section }));
    expect(html).toContain('data-section="films"');
    expect(html).toContain('id="films"');
    expect(html).toContain("Films");
    expect(html).toContain("Letterboxd");
    expect(html).toContain('href="https://letterboxd.com/onur/"');
    expect(html).toContain("<p>a,b</p>");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/nav.test.ts tests/sections.test.ts`
Expected: FAIL. `NAV_ITEMS` still lists Notes and Life, and `SectionBlock` still requires `view`.

- [ ] **Step 3: Rewrite `lib/nav.ts`**

```ts
export interface NavItem {
  label: string;
  href: string;
  // Only ready items render; flip the flag when the section ships.
  ready: boolean;
}

// The Work side's IA order (Sprint 4 spec §1). Life is not a nav item: the
// Life switch in the header reaches it. Notes returns in Sprint 9.
export const NAV_ITEMS: NavItem[] = [
  { label: "Work", href: "/work/", ready: false },
  { label: "Lab", href: "/lab/", ready: false },
  { label: "Resume", href: "/resume/", ready: false },
];

export function readyItems(items: NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.ready);
}

export function isActive(item: NavItem, pathname: string): boolean {
  return pathname.startsWith(item.href);
}
```

- [ ] **Step 4: Rewrite the section contract**

`components/sections/types.ts`:

```ts
import type { ReactNode } from "react";
import type { SourceView } from "@/lib/sources/snapshot-view";

// A section is one data loader plus one renderer. Pages hand sections to
// SectionBlock, which loads the data and wraps the renderer in a band.
export interface SectionDefinition<T> {
  id: string;
  title: string;
  load: () => Promise<SourceView<T>>;
  Render: (props: { data: T }) => ReactNode;
  // Upstream name for the band header ("Films · Letterboxd").
  source?: string;
  // The band's "All" link.
  href?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDefinition = SectionDefinition<any>;
```

`components/sections/section-block.tsx`:

```tsx
import { Band } from "@/components/ui/band";
import type { AnySectionDefinition } from "./types";

export async function SectionBlock({ section }: { section: AnySectionDefinition }) {
  const { data } = await section.load();
  const { Render } = section;
  return (
    <Band id={section.id} data-section={section.id} label={section.title} source={section.source} href={section.href}>
      <Render data={data} />
    </Band>
  );
}
```

Delete `components/sections/synced-at.tsx` if nothing else imports it (`grep -rn synced-at components app`).

In each of `films`, `books`, `articles`, `writing`, `github` and `photos` under `components/sections/*/index.tsx`:
1. Delete the `Dashboard` function and every import it alone used (`DataTable`, `formatDate` where unused, `Stat`/`StatRow`, `contributionStats`, `ItemLink` where unused).
2. Rename `Site` to `Render`.
3. Replace the exported object with only `id`, `title`, `load`, `Render`, `source` (if it had one) and `href`.

For example, `films` becomes:

```ts
export const films: SectionDefinition<Film[]> = {
  id: "films",
  title: "Films",
  load: () => readSource("letterboxd"),
  Render,
  source: "Letterboxd",
  href: `https://letterboxd.com/${profile.social.letterboxd}/`,
};
```

Two sections need more than that:
- The photos section's `href` becomes `"/life/photos/"`, and its renderer calls `<PhotoGrid photos={data} />`.
- The github section's `Render` keeps its current site body: the heatmap and the "N contributions in the last year" line.

`components/sections/life.ts`: remove `syncStatus` from the import and from the list, leaving `[films, books, articles, writing, github, photos]`. Delete `components/sections/sync-status/`.

- [ ] **Step 5: Run the unit tests**

Run: `npx vitest run tests/nav.test.ts tests/sections.test.ts`
Expected: PASS.

- [ ] **Step 6: Move the routes**

```bash
mkdir -p "app/(work)/system" "app/(work)/[...missing]" app/life/photos/[slug] "app/life/[...missing]"
git mv "app/[view]/page.tsx" "app/(work)/page.tsx"
git mv "app/[view]/layout.tsx" "app/(work)/layout.tsx"
git mv "app/[view]/not-found.tsx" "app/(work)/not-found.tsx"
git mv "app/[view]/[...missing]/page.tsx" "app/(work)/[...missing]/page.tsx"
git mv "app/[view]/system/page.tsx" "app/(work)/system/page.tsx"
git mv "app/[view]/life/page.tsx" app/life/page.tsx
git mv "app/[view]/photos/page.tsx" app/life/photos/page.tsx
git mv "app/[view]/photos/[slug]/page.tsx" "app/life/photos/[slug]/page.tsx"
git rm -r "app/[view]"
```

`app/(work)/layout.tsx`:

```tsx
import { SiteShell } from "@/components/shell/site-shell";

// The Work side: home, and later /work/, /lab/, /resume/.
export default function WorkLayout({ children }: LayoutProps<"/">) {
  return <SiteShell>{children}</SiteShell>;
}
```

`app/(work)/page.tsx`:

```tsx
import { HomeSite } from "@/components/home/home-site";

export default function HomePage() {
  return <HomeSite />;
}
```

`app/life/layout.tsx` (Task 7 replaces the shell):

```tsx
import { SiteShell } from "@/components/shell/site-shell";

// The Life side. Task 7 swaps in the always-dark Life shell.
export default function LifeLayout({ children }: LayoutProps<"/life">) {
  return <SiteShell>{children}</SiteShell>;
}
```

The Work-side files need these edits:
- `app/(work)/[...missing]/page.tsx`: keep the body and update the comment to say "inside the Work layout".
- `app/(work)/not-found.tsx`: delete every `dashboard:` class.

Create `app/life/[...missing]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

// Unknown /life/... URLs 404 inside the Life layout. Cache Components needs
// at least one prerendered param; real misses render on demand.
export function generateStaticParams() {
  return [{ missing: ["not-found"] }];
}

export default function MissingLifePage() {
  notFound();
}
```

`app/life/not-found.tsx` is a copy of `app/(work)/not-found.tsx` with the link label changed to "Back to Life" and `href="/life/"`.

Then edit each moved page to drop the view param:
- **`app/life/page.tsx`:**
  - Remove `params`, `assertView`, `visibleSections`, `PanelGrid` and the dashboard branch.
  - Render `<main className="flex flex-col gap-16 pb-24 md:gap-24"><PageHeader title="Life" />{lifeSections.map((s) => <SectionBlock key={s.id} section={s} />)}</main>`.
  - The type is `PageProps<"/life">`, or no props.
- **`app/life/photos/page.tsx`:** remove the view logic and render the former site branch with `<PhotoGrid photos={photos} />`.
- **`app/life/photos/[slug]/page.tsx`:**
  - Types become `PageProps<"/life/photos/[slug]">`. Remove `assertView`, `View` and the dashboard branch.
  - Replace `SIZES` with a single string: `"(min-width: 1248px) 1200px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)"`.
  - Neighbour links point to `` `/life/photos/${photo.slug}/` ``.
- **`app/(work)/system/page.tsx`:**
  - Remove `params`/`assertView`, every `dashboard:` class, and the `Stat` and `Panel` specimens with their imports.
  - The DataTable specimen renders `<DataTable ... />` directly inside a `div className="grid w-full gap-4 md:grid-cols-2"`, without the `Panel` wrappers.
  - Add a "Sources" band at the end. Make the page `async`, read `const statuses = await readSourceStatuses();` (from `@/lib/sources/status`) and render `<Band label="Sources"><SourcesTable statuses={statuses} /></Band>`.

- [ ] **Step 7: Redirect the old photo URLs and drop the proxy**

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  trailingSlash: true,
  // Photos moved under the Life side in Sprint 4. 308 keeps old links and
  // the Eleventy-era URLs working.
  async redirects() {
    return [
      { source: "/photos/", destination: "/life/photos/", permanent: true },
      { source: "/photos/:slug/", destination: "/life/photos/:slug/", permanent: true },
    ];
  },
};

export default nextConfig;
```

```bash
git rm proxy.ts lib/view/views.ts lib/view/params.ts lib/view/transition.ts components/view-toggle.tsx components/shell/shell-fade.tsx components/shell/dashboard-shell.tsx components/home/home-dashboard.tsx components/home/work-index.tsx components/ui/panel.tsx components/ui/stat.tsx components/sources/source-health.tsx lib/activity.ts lib/sources/github-stats.ts tests/view.test.ts tests/activity.test.ts tests/sources/github-stats.test.ts
mkdir -p lib/theme && git mv lib/view/cookies.ts lib/theme/cookies.ts && git mv lib/view/theme.ts lib/theme/theme.ts
```

Then fix the fallout:
- Fix all imports of `@/lib/view/cookies` and `@/lib/view/theme`.
- `components/sources/sources-table.tsx` imported from `source-health`: inline whatever helper it used, or drop the column that needed it. The table must keep rendering one row per source with its status glyph, last success and last error.
- Update the comment in `lib/theme/cookies.ts`, which mentioned "view": both callers are now the theme toggle and the theme script.

- [ ] **Step 8: Simplify the shell and shared components**

- **`app/layout.tsx`:** remove the `ViewHistoryGuard` import and element. Change the `themeScript` import to `@/lib/theme/theme`.
- **`app/globals.css`:**
  - Delete the `@custom-variant dashboard` line.
  - Delete the `/* View switch ... */` block with the three `.shell-fade` rules.
  - Keep the reduced-motion `::view-transition-*` guard.
- **`components/shell/site-shell.tsx`:**
  - Remove `ViewToggle` and `ShellFade`; the outer element is the plain `div`.
  - The mobile `MenuDialog` loses `variant`.
  - `ShellControls` is rendered without props.
- **`components/shell/shell-controls.tsx`:** only the Theme row is left (`export function ShellControls()`).
- **`components/shell/menu-dialog.tsx`:**
  - Remove the `variant` prop and the slide-over classes, so it is always the full-screen variant.
  - The title row keeps `pl-4`.
  - Update the comment that said "A view switch hides this tree" to say "A navigation to the other side hides this tree".
- **`components/shell/nav-links.tsx`:** unchanged apart from imports.
- **`components/shell/page-header.tsx`:**

```tsx
import type { ReactNode } from "react";

// A page's title: a display headline with an optional mono meta line.
export function PageHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 pt-16 md:pt-24">
      <h1 className="type-display-64">{title}</h1>
      {meta ? <p className="type-mono-12 text-fg-muted">{meta}</p> : null}
    </header>
  );
}
```

- **`components/photos/photo-grid.tsx`:**

```tsx
import Link from "next/link";
import { Picture } from "@/components/picture";
import type { Photo } from "@/lib/content/photos";

// `sizes` must describe the grid below: 3 columns (24px gutters) in the
// 1200px container from md, 2 columns (16px) under 16px margins on mobile.
export const PHOTO_GRID_SIZES =
  "(min-width: 1248px) 384px, (min-width: 768px) calc((100vw - 96px) / 3), calc((100vw - 48px) / 2)";

// Thumbnails linking to each photo page. The visible title names the link,
// so the image itself is decorative (alt="").
export function PhotoGrid({ photos }: { photos: Photo[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
      {photos.map((photo) => (
        <li key={photo.slug}>
          <Link href={`/life/photos/${photo.slug}/`} className="group flex flex-col gap-2">
            <Picture image={photo.image} alt="" sizes={PHOTO_GRID_SIZES} className="aspect-[3/2] w-full object-cover" />
            <span className="type-sans-14 group-hover:underline group-hover:underline-offset-[0.2em]">{photo.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- **`components/home/lab-index.tsx`:** delete `LabPanel` and its imports (`Panel`, `DataTable`, `visibleColumns`, `TextLink` if unused).
- **`components/home/off-the-clock.tsx`:** its tile links stay `/life/#…`. They are correct.
- **`scripts/screenshots.ts`:**
  - Delete `VIEWS` and the view loop, and stop setting the view cookie.
  - The file name becomes `<page>-<width>-<theme>.png`.
  - Update the header comment.

- [ ] **Step 9: Update unit tests that referenced removed code**

- **`tests/ui/home.test.tsx`:** delete the `LabPanel` and `workColumns` cases and their imports. Keep the `LabBand`, `labIndexEntry` and `MetaLine` cases.
- **`tests/ui/layout-primitives.test.tsx`:** delete the `Panel`, `PanelGrid`, `Stat` and `StatRow` cases and their imports.
- **`tests/cookies.test.ts`:** change imports to `@/lib/theme/cookies` and `@/lib/theme/theme`. Delete any case about the view cookie or `resolveView`.

Run: `npm test`
Expected: PASS.

- [ ] **Step 10: Rewrite the e2e suites for one view**

```bash
git rm e2e/matrix.spec.ts e2e/transition.spec.ts e2e/view-and-theme.spec.ts
```

Create `e2e/theme.spec.ts`. Port the theme-only test from the deleted `view-and-theme.spec.ts` ("the theme cookie applies before paint and the toggle sets light, dark and auto") verbatim, then add:

```ts
test("a leftover view cookie from the old dashboard view is ignored", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "view", value: "dashboard", url: baseURL! }]);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-view]")).toHaveCount(0);
});

test("/photos/ URLs redirect permanently to /life/photos/", async ({ request }) => {
  const index = await request.get("/photos/", { maxRedirects: 0 });
  expect(index.status()).toBe(308);
  expect(index.headers()["location"]).toBe("/life/photos/");
  const photo = await request.get("/photos/stabilo/", { maxRedirects: 0 });
  expect(photo.status()).toBe(308);
  expect(photo.headers()["location"]).toBe("/life/photos/stabilo/");
});
```

Then edit the remaining suites:

- **`e2e/home.spec.ts`:** delete every test that visits `?view=dashboard` or clicks the View toggle.
- **`e2e/life.spec.ts`:**
  - Keep "site view renders a band for every section…": its id list is `films, books, articles, writing, github, photos`, and it asserts `sync-status` has count 0.
  - Keep the photos band test, with the `All` link's `href` changed to `/life/photos/`.
  - Delete the dashboard and toggle tests and the `/dashboard/life/` redirect test.
- **`e2e/photos.spec.ts`:**
  - Change every `/photos/<slug>/` visit to `/life/photos/<slug>/`, and `/photos/` to `/life/photos/`.
  - Delete "the dashboard photos grid declares its own sizes" and the dashboard title-bar test.
  - In "photo pages keep their URLs…", visit `/photos/stabilo/` and assert the final URL is `/life/photos/stabilo/` (the redirect).
- **`e2e/shell.spec.ts`:** keep the site shell test and the site menu tests. Delete the dashboard sidebar, slide-over and "switching view from the menu" tests. The site shell test no longer expects a Life nav link (no item is ready); assert the name links to `/`.
- **`e2e/not-found.spec.ts`:** delete the dashboard-shell 404 test and "an invalid view segment 404s". Change "an unknown photo 404s" to visit `/life/photos/nope/`.
- **`e2e/system.spec.ts`:** drop the per-view loop and test `/system/` once, also asserting the "Sources" band is visible.
- **`e2e/tokens.spec.ts`:** drop any view cookie setup.
- **`e2e-fixtures/home.spec.ts`:** delete "the dashboard home fills the metrics…".
- **`e2e-fixtures/life.spec.ts`:** delete "dashboard panels show…".

Then verify the leftovers are gone:

```bash
grep -rn "dashboard\|\[view\]\|ViewToggle\|ShellFade\|assertView\|lib/view/" app components lib tests e2e e2e-fixtures scripts
```

Expected: nothing except comments you then fix, plus `CLAUDE.md` and docs, which Task 8 updates.

- [ ] **Step 11: Full verification**

Run, in order:
1. `npm run typecheck && npm run lint && npm test`
2. `npm run build && npm run e2e`
3. `SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures`
4. `npm run build`

Expected: all green. In the build output, the route table lists `/`, `/system`, `/life`, `/life/photos` and `/life/photos/[slug]`, with no `[view]`.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Serve one rendering per URL and move Life and photos under /life/

Removes the site/dashboard view, its proxy, toggle, transition and the
dashboard shell. Work pages live under app/(work)/, Life under app/life/,
and /photos/ redirects permanently to /life/photos/.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 2: Tokens, fonts and the new type classes

Replace the S1 tokens and the Adobe/Fragment fonts with the Sprint 4 palette and IBM Plex Mono, IBM Plex Sans and Doto. Then replace the 17 S3 `type-*` classes with six new ones and migrate every usage. The layout stays as it is, so the result is today's pages in the new type and colour.

**Model:** sonnet (touches most components).

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`, `tests/tokens.test.ts`, `e2e/tokens.spec.ts`, plus every file that uses a `type-*`, `bg-surface` or `line-strong` class (find them with the grep in Step 6)

**Interfaces:**
- Produces:
  - Tailwind utilities `bg-bg`, `text-fg`, `text-fg-muted`, `text-fg-soft`, `bg-line`, `border-line`, `text-accent`, `bg-accent`, `bg-danger`, `bg-danger-bg`
  - type classes `type-name`, `type-lead`, `type-body`, `type-meta`, `type-label`, `type-boot`
  - CSS variables `--font-mono` (Plex Mono), `--font-sans` (Plex Sans), `--font-name` (Doto)
  - the attribute `[data-side="life"]`, which forces the dark palette on its subtree

- [ ] **Step 1: Write the failing token test**

Replace `tests/tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The Sprint 4 spec's colour table (§2). Changing a token means changing the
// spec and app/globals.css together.
const COLORS = {
  "--color-bg": { light: "#FAFAF8", dark: "#0B0B0C" },
  "--color-fg": { light: "#1F1F22", dark: "#EDEDED" },
  "--color-fg-muted": { light: "#6E6E73", dark: "#8A8A90" },
  "--color-fg-soft": { light: "#52525A", dark: "#B4B4BA" },
  "--color-line": { light: "#E6E6E1", dark: "#222225" },
  "--color-accent": { light: "#2F55F5", dark: "#6E8BFF" },
  "--color-danger": { light: "#D92D20", dark: "#F97066" },
  "--color-danger-bg": { light: "#FEF3F2", dark: "#2A0F0C" },
};

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

// The body of the first rule whose prelude starts with `prelude`, found by
// brace matching (the blocks we read contain no nested rules).
function block(prelude: string): string {
  const start = css.indexOf(prelude);
  if (start === -1) throw new Error(`globals.css has no "${prelude}" block`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function colorTokens(body: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--color-[a-z-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g)) {
    tokens[name] = value.toUpperCase();
  }
  return tokens;
}

const expected = (mode: "light" | "dark") =>
  Object.fromEntries(Object.entries(COLORS).map(([name, values]) => [name, values[mode]]));

describe("color tokens", () => {
  it("@theme declares exactly the light values", () => {
    expect(colorTokens(block("@theme static {"))).toEqual(expected("light"));
  });

  it('[data-theme="dark"] redefines every token with its dark value', () => {
    // Line start: the @custom-variant line also contains '[data-theme="dark"],'.
    expect(colorTokens(block('\n[data-theme="dark"],'))).toEqual(expected("dark"));
  });

  it("the no-JS prefers-color-scheme fallback matches the dark values", () => {
    expect(colorTokens(block(":root:not([data-theme]) {"))).toEqual(expected("dark"));
  });

  it("the Life side shares the dark rule, whatever the theme", () => {
    expect(css).toMatch(/\[data-theme="dark"\],\s*\[data-side="life"\]\s*\{/);
  });

  it("defines no shadows and only the control radius", () => {
    expect(css).not.toMatch(/box-shadow/);
    expect(css.match(/--radius-[a-z]+:/g)).toEqual(["--radius-control:"]);
  });

  it("defines exactly the six Sprint 4 type classes", () => {
    expect([...css.matchAll(/@utility (type-[a-z0-9-]+)/g)].map((m) => m[1])).toEqual([
      "type-name",
      "type-lead",
      "type-body",
      "type-meta",
      "type-label",
      "type-boot",
    ]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/tokens.test.ts`
Expected: FAIL. The values are still S1, and the S3 type classes are still there.

- [ ] **Step 3: Rewrite the token and type layer in `app/globals.css`**

Replace everything from the top of the file down to `@layer base {`, and the whole `@layer base` block, with:

```css
@import "tailwindcss";

/* docs/ holds plans whose code samples would otherwise ship as utilities. */
@source not "../docs";

/* Theme is an attribute, not a media query, so it can be toggled. The Life
   side forces the dark palette (data-side="life"), whatever the theme. */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *, [data-side="life"], [data-side="life"] *));

/* Design tokens (Sprint 4 spec §2). The defaults are cleared first, so only
   these exist: no palette colours, no shadows, one radius.
   tests/tokens.test.ts pins the values. */
@theme static {
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-shadow-*: initial;

  --color-bg: #FAFAF8;
  --color-fg: #1F1F22;
  --color-fg-muted: #6E6E73;
  --color-fg-soft: #52525A;
  --color-line: #E6E6E1;
  --color-accent: #2F55F5;
  --color-danger: #D92D20;
  --color-danger-bg: #FEF3F2;

  /* next/font (app/layout.tsx) defines the --font-plex-* and --font-doto
     variables; these fall back to system faces until the files load. */
  --font-mono: var(--font-plex-mono), ui-monospace, Menlo, monospace;
  --font-sans: var(--font-plex-sans), ui-sans-serif, system-ui, sans-serif;
  --font-name: var(--font-doto), var(--font-plex-mono), ui-monospace, monospace;

  /* Form controls only (buttons, inputs, toggles). Everything else is square. */
  --radius-control: 4px;
}

[data-theme="dark"],
[data-side="life"] {
  color-scheme: dark;
  --color-bg: #0B0B0C;
  --color-fg: #EDEDED;
  --color-fg-muted: #8A8A90;
  --color-fg-soft: #B4B4BA;
  --color-line: #222225;
  --color-accent: #6E8BFF;
  --color-danger: #F97066;
  --color-danger-bg: #2A0F0C;
}

/* Without JavaScript the theme script never sets data-theme, so follow the
   OS. Same values as the block above. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
    --color-bg: #0B0B0C;
    --color-fg: #EDEDED;
    --color-fg-muted: #8A8A90;
    --color-fg-soft: #B4B4BA;
    --color-line: #222225;
    --color-accent: #6E8BFF;
    --color-danger: #F97066;
    --color-danger-bg: #2A0F0C;
  }
}

/* SideSync (Task 7) sets html[data-side] while the Life side is mounted, so
   overscroll and the area around the page match it. */
html[data-side="life"] {
  color-scheme: dark;
  background-color: #0B0B0C;
}

@layer base {
  :root {
    color-scheme: light;
  }

  /* Structure comes from 1px rules: a bare `border` is a --color-line rule. */
  *,
  ::before,
  ::after,
  ::backdrop {
    border-color: var(--color-line);
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-fg);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.6154;
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background-color: var(--color-accent);
    color: #FFFFFF;
  }

  :focus-visible {
    outline: 1px solid var(--color-accent);
    outline-offset: 2px;
  }
}
```

Keep the existing reduced-motion block (`@media (prefers-reduced-motion: reduce) { ::view-transition-group(*), … }`).

Replace every `@utility type-*` block with these six:

```css
/* Type (Sprint 4 spec §2). Mono carries the page; Plex Sans the lead lines;
   Doto the name and Life headings. */
@utility type-name {
  font-family: var(--font-name);
  font-size: 1.375rem;
  line-height: 1;
  letter-spacing: 0.02em;
  font-weight: 900;
}
@utility type-lead {
  font-family: var(--font-sans);
  font-size: 1.25rem;
  line-height: 1.35;
  letter-spacing: -0.01em;
  font-weight: 600;
}
@utility type-body {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.6154;
  letter-spacing: 0;
  font-weight: 400;
}
@utility type-meta {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  letter-spacing: 0;
  font-weight: 400;
}
@utility type-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  line-height: 1.4545;
  letter-spacing: 0.02em;
  font-weight: 400;
}
@utility type-boot {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  line-height: 1.7143;
  letter-spacing: 0;
  font-weight: 400;
}
```

- [ ] **Step 4: Load the fonts in `app/layout.tsx`**

Replace the font section and the `<head>` contents:

```tsx
import type { Metadata } from "next";
import { Doto, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { OPEN_GRAPH_DEFAULTS, TWITTER_DEFAULTS } from "@/lib/metadata";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/theme/theme";
import "./globals.css";

// Self-hosted at build time. globals.css maps these variables to
// --font-mono, --font-sans and --font-name. latin-ext covers Turkish.
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-plex-mono",
});
const plexSans = IBM_Plex_Sans({
  weight: ["500", "600"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-plex-sans",
});
const doto = Doto({
  weight: "900",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-doto",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.title}` },
  // Pages that set their own openGraph/twitter use pageMetadata() to keep these.
  openGraph: { ...OPEN_GRAPH_DEFAULTS, title: site.title },
  twitter: { ...TWITTER_DEFAULTS, title: site.title },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by themeScript before hydration, so React must not
    // complain that the server HTML lacked it.
    <html
      lang="en"
      className={`${plexMono.variable} ${plexSans.variable} ${doto.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

If `next/font/google` rejects `latin-ext` for Doto, use `subsets: ["latin"]` for Doto only. The name is ASCII.

- [ ] **Step 5: Run the token test**

Run: `npx vitest run tests/tokens.test.ts`
Expected: PASS.

- [ ] **Step 6: Migrate every class usage**

Find them all:

```bash
grep -rnoE "type-(display|sans|mono)-[0-9]+(-medium)?|bg-surface|line-strong|font-display" app components
```

Apply this mapping, keeping the other classes on each element:

| Old | New |
|---|---|
| `type-display-160`, `type-display-96`, `type-display-64`, `type-display-40` | `type-lead` |
| `type-sans-28`, `type-sans-28-medium`, `type-sans-20`, `type-sans-20-medium` | `type-lead` |
| `type-sans-16`, `type-sans-14`, `type-sans-13`, `type-mono-13` | `type-body` |
| `type-sans-16-medium`, `type-sans-14-medium`, `type-sans-13-medium` | `type-body font-medium` |
| `type-mono-12` | `type-meta` |
| `type-mono-11` | `type-label` |
| `bg-surface` | `bg-bg` |
| `border-line-strong` | `border-line` |
| `font-display` | `font-sans` |

On `app/(work)/system/page.tsx`:
- Replace the `TYPE_STYLES` list with the six new classes and these samples:
  - `type-name`: "ONUR SENTURE"
  - `type-lead`: "Designer who builds."
  - `type-body`: "Body text in mono, 13 on 21."
  - `type-meta`: "May 2016–Apr 2026 · 2,133"
  - `type-label`: "LABEL · 11"
  - `type-boot`: "last watched: Love & Other Drugs 3.5"
- Replace `SWATCHES` with the eight Sprint 4 tokens, using literal classes: `bg-bg`, `bg-fg`, `bg-fg-muted`, `bg-fg-soft`, `bg-line`, `bg-accent`, `bg-danger` and `bg-danger-bg`.
- Update the band source strings to "6 styles" and "8 tokens".

In `components/ui/status-glyph.tsx` and anywhere else a glyph is set in `font-sans` for coverage reasons, keep `font-sans`. Plex Sans carries `●`, `○` and `×`. Check `◐` on `/system/` in a browser. If Plex Sans lacks it, the system fallback renders it, which is acceptable.

Then confirm nothing old is left:

```bash
grep -rnE "type-(display|sans|mono)-|bg-surface|line-strong|neue-haas|typekit|Fragment" app components lib
```

Expected: no output.

- [ ] **Step 7: Update the e2e token checks**

`e2e/tokens.spec.ts`:
- The light colours become `{ bg: "rgb(250, 250, 248)", fg: "rgb(31, 31, 34)" }`.
- The dark colours become `{ bg: "rgb(11, 11, 12)", fg: "rgb(237, 237, 237)" }`. The no-JS test uses the dark values too.
- Replace the font test with:

```ts
test("body text is IBM Plex Mono, lead lines Plex Sans, and the name Doto", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[href*="typekit"]')).toHaveCount(0);
  const fonts = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      body: getComputedStyle(document.body).fontFamily,
      mono: root.getPropertyValue("--font-mono"),
      sans: root.getPropertyValue("--font-sans"),
      name: root.getPropertyValue("--font-name"),
    };
  });
  expect(fonts.body).toContain("IBM Plex Mono");
  expect(fonts.sans).toContain("IBM Plex Sans");
  expect(fonts.name).toContain("Doto");
});
```

next/font names the families `'IBM Plex Mono'` and `'IBM Plex Sans'`, with a fallback suffix. The `toContain` checks tolerate that.

- [ ] **Step 8: Full verification and a visual look**

Run the full check list from Global Constraints.

Then run `npm run build && npm run screenshots -- /tmp/s4-t2 / /life/ /system/` and look at the PNGs. Everything should read in Plex Mono on the warm off-white (light) and near-black (dark), with no Helvetica left. The layout is unchanged, and that is expected.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Switch to IBM Plex and Doto with the Sprint 4 palette

Six type classes replace the S3 scale; the Adobe kit, Neue Haas and
Fragment Mono are gone. [data-side=\"life\"] forces the dark palette.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Vendor Dither Kit and teach it raw RGB colours

Copy Dither Kit's registry items into `components/dither-kit/` and add its dependencies. Then extend its colour type so callers can pass a raw `[r, g, b]` tuple. Our wrappers in Task 4 resolve the CSS tokens to RGB, which the kit's fixed palette cannot express.

**Model:** sonnet.

**Files:**
- Create: `components/dither-kit/*.ts(x)` (vendored), `components/dither-kit/README.md`, `scripts/vendor-dither-kit.ts`
- Modify: `package.json`, `package-lock.json`, `eslint.config.mjs`, `components/dither-kit/palette.ts`, `components/dither-kit/pixel.ts`, `components/dither-kit/avatar.tsx`, `components/dither-kit/chart-context.tsx`
- Test: `tests/dither-kit.test.ts`

**Interfaces:**
- Produces, from `@/components/dither-kit/*`:
  - `type Rgb = [number, number, number]`
  - `type DitherColorInput = DitherColor | Rgb`, accepted wherever a chart `config[key].color` is set
  - `seedOfColor(color: DitherColorInput): Seed`
  - `type PixelColor = DitherColor | number | Rgb`
  - `fillOf(color: PixelColor): Rgb`
  - `DitherGradient` (from `./gradient`) with props `from: PixelColor`, `to?`, `direction?: "up" | "down" | "left" | "right"`, `cell?: number`, `opacity?: number`, `bloom?`, `className?`
  - `DitherButton` (from `./button`) with props `color?: PixelColor`, `variant?: "gradient" | "dotted" | "hatched" | "solid"`, `bloom?`, plus every `<button>` prop
  - `DitherAvatar` (from `./avatar`) with props `name`, `hue?`, `color?: PixelColor` (new; overrides `hue`), `size?`, `mirror?`, `bloom?`, `animate?`, `className?`
  - `AreaChart` (from `./area-chart`) and `Area` (from `./area`)
  - `ChartConfig = Record<string, { label?: string; color: DitherColorInput }>`

- [ ] **Step 1: Write a reproducible vendoring script**

`scripts/vendor-dither-kit.ts`:

```ts
// Vendors Dither Kit (https://www.tripwire.sh/dither-kit, MIT) into
// components/dither-kit/. The kit ships as a shadcn registry; this project
// has no components.json, so the files are copied instead of installed.
//
//   npx tsx scripts/vendor-dither-kit.ts
//
// Re-running overwrites the vendored files: reapply the local changes listed
// in components/dither-kit/README.md afterwards.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ITEMS = ["core", "gradient", "button", "avatar", "area-chart"];
const BASE = "https://www.tripwire.sh/r";
const HEADER = (item: string) =>
  `// Vendored from Dither Kit (${BASE}/${item}.json), MIT licence.\n// Local changes: see components/dither-kit/README.md.\n`;

async function main() {
  const seen = new Set<string>();
  for (const item of ITEMS) {
    const response = await fetch(`${BASE}/${item}.json`);
    if (!response.ok) throw new Error(`${item}: HTTP ${response.status}`);
    const registry = (await response.json()) as { files: { path: string; content: string }[] };
    for (const file of registry.files) {
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      const out = join(process.cwd(), file.path);
      mkdirSync(dirname(out), { recursive: true });
      // Keep a leading "use client" directive first.
      const content = file.content.startsWith('"use client"')
        ? file.content.replace('"use client"\n', `"use client"\n\n${HEADER(item)}`)
        : HEADER(item) + file.content;
      writeFileSync(out, content);
      console.log(`wrote ${file.path}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Run: `npx tsx scripts/vendor-dither-kit.ts`
Expected: about 30 files written under `components/dither-kit/`, including `palette.ts`, `pixel.ts`, `gradient.tsx`, `button.tsx`, `avatar.tsx`, `area-chart.tsx`, `area.tsx`, `chart-context.tsx` and `dither-paint.ts`.

If the registry paths do not start with `components/dither-kit/`, stop and report. The script assumes they do.

- [ ] **Step 2: Add the dependencies and exclude the vendored code from lint**

```bash
npm install --save-exact motion d3-scale d3-shape clsx tailwind-merge
npm install --save-exact --save-dev @types/d3-scale @types/d3-shape
```

In `eslint.config.mjs`, add `"components/dither-kit/**"` to the `globalIgnores([...])` list, with the comment `// Vendored third-party code (Dither Kit, MIT).`

Create `components/dither-kit/README.md`:

```md
# Dither Kit (vendored)

Source: https://www.tripwire.sh/dither-kit (registry `https://www.tripwire.sh/r/<item>.json`,
repo `Boring-Software-Inc/dither-kit`). Licence: MIT, as declared in the
repository's package.json (the repository has no LICENSE file).

Vendored with `npx tsx scripts/vendor-dither-kit.ts`. Items: core, gradient,
button, avatar, area-chart. Not installed: bar, pie and radar charts.

Lint is skipped for this folder (eslint.config.mjs); typecheck still runs.

## Local changes (reapply after re-vendoring)

1. `palette.ts`: `DitherColorInput = DitherColor | Rgb`, and `seedOfColor`
   accepts an Rgb tuple (derives line and star by mixing toward white).
2. `pixel.ts`: `PixelColor` also accepts an Rgb tuple; `fillOf` passes it through.
3. `avatar.tsx`: a `color?: PixelColor` prop overrides the hue.
4. `chart-context.tsx`: `ChartConfig` colours are `DitherColorInput`.

Our wrappers live in `components/ui/` and resolve CSS tokens to Rgb.
```

- [ ] **Step 3: Write the failing test for raw RGB colours**

`tests/dither-kit.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PALETTE, seedOfColor } from "@/components/dither-kit/palette";
import { fillOf } from "@/components/dither-kit/pixel";

describe("Dither Kit colour inputs", () => {
  it("keeps the named palette", () => {
    expect(seedOfColor("blue")).toEqual(PALETTE.blue);
    expect(fillOf("blue")).toEqual(PALETTE.blue.fill);
  });

  it("accepts a raw rgb tuple as a fill", () => {
    expect(fillOf([47, 85, 245])).toEqual([47, 85, 245]);
  });

  it("derives a seed from a raw rgb tuple: line and star lighten toward white", () => {
    const seed = seedOfColor([47, 85, 245]);
    expect(seed.fill).toEqual([47, 85, 245]);
    expect(seed.line[0]).toBeGreaterThan(47);
    expect(seed.star[0]).toBeGreaterThan(seed.line[0]);
    for (const channel of [...seed.line, ...seed.star]) expect(channel).toBeLessThanOrEqual(255);
  });

  it("still treats a number as a hue", () => {
    expect(fillOf(228)).toHaveLength(3);
  });
});
```

Run: `npx vitest run tests/dither-kit.test.ts`
Expected: FAIL (a type error or a wrong value for the tuple cases).

- [ ] **Step 4: Apply the local changes**

In `components/dither-kit/palette.ts`, add below `export type Seed = …`:

```ts
/** A named palette colour or a raw rgb tuple (resolved from a CSS token). */
export type DitherColorInput = DitherColor | Rgb

const mixToWhite = ([r, g, b]: Rgb, t: number): Rgb => [
  Math.round(r + (255 - r) * t),
  Math.round(g + (255 - g) * t),
  Math.round(b + (255 - b) * t),
]

/** A seed for a raw colour: the fill as given, line and star lightened. */
export const seedOfRgb = (fill: Rgb): Seed => ({
  fill,
  line: mixToWhite(fill, 0.45),
  star: mixToWhite(fill, 0.7),
})
```

and replace `seedOfColor` with:

```ts
export const seedOfColor = (color: DitherColorInput): Seed =>
  Array.isArray(color) ? seedOfRgb(color) : PALETTE[color]
```

In `components/dither-kit/pixel.ts`:

```ts
/** A named palette colour, a raw hue (0–360) or an rgb tuple. */
export type PixelColor = DitherColor | number | Rgb
```

```ts
/** Resolve a {@link PixelColor} to its rgb fill. */
export function fillOf(color: PixelColor): Rgb {
  if (Array.isArray(color)) return color
  return typeof color === "number" ? hueFill(color) : PALETTE[color].fill
}
```

In `components/dither-kit/chart-context.tsx`, change the `ChartConfig` line to import and use `DitherColorInput`:

```ts
import type { DitherColorInput, Seed } from "./palette"
```

```ts
export type ChartConfig = Record<string, { label?: string; color: DitherColorInput }>
```

Fix any other place `typecheck` reports, such as `block-legend.tsx` or `polar-context.tsx`, which pass the config colour to `seedOfColor`. Those now accept `DitherColorInput` with no change, so typecheck should already pass.

In `components/dither-kit/avatar.tsx`:
1. Add `color?: PixelColor` to `DitherAvatarProps`, documented as "Overrides the hue with a fixed colour".
2. Thread it through `avatarModel(name, hue, mirror, color)`. Where the model computes `fill` from the hue, use `color !== undefined ? fillOf(color) : <existing hue fill>`. Import `fillOf` and `type PixelColor` from `./pixel`.
3. Destructure `color` in `DitherAvatar` and add it to the paint effect's dependency array. Pass a stable value: callers pass tuples whose identity changes per render, so depend on `color === undefined ? undefined : String(color)`, or `JSON.stringify(color)`.

- [ ] **Step 5: Run the test and typecheck**

Run: `npx vitest run tests/dither-kit.test.ts && npm run typecheck`
Expected: PASS, with no type errors (the vendored code must typecheck under our strict `tsconfig.json`). If a vendored file fails typecheck for a reason unrelated to these changes, fix the smallest thing and list it in the README's "Local changes" section.

- [ ] **Step 6: Full verification**

Run the full check list from Global Constraints. Nothing renders the kit yet, so the e2e results are unchanged.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Vendor Dither Kit and accept raw rgb colours

Gradient, button, avatar and the area chart from tripwire.sh (MIT), copied
by scripts/vendor-dither-kit.ts because the project has no shadcn setup.
Local changes let callers pass colours resolved from CSS tokens.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Dither components, the section row and weekly contributions

Build the primitives every later task composes:
- `useTokenColor`
- `DitherStrip`, `DitherRule` and `FooterWash`
- `MediaPlaceholder`, `PrimaryButton`, `LabAvatar` and `ContributionChart`
- `weeklyTotals`
- `SectionRow`, the three-column row

Show each one on `/system/`.

**Model:** sonnet.

**Files:**
- Create:
  - `components/ui/use-token-color.ts`
  - `components/ui/dither.tsx`, `components/ui/media-placeholder.tsx`, `components/ui/primary-button.tsx`, `components/ui/lab-avatar.tsx`, `components/ui/contribution-chart.tsx`, `components/ui/section-row.tsx`
  - `lib/sources/weekly.ts`
- Modify: `app/(work)/system/page.tsx`
- Test: `tests/weekly.test.ts`, `tests/ui/dither.test.tsx`, `e2e/system.spec.ts`

**Interfaces:**
- Consumes (Task 3): `DitherGradient`, `DitherAvatar` (with `color`), `AreaChart`, `Area`, `type Rgb`, `fnv1a` from `@/components/dither-kit/pixel`.
- Produces:
  - `parseHex(value: string): Rgb | null` and `useTokenColor(element: HTMLElement | null, token: `--color-${string}`): Rgb | null`, from `components/ui/use-token-color.ts`
  - `DitherStrip()`, `DitherRule({ className? })` and `FooterWash()`, from `components/ui/dither.tsx`
  - `MediaPlaceholder({ label, index, aspect?: "4/3" | "16/9" | "3/2", tone?: "accent" | "ink", image?, sizes? })`
  - `PrimaryButton({ href, children })`
  - `LabAvatar({ name, size? })`
  - `ContributionChart({ weeks })`
  - `weeklyTotals(data: Contributions): WeekTotal[]`, where `WeekTotal = { week: string; count: number }`
  - `SectionRow({ id?, label, action?, wide?, children, "data-section"? })`

- [ ] **Step 1: Write the failing tests**

`tests/weekly.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { weeklyTotals } from "@/lib/sources/weekly";
import type { Contributions } from "@/lib/sources/github";

const week = (start: string, counts: number[]) => ({
  days: counts.map((count, i) => ({ count, date: `${start.slice(0, 8)}${String(Number(start.slice(8)) + i).padStart(2, "0")}`, level: 0 })),
});

describe("weeklyTotals", () => {
  it("sums each week and labels it with its first day", () => {
    const data: Contributions = { total: 9, weeks: [week("2026-01-04", [1, 2, 0, 0, 0, 0, 0]), week("2026-01-11", [0, 0, 6, 0, 0, 0, 0])] };
    expect(weeklyTotals(data)).toEqual([
      { week: "2026-01-04", count: 3 },
      { week: "2026-01-11", count: 6 },
    ]);
  });

  it("keeps only the last 52 weeks", () => {
    const weeks = Array.from({ length: 53 }, (_, i) => ({ days: [{ count: i, date: `w${i}`, level: 0 }] }));
    const totals = weeklyTotals({ total: 0, weeks });
    expect(totals).toHaveLength(52);
    expect(totals[0]).toEqual({ week: "w1", count: 1 });
  });

  it("returns nothing for an empty calendar", () => {
    expect(weeklyTotals({ total: 0, weeks: [] })).toEqual([]);
  });
});
```

`tests/ui/dither.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import { SectionRow } from "@/components/ui/section-row";
import { parseHex } from "@/components/ui/use-token-color";

describe("parseHex", () => {
  it("reads 6- and 3-digit hex, with or without spaces", () => {
    expect(parseHex("#2F55F5")).toEqual([47, 85, 245]);
    expect(parseHex(" #fff ")).toEqual([255, 255, 255]);
    expect(parseHex("")).toBeNull();
    expect(parseHex("rgb(1,2,3)")).toBeNull();
  });
});

describe("MediaPlaceholder", () => {
  it("renders a labelled, decorative wash while there is no image", () => {
    const html = renderToStaticMarkup(<MediaPlaceholder label="PrimeOne" index={1} />);
    expect(html).toContain("FIG. 01 · PrimeOne");
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain("<picture");
  });

  it("renders the image instead once one is set (the Sprint 7 upload hook)", () => {
    const html = renderToStaticMarkup(<MediaPlaceholder label="Stabilo" index={2} image="photos/stabilo" />);
    expect(html).toContain("<picture");
    expect(html).not.toContain("FIG.");
  });
});

describe("SectionRow", () => {
  it("renders label, content and action in one section", () => {
    const html = renderToStaticMarkup(
      <SectionRow id="work" label="Work" action={<span>All</span>}>
        <p>content</p>
      </SectionRow>,
    );
    expect(html).toContain('id="work"');
    expect(html).toContain(">Work<");
    expect(html).toContain("<p>content</p>");
    expect(html).toContain("<span>All</span>");
  });
});
```

Run: `npx vitest run tests/weekly.test.ts tests/ui/dither.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 2: `lib/sources/weekly.ts`**

```ts
import type { Contributions } from "./github";

export interface WeekTotal {
  // The week's first day (YYYY-MM-DD), as GitHub returns it.
  week: string;
  count: number;
}

// Weekly sums for the contribution chart: the last 52 weeks of GitHub's
// 12-month calendar (it sometimes returns 53, the first one partial).
export function weeklyTotals(data: Contributions): WeekTotal[] {
  return data.weeks.slice(-52).map((week) => ({
    week: week.days[0]?.date ?? "",
    count: week.days.reduce((sum, day) => sum + day.count, 0),
  }));
}
```

- [ ] **Step 3: `components/ui/use-token-color.ts`**

```ts
"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Rgb } from "@/components/dither-kit/palette";

export function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

// Theme changes flip <html data-theme>; the Life side never changes, so the
// one observer covers both.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

// A colour token read from the element's computed style, so a subtree that
// redefines it (the Life side) gets its own value. Pass the element from a
// callback ref held in state (`const [el, setEl] = useState(null)` and
// `ref={setEl}`): null until mounted, so the canvas never paints on the
// server.
export function useTokenColor(element: HTMLElement | null, token: `--color-${string}`): Rgb | null {
  const value = useSyncExternalStore(
    subscribe,
    () => (element ? getComputedStyle(element).getPropertyValue(token) : ""),
    () => "",
  );
  return useMemo(() => parseHex(value), [value]);
}
```

- [ ] **Step 4: The dither components**

`components/ui/dither.tsx`:

```tsx
"use client";

import { useState } from "react";
import { DitherGradient } from "@/components/dither-kit/gradient";
import { cx } from "@/lib/cx";
import { useTokenColor } from "./use-token-color";

// 14px band across the top of every page: ink, solid along the top edge and
// dissolving downward (the spec's "fading" strip, with the kit's linear ramp).
export function DitherStrip() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const ink = useTokenColor(el, "--color-fg");
  return (
    <div ref={setEl} aria-hidden="true" className="relative h-3.5 w-full overflow-hidden">
      {ink ? <DitherGradient from={ink} direction="down" cell={2} opacity={0.85} /> : null}
    </div>
  );
}

// 4px section separator in the line colour.
export function DitherRule({ className }: { className?: string }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const line = useTokenColor(el, "--color-fg-muted");
  return (
    <div ref={setEl} aria-hidden="true" className={cx("relative h-1 overflow-hidden", className)}>
      {line ? <DitherGradient from={line} direction="down" cell={2} opacity={0.5} /> : null}
    </div>
  );
}

// 120px accent wash rising from the bottom of the page, under the footer.
export function FooterWash() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const accent = useTokenColor(el, "--color-accent");
  return (
    <div ref={setEl} aria-hidden="true" className="relative h-30 w-full overflow-hidden">
      {accent ? <DitherGradient from={accent} direction="up" cell={3} /> : null}
    </div>
  );
}

// The wash behind a MediaPlaceholder. Fills its positioned parent.
export function PlaceholderWash({ tone }: { tone: "accent" | "ink" }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const color = useTokenColor(el, tone === "accent" ? "--color-accent" : "--color-fg");
  return (
    <div ref={setEl} aria-hidden="true" className="absolute inset-0">
      {color ? (
        <DitherGradient from={color} direction={tone === "accent" ? "up" : "left"} cell={3} opacity={0.7} />
      ) : null}
    </div>
  );
}
```

Check that `DitherGradient` fills its positioned parent (the kit says it "fills its nearest positioned ancestor"). If it instead renders an in-flow block, add `className="absolute inset-0"` to each `DitherGradient` above.

`h-30` needs the default spacing scale. Tailwind v4's spacing is multiplicative, so `h-30` is 7.5rem = 120px.

`components/ui/media-placeholder.tsx`:

```tsx
import { Picture } from "@/components/picture";
import { cx } from "@/lib/cx";
import { PlaceholderWash } from "./dither";

const ASPECT = { "4/3": "aspect-[4/3]", "16/9": "aspect-[16/9]", "3/2": "aspect-[3/2]" } as const;

// A media slot. Until an image exists it renders a labelled dither wash,
// designed to look intentional because it stays live for a while; Sprint 7's
// admin upload sets `image` per slot.
export function MediaPlaceholder({
  label,
  index,
  aspect = "4/3",
  tone = "accent",
  image,
  sizes = "(min-width: 1024px) 234px, 50vw",
}: {
  label: string;
  index: number;
  aspect?: keyof typeof ASPECT;
  tone?: "accent" | "ink";
  image?: string;
  sizes?: string;
}) {
  if (image) {
    return <Picture image={image} alt="" sizes={sizes} className={cx("w-full border object-cover", ASPECT[aspect])} />;
  }
  return (
    <div className={cx("relative w-full overflow-hidden border", ASPECT[aspect])}>
      <PlaceholderWash tone={tone} />
      <span className="absolute bottom-2 left-2 bg-bg px-1.5 type-label text-fg">
        FIG. {String(index).padStart(2, "0")} · {label}
      </span>
    </div>
  );
}
```

`components/ui/primary-button.tsx`:

```tsx
import type { ReactNode } from "react";
import { DitherGradient } from "@/components/dither-kit/gradient";
import { isExternal } from "./text-link";

const WHITE: [number, number, number] = [255, 255, 255];

// The one call to action ("Book a call"): accent fill, a white dither
// highlight on the top third, white label. A link, not a <button>.
export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      rel={isExternal(href) ? "noopener noreferrer" : undefined}
      className="relative inline-flex h-9 items-center overflow-hidden rounded-control bg-accent px-3.5 type-body font-medium text-white hover:brightness-110"
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1/3">
        <DitherGradient from={WHITE} direction="down" cell={2} opacity={0.3} />
      </span>
      <span className="relative">{children}</span>
    </a>
  );
}
```

`DitherGradient` is a client component. Importing it into this server component is fine, because the white colour is a constant.

`components/ui/lab-avatar.tsx`:

```tsx
"use client";

import { useState } from "react";
import { DitherAvatar } from "@/components/dither-kit/avatar";
import { fnv1a } from "@/components/dither-kit/pixel";
import { useTokenColor } from "./use-token-color";

// A generative dither avatar for entries without an image, seeded by name.
// The hash picks accent or ink, so neighbours vary.
export function LabAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  const color = useTokenColor(el, fnv1a(name) % 2 ? "--color-accent" : "--color-fg");
  return (
    <span ref={setEl} aria-hidden="true" className="relative block shrink-0" style={{ width: size, height: size }}>
      {color ? <DitherAvatar name={name} color={color} size={size} /> : null}
    </span>
  );
}
```

`components/ui/contribution-chart.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Area } from "@/components/dither-kit/area";
import { AreaChart } from "@/components/dither-kit/area-chart";
import type { WeekTotal } from "@/lib/sources/weekly";
import { useTokenColor } from "./use-token-color";

// Weekly contributions as a dithered area: no axes, no legend, no
// interaction. The sentence next to it carries the number and period.
export function ContributionChart({ weeks }: { weeks: WeekTotal[] }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const accent = useTokenColor(el, "--color-accent");
  return (
    <div ref={setEl} aria-hidden="true" className="h-24 w-full">
      {accent ? (
        <AreaChart
          data={weeks}
          config={{ count: { label: "Contributions", color: accent } }}
          interactive={false}
          margins={{ top: 4, right: 0, bottom: 0, left: 0 }}
          className="h-full w-full"
        >
          <Area dataKey="count" variant="gradient" />
        </AreaChart>
      ) : null}
    </div>
  );
}
```

`components/ui/section-row.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// One section on the Sprint 4 grid: a 200px label column, a content column of
// up to 480px (`wide` lets content take the action column too) and a
// right-aligned action. Below lg the three stack.
export function SectionRow({
  id,
  label,
  action,
  wide = false,
  children,
  "data-section": dataSection,
}: {
  id?: string;
  label: ReactNode;
  action?: ReactNode;
  wide?: boolean;
  children: ReactNode;
  "data-section"?: string;
}) {
  return (
    <section id={id} data-section={dataSection} className="scroll-mt-20">
      <div className="grid gap-4 px-4 py-8 md:px-10 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7 lg:py-[30px]">
        <div className="type-body text-fg">{label}</div>
        <div className={cx("min-w-0", wide && "lg:col-span-2")}>{children}</div>
        {action && !wide ? <div className="type-meta text-fg-muted lg:text-right">{action}</div> : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Run the unit tests**

Run: `npx vitest run tests/weekly.test.ts tests/ui/dither.test.tsx`
Expected: PASS.

If importing the kit in Vitest's node environment fails because something touches `window` at module load, change the test to mock `@/components/dither-kit/gradient` with `vi.mock` returning `() => null`, and note why in a comment.

- [ ] **Step 6: Show them on `/system/`**

In `app/(work)/system/page.tsx`, add a `Band label="Dither"` before "Primitives" with these specimens:
- `<Specimen name="DitherStrip"><div className="w-full"><DitherStrip /></div></Specimen>`
- `<Specimen name="DitherRule"><div className="w-full"><DitherRule /></div></Specimen>`
- `<Specimen name="MediaPlaceholder">` with a 2-up grid:
  - `<MediaPlaceholder label="Placeholder" index={1} />`
  - `<MediaPlaceholder label="Placeholder" index={2} tone="ink" />`
- `<Specimen name="PrimaryButton"><PrimaryButton href="/system/">Book a call →</PrimaryButton></Specimen>`
- `<Specimen name="LabAvatar">` with five `<LabAvatar>`s named "alpha", "beta", "gamma", "delta" and "epsilon"
- `<Specimen name="ContributionChart"><div className="w-full max-w-120"><ContributionChart weeks={SAMPLE_WEEKS} /></div></Specimen>`
- `<Specimen name="FooterWash"><div className="w-full"><FooterWash /></div></Specimen>`

Define the generic sample at module level with no real facts:

```ts
// Generic sample shape for the specimen, not real data.
const SAMPLE_WEEKS = Array.from({ length: 52 }, (_, i) => ({
  week: `w${i}`,
  count: Math.round(20 + 15 * Math.sin(i / 5) + (i % 7) * 2),
}));
```

In `e2e/system.spec.ts`, assert:
- every specimen name above has a `[data-primitive="<Name>"]` element
- every `canvas` on the page is inside an `[aria-hidden="true"]` ancestor:

```ts
const unlabelled = await page.locator("canvas").evaluateAll((canvases) =>
  canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length,
);
expect(unlabelled).toBe(0);
```

- [ ] **Step 7: Look at it**

`npm run build && npm run screenshots -- /tmp/s4-t4 /system/`

Open the light and dark PNGs and compare the Dither band with `docs/superpowers/specs/2026-10-03-sprint-4-mockups/dir1-dither.html`:
- the strip and rule are fine-grained
- the placeholders are washes with readable labels
- the button label is legible over the highlight
- avatars use blue or ink
- the chart is a blue dithered area
- dark mode repaints in the dark colours (the light-to-dark screenshot pair proves the token read)

Also toggle the theme on `/system/` in a real browser (`npm run start`) and confirm the canvases repaint without a reload.

- [ ] **Step 8: Full verification and commit**

Run the full check list, then:

```bash
git add -A
git commit -m "Add the dither primitives, SectionRow and weekly contribution totals

Strip, rule, footer wash, media placeholder, primary button, Lab avatar
and contribution chart, all fed by colours read from the CSS tokens so
they follow the theme and the Life side.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Work and Life shells, the Life switch and its transition

Replace `SiteShell` with a Work shell and add a minimal, always-dark Life shell. Each has the dither strip, a header with the Life switch, and the new footer: a build line over the accent wash. The switch navigates between the two sides with a dim-to-black transition.

**Model:** sonnet. This task includes a spike: confirm that `<ViewTransition>` animates a `router.push` across two layouts.

**Files:**
- Create:
  - `lib/side.ts`, `lib/build-info.ts`
  - `components/life-switch.tsx`, `components/life/boot-flag.ts`
  - `components/shell/work-shell.tsx`, `components/shell/life-shell.tsx`, `components/shell/side-fade.tsx`, `components/shell/side-sync.tsx`
  - `tests/build-info.test.ts`, `e2e/life-switch.spec.ts`
- Delete: `components/shell/site-shell.tsx`
- Modify:
  - `components/shell/site-footer.tsx`, `components/shell/shell-controls.tsx`
  - `app/(work)/layout.tsx`, `app/life/layout.tsx`, `app/globals.css`, `next.config.ts`, `package.json` (version)
  - the `<main>` elements of `app/(work)/system/page.tsx`, `app/(work)/not-found.tsx`, `app/life/page.tsx`, `app/life/not-found.tsx`, `app/life/photos/page.tsx`, `app/life/photos/[slug]/page.tsx` and `components/home/home-site.tsx` (add side padding, because the shells no longer pad)
  - `e2e/shell.spec.ts`

**Interfaces:**
- Consumes (Task 4): `DitherStrip`, `FooterWash`.
- Produces:
  - `LIFE_ENTER = "life-enter"` and `LIFE_EXIT = "life-exit"`, from `lib/side.ts`
  - `buildInfo` and `buildLine(info?): string`, from `lib/build-info.ts`
  - `LifeSwitch({ on }: { on: boolean })`
  - `markBoot()`, `peekBoot(): boolean` and `takeBoot(): boolean`, from `components/life/boot-flag.ts` (Task 7's readout uses `peekBoot` and `takeBoot`)
  - `WorkShell({ children })` and `LifeShell({ children })`
  - `SideFade({ children })` and `SideSync({ side })`

- [ ] **Step 1: Write the failing build-info test**

`tests/build-info.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildLine } from "@/lib/build-info";

describe("buildLine", () => {
  it("joins version, build date and short commit", () => {
    expect(buildLine({ version: "2.0.0", date: "2026-10-03", commit: "a2c817a" })).toBe(
      "v2.0.0 · updated Oct 3, 2026 · commit a2c817a",
    );
  });

  it("leaves out what a local build doesn't have", () => {
    expect(buildLine({ version: "2.0.0", date: "", commit: "" })).toBe("v2.0.0");
  });
});
```

`formatDate` (in `lib/format.ts`) renders `Oct 3, 2026` (en, medium, Europe/Istanbul).

Run: `npx vitest run tests/build-info.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 2: Build info**

In `package.json`, set `"version": "2.0.0"`.

In `next.config.ts`, add at the top:

```ts
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
```

and in the config object:

```ts
  // Build metadata for the footer line (lib/build-info.ts). Inlined at build
  // time; the commit only exists on Vercel.
  env: {
    NEXT_PUBLIC_BUILD_VERSION: version,
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
    NEXT_PUBLIC_BUILD_COMMIT: (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7),
  },
```

`lib/build-info.ts`:

```ts
import { formatDate } from "./format";

export interface BuildInfo {
  version: string;
  // YYYY-MM-DD, or "" when unknown.
  date: string;
  // Short SHA, or "" outside Vercel.
  commit: string;
}

export const buildInfo: BuildInfo = {
  version: process.env.NEXT_PUBLIC_BUILD_VERSION ?? "0.0.0",
  date: process.env.NEXT_PUBLIC_BUILD_DATE ?? "",
  commit: process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "",
};

// "v2.0.0 · updated Oct 3, 2026 · commit a2c817a"; parts a build lacks are left out.
export function buildLine(info: BuildInfo = buildInfo): string {
  return [
    `v${info.version}`,
    info.date ? `updated ${formatDate(info.date)}` : null,
    info.commit ? `commit ${info.commit}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
```

Run: `npx vitest run tests/build-info.test.ts`
Expected: PASS.

- [ ] **Step 3: Side constants, boot flag and the switch**

`lib/side.ts`:

```ts
// React transition types the Life switch adds. Only transitions carrying one
// animate the side change; other navigations stay instant.
export const LIFE_ENTER = "life-enter";
export const LIFE_EXIT = "life-exit";
```

`components/life/boot-flag.ts`:

```ts
// The Life switch marks a client navigation into /life/ so the boot readout
// types itself in. A direct load never has the flag, so its server HTML is
// final. sessionStorage can throw (privacy modes); then there is no
// animation.
const KEY = "life-boot";

export function markBoot(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

// Reads the flag without clearing it (for a lazy useState initializer).
export function peekBoot(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// Reads and clears the flag.
export function takeBoot(): boolean {
  try {
    const set = sessionStorage.getItem(KEY) === "1";
    sessionStorage.removeItem(KEY);
    return set;
  } catch {
    return false;
  }
}
```

`components/life-switch.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { type KeyboardEvent, type MouseEvent, addTransitionType, startTransition } from "react";
import { LIFE_ENTER, LIFE_EXIT } from "@/lib/side";
import { cx } from "@/lib/cx";
import { markBoot } from "./life/boot-flag";

// The switch between the Work side (/) and the Life side (/life/). It is a
// real link, so it works without JavaScript and modified clicks open a tab;
// a plain click navigates with the side-change transition.
export function LifeSwitch({ on }: { on: boolean }) {
  const router = useRouter();
  const href = on ? "/" : "/life/";

  function go() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!on && !reduceMotion) markBoot();
    startTransition(() => {
      if (!reduceMotion) addTransitionType(on ? LIFE_EXIT : LIFE_ENTER);
      router.push(href);
    });
  }

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    go();
  }

  // role="switch" toggles on Space; Enter follows the link (onClick).
  function onKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    if (event.key !== " ") return;
    event.preventDefault();
    go();
  }

  return (
    <a
      href={href}
      role="switch"
      aria-checked={on}
      data-testid="life-switch"
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="group inline-flex items-center gap-2 type-meta text-fg-muted hover:text-fg"
    >
      <span>Life</span>
      <span
        aria-hidden="true"
        className={cx("relative h-[22px] w-10 rounded-full border transition-colors", on ? "border-accent bg-accent" : "bg-line")}
      >
        <span
          className={cx(
            "absolute top-px size-[18px] rounded-full border bg-white transition-[left]",
            on ? "left-[19px]" : "left-px",
          )}
        />
      </span>
    </a>
  );
}
```

The accessible name comes from the visible "Life" text.

- [ ] **Step 4: Transition plumbing**

`components/shell/side-fade.tsx`:

```tsx
import { type ReactNode, ViewTransition } from "react";
import { LIFE_ENTER, LIFE_EXIT } from "@/lib/side";

// Both shells' outer elements share the name "side", so the Life switch
// animates them as a pair: dim to black into Life, a short cross-fade back.
// default="none" keeps every other navigation still.
export function SideFade({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      name="side"
      share={{ [LIFE_ENTER]: "life-enter", [LIFE_EXIT]: "life-exit", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
```

`components/shell/side-sync.tsx`:

```tsx
"use client";

import { useEffect } from "react";

// Marks <html> while the Life side is mounted, so overscroll and the area
// around the page match it (globals.css: html[data-side="life"]). Hiding
// the tree after a navigation runs the cleanup.
export function SideSync({ side }: { side: "life" }) {
  useEffect(() => {
    document.documentElement.dataset.side = side;
    return () => {
      delete document.documentElement.dataset.side;
    };
  }, [side]);
  return null;
}
```

Add to `app/globals.css`, before the reduced-motion block:

```css
/* Life switch (components/shell/side-fade.tsx). Into Life: the Work page
   dims to black (250ms), then Life fades in. Back: a 200ms cross-fade. */
::view-transition-old(.life-enter) {
  animation: 250ms ease-in both side-dim;
}
::view-transition-new(.life-enter) {
  animation: 200ms ease-out 250ms both side-appear;
}
::view-transition-group(.life-exit),
::view-transition-old(.life-exit),
::view-transition-new(.life-exit) {
  animation-duration: 200ms;
  animation-timing-function: ease-out;
}
@keyframes side-dim {
  to {
    filter: brightness(0);
  }
}
@keyframes side-appear {
  from {
    opacity: 0;
  }
}
```

- [ ] **Step 5: The shells and the footer**

`components/shell/shell-controls.tsx`: keep only the Theme row. It is used in the Work menu dialog.

`components/shell/site-footer.tsx`:

```tsx
import { cacheLife } from "next/cache";
import { FooterWash } from "@/components/ui/dither";
import { profile, socialLinks } from "@/content/profile";
import { buildLine } from "@/lib/build-info";

// Pages are prerendered and the year changes once a year; a cached read
// keeps `new Date()` out of the render (Cache Components requires that).
async function copyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

// One mono line (build metadata, © and the social links) over the accent
// wash. The paddle slot is reserved for Sprint 11.
export async function SiteFooter() {
  const year = await copyrightYear();
  return (
    <footer className="mt-16">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 pb-4 type-meta text-fg-muted md:px-10">
        <p data-testid="build-line">{buildLine()}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>
            © {year} {profile.name}
          </span>
          {socialLinks().map((link) => (
            // The separator travels with the link after it, so a wrapped line
            // starts with "· Goodreads" instead of ending with a stray "·".
            <span key={link.label} className="flex gap-2 whitespace-nowrap">
              <span aria-hidden="true">·</span>
              <a href={link.href} rel="noopener noreferrer" className="hover:text-fg hover:underline">
                {link.label}
              </a>
            </span>
          ))}
        </p>
        <div data-slot="paddle" />
      </div>
      <FooterWash />
    </footer>
  );
}
```

`components/shell/work-shell.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { LifeSwitch } from "@/components/life-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { DitherStrip } from "@/components/ui/dither";
import { profile } from "@/content/profile";
import { readyItems } from "@/lib/nav";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { ShellControls } from "./shell-controls";
import { SideFade } from "./side-fade";
import { SiteFooter } from "./site-footer";

// The Work side: dither strip, a header with the dot-matrix name, the nav
// (once items are ready), the theme toggle and the Life switch, then the
// page and the footer. Pages pad themselves (SectionRow does).
export function WorkShell({ children }: { children: ReactNode }) {
  const name = (
    <Link href="/" className="type-name uppercase">
      {profile.name}
    </Link>
  );
  return (
    <SideFade>
      <div className="flex min-h-dvh flex-col bg-bg text-fg">
        <DitherStrip />
        <header className="flex h-16 items-center justify-between gap-6 px-4 md:px-10">
          {name}
          <div className="hidden items-center gap-5 md:flex">
            <NavLinks items={readyItems()} placement="bar" />
            <ThemeToggle />
            <LifeSwitch on={false} />
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <LifeSwitch on={false} />
            <MenuDialog title={name}>
              <div className="flex flex-col gap-8 p-4">
                <NavLinks items={readyItems()} placement="list" />
                <ShellControls />
              </div>
            </MenuDialog>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </SideFade>
  );
}
```

`components/shell/life-shell.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { LifeSwitch } from "@/components/life-switch";
import { DitherStrip } from "@/components/ui/dither";
import { profile } from "@/content/profile";
import { SideFade } from "./side-fade";
import { SideSync } from "./side-sync";
import { SiteFooter } from "./site-footer";

// The Life side: always dark (data-side="life" forces the dark tokens),
// whatever the theme. No theme toggle; the switch is on.
export function LifeShell({ children }: { children: ReactNode }) {
  return (
    <SideFade>
      <div data-side="life" className="flex min-h-dvh flex-col bg-bg text-fg">
        <SideSync side="life" />
        <DitherStrip />
        <header className="flex h-16 items-center justify-between gap-6 px-4 md:px-10">
          <Link href="/life/" className="type-name uppercase">
            {profile.name}
          </Link>
          <LifeSwitch on />
        </header>
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    </SideFade>
  );
}
```

Wire the layouts:
- `app/(work)/layout.tsx` renders `<WorkShell>{children}</WorkShell>`.
- `app/life/layout.tsx` renders `<LifeShell>{children}</LifeShell>` and its comment becomes "The Life side: always dark.".
- `git rm components/shell/site-shell.tsx`.

Because the shells no longer pad content, add `px-4 md:px-10` to the outer `<main>` of `app/(work)/system/page.tsx`, both `not-found.tsx` files, `app/life/page.tsx`, `app/life/photos/page.tsx`, `app/life/photos/[slug]/page.tsx` and `components/home/home-site.tsx`. Tasks 6 and 7 rewrite home and Life anyway.

- [ ] **Step 6: The e2e spec for the switch**

`e2e/life-switch.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("the Work side has the switch off; it navigates to the always-dark Life side and back", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "light", url: baseURL! }]);
  await page.goto("/");
  const off = page.getByRole("switch", { name: "Life" }).filter({ visible: true });
  await expect(off).toHaveAttribute("aria-checked", "false");
  await expect(page.locator('[data-side="life"]')).toHaveCount(0);

  await off.click();
  await expect(page).toHaveURL(/\/life\/$/);
  const life = page.locator('[data-side="life"]').filter({ visible: true });
  await expect(life).toBeVisible();
  // Dark tokens on the Life side even though the theme is light.
  await expect
    .poll(() => life.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe("rgb(11, 11, 12)");
  await expect(page.locator("html")).toHaveAttribute("data-side", "life");
  await expect(page.getByRole("switch", { name: "Life" }).filter({ visible: true })).toHaveAttribute("aria-checked", "true");

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-side", "life");
});

test("the switch is a real link (works without JavaScript)", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  await expect(page.getByRole("switch", { name: "Life" }).first()).toHaveAttribute("href", "/life/");
  await context.close();
});

test("Space toggles the focused switch", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("switch", { name: "Life" }).filter({ visible: true });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\/life\/$/);
});

test("the footer carries the build line", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("build-line")).toHaveText(/^v2\.0\.0 · updated [A-Z][a-z]{2} \d{1,2}, \d{4}/);
});
```

In `e2e/shell.spec.ts`:
- Update the shell test so the name link (`role=link`, name "Onur Senture") points to `/`.
- Assert the theme toggle and the Life switch are visible at desktop width.
- At 390px, the header shows the name, the Life switch and "Menu", and the menu holds the theme toggle.

- [ ] **Step 7: Spike check — does the transition run?**

`npm run build && npm run start`. In Chrome, on `/`, click the Life switch.
- Expected: the page dims to black for about 250ms, then Life fades in.
- Back to Work: a short cross-fade.
- With DevTools → Rendering → "Emulate prefers-reduced-motion: reduce": an instant swap.

Freeze-frame it: in DevTools → Animations, set the playback rate to 10%, click, and screenshot mid-dim.

If no view transition runs for `router.push` across the two layouts (the swap is instant without reduced motion), try first `startTransition(() => { addTransitionType(...); router.push(href, { scroll: true }); })` with the `ViewTransition` directly around `{children}` inside each layout file instead of inside the shell. If that does not work either, keep the instant swap, leave `SideFade` in place, and report it in the task summary as a known gap. Do not add `experimental.viewTransition` without reading `node_modules/next/dist/docs/` for it first.

- [ ] **Step 8: Full verification and commit**

Run the full check list, then:

```bash
git add -A
git commit -m "Add the Work and Life shells and the Life switch

The switch is a real link with role=switch; a click navigates with a
dim-to-black transition into the always-dark Life side. The footer shows
the build version, date and commit over the accent wash.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: The Work home page

Rebuild `/` as the spec's six rows: identity, work, experience, latest work, Lab and footer. Add inline organisation marks, the experience file tree, placeholder work tiles, the contribution chart and the Lab grid. Remove the S3 home pieces they replace.

**Model:** sonnet.

**Files:**
- Create:
  - `content/orgs.ts`, `content/experience.ts`
  - `components/ui/org-mark.tsx`
  - `components/home/bio.tsx`, `components/home/experience-tree.tsx`, `components/home/work-tiles.tsx`, `components/home/contributions-row.tsx`, `components/home/lab-grid.tsx`
- Modify: `content/profile.ts`, `components/home/home-site.tsx`, `app/(work)/system/page.tsx` (IndexRow specimen removal)
- Delete:
  - `components/home/off-the-clock.tsx`, `components/home/meta-line.tsx`, `components/home/lab-index.tsx`
  - `components/ui/index-row.tsx`, `lib/index-columns.ts`, `tests/index-columns.test.ts`
- Test: `tests/ui/home.test.tsx` (rewrite), `tests/content/experience.test.ts`, `tests/content/profile.test.ts`, `e2e/home.spec.ts` (rewrite), `e2e-fixtures/home.spec.ts` (rewrite)

**Interfaces:**
- Consumes:
  - Task 4: `SectionRow`, `DitherRule`, `MediaPlaceholder`, `LabAvatar`, `ContributionChart`, `weeklyTotals`, `PrimaryButton`
  - Task 1: `readyItems`, `NAV_ITEMS`
- Produces:
  - `OrgId`, `ORGS` and `OrgMark({ org })`
  - `ExperienceEntry` and `experience`
  - `formatSpan(start: string, end: string | null): string`
  - `BioSegment = string | { org: OrgId }` and `Profile.bio: BioSegment[][]`

**Copy note:** the lead, bio and captions below use only facts from Onur's LinkedIn (read 2026-10-03) and the approved S3 identity line. They ship as a draft for Onur to confirm on the PR preview.

- [ ] **Step 1: Write the failing tests**

`tests/content/experience.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { experience, formatSpan } from "@/content/experience";
import { ORGS } from "@/content/orgs";

describe("formatSpan", () => {
  it("formats month spans, with an open end as now", () => {
    expect(formatSpan("2016-05", "2026-04")).toBe("May 2016–Apr 2026");
    expect(formatSpan("2013-06", null)).toBe("Jun 2013–now");
  });
});

describe("experience", () => {
  it("lists the confirmed roles, newest start first, each with a known org", () => {
    expect(experience.map((e) => e.org)).toEqual(["orkestra", "primetek", "etiya"]);
    for (const entry of experience) expect(ORGS[entry.org]).toBeDefined();
  });

  it("nests PrimeTek's products under it", () => {
    const primetek = experience.find((e) => e.org === "primetek")!;
    expect(primetek.children.map((c) => c.title)).toEqual(["PrimeOne", "PrimeBlocks", "PrimeIcons", "Templates"]);
  });
});
```

Replace `tests/ui/home.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Bio } from "@/components/home/bio";
import { ExperienceTree } from "@/components/home/experience-tree";
import { LabGrid } from "@/components/home/lab-grid";
import { WorkTiles } from "@/components/home/work-tiles";
import { OrgMark } from "@/components/ui/org-mark";

const html = renderToStaticMarkup;

describe("OrgMark", () => {
  it("falls back to a decorative monogram while there is no logo file", () => {
    const markup = html(<OrgMark org="primetek" />);
    expect(markup).toContain(">P<");
    expect(markup).toContain('aria-hidden="true"');
  });
});

describe("Bio", () => {
  it("renders text with the org mark and name inline", () => {
    const markup = html(<Bio paragraphs={[["At ", { org: "orkestra" }, " since 2013."]]} />);
    expect(markup).toContain("At ");
    expect(markup).toContain("Orkestra Studios");
    expect(markup).toContain(">O<");
    expect(markup).toContain(" since 2013.");
  });
});

describe("ExperienceTree", () => {
  it("draws products as a tree under their org, last child with └─", () => {
    const markup = html(
      <ExperienceTree
        entries={[
          {
            org: "primetek",
            role: "Design lead",
            start: "2016-05",
            end: "2026-04",
            children: [
              { title: "PrimeOne", note: "design system" },
              { title: "PrimeIcons", note: "icon set" },
            ],
          },
        ]}
      />,
    );
    expect(markup).toContain("PrimeTek");
    expect(markup).toContain("May 2016–Apr 2026");
    expect(markup).toContain("├─");
    expect(markup).toContain("└─");
    expect(markup.indexOf("├─")).toBeLessThan(markup.indexOf("└─"));
  });
});

describe("WorkTiles", () => {
  it("renders one numbered placeholder per entry, at most four", () => {
    const entries = ["A", "B", "C", "D", "E"].map((title) => ({ title, meta: `${title} meta` }));
    const markup = html(<WorkTiles entries={entries} />);
    expect(markup).toContain("FIG. 01 · A");
    expect(markup).toContain("FIG. 04 · D");
    expect(markup).not.toContain("FIG. 05");
  });
});

describe("LabGrid", () => {
  it("renders nothing while empty and links only entries with a link", () => {
    expect(html(<LabGrid entries={[]} />)).toBe("");
    const markup = html(
      <LabGrid
        entries={[
          { title: "Linked", description: "d", href: "https://example.com", status: "wip" },
          { title: "Plain", description: "d", status: "wip", placeholder: true },
        ]}
      />,
    );
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).toContain("↗");
  });
});
```

Replace the second case in `tests/content/profile.test.ts` with:

```ts
  it("ships without a booking link until Sprint 8 sets one", () => {
    expect(profile.bookingUrl).toBeUndefined();
  });
```

Run: `npx vitest run tests/content tests/ui/home.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 2: Content**

`content/orgs.ts`:

```ts
// Organisations named on the site. `logo` is a path under public/ to a small
// monochrome SVG; until Onur supplies or approves one, OrgMark draws the
// monogram.
export type OrgId = "primetek" | "orkestra" | "etiya" | "bilkent";

export interface Org {
  name: string;
  monogram: string;
  logo?: string;
}

export const ORGS: Record<OrgId, Org> = {
  primetek: { name: "PrimeTek", monogram: "P" },
  orkestra: { name: "Orkestra Studios", monogram: "O" },
  etiya: { name: "Etiya", monogram: "e" },
  bilkent: { name: "Bilkent", monogram: "B" },
};
```

`content/experience.ts`:

```ts
import type { OrgId } from "./orgs";

// Roles and dates as on Onur's LinkedIn (read 2026-10-03). Only confirmed
// facts. Products link to their case studies once those exist (Sprint 5).
export interface ExperienceChild {
  title: string;
  note: string;
  href?: string;
}

export interface ExperienceEntry {
  org: OrgId;
  role: string;
  // YYYY-MM
  start: string;
  // YYYY-MM, or null while ongoing.
  end: string | null;
  children: ExperienceChild[];
}

export const experience: ExperienceEntry[] = [
  {
    org: "orkestra",
    role: "Co-founder, designer",
    start: "2013-06",
    end: null,
    children: [{ title: "Nebuu", note: "word game, iOS" }],
  },
  {
    org: "primetek",
    role: "Design lead",
    start: "2016-05",
    end: "2026-04",
    children: [
      { title: "PrimeOne", note: "design system" },
      { title: "PrimeBlocks", note: "UI blocks" },
      { title: "PrimeIcons", note: "icon set" },
      { title: "Templates", note: "25+ app templates" },
    ],
  },
  {
    org: "etiya",
    role: "Design specialist",
    start: "2014-04",
    end: "2016-03",
    children: [],
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function month(ym: string): string {
  const [year, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} ${year}`;
}

// "May 2016–Apr 2026", "Jun 2013–now".
export function formatSpan(start: string, end: string | null): string {
  return `${month(start)}–${end ? month(end) : "now"}`;
}
```

`content/profile.ts`:
- Remove `MetaSegment`, `identity`, `meta` and `metrics`.
- Add the import `import type { OrgId } from "./orgs";` and these types and fields, keeping `name`, `available`, `bookingUrl`, `social`, `SocialLink` and `socialLinks()`:

```ts
// A bio paragraph is text with inline organisation marks.
export type BioSegment = string | { org: OrgId };

export interface Profile {
  name: string;
  // The label column under the name.
  role: string;
  location: { place: string; timeZone: string };
  // The home h1: a strong opening and a muted continuation.
  lead: { strong: string; rest: string };
  bio: BioSegment[][];
  available: boolean;
  // "Book a call" renders only when this is set (Sprint 8).
  bookingUrl?: string;
  // Handles, not URLs; socialLinks() builds the URLs.
  social: {
    x: string;
    dribbble: string;
    github: string;
    goodreads: string;
    letterboxd: string;
    instapaper: string;
  };
}

export const profile: Profile = {
  name: "Onur Senture",
  role: "Designer who builds",
  location: { place: "Ankara", timeZone: "Europe/Istanbul" },
  // Draft copy (Sprint 4): facts from LinkedIn and the approved S3 identity
  // line; Onur confirms on the preview.
  lead: {
    strong: "Designer who builds.",
    rest: "From components to complete apps, designed and built end to end.",
  },
  bio: [
    [
      "For ten years I led design at ",
      { org: "primetek" },
      ", where I built the PrimeOne design system, PrimeBlocks, PrimeIcons and the templates behind PrimeVue, PrimeNG and PrimeReact.",
    ],
    [
      "Since 2013 I've also run ",
      { org: "orkestra" },
      ", where we made Nebuu, Rebound Line, Hi Jump and other iOS games and apps. Computer Science at ",
      { org: "bilkent" },
      ".",
    ],
  ],
  available: true,
  social: {
    x: "w00f",
    dribbble: "onursenture",
    github: "onursenture",
    goodreads: "onur",
    letterboxd: "onur",
    instapaper: "w00f",
  },
};
```

- [ ] **Step 3: Components**

`components/ui/org-mark.tsx`:

```tsx
import { ORGS, type OrgId } from "@/content/orgs";

// A 16px inline mark before an organisation's name. A monogram tile until a
// logo file exists. Decorative: the name always follows in text.
export function OrgMark({ org }: { org: OrgId }) {
  const { logo, monogram } = ORGS[org];
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- tiny local SVG
    return <img src={logo} alt="" aria-hidden="true" width={16} height={16} className="inline-block size-4 align-[-3px]" />;
  }
  return (
    <span
      aria-hidden="true"
      className="inline-grid size-4 place-items-center rounded-[4px] bg-fg align-[-3px] text-[9px] leading-none font-medium text-bg"
    >
      {monogram}
    </span>
  );
}
```

`components/home/bio.tsx`:

```tsx
import { Fragment } from "react";
import { OrgMark } from "@/components/ui/org-mark";
import { ORGS } from "@/content/orgs";
import type { BioSegment } from "@/content/profile";

// Bio paragraphs: justified mono with a 3ch first-line indent; an org renders
// as its mark plus its name, kept together on one line.
export function Bio({ paragraphs }: { paragraphs: BioSegment[][] }) {
  return (
    <>
      {paragraphs.map((segments, index) => (
        <p key={index} className="mb-2 indent-[3ch] text-justify type-body text-fg-soft">
          {segments.map((segment, i) =>
            typeof segment === "string" ? (
              <Fragment key={i}>{segment}</Fragment>
            ) : (
              <span key={i} className="whitespace-nowrap indent-0">
                <OrgMark org={segment.org} /> <span className="text-fg">{ORGS[segment.org].name}</span>
              </span>
            ),
          )}
        </p>
      ))}
    </>
  );
}
```

`components/home/experience-tree.tsx`:

```tsx
import { ItemLink } from "@/components/sections/item-link";
import { type ExperienceEntry, formatSpan } from "@/content/experience";
import { ORGS } from "@/content/orgs";

// Orgs with their products branching underneath, like a file tree.
export function ExperienceTree({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <ul className="flex flex-col gap-3 type-body">
      {entries.map((entry) => (
        <li key={entry.org}>
          <div className="flex items-baseline justify-between gap-4">
            <span>
              {ORGS[entry.org].name} <span className="text-fg-muted">· {entry.role}</span>
            </span>
            <span className="shrink-0 type-meta text-fg-muted">{formatSpan(entry.start, entry.end)}</span>
          </div>
          {entry.children.length > 0 ? (
            <ul aria-label={`${ORGS[entry.org].name} work`}>
              {entry.children.map((child, index) => (
                <li key={child.title} className="grid grid-cols-[3ch_13ch_1fr] text-fg-muted">
                  <span aria-hidden="true">{index === entry.children.length - 1 ? "└─" : "├─"}</span>
                  {child.href ? (
                    <ItemLink href={child.href} className="text-accent">
                      {child.title}
                    </ItemLink>
                  ) : (
                    <span className="text-fg">{child.title}</span>
                  )}
                  <span>{child.note}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
```

`components/home/work-tiles.tsx`:

```tsx
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import type { WorkEntry } from "@/content/work-index";

// The home Work row: one placeholder tile per entry (first four), 2-up, with
// a caption. Tiles link once Sprint 5 adds case studies (`href`).
export function WorkTiles({ entries }: { entries: WorkEntry[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {entries.slice(0, 4).map((entry, index) => (
        <li key={entry.title}>
          <MediaPlaceholder label={entry.title} index={index + 1} tone={index % 2 ? "ink" : "accent"} />
          <p className="mt-1.5 type-meta">
            {entry.title}
            {entry.meta ? <span className="text-fg-muted"> · {entry.meta}</span> : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
```

`components/home/contributions-row.tsx`:

```tsx
import { Empty } from "@/components/sections/empty";
import { ContributionChart } from "@/components/ui/contribution-chart";
import { readSource } from "@/lib/sources/read";
import { weeklyTotals } from "@/lib/sources/weekly";

// The figure always names its period, and comes from GitHub's own total.
export async function Contributions() {
  const { data } = await readSource("github");
  if (data.weeks.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-2">
      <p className="type-meta text-fg-muted">
        {data.total.toLocaleString("en-US")} contributions in the last 12 months
      </p>
      <ContributionChart weeks={weeklyTotals(data)} />
    </div>
  );
}
```

`components/home/lab-grid.tsx`:

```tsx
import { ItemLink } from "@/components/sections/item-link";
import { LabAvatar } from "@/components/ui/lab-avatar";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { isExternal } from "@/components/ui/text-link";
import type { LabEntry } from "@/content/lab-index";

const STATUS: Record<NonNullable<LabEntry["status"]>, { glyph: GlyphStatus; label: string }> = {
  live: { glyph: "ok", label: "live" },
  wip: { glyph: "late", label: "in progress" },
};

// Things Onur builds, three-up, each with a dither avatar from its name.
// Hidden while the list is empty.
export function LabGrid({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
      {entries.map((entry) => (
        <li key={entry.title} className="flex flex-col gap-1.5 type-body">
          <LabAvatar name={entry.title} />
          <span className="flex items-baseline gap-1.5">
            {entry.status ? <StatusGlyph status={STATUS[entry.status].glyph} label={STATUS[entry.status].label} /> : null}
            {entry.href ? (
              <ItemLink href={entry.href}>
                {entry.title}
                {isExternal(entry.href) ? <span aria-hidden="true"> ↗</span> : null}
              </ItemLink>
            ) : (
              <span>{entry.title}</span>
            )}
          </span>
          <span className="type-meta text-fg-muted">{entry.description}</span>
        </li>
      ))}
    </ul>
  );
}
```

`components/home/home-site.tsx`:

```tsx
import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { LiveClock } from "@/components/ui/live-clock";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SectionRow } from "@/components/ui/section-row";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { experience } from "@/content/experience";
import { labIndex } from "@/content/lab-index";
import { profile } from "@/content/profile";
import { workIndex } from "@/content/work-index";
import { NAV_ITEMS } from "@/lib/nav";
import { Bio } from "./bio";
import { Contributions } from "./contributions-row";
import { ExperienceTree } from "./experience-tree";
import { LabGrid } from "./lab-grid";
import { WorkTiles } from "./work-tiles";

// An "All →" style action, only once its section ships.
function SectionLink({ label, href }: { label: string; href: string }) {
  const item = NAV_ITEMS.find((i) => i.href === href);
  return item?.ready ? <TextLink href={href}>{label}</TextLink> : null;
}

// The Work home: identity, work, experience, latest work and Lab, separated
// by dither rules (Sprint 4 spec §4).
export function HomeSite() {
  const rows = [
    <SectionRow
      key="identity"
      id="identity"
      label={
        <>
          <span className="text-fg">{profile.role}</span>
          <br />
          <span className="text-fg-muted">
            {profile.location.place}, <LiveClock timeZone={profile.location.timeZone} place={profile.location.place} />
          </span>
        </>
      }
      action={
        profile.available ? (
          <span>
            Open to work <StatusGlyph status="ok" />
          </span>
        ) : undefined
      }
    >
      <h1 className="mb-2.5 type-lead">
        {profile.lead.strong} <span className="text-fg-muted">{profile.lead.rest}</span>
      </h1>
      <Bio paragraphs={profile.bio} />
      {profile.bookingUrl ? (
        <div className="mt-3.5">
          <PrimaryButton href={profile.bookingUrl}>Book a call →</PrimaryButton>
        </div>
      ) : null}
    </SectionRow>,
    <SectionRow key="work" id="work" label="Work" action={<SectionLink label="All work" href="/work/" />}>
      <WorkTiles entries={workIndex} />
    </SectionRow>,
    <SectionRow key="experience" id="experience" label="Experience" action={<SectionLink label="Resume" href="/resume/" />}>
      <ExperienceTree entries={experience} />
    </SectionRow>,
    <SectionRow
      key="latest"
      id="latest"
      label="Latest work"
      action={
        <a href={`https://github.com/${profile.social.github}`} rel="noopener noreferrer" className="hover:text-fg hover:underline">
          GitHub ↗
        </a>
      }
    >
      <Contributions />
    </SectionRow>,
    labIndex.length > 0 ? (
      <SectionRow key="lab" id="lab" label="Lab" action={<SectionLink label="All lab" href="/lab/" />}>
        <LabGrid entries={labIndex} />
      </SectionRow>
    ) : null,
  ].filter(Boolean);

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

`HomeSite` is a server component. `Contributions` is async, and rendering it inside the JSX works with React 19 server components. If typecheck rejects an async component in JSX, make `HomeSite` `async` and `await` the GitHub read there, passing data down instead.

Remove the side padding Task 5 added to `home-site.tsx`'s `<main>`: `SectionRow` pads itself.

- [ ] **Step 4: Delete what the home no longer uses**

```bash
git rm components/home/off-the-clock.tsx components/home/meta-line.tsx components/home/lab-index.tsx components/ui/index-row.tsx lib/index-columns.ts tests/index-columns.test.ts
```

In `app/(work)/system/page.tsx`, delete the IndexRow specimen and its import. In `tests/ui/layout-primitives.test.tsx`, delete the IndexRow cases.

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: e2e**

Replace `e2e/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("the home leads with the lead line, the role and a live Ankara clock", async ({ page }) => {
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toContainText("Designer who builds.");
  await expect(h1).toContainText("From components to complete apps, designed and built end to end.");
  await expect(page.getByLabel("Local time in Ankara")).toHaveText(/^\d{2}:\d{2}$/);
  await expect(page.locator("#identity")).toContainText("Open to work");
});

test("the bio names PrimeTek, Orkestra and Bilkent with inline marks", async ({ page }) => {
  await page.goto("/");
  const identity = page.locator("#identity");
  for (const name of ["PrimeTek", "Orkestra Studios", "Bilkent"]) await expect(identity).toContainText(name);
});

test("Work shows four numbered placeholders with captions, unlinked", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#work");
  for (const label of ["FIG. 01 · PrimeOne", "FIG. 02 · PrimeBlocks", "FIG. 03 · PrimeIcons", "FIG. 04 · Premium admin dashboards"]) {
    await expect(work).toContainText(label);
  }
  await expect(work.getByRole("link")).toHaveCount(0);
});

test("Experience is a tree with confirmed dates", async ({ page }) => {
  await page.goto("/");
  const tree = page.locator("#experience");
  await expect(tree).toContainText("Jun 2013–now");
  await expect(tree).toContainText("May 2016–Apr 2026");
  await expect(tree).toContainText("Apr 2014–Mar 2016");
  await expect(tree).toContainText("└─");
  await expect(tree.getByRole("list", { name: "PrimeTek work" }).getByRole("listitem")).toHaveCount(4);
});

test("Latest work shows the empty state without data, and links to GitHub", async ({ page }) => {
  await page.goto("/");
  const latest = page.locator("#latest");
  await expect(latest).toContainText("Nothing here yet.");
  await expect(latest.getByRole("link", { name: "GitHub ↗" })).toHaveAttribute("href", "https://github.com/onursenture");
});

test("Lab lists every entry with a decorative avatar; only linked entries link", async ({ page }) => {
  await page.goto("/");
  const lab = page.locator("#lab");
  await expect(lab).toContainText("onursenture.com");
  await expect(lab).toContainText("Project 02");
  await expect(lab.getByRole("link")).toHaveCount(1);
  await expect(lab.getByRole("img", { name: "in progress" })).toHaveCount(3);
});

test("every canvas on the home is decorative", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas").first()).toBeAttached();
  const unlabelled = await page
    .locator("canvas")
    .evaluateAll((canvases) => canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length);
  expect(unlabelled).toBe(0);
});
```

Replace `e2e-fixtures/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

// Runs against a SOURCE_FIXTURES=1 build (see e2e-fixtures/life.spec.ts).

test("Latest work shows GitHub's total with its period, and the chart", async ({ page }) => {
  await page.goto("/");
  const latest = page.locator("#latest");
  await expect(latest).toContainText("7 contributions in the last 12 months");
  await expect(latest.locator("canvas").first()).toBeAttached();
});
```

The fixture's `totalContributions` is 7.

- [ ] **Step 6: Look at it**

`SOURCE_FIXTURES=1 npm run build && npm run screenshots -- /tmp/s4-t6 /`, then `npm run build`.

Compare the 1440 light PNG with the mockup's light panel:
- the dot-matrix name sits top left and the switch top right
- the identity row has the label column, the lead plus justified mono bio, and "Open to work ●" on the right
- the dither rules sit between rows
- the Work tiles are 2-up placeholders with FIG. labels
- the Experience tree has blue product names only when linked (none yet, so black)
- the chart sits under its period line
- the Lab grid has avatars
- the footer wash is at the bottom

At 390 the three columns stack and nothing overflows horizontally. In dark, everything repaints.

- [ ] **Step 7: Full verification and commit**

Run the full check list, then:

```bash
git add -A
git commit -m "Rebuild the Work home on the Sprint 4 grid

Identity with inline org marks, placeholder work tiles, the experience
file tree, the dithered contribution chart and the Lab grid. Draft copy
from confirmed LinkedIn facts for Onur to review.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The Life side — boot readout, typewriter, sections and photos

Build `/life/` as the boot readout: a dithered portrait (or fallback), live-source lines and a typewriter on arrival from the switch. Below it, the existing sections become dark mono rows. Restyle the photo pages.

**Model:** sonnet.

**Files:**
- Create:
  - `lib/life/readout.ts`
  - `components/life/boot-readout.tsx`, `components/life/dither-portrait.tsx`
  - `lib/images/portrait.json`
- Modify:
  - `app/life/page.tsx`, `app/life/photos/page.tsx`, `app/life/photos/[slug]/page.tsx`
  - `components/sections/section-block.tsx`, `components/shell/page-header.tsx`
  - `scripts/images.ts`, `app/globals.css`
  - `app/(work)/system/page.tsx` (Band specimen removal)
- Delete: `components/ui/band.tsx`, after its last user is gone
- Test: `tests/life-readout.test.ts`, `e2e/life.spec.ts`, `e2e-fixtures/life.spec.ts`, `e2e/photos.spec.ts`

**Interfaces:**
- Consumes:
  - Task 5: `peekBoot()`, `takeBoot()`, `LifeShell`
  - Task 4: `SectionRow`, `DitherRule`, `LabAvatar`
  - existing: `readSource`, `getPhotos`, `formatRating`
- Produces:
  - `ReadoutLine = { key: string; label: string; value: string; detail?: string; href?: string }`
  - `buildReadout(input: ReadoutInput): ReadoutLine[]`
  - `BootReadout({ lines })`
  - `DitherPortrait()`

- [ ] **Step 1: Write the failing readout test**

`tests/life-readout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildReadout } from "@/lib/life/readout";

describe("buildReadout", () => {
  it("builds one line per source that has data, in readout order", () => {
    const lines = buildReadout({
      film: { title: "Love & Other Drugs", link: "https://letterboxd.com/x", ratingValue: 3.5 },
      book: { title: "Educated", author: "Tara Westover", link: "https://goodreads.com/x" },
      article: { title: "Taste for Makers", link: "https://paulgraham.com/x", domain: "paulgraham.com", minutes: 18 },
      photo: { title: "Night Boulevard", slug: "night-boulevard" },
      post: { title: "Hello", link: "https://w00f.org/hello" },
      contributions: { total: 2133, weeks: [{ days: [{ count: 1, date: "2026-01-04", level: 1 }] }] },
    });
    expect(lines.map((l) => `${l.label}: ${l.value}${l.detail ? ` ${l.detail}` : ""}`)).toEqual([
      "last watched: Love & Other Drugs 3.5",
      "reading: Educated Tara Westover",
      "saved: Taste for Makers paulgraham.com · 18 min",
      "last photo: Night Boulevard",
      "writing: Hello",
      "contributions, last 12 months: 2,133",
    ]);
    expect(lines.find((l) => l.key === "photo")!.href).toBe("/life/photos/night-boulevard/");
  });

  it("omits a source with no data instead of faking a line", () => {
    const lines = buildReadout({ film: undefined, contributions: { total: 0, weeks: [] } });
    expect(lines).toEqual([]);
  });

  it("never prints a star; an unrated film has no detail", () => {
    const [line] = buildReadout({ film: { title: "X", link: "https://l/x", ratingValue: null } });
    expect(line.detail).toBeUndefined();
    expect(JSON.stringify(line)).not.toContain("★");
  });
});
```

Check the real field names in `lib/sources/letterboxd.ts` (`Film`), `goodreads.ts` (`Book`), `instapaper.ts` (`Article`), `writing.ts` (`Post`) and `lib/content/photos.ts` (`Photo`). The input types below use `Pick<>` of those, so if a name differs (for example, `ratingValue` is not nullable), adjust the test's literals to match the real types, not the other way round.

Run: `npx vitest run tests/life-readout.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 2: `lib/life/readout.ts`**

```ts
import type { Photo } from "@/lib/content/photos";
import type { Contributions } from "@/lib/sources/github";
import type { Book } from "@/lib/sources/goodreads";
import type { Article } from "@/lib/sources/instapaper";
import type { Film } from "@/lib/sources/letterboxd";
import { formatRating } from "@/lib/sources/rating";
import type { Post } from "@/lib/sources/writing";

export interface ReadoutLine {
  key: string;
  label: string;
  value: string;
  detail?: string;
  href?: string;
}

export interface ReadoutInput {
  film?: Pick<Film, "title" | "link" | "ratingValue">;
  book?: Pick<Book, "title" | "author" | "link">;
  article?: Pick<Article, "title" | "link" | "domain" | "minutes">;
  photo?: Pick<Photo, "title" | "slug">;
  post?: Pick<Post, "title" | "link">;
  contributions?: Contributions;
}

// The Life boot readout: the newest item from each source. A source with no
// data drops its line (Sprint 4 spec §5); nothing is faked.
export function buildReadout(input: ReadoutInput): ReadoutLine[] {
  const lines: ReadoutLine[] = [];
  const { film, book, article, photo, post, contributions } = input;
  if (film) {
    const rating = formatRating(film.ratingValue);
    lines.push({ key: "film", label: "last watched", value: film.title, detail: rating || undefined, href: film.link });
  }
  if (book) lines.push({ key: "book", label: "reading", value: book.title, detail: book.author || undefined, href: book.link });
  if (article) {
    const detail = [article.domain, article.minutes ? `${article.minutes} min` : ""].filter(Boolean).join(" · ");
    lines.push({ key: "article", label: "saved", value: article.title, detail: detail || undefined, href: article.link });
  }
  if (photo) lines.push({ key: "photo", label: "last photo", value: photo.title, href: `/life/photos/${photo.slug}/` });
  if (post) lines.push({ key: "post", label: "writing", value: post.title, href: post.link });
  if (contributions && contributions.weeks.length > 0) {
    lines.push({
      key: "contributions",
      label: "contributions, last 12 months",
      value: contributions.total.toLocaleString("en-US"),
    });
  }
  return lines;
}
```

The spec draft said "commits"; this says "contributions" because that is what GitHub's total counts (honest-numbers rule).

Run: `npx vitest run tests/life-readout.test.ts`
Expected: PASS.

- [ ] **Step 3: The portrait**

Extend `scripts/images.ts`:
1. Skip `images-src/portrait.*` in the normal rendition walk: filter out the key `"portrait"`.
2. After the loop, if `images-src/portrait.jpg`, `.jpeg` or `.png` exists, write a 1-bit ordered-dither PNG to `public/images/portrait-dither.png`. Then write `lib/images/portrait.json` as `{ "src": "/images/portrait-dither.png", "width": 240, "height": 300 }`. Without a source, write `null`.

```ts
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

// Light-on-transparent 1-bit Bayer dither at 120×150 cells, scaled 2× with
// nearest-neighbour so each cell stays a crisp 2px block.
async function ditherPortrait(source: string, out: string) {
  const W = 120;
  const H = 150;
  const { data } = await sharp(source)
    .rotate()
    .resize(W, H, { fit: "cover", position: "attention" })
    .greyscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const lit = data[y * W + x] / 255 > BAYER4[y & 3][x & 3];
      const i = (y * W + x) * 4;
      rgba[i] = rgba[i + 1] = rgba[i + 2] = 237;
      rgba[i + 3] = lit ? 255 : 0;
    }
  }
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .resize(W * 2, H * 2, { kernel: "nearest" })
    .png()
    .toFile(out);
}
```

Commit `lib/images/portrait.json` with the content `null`. There is no source photo yet.

`components/life/dither-portrait.tsx`:

```tsx
import portrait from "@/lib/images/portrait.json";
import { LabAvatar } from "@/components/ui/lab-avatar";

// Onur's photo as a build-time 1-bit dither (scripts/images.ts). Until he
// supplies images-src/portrait.*, a dither avatar seeded "w00f" stands in.
export function DitherPortrait() {
  const data = portrait as { src: string; width: number; height: number } | null;
  if (!data) {
    return (
      <div className="flex h-[120px] w-24 items-end justify-center border p-2">
        <LabAvatar name="w00f" size={64} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a fixed-size 1-bit PNG; no responsive set needed
    <img src={data.src} alt="" aria-hidden="true" width={96} height={120} className="h-[120px] w-24 [image-rendering:pixelated]" />
  );
}
```

- [ ] **Step 4: The readout with its typewriter**

`components/life/boot-readout.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LiveClock } from "@/components/ui/live-clock";
import { isExternal } from "@/components/ui/text-link";
import type { ReadoutLine } from "@/lib/life/readout";
import { peekBoot, takeBoot } from "./boot-flag";

const BOOT = ["Booting w00f...", "Human detected."];
const DURATION = 1500;

function lineText(line: ReadoutLine): string {
  return `${line.label}: ${line.value}${line.detail ? ` ${line.detail}` : ""}`;
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// The Life boot readout. Server HTML is the complete, static text. After a
// client navigation from the Life switch (boot flag set), the boot and data
// lines type in over ~1.5s, ending on a blinking cursor. Reduced motion:
// static, no blink.
export function BootReadout({ lines }: { lines: ReadoutLine[] }) {
  const texts = useMemo(() => [...BOOT, ...lines.map(lineText)], [lines]);
  const total = texts.reduce((sum, t) => sum + t.length, 0);
  // null = show everything. A client navigation (no hydration) starts at 0
  // when the flag is set, so the full text never flashes first.
  const [shown, setShown] = useState<number | null>(() =>
    typeof window !== "undefined" && peekBoot() && !reducedMotion() ? 0 : null,
  );

  useEffect(() => {
    if (!takeBoot() || shown === null) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION);
      setShown(progress < 1 ? Math.round(progress * total) : null);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Runs once on mount; `shown` is only read for its initial value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // How much of text #index is visible.
  let budget = shown ?? Number.POSITIVE_INFINITY;
  const visible = texts.map((t) => {
    const n = Math.max(0, Math.min(t.length, budget));
    budget -= t.length;
    return n;
  });
  const typing = shown !== null;

  return (
    <div className="type-boot">
      <p>
        Local time: [<LiveClock timeZone="Europe/Istanbul" place="Ankara" /> GMT+3] Ankara
      </p>
      <div className="mt-6 text-fg-muted">
        {BOOT.map((t, i) => (
          <p key={t}>{t.slice(0, visible[i])}</p>
        ))}
      </div>
      <ul className="mt-6">
        {lines.map((line, i) => {
          const n = visible[BOOT.length + i];
          if (n === 0 && typing) return <li key={line.key} aria-hidden="true">&nbsp;</li>;
          const full = lineText(line);
          const head = `${line.label}: `;
          const value = full.slice(head.length, n).slice(0, line.value.length);
          const rest = full.slice(head.length + line.value.length, n);
          return (
            <li key={line.key}>
              {head.slice(0, n)}
              {n > head.length ? (
                line.href ? (
                  isExternal(line.href) ? (
                    <a href={line.href} rel="noopener noreferrer" className="underline decoration-fg-muted underline-offset-[3px] hover:decoration-fg">
                      {value}
                    </a>
                  ) : (
                    <Link href={line.href} className="underline decoration-fg-muted underline-offset-[3px] hover:decoration-fg">
                      {value}
                    </Link>
                  )
                ) : (
                  value
                )
              ) : null}
              {rest ? <span className="text-fg-muted">{rest}</span> : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-6">
        idle <span aria-hidden="true" className="boot-cursor inline-block h-[15px] w-2 translate-y-[3px] bg-fg" />
      </p>
    </div>
  );
}
```

Add to `app/globals.css`:

```css
/* Life readout cursor: a 1s step blink; still under reduced motion. */
.boot-cursor {
  animation: boot-blink 1s steps(1, end) infinite;
}
@keyframes boot-blink {
  50% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .boot-cursor {
    animation: none;
  }
}
```

Lint (`react-hooks/set-state-in-effect`) allows the `setShown` calls because they run inside `requestAnimationFrame` callbacks, not synchronously in the effect.

- [ ] **Step 5: `/life/` and the section rows**

`components/sections/section-block.tsx` now renders a `SectionRow`. The label is the title with `· source` in muted text, the action is an "All" link when `href` is set, and `wide` is on for the grid-heavy sections:

```tsx
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import type { AnySectionDefinition } from "./types";

const WIDE = new Set(["films", "books", "photos"]);

export async function SectionBlock({ section }: { section: AnySectionDefinition }) {
  const { data } = await section.load();
  const { Render } = section;
  return (
    <SectionRow
      id={section.id}
      data-section={section.id}
      wide={WIDE.has(section.id)}
      label={
        <>
          {section.title}
          {section.source ? <span className="text-fg-muted"> · {section.source}</span> : null}
        </>
      }
      action={section.href ? <TextLink href={section.href}>All</TextLink> : undefined}
    >
      <Render data={data} />
    </SectionRow>
  );
}
```

On a `wide` row the action column is taken by content, so put the "All" link under the label instead. In `SectionRow`, when `wide` and `action` are both set, render `action` inside the label cell below the label (`<div className="mt-1 type-meta text-fg-muted">{action}</div>`). Update `tests/sections.test.ts` and `tests/ui/dither.test.tsx` if they relied on the old position.

`components/sections/life.ts`: remove `github` (it lives on the Work side). The list is `[films, books, articles, writing, photos]`.

`app/life/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Fragment } from "react";
import { BootReadout } from "@/components/life/boot-readout";
import { DitherPortrait } from "@/components/life/dither-portrait";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { DitherRule } from "@/components/ui/dither";
import { getPhotos } from "@/lib/content/photos";
import { buildReadout } from "@/lib/life/readout";
import { pageMetadata } from "@/lib/metadata";
import { readSource } from "@/lib/sources/read";

export const metadata: Metadata = pageMetadata("Life");

export default async function LifePage() {
  const [films, books, articles, writing, github, photos] = await Promise.all([
    readSource("letterboxd"),
    readSource("goodreads"),
    readSource("instapaper"),
    readSource("writing"),
    readSource("github"),
    getPhotos(),
  ]);
  const lines = buildReadout({
    film: films.data[0],
    book: books.data.currentlyReading[0],
    article: articles.data[0],
    photo: photos[0],
    post: writing.data[0],
    contributions: github.data,
  });
  return (
    <main className="pb-8">
      <h1 className="sr-only">Life</h1>
      <section aria-label="Now" className="mx-auto grid max-w-[640px] gap-6 px-4 py-10 sm:grid-cols-[96px_1fr] md:py-14">
        <DitherPortrait />
        <BootReadout lines={lines} />
      </section>
      {lifeSections.map((section) => (
        <Fragment key={section.id}>
          <DitherRule className="mx-4 md:mx-10" />
          <SectionBlock section={section} />
        </Fragment>
      ))}
    </main>
  );
}
```

- [ ] **Step 6: Photo pages**

`components/shell/page-header.tsx`: the h1 becomes `className="type-name uppercase"` (Life headings are Doto), and the meta becomes `type-meta`. The header wrapper is `px-4 pt-10 md:px-10 md:pt-14`.

`app/life/photos/page.tsx`: `<main className="flex flex-col gap-10 pb-16"><PageHeader title="Photos" /><div className="px-4 md:px-10"><PhotoGrid photos={photos} /></div></main>`.

`app/life/photos/[slug]/page.tsx`:
- Wrap the content in `px-4 md:px-10`.
- The title is `type-name uppercase`, and the date line is `type-meta text-fg-muted` with the date in a `<time>`.
- The neighbours read "← Previous" and "Next →". Render the arrow as text on the label (`MetaLabel`), not on the link. The link label is the photo title, using `ItemLink`. Do not use `TextLink`, which adds its own arrow.
- Add a back link under the title: `<TextLink href="/life/photos/">All photos</TextLink>`.

- [ ] **Step 7: Remove Band**

Nothing renders `Band` now except the `/system/` specimens. Replace each `<Band label="…" source="…">` on `/system/` with `<SectionRow label="…">` (put the source in the label as `· source`), delete the Band specimen, then `git rm components/ui/band.tsx` and drop its cases from `tests/ui/layout-primitives.test.tsx`.

- [ ] **Step 8: e2e**

Replace `e2e/life.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("/life/ is the boot readout, then a row for every section, with empty states", async ({ page }) => {
  await page.goto("/life/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("Booting w00f...");
  await expect(now).toContainText("Human detected.");
  await expect(now).toContainText("idle");
  for (const id of ["films", "books", "articles", "writing", "photos"]) {
    await expect(page.locator(`[data-section="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-section="github"]')).toHaveCount(0);
  await expect(page.locator('[data-section="films"]')).toContainText("Nothing here yet.");
});

test("a direct load renders the readout complete, with no typing", async ({ page }) => {
  await page.goto("/life/");
  await expect(page.getByRole("region", { name: "Now" })).toContainText("Human detected.");
});

test("the photos row links every photo and its All link goes to /life/photos/", async ({ page }) => {
  await page.goto("/life/");
  const photos = page.locator('[data-section="photos"]');
  await expect(photos.locator("li a")).toHaveCount(5);
  await expect(photos.getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", "/life/photos/");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("arriving from the switch shows the readout at once", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("switch", { name: "Life" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/life\/$/);
    // No typing: the last boot line is complete immediately.
    await expect(page.getByRole("region", { name: "Now" }).filter({ visible: true })).toContainText("Human detected.", { timeout: 300 });
  });
});

test("arriving from the switch types the readout in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("switch", { name: "Life" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  const now = page.getByRole("region", { name: "Now" }).filter({ visible: true });
  // Mid-typing the last boot line is not complete yet; by ~1.5s it is.
  await expect(now).not.toContainText("Human detected.", { timeout: 200 });
  await expect(now).toContainText("Human detected.", { timeout: 3000 });
});
```

In `e2e-fixtures/life.spec.ts`:
- Keep the existing "site bands show real rows from every source" test. Rename it "Life rows show real items from every source", drop `github` from its id list, and keep its content assertions.
- Add:

```ts
test("the readout shows the newest item from each source", async ({ page }) => {
  await page.goto("/life/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("last watched: Love & Other Drugs 3.5");
  await expect(now).toContainText("reading: Harry Potter and the Deathly Hallows (Harry Potter, #7) J.K. Rowling");
  await expect(now).toContainText("saved: Jurassic Park computers in excruciating detail fabiensanglard.net · 13 min");
  await expect(now).toContainText("contributions, last 12 months: 7");
  await expect(now).not.toContainText("★");
});
```

In `e2e/photos.spec.ts`, update "photo pages link to the previous and next photo" to expect the labels "← Previous" and "Next →", with links to `/life/photos/<slug>/`.

- [ ] **Step 9: Look at it**

`SOURCE_FIXTURES=1 npm run build && npm run screenshots -- /tmp/s4-t7 /life/ /life/photos/ /life/photos/stabilo/`, then `npm run build`.

Compare `/life/` with the Life panel of the mockup:
- the page is dark even in the light-theme shots
- the portrait fallback avatar sits left of the readout
- underlined values; ratings without stars
- the dither rules sit between rows
- films and books grids are wide

Then freeze-frame the typewriter: in a real browser with DevTools at 10% animation speed, or in Playwright with `page.clock`. Click the switch on `/` and screenshot mid-line. The text must be cut mid-word with no layout jump: lines that have not started yet keep their height (`&nbsp;`).

- [ ] **Step 10: Full verification and commit**

Run the full check list, then:

```bash
git add -A
git commit -m "Build the Life side: boot readout, typewriter and dark section rows

/life/ opens on a readout of the newest item from each source beside a
dithered portrait (an avatar until a photo exists), typed in after the
switch and static on a direct load. Photo pages follow the Life style.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 8: Links, titles, 404s, `/system/` and the docs

Close the remaining spec items:
- `TextLink`'s arrows: `→` internal, `↗` external, never orphaned
- one source for the title format
- the 404 pages
- `/system/` as the Sprint 4 style tile, with a Life palette preview
- `CLAUDE.md`, the foundation roadmap and the S3 follow-ups

**Model:** sonnet.

**Files:**
- Modify:
  - `components/ui/text-link.tsx`, `lib/metadata.ts`, `app/layout.tsx`
  - `app/(work)/not-found.tsx`, `app/life/not-found.tsx`, `app/not-found.tsx`
  - `app/(work)/system/page.tsx`
  - `CLAUDE.md`, `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md`, `docs/superpowers/plans/2026-10-03-s3-followups.md`
- Test: `tests/ui/text-primitives.test.tsx`, `tests/metadata.test.ts`, `e2e/not-found.spec.ts`, `e2e/system.spec.ts`

**Interfaces:**
- Produces: `TITLE_TEMPLATE` and `fullTitle(title: string): string`, from `lib/metadata.ts`.

- [ ] **Step 1: Write the failing tests**

In `tests/ui/text-primitives.test.tsx`, replace the two `TextLink` cases:

```tsx
describe("TextLink", () => {
  it("ends internal links with a non-breaking → and keeps them internal", () => {
    const markup = html(<TextLink href="/life/">Life</TextLink>);
    expect(markup).toMatch(/^<a [^>]*href="\/life\/"/);
    expect(markup).not.toContain("rel=");
    // U+00A0 before the arrow, so it never wraps onto its own line.
    expect(markup).toContain(" →</span>");
  });

  it("ends external links with ↗ and adds rel=noopener noreferrer", () => {
    const markup = html(<TextLink href="https://letterboxd.com/onur/">Letterboxd</TextLink>);
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain(" ↗</span>");
    expect(markup).not.toContain("→");
  });
});
```

In `tests/metadata.test.ts`, add:

```ts
import { TITLE_TEMPLATE, fullTitle } from "@/lib/metadata";

describe("title format", () => {
  it("has one source for the root template and page metadata", () => {
    expect(TITLE_TEMPLATE).toBe("%s · Onur Senture");
    expect(fullTitle("Life")).toBe("Life · Onur Senture");
    expect(pageMetadata("Life").openGraph).toMatchObject({ title: fullTitle("Life") });
  });
});
```

(merge the import with the existing `pageMetadata` import).

Run: `npx vitest run tests/ui/text-primitives.test.tsx tests/metadata.test.ts`
Expected: FAIL.

- [ ] **Step 2: Implement**

`components/ui/text-link.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

// A link with a trailing arrow, underlined on hover: → inside the site, ↗
// when it leaves (Sprint 4 lifted the S3 ban; Plex has the glyph). A
// non-breaking space keeps the arrow with the last word. External links
// never pass the referrer or window.opener.
export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const external = isExternal(href);
  const content = (
    <>
      <span className="group-hover:underline group-hover:underline-offset-[0.2em]">{children}</span>
      <span aria-hidden="true">{external ? " ↗" : " →"}</span>
    </>
  );
  const classes = cx("group inline", className);
  return external ? (
    <a href={href} rel="noopener noreferrer" className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
```

`lib/metadata.ts`: add the following, and change `pageMetadata` to use `const fullTitleText = fullTitle(title);` in place of its own template literal:

```ts
// The one title format: the root layout's template and pageMetadata's Open
// Graph/Twitter titles both come from here.
export const TITLE_TEMPLATE = `%s · ${site.title}`;

export function fullTitle(title: string): string {
  return TITLE_TEMPLATE.replace("%s", title);
}
```

`app/layout.tsx`: `title: { default: site.title, template: TITLE_TEMPLATE }`, with `TITLE_TEMPLATE` imported from `@/lib/metadata`.

In Task 6's `home-site.tsx` and Task 6's `lab-grid.tsx`, delete the hand-written `↗` wherever a `TextLink` now adds it. The `GitHub ↗` anchor in `home-site.tsx` becomes `<TextLink href={`https://github.com/${profile.social.github}`}>GitHub</TextLink>`. Lab external links keep `ItemLink` (no arrow) plus their manual `↗`, because `ItemLink` adds none.

- [ ] **Step 3: 404s**

`app/(work)/not-found.tsx`:

```tsx
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";

// Rendered inside the Work layout, so a 404 keeps the shell.
export default function NotFound() {
  return (
    <main className="pb-16">
      <SectionRow label="404">
        <h1 className="mb-3 type-lead">Page not found.</h1>
        <p className="type-body text-fg-soft">
          Nothing lives at this address. <TextLink href="/">Back to home</TextLink>
        </p>
      </SectionRow>
    </main>
  );
}
```

`app/life/not-found.tsx` is the same, with "Nothing here. Not even a film." and `<TextLink href="/life/">Back to Life</TextLink>`.

`app/not-found.tsx` (paths outside both layouts) keeps `ThemeSync`. Its markup becomes the Work version above, wrapped in `<div className="min-h-dvh bg-bg text-fg">`.

Update `e2e/not-found.spec.ts`:
- `/nope/` shows "Page not found." inside the Work shell (the Life switch is visible).
- `/life/nope/` shows it inside the Life shell (`[data-side="life"]` is visible).
- Keep the theme-from-cookie test.

- [ ] **Step 4: `/system/` as the style tile**

In `app/(work)/system/page.tsx`:
- Use `SectionRow` and `DitherRule` for every block. Task 7 already removed Band.
- Show the six type classes with their samples, the eight colour swatches, the dither specimens from Task 4 and the remaining primitives (MetaLabel, StatusGlyph, Chip, EraStamp, TextLink internal and external, Button, Toggle, RelativeTime, LiveClock, Rating, Cover, DataTable, OrgMark, LifeSwitch on and off).
- Add a **Life palette** block: a `<div data-side="life" className="bg-bg p-6 text-fg">` containing the swatches again, a `type-boot` sample and a `MediaPlaceholder`. It proves the dark tokens and the dither repaint inside a Life subtree on a light page.
- Keep the Sources table block.

Every specimen keeps a `data-primitive="<Name>"` attribute.

Update `e2e/system.spec.ts`:
- every specimen name exists
- the Life palette block's computed background is `rgb(11, 11, 12)` under the light theme
- the page is `noindex`
- every canvas is inside `[aria-hidden="true"]`

- [ ] **Step 5: Docs**

Rewrite these sections of `CLAUDE.md` to match the code:
- the intro paragraph
- "Rules": remove every `[view]`, proxy, cookie-view and `dashboard:` rule. Add: "Two sides: Work (`app/(work)/`) and Life (`app/life/`, always dark via `data-side="life"`). The Life switch navigates between them; never link to a removed `/site/` or `/dashboard/` URL."
- "Design system (S3)" becomes "Design system (Sprint 4)". It covers:
  - the token table and type classes
  - IBM Plex Mono/Sans and Doto via next/font
  - Dither Kit vendored in `components/dither-kit/` (MIT, README, re-vendor with `scripts/vendor-dither-kit.ts`), and that `components/ui/` wrappers read token colours with `useTokenColor`
  - every canvas `aria-hidden`
  - `MediaPlaceholder`'s `image` hook for Sprint 7
  - `SectionRow`
  - the glyph rules (`→` internal, `↗` external, never `★`)
  - `/system/` as the style tile
- Delete the paragraphs about the view switch, `ViewHistoryGuard`, the proxy Cache-Control header, `IndexList` column collapsing, dashboard panel spans and the S1 Neue Haas details.
- "Commands": `npm run screenshots` is now "1440 + 390, both themes".
- "Images": add the portrait. Put a photo at `images-src/portrait.jpg` and run `npm run images`, which writes `public/images/portrait-dither.png` and `lib/images/portrait.json`.

In `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md`, replace the Roadmap table with the Sprint 4 spec's "Roadmap update" table and add one line above it:

> Revised 2026-10-03 (Sprint 4): sprints are named "Sprint N"; the S1 direction and the dashboard view were replaced (see `2026-10-03-sprint-4-visual-direction-design.md`).

In `docs/superpowers/plans/2026-10-03-s3-followups.md`, add a "Status after Sprint 4" section at the top. It lists which items Sprint 4 closed and which moved to Sprint 8, as in spec §7.

- [ ] **Step 6: Full verification and commit**

Run the full check list. Then `npm run screenshots -- /tmp/s4-t8 /system/ /nope/ /life/nope/` and look: the style tile reads cleanly in both themes, the Life palette box is dark on the light page, and the 404s sit inside their shells.

```bash
git add -A
git commit -m "Finish the Sprint 4 style tile, 404s, link arrows and docs

TextLink uses → inside the site and ↗ outside, never orphaned; one title
template; /system/ shows every primitive and a Life palette preview;
CLAUDE.md and the roadmap match the new structure.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Whole-sprint visual verification and follow-ups (controller)

The controller runs this task. It is not dispatched to a fresh implementer: it needs the whole-sprint context and judgment against the approved mockups.

- [ ] **Step 1: Screenshots of every page in every state**

```bash
SOURCE_FIXTURES=1 npm run build
npm run screenshots -- /tmp/s4-final / /life/ /life/photos/ /life/photos/stabilo/ /system/ /nope/
npm run build
```

Review all PNGs (1440 and 390, light and dark) against `docs/superpowers/specs/2026-10-03-sprint-4-mockups/dir1-dither.html`:
- no horizontal overflow at 390
- no text collisions
- labels readable over every dither surface
- Life always dark
- dither rules aligned to the 40px side margins

- [ ] **Step 2: Motion freeze-frames**

In a browser on `npm run start`:
1. Life switch Work → Life at 10% animation speed: dim mid-way, then the readout typing mid-line.
2. Life → Work cross-fade.
3. Theme toggle on `/`: every canvas repaints in the new colours without a reload, and with no layout shift (Performance panel: CLS ≈ 0).
4. Reduced motion: an instant swap and a static readout.

Write down anything wrong and fix it in a follow-up commit, or record it.

- [ ] **Step 3: Grep guards**

```bash
grep -rn "★" app components lib
grep -rniE "geist|space grotesk|instrument|neue-haas|typekit|fragment" app components lib
grep -rn "dashboard\|\[view\]\|lib/view/" app components lib tests e2e e2e-fixtures scripts
```

Expected: no output, apart from the docs and the vendored kit's own comments.

- [ ] **Step 4: Follow-ups file**

Create `docs/superpowers/plans/2026-10-03-sprint-4-followups.md`, in the same shape as the S3 one. It holds:
- the items deferred by reviews, labelled by sprint
- the pre-merge checks for Onur on the Vercel preview:
  1. the S3 CDN `curl` loop on `/` and `/life/`, now with no view cookie, expecting `HIT` on repeats
  2. confirm the draft copy (lead, bio, captions, experience notes)
  3. approve or supply the org logos
  4. supply a portrait photo if he wants one
  5. watch the Life switch transition on his machine

- [ ] **Step 5: Commit and hand off**

```bash
git add -A
git commit -m "Record the Sprint 4 follow-ups and pre-merge checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Then run the final whole-branch review (opus) before asking Onur about the PR.
