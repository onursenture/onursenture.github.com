# S3 Design System and Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the S1 visual direction into code on branch `v2`: design tokens and fonts, a set of `components/ui/` primitives with a `/system/` style tile, the site and dashboard shells (with a view-switch morph and in-shell 404s), the two-tier home page in both views, `/life` as bands and panels, and restyled photo pages with shared Open Graph defaults.

**Architecture:** Tokens are CSS custom properties in Tailwind v4's `@theme`, named exactly like the Figma variables; the Tailwind defaults (palette, text sizes, radii, shadows) are cleared so only tokens exist. Type comes from one utility class per Figma text style. Primitives are plain server components (client only where they need the clock or state). `app/[view]/layout.tsx` picks `SiteShell` or `DashboardShell` from the `view` param; the view toggle switches inside a React transition tagged `view-switch`, and a shared `<ViewTransition name="shell-nav">` morphs the top-bar nav into the sidebar. Pages keep reading data through the cached `readSource()`; anything that depends on the current time (relative times, the live clock, source health) is computed on the client, because every page is prerendered.

**Tech Stack:** Next.js 16.3.8 (App Router, `cacheComponents`, `proxy.ts`), React 19 (Next's built-in canary: `ViewTransition`, `addTransitionType`), TypeScript 5, Tailwind CSS v4, `next/font/google` (Fragment Mono), Adobe Fonts kit `jgu1ygn` (Neue Haas Grotesk), Vitest 5 (`react-dom/server` for component tests), Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-10-03-s3-design-system-shell-design.md` (with `2026-10-02-s1-visual-direction-design.md` for token values). Figma style tile: file `GJAOUY4DJdPgvPgfNZRsst`.

## Errata (applied during execution)

- **Task 6 (2026-10-03).** The nav morph described below was replaced by a whole-page cross-fade, at Onur's decision after the task review. React sets `view-transition-name: none` on `<html>` when no boundary covers the root, so the content never cross-faded, and the nav snapshot stretched between the bar and the list. `ShellMorph` / `shell-morph.tsx` / the `shell-nav` name became `ShellFade` / `shell-fade.tsx` / the `shell` name, which wraps each shell's outer element. Where the text below says "morph", `shell-nav` or `ShellMorph`, read the cross-fade. See the S1 and S3 specs' revised motion lines and commit 0d6963b.
- **Task 5 (2026-10-03).** A review fix (8a9facc) moved the site bar height onto the bordered `<header>`, added a matchMedia close to `MenuDialog`, and changed the slide-over header padding, the wash and the footer separators. Later tasks that "Replace" those files keep these fixes.

## Notes from the planning spike (record these in the spec)

Every code block below was run in a throwaway worktree of `v2`, task by task, with the full verification at each step.

**View transition: it works on Next 16.3.8 with `cacheComponents`, so Task 6 implements it.**
- Tried: both desktop navs wrapped in `<ViewTransition name="shell-nav" share={{ "view-switch": "shell-morph", default: "none" }} default="none">`, and the toggle calling `startTransition(() => { addTransitionType("view-switch"); router.refresh(); })`.
- Result in Chromium: exactly one `document.startViewTransition` per toggle. It animates `::view-transition-group(shell-nav)` and the root snapshot, both at 250ms. Navigations start no transition. With `prefers-reduced-motion`, the toggle skips `addTransitionType`, so no `<ViewTransition>` activates and React never starts one.
- No config flag is needed: the App Router ships React canary, which exports `ViewTransition` and `addTransitionType`. `@types/react` 19.3 types both. There is no `experimental.viewTransition` setting.
- Also tried: a second `<ViewTransition>` around the page content, with enter/exit classes, to cross-fade it. It never fired, because React reconciles that wrapper as an update at the same tree position. The root snapshot already cross-fades everything that isn't named, so the content wrapper was dropped.
- Back/forward after a toggle shows the chosen view. `router.refresh()` drops the stale cached tree.

**Other findings the tasks rely on**
- After a view toggle or a client navigation, Next keeps the previous tree mounted but hidden (React `<Activity>`). Two `[data-view]` trees, two sets of toggles and duplicate `data-testid`s then sit in the DOM. Hence:
  - e2e tests click through role locators, which skip hidden elements, or filter with `:visible`.
  - The mobile menu closes its modal `<dialog>` in an effect cleanup, or the newly visible page would stay inert.
- While prerendering, `usePathname()` returns the rewritten path (`/site/life/`); after hydration it returns the browser's `/life/`. `lib/nav.ts` compares paths with the view prefix stripped, so the active nav item hydrates without a mismatch.
- `notFound()` in a route whose param was not prerendered (`app/[view]/[...missing]`, an unknown photo slug) returns status 404, but the body is an "error shell" that React renders on the client. The root layout's inline theme script never runs there. `ThemeToggle` therefore re-applies the theme cookie on mount (Task 7). S2's unknown-photo 404 already had this shape. Awaiting `params` first does not change it.
- `new Date()` is allowed inside a `"use cache"` function. The footer's copyright year uses that, with `cacheLife("days")`.
- `next/link` renders under `react-dom/server` in Vitest. Set `__NEXT_TRAILING_SLASH` in the Vitest env so its hrefs keep the trailing slash.

## Deviations from the spec (for the controller)

1. **Type class names follow Figma:** `type-sans-28`, not the spec's `type-text-28`. The Figma text styles are named `display/*`, `sans/*` and `mono/*`, and the S3 constraint is "names identical to Figma". The display classes add `type-display-160`, which the S1 spec requires and the tile lacks. Figma's `mono/*-medium` styles map to weight 400, so they get no classes.
2. **Display line-height is 0.95,** as in the tile and inside S1's "0.92–1.0" range. The S1 "notes from building the tile" say 1.05, which predates the Neue Haas revision.
3. **`Button` has three variants:** `primary` (inverted), `ghost` (Figma "Outline", 1px `line-strong`) and `text` (Figma "Text", used for "Menu"). The spec names only primary and ghost.
4. **The `Panel` title uses `type-sans-13-medium`,** as in the tile, not a mono `MetaLabel`. The count and the right-hand slot are mono 11.
5. **Some logic moves to the first task that needs it.**
   - `lib/sources/health.ts` lands with the shells (Task 5), because the sidebar sync line uses it. Its Vitest test lands there too.
   - `lib/sources/stars.ts` lands with the home page (Task 8), because "Off the clock" shows stars.
6. **Health is computed on the client.** Pages are prerendered and have no clock. Until hydration, a source that has synced at least once counts as ok (●). After hydration the real ●/◐ shows. Never-synced (○) is the same everywhere.
7. **The no-photo Open Graph pages** also set `og:title` to "`<Title> · Onur Senture`" and `twitter:title`. There is no sitemap yet, so "/system/ is left out of the sitemap" needs no code.
8. **The "Off the clock" tiles are all 2:3:** cover, poster, cropped photo and a text box. This keeps the strip even.

## Test counts at the end of each task

| After task | Vitest (files / tests) | `npm run e2e` | `npm run e2e:fixtures` |
|---|---|---|---|
| start (S2) | 18 / 80 | 17 | 2 |
| 1 | 19 / 84 | 20 | 2 |
| 2 | 20 / 100 | 20 | 2 |
| 3 | 21 / 111 | 23 | 2 |
| 4 | 22 / 115 | 24 | 2 |
| 5 | 25 / 126 | 29 | 2 |
| 6 | 25 / 126 | 32 | 2 |
| 7 | 25 / 126 | 36 | 2 |
| 8 | 27 / 133 | 40 | 3 |
| 9 | 28 / 137 | 42 | 4 |
| 10 | 29 / 139 | 43 | 4 |
| 11 | 30 / 143 | 46 | 4 |
| 12 | 30 / 143 | 53 | 4 |

## Global Constraints

- All work happens on branch **`v2`**. Never commit to `master`.
- Node **24** (`engines.node: "24.x"`; CI uses Node 24).
- Pinned versions stay as they are: `next@16.3.8`, `eslint-config-next@16.3.8`, `react@19.2.8`, `tailwindcss@4.3.3`, `vitest@5.0.3`, `@playwright/test@1.63.0`, and the rest of `package.json`. `.npmrc` has `save-exact=true`.
- **No new dependencies.** S3 needs none. Do not add a component library, `clsx`/`tailwind-merge` (use `cx` from `lib/cx.ts`), an icon set, or `@testing-library/*` (component tests use `react-dom/server`).
- **This is Next.js 16, not the version in your training data.**
  - The middleware file is `proxy.ts`.
  - `cacheComponents` replaces `dynamicIO`/`ppr`, and route segment config (`dynamicParams`, `revalidate`) is not allowed.
  - Before using any Next.js API this plan doesn't spell out, read the matching guide in `node_modules/next/dist/docs/`, as `AGENTS.md` instructs.
- `cacheComponents: true`. Page data comes from `"use cache"` functions. Pages and layouts never call `cookies()`, `headers()`, `new Date()` or `Date.now()` during render. Anything that needs the current time runs on the client (`useNow`) or inside `"use cache"`.
- `trailingSlash: true`. Every internal link ends with `/`.
- Fail soft. Page data never throws on a missing database or snapshot; it renders the empty shape. Widgets must render with empty data.
- UI copy is English only.
- **Tokens and type:**
  - Token names are identical to the Figma variables: `--color-bg`, `--color-surface`, `--color-fg`, `--color-fg-muted`, `--color-line`, `--color-line-strong`, `--color-danger`, `--color-danger-bg`, `--radius-control`.
  - Type classes are identical to the Figma text styles, as `type-display-*`, `type-sans-*[-medium]` and `type-mono-*`.
  - Never use Tailwind's default palette, text sizes or font utilities (Task 1 removes them). Use the token utilities (`bg-bg`, `text-fg`, `text-fg-muted`, `bg-surface`, `border` = a `--color-line` rule, `border-line-strong`) and the `type-*` classes.
- **Shape:**
  - Square corners everywhere except form controls, which use `rounded-control` (4px).
  - No shadows.
  - Monochrome. `--color-danger` and `--color-danger-bg` are for errors only.
- **Glyphs:**
  - No icons. Use typographic glyphs only: `→` (link or call to action, internal and external), `●` (ok, live), `○` (empty), `◐` (late, partial, wip) and `×` (close). Rating stars `★½` are data, not UI.
  - Never use `↗`: Neue Haas Grotesk has no such glyph.
- **Fonts:**
  - Neue Haas Grotesk Display and Text come from the Adobe kit `jgu1ygn`. Its display weights are shifted, so 65 Medium is `font-weight: 600`.
  - Fragment Mono comes from `next/font/google`.
  - The fallback is `"Helvetica Neue", Helvetica, Arial, sans-serif`.
  - Never use the S1 "faces to avoid".
- **Content:**
  - Publish only confirmed facts. Use the content files exactly as given: `content/profile.ts`, `content/work-index.ts` and `content/lab-index.ts`.
  - Never invent years, roles, eras, links, metrics or copy. Sample values on `/system/` are visibly generic ("Year", "Role").
- External links get `rel="noopener noreferrer"`.
- Commit messages match the repo's style: an imperative sentence, then a blank line, then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (always this line, whichever model you are).
- **Verification:** a task is done only when the commands in its "Verify" step are green, with the stated counts. They run on ports 3217 (`e2e`) and 3219 (`e2e:fixtures`). Finish every task with a plain `npm run build`, so `.next` isn't left in fixture mode.
- **Visual check:** UI tasks end with `npm run screenshots` (added in Task 1). The PNGs go to `.superpowers/screens/task-N/`, which is gitignored, for the reviewer: 1440 and 390 wide, both views, both themes. Compare them with the Figma frames: "03 Shell sketch" (`7:100`), "02 Mode comparison" (`6:100`) and "04 Components" (`2:46`).

## File Map

```
app/
  globals.css                    tokens (@theme static), dark + no-JS fallbacks, type-* utilities, view-transition CSS
  layout.tsx                     fonts (Fragment Mono variable, Adobe kit link + preconnects), shared OG/Twitter defaults
  not-found.tsx                  404 for requests that never reach [view] (paths the proxy skips)
  [view]/layout.tsx              picks SiteShell / DashboardShell
  [view]/page.tsx                HomeSite / HomeDashboard
  [view]/not-found.tsx           404 inside the shell
  [view]/[...missing]/page.tsx   catch-all → notFound()
  [view]/system/page.tsx         /system/ style tile (noindex, not in nav)
  [view]/life/page.tsx           bands (site) / panel grid (dashboard)
  [view]/photos/page.tsx, [view]/photos/[slug]/page.tsx
components/
  ui/                            status-glyph, meta-label, chip, era-stamp, text-link, button, toggle,
                                 use-now, relative-time, live-clock, band, index-row, cover, stat, panel, data-table
  shell/                         site-shell, dashboard-shell, nav-links, menu-dialog, shell-controls,
                                 site-footer, shell-morph, page-header
  sources/                       source-health (client: HealthGlyph, HealthLabel, SyncLine), sources-table
  home/                          home-site, home-dashboard, meta-line, lab-index, off-the-clock
  photos/photo-grid.tsx
  system/toggle-demo.tsx
  sections/                      restyled sections + photos section, item-link, synced-at
  theme-toggle.tsx, view-toggle.tsx   (now built on ui/toggle)
content/                         profile.ts, work-index.ts, lab-index.ts (confirmed facts only)
lib/
  cx.ts, nav.ts, activity.ts, metadata.ts
  view/cookies.ts, view/transition.ts
  sources/health.ts, sources/status.ts (server-only), sources/stars.ts, sources/github-stats.ts
scripts/screenshots.ts           npm run screenshots
tests/                           tokens, cookies, nav, activity, metadata, ui/*.test.tsx, sources/{health,stars,github-stats}
e2e/                             tokens, system, shell, transition, not-found, home, matrix (+ updated specs)
e2e-fixtures/                    home (new), life (rewritten)
docs/superpowers/plans/2026-10-03-s3-fixtures/goodreads-currently-reading.xml   source of the new fixture
```

---

### Task 1: Tokens, type scale and fonts

Replaces the S2 placeholder CSS with the S1 token layer and loads the two font families. It also adds the screenshot helper that every later UI task uses for its visual check.

The token layer has these parts:
- every color token, light and dark
- a `prefers-color-scheme` fallback for visitors without JavaScript
- one `type-*` utility per Figma text style
- the control radius

Tailwind's default palette, text sizes, fonts, radii and shadows are cleared, so an off-system class (`text-red-500`, `shadow-md`, `rounded-lg`, `text-2xl`) generates nothing. The S2 pages lose their size classes until later tasks restyle them; that is expected.

**Files:**
- Create: `tests/tokens.test.ts`, `e2e/tokens.spec.ts`, `scripts/screenshots.ts`
- Replace: `app/globals.css`, `app/layout.tsx`
- Modify: `package.json` (one script)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - Color utilities `bg-bg`, `bg-surface`, `text-fg`, `text-fg-muted`, `bg-line`, `border-line-strong`, `text-danger`, `bg-danger-bg` (and every other Tailwind color utility over these 8 tokens). A bare `border` is a `--color-line` rule.
  - `rounded-control` (4px).
  - Font families `font-display`, `font-sans`, `font-mono`.
  - Type classes:
    - `type-display-160`, `type-display-96`, `type-display-64`, `type-display-40`
    - `type-sans-{28,20,16,14,13}`, each with a `-medium` variant
    - `type-mono-13`, `type-mono-12`, `type-mono-11`
  - Variants `dark:` and `dashboard:`, unchanged.
  - The script `npm run screenshots -- <outDir> <path>...`.

- [ ] **Step 1: Write the failing drift-guard test**

Create `tests/tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The S1 spec's color table. Changing a token means changing the spec, the
// Figma variables and app/globals.css together.
const S1_COLORS = {
  "--color-bg": { light: "#FFFFFF", dark: "#000000" },
  "--color-surface": { light: "#FAFAFA", dark: "#0A0A0A" },
  "--color-fg": { light: "#000000", dark: "#F2F2F2" },
  "--color-fg-muted": { light: "#737373", dark: "#8A8A8A" },
  "--color-line": { light: "#E5E5E5", dark: "#262626" },
  "--color-line-strong": { light: "#D4D4D4", dark: "#404040" },
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
  Object.fromEntries(Object.entries(S1_COLORS).map(([name, values]) => [name, values[mode]]));

describe("color tokens", () => {
  it("@theme declares exactly the S1 light values", () => {
    expect(colorTokens(block("@theme static {"))).toEqual(expected("light"));
  });

  it('[data-theme="dark"] redefines every token with the S1 dark value', () => {
    expect(colorTokens(block('[data-theme="dark"] {'))).toEqual(expected("dark"));
  });

  it("the no-JS prefers-color-scheme fallback matches the dark values", () => {
    expect(colorTokens(block(":root:not([data-theme]) {"))).toEqual(expected("dark"));
  });

  it("defines no shadows and only the control radius", () => {
    expect(css).not.toMatch(/box-shadow/);
    expect(css.match(/--radius-[a-z]+:/g)).toEqual(["--radius-control:"]);
  });
});
```

Run: `npm test -- tests/tokens.test.ts`
Expected: FAIL with `globals.css has no "@theme static {" block`.

- [ ] **Step 2: Replace the stylesheet**

Replace `app/globals.css` with:

```css
@import "tailwindcss";

/* Theme and view are attributes, not media queries, so both can be toggled.
   Usage: dark:…, dashboard:… (density tweaks only; colors come from tokens). */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
@custom-variant dashboard (&:where([data-view="dashboard"], [data-view="dashboard"] *));

/* Design tokens (S1). Names match the Figma variables exactly. The defaults
   are cleared first, so only these exist: no palette colors, no shadows, one
   radius. tests/tokens.test.ts checks the values below against the S1 spec. */
@theme static {
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-shadow-*: initial;

  --color-bg: #FFFFFF;
  --color-surface: #FAFAFA;
  --color-fg: #000000;
  --color-fg-muted: #737373;
  --color-line: #E5E5E5;
  --color-line-strong: #D4D4D4;
  --color-danger: #D92D20;
  --color-danger-bg: #FEF3F2;

  /* Neue Haas Grotesk comes from the Adobe Fonts kit (app/layout.tsx);
     Fragment Mono from next/font, which defines --font-fragment-mono. */
  --font-display: "neue-haas-grotesk-display", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-sans: "neue-haas-grotesk-text", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-mono: var(--font-fragment-mono), ui-monospace, Menlo, monospace;

  /* Form controls only (buttons, inputs, toggles). Everything else is square. */
  --radius-control: 4px;
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-bg: #000000;
  --color-surface: #0A0A0A;
  --color-fg: #F2F2F2;
  --color-fg-muted: #8A8A8A;
  --color-line: #262626;
  --color-line-strong: #404040;
  --color-danger: #F97066;
  --color-danger-bg: #2A0F0C;
}

/* Without JavaScript the theme script never sets data-theme, so follow the
   OS. Same values as the block above. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
    --color-bg: #000000;
    --color-surface: #0A0A0A;
    --color-fg: #F2F2F2;
    --color-fg-muted: #8A8A8A;
    --color-line: #262626;
    --color-line-strong: #404040;
    --color-danger: #F97066;
    --color-danger-bg: #2A0F0C;
  }
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
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: 1.6;
    font-variant-numeric: tabular-nums;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background-color: var(--color-fg);
    color: var(--color-bg);
  }

  :focus-visible {
    outline: 1px solid var(--color-fg);
    outline-offset: 2px;
  }
}

/* Type scale: one class per Figma text style (display/96 → type-display-96,
   sans/14-medium → type-sans-14-medium, mono/11 → type-mono-11), plus
   display-160 from the S1 spec. Adobe shifts the Display weights: 65 Medium
   is font-weight 600. Display sizes are fluid and reach their nominal size
   at a 1440px viewport. */
@utility type-display-160 {
  font-family: var(--font-display);
  font-size: clamp(4rem, 11.11vw, 10rem);
  line-height: 0.95;
  letter-spacing: -0.035em;
  font-weight: 600;
}
@utility type-display-96 {
  font-family: var(--font-display);
  font-size: clamp(3rem, 6.67vw, 6rem);
  line-height: 0.95;
  letter-spacing: -0.035em;
  font-weight: 600;
}
@utility type-display-64 {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 4.45vw, 4rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-weight: 600;
}
@utility type-display-40 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 2.78vw, 2.5rem);
  line-height: 0.95;
  letter-spacing: -0.02em;
  font-weight: 600;
}

@utility type-sans-28 {
  font-family: var(--font-sans);
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 400;
}
@utility type-sans-28-medium {
  font-family: var(--font-sans);
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 500;
}
@utility type-sans-20 {
  font-family: var(--font-sans);
  font-size: 1.25rem;
  line-height: 1.3;
  letter-spacing: 0;
  font-weight: 400;
}
@utility type-sans-20-medium {
  font-family: var(--font-sans);
  font-size: 1.25rem;
  line-height: 1.3;
  letter-spacing: 0;
  font-weight: 500;
}
@utility type-sans-16 {
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
  letter-spacing: 0;
  font-weight: 400;
}
@utility type-sans-16-medium {
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
  letter-spacing: 0;
  font-weight: 500;
}
@utility type-sans-14 {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.4;
  letter-spacing: 0;
  font-weight: 400;
}
@utility type-sans-14-medium {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.4;
  letter-spacing: 0;
  font-weight: 500;
}
@utility type-sans-13 {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  line-height: 1.4;
  letter-spacing: 0;
  font-weight: 400;
}
@utility type-sans-13-medium {
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  line-height: 1.4;
  letter-spacing: 0;
  font-weight: 500;
}

/* Fragment Mono has one weight; the Figma -medium mono styles map to 400. */
@utility type-mono-13 {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.4;
  letter-spacing: 0;
  font-weight: 400;
}
@utility type-mono-12 {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.4;
  letter-spacing: 0;
  font-weight: 400;
}
@utility type-mono-11 {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  line-height: 1.4;
  letter-spacing: 0;
  font-weight: 400;
}
```

Notes:
- `@theme static` makes Tailwind emit every token as a CSS variable even when no utility uses it yet. The dark and no-JS blocks override those variables.
- The dark and no-JS blocks are unlayered, so they beat Tailwind's `@layer theme` output.

Run: `npm test -- tests/tokens.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 3: Load the fonts in the root layout**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Fragment_Mono } from "next/font/google";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/view/theme";
import "./globals.css";

// Self-hosted at build time; exposed as --font-fragment-mono, which
// globals.css maps to --font-mono.
const fragmentMono = Fragment_Mono({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-fragment-mono",
});

// Neue Haas Grotesk Display and Text come from this Adobe Fonts web project.
const ADOBE_FONTS_KIT = "https://use.typekit.net/jgu1ygn.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.title}` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme is set by themeScript before hydration, so React must not
    // complain that the server HTML lacked it.
    <html lang="en" className={fragmentMono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="" />
        <link rel="stylesheet" href={ADOBE_FONTS_KIT} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Add the screenshot helper**

Create `scripts/screenshots.ts`:

```ts
// Visual-review helper: full-page screenshots of the production build at
// 1440 and 390 wide, in both views and both themes.
//
//   npm run build
//   npm run screenshots -- <outDir> <path> [<path>...]
//
// Starts `next start` on SCREENSHOT_PORT (default 3218), saves
// <outDir>/<page>-<width>-<view>-<theme>.png, then stops the server. For
// populated pages, build and run with SOURCE_FIXTURES=1.
import { type ChildProcess, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const WIDTHS = [1440, 390];
const VIEWS = ["site", "dashboard"];
const THEMES = ["light", "dark"];

const port = Number(process.env.SCREENSHOT_PORT ?? 3218);
const base = `http://localhost:${port}`;

async function waitForServer(server: ChildProcess) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("next start exited early");
    try {
      if ((await fetch(`${base}/`)).ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`nothing answered on ${base} after 30s`);
}

function fileSlug(path: string): string {
  return path.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "home";
}

async function main() {
  const [outDir, ...paths] = process.argv.slice(2);
  if (!outDir || paths.length === 0) {
    console.error("usage: npm run screenshots -- <outDir> <path> [<path>...]");
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });

  const server = spawn(join("node_modules", ".bin", "next"), ["start", "--port", String(port)], {
    stdio: "ignore",
    env: process.env,
  });
  try {
    await waitForServer(server);
    const browser = await chromium.launch();
    for (const width of WIDTHS) {
      for (const view of VIEWS) {
        for (const theme of THEMES) {
          const context = await browser.newContext({
            viewport: { width, height: width < 768 ? 844 : 900 },
          });
          await context.addCookies([
            { name: "view", value: view, url: base },
            { name: "theme", value: theme, url: base },
          ]);
          const page = await context.newPage();
          for (const path of paths) {
            await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
            // Scroll through once so lazy images load before the capture.
            await page.evaluate(async () => {
              for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
                window.scrollTo(0, y);
                await new Promise((resolve) => setTimeout(resolve, 100));
              }
              window.scrollTo(0, 0);
              await document.fonts.ready;
            });
            await page.waitForLoadState("networkidle");
            const file = join(outDir, `${fileSlug(path)}-${width}-${view}-${theme}.png`);
            await page.screenshot({ path: file, fullPage: true });
            console.log(`saved ${file}`);
          }
          await context.close();
        }
      }
    }
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

```bash
npm pkg set scripts.screenshots="tsx scripts/screenshots.ts"
```

- [ ] **Step 5: Add the e2e checks for tokens and fonts**

Create `e2e/tokens.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const bodyColors = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return { bg: style.backgroundColor, fg: style.color };
  });

test("the light and dark tokens reach the page", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "light", url: baseURL! }]);
  await page.goto("/");
  expect(await bodyColors(page)).toEqual({ bg: "rgb(255, 255, 255)", fg: "rgb(0, 0, 0)" });

  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.reload();
  expect(await bodyColors(page)).toEqual({ bg: "rgb(0, 0, 0)", fg: "rgb(242, 242, 242)" });
});

test("body text is Neue Haas Grotesk Text and mono is Fragment Mono", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="stylesheet"][href="https://use.typekit.net/jgu1ygn.css"]')).toHaveCount(1);
  const fonts = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    mono: getComputedStyle(document.documentElement).getPropertyValue("--font-mono"),
  }));
  expect(fonts.body).toMatch(/^"?neue-haas-grotesk-text"?, "Helvetica Neue"/);
  expect(fonts.mono).toContain("Fragment Mono");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, colorScheme: "dark" });

  test("the OS color scheme applies", async ({ page }) => {
    await page.goto("/");
    expect(await bodyColors(page)).toEqual({ bg: "rgb(0, 0, 0)", fg: "rgb(242, 242, 242)" });
  });
});
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- typecheck and lint are clean.
- Vitest: 19 files, 84 tests pass.
- `npm run e2e`: 20 passed.
- `npm run e2e:fixtures`: 2 passed.

The build fetches Fragment Mono from Google Fonts, so it needs network access, as CI has.

- [ ] **Step 7: Visual check**

```bash
npm run screenshots -- .superpowers/screens/task-1 / /life/
```

Expected: 16 PNGs. Body text is set in Neue Haas Grotesk Text (not Helvetica or Arial; compare the "R" and "a" with the Figma specimen). The page background is white or black, following the theme cookie in the file name.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css app/layout.tsx package.json scripts/screenshots.ts tests/tokens.test.ts e2e/tokens.spec.ts
git commit -m "Add the S1 design tokens, type scale and fonts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Text and control primitives

Adds the small primitives that carry the S1 glyph rules and controls:
- `StatusGlyph`, `MetaLabel`, `Chip`, `EraStamp`
- `TextLink`, `Button`, `Toggle`
- `RelativeTime` and `LiveClock`, plus the shared `useNow` hook

It also restyles `Empty` with tokens. Vitest learns to run `.tsx` component tests through `react-dom/server`. No page uses these yet; Task 3's `/system/` renders them.

**Files:**
- Create: `lib/cx.ts`
- Create: `components/ui/status-glyph.tsx`, `meta-label.tsx`, `chip.tsx`, `era-stamp.tsx`, `text-link.tsx`, `button.tsx`, `toggle.tsx`, `use-now.ts`, `relative-time.tsx`, `live-clock.tsx` (all in `components/ui/`)
- Create: `tests/ui/text-primitives.test.tsx`
- Modify: `lib/format.ts` (append), `components/sections/empty.tsx` (replace)
- Replace: `vitest.config.mts`, `tests/format.test.ts`

**Interfaces:**
- Consumes: Task 1's tokens and `type-*` classes.
- Produces:
  - Class names: `cx(...parts: (string | false | null | undefined)[]): string` from `@/lib/cx`.
  - Glyphs: `type GlyphStatus = "ok" | "empty" | "late" | "error"`, `STATUS_GLYPHS`, and `StatusGlyph({ status, label?, className? })` from `@/components/ui/status-glyph`. With a `label` it is `role="img"`; without one it is `aria-hidden`.
  - Label: `MetaLabel({ children, status?, as?: "span" | "p" | "h2" | "h3" | "dt", className? })`.
  - Chip and era stamp: `Chip({ tone?: "inverted" | "danger", children })` and `EraStamp({ parts: string[], dot?, className? })`.
  - Links: `isExternal(href)` and `TextLink({ href, children, className? })` from `@/components/ui/text-link`. Internal links use `next/link`. External links get `rel="noopener noreferrer"`. Both end in ` →`.
  - Buttons: `type ButtonVariant = "primary" | "ghost" | "text"`, `buttonClass(variant?, className?)`, `Button` (a `<button>`) and `ButtonLink({ href, variant?, className?, children })`.
  - Toggle: `ToggleOption<T>` and `Toggle({ label, options, value, onChange?, testId? })`, a client component. It renders a `role="group"` with `aria-label={label}` and one `<button aria-pressed>` per option.
  - Clock hook: `useNow(): number | null`, the current time rounded to the minute and `null` until hydration (client only).
  - Times: `RelativeTime({ iso, className? })` (client) prerenders `formatDateTime(iso)` and shows "2h ago" after hydration. `LiveClock({ timeZone, place })` (client) prerenders `--:--` and shows `HH:mm` after hydration, with `aria-label="Local time in {place}"`.
  - Formatters: `formatRelative(iso, now): string` and `formatClock(time, timeZone): string` from `@/lib/format`.
  - Empty state: `Empty({ children? })` renders "○ Nothing here yet." by default.

- [ ] **Step 1: Let Vitest run component tests**

Replace `vitest.config.mts` with:

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    // next.config.ts sets trailingSlash. Next inlines this flag at build
    // time; next/link reads it at runtime here, so set it to render the same
    // hrefs as the site.
    env: { __NEXT_TRAILING_SLASH: "true" },
  },
});
```

- [ ] **Step 2: Write the failing tests**

Replace `tests/format.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { formatClock, formatDate, formatDateTime, formatRelative } from "@/lib/format";

describe("format", () => {
  it("formats in Europe/Istanbul", () => {
    expect(formatDate("2026-09-30T22:30:00.000Z")).toBe("Oct 1, 2026");
    expect(formatDateTime("2026-09-30T22:30:00.000Z")).toBe("Oct 1, 2026, 1:30 AM");
  });

  it("returns empty for unusable input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDateTime("nope")).toBe("");
    expect(formatRelative("nope", Date.now())).toBe("");
  });
});

describe("formatRelative", () => {
  const now = Date.parse("2026-10-03T12:00:00.000Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("counts minutes, hours and days", () => {
    expect(formatRelative(ago(30_000), now)).toBe("just now");
    expect(formatRelative(ago(12 * 60_000), now)).toBe("12m ago");
    expect(formatRelative(ago(2 * 3_600_000 + 59 * 60_000), now)).toBe("2h ago");
    expect(formatRelative(ago(3 * 86_400_000), now)).toBe("3d ago");
  });

  it("treats future times as just now and old ones as a date", () => {
    expect(formatRelative(ago(-5 * 60_000), now)).toBe("just now");
    expect(formatRelative("2026-08-01T12:00:00.000Z", now)).toBe("Aug 1, 2026");
  });
});

describe("formatClock", () => {
  it("prints 24-hour HH:mm in the given zone", () => {
    expect(formatClock(Date.parse("2026-10-03T11:32:00.000Z"), "Europe/Istanbul")).toBe("14:32");
    expect(formatClock(Date.parse("2026-10-03T21:05:00.000Z"), "Europe/Istanbul")).toBe("00:05");
  });
});
```

Create `tests/ui/text-primitives.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EraStamp } from "@/components/ui/era-stamp";
import { LiveClock } from "@/components/ui/live-clock";
import { MetaLabel } from "@/components/ui/meta-label";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { Toggle } from "@/components/ui/toggle";

const html = renderToStaticMarkup;

describe("StatusGlyph", () => {
  it("maps each status to its S1 glyph", () => {
    expect(html(<StatusGlyph status="ok" />)).toContain(">●<");
    expect(html(<StatusGlyph status="empty" />)).toContain(">○<");
    expect(html(<StatusGlyph status="late" />)).toContain(">◐<");
  });

  it("colors only the error glyph with --color-danger", () => {
    expect(html(<StatusGlyph status="error" />)).toContain("text-danger");
    expect(html(<StatusGlyph status="ok" />)).not.toContain("text-danger");
  });

  it("is decorative unless labelled", () => {
    expect(html(<StatusGlyph status="ok" />)).toContain('aria-hidden="true"');
    expect(html(<StatusGlyph status="late" label="late" />)).toContain('role="img" aria-label="late"');
  });
});

describe("MetaLabel", () => {
  it("renders an uppercase mono label with an optional leading glyph", () => {
    const markup = html(<MetaLabel status="ok">Films</MetaLabel>);
    expect(markup).toMatch(/^<span class="[^"]*type-mono-11[^"]*uppercase/);
    expect(markup).toContain("●</span>Films");
  });

  it("can render as a heading", () => {
    expect(html(<MetaLabel as="h2">Lab</MetaLabel>)).toMatch(/^<h2 /);
  });
});

describe("Chip and EraStamp", () => {
  it("inverts by default and uses danger colors for errors", () => {
    expect(html(<Chip>live</Chip>)).toContain("bg-fg text-bg");
    expect(html(<Chip tone="danger">error</Chip>)).toContain("bg-danger-bg text-danger");
  });

  it("joins era parts with a middle dot", () => {
    expect(html(<EraStamp parts={["2013", "iOS 6", "pre-flat"]} />)).toContain("2013 · iOS 6 · pre-flat");
    expect(html(<EraStamp parts={[]} />)).toBe("");
  });
});

describe("TextLink", () => {
  it("ends with → and keeps internal links internal", () => {
    const markup = html(<TextLink href="/life/">Life</TextLink>);
    expect(markup).toMatch(/^<a [^>]*href="\/life\/"/);
    expect(markup).not.toContain("rel=");
    expect(markup).toContain(" →</span>");
  });

  it("adds rel=noopener noreferrer to external links and never uses ↗", () => {
    const markup = html(<TextLink href="https://letterboxd.com/onur/">Letterboxd</TextLink>);
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain("↗");
  });
});

describe("Button", () => {
  it("uses the control radius for every variant", () => {
    expect(html(<Button>Menu</Button>)).toContain("rounded-control");
    expect(html(<Button variant="primary">Go</Button>)).toContain("bg-fg text-bg");
    expect(html(<ButtonLink href="https://cal.com/x">Book a call →</ButtonLink>)).toContain(
      'rel="noopener noreferrer"',
    );
  });
});

describe("Toggle", () => {
  it("marks exactly the current option as pressed", () => {
    const markup = html(
      <Toggle
        label="View"
        testId="view-toggle"
        value="site"
        options={[
          { value: "site", label: "Site" },
          { value: "dashboard", label: "Dashboard" },
        ]}
      />,
    );
    expect(markup).toContain('role="group" aria-label="View" data-testid="view-toggle"');
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(markup).toMatch(/aria-pressed="true"[^>]*>Site</);
  });
});

describe("client times before hydration", () => {
  it("RelativeTime prerenders the absolute time", () => {
    expect(html(<RelativeTime iso="2026-09-30T22:30:00.000Z" />)).toBe(
      '<time dateTime="2026-09-30T22:30:00.000Z" title="Oct 1, 2026, 1:30 AM">Oct 1, 2026, 1:30 AM</time>',
    );
  });

  it("LiveClock prerenders --:--", () => {
    expect(html(<LiveClock timeZone="Europe/Istanbul" place="Ankara" />)).toBe(
      '<time aria-label="Local time in Ankara">--:--</time>',
    );
  });
});
```

Run: `npm test`
Expected: FAIL. `formatRelative` and `formatClock` are not exported, and the `@/components/ui/*` imports cannot be resolved.

- [ ] **Step 3: Add the formatters**

Append to `lib/format.ts`:

```ts
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Client-side only (RelativeTime): "just now", "12m ago", "5h ago", "3d ago",
// then the absolute date after 30 days. Future times (clock skew) count as
// just now.
export function formatRelative(iso: string, now: number): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const elapsed = now - time;
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 30 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;
  return formatDate(iso);
}

// Client-side only (LiveClock): 24-hour HH:mm in an IANA time zone.
export function formatClock(time: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(time);
}
```

- [ ] **Step 4: Add `cx` and the glyph primitives**

Create `lib/cx.ts`:

```ts
// Joins class names, skipping falsy parts: cx("a", on && "b").
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
```

Create `components/ui/status-glyph.tsx`:

```tsx
import { cx } from "@/lib/cx";

// The S1 glyph set: ● ok (active, live, synced), ○ empty, ◐ late or
// partial, and ● in --color-danger for an error. × is the close action, not
// a status.
export type GlyphStatus = "ok" | "empty" | "late" | "error";

export const STATUS_GLYPHS: Record<GlyphStatus, string> = {
  ok: "●",
  empty: "○",
  late: "◐",
  error: "●",
};

// Set in Neue Haas Grotesk Text, where the three glyphs share one size.
// With a label, the glyph is announced as that word; without one it is
// decorative and the surrounding text must carry the meaning.
export function StatusGlyph({
  status,
  label,
  className,
}: {
  status: GlyphStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      data-status={status}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx("font-sans", status === "error" && "text-danger", className)}
    >
      {STATUS_GLYPHS[status]}
    </span>
  );
}
```

Create `components/ui/meta-label.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { type GlyphStatus, StatusGlyph } from "./status-glyph";

// Mono uppercase label: section headers, column labels, small facts.
export function MetaLabel({
  children,
  status,
  as: Tag = "span",
  className,
}: {
  children: ReactNode;
  status?: GlyphStatus;
  as?: "span" | "p" | "h2" | "h3" | "dt";
  className?: string;
}) {
  return (
    <Tag
      className={cx(
        "inline-flex items-center gap-1.5 type-mono-11 tracking-[0.02em] text-fg-muted uppercase",
        className,
      )}
    >
      {status ? <StatusGlyph status={status} /> : null}
      {children}
    </Tag>
  );
}
```

Create `components/ui/chip.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// A square status chip. Inverted for "live"; danger only for errors (the one
// place --color-danger-bg appears).
export function Chip({
  tone = "inverted",
  children,
}: {
  tone?: "inverted" | "danger";
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center px-2 type-mono-11",
        tone === "inverted" ? "bg-fg text-bg" : "bg-danger-bg text-danger",
      )}
    >
      {children}
    </span>
  );
}
```

Create `components/ui/era-stamp.tsx`:

```tsx
import { cx } from "@/lib/cx";

// Places a project in its time: "● 2013 · iOS 6 · pre-flat". Inside a work
// index row the year column already shows the year, so pass the parts
// without it there.
export function EraStamp({
  parts,
  dot = true,
  className,
}: {
  parts: string[];
  dot?: boolean;
  className?: string;
}) {
  if (parts.length === 0) return null;
  return (
    <span className={cx("inline-flex items-center gap-1 type-mono-11 text-fg-muted", className)}>
      {dot ? (
        <span aria-hidden="true" className="font-sans">
          ●
        </span>
      ) : null}
      {parts.join(" · ")}
    </span>
  );
}
```

- [ ] **Step 5: Add links, buttons and the toggle**

Create `components/ui/text-link.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

// A link with a trailing →, underlined on hover. External links use → too
// (Neue Haas Grotesk has no ↗) and never pass the referrer or window.opener.
export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <span className="group-hover:underline group-hover:underline-offset-[0.2em]">{children}</span>
      <span aria-hidden="true"> →</span>
    </>
  );
  const classes = cx("group inline", className);
  return isExternal(href) ? (
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

Create `components/ui/button.tsx`:

```tsx
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { isExternal } from "./text-link";

// primary: inverted fill. ghost: 1px line-strong outline (Figma "Outline",
// e.g. "Book a call →"). text: no frame (Figma "Text", e.g. "Menu").
export type ButtonVariant = "primary" | "ghost" | "text";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-fg text-bg hover:underline",
  ghost: "border border-line-strong text-fg hover:border-fg",
  text: "text-fg hover:underline",
};

export function buttonClass(variant: ButtonVariant = "ghost", className?: string): string {
  return cx(
    "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-control px-3 type-sans-14-medium whitespace-nowrap",
    VARIANTS[variant],
    className,
  );
}

export function Button({
  variant,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}

// A link that looks like a button. External links get the same rel as
// TextLink.
export function ButtonLink({
  href,
  variant,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  const classes = buttonClass(variant, className);
  return isExternal(href) ? (
    <a href={href} rel="noopener noreferrer" className={classes}>
      {children}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
```

Create `components/ui/toggle.tsx`:

```tsx
"use client";

import { cx } from "@/lib/cx";

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

// Segmented control (theme, view). The pressed segment is inverted; the
// frame takes --radius-control, the segments stay square. The owner (a
// client component) keeps the state and passes onChange.
export function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
  testId,
}: {
  label: string;
  options: readonly ToggleOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  testId?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      data-testid={testId}
      className="inline-flex h-8 shrink-0 items-center rounded-control border border-line-strong p-1"
    >
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange?.(option.value)}
            className={cx(
              "h-full px-2 type-sans-13",
              pressed ? "bg-fg text-bg" : "text-fg-muted hover:text-fg",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: Add the client-side clock and times**

Create `components/ui/use-now.ts`:

```ts
"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

// Ticks on each wall-clock minute.
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, MINUTE - (Date.now() % MINUTE));
  };
  schedule();
  return () => clearTimeout(timer);
}

// Rounded to the minute so the snapshot is stable between ticks.
function getSnapshot(): number {
  return Math.floor(Date.now() / MINUTE) * MINUTE;
}

// Pages are prerendered, so the server (and hydration) has no "now".
function getServerSnapshot(): null {
  return null;
}

// The current time in ms, to the minute; null until hydrated.
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

Create `components/ui/relative-time.tsx`:

```tsx
"use client";

import { formatDateTime, formatRelative } from "@/lib/format";
import { useNow } from "./use-now";

// "2h ago" once hydrated. The prerendered HTML carries the absolute time,
// which stays in the title for hover.
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const now = useNow();
  const absolute = formatDateTime(iso);
  return (
    <time dateTime={iso} title={absolute} className={className}>
      {now === null ? absolute : formatRelative(iso, now)}
    </time>
  );
}
```

Create `components/ui/live-clock.tsx`:

```tsx
"use client";

import { formatClock } from "@/lib/format";
import { useNow } from "./use-now";

// HH:mm in a time zone, ticking each minute. Prerendered pages show --:--
// until hydration, so the HTML never carries a stale time.
export function LiveClock({ timeZone, place }: { timeZone: string; place: string }) {
  const now = useNow();
  const time = now === null ? null : formatClock(now, timeZone);
  return (
    <time aria-label={`Local time in ${place}`} dateTime={time ?? undefined}>
      {time ?? "--:--"}
    </time>
  );
}
```

- [ ] **Step 7: Restyle the empty state**

Replace `components/sections/empty.tsx` with:

```tsx
export function Empty({ children = "Nothing here yet." }: { children?: string }) {
  return (
    <p className="type-mono-12 text-fg-muted">
      <span aria-hidden="true" className="font-sans">
        ○
      </span>{" "}
      {children}
    </p>
  );
}
```

Run: `npm test`
Expected: PASS (20 files, 100 tests).

- [ ] **Step 8: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 20 files, 100 tests.
- `e2e`: 20 passed.
- `e2e:fixtures`: 2 passed.

- [ ] **Step 9: Commit**

```bash
git add lib/cx.ts lib/format.ts components/ui components/sections/empty.tsx vitest.config.mts tests/format.test.ts tests/ui
git commit -m "Add the text and control primitives

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Layout primitives and the `/system/` style tile

Adds the structural primitives: `Band` (site sections), `IndexRow` (the Swiss index row), `Cover`, `Stat`/`StatRow`, `Panel`/`PanelGrid` and `DataTable`. It also adds `/system/`, the in-code style tile. That page renders every primitive and the full type scale in whichever view and theme is active, and it is the review surface for the rest of S3. It is not linked from the nav and is `noindex`.

**Files:**
- Create in `components/ui/`: `band.tsx`, `index-row.tsx`, `cover.tsx`, `stat.tsx`, `panel.tsx`, `data-table.tsx`
- Create: `components/system/toggle-demo.tsx`, `app/[view]/system/page.tsx`
- Create: `tests/ui/layout-primitives.test.tsx`, `e2e/system.spec.ts`

**Interfaces:**
- Consumes: Task 2's `cx`, `MetaLabel`, `StatusGlyph`/`GlyphStatus`, `EraStamp`, `TextLink`/`isExternal`, `Toggle`, `RelativeTime`, `LiveClock`, `Button`, `Chip` and `Empty`. Also S2's `Picture` and `getPhotos`.
- Produces:
  - **Band:** `Band({ label, source?, href?, linkLabel? = "All", id?, className?, "data-section"?, children })`. It has a top rule, then a header row with "LABEL · SOURCE" on the left and an optional "ALL →" link on the right.
  - **Index entry:** `interface IndexEntry { title; meta?; years?; role?; era?; href?; status?: GlyphStatus; statusLabel? }`.
  - **IndexRow:** `IndexRow({ entry })`, a 12-column row: years (2) | title + inline meta (6) | role (3) | → (1). The whole row links when `href` is set, and it is a plain `<div>` otherwise.
  - **Cover:** `Cover({ src, alt, width? = 240, className? })`, a lazy 2:3 `<img>`. Without a `src` it renders a `bg-line` block.
  - **Stat:** `Stat({ label, value })` (`<dt>`/`<dd>`), which must sit inside `StatRow({ children })` (a `<dl>`).
  - **Panel span:** `type PanelSpan = 3 | 4 | 6 | 8 | 12`.
  - **PanelGrid:** `PanelGrid({ children })`, a 12-column grid with 16px gutters, 24px padding and one column on mobile.
  - **Panel:** `Panel({ title, count?, right?, span? = 12, id?, className?, "data-section"?, children })`.
  - **Table column:** `interface Column<T> { header; cell: (row: T) => ReactNode; align?: "left" | "right"; mono? }`.
  - **DataTable:** `DataTable({ columns, rows, rowKey, caption?, empty? = "Nothing here yet." })`. It renders `<thead>` with `<th scope="col">` and one empty-state row when there are no rows.
  - **System page:** `/system/` marks each specimen with `data-primitive="<Name>"` and each type sample with `data-type="<class>"`.

- [ ] **Step 1: Write the failing tests**

Create `tests/ui/layout-primitives.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Band } from "@/components/ui/band";
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { IndexRow } from "@/components/ui/index-row";
import { Panel } from "@/components/ui/panel";
import { Stat } from "@/components/ui/stat";

const html = renderToStaticMarkup;

describe("IndexRow", () => {
  it("renders a plain, non-interactive row without an href", () => {
    const markup = html(<IndexRow entry={{ title: "PrimeOne", meta: "80+ components" }} />);
    expect(markup).toMatch(/^<div /);
    expect(markup).not.toContain("<a");
    expect(markup).not.toContain("→");
    expect(markup).toContain("PrimeOne");
    expect(markup).toContain("80+ components");
  });

  it("renders empty fields as nothing, never as dashes", () => {
    const markup = html(<IndexRow entry={{ title: "nebuu" }} />);
    // Year, role and arrow cells are present but empty.
    expect(markup.match(/<span[^>]*><\/span>/g)).toHaveLength(3);
    expect(markup).not.toMatch(/>[–—-]</);
  });

  it("makes the whole row a link with a trailing → when href is set", () => {
    const markup = html(<IndexRow entry={{ title: "Life", href: "/life/" }} />);
    expect(markup).toMatch(/^<a [^>]*href="\/life\/"/);
    expect(markup).toContain("→");
    expect(markup).toContain("group-hover:underline");
  });

  it("gives external rows rel=noopener noreferrer and shows a status glyph", () => {
    const markup = html(
      <IndexRow entry={{ title: "x", href: "https://example.com/", status: "late", statusLabel: "in progress" }} />,
    );
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('aria-label="in progress"');
    expect(markup).toContain("◐");
  });
});

describe("DataTable", () => {
  const columns = [
    { header: "Title", cell: (row: { title: string; n: number }) => row.title },
    { header: "Count", cell: (row: { title: string; n: number }) => row.n, mono: true, align: "right" as const },
  ];

  it("uses a real header row with scoped column headers", () => {
    const markup = html(<DataTable columns={columns} rows={[{ title: "a", n: 1 }]} rowKey={(r) => r.title} />);
    expect(markup).toContain("<thead>");
    expect(markup.match(/<th scope="col"/g)).toHaveLength(2);
    expect(markup).toMatch(/type-mono-12[^"]*text-right[^>]*>1</);
  });

  it("renders one empty-state row spanning every column", () => {
    const markup = html(<DataTable columns={columns} rows={[]} rowKey={(r) => r.title} empty="No films yet." />);
    expect(markup).toContain('<td colSpan="2"');
    expect(markup).toContain("No films yet.");
  });
});

describe("Cover", () => {
  it("renders a lazy 2:3 image with explicit dimensions", () => {
    const markup = html(<Cover src="https://example.com/p.jpg" alt="" width={200} />);
    expect(markup).toContain('width="200" height="300"');
    expect(markup).toContain('loading="lazy"');
    expect(markup).toContain("aspect-[2/3]");
  });

  it("renders a --color-line block without a src", () => {
    const markup = html(<Cover src="" alt="" />);
    expect(markup).not.toContain("<img");
    expect(markup).toContain("bg-line");
  });
});

describe("Panel, Band and Stat", () => {
  it("Panel shows its title and count and spans the given columns", () => {
    const markup = html(
      <Panel title="Work" count={5} span={8}>
        body
      </Panel>,
    );
    expect(markup).toContain("md:col-span-8");
    expect(markup).toContain(">Work</h2>");
    expect(markup).toContain("<span>5</span>");
  });

  it("Band shows label · source and an All → link only with an href", () => {
    expect(html(<Band label="Films" source="Letterboxd">x</Band>)).not.toContain("<a");
    const linked = html(
      <Band label="Films" source="Letterboxd" href="https://letterboxd.com/onur/">
        x
      </Band>,
    );
    expect(linked).toContain("· Letterboxd");
    expect(linked).toContain('rel="noopener noreferrer"');
  });

  it("Stat pairs a label with a value", () => {
    const markup = html(<Stat label="Films" value={6} />);
    expect(markup).toContain(">Films</dt>");
    expect(markup).toContain(">6</dd>");
  });
});
```

Run: `npm test`
Expected: FAIL. The `@/components/ui/{band,cover,data-table,index-row,panel,stat}` imports cannot be resolved.

- [ ] **Step 2: Add Band and IndexRow**

Create `components/ui/band.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { MetaLabel } from "./meta-label";
import { TextLink } from "./text-link";

// A full-width site section: a top rule, a header row (label · source on the
// left, an optional "All →" link on the right), then the content.
export function Band({
  label,
  source,
  href,
  linkLabel = "All",
  id,
  className,
  children,
  "data-section": dataSection,
}: {
  label: string;
  source?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
  className?: string;
  children: ReactNode;
  "data-section"?: string;
}) {
  return (
    <section id={id} data-section={dataSection} className={cx("scroll-mt-20 border-t pt-4", className)}>
      <header className="mb-8 flex items-baseline justify-between gap-6">
        <MetaLabel as="h2">
          {label}
          {source ? <span>· {source}</span> : null}
        </MetaLabel>
        {href ? (
          <TextLink href={href} className="type-mono-11 tracking-[0.02em] uppercase">
            {linkLabel}
          </TextLink>
        ) : null}
      </header>
      {children}
    </section>
  );
}
```

Create `components/ui/index-row.tsx`:

```tsx
import Link from "next/link";
import { cx } from "@/lib/cx";
import { EraStamp } from "./era-stamp";
import { type GlyphStatus, StatusGlyph } from "./status-glyph";
import { isExternal } from "./text-link";

export interface IndexEntry {
  title: string;
  // Inline fact after the title, e.g. "80+ components".
  meta?: string;
  years?: string;
  role?: string;
  // Era stamp parts without the year, e.g. "iOS 6 · pre-flat".
  era?: string;
  href?: string;
  // Optional leading glyph (the Lab index: ● live, ◐ wip) and its label.
  status?: GlyphStatus;
  statusLabel?: string;
}

// One row of the Swiss index: year | title + inline meta | role | →. Empty
// fields render nothing (no dashes, no placeholders) but keep their grid
// columns, so rows line up when S4 fills them in. With an href the whole row
// is the link and the title underlines on hover; without one it is plain text.
export function IndexRow({ entry }: { entry: IndexEntry }) {
  const { title, meta, years, role, era, href, status, statusLabel } = entry;
  const body = (
    <>
      <span className="col-span-12 type-mono-13 max-md:empty:hidden md:col-span-2">{years}</span>
      <span className="col-span-11 md:col-span-6">
        {status ? <StatusGlyph status={status} label={statusLabel} className="mr-2 type-sans-20" /> : null}
        <span className={cx("type-sans-20", href && "group-hover:underline group-hover:underline-offset-[0.15em]")}>
          {title}
        </span>
        {meta ? <span className="ml-3 type-mono-12 text-fg-muted">{meta}</span> : null}
        {era ? (
          <span className="mt-1 block">
            <EraStamp parts={[era]} />
          </span>
        ) : null}
      </span>
      <span className="col-span-12 type-mono-13 text-fg-muted max-md:order-last max-md:empty:hidden md:col-span-3">
        {role}
      </span>
      <span aria-hidden="true" className="col-span-1 text-right type-sans-20">
        {href ? "→" : null}
      </span>
    </>
  );
  const classes = "group grid grid-cols-12 items-baseline gap-x-6 gap-y-1 border-b py-6";
  if (!href) return <div className={classes}>{body}</div>;
  return isExternal(href) ? (
    <a href={href} rel="noopener noreferrer" className={classes}>
      {body}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {body}
    </Link>
  );
}
```

- [ ] **Step 3: Add Cover, Stat, Panel and DataTable**

Create `components/ui/cover.tsx`:

```tsx
import { cx } from "@/lib/cx";

// A remote film poster or book cover, always 2:3 and square-cornered. Remote
// images skip the image pipeline, so the explicit size only reserves space.
// Without a src it renders a --color-line block of the same shape.
export function Cover({
  src,
  alt,
  width = 240,
  className,
}: {
  src: string;
  alt: string;
  width?: number;
  className?: string;
}) {
  const classes = cx("block aspect-[2/3] w-full bg-line object-cover", className);
  if (!src) return <span aria-hidden="true" className={classes} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote cover; no optimization by design
    <img
      src={src}
      alt={alt}
      width={width}
      height={Math.round(width * 1.5)}
      loading="lazy"
      decoding="async"
      className={classes}
    />
  );
}
```

Create `components/ui/stat.tsx`:

```tsx
import type { ReactNode } from "react";
import { MetaLabel } from "./meta-label";

// A dashboard metric tile.
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border bg-surface p-3">
      <MetaLabel as="dt">{label}</MetaLabel>
      <dd className="type-sans-28-medium">{value}</dd>
    </div>
  );
}

// Lays out Stat tiles in one row (stacking two per row on mobile).
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-4 md:auto-cols-fr md:grid-flow-col md:grid-cols-none">{children}</dl>
  );
}
```

Create `components/ui/panel.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// Columns a panel spans on the dashboard's 12-column grid (md and up).
// Literal class names, so Tailwind can see them.
export type PanelSpan = 3 | 4 | 6 | 8 | 12;
const SPANS: Record<PanelSpan, string> = {
  3: "md:col-span-3",
  4: "md:col-span-4",
  6: "md:col-span-6",
  8: "md:col-span-8",
  12: "md:col-span-12",
};

// The dashboard content grid: 12 columns, 16px gutters, one column on mobile.
export function PanelGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-start gap-4 p-4 md:grid-cols-12 md:p-6">{children}</div>;
}

// A dashboard container: a 36px header (title, optional count, right slot)
// over the body. Square, 1px --color-line border, --color-surface fill.
export function Panel({
  title,
  count,
  right,
  span = 12,
  id,
  className,
  children,
  "data-section": dataSection,
}: {
  title: string;
  count?: number | string;
  right?: ReactNode;
  span?: PanelSpan;
  id?: string;
  className?: string;
  children: ReactNode;
  "data-section"?: string;
}) {
  return (
    <section
      id={id}
      data-section={dataSection}
      className={cx("col-span-1 flex min-w-0 scroll-mt-16 flex-col border bg-surface", SPANS[span], className)}
    >
      <header className="flex h-9 shrink-0 items-center justify-between gap-3 border-b px-3">
        <h2 className="type-sans-13-medium">{title}</h2>
        <div className="flex items-center gap-3 type-mono-11 text-fg-muted">
          {count !== undefined ? <span>{count}</span> : null}
          {right}
        </div>
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
```

Create `components/ui/data-table.tsx`:

```tsx
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  // Fragment Mono, muted: numbers, dates, years, domains.
  mono?: boolean;
}

// A dense dashboard table with a real header row. When there are no rows it
// renders one empty-state row instead of an empty body.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty = "Nothing here yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  caption?: string;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={cx(
                  "h-8 px-3 font-normal whitespace-nowrap type-mono-11 text-fg-muted",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-9 px-3 type-mono-12 text-fg-muted">
                <span aria-hidden="true" className="font-sans">
                  ○
                </span>{" "}
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="border-b last:border-b-0">
                {columns.map((column, columnIndex) => (
                  <td
                    key={columnIndex}
                    className={cx(
                      "h-9 px-3 align-middle",
                      // Text cells keep a readable width; on narrow screens
                      // the table scrolls sideways instead of squeezing them.
                      column.mono ? "type-mono-12 whitespace-nowrap text-fg-muted" : "min-w-40 type-sans-13",
                      column.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

Run: `npm test`
Expected: PASS (21 files, 111 tests).

- [ ] **Step 4: Build `/system/`**

Create `components/system/toggle-demo.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";

// A working Toggle for /system/ that changes nothing but itself.
export function ToggleDemo() {
  const [value, setValue] = useState<"one" | "two" | "three">("one");
  return (
    <Toggle
      label="Example toggle"
      value={value}
      onChange={setValue}
      options={[
        { value: "one", label: "One" },
        { value: "two", label: "Two" },
        { value: "three", label: "Three" },
      ]}
    />
  );
}
```

Create `app/[view]/system/page.tsx`:

```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Picture } from "@/components/picture";
import { Empty } from "@/components/sections/empty";
import { ToggleDemo } from "@/components/system/toggle-demo";
import { Band } from "@/components/ui/band";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { EraStamp } from "@/components/ui/era-stamp";
import { IndexRow } from "@/components/ui/index-row";
import { LiveClock } from "@/components/ui/live-clock";
import { MetaLabel } from "@/components/ui/meta-label";
import { Panel } from "@/components/ui/panel";
import { RelativeTime } from "@/components/ui/relative-time";
import { Stat, StatRow } from "@/components/ui/stat";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { type Photo, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { assertView } from "@/lib/view/params";

// The in-code style tile and the S3 review surface. Not in the nav, not
// indexed. Every primitive renders here in whichever view and theme is
// active. Sample values are deliberately generic: no invented facts.
export const metadata: Metadata = {
  title: "System",
  robots: { index: false, follow: false },
};

const TYPE_STYLES = [
  ["type-display-160", "Aa"],
  ["type-display-96", "One system"],
  ["type-display-64", "Two densities"],
  ["type-display-40", "Same tokens, two readings."],
  ["type-sans-28", "Selected work"],
  ["type-sans-28-medium", "Selected work"],
  ["type-sans-20", "Section title"],
  ["type-sans-20-medium", "Section title"],
  ["type-sans-16", "Site body text sits in a ~680px measure at line-height 1.6."],
  ["type-sans-16-medium", "Site body text sits in a ~680px measure at line-height 1.6."],
  ["type-sans-14", "Navigation, buttons and dashboard body."],
  ["type-sans-14-medium", "Navigation, buttons and dashboard body."],
  ["type-sans-13", "Sidebar items, table cells, panel headers."],
  ["type-sans-13-medium", "Sidebar items, table cells, panel headers."],
  ["type-mono-13", "2026 · 1,284 · 12:00"],
  ["type-mono-12", "2026 · 1,284 · 12:00"],
  ["type-mono-11", "2026 · 1,284 · 12:00"],
] as const;

// Literal class names so Tailwind generates them.
const SWATCHES = [
  ["--color-bg", "bg-bg"],
  ["--color-surface", "bg-surface"],
  ["--color-fg", "bg-fg"],
  ["--color-fg-muted", "bg-fg-muted"],
  ["--color-line", "bg-line"],
  ["--color-line-strong", "bg-line-strong"],
  ["--color-danger", "bg-danger"],
  ["--color-danger-bg", "bg-danger-bg"],
] as const;

function Specimen({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div data-primitive={name} className="flex flex-col gap-3 border-b py-6 last:border-b-0">
      <MetaLabel>{name}</MetaLabel>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  );
}

const photoColumns = [
  { header: "Title", cell: (photo: Photo) => photo.title },
  { header: "Camera", cell: (photo: Photo) => photo.camera ?? "", mono: true },
  { header: "Date", cell: (photo: Photo) => formatDate(photo.date), mono: true, align: "right" as const },
];

export default async function SystemPage({ params }: PageProps<"/[view]/system">) {
  assertView((await params).view);
  const photos = await getPhotos();
  const [photo] = photos;

  return (
    <div className="flex flex-col gap-16 py-16 dashboard:gap-8 dashboard:p-6">
      <h1 className="type-display-64 dashboard:type-sans-20-medium">System</h1>

      <Band label="Type" source="17 styles">
        <div className="flex flex-col">
          {TYPE_STYLES.map(([style, sample]) => (
            <div key={style} data-type={style} className="flex flex-col gap-2 border-b py-4 last:border-b-0">
              <MetaLabel>{style}</MetaLabel>
              <p className={style}>{sample}</p>
            </div>
          ))}
        </div>
      </Band>

      <Band label="Color" source="8 tokens">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {SWATCHES.map(([token, swatch]) => (
            <div key={token} className="flex flex-col gap-2">
              <span className={`h-12 border ${swatch}`} />
              <span className="type-mono-12">{token}</span>
            </div>
          ))}
        </div>
      </Band>

      <Band label="Primitives">
        <Specimen name="MetaLabel">
          <MetaLabel>Label</MetaLabel>
          <MetaLabel status="ok">With a glyph</MetaLabel>
        </Specimen>
        <Specimen name="StatusGlyph">
          <span className="type-sans-16">
            <StatusGlyph status="ok" /> ok · <StatusGlyph status="late" /> late ·{" "}
            <StatusGlyph status="empty" /> empty · <StatusGlyph status="error" /> error · → link · × close
          </span>
        </Specimen>
        <Specimen name="Chip">
          <Chip>live</Chip>
          <Chip tone="danger">error</Chip>
        </Specimen>
        <Specimen name="EraStamp">
          <EraStamp parts={["Year", "Platform", "Era"]} />
        </Specimen>
        <Specimen name="TextLink">
          <TextLink href="/life/">Internal link</TextLink>
          <TextLink href="https://github.com/onursenture">External link</TextLink>
        </Specimen>
        <Specimen name="Button">
          <Button variant="primary">Primary</Button>
          <Button variant="ghost">Ghost →</Button>
          <Button variant="text">Text</Button>
        </Specimen>
        <Specimen name="Toggle">
          <ToggleDemo />
        </Specimen>
        <Specimen name="RelativeTime">
          <span className="type-mono-12">
            {photo ? <RelativeTime iso={`${photo.date}T00:00:00.000Z`} /> : null}
          </span>
        </Specimen>
        <Specimen name="LiveClock">
          <span className="type-mono-12">
            ANKARA <LiveClock timeZone="Europe/Istanbul" place="Ankara" />
          </span>
        </Specimen>
        <Specimen name="Cover">
          <div className="w-24">
            <Cover src="" alt="" />
          </div>
        </Specimen>
        <Specimen name="Stat">
          <div className="w-full">
            <StatRow>
              <Stat label="Photos" value={photos.length} />
              <Stat label="Type styles" value={TYPE_STYLES.length} />
              <Stat label="Color tokens" value={SWATCHES.length} />
            </StatRow>
          </div>
        </Specimen>
        <Specimen name="Panel">
          <div className="w-full">
            <Panel title="Photos" count={photos.length}>
              <p className="p-3 type-sans-13">Panel body.</p>
            </Panel>
          </div>
        </Specimen>
        <Specimen name="DataTable">
          <div className="grid w-full gap-4 md:grid-cols-2">
            <Panel title="With rows" count={photos.length}>
              <DataTable columns={photoColumns} rows={photos} rowKey={(p) => p.slug} caption="Photos" />
            </Panel>
            <Panel title="Empty" count={0}>
              <DataTable columns={photoColumns} rows={[]} rowKey={(p) => p.slug} />
            </Panel>
          </div>
        </Specimen>
        <Specimen name="Band">
          <div className="w-full">
            <Band label="Label" source="Source" href="/life/">
              <p className="type-sans-16">Band content.</p>
            </Band>
          </div>
        </Specimen>
        <Specimen name="IndexRow">
          <div className="w-full">
            <IndexRow entry={{ years: "Year", title: "Title", meta: "meta", role: "Role", era: "Era" }} />
            <IndexRow entry={{ title: "Linked row", meta: "the whole row is the link", href: "/life/" }} />
            <IndexRow entry={{ title: "Plain row", meta: "no link, no year, no role" }} />
            <IndexRow entry={{ title: "With a status", meta: "◐ wip", status: "late", statusLabel: "in progress" }} />
          </div>
        </Specimen>
        <Specimen name="Empty">
          <Empty />
        </Specimen>
        <Specimen name="Picture">
          {photo ? (
            <div className="w-full max-w-sm">
              <Picture image={photo.image} alt={photo.title} sizes="384px" />
            </div>
          ) : null}
        </Specimen>
      </Band>
    </div>
  );
}
```

Create `e2e/system.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const PRIMITIVES = [
  "MetaLabel",
  "StatusGlyph",
  "Chip",
  "EraStamp",
  "TextLink",
  "Button",
  "Toggle",
  "RelativeTime",
  "LiveClock",
  "Cover",
  "Stat",
  "Panel",
  "DataTable",
  "Band",
  "IndexRow",
  "Empty",
  "Picture",
];

for (const view of ["site", "dashboard"]) {
  test(`/system/ renders every primitive and the type scale in the ${view} view`, async ({ page }) => {
    await page.goto(`/system/?view=${view}`);
    await expect(page.locator("[data-view]")).toHaveAttribute("data-view", view);
    for (const name of PRIMITIVES) {
      await expect(page.locator(`[data-primitive="${name}"]`)).toBeVisible();
    }
    await expect(page.locator("[data-type]")).toHaveCount(17);
  });
}

test("/system/ is not indexed", async ({ page }) => {
  await page.goto("/system/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});
```

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 21 files, 111 tests.
- `e2e`: 23 passed.
- `e2e:fixtures`: 2 passed.

The route table lists `/site/system` and `/dashboard/system` as static.

- [ ] **Step 6: Visual check**

```bash
npm run screenshots -- .superpowers/screens/task-3 /system/
```

Compare with Figma "01 Specimen" (`0:1`) and "04 Components" (`2:46`). Check that:
- The display sizes are tight.
- Mono labels are uppercase.
- Panels are square, on `--color-surface` with a 1px rule.
- The toggle's frame has a 4px radius and its segments are square.
- There are no shadows anywhere.
- The error glyph and chip are the only red.

The dashboard screenshots still show the S2 header; the shells arrive in Task 5.

- [ ] **Step 7: Commit**

```bash
git add components/ui components/system "app/[view]/system" tests/ui/layout-primitives.test.tsx e2e/system.spec.ts
git commit -m "Add layout primitives and the /system/ style tile

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Preference cookies and segmented toggles

Closes the S2 follow-ups on the toggles:
- **Cookie attributes:** they now live in one module, `lib/view/cookies.ts`, which both `proxy.ts` and the two toggles use.
- **Theme cookie regex:** it is anchored at both ends (`(?:;|$)`), so `theme=darkish` no longer reads as `dark`.
- **Toggle markup:** both toggles become `Toggle` segmented controls with `aria-pressed` and consistent labels: Theme is Light / Dark / Auto, View is Site / Dashboard.

The e2e specs that clicked the old single buttons now click a segment.

**Files:**
- Create: `lib/view/cookies.ts`, `tests/cookies.test.ts`
- Replace: `lib/view/theme.ts`, `components/theme-toggle.tsx`, `components/view-toggle.tsx`, `e2e/view-and-theme.spec.ts`
- Modify: `proxy.ts`, `e2e/life.spec.ts`

**Interfaces:**
- Consumes: Task 2's `Toggle`.
- Produces:
  - `PREFERENCE_COOKIE_MAX_AGE` and `PREFERENCE_COOKIE` (`{ path: "/", maxAge, sameSite: "lax" }`) from `@/lib/view/cookies`.
  - `serializeCookie(name, value): string` (a `document.cookie` assignment) from the same module.
  - `cookiePattern(name, values): RegExp` from the same module.
  - `themeScript` uses the anchored pattern.
  - DOM contract: the toggles are `role="group"`, named "Theme" (`data-testid="theme-toggle"`) and "View" (`data-testid="view-toggle"`), with one `aria-pressed` button per option. `ThemeToggle()` and `ViewToggle({ current })` keep their signatures.

- [ ] **Step 1: Write the failing test**

Create `tests/cookies.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PREFERENCE_COOKIE, cookiePattern, serializeCookie } from "@/lib/view/cookies";
import { themeScript } from "@/lib/view/theme";

describe("preference cookies", () => {
  it("serializes with the same attributes the proxy uses", () => {
    expect(serializeCookie("view", "dashboard")).toBe(
      `view=dashboard; path=${PREFERENCE_COOKIE.path}; max-age=${PREFERENCE_COOKIE.maxAge}; samesite=${PREFERENCE_COOKIE.sameSite}`,
    );
    expect(PREFERENCE_COOKIE.maxAge).toBe(31_536_000);
  });

  it("matches a cookie only as a whole name=value pair", () => {
    const pattern = cookiePattern("theme", "light|dark|system");
    expect("theme=dark".match(pattern)?.[1]).toBe("dark");
    expect("view=site; theme=light; x=1".match(pattern)?.[1]).toBe("light");
    expect("theme=darkish").not.toMatch(pattern);
    expect("xtheme=dark").not.toMatch(pattern);
  });
});

describe("themeScript", () => {
  // Runs the inline script against a stand-in document and window.
  function run(cookie: string, osDark = false) {
    const root = { dataset: {} as Record<string, string> };
    const document = { cookie, documentElement: root };
    const window = { matchMedia: () => ({ matches: osDark }) };
    new Function("document", "window", themeScript)(document, window);
    return root.dataset;
  }

  it("applies the cookie's theme", () => {
    expect(run("theme=dark")).toEqual({ theme: "dark", themePreference: "dark" });
    expect(run("view=site; theme=light")).toEqual({ theme: "light", themePreference: "light" });
  });

  it("falls back to the OS for system, a missing cookie or a malformed one", () => {
    expect(run("theme=system", true)).toEqual({ theme: "dark", themePreference: "system" });
    expect(run("", false)).toEqual({ theme: "light", themePreference: "system" });
    expect(run("theme=darkish", false)).toEqual({ theme: "light", themePreference: "system" });
  });
});
```

Run: `npm test -- tests/cookies.test.ts`
Expected: FAIL, because `@/lib/view/cookies` cannot be resolved.

- [ ] **Step 2: Centralize the cookie attributes**

Create `lib/view/cookies.ts`:

```ts
// The view and theme preference cookies share one set of attributes. proxy.ts
// sets them through NextResponse.cookies; the toggles write document.cookie.
// Both read from here, so the two can't drift apart.
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const PREFERENCE_COOKIE = {
  path: "/",
  maxAge: PREFERENCE_COOKIE_MAX_AGE,
  sameSite: "lax",
} as const;

// A document.cookie assignment string with the shared attributes.
export function serializeCookie(name: string, value: string): string {
  return `${name}=${encodeURIComponent(value)}; path=/; max-age=${PREFERENCE_COOKIE_MAX_AGE}; samesite=lax`;
}

// Matches `name=value` as a whole cookie in a Cookie header or
// document.cookie, capturing the value. `values` is a regex alternation such
// as "light|dark". Anchored at both ends, so "xtheme=dark" and
// "theme=darkish" don't match.
export function cookiePattern(name: string, values: string): RegExp {
  return new RegExp(`(?:^|;\\s*)${name}=(${values})(?:;|$)`);
}
```

Replace `lib/view/theme.ts` with:

```ts
import { cookiePattern } from "./cookies";

export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export const THEME_COOKIE = "theme";

const THEME_COOKIE_PATTERN = cookiePattern(THEME_COOKIE, THEME_PREFERENCES.join("|"));

// Runs inline in <head> before first paint: reads the theme cookie, resolves
// "system" against the OS setting, and sets <html data-theme>. Kept tiny and
// dependency-free because it is injected as a string.
export const themeScript = `(function(){try{var m=document.cookie.match(new RegExp(${JSON.stringify(THEME_COOKIE_PATTERN.source)}));var p=m?m[1]:"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.dataset.theme=d?"dark":"light";r.dataset.themePreference=p;}catch(e){}})();`;
```

In `proxy.ts`, replace:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { VIEW_COOKIE, VIEW_QUERY, isView, resolveView } from "@/lib/view/views";

const ONE_YEAR = 60 * 60 * 24 * 365;
```

with:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { PREFERENCE_COOKIE } from "@/lib/view/cookies";
import { VIEW_COOKIE, VIEW_QUERY, isView, resolveView } from "@/lib/view/views";
```

and replace:

```ts
    response.cookies.set(VIEW_COOKIE, query, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
```

with:

```ts
    response.cookies.set(VIEW_COOKIE, query, PREFERENCE_COOKIE);
```

Run: `npm test -- tests/cookies.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 3: Rebuild the toggles on `Toggle`**

Replace `components/theme-toggle.tsx` with:

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { Toggle } from "@/components/ui/toggle";
import { serializeCookie } from "@/lib/view/cookies";
import { THEME_COOKIE, THEME_PREFERENCES, type ThemePreference } from "@/lib/view/theme";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

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

// Light / Dark / Auto. Theme switches are instant (no transition).
export function ThemeToggle() {
  // Server render has no preference; "system" matches the script's default.
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  function choose(next: ThemePreference) {
    document.cookie = serializeCookie(THEME_COOKIE, next);
    apply(next);
    listeners.forEach((l) => l());
  }

  return <Toggle label="Theme" testId="theme-toggle" options={OPTIONS} value={preference} onChange={choose} />;
}
```

Replace `components/view-toggle.tsx` with:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Toggle } from "@/components/ui/toggle";
import { serializeCookie } from "@/lib/view/cookies";
import { VIEW_COOKIE, type View } from "@/lib/view/views";

const OPTIONS = [
  { value: "site", label: "Site" },
  { value: "dashboard", label: "Dashboard" },
] as const satisfies readonly { value: View; label: string }[];

export function ViewToggle({ current }: { current: View }) {
  const router = useRouter();

  function choose(next: View) {
    if (next === current) return;
    document.cookie = serializeCookie(VIEW_COOKIE, next);
    // Re-requests the current URL; the proxy now rewrites to the other
    // variant. Also drops the client router cache so later navigations
    // don't serve prefetched pages of the old view.
    router.refresh();
  }

  return <Toggle label="View" testId="view-toggle" options={OPTIONS} value={current} onChange={choose} />;
}
```

- [ ] **Step 4: Update the e2e specs for segmented toggles**

Replace `e2e/view-and-theme.spec.ts` with:

```ts
import { expect, type Page, test } from "@playwright/test";

const viewOf = (page: Page) => page.locator("[data-view]").getAttribute("data-view");

// Role locators skip hidden elements, so these keep working after a client
// navigation, when Next keeps the previous view's tree mounted but hidden.
const viewButton = (page: Page, name: "Site" | "Dashboard") =>
  page.getByRole("group", { name: "View" }).getByRole("button", { name });
const themeButton = (page: Page, name: "Light" | "Dark" | "Auto") =>
  page.getByRole("group", { name: "Theme" }).getByRole("button", { name });

test("defaults to the site view", async ({ page }) => {
  await page.goto("/");
  expect(await viewOf(page)).toBe("site");
});

test("?view=dashboard switches, redirects to a clean URL, and persists via cookie", async ({ page }) => {
  await page.goto("/?view=dashboard");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  expect(await viewOf(page)).toBe("dashboard");
  await page.goto("/");
  expect(await viewOf(page)).toBe("dashboard");
});

test("the toggle works after arriving via a ?view= link", async ({ page }) => {
  await page.goto("/?view=dashboard");
  await viewButton(page, "Site").click();
  await expect(page.locator('[data-view="site"]')).toBeVisible();
  await page.reload();
  expect(await viewOf(page)).toBe("site");
});

test("the toggle switches view in place and survives a reload", async ({ page }) => {
  await page.goto("/");
  await viewButton(page, "Dashboard").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await page.reload();
  expect(await viewOf(page)).toBe("dashboard");
  await viewButton(page, "Site").click();
  await expect(page.locator('[data-view="site"]')).toBeVisible();
});

test("the toggles mark the current option with aria-pressed", async ({ page }) => {
  await page.goto("/");
  await expect(viewButton(page, "Site")).toHaveAttribute("aria-pressed", "true");
  await expect(viewButton(page, "Dashboard")).toHaveAttribute("aria-pressed", "false");
  await expect(themeButton(page, "Auto")).toHaveAttribute("aria-pressed", "true");
});

test("internal view prefixes redirect to clean URLs", async ({ page }) => {
  await page.goto("/dashboard/");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
});

test("the theme cookie applies before paint and the toggle sets light, dark and auto", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeButton(page, "Dark")).toHaveAttribute("aria-pressed", "true");
  await themeButton(page, "Auto").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await themeButton(page, "Light").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

// A 404 looks the same whether or not the proxy ran, so probe with ?view=,
// which only the proxy answers (with a redirect).
test("only /api and /_next skip the proxy, not paths that merely start with them", async ({ request }) => {
  const proxied = await request.get("/apiary/?view=dashboard", { maxRedirects: 0 });
  expect(proxied.status()).toBe(307);
  expect(proxied.headers()["location"]).toMatch(/\/apiary\/$/);

  const skipped = await request.get("/api/anything/?view=dashboard", { maxRedirects: 0 });
  expect(skipped.status()).toBe(404);
});

test("unknown pages 404", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
});
```

In `e2e/life.spec.ts`, replace:

```ts
  await page.getByTestId("view-toggle").click();
```

with:

```ts
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Dashboard" }).click();
```

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 22 files, 115 tests.
- `e2e`: 24 passed.
- `e2e:fixtures`: 2 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/view proxy.ts components/theme-toggle.tsx components/view-toggle.tsx tests/cookies.test.ts e2e/view-and-theme.spec.ts e2e/life.spec.ts
git commit -m "Centralize preference cookies and make the toggles segmented

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Site and dashboard shells

Replaces the S2 header with the two S1 shells.

The **site** view has:
- a 64px top bar on the 12-column grid: the name on 3 columns, the nav from column 4, and "Book a call" plus the toggles on the right
- a 1200px content container
- a mono footer with the social links and an empty `data-slot="paddle"`

The **dashboard** view has:
- a 240px sidebar: the name, then the nav with Overview first, then the toggles and the source sync line at the foot
- the content column beside it

Below 768px:
- The site bar becomes the name plus "Menu", which opens a full-screen native `<dialog>`.
- The dashboard sidebar becomes a top bar whose "Menu" opens the same content as a slide-over `<dialog>`.

The nav comes from `lib/nav.ts`; only `ready` items render, which in S3 is Life. The task adds `content/profile.ts` (confirmed facts only) and the source-health logic that the sync line needs.

**Files:**
- Create: `content/profile.ts`, `lib/nav.ts`, `lib/sources/health.ts`, `lib/sources/status.ts`
- Create: `components/sources/source-health.tsx`
- Create in `components/shell/`: `nav-links.tsx`, `menu-dialog.tsx`, `shell-controls.tsx`, `site-footer.tsx`, `site-shell.tsx`, `dashboard-shell.tsx`
- Create: `tests/nav.test.ts`, `tests/sources/health.test.ts`, `tests/content/profile.test.ts`, `e2e/shell.spec.ts`
- Modify: `lib/sources/types.ts`
- Replace: `app/[view]/layout.tsx`

**Interfaces:**
- Consumes: Task 2's `Button`, `ButtonLink`, `StatusGlyph`, `RelativeTime`, `useNow` and `cx`. Task 4's `ThemeToggle` and `ViewToggle`. S2's `readSource`, `getSource` and `SOURCE_IDS`.
- Produces:
  - Profile types: `type MetaSegment = { text } | { clock, label } | { availability: true }` and `interface Profile` from `@/content/profile`.
  - Profile data:
    - `profile`, with `name`, `identity`, `meta`, `available: true`, no `bookingUrl` and no `metrics`
    - `socialLinks(p?)`, which returns `[{ label, href }]` in footer order: GitHub, Letterboxd, Goodreads, X, Dribbble
  - Nav: `interface NavItem { label; href; ready; also? }`, `NAV_ITEMS`, `OVERVIEW`, `readyItems()`, `cleanPath(pathname)` and `isActive(item, pathname)` from `@/lib/nav`.
  - Labels: `SOURCE_LABELS: Record<SourceId, string>` from `@/lib/sources/types`.
  - Health types: `interface SourceStatus { id; label; intervalMinutes; lastSuccessAt }`, `type Health = "ok" | "late" | "never"` and `HEALTH_LABELS` from `@/lib/sources/health`.
  - Health functions: `sourceHealth(lastSuccessAt, intervalMinutes, now: number | null): Health` and `summarizeHealth(statuses, now): { ok, total, latest, overall }`.
  - Status loader: `readSourceStatuses(): Promise<SourceStatus[]>` from `@/lib/sources/status` (server-only).
  - Sync line: `SyncLine({ statuses })` (client, `data-testid="sync-line"`) from `@/components/sources/source-health`.
  - Shell components:
    - `NavLinks({ items, placement: "bar" | "list" })` (client): `<nav aria-label="Main">`, with `aria-current="page"` on the active item
    - `MenuDialog({ variant: "full" | "slide", title, children })` (client): a "Menu" button that opens a `<dialog aria-label="Menu">` with a "Close menu" (×) button
    - `ShellControls({ view })`
    - `SiteFooter()`
    - `SiteShell({ children })` and `DashboardShell({ children })`
  - DOM contract: the dashboard sidebar is the only `<aside>` on the page.

- [ ] **Step 1: Write the failing tests**

Create `tests/nav.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { NAV_ITEMS, OVERVIEW, cleanPath, isActive, readyItems } from "@/lib/nav";

describe("nav config", () => {
  it("keeps the foundation IA order and renders only ready items", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Work", "Lab", "Resume", "Notes", "Life"]);
    expect(readyItems().map((i) => i.label)).toEqual(["Life"]);
  });

  it("strips the internal view prefix that prerendering sees", () => {
    expect(cleanPath("/site/")).toBe("/");
    expect(cleanPath("/dashboard/life/")).toBe("/life/");
    expect(cleanPath("/life/")).toBe("/life/");
    expect(cleanPath("/sitemap/")).toBe("/sitemap/");
  });

  it("matches Overview exactly and Life by prefix, including photos", () => {
    const life = NAV_ITEMS.find((i) => i.label === "Life")!;
    expect(isActive(OVERVIEW, "/")).toBe(true);
    expect(isActive(OVERVIEW, "/site/")).toBe(true);
    expect(isActive(OVERVIEW, "/life/")).toBe(false);
    expect(isActive(life, "/life/")).toBe(true);
    expect(isActive(life, "/site/life/")).toBe(true);
    expect(isActive(life, "/photos/stabilo/")).toBe(true);
    expect(isActive(life, "/system/")).toBe(false);
  });
});
```

Create `tests/sources/health.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { type SourceStatus, sourceHealth, summarizeHealth } from "@/lib/sources/health";

const now = Date.parse("2026-10-03T12:00:00.000Z");
const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

describe("sourceHealth", () => {
  it("is ok up to and including twice the interval", () => {
    expect(sourceHealth(ago(0), 60, now)).toBe("ok");
    expect(sourceHealth(ago(120), 60, now)).toBe("ok");
  });

  it("is late past twice the interval", () => {
    expect(sourceHealth(new Date(now - 120 * 60_000 - 1).toISOString(), 60, now)).toBe("late");
    expect(sourceHealth(ago(361), 180, now)).toBe("late");
  });

  it("is never without a usable sync time", () => {
    expect(sourceHealth(null, 60, now)).toBe("never");
    expect(sourceHealth("nope", 60, now)).toBe("never");
  });

  it("counts any past sync as ok before the client knows the time", () => {
    expect(sourceHealth(ago(10_000), 60, null)).toBe("ok");
    expect(sourceHealth(null, 60, null)).toBe("never");
  });
});

describe("summarizeHealth", () => {
  const status = (id: SourceStatus["id"], lastSuccessAt: string | null): SourceStatus => ({
    id,
    label: id,
    intervalMinutes: 60,
    lastSuccessAt,
  });

  it("counts ok sources and finds the latest sync", () => {
    const summary = summarizeHealth(
      [status("github", ago(5)), status("instapaper", ago(500)), status("writing", null)],
      now,
    );
    expect(summary).toEqual({ ok: 1, total: 3, latest: ago(5), overall: "late" });
  });

  it("is ok when all are ok and never when none ever synced", () => {
    expect(summarizeHealth([status("github", ago(5))], now).overall).toBe("ok");
    expect(summarizeHealth([status("github", null), status("writing", null)], now)).toEqual({
      ok: 0,
      total: 2,
      latest: null,
      overall: "never",
    });
  });
});
```

Create `tests/content/profile.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { profile, socialLinks } from "@/content/profile";

describe("profile", () => {
  it("builds the footer links from the handles, in footer order", () => {
    expect(socialLinks()).toEqual([
      { label: "GitHub", href: "https://github.com/onursenture" },
      { label: "Letterboxd", href: "https://letterboxd.com/onur/" },
      { label: "Goodreads", href: "https://www.goodreads.com/onur" },
      { label: "X", href: "https://x.com/w00f" },
      { label: "Dribbble", href: "https://dribbble.com/onursenture" },
    ]);
  });

  it("ships without a booking link or career metrics until they are confirmed", () => {
    expect(profile.bookingUrl).toBeUndefined();
    expect(profile.metrics).toBeUndefined();
  });
});
```

Run: `npm test`
Expected: FAIL. `@/lib/nav`, `@/lib/sources/health` and `@/content/profile` cannot be resolved.

- [ ] **Step 2: Add the profile, nav config and health logic**

Create `content/profile.ts` (use these values as given; they are the confirmed facts):

```ts
// Who the site is about. Only facts Onur has confirmed go here.

// One segment of the home page's mono meta line, joined by " · ".
export type MetaSegment =
  | { text: string }
  // The label plus a live HH:mm clock in that IANA time zone.
  | { clock: string; label: string }
  // "OPEN TO ROLES", shown only while `available` is true.
  | { availability: true };

export interface Profile {
  name: string;
  // The home page headline.
  identity?: string;
  meta?: MetaSegment[];
  available: boolean;
  // "Book a call →" renders only when this is set (S6).
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
  // Career metrics for the dashboard Stat row, shown only when present (S4).
  metrics?: { label: string; value: string }[];
}

export const profile: Profile = {
  name: "Onur Senture",
  identity: "From components to complete apps, designed and built end to end.",
  meta: [
    { text: "DESIGNER + BUILDER" },
    { clock: "Europe/Istanbul", label: "ANKARA" },
    { availability: true },
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

export interface SocialLink {
  label: string;
  href: string;
}

// The footer's links, in footer order.
export function socialLinks(p: Profile = profile): SocialLink[] {
  return [
    { label: "GitHub", href: `https://github.com/${p.social.github}` },
    { label: "Letterboxd", href: `https://letterboxd.com/${p.social.letterboxd}/` },
    { label: "Goodreads", href: `https://www.goodreads.com/${p.social.goodreads}` },
    { label: "X", href: `https://x.com/${p.social.x}` },
    { label: "Dribbble", href: `https://dribbble.com/${p.social.dribbble}` },
  ];
}
```

Create `lib/nav.ts`:

```ts
import { VIEWS } from "./view/views";

export interface NavItem {
  label: string;
  href: string;
  // Only ready items render; flip the flag when the section ships.
  ready: boolean;
  // Other path prefixes that belong to this item.
  also?: string[];
}

// Foundation IA order. Photos is not an item: it lives under Life.
export const NAV_ITEMS: NavItem[] = [
  { label: "Work", href: "/work/", ready: false },
  { label: "Lab", href: "/lab/", ready: false },
  { label: "Resume", href: "/resume/", ready: false },
  { label: "Notes", href: "/notes/", ready: false },
  { label: "Life", href: "/life/", ready: true, also: ["/photos/"] },
];

// First item of the dashboard sidebar; the site links home from the name.
export const OVERVIEW: NavItem = { label: "Overview", href: "/", ready: true };

export function readyItems(items: NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.ready);
}

// usePathname() returns the rewritten /site/... path while prerendering and
// the browser's clean path after hydration. Comparing clean paths keeps the
// server HTML and the client render identical.
export function cleanPath(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  return (VIEWS as readonly string[]).includes(first) ? `/${rest.join("/")}` : pathname;
}

export function isActive(item: NavItem, pathname: string): boolean {
  const path = cleanPath(pathname);
  if (item.href === "/") return path === "/";
  return [item.href, ...(item.also ?? [])].some((prefix) => path.startsWith(prefix));
}
```

Create `lib/sources/health.ts`:

```ts
import type { SourceId } from "./types";

// What the public pages know about a source's freshness. Error details stay
// admin-only (S7), so there is no public error state.
export interface SourceStatus {
  id: SourceId;
  label: string;
  intervalMinutes: number;
  // ISO timestamp of the last successful sync, null if never synced.
  lastSuccessAt: string | null;
}

// ok: synced within 2× its interval. late: synced, but longer ago. never:
// no successful sync yet.
export type Health = "ok" | "late" | "never";

export const HEALTH_LABELS: Record<Health, string> = {
  ok: "synced",
  late: "late",
  never: "never synced",
};

// `now` is null while prerendering and before hydration; until the client
// knows the time, any past sync counts as ok.
export function sourceHealth(lastSuccessAt: string | null, intervalMinutes: number, now: number | null): Health {
  const time = lastSuccessAt ? Date.parse(lastSuccessAt) : NaN;
  if (Number.isNaN(time)) return "never";
  if (now === null) return "ok";
  return now - time <= 2 * intervalMinutes * 60_000 ? "ok" : "late";
}

export interface HealthSummary {
  ok: number;
  total: number;
  // The most recent successful sync across all sources.
  latest: string | null;
  // ok when every source is ok, never when none ever synced, else late.
  overall: Health;
}

export function summarizeHealth(statuses: SourceStatus[], now: number | null): HealthSummary {
  const healths = statuses.map((s) => sourceHealth(s.lastSuccessAt, s.intervalMinutes, now));
  const ok = healths.filter((h) => h === "ok").length;
  const synced = statuses.map((s) => s.lastSuccessAt).filter((at): at is string => at !== null);
  const latest = synced.length > 0 ? synced.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b)) : null;
  const overall: Health =
    ok === statuses.length ? "ok" : healths.every((h) => h === "never") ? "never" : "late";
  return { ok, total: statuses.length, latest, overall };
}
```

In `lib/sources/types.ts`, replace:

```ts
export type SourceId = (typeof SOURCE_IDS)[number];
```

with:

```ts
export type SourceId = (typeof SOURCE_IDS)[number];

// Display names, e.g. in the Sources panel.
export const SOURCE_LABELS: Record<SourceId, string> = {
  letterboxd: "Letterboxd",
  goodreads: "Goodreads",
  instapaper: "Instapaper",
  writing: "w00f.org",
  github: "GitHub",
};
```

Create `lib/sources/status.ts`:

```ts
import "server-only";
import type { SourceStatus } from "./health";
import { readSource } from "./read";
import { getSource } from "./registry";
import { SOURCE_IDS, SOURCE_LABELS } from "./types";

// Freshness of every source, for the sidebar sync line and the Sources
// panel. Reads the same cached snapshots as the sections.
export async function readSourceStatuses(): Promise<SourceStatus[]> {
  const views = await Promise.all(SOURCE_IDS.map((id) => readSource(id)));
  return SOURCE_IDS.map((id, i) => ({
    id,
    label: SOURCE_LABELS[id],
    intervalMinutes: getSource(id).intervalMinutes,
    lastSuccessAt: views[i].lastSuccessAt,
  }));
}
```

Run: `npm test`
Expected: PASS (25 files, 126 tests).

- [ ] **Step 3: Add the client pieces of the shell**

Create `components/sources/source-health.tsx`:

```tsx
"use client";

import { RelativeTime } from "@/components/ui/relative-time";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { useNow } from "@/components/ui/use-now";
import { type Health, type SourceStatus, summarizeHealth } from "@/lib/sources/health";

const GLYPHS: Record<Health, GlyphStatus> = { ok: "ok", late: "late", never: "empty" };

// Health depends on the current time, so it is computed on the client.

// "● 5/5 synced · 12m ago" under the sidebar toggles.
export function SyncLine({ statuses }: { statuses: SourceStatus[] }) {
  const summary = summarizeHealth(statuses, useNow());
  return (
    <p data-testid="sync-line" className="flex flex-wrap items-center gap-x-1.5 type-mono-11 text-fg-muted">
      <StatusGlyph status={GLYPHS[summary.overall]} />
      <span>
        {summary.ok}/{summary.total} synced
      </span>
      {summary.latest ? (
        <>
          <span aria-hidden="true">·</span>
          <RelativeTime iso={summary.latest} />
        </>
      ) : null}
    </p>
  );
}
```

Create `components/shell/nav-links.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { type NavItem, isActive } from "@/lib/nav";

// The same list at two densities: the site top bar (Text 14) and the
// dashboard sidebar or mobile menu (Text 13, full width). Hover underlines;
// the active item is inverted.
export function NavLinks({ items, placement }: { items: NavItem[]; placement: "bar" | "list" }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main">
      <ul className={placement === "bar" ? "flex items-center gap-1" : "flex flex-col"}>
        {items.map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center",
                  placement === "bar" ? "h-7 px-2 type-sans-14" : "h-8 w-full px-3 type-sans-13",
                  active ? "bg-fg text-bg" : "hover:underline hover:underline-offset-[0.2em]",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

Create `components/shell/menu-dialog.tsx`:

```tsx
"use client";

import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";

// The mobile menu (below md): a native modal <dialog>, full-screen for the
// site and a 312px slide-over for the dashboard. Its content mounts only
// while open, so the toggles inside never duplicate the desktop ones in the
// DOM. Following a link, or clicking the backdrop, closes it.
export function MenuDialog({
  variant,
  title,
  children,
}: {
  variant: "full" | "slide";
  title: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) ref.current?.showModal();
  }, [open]);

  // A view switch hides this tree (Next keeps it mounted but hidden) and
  // runs effect cleanups; close the modal then, or the new page stays inert.
  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);

  function onClick(event: MouseEvent<HTMLDialogElement>) {
    const target = event.target as HTMLElement;
    if (target === event.currentTarget || target.closest("a")) ref.current?.close();
  }

  return (
    <>
      <Button variant="text" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        Menu
      </Button>
      <dialog
        ref={ref}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={onClick}
        className={cx(
          "m-0 h-dvh max-h-none p-0 text-fg",
          variant === "full"
            ? "w-full max-w-none bg-bg"
            : "w-78 max-w-[calc(100%-3rem)] border-r bg-surface backdrop:bg-bg/70",
        )}
      >
        {open ? (
          <div className="flex h-full flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between border-b pr-1 pl-4">
              {title}
              <Button variant="text" aria-label="Close menu" onClick={() => ref.current?.close()}>
                ×
              </Button>
            </div>
            {children}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
```

Create `components/shell/shell-controls.tsx`:

```tsx
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ViewToggle } from "@/components/view-toggle";
import type { View } from "@/lib/view/views";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 pl-3">
      <span aria-hidden="true" className="type-mono-11 text-fg-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

// Labelled Theme and View toggles, stacked: the sidebar foot and the mobile
// menus.
export function ShellControls({ view }: { view: View }) {
  return (
    <div className="flex flex-col gap-2">
      <Row label="Theme">
        <ThemeToggle />
      </Row>
      <Row label="View">
        <ViewToggle current={view} />
      </Row>
    </div>
  );
}
```

- [ ] **Step 4: Add the shells and wire the layout**

Create `components/shell/site-footer.tsx`:

```tsx
import { cacheLife } from "next/cache";
import { Fragment } from "react";
import { profile, socialLinks } from "@/content/profile";

// Pages are prerendered and the year changes once a year; a cached read
// keeps `new Date()` out of the render (Cache Components requires that).
async function copyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

// One mono line: © year, the social links, and a slot reserved for the S9
// paddle easter egg.
export async function SiteFooter() {
  const year = await copyrightYear();
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-312 flex-wrap items-center gap-x-2 gap-y-1 px-4 py-6 type-mono-11 text-fg-muted md:px-6">
        <span>
          © {year} {profile.name}
        </span>
        {socialLinks().map((link) => (
          <Fragment key={link.label}>
            <span aria-hidden="true">·</span>
            <a href={link.href} rel="noopener noreferrer" className="hover:text-fg hover:underline">
              {link.label}
            </a>
          </Fragment>
        ))}
        <div data-slot="paddle" className="ml-auto" />
      </div>
    </footer>
  );
}
```

Create `components/shell/site-shell.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { ViewToggle } from "@/components/view-toggle";
import { profile } from "@/content/profile";
import { readyItems } from "@/lib/nav";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { ShellControls } from "./shell-controls";
import { SiteFooter } from "./site-footer";

function BookACall() {
  if (!profile.bookingUrl) return null;
  return <ButtonLink href={profile.bookingUrl}>Book a call →</ButtonLink>;
}

// Site view: a 64px top bar on the 12-column grid (name on 3 columns, nav
// from column 4, actions on the right), content in a 1200px container, and
// the footer. Below md the bar collapses to the name and a Menu button.
export function SiteShell({ children }: { children: ReactNode }) {
  const name = (
    <Link href="/" className="type-sans-14-medium">
      {profile.name}
    </Link>
  );
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-312 items-center justify-between pr-1 pl-4 md:grid md:h-16 md:grid-cols-12 md:gap-x-6 md:px-6">
          <div className="md:col-span-3">{name}</div>
          <div className="hidden md:col-span-5 md:block">
            <NavLinks items={readyItems()} placement="bar" />
          </div>
          <div className="hidden items-center justify-end gap-3 md:col-span-4 md:flex">
            <BookACall />
            <ThemeToggle />
            <ViewToggle current="site" />
          </div>
          <div className="md:hidden">
            <MenuDialog variant="full" title={name}>
              <div className="flex flex-col gap-8 p-4">
                <NavLinks items={readyItems()} placement="list" />
                <BookACall />
                <ShellControls view="site" />
              </div>
            </MenuDialog>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-312 flex-1 px-4 md:px-6">{children}</div>
      <SiteFooter />
    </div>
  );
}
```

Create `components/shell/dashboard-shell.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { SyncLine } from "@/components/sources/source-health";
import { profile } from "@/content/profile";
import { OVERVIEW, readyItems } from "@/lib/nav";
import type { SourceStatus } from "@/lib/sources/health";
import { readSourceStatuses } from "@/lib/sources/status";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { ShellControls } from "./shell-controls";

// Nav on top; toggles and the sync line at the foot.
function SidebarBody({ statuses }: { statuses: SourceStatus[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-8 overflow-y-auto p-4">
      <NavLinks items={[OVERVIEW, ...readyItems()]} placement="list" />
      <div className="flex flex-col gap-4 border-t pt-4">
        <ShellControls view="dashboard" />
        <div className="pl-3">
          <SyncLine statuses={statuses} />
        </div>
      </div>
    </div>
  );
}

// Dashboard view: a 240px sidebar beside the content. Pages render their own
// 48px top bar (PageHeader) and panel grid. Below md the sidebar becomes a
// top bar whose Menu opens the same content as a slide-over.
export async function DashboardShell({ children }: { children: ReactNode }) {
  const statuses = await readSourceStatuses();
  const name = (
    <Link href="/" className="type-sans-14-medium">
      {profile.name}
    </Link>
  );
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      {/* The column carries the fill, so it runs the full page height while
          the sidebar itself stays pinned to the viewport. */}
      <div className="hidden border-r bg-surface md:block">
        <aside className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-12 shrink-0 items-center border-b pr-4 pl-7">{name}</div>
          <SidebarBody statuses={statuses} />
        </aside>
      </div>
      <div className="flex h-12 items-center justify-between border-b bg-surface pr-1 pl-4 md:hidden">
        {name}
        <MenuDialog variant="slide" title={name}>
          <SidebarBody statuses={statuses} />
        </MenuDialog>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
```

Replace `app/[view]/layout.tsx` with:

```tsx
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { SiteShell } from "@/components/shell/site-shell";
import { assertView } from "@/lib/view/params";
import { VIEWS } from "@/lib/view/views";

// Prerender every page once per view; the proxy picks which one a visitor gets.
export function generateStaticParams() {
  return VIEWS.map((view) => ({ view }));
}

export default async function ViewLayout({ children, params }: LayoutProps<"/[view]">) {
  const view = assertView((await params).view);
  return (
    <div data-view={view}>
      {view === "dashboard" ? <DashboardShell>{children}</DashboardShell> : <SiteShell>{children}</SiteShell>}
    </div>
  );
}
```

Pages still render their own `<main>`. Photos is no longer in the nav; it is reached from `/life` (Task 10) and the home page (Task 8).

- [ ] **Step 5: Add the shell e2e spec**

Create `e2e/shell.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("the site shell has the top bar, the active nav item and the footer", async ({ page }) => {
  await page.goto("/life/");
  const nav = page.getByRole("navigation", { name: "Main" });
  // Only ready sections are listed; S3 ships Life.
  await expect(nav.getByRole("link")).toHaveText(["Life"]);
  await expect(nav.getByRole("link", { name: "Life" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Onur Senture" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /Book a call/ })).toHaveCount(0);

  const footer = page.locator("footer");
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Onur Senture`);
  for (const name of ["GitHub", "Letterboxd", "Goodreads", "X", "Dribbble"]) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(footer.locator('[data-slot="paddle"]')).toHaveCount(1);
});

test("the dashboard sidebar lists Overview first, then the toggles and the sync line", async ({ page }) => {
  await page.goto("/?view=dashboard");
  const sidebar = page.locator("aside");
  const nav = sidebar.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveText(["Overview", "Life"]);
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await expect(sidebar.getByRole("group", { name: "Theme" })).toBeVisible();
  await expect(sidebar.getByRole("group", { name: "View" })).toBeVisible();
  // This run has no database, so no source has synced.
  await expect(sidebar.getByTestId("sync-line")).toHaveText(/○\s*0\/5 synced/);
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the site menu opens full-screen and closes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Life" })).toBeVisible();
    await expect(menu.getByRole("group", { name: "View" })).toBeVisible();
    await menu.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toBeHidden();
  });

  test("the dashboard menu opens the sidebar as a slide-over", async ({ page }) => {
    await page.goto("/?view=dashboard");
    await expect(page.locator("aside")).toBeHidden();
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(menu.getByTestId("sync-line")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("switching view from the menu leaves the new page usable", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: "Dashboard" }).click();
    await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Overview" })).toBeVisible();
  });
});
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 25 files, 126 tests.
- `e2e`: 29 passed.
- `e2e:fixtures`: 2 passed.

If the build ever fails with "Next.js encountered URL data in a Client Component outside of Suspense", `usePathname` is suspending. Read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-pathname.md` before changing anything. The spike's build passed without a `Suspense` boundary.

- [ ] **Step 7: Visual check**

```bash
npm run screenshots -- .superpowers/screens/task-5 / /system/
```

Compare with Figma "03 Shell sketch" (`7:100`).
- **Site top bar:** 64px, with the name, then "Life" from column 4, then the toggles on the right.
- **Footer:** one mono line.
- **Dashboard sidebar:** 240px on `--color-surface`, the full page height, with Overview inverted on `/` and "Theme"/"View" rows plus the sync line at the foot.
- **390 wide:** only the name and "Menu" show.

Also open the menus by hand (`npm run start`, a 390px window) and compare with the "menu open" frame. The slide-over is 312px, the page behind washes to the background color, and there is no shadow.

- [ ] **Step 8: Commit**

```bash
git add content lib/nav.ts lib/sources components/sources components/shell "app/[view]/layout.tsx" tests e2e/shell.spec.ts
git commit -m "Add the site and dashboard shells

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: View-switch transition

Animates the view switch as S1 asks: the site top-bar nav morphs into the dashboard sidebar nav (or back), the rest of the page cross-fades, and it all takes 250ms, ease-out. The spike verified the mechanism (see the header notes):
1. The toggle runs `router.refresh()` inside `startTransition`, tagged with the transition type `view-switch`.
2. The two desktop navs share `<ViewTransition name="shell-nav">`.
3. That `ViewTransition` only activates for the `view-switch` type.

Navigations stay instant. Under `prefers-reduced-motion` the toggle doesn't add the type, so no transition starts at all.

**Files:**
- Create: `lib/view/transition.ts`, `components/shell/shell-morph.tsx`, `e2e/transition.spec.ts`
- Replace: `components/view-toggle.tsx`, `components/shell/site-shell.tsx`, `components/shell/dashboard-shell.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: Task 5's shells, Task 4's `ViewToggle`.
- Produces:
  - `VIEW_SWITCH = "view-switch"` from `@/lib/view/transition`.
  - `ShellMorph({ children })` from `@/components/shell/shell-morph`. Wrap only the desktop navs with it; the mobile menus never morph.
  - The CSS view-transition classes `shell-morph` and `root`.

- [ ] **Step 1: Write the failing e2e spec**

Create `e2e/transition.spec.ts`:

```ts
import { expect, type Page, test } from "@playwright/test";

type Recorded = { __viewTransitions: string[][] };

// Wraps document.startViewTransition to record each call and, once the
// transition is ready, which pseudo-elements animate and for how long.
async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const calls: string[][] = [];
    (window as unknown as Recorded).__viewTransitions = calls;
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((update: ViewTransitionUpdateCallback) => {
      const transition = start(update);
      const animated: string[] = [];
      calls.push(animated);
      transition.ready.then(
        () => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null;
            if (effect?.pseudoElement) animated.push(`${effect.pseudoElement} ${effect.getTiming().duration}`);
          }
        },
        () => {},
      );
      return transition;
    }) as typeof document.startViewTransition;
  });
}

const recorded = (page: Page) => page.evaluate(() => (window as unknown as Recorded).__viewTransitions);

const viewButton = (page: Page, name: "Site" | "Dashboard") =>
  page.getByRole("group", { name: "View" }).getByRole("button", { name });

test("switching view morphs the nav in one 250ms view transition", async ({ page }) => {
  await recordViewTransitions(page);
  await page.goto("/");
  await viewButton(page, "Dashboard").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await expect.poll(() => recorded(page)).toEqual([
    expect.arrayContaining(["::view-transition-group(shell-nav) 250"]),
  ]);
});

test("navigating between pages starts no view transition", async ({ page }) => {
  await recordViewTransitions(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Life" }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  expect(await recorded(page)).toEqual([]);
});

test.describe("with prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the view switch is instant", async ({ page }) => {
    await recordViewTransitions(page);
    await page.goto("/");
    await viewButton(page, "Dashboard").click();
    await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
    expect(await recorded(page)).toEqual([]);
  });
});
```

Run: `npm run build && npx playwright test e2e/transition.spec.ts`
Expected: "switching view morphs the nav in one 250ms view transition" FAILS, because nothing calls `startViewTransition`. The other two pass.

- [ ] **Step 2: Tag the toggle's transition**

Create `lib/view/transition.ts`:

```ts
// The React transition type the view toggle adds. Only transitions carrying
// it animate the shell; navigations and refreshes stay instant.
export const VIEW_SWITCH = "view-switch";
```

Replace `components/view-toggle.tsx` with:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { addTransitionType, startTransition } from "react";
import { Toggle } from "@/components/ui/toggle";
import { serializeCookie } from "@/lib/view/cookies";
import { VIEW_SWITCH } from "@/lib/view/transition";
import { VIEW_COOKIE, type View } from "@/lib/view/views";

const OPTIONS = [
  { value: "site", label: "Site" },
  { value: "dashboard", label: "Dashboard" },
] as const satisfies readonly { value: View; label: string }[];

export function ViewToggle({ current }: { current: View }) {
  const router = useRouter();

  function choose(next: View) {
    if (next === current) return;
    document.cookie = serializeCookie(VIEW_COOKIE, next);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startTransition(() => {
      // Without the type no <ViewTransition> activates, so React never
      // starts a view transition and the swap is instant.
      if (!reduceMotion) addTransitionType(VIEW_SWITCH);
      // Re-requests the current URL; the proxy now rewrites to the other
      // variant. Also drops the client router cache so later navigations
      // don't serve prefetched pages of the old view.
      router.refresh();
    });
  }

  return <Toggle label="View" testId="view-toggle" options={OPTIONS} value={current} onChange={choose} />;
}
```

`ViewTransition`, `addTransitionType` and `startTransition` come from `react`. Next's App Router bundles a React canary that exports them, and `@types/react` 19.3 types them. Do not install `react@canary` or add a config flag.

- [ ] **Step 3: Share the view-transition name between the two navs**

Create `components/shell/shell-morph.tsx`:

```tsx
import { type ReactNode, ViewTransition } from "react";
import { VIEW_SWITCH } from "@/lib/view/transition";

// The site top-bar nav and the dashboard sidebar nav share one view
// transition name, so a view switch morphs one into the other (the rest of
// the page cross-fades as the root snapshot). `default="none"` keeps every
// other transition, such as a navigation, from animating. Wrap only the
// desktop navs: two mounted elements with the same name break the
// transition.
export function ShellMorph({ children }: { children: ReactNode }) {
  return (
    <ViewTransition name="shell-nav" share={{ [VIEW_SWITCH]: "shell-morph", default: "none" }} default="none">
      {children}
    </ViewTransition>
  );
}
```

Replace `components/shell/site-shell.tsx` with:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { ViewToggle } from "@/components/view-toggle";
import { profile } from "@/content/profile";
import { readyItems } from "@/lib/nav";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { ShellControls } from "./shell-controls";
import { ShellMorph } from "./shell-morph";
import { SiteFooter } from "./site-footer";

function BookACall() {
  if (!profile.bookingUrl) return null;
  return <ButtonLink href={profile.bookingUrl}>Book a call →</ButtonLink>;
}

// Site view: a 64px top bar on the 12-column grid (name on 3 columns, nav
// from column 4, actions on the right), content in a 1200px container, and
// the footer. Below md the bar collapses to the name and a Menu button.
export function SiteShell({ children }: { children: ReactNode }) {
  const name = (
    <Link href="/" className="type-sans-14-medium">
      {profile.name}
    </Link>
  );
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-312 items-center justify-between pr-1 pl-4 md:grid md:h-16 md:grid-cols-12 md:gap-x-6 md:px-6">
          <div className="md:col-span-3">{name}</div>
          <div className="hidden md:col-span-5 md:block">
            <ShellMorph>
              <NavLinks items={readyItems()} placement="bar" />
            </ShellMorph>
          </div>
          <div className="hidden items-center justify-end gap-3 md:col-span-4 md:flex">
            <BookACall />
            <ThemeToggle />
            <ViewToggle current="site" />
          </div>
          <div className="md:hidden">
            <MenuDialog variant="full" title={name}>
              <div className="flex flex-col gap-8 p-4">
                <NavLinks items={readyItems()} placement="list" />
                <BookACall />
                <ShellControls view="site" />
              </div>
            </MenuDialog>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-312 flex-1 px-4 md:px-6">{children}</div>
      <SiteFooter />
    </div>
  );
}
```

Replace `components/shell/dashboard-shell.tsx` with:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { SyncLine } from "@/components/sources/source-health";
import { profile } from "@/content/profile";
import { OVERVIEW, readyItems } from "@/lib/nav";
import type { SourceStatus } from "@/lib/sources/health";
import { readSourceStatuses } from "@/lib/sources/status";
import { MenuDialog } from "./menu-dialog";
import { NavLinks } from "./nav-links";
import { ShellControls } from "./shell-controls";
import { ShellMorph } from "./shell-morph";

// Nav on top; toggles and the sync line at the foot. Only the desktop
// sidebar's nav morphs; the mobile slide-over's copy must not share the name.
function SidebarBody({ statuses, morph = false }: { statuses: SourceStatus[]; morph?: boolean }) {
  const nav = <NavLinks items={[OVERVIEW, ...readyItems()]} placement="list" />;
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-8 overflow-y-auto p-4">
      {morph ? <ShellMorph>{nav}</ShellMorph> : nav}
      <div className="flex flex-col gap-4 border-t pt-4">
        <ShellControls view="dashboard" />
        <div className="pl-3">
          <SyncLine statuses={statuses} />
        </div>
      </div>
    </div>
  );
}

// Dashboard view: a 240px sidebar beside the content. Pages render their own
// 48px top bar (PageHeader) and panel grid. Below md the sidebar becomes a
// top bar whose Menu opens the same content as a slide-over.
export async function DashboardShell({ children }: { children: ReactNode }) {
  const statuses = await readSourceStatuses();
  const name = (
    <Link href="/" className="type-sans-14-medium">
      {profile.name}
    </Link>
  );
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      {/* The column carries the fill, so it runs the full page height while
          the sidebar itself stays pinned to the viewport. */}
      <div className="hidden border-r bg-surface md:block">
        <aside className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-12 shrink-0 items-center border-b pr-4 pl-7">{name}</div>
          <SidebarBody statuses={statuses} morph />
        </aside>
      </div>
      <div className="flex h-12 items-center justify-between border-b bg-surface pr-1 pl-4 md:hidden">
        {name}
        <MenuDialog variant="slide" title={name}>
          <SidebarBody statuses={statuses} />
        </MenuDialog>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Time the animation and honor reduced motion**

In `app/globals.css`, replace:

```css
/* Type scale: one class per Figma text style (display/96 → type-display-96,
```

with:

```css
/* View switch (components/shell/shell-morph.tsx): the navs morph, the rest
   of the page cross-fades through the root snapshot. 250ms, ease-out. Theme
   switches and navigations don't animate. */
::view-transition-group(.shell-morph),
::view-transition-old(.shell-morph),
::view-transition-new(.shell-morph),
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 250ms;
  animation-timing-function: ease-out;
}

/* The toggle skips the transition under reduced motion; this guards any
   other view transition. */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}

/* Type scale: one class per Figma text style (display/96 → type-display-96,
```

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 25 files, 126 tests.
- `e2e`: 32 passed.
- `e2e:fixtures`: 2 passed.

To check for flakiness, run `npx playwright test e2e/transition.spec.ts --repeat-each 5`; it should stay green.

- [ ] **Step 6: Visual check**

Run `npm run start`, open `http://localhost:3000/` in Chrome, and click View → Dashboard and back. The top-bar nav should glide into the sidebar position and the page cross-fade, in about a quarter second. With "Emulate CSS prefers-reduced-motion: reduce" (DevTools → Rendering), the swap should be instant. No PNGs are needed for this task.

- [ ] **Step 7: Commit**

```bash
git add lib/view/transition.ts components/view-toggle.tsx components/shell app/globals.css e2e/transition.spec.ts
git commit -m "Morph the shell on view switch with a view transition

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 404 inside the shell

Today an unknown URL renders Next's bare 404, outside the `[view]` layout, with no nav and no toggles. A catch-all page under `[view]` now calls `notFound()`, so `app/[view]/not-found.tsx` renders inside the view's shell in both views.

Cache Components needs at least one prerendered param, so `generateStaticParams` returns one placeholder. Real misses render on demand and keep status 404.

Such a 404 arrives as an error shell that React renders on the client, so the inline theme script never runs. `ThemeToggle` therefore applies the theme cookie itself when the script hasn't. This also fixes S2's unknown-photo 404.

A root `app/not-found.tsx` keeps the requests that never reach `[view]` (paths with a dot skip the proxy) on-brand.

**Files:**
- Create: `app/[view]/[...missing]/page.tsx`, `app/[view]/not-found.tsx`, `app/not-found.tsx`, `e2e/not-found.spec.ts`
- Modify: `lib/view/theme.ts`, `components/theme-toggle.tsx`, `e2e/view-and-theme.spec.ts`

**Interfaces:**
- Consumes: Task 2's `MetaLabel` and `TextLink`, Task 5's shells, Task 4's theme module.
- Produces:
  - `THEME_COOKIE_PATTERN` (now exported) from `@/lib/view/theme`.
  - Every unknown URL under the proxy 404s with the shell and the heading "Page not found".

- [ ] **Step 1: Write the failing e2e spec**

Create `e2e/not-found.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("an unknown URL 404s inside the site shell", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("[data-view]")).toHaveAttribute("data-view", "site");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("group", { name: "View" })).toBeVisible();
});

test("an unknown URL 404s inside the dashboard shell", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "view", value: "dashboard", url: baseURL! }]);
  const response = await page.goto("/deeply/nested/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("[data-view]")).toHaveAttribute("data-view", "dashboard");
  await expect(page.locator("aside").getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

// Under Cache Components these 404s arrive as an error shell that React
// renders on the client, so the inline theme script never runs; the theme
// toggle applies the cookie instead.
test("a 404 keeps the theme from the cookie", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.goto("/nope/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Dark" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("an unknown photo 404s inside the shell", async ({ page }) => {
  const response = await page.goto("/photos/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});

// Paths with a dot skip the proxy, so "[view]" receives an invalid value and
// assertView() 404s before any shell renders.
test("an invalid view segment 404s", async ({ page }) => {
  const response = await page.goto("/not.a.view/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("[data-view]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
```

Run: `npm run build && npx playwright test e2e/not-found.spec.ts`
Expected: all 5 FAIL. The 404s render outside the shell, so there is no `[data-view]` and no "Main" navigation, and no page says "Page not found" yet.

- [ ] **Step 2: Add the catch-all and the not-found pages**

Create `app/[view]/[...missing]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

// Catches every URL no other page matches, so it 404s inside the [view]
// layout (shell, nav, toggles) instead of outside it. Cache Components needs
// at least one prerendered param; real misses render on demand.
export function generateStaticParams() {
  return [{ missing: ["not-found"] }];
}

export default function MissingPage() {
  notFound();
}
```

Create `app/[view]/not-found.tsx`:

```tsx
import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";

// Rendered inside app/[view]/layout.tsx, so a 404 keeps the shell in both
// views. Not-found files receive no params; density follows the dashboard:
// variant instead.
export default function NotFound() {
  return (
    <main className="flex flex-col items-start gap-6 py-24 dashboard:gap-4 dashboard:p-6">
      <MetaLabel>404</MetaLabel>
      <h1 className="type-display-64 dashboard:type-sans-20-medium">Page not found</h1>
      <TextLink href="/" className="type-sans-16 dashboard:type-sans-14">
        Back to home
      </TextLink>
    </main>
  );
}
```

Create `app/not-found.tsx`:

```tsx
import { TextLink } from "@/components/ui/text-link";

// Only for requests that never reach app/[view] (paths the proxy skips, such
// as ones with a dot). Everything else 404s inside the shell.
export default function RootNotFound() {
  return (
    <main className="mx-auto flex max-w-312 flex-col items-start gap-6 px-4 py-24 md:px-6">
      <h1 className="type-display-64">Page not found</h1>
      <TextLink href="/" className="type-sans-16">
        Back to home
      </TextLink>
    </main>
  );
}
```

- [ ] **Step 3: Apply the theme cookie where the inline script didn't run**

In `lib/view/theme.ts`, replace:

```ts
const THEME_COOKIE_PATTERN = cookiePattern(THEME_COOKIE, THEME_PREFERENCES.join("|"));
```

with:

```ts
export const THEME_COOKIE_PATTERN = cookiePattern(THEME_COOKIE, THEME_PREFERENCES.join("|"));
```

Replace `components/theme-toggle.tsx` with:

```tsx
"use client";

import { useSyncExternalStore } from "react";
import { Toggle } from "@/components/ui/toggle";
import { serializeCookie } from "@/lib/view/cookies";
import { THEME_COOKIE, THEME_COOKIE_PATTERN, THEME_PREFERENCES, type ThemePreference } from "@/lib/view/theme";

const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Auto" },
] as const satisfies readonly { value: ThemePreference; label: string }[];

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

// themeScript sets the theme before first paint, but only in server-rendered
// HTML. Under Cache Components a 404 is served as an empty error shell that
// React renders on the client, where inline scripts never run: apply the
// cookie's theme on mount instead.
function ensureTheme() {
  if (document.documentElement.dataset.themePreference) return;
  const match = document.cookie.match(THEME_COOKIE_PATTERN);
  apply((match?.[1] as ThemePreference | undefined) ?? "system");
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureTheme();
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

// Light / Dark / Auto. Theme switches are instant (no transition).
export function ThemeToggle() {
  // Server render has no preference; "system" matches the script's default.
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  function choose(next: ThemePreference) {
    document.cookie = serializeCookie(THEME_COOKIE, next);
    apply(next);
    listeners.forEach((l) => l());
  }

  return <Toggle label="Theme" testId="theme-toggle" options={OPTIONS} value={preference} onChange={choose} />;
}
```

- [ ] **Step 4: Retire the old 404 test**

`e2e/not-found.spec.ts` now covers it. Replace `e2e/view-and-theme.spec.ts` with this version, which drops the final "unknown pages 404" test and updates the comment above the proxy test:

```ts
import { expect, type Page, test } from "@playwright/test";

const viewOf = (page: Page) => page.locator("[data-view]").getAttribute("data-view");

// Role locators skip hidden elements, so these keep working after a client
// navigation, when Next keeps the previous view's tree mounted but hidden.
const viewButton = (page: Page, name: "Site" | "Dashboard") =>
  page.getByRole("group", { name: "View" }).getByRole("button", { name });
const themeButton = (page: Page, name: "Light" | "Dark" | "Auto") =>
  page.getByRole("group", { name: "Theme" }).getByRole("button", { name });

test("defaults to the site view", async ({ page }) => {
  await page.goto("/");
  expect(await viewOf(page)).toBe("site");
});

test("?view=dashboard switches, redirects to a clean URL, and persists via cookie", async ({ page }) => {
  await page.goto("/?view=dashboard");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  expect(await viewOf(page)).toBe("dashboard");
  await page.goto("/");
  expect(await viewOf(page)).toBe("dashboard");
});

test("the toggle works after arriving via a ?view= link", async ({ page }) => {
  await page.goto("/?view=dashboard");
  await viewButton(page, "Site").click();
  await expect(page.locator('[data-view="site"]')).toBeVisible();
  await page.reload();
  expect(await viewOf(page)).toBe("site");
});

test("the toggle switches view in place and survives a reload", async ({ page }) => {
  await page.goto("/");
  await viewButton(page, "Dashboard").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await page.reload();
  expect(await viewOf(page)).toBe("dashboard");
  await viewButton(page, "Site").click();
  await expect(page.locator('[data-view="site"]')).toBeVisible();
});

test("the toggles mark the current option with aria-pressed", async ({ page }) => {
  await page.goto("/");
  await expect(viewButton(page, "Site")).toHaveAttribute("aria-pressed", "true");
  await expect(viewButton(page, "Dashboard")).toHaveAttribute("aria-pressed", "false");
  await expect(themeButton(page, "Auto")).toHaveAttribute("aria-pressed", "true");
});

test("internal view prefixes redirect to clean URLs", async ({ page }) => {
  await page.goto("/dashboard/");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
});

test("the theme cookie applies before paint and the toggle sets light, dark and auto", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeButton(page, "Dark")).toHaveAttribute("aria-pressed", "true");
  await themeButton(page, "Auto").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await themeButton(page, "Light").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

// Probe with ?view=, which only the proxy answers (with a redirect).
test("only /api and /_next skip the proxy, not paths that merely start with them", async ({ request }) => {
  const proxied = await request.get("/apiary/?view=dashboard", { maxRedirects: 0 });
  expect(proxied.status()).toBe(307);
  expect(proxied.headers()["location"]).toMatch(/\/apiary\/$/);

  const skipped = await request.get("/api/anything/?view=dashboard", { maxRedirects: 0 });
  expect(skipped.status()).toBe(404);
});
```

- [ ] **Step 5: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 25 files, 126 tests.
- `e2e`: 36 passed.
- `e2e:fixtures`: 2 passed.

The route table lists `/[view]/[...missing]` with the placeholder `/site/not-found` prerendered.

- [ ] **Step 6: Visual check**

```bash
npm run screenshots -- .superpowers/screens/task-7 /nope/
```

Expected: the 404 sits inside the site top bar and footer (or the dashboard sidebar), and the theme matches the file name in all 8 shots.

- [ ] **Step 7: Commit**

```bash
git add "app/[view]/[...missing]" "app/[view]/not-found.tsx" app/not-found.tsx lib/view/theme.ts components/theme-toggle.tsx e2e/not-found.spec.ts e2e/view-and-theme.spec.ts
git commit -m "Render 404s inside the view shell

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Home page, site view

Builds the site view of `/`, in this order:
1. The approved identity line (`type-display-40`) and the mono meta line, `DESIGNER + BUILDER · ANKARA HH:mm · OPEN TO ROLES`, with a live Europe/Istanbul clock.
2. The selected work index, with the five confirmed entries and nothing else.
3. The Lab index: one real entry and two approved placeholders. It is hidden when the list is empty.
4. The "Off the clock" strip: the book being read, the latest film with stars, the newest photo and the latest saved article. Each tile links to its `/life/` section, and an empty source drops its tile.

The dashboard view gets a placeholder that Task 9 replaces. This task also adds:
- `lib/sources/stars.ts`, which derives stars from `ratingValue` rather than from the title
- a real currently-reading Goodreads fixture, so fixture mode no longer reuses the read shelf

**Files:**
- Create: `content/work-index.ts`, `content/lab-index.ts`, `lib/sources/stars.ts`
- Create in `components/home/`: `meta-line.tsx`, `lab-index.tsx`, `off-the-clock.tsx`, `home-site.tsx`
- Create: `tests/fixtures/goodreads-currently-reading.xml` (copied, see Step 1)
- Create: `tests/sources/stars.test.ts`, `tests/ui/home.test.tsx`, `e2e/home.spec.ts`, `e2e-fixtures/home.spec.ts`
- Replace: `app/[view]/page.tsx`
- Modify: `lib/sources/fixtures.ts`, `tests/sources/fixtures.test.ts`, `tests/sources/goodreads.test.ts`, `e2e-fixtures/life.spec.ts`

**Interfaces:**
- Consumes:
  - From Task 5: `profile` and `MetaSegment`.
  - From Task 3: `Band`, `IndexRow`/`IndexEntry` and `Cover`.
  - From Task 2: `MetaLabel`, `LiveClock` and `GlyphStatus`.
  - From S2: `readSource`, `getPhotos` and `Picture`.
- Produces:
  - Work index: `interface WorkEntry { title; meta?; years?; role?; era?; href? }` and `workIndex` from `@/content/work-index`.
  - Lab index: `interface LabEntry { title; description; year?; href?; status?: "live" | "wip"; placeholder? }` and `labIndex` from `@/content/lab-index`.
  - Stars: `stars(value: number | null): string` from `@/lib/sources/stars` (3.5 → "★★★½"; unrated → "").
  - Meta line: `visibleSegments(segments, available)` and `MetaLine({ segments, available })` (`data-testid="meta-line"`) from `@/components/home/meta-line`.
  - Lab index helpers: `LAB_STATUS`, `labIndexEntry(entry): IndexEntry` and `LabBand({ entries })` from `@/components/home/lab-index`. `LabBand` returns null when `entries` is empty.
  - `OffTheClock()` (async) and `HomeSite()`.
  - Anchors on `/`:
    - `#work`, `#lab` and `#off-the-clock`
    - the tiles carry `data-tile="Reading" | "Watched" | "Photo" | "Saved"`
    - the tiles link to `/life/#books`, `#films`, `#photos` and `#articles`

- [ ] **Step 1: Add the currently-reading fixture**

The fixture is a trimmed real response from `https://www.goodreads.com/review/list_rss/8143905?shelf=currently-reading`, recorded on 2026-10-03. It keeps 3 items, with descriptions blanked the same way as `goodreads-read.xml`.

```bash
cp docs/superpowers/plans/2026-10-03-s3-fixtures/goodreads-currently-reading.xml tests/fixtures/
```

In `lib/sources/fixtures.ts`, replace:

```ts
  goodreads: async () => {
    // The fixture is a single "read" shelf; it stands in for both shelves.
    const xml = await readFixture("goodreads-read.xml");
    return {
      currentlyReading: await parseGoodreadsShelf(xml, CURRENTLY_READING_LIMIT),
      read: await parseGoodreadsShelf(xml, READ_LIMIT),
    };
  },
```

with:

```ts
  goodreads: async () => ({
    currentlyReading: await parseGoodreadsShelf(
      await readFixture("goodreads-currently-reading.xml"),
      CURRENTLY_READING_LIMIT,
    ),
    read: await parseGoodreadsShelf(await readFixture("goodreads-read.xml"), READ_LIMIT),
  }),
```

In `tests/sources/fixtures.test.ts`, replace:

```ts
  it("fills both goodreads shelves", async () => {
    const books = await loadFixtureData("goodreads");
    expect(books.currentlyReading.length).toBeGreaterThan(0);
    expect(books.read.map((b) => b.title)).toContain("Hacı Komünist");
  });
```

with:

```ts
  it("fills each goodreads shelf from its own recording", async () => {
    const books = await loadFixtureData("goodreads");
    expect(books.currentlyReading.map((b) => b.title)).toEqual([
      "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
      "Educated",
      "Mutluluğun Mimarisi",
    ]);
    expect(books.read.map((b) => b.title)).toContain("Hacı Komünist");
    const reading = new Set(books.currentlyReading.map((b) => b.link));
    expect(books.read.filter((b) => reading.has(b.link))).toEqual([]);
  });
```

In `tests/sources/goodreads.test.ts`, replace:

```ts
  it("fetches both shelves", async () => {
    const fetch = fakeFetch({
      [`${base}?shelf=currently-reading`]: { body: fixture("goodreads-read.xml") },
      [`${base}?shelf=read`]: { body: fixture("goodreads-read.xml") },
    });
    const books = await goodreads.fetch({ fetch, env: {} });
    expect(books.currentlyReading).toHaveLength(3);
    expect(books.read).toHaveLength(3);
  });
```

with:

```ts
  it("fetches both shelves", async () => {
    const fetch = fakeFetch({
      [`${base}?shelf=currently-reading`]: { body: fixture("goodreads-currently-reading.xml") },
      [`${base}?shelf=read`]: { body: fixture("goodreads-read.xml") },
    });
    const books = await goodreads.fetch({ fetch, env: {} });
    expect(books.currentlyReading.map((b) => b.title)).toEqual([
      "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
      "Educated",
      "Mutluluğun Mimarisi",
    ]);
    // Nothing on the shelf is rated yet.
    expect(books.currentlyReading[0]).toMatchObject({ author: "J.K. Rowling", numRating: 0, rating: "" });
    expect(books.read).toHaveLength(3);
  });
```

In `e2e-fixtures/life.spec.ts`, delete this comment line (the title no longer appears twice):

```ts
  // The fixture stands in for both Goodreads shelves, so the title appears twice.
```

Run: `npm test -- tests/sources`
Expected: PASS.

- [ ] **Step 2: Write the failing unit tests**

Create `tests/sources/stars.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { stars } from "@/lib/sources/stars";

describe("stars", () => {
  it("renders whole and half stars from the numeric rating", () => {
    expect(stars(3.5)).toBe("★★★½");
    expect(stars(4)).toBe("★★★★");
    expect(stars(0.5)).toBe("½");
    expect(stars(5)).toBe("★★★★★");
  });

  it("is empty when unrated and caps at five", () => {
    expect(stars(null)).toBe("");
    expect(stars(0)).toBe("");
    expect(stars(Number.NaN)).toBe("");
    expect(stars(7)).toBe("★★★★★");
  });
});
```

Create `tests/ui/home.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LabBand, labIndexEntry } from "@/components/home/lab-index";
import { MetaLine, visibleSegments } from "@/components/home/meta-line";
import type { LabEntry } from "@/content/lab-index";
import type { MetaSegment } from "@/content/profile";

const html = renderToStaticMarkup;

describe("LabBand", () => {
  it("renders nothing while the list is empty", () => {
    expect(html(<LabBand entries={[]} />)).toBe("");
  });

  it("renders one row per entry with its status glyph", () => {
    const entries: LabEntry[] = [
      { title: "Shipped thing", description: "Live now.", year: "2025", href: "https://example.com/", status: "live" },
      { title: "Half-built thing", description: "Not yet.", status: "wip" },
      { title: "Plain thing", description: "No status." },
    ];
    const markup = html(<LabBand entries={entries} />);
    expect(markup).toContain(">Lab<");
    expect(markup.match(/class="group grid/g)).toHaveLength(3);
    expect(markup).toContain('aria-label="live"');
    expect(markup).toContain('aria-label="in progress"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain(">All<");
  });

  it("maps description to the inline meta and year to the year column", () => {
    expect(labIndexEntry({ title: "t", description: "d", year: "2026", status: "wip" })).toEqual({
      title: "t",
      meta: "d",
      years: "2026",
      href: undefined,
      status: "late",
      statusLabel: "in progress",
    });
  });
});

describe("MetaLine", () => {
  const segments: MetaSegment[] = [
    { text: "DESIGNER + BUILDER" },
    { clock: "Europe/Istanbul", label: "ANKARA" },
    { availability: true },
  ];

  it("shows OPEN TO ROLES only while available", () => {
    expect(visibleSegments(segments, true)).toHaveLength(3);
    expect(visibleSegments(segments, false)).toEqual(segments.slice(0, 2));
  });

  it("joins segments with a middle dot and prerenders the clock as --:--", () => {
    const markup = html(<MetaLine segments={segments} available />);
    expect(markup).toContain("DESIGNER + BUILDER");
    expect(markup).toContain('ANKARA <time aria-label="Local time in Ankara">--:--</time>');
    expect(markup).toContain("OPEN TO ROLES");
    expect(markup.match(/ · /g)).toHaveLength(2);
  });
});
```

Run: `npm test`
Expected: FAIL. `@/lib/sources/stars`, `@/components/home/lab-index` and `@/components/home/meta-line` cannot be resolved.

- [ ] **Step 3: Add the content and stars**

Create `content/work-index.ts` (exactly these entries; years, roles, eras and links arrive in S4):

```ts
// The home page's selected work, in display order. Only confirmed facts:
// years, roles, eras and links arrive with the case studies (S4).
export interface WorkEntry {
  title: string;
  meta?: string;
  years?: string;
  role?: string;
  era?: string;
  href?: string;
}

export const workIndex: WorkEntry[] = [
  { title: "PrimeOne", meta: "80+ components" },
  { title: "PrimeBlocks", meta: "500 UI blocks" },
  { title: "PrimeIcons", meta: "hand-drawn icon set" },
  { title: "Premium admin dashboards" },
  { title: "nebuu", meta: "ongoing, Orkestra" },
];
```

Create `content/lab-index.ts` (exactly these entries, in this order, as Onur approved them):

```ts
// Things Onur builds, in display order. While the list is empty the Lab band
// and panel don't render.
export interface LabEntry {
  title: string;
  description: string;
  year?: string;
  href?: string;
  // ● live, ◐ wip.
  status?: "live" | "wip";
  // Data only, not rendered: marks an approved placeholder to replace with a
  // real project.
  placeholder?: boolean;
}

export const labIndex: LabEntry[] = [
  {
    title: "onursenture.com",
    description: "This site — designed in Figma, built in Next.js with an AI-agent workflow.",
    year: "2026",
    href: "https://github.com/onursenture/onursenture.github.com",
    status: "wip",
  },
  { title: "Project 02", description: "Details coming soon.", status: "wip", placeholder: true },
  { title: "Project 03", description: "Details coming soon.", status: "wip", placeholder: true },
];
```

Create `lib/sources/stars.ts`:

```ts
// A rating as stars: 3.5 → "★★★½", 4 → "★★★★". Letterboxd rates 0.5–5 in
// half steps, Goodreads 1–5. Unrated (null or 0) is an empty string.
export function stars(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return "";
  const halves = Math.round(Math.min(value, 5) * 2);
  return "★".repeat(Math.floor(halves / 2)) + (halves % 2 === 1 ? "½" : "");
}
```

- [ ] **Step 4: Build the home components**

Create `components/home/meta-line.tsx`:

```tsx
import { Fragment } from "react";
import { LiveClock } from "@/components/ui/live-clock";
import type { MetaSegment } from "@/content/profile";

// The availability segment shows only while `available` is true.
export function visibleSegments(segments: MetaSegment[], available: boolean): MetaSegment[] {
  return segments.filter((segment) => !("availability" in segment) || available);
}

// "ANKARA" → "Ankara", for the clock's accessible label.
function placeName(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function Segment({ segment }: { segment: MetaSegment }) {
  if ("text" in segment) return <span>{segment.text}</span>;
  if ("clock" in segment) {
    return (
      <span>
        {segment.label} <LiveClock timeZone={segment.clock} place={placeName(segment.label)} />
      </span>
    );
  }
  return <span>OPEN TO ROLES</span>;
}

// DESIGNER + BUILDER · ANKARA 14:32 · OPEN TO ROLES
export function MetaLine({ segments, available }: { segments: MetaSegment[]; available: boolean }) {
  const visible = visibleSegments(segments, available);
  if (visible.length === 0) return null;
  return (
    <p data-testid="meta-line" className="type-mono-12 tracking-[0.02em] text-fg-muted uppercase">
      {visible.map((segment, index) => (
        <Fragment key={index}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          <Segment segment={segment} />
        </Fragment>
      ))}
    </p>
  );
}
```

Create `components/home/lab-index.tsx`:

```tsx
import { Band } from "@/components/ui/band";
import { type IndexEntry, IndexRow } from "@/components/ui/index-row";
import type { GlyphStatus } from "@/components/ui/status-glyph";
import type { LabEntry } from "@/content/lab-index";

export const LAB_STATUS: Record<NonNullable<LabEntry["status"]>, { glyph: GlyphStatus; label: string }> = {
  live: { glyph: "ok", label: "live" },
  wip: { glyph: "late", label: "in progress" },
};

export function labIndexEntry(entry: LabEntry): IndexEntry {
  const status = entry.status ? LAB_STATUS[entry.status] : undefined;
  return {
    title: entry.title,
    meta: entry.description,
    years: entry.year,
    href: entry.href,
    status: status?.glyph,
    statusLabel: status?.label,
  };
}

// The home page's second index. Hidden while the list is empty; no "All →"
// until /lab ships (S5).
export function LabBand({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Band label="Lab" id="lab">
      {entries.map((entry) => (
        <IndexRow key={entry.title} entry={labIndexEntry(entry)} />
      ))}
    </Band>
  );
}
```

Create `components/home/off-the-clock.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { Picture } from "@/components/picture";
import { Band } from "@/components/ui/band";
import { Cover } from "@/components/ui/cover";
import { MetaLabel } from "@/components/ui/meta-label";
import { getPhotos } from "@/lib/content/photos";
import { readSource } from "@/lib/sources/read";
import { stars } from "@/lib/sources/stars";

// Four columns at md, two below, inside the 1200px container.
const PHOTO_SIZES = "(min-width: 1248px) 282px, (min-width: 768px) calc((100vw - 120px) / 4), calc((100vw - 48px) / 2)";

function Tile({
  label,
  href,
  media,
  title,
  detail,
}: {
  label: string;
  href: string;
  media: ReactNode;
  title?: string;
  detail?: string;
}) {
  return (
    <Link href={href} data-tile={label} className="group flex min-w-0 flex-col gap-3">
      <MetaLabel>{label}</MetaLabel>
      {media}
      <span className="flex flex-col gap-1">
        {title ? (
          <span className="type-sans-16 group-hover:underline group-hover:underline-offset-[0.2em]">{title}</span>
        ) : null}
        {detail ? <span className="type-mono-12 text-fg-muted">{detail}</span> : null}
      </span>
    </Link>
  );
}

// The home page's personal strip: what Onur is reading, the latest film,
// the newest photo and the latest saved article. Each tile links to its
// section on /life/; an empty source drops its tile.
export async function OffTheClock() {
  const [books, films, articles, photos] = await Promise.all([
    readSource("goodreads"),
    readSource("letterboxd"),
    readSource("instapaper"),
    getPhotos(),
  ]);
  const book = books.data.currentlyReading[0];
  const film = films.data[0];
  const photo = photos[0];
  const article = articles.data[0];

  const tiles = [
    book ? (
      <Tile
        key="book"
        label="Reading"
        href="/life/#books"
        media={<Cover src={book.cover} alt="" />}
        title={book.title}
        detail={book.author}
      />
    ) : null,
    film ? (
      <Tile
        key="film"
        label="Watched"
        href="/life/#films"
        media={<Cover src={film.poster} alt="" />}
        title={film.title}
        detail={stars(film.ratingValue)}
      />
    ) : null,
    photo ? (
      <Tile
        key="photo"
        label="Photo"
        href="/life/#photos"
        media={
          <Picture image={photo.image} alt="" sizes={PHOTO_SIZES} className="aspect-[2/3] w-full object-cover" />
        }
        title={photo.title}
        detail={photo.camera}
      />
    ) : null,
    article ? (
      <Tile
        key="article"
        label="Saved"
        href="/life/#articles"
        media={
          <span className="flex aspect-[2/3] flex-col justify-end border bg-surface p-4">
            <span className="type-sans-20 group-hover:underline group-hover:underline-offset-[0.2em]">
              {article.title}
            </span>
          </span>
        }
        detail={[article.domain, article.minutes ? `${article.minutes} min` : ""].filter(Boolean).join(" · ")}
      />
    ) : null,
  ].filter(Boolean);

  if (tiles.length === 0) return null;
  return (
    <Band label="Off the clock" href="/life/" linkLabel="Life" id="off-the-clock">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{tiles}</div>
    </Band>
  );
}
```

Create `components/home/home-site.tsx`:

```tsx
import { Band } from "@/components/ui/band";
import { IndexRow } from "@/components/ui/index-row";
import { labIndex } from "@/content/lab-index";
import { profile } from "@/content/profile";
import { workIndex } from "@/content/work-index";
import { LabBand } from "./lab-index";
import { MetaLine } from "./meta-line";
import { OffTheClock } from "./off-the-clock";

// Site view of "/": identity, work index, Lab, then the Off the clock strip.
export function HomeSite() {
  return (
    <main className="flex flex-col gap-16 pt-16 pb-24 md:gap-24 md:pt-24">
      <header className="flex flex-col gap-6">
        <h1 className="max-w-[30ch] type-display-40">{profile.identity ?? profile.name}</h1>
        {profile.meta ? <MetaLine segments={profile.meta} available={profile.available} /> : null}
      </header>
      <Band label="Selected work" id="work">
        {workIndex.map((entry) => (
          <IndexRow key={entry.title} entry={entry} />
        ))}
      </Band>
      <LabBand entries={labIndex} />
      <OffTheClock />
    </main>
  );
}
```

Replace `app/[view]/page.tsx` with:

```tsx
import { HomeSite } from "@/components/home/home-site";
import { assertView } from "@/lib/view/params";

export default async function HomePage({ params }: PageProps<"/[view]">) {
  const view = assertView((await params).view);
  if (view === "dashboard") {
    // Replaced by the Overview in the next task.
    return (
      <main className="p-6">
        <h1 className="type-sans-20-medium">Overview</h1>
      </main>
    );
  }
  return <HomeSite />;
}
```

Run: `npm test`
Expected: PASS (27 files, 133 tests).

- [ ] **Step 5: Add the e2e specs**

Create `e2e/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("the site home leads with the identity line and a live meta line", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "From components to complete apps, designed and built end to end.",
  );
  const meta = page.getByTestId("meta-line");
  await expect(meta).toContainText("DESIGNER + BUILDER");
  await expect(meta).toContainText("ANKARA");
  await expect(meta).toContainText("OPEN TO ROLES");
  // Prerendered as --:--; after hydration it shows the time, whatever it is.
  await expect(page.getByLabel("Local time in Ankara")).toHaveText(/^\d{2}:\d{2}$/);
});

test("the work index lists the confirmed entries as plain rows", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#work");
  for (const text of [
    "PrimeOne",
    "80+ components",
    "PrimeBlocks",
    "500 UI blocks",
    "PrimeIcons",
    "hand-drawn icon set",
    "Premium admin dashboards",
    "nebuu",
    "ongoing, Orkestra",
  ]) {
    await expect(work).toContainText(text);
  }
  await expect(work.getByRole("link")).toHaveCount(0);
});

test("the Lab index lists every entry and links out only where it has a link", async ({ page }) => {
  await page.goto("/");
  const lab = page.locator("#lab");
  await expect(lab.getByRole("heading", { name: "Lab" })).toBeVisible();
  await expect(lab).toContainText("Project 02");
  await expect(lab).toContainText("Project 03");
  await expect(lab.getByRole("img", { name: "in progress" })).toHaveCount(3);
  await expect(lab.getByRole("link")).toHaveCount(1);
  const site = lab.getByRole("link", { name: /onursenture\.com/ });
  await expect(site).toHaveAttribute("href", "https://github.com/onursenture/onursenture.github.com");
  await expect(site).toHaveAttribute("rel", "noopener noreferrer");
});

test("Off the clock keeps the photo tile and links to Life", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator("#off-the-clock");
  // This run has no database, so the source tiles drop out.
  await expect(strip.locator("[data-tile]")).toHaveCount(1);
  await expect(strip.locator('[data-tile="Photo"]')).toHaveAttribute("href", "/life/#photos");
  await expect(strip.getByRole("link", { name: "Life", exact: true })).toHaveAttribute("href", "/life/");
});
```

Create `e2e-fixtures/home.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

// Runs against a SOURCE_FIXTURES=1 build (see e2e-fixtures/life.spec.ts).

test("Off the clock shows four tiles with real titles", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator("#off-the-clock");
  await expect(strip.locator("[data-tile]")).toHaveCount(4);
  await expect(strip.locator('[data-tile="Reading"]')).toContainText(
    "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
  );
  await expect(strip.locator('[data-tile="Reading"]')).toContainText("J.K. Rowling");
  await expect(strip.locator('[data-tile="Watched"]')).toContainText("Love & Other Drugs");
  await expect(strip.locator('[data-tile="Watched"]')).toContainText("★★★½");
  await expect(strip.locator('[data-tile="Photo"] img')).toHaveAttribute("alt", "");
  await expect(strip.locator('[data-tile="Saved"]')).toContainText("Jurassic Park computers in excruciating detail");
  await expect(strip.locator('[data-tile="Saved"]')).toContainText("fabiensanglard.net · 13 min");
});
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 27 files, 133 tests.
- `e2e`: 40 passed.
- `e2e:fixtures`: 3 passed.

- [ ] **Step 7: Visual check**

```bash
SOURCE_FIXTURES=1 npm run build
SOURCE_FIXTURES=1 npm run screenshots -- .superpowers/screens/task-8 /
npm run build
npm run screenshots -- .superpowers/screens/task-8-empty /
```

Compare with Figma "02 Mode comparison" (`6:100`), site frames.
- **Identity:** display-40, about two lines at 1440.
- **Meta line:** a mono uppercase line with the clock ticking (`--:--` never shows in the screenshots).
- **Index rows:** the work rows have their title at column 3, with the empty year column kept for S4. The Lab rows show ◐ before the title and "2026" in the year column; only the first row has →.
- **Fixture build:** four 2:3 tiles.
- **Empty build:** only the Photo tile.

- [ ] **Step 8: Commit**

```bash
git add content lib/sources components/home "app/[view]/page.tsx" tests e2e/home.spec.ts e2e-fixtures
git commit -m "Build the site home: identity, work and Lab indexes, Off the clock

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Home page, dashboard view (Overview)

Builds the dashboard view of `/` as a product surface: a 48px page header ("Overview · 5 projects"), a `Stat` row and the panel grid.

The `Stat` row shows:
- films synced
- books (reading + read)
- GitHub contributions
- `profile.metrics` entries, if any

The panels are:
- **Work:** a `DataTable` of the work index.
- **Status:** availability and booking.
- **Lab:** a `DataTable`, hidden while empty.
- **Activity:** the latest 8 films watched, books finished and articles saved, merged by date, each with a `RelativeTime`.
- **Sources:** the five sources with ●/◐/○ health.

It adds `PageHeader`, which Tasks 10 and 11 reuse, and splits per-source health into client components.

**Files:**
- Create: `lib/activity.ts`, `components/shell/page-header.tsx`, `components/sources/sources-table.tsx`, `components/home/home-dashboard.tsx`, `tests/activity.test.ts`
- Replace: `components/sources/source-health.tsx`, `components/home/lab-index.tsx`, `app/[view]/page.tsx`, `tests/ui/home.test.tsx`, `e2e-fixtures/home.spec.ts`
- Modify: `e2e/home.spec.ts` (append)

**Interfaces:**
- Consumes:
  - From Task 5: `readSourceStatuses`, `SourceStatus`, `sourceHealth`, `HEALTH_LABELS` and `summarizeHealth`.
  - From Task 3: `Panel`, `PanelGrid`, `DataTable`, `Stat` and `StatRow`.
  - From Task 2: `RelativeTime`, `StatusGlyph` and `TextLink`.
  - From Task 8: `workIndex`, `labIndex` and the profile.
- Produces:
  - Activity: `interface ActivityItem { verb: "Watched" | "Finished" | "Saved"; title; href; date }`, `ACTIVITY_LIMIT = 8` and `buildActivity({ films, books, articles }, limit?)` from `@/lib/activity`.
  - Page header: `PageHeader({ view, title, meta?, context? })` from `@/components/shell/page-header`. In the dashboard it is the 48px bar (40px on mobile); on the site it is a `type-display-64` heading.
  - Health components (client): `HealthGlyph({ status })` and `HealthLabel({ status })` (`data-health="ok|late|never"`), alongside `SyncLine`.
  - Sources table: `SourcesTable({ statuses })` from `@/components/sources/sources-table`.
  - Lab panel: `LabPanel({ entries })` from `@/components/home/lab-index`; it returns null when empty.
  - `HomeDashboard()` (async).
  - Anchors on the dashboard `/`: `#work`, `#status`, `#lab`, `#activity` and `#sources`.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/activity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ACTIVITY_LIMIT, buildActivity } from "@/lib/activity";
import type { Book } from "@/lib/sources/goodreads";
import type { Article } from "@/lib/sources/instapaper";
import type { Film } from "@/lib/sources/letterboxd";

const film = (title: string, date: string): Film => ({
  title,
  year: null,
  link: `https://letterboxd.com/${title}`,
  poster: "",
  rating: "",
  ratingValue: null,
  watchedDate: "",
  date,
});
const book = (title: string, date: string): Book => ({
  title,
  author: "",
  cover: "",
  rating: "",
  numRating: 0,
  review: "",
  link: `https://goodreads.com/${title}`,
  date,
});
const article = (title: string, date: string): Article => ({
  title,
  link: `https://example.com/${title}`,
  domain: "example.com",
  date,
  description: "",
  words: 0,
  minutes: null,
  image: null,
});

describe("buildActivity", () => {
  it("merges the three sources newest first with a verb each", () => {
    const items = buildActivity({
      films: [film("f1", "2026-09-26T10:00:00.000Z")],
      books: [book("b1", "2026-09-27T00:00:00.000Z")],
      articles: [article("a1", "2026-09-25T08:00:00.000Z")],
    });
    expect(items.map((i) => `${i.verb} ${i.title}`)).toEqual(["Finished b1", "Watched f1", "Saved a1"]);
    expect(items[0].href).toBe("https://goodreads.com/b1");
  });

  it("keeps only the newest eight", () => {
    const films = Array.from({ length: 6 }, (_, i) => film(`f${i}`, `2026-09-${10 + i}T00:00:00.000Z`));
    const articles = Array.from({ length: 6 }, (_, i) => article(`a${i}`, `2026-08-${10 + i}T00:00:00.000Z`));
    const items = buildActivity({ films, books: [], articles });
    expect(items).toHaveLength(ACTIVITY_LIMIT);
    expect(items[0].title).toBe("f5");
    expect(items.at(-1)!.title).toBe("a4");
  });

  it("drops items without a usable date", () => {
    const items = buildActivity({ films: [film("f", "")], books: [book("b", "nope")], articles: [] });
    expect(items).toEqual([]);
  });
});
```

Replace `tests/ui/home.test.tsx` with:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LabBand, LabPanel, labIndexEntry } from "@/components/home/lab-index";
import { MetaLine, visibleSegments } from "@/components/home/meta-line";
import type { LabEntry } from "@/content/lab-index";
import type { MetaSegment } from "@/content/profile";

const html = renderToStaticMarkup;

describe("Lab index", () => {
  it("renders neither the band nor the panel while the list is empty", () => {
    expect(html(<LabBand entries={[]} />)).toBe("");
    expect(html(<LabPanel entries={[]} />)).toBe("");
  });

  it("renders the panel as a table with one row per entry", () => {
    const markup = html(<LabPanel entries={[{ title: "a", description: "b", status: "live" }]} />);
    expect(markup).toContain(">Lab</h2>");
    expect(markup.split("<tbody>")[1].match(/<tr /g)).toHaveLength(1);
    expect(markup).toContain('aria-label="live"');
  });

  it("renders one row per entry with its status glyph", () => {
    const entries: LabEntry[] = [
      { title: "Shipped thing", description: "Live now.", year: "2025", href: "https://example.com/", status: "live" },
      { title: "Half-built thing", description: "Not yet.", status: "wip" },
      { title: "Plain thing", description: "No status." },
    ];
    const markup = html(<LabBand entries={entries} />);
    expect(markup).toContain(">Lab<");
    expect(markup.match(/class="group grid/g)).toHaveLength(3);
    expect(markup).toContain('aria-label="live"');
    expect(markup).toContain('aria-label="in progress"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain(">All<");
  });

  it("maps description to the inline meta and year to the year column", () => {
    expect(labIndexEntry({ title: "t", description: "d", year: "2026", status: "wip" })).toEqual({
      title: "t",
      meta: "d",
      years: "2026",
      href: undefined,
      status: "late",
      statusLabel: "in progress",
    });
  });
});

describe("MetaLine", () => {
  const segments: MetaSegment[] = [
    { text: "DESIGNER + BUILDER" },
    { clock: "Europe/Istanbul", label: "ANKARA" },
    { availability: true },
  ];

  it("shows OPEN TO ROLES only while available", () => {
    expect(visibleSegments(segments, true)).toHaveLength(3);
    expect(visibleSegments(segments, false)).toEqual(segments.slice(0, 2));
  });

  it("joins segments with a middle dot and prerenders the clock as --:--", () => {
    const markup = html(<MetaLine segments={segments} available />);
    expect(markup).toContain("DESIGNER + BUILDER");
    expect(markup).toContain('ANKARA <time aria-label="Local time in Ankara">--:--</time>');
    expect(markup).toContain("OPEN TO ROLES");
    expect(markup.match(/ · /g)).toHaveLength(2);
  });
});
```

Run: `npm test`
Expected: FAIL. `@/lib/activity` cannot be resolved, and `LabPanel` is not exported.

- [ ] **Step 2: Add the activity merge**

Create `lib/activity.ts`:

```ts
import type { Book } from "./sources/goodreads";
import type { Article } from "./sources/instapaper";
import type { Film } from "./sources/letterboxd";

export interface ActivityItem {
  verb: "Watched" | "Finished" | "Saved";
  title: string;
  href: string;
  // ISO timestamp.
  date: string;
}

export const ACTIVITY_LIMIT = 8;

// The dashboard's Activity panel: films watched, books finished (the read
// shelf) and articles saved, merged newest first. Items without a usable
// date can't be placed in time and are left out.
export function buildActivity(
  { films, books, articles }: { films: Film[]; books: Book[]; articles: Article[] },
  limit: number = ACTIVITY_LIMIT,
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...films.map((film) => ({ verb: "Watched" as const, title: film.title, href: film.link, date: film.date })),
    ...books.map((book) => ({ verb: "Finished" as const, title: book.title, href: book.link, date: book.date })),
    ...articles.map((article) => ({
      verb: "Saved" as const,
      title: article.title,
      href: article.link,
      date: article.date,
    })),
  ];
  return items
    .filter((item) => !Number.isNaN(Date.parse(item.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, limit);
}
```

- [ ] **Step 3: Add the page header and the sources table**

Create `components/shell/page-header.tsx`:

```tsx
import type { ReactNode } from "react";
import type { View } from "@/lib/view/views";

// A page's title. In the dashboard it is the slim top bar of the content
// column (48px; 40px on mobile, under the Menu bar): title, a mono meta, and
// a right-hand context slot. On the site it is a display headline.
export function PageHeader({
  view,
  title,
  meta,
  context,
}: {
  view: View;
  title: string;
  meta?: ReactNode;
  context?: ReactNode;
}) {
  if (view === "dashboard") {
    return (
      <header className="flex h-10 items-center justify-between gap-4 border-b px-4 md:h-12 md:px-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="type-sans-14-medium">{title}</h1>
          {meta ? <span className="truncate type-mono-12 text-fg-muted">{meta}</span> : null}
        </div>
        {context ? <div className="flex shrink-0 items-center gap-3 type-mono-12 text-fg-muted">{context}</div> : null}
      </header>
    );
  }
  return (
    <header className="flex flex-col gap-4 pt-16 md:pt-24">
      <h1 className="type-display-64">{title}</h1>
      {meta ? <p className="type-mono-12 text-fg-muted">{meta}</p> : null}
    </header>
  );
}
```

Replace `components/sources/source-health.tsx` with:

```tsx
"use client";

import { RelativeTime } from "@/components/ui/relative-time";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { useNow } from "@/components/ui/use-now";
import { HEALTH_LABELS, type Health, type SourceStatus, sourceHealth, summarizeHealth } from "@/lib/sources/health";

const GLYPHS: Record<Health, GlyphStatus> = { ok: "ok", late: "late", never: "empty" };

// Health depends on the current time, so it is computed on the client.

// ● / ◐ / ○ for one source.
export function HealthGlyph({ status }: { status: SourceStatus }) {
  const health = sourceHealth(status.lastSuccessAt, status.intervalMinutes, useNow());
  return <StatusGlyph status={GLYPHS[health]} />;
}

// "synced" / "late" / "never synced" for one source.
export function HealthLabel({ status }: { status: SourceStatus }) {
  const health = sourceHealth(status.lastSuccessAt, status.intervalMinutes, useNow());
  return <span data-health={health}>{HEALTH_LABELS[health]}</span>;
}

// "● 5/5 synced · 12m ago" under the sidebar toggles.
export function SyncLine({ statuses }: { statuses: SourceStatus[] }) {
  const summary = summarizeHealth(statuses, useNow());
  return (
    <p data-testid="sync-line" className="flex flex-wrap items-center gap-x-1.5 type-mono-11 text-fg-muted">
      <StatusGlyph status={GLYPHS[summary.overall]} />
      <span>
        {summary.ok}/{summary.total} synced
      </span>
      {summary.latest ? (
        <>
          <span aria-hidden="true">·</span>
          <RelativeTime iso={summary.latest} />
        </>
      ) : null}
    </p>
  );
}
```

Create `components/sources/sources-table.tsx`:

```tsx
import { DataTable } from "@/components/ui/data-table";
import { RelativeTime } from "@/components/ui/relative-time";
import type { SourceStatus } from "@/lib/sources/health";
import { HealthGlyph, HealthLabel } from "./source-health";

// One row per external source: health glyph and name, status, last sync.
export function SourcesTable({ statuses }: { statuses: SourceStatus[] }) {
  return (
    <DataTable
      caption="Source sync status"
      rows={statuses}
      rowKey={(status) => status.id}
      columns={[
        {
          header: "Source",
          cell: (status) => (
            <span className="inline-flex items-center gap-2">
              <HealthGlyph status={status} />
              {status.label}
            </span>
          ),
        },
        { header: "Status", cell: (status) => <HealthLabel status={status} />, mono: true },
        {
          header: "Last sync",
          cell: (status) => (status.lastSuccessAt ? <RelativeTime iso={status.lastSuccessAt} /> : "never"),
          mono: true,
          align: "right",
        },
      ]}
    />
  );
}
```

- [ ] **Step 4: Add the Lab panel and the Overview**

Replace `components/home/lab-index.tsx` with:

```tsx
import { Band } from "@/components/ui/band";
import { DataTable } from "@/components/ui/data-table";
import { type IndexEntry, IndexRow } from "@/components/ui/index-row";
import { Panel } from "@/components/ui/panel";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import type { LabEntry } from "@/content/lab-index";

export const LAB_STATUS: Record<NonNullable<LabEntry["status"]>, { glyph: GlyphStatus; label: string }> = {
  live: { glyph: "ok", label: "live" },
  wip: { glyph: "late", label: "in progress" },
};

export function labIndexEntry(entry: LabEntry): IndexEntry {
  const status = entry.status ? LAB_STATUS[entry.status] : undefined;
  return {
    title: entry.title,
    meta: entry.description,
    years: entry.year,
    href: entry.href,
    status: status?.glyph,
    statusLabel: status?.label,
  };
}

// The home page's second index. Hidden while the list is empty; no "All →"
// until /lab ships (S5).
export function LabBand({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Band label="Lab" id="lab">
      {entries.map((entry) => (
        <IndexRow key={entry.title} entry={labIndexEntry(entry)} />
      ))}
    </Band>
  );
}

// The same list as a dashboard panel. Also hidden while empty.
export function LabPanel({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Panel title="Lab" count={entries.length} id="lab">
      <DataTable
        caption="Lab"
        rows={entries}
        rowKey={(entry) => entry.title}
        columns={[
          {
            header: "Project",
            cell: (entry) => (
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                {entry.status ? (
                  <StatusGlyph status={LAB_STATUS[entry.status].glyph} label={LAB_STATUS[entry.status].label} />
                ) : null}
                {entry.href ? <TextLink href={entry.href}>{entry.title}</TextLink> : entry.title}
              </span>
            ),
          },
          { header: "Description", cell: (entry) => entry.description },
          { header: "Year", cell: (entry) => entry.year ?? "", mono: true },
          { header: "Status", cell: (entry) => entry.status ?? "", mono: true },
        ]}
      />
    </Panel>
  );
}
```

Create `components/home/home-dashboard.tsx`:

```tsx
import type { ReactNode } from "react";
import { Empty } from "@/components/sections/empty";
import { PageHeader } from "@/components/shell/page-header";
import { SourcesTable } from "@/components/sources/sources-table";
import { DataTable } from "@/components/ui/data-table";
import { Panel, PanelGrid } from "@/components/ui/panel";
import { RelativeTime } from "@/components/ui/relative-time";
import { Stat, StatRow } from "@/components/ui/stat";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { labIndex } from "@/content/lab-index";
import { profile } from "@/content/profile";
import { type WorkEntry, workIndex } from "@/content/work-index";
import { type ActivityItem, buildActivity } from "@/lib/activity";
import { readSource } from "@/lib/sources/read";
import { readSourceStatuses } from "@/lib/sources/status";
import { LabPanel } from "./lab-index";

function StatusRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-9 items-center justify-between gap-3 border-b px-3 last:border-b-0">
      <dt className="type-mono-11 tracking-[0.02em] text-fg-muted uppercase">{label}</dt>
      <dd className="inline-flex items-center gap-2 type-sans-13">{children}</dd>
    </div>
  );
}

function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="p-3">
        <Empty>No activity yet.</Empty>
      </div>
    );
  }
  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${index}-${item.href}`} className="flex h-9 items-center gap-3 border-b px-3 last:border-b-0">
          <StatusGlyph status="ok" className="type-sans-13 text-fg-muted" />
          <span className="w-16 shrink-0 type-mono-11 tracking-[0.02em] text-fg-muted uppercase">{item.verb}</span>
          <a
            href={item.href}
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate type-sans-13 hover:underline hover:underline-offset-[0.2em]"
          >
            {item.title}
          </a>
          <RelativeTime iso={item.date} className="shrink-0 type-mono-12 text-fg-muted" />
        </li>
      ))}
    </ul>
  );
}

const WORK_COLUMNS = [
  { header: "Project", cell: (entry: WorkEntry) => (entry.href ? <TextLink href={entry.href}>{entry.title}</TextLink> : entry.title) },
  { header: "Notes", cell: (entry: WorkEntry) => entry.meta ?? "", mono: true },
  { header: "Years", cell: (entry: WorkEntry) => entry.years ?? "", mono: true },
  { header: "Role", cell: (entry: WorkEntry) => entry.role ?? "", mono: true },
];

// Dashboard view of "/" (Overview): a metric row, then the Work, Status, Lab,
// Activity and Sources panels on the 12-column grid.
export async function HomeDashboard() {
  const [films, books, articles, github, statuses] = await Promise.all([
    readSource("letterboxd"),
    readSource("goodreads"),
    readSource("instapaper"),
    readSource("github"),
    readSourceStatuses(),
  ]);
  const activity = buildActivity({ films: films.data, books: books.data.read, articles: articles.data });

  return (
    <main>
      <PageHeader view="dashboard" title="Overview" meta={`${workIndex.length} projects`} />
      <PanelGrid>
        <div className="md:col-span-12">
          <StatRow>
            <Stat label="Films synced" value={films.data.length} />
            <Stat label="Books" value={books.data.currentlyReading.length + books.data.read.length} />
            <Stat label="GitHub contributions" value={github.data.total} />
            {profile.metrics?.map((metric) => (
              <Stat key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </StatRow>
        </div>
        <Panel title="Work" count={workIndex.length} span={8} id="work">
          <DataTable caption="Selected work" columns={WORK_COLUMNS} rows={workIndex} rowKey={(entry) => entry.title} />
        </Panel>
        <Panel title="Status" span={4} id="status">
          <dl>
            <StatusRow label="Availability">
              {profile.available ? (
                <>
                  <StatusGlyph status="ok" /> Open to roles
                </>
              ) : (
                <>
                  <StatusGlyph status="empty" /> Not announced
                </>
              )}
            </StatusRow>
            <StatusRow label="Booking">
              {profile.bookingUrl ? (
                <TextLink href={profile.bookingUrl}>Book a call</TextLink>
              ) : (
                <>
                  <StatusGlyph status="empty" /> Not set up yet
                </>
              )}
            </StatusRow>
          </dl>
        </Panel>
        <LabPanel entries={labIndex} />
        <Panel title="Activity" count={activity.length} span={8} id="activity">
          <ActivityList items={activity} />
        </Panel>
        <Panel title="Sources" count={statuses.length} span={4} id="sources">
          <SourcesTable statuses={statuses} />
        </Panel>
      </PanelGrid>
    </main>
  );
}
```

Replace `app/[view]/page.tsx` with:

```tsx
import { HomeDashboard } from "@/components/home/home-dashboard";
import { HomeSite } from "@/components/home/home-site";
import { assertView } from "@/lib/view/params";

export default async function HomePage({ params }: PageProps<"/[view]">) {
  const view = assertView((await params).view);
  return view === "dashboard" ? <HomeDashboard /> : <HomeSite />;
}
```

Run: `npm test`
Expected: PASS (28 files, 137 tests).

- [ ] **Step 5: Add the e2e checks**

Append to `e2e/home.spec.ts`:

```ts
test("the dashboard home shows the metric row and the Overview panels", async ({ page }) => {
  await page.goto("/?view=dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  await expect(page.locator("main dl").first().locator("dt")).toHaveText([
    "Films synced",
    "Books",
    "GitHub contributions",
  ]);

  const work = page.locator("#work");
  await expect(work.getByRole("columnheader")).toHaveText(["Project", "Notes", "Years", "Role"]);
  await expect(work.locator("tbody tr")).toHaveCount(5);
  await expect(page.locator("#lab tbody tr")).toHaveCount(3);
  await expect(page.locator("#status")).toContainText("Open to roles");
  await expect(page.locator("#activity")).toContainText("No activity yet.");
});

test("the Sources panel lists every source as never synced without a database", async ({ page }) => {
  await page.goto("/?view=dashboard");
  const sources = page.locator("#sources");
  await expect(sources.locator("tbody tr")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(5);
});
```

Replace `e2e-fixtures/home.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";

// Runs against a SOURCE_FIXTURES=1 build (see e2e-fixtures/life.spec.ts).

test("Off the clock shows four tiles with real titles", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator("#off-the-clock");
  await expect(strip.locator("[data-tile]")).toHaveCount(4);
  await expect(strip.locator('[data-tile="Reading"]')).toContainText(
    "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
  );
  await expect(strip.locator('[data-tile="Reading"]')).toContainText("J.K. Rowling");
  await expect(strip.locator('[data-tile="Watched"]')).toContainText("Love & Other Drugs");
  await expect(strip.locator('[data-tile="Watched"]')).toContainText("★★★½");
  await expect(strip.locator('[data-tile="Photo"] img')).toHaveAttribute("alt", "");
  await expect(strip.locator('[data-tile="Saved"]')).toContainText("Jurassic Park computers in excruciating detail");
  await expect(strip.locator('[data-tile="Saved"]')).toContainText("fabiensanglard.net · 13 min");
});

test("the dashboard home fills the metrics, Activity and Sources", async ({ page }) => {
  await page.goto("/?view=dashboard");
  // 3 films; 3 reading + 3 read; 7 contributions.
  await expect(page.locator("main dl").first().locator("dd")).toHaveText(["3", "6", "7"]);

  const activity = page.locator("#activity li");
  await expect(activity).toHaveCount(8);
  await expect(activity.first()).toContainText("Watched");
  await expect(activity.first()).toContainText("Love & Other Drugs");
  await expect(activity.nth(3)).toContainText("Finished");
  await expect(activity.last()).toContainText("Saved");
  await expect(activity.last()).toContainText("Leaving Mozilla");

  const sources = page.locator("#sources");
  await expect(sources.locator("[data-health]")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(0);
  await expect(page.getByTestId("sync-line")).not.toContainText("○");
});
```

The fixture expectations come from the recordings:
- 3 films, 3 books being read and 3 read, 7 contributions.
- Activity, newest first: Love & Other Drugs (Sep 26), Devil Boy, Pickled, Joseph Müller-Brockman (finished Aug 11), Hacı Komünist, Jurassic Park (saved Jul 16), Bozkır, Leaving Mozilla. That is exactly 8.
- Fixture mode reports every source as synced at 2026-10-02T12:00Z. So after hydration, sources show ◐ late, or ● on the day itself, but never ○.

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 28 files, 137 tests.
- `e2e`: 42 passed.
- `e2e:fixtures`: 4 passed.

- [ ] **Step 7: Visual check**

```bash
SOURCE_FIXTURES=1 npm run build
SOURCE_FIXTURES=1 npm run screenshots -- .superpowers/screens/task-9 /
npm run build
```

Compare the dashboard shots with Figma "02 Mode comparison", dashboard frames (`6:100`), and "03 Shell sketch" (`7:100`).
- **Header:** a 48px bar reading "Overview 5 projects".
- **Layout:** three stat tiles, then Work (8 columns) with Status (4), Lab full width, and Activity (8) with Sources (4).
- **Panels:** `--color-surface` with 36px headers, mono column headers and 36px rows.
- **Mobile (390):** the panels stack.

- [ ] **Step 8: Commit**

```bash
git add lib/activity.ts components/shell/page-header.tsx components/sources components/home "app/[view]/page.tsx" tests e2e/home.spec.ts e2e-fixtures/home.spec.ts
git commit -m "Build the dashboard Overview with activity and source health

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: `/life` as bands and panels

Restyles `/life` in both views.

`SectionBlock` renders each section as a full-width `Band` on the site and as a `Panel` on the dashboard's 12-column grid. In the dashboard, the panel header shows the item count and, for synced sources, "Synced 2h ago".

Section by section:
- **Films:** a poster row with stars and year.
- **Books:** reading covers, then the read list with stars.
- **Saved:** title · domain · minutes.
- **Writing:** a list, with an empty state while w00f.org has no posts.
- **GitHub:** a five-step monochrome heatmap with the total. The dashboard adds total, active days and longest streak.
- **Photos (new section):** a grid linking to each photo, with "All →" pointing to `/photos/`.
- **Sources:** reuses `SourcesTable`.

Every dashboard table gets a real `<thead>`. Stars come from `ratingValue` (`lib/sources/stars.ts`), not from the title.

**Files:**
- Create: `components/sections/item-link.tsx`, `components/sections/github/heatmap.tsx`, `components/sections/photos/index.tsx`, `components/photos/photo-grid.tsx`, `lib/sources/github-stats.ts`, `tests/sources/github-stats.test.ts`
- Replace: `components/sections/types.ts`, `components/sections/section-block.tsx`, `components/sections/synced-at.tsx`, `components/sections/life.ts`
- Replace: `components/sections/{films,books,articles,writing,github,sync-status}/index.tsx`
- Replace: `app/[view]/life/page.tsx`, `e2e/life.spec.ts`, `e2e-fixtures/life.spec.ts`

**Interfaces:**
- Consumes:
  - From Task 9: `PageHeader` and `SourcesTable`.
  - From Task 5: `readSourceStatuses`.
  - From Task 8: `stars`.
  - From Task 3: `Band`, `Panel`/`PanelGrid`/`PanelSpan`, `DataTable`, `Cover` and `Stat`/`StatRow`.
  - From Task 2: `MetaLabel`, `RelativeTime` and `Empty`.
  - From Task 5: `profile.social`.
- Produces:
  - `SectionDefinition<T>` gains `source?`, `synced?`, `href?`, `count?: (data: T) => number` and `span?: PanelSpan`.
  - `ItemLink({ href, className?, children })` for title links in lists and tables (no arrow).
  - Photo grid: `PHOTO_GRID_SIZES: Record<View, string>` and `PhotoGrid({ photos, view })` from `@/components/photos/photo-grid`.
  - GitHub stats: `contributionStats(data): { total, activeDays, longestStreak }` from `@/lib/sources/github-stats`.
  - Heatmap: `Heatmap({ data })` (`role="img"`, labelled "N contributions in the last year").
  - Section order on `/life`: films, books, articles, writing, github, photos, sync-status. Each is `id`- and `data-section`-addressable.

- [ ] **Step 1: Write the failing unit test**

Create `tests/sources/github-stats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contributionStats } from "@/lib/sources/github-stats";

const day = (date: string, count: number) => ({ date, count, level: count > 0 ? 1 : 0 });

describe("contributionStats", () => {
  it("counts active days and the longest run of them, across weeks", () => {
    const stats = contributionStats({
      total: 9,
      weeks: [
        { days: [day("2026-09-26", 1), day("2026-09-27", 0), day("2026-09-28", 2)] },
        { days: [day("2026-09-29", 3), day("2026-09-30", 3), day("2026-10-01", 0)] },
      ],
    });
    expect(stats).toEqual({ total: 9, activeDays: 4, longestStreak: 3 });
  });

  it("is all zero without data", () => {
    expect(contributionStats({ total: 0, weeks: [] })).toEqual({ total: 0, activeDays: 0, longestStreak: 0 });
  });
});
```

Run: `npm test -- tests/sources/github-stats.test.ts`
Expected: FAIL, because `@/lib/sources/github-stats` cannot be resolved.

Create `lib/sources/github-stats.ts`:

```ts
import type { Contributions } from "./github";

export interface ContributionStats {
  total: number;
  activeDays: number;
  // Most consecutive days with at least one contribution.
  longestStreak: number;
}

export function contributionStats(data: Contributions): ContributionStats {
  const days = data.weeks.flatMap((week) => week.days);
  let longestStreak = 0;
  let streak = 0;
  for (const day of days) {
    streak = day.count > 0 ? streak + 1 : 0;
    longestStreak = Math.max(longestStreak, streak);
  }
  return { total: data.total, activeDays: days.filter((day) => day.count > 0).length, longestStreak };
}
```

Run it again: 2 tests PASS.

- [ ] **Step 2: Render sections as bands and panels**

Replace `components/sections/types.ts` with:

```ts
import type { ReactNode } from "react";
import type { PanelSpan } from "@/components/ui/panel";
import type { SourceView } from "@/lib/sources/snapshot-view";
import type { View } from "@/lib/view/views";

export type Visibility = "both" | "dashboard";

// A section is one data loader plus a renderer per view. Pages hand the view
// to SectionBlock instead of branching themselves. SectionBlock also enforces
// visibility, so a page that forgets visibleSections can't leak dashboard-only
// sections into the site view.
export interface SectionDefinition<T> {
  id: string;
  title: string;
  visibility: Visibility;
  load: () => Promise<SourceView<T>>;
  Site: (props: { data: T }) => ReactNode;
  Dashboard: (props: { data: T; lastSuccessAt: string | null }) => ReactNode;
  // Upstream name for the band header ("Films · Letterboxd").
  source?: string;
  // Fed by a synced source: the dashboard panel header shows the sync time.
  synced?: boolean;
  // The band's "All →" link.
  href?: string;
  // Item count for the panel header.
  count?: (data: T) => number;
  // Dashboard grid columns (default 12).
  span?: PanelSpan;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySectionDefinition = SectionDefinition<any>;

// Dashboard-only sections exist only in the dashboard view.
export function isVisible(
  section: Pick<AnySectionDefinition, "visibility">,
  view: View,
): boolean {
  return section.visibility === "both" || view === "dashboard";
}

export function visibleSections<S extends Pick<AnySectionDefinition, "visibility">>(
  sections: S[],
  view: View,
): S[] {
  return sections.filter((s) => isVisible(s, view));
}
```

Replace `components/sections/section-block.tsx` with:

```tsx
import { Band } from "@/components/ui/band";
import { Panel } from "@/components/ui/panel";
import type { View } from "@/lib/view/views";
import { SyncedAt } from "./synced-at";
import { type AnySectionDefinition, isVisible } from "./types";

// Site: a full-width Band. Dashboard: a Panel on the 12-column grid.
export async function SectionBlock({
  section,
  view,
}: {
  section: AnySectionDefinition;
  view: View;
}) {
  // Checked before loading so a hidden section costs nothing.
  if (!isVisible(section, view)) return null;
  const { data, lastSuccessAt } = await section.load();
  const { Site, Dashboard } = section;
  if (view === "dashboard") {
    return (
      <Panel
        id={section.id}
        data-section={section.id}
        title={section.title}
        span={section.span}
        count={section.count?.(data)}
        right={section.synced ? <SyncedAt at={lastSuccessAt} /> : undefined}
      >
        <Dashboard data={data} lastSuccessAt={lastSuccessAt} />
      </Panel>
    );
  }
  return (
    <Band
      id={section.id}
      data-section={section.id}
      label={section.title}
      source={section.source}
      href={section.href}
    >
      <Site data={data} />
    </Band>
  );
}
```

Replace `components/sections/synced-at.tsx` with:

```tsx
import { RelativeTime } from "@/components/ui/relative-time";

// A source panel's header context: when it last synced.
export function SyncedAt({ at }: { at: string | null }) {
  return <span>{at ? <>Synced <RelativeTime iso={at} /></> : "Not synced yet"}</span>;
}
```

Create `components/sections/item-link.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { isExternal } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";

// A title link inside a list or table row: no arrow (the row is not a call
// to action), underlined on hover. External links never pass the referrer.
export function ItemLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const classes = cx("hover:underline hover:underline-offset-[0.2em]", className);
  return isExternal(href) ? (
    <a href={href} rel="noopener noreferrer" className={classes}>
      {children}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
```

- [ ] **Step 3: Restyle the source sections**

Replace `components/sections/films/index.tsx` with:

```tsx
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { profile } from "@/content/profile";
import { formatDate } from "@/lib/format";
import type { Film } from "@/lib/sources/letterboxd";
import { readSource } from "@/lib/sources/read";
import { stars } from "@/lib/sources/stars";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

// A row of posters with stars and year.
function Site({ data }: { data: Film[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className="grid grid-cols-3 gap-x-4 gap-y-8 md:grid-cols-6 md:gap-x-6">
      {data.map((film) => (
        <li key={film.link}>
          <a href={film.link} rel="noopener noreferrer" className="group flex flex-col gap-2">
            <Cover src={film.poster} alt="" />
            <span className="type-sans-14 group-hover:underline group-hover:underline-offset-[0.2em]">
              {film.title}
            </span>
            <span className="type-mono-12 text-fg-muted">
              {[stars(film.ratingValue), film.year].filter(Boolean).join(" · ")}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data }: { data: Film[] }) {
  return (
    <DataTable
      caption="Films"
      rows={data}
      rowKey={(film) => film.link}
      columns={[
        { header: "Title", cell: (film) => <ItemLink href={film.link}>{film.title}</ItemLink> },
        { header: "Year", cell: (film) => film.year ?? "", mono: true },
        { header: "Rating", cell: (film) => stars(film.ratingValue), mono: true },
        {
          header: "Watched",
          cell: (film) => (film.watchedDate ? formatDate(film.watchedDate) : ""),
          mono: true,
          align: "right",
        },
      ]}
    />
  );
}

export const films: SectionDefinition<Film[]> = {
  id: "films",
  title: "Films",
  visibility: "both",
  load: () => readSource("letterboxd"),
  Site,
  Dashboard,
  source: "Letterboxd",
  synced: true,
  href: `https://letterboxd.com/${profile.social.letterboxd}/`,
  count: (data) => data.length,
  span: 6,
};
```

Replace `components/sections/books/index.tsx` with:

```tsx
import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { MetaLabel } from "@/components/ui/meta-label";
import { profile } from "@/content/profile";
import { formatDate } from "@/lib/format";
import type { Book, Books } from "@/lib/sources/goodreads";
import { readSource } from "@/lib/sources/read";
import { stars } from "@/lib/sources/stars";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

function Reading({ books }: { books: Book[] }) {
  if (books.length === 0) return <Empty />;
  return (
    <ul className="grid grid-cols-3 gap-x-4 gap-y-8 md:grid-cols-6 md:gap-x-6">
      {books.map((book) => (
        <li key={book.link}>
          <a href={book.link} rel="noopener noreferrer" className="group flex flex-col gap-2">
            <Cover src={book.cover} alt="" />
            <span className="type-sans-14 group-hover:underline group-hover:underline-offset-[0.2em]">
              {book.title}
            </span>
            <span className="type-mono-12 text-fg-muted">{book.author}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Read({ books }: { books: Book[] }) {
  if (books.length === 0) return <Empty />;
  return (
    <ul className="border-t">
      {books.map((book) => (
        <li key={book.link} className="grid grid-cols-12 items-baseline gap-x-6 border-b py-3">
          <ItemLink href={book.link} className="col-span-12 type-sans-16 md:col-span-6">
            {book.title}
          </ItemLink>
          <span className="col-span-8 type-mono-12 text-fg-muted md:col-span-4">{book.author}</span>
          <span className="col-span-4 text-right type-mono-12 md:col-span-2">{stars(book.numRating)}</span>
        </li>
      ))}
    </ul>
  );
}

// Covers for the reading shelf, then the read list with stars.
function Site({ data }: { data: Books }) {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-6">
        <MetaLabel as="h3">Reading</MetaLabel>
        <Reading books={data.currentlyReading} />
      </div>
      <div className="flex flex-col gap-4">
        <MetaLabel as="h3">Read</MetaLabel>
        <Read books={data.read} />
      </div>
    </div>
  );
}

function Dashboard({ data }: { data: Books }) {
  const rows = [
    ...data.currentlyReading.map((book) => ({ ...book, shelf: "reading" })),
    ...data.read.map((book) => ({ ...book, shelf: "read" })),
  ];
  return (
    <DataTable
      caption="Books"
      rows={rows}
      rowKey={(book) => `${book.shelf}-${book.link}`}
      columns={[
        { header: "Shelf", cell: (book) => book.shelf, mono: true },
        { header: "Title", cell: (book) => <ItemLink href={book.link}>{book.title}</ItemLink> },
        { header: "Author", cell: (book) => book.author, mono: true },
        { header: "Rating", cell: (book) => stars(book.numRating), mono: true },
        { header: "Date", cell: (book) => formatDate(book.date), mono: true, align: "right" },
      ]}
    />
  );
}

export const books: SectionDefinition<Books> = {
  id: "books",
  title: "Books",
  visibility: "both",
  load: () => readSource("goodreads"),
  Site,
  Dashboard,
  source: "Goodreads",
  synced: true,
  href: `https://www.goodreads.com/${profile.social.goodreads}`,
  count: (data) => data.currentlyReading.length + data.read.length,
  span: 6,
};
```

Replace `components/sections/articles/index.tsx` with:

```tsx
import { DataTable } from "@/components/ui/data-table";
import { profile } from "@/content/profile";
import { formatDate } from "@/lib/format";
import type { Article } from "@/lib/sources/instapaper";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

const minutes = (article: Article) => (article.minutes ? `${article.minutes} min` : "");

// title · domain · minutes
function Site({ data }: { data: Article[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className="border-t">
      {data.map((article) => (
        <li key={article.link} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b py-3">
          <ItemLink href={article.link} className="type-sans-16">
            {article.title}
          </ItemLink>
          <span className="type-mono-12 text-fg-muted">
            {[article.domain, minutes(article)].filter(Boolean).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data }: { data: Article[] }) {
  return (
    <DataTable
      caption="Saved articles"
      rows={data}
      rowKey={(article) => article.link}
      columns={[
        { header: "Title", cell: (article) => <ItemLink href={article.link}>{article.title}</ItemLink> },
        { header: "Domain", cell: (article) => article.domain, mono: true },
        { header: "Length", cell: minutes, mono: true, align: "right" },
        { header: "Saved", cell: (article) => formatDate(article.date), mono: true, align: "right" },
      ]}
    />
  );
}

export const articles: SectionDefinition<Article[]> = {
  id: "articles",
  title: "Saved",
  visibility: "both",
  load: () => readSource("instapaper"),
  Site,
  Dashboard,
  source: "Instapaper",
  synced: true,
  href: `https://www.instapaper.com/p/${profile.social.instapaper}`,
  count: (data) => data.length,
  span: 8,
};
```

Replace `components/sections/writing/index.tsx` with:

```tsx
import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { readSource } from "@/lib/sources/read";
import type { Post } from "@/lib/sources/writing";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Post[] }) {
  // w00f.org has no posts yet; the empty state is the normal case for now.
  if (data.length === 0) return <Empty />;
  return (
    <ul className="border-t">
      {data.map((post) => (
        <li key={post.link} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b py-3">
          <ItemLink href={post.link} className="type-sans-16">
            {post.title}
          </ItemLink>
          <time dateTime={post.date} className="type-mono-12 text-fg-muted">
            {formatDate(post.date)}
          </time>
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data }: { data: Post[] }) {
  return (
    <DataTable
      caption="Writing"
      rows={data}
      rowKey={(post) => post.link}
      columns={[
        { header: "Title", cell: (post) => <ItemLink href={post.link}>{post.title}</ItemLink> },
        { header: "Date", cell: (post) => formatDate(post.date), mono: true, align: "right" },
      ]}
    />
  );
}

export const writing: SectionDefinition<Post[]> = {
  id: "writing",
  title: "Writing",
  visibility: "both",
  load: () => readSource("writing"),
  Site,
  Dashboard,
  source: "w00f.org",
  synced: true,
  href: "https://w00f.org/",
  count: (data) => data.length,
  span: 4,
};
```

Create `components/sections/github/heatmap.tsx`:

```tsx
import { cx } from "@/lib/cx";
import type { Contributions } from "@/lib/sources/github";

// Five monochrome steps from --color-line to --color-fg (GitHub's levels 0–4).
const LEVELS = [
  "bg-line",
  "bg-[color-mix(in_srgb,var(--color-fg)_25%,var(--color-line))]",
  "bg-[color-mix(in_srgb,var(--color-fg)_50%,var(--color-line))]",
  "bg-[color-mix(in_srgb,var(--color-fg)_75%,var(--color-line))]",
  "bg-fg",
];

// One column per week, Sunday on top. The first week is usually partial, so
// it is padded down to its first day's weekday.
export function Heatmap({ data }: { data: Contributions }) {
  const firstDay = data.weeks[0]?.days[0];
  const offset = firstDay ? new Date(`${firstDay.date}T00:00:00Z`).getUTCDay() : 0;
  return (
    <div className="overflow-x-auto">
      <div
        role="img"
        aria-label={`${data.total} contributions in the last year`}
        className="grid w-max grid-flow-col grid-rows-7 gap-[3px]"
      >
        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} className="size-2.5" />
        ))}
        {data.weeks.flatMap((week) =>
          week.days.map((day) => (
            <span
              key={day.date}
              title={`${day.count} on ${day.date}`}
              className={cx("size-2.5", LEVELS[day.level] ?? LEVELS[0])}
            />
          )),
        )}
      </div>
    </div>
  );
}
```

Replace `components/sections/github/index.tsx` with:

```tsx
import { Stat, StatRow } from "@/components/ui/stat";
import { profile } from "@/content/profile";
import type { Contributions } from "@/lib/sources/github";
import { contributionStats } from "@/lib/sources/github-stats";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";
import { Heatmap } from "./heatmap";

function Site({ data }: { data: Contributions }) {
  if (data.weeks.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-4">
      <Heatmap data={data} />
      <p className="type-mono-12 text-fg-muted">{data.total} contributions in the last year</p>
    </div>
  );
}

function Dashboard({ data }: { data: Contributions }) {
  const stats = contributionStats(data);
  return (
    <div className="flex flex-col gap-4 p-3">
      <StatRow>
        <Stat label="Contributions" value={stats.total} />
        <Stat label="Active days" value={stats.activeDays} />
        <Stat label="Longest streak" value={stats.longestStreak} />
      </StatRow>
      {data.weeks.length === 0 ? <Empty /> : <Heatmap data={data} />}
    </div>
  );
}

export const github: SectionDefinition<Contributions> = {
  id: "github",
  title: "GitHub",
  visibility: "both",
  load: () => readSource("github"),
  Site,
  Dashboard,
  synced: true,
  href: `https://github.com/${profile.social.github}`,
  span: 12,
};
```

Replace `components/sections/sync-status/index.tsx` with:

```tsx
import { SourcesTable } from "@/components/sources/sources-table";
import type { SourceStatus } from "@/lib/sources/health";
import { readSourceStatuses } from "@/lib/sources/status";
import type { SectionDefinition } from "../types";

// Dashboard-only: how fresh each external source is.
export const syncStatus: SectionDefinition<SourceStatus[]> = {
  id: "sync-status",
  title: "Sources",
  visibility: "dashboard",
  load: async () => ({ data: await readSourceStatuses(), lastSuccessAt: null }),
  Site: () => null,
  Dashboard: ({ data }) => <SourcesTable statuses={data} />,
  count: (data) => data.length,
  span: 4,
};
```

- [ ] **Step 4: Add the photos section and lay out the page**

Create `components/photos/photo-grid.tsx`:

```tsx
import Link from "next/link";
import { Picture } from "@/components/picture";
import type { Photo } from "@/lib/content/photos";
import { cx } from "@/lib/cx";
import type { View } from "@/lib/view/views";

// `sizes` must describe the grid below. Site: 3 columns (24px gutters) in
// the 1200px container from md, 2 columns (16px) under 16px margins on
// mobile. Dashboard: 4 columns (16px gutters) in the content column beside
// the 240px sidebar, with 24px padding.
export const PHOTO_GRID_SIZES: Record<View, string> = {
  site: "(min-width: 1248px) 384px, (min-width: 768px) calc((100vw - 96px) / 3), calc((100vw - 48px) / 2)",
  dashboard: "(min-width: 768px) calc((100vw - 336px) / 4), calc((100vw - 48px) / 2)",
};

// Thumbnails linking to each photo page. The visible title names the link,
// so the image itself is decorative (alt="").
export function PhotoGrid({ photos, view }: { photos: Photo[]; view: View }) {
  return (
    <ul
      className={cx(
        "grid grid-cols-2 gap-x-4 gap-y-8",
        view === "dashboard" ? "md:grid-cols-4" : "md:grid-cols-3 md:gap-x-6",
      )}
    >
      {photos.map((photo) => (
        <li key={photo.slug}>
          <Link href={`/photos/${photo.slug}/`} className="group flex flex-col gap-2">
            <Picture
              image={photo.image}
              alt=""
              sizes={PHOTO_GRID_SIZES[view]}
              className="aspect-[3/2] w-full object-cover"
            />
            <span className="type-sans-14 group-hover:underline group-hover:underline-offset-[0.2em]">
              {photo.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

Create `components/sections/photos/index.tsx`:

```tsx
import { PhotoGrid } from "@/components/photos/photo-grid";
import { DataTable } from "@/components/ui/data-table";
import { type Photo, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Photo[] }) {
  if (data.length === 0) return <Empty />;
  return <PhotoGrid photos={data} view="site" />;
}

function Dashboard({ data }: { data: Photo[] }) {
  return (
    <DataTable
      caption="Photos"
      rows={data}
      rowKey={(photo) => photo.slug}
      columns={[
        { header: "Title", cell: (photo) => <ItemLink href={`/photos/${photo.slug}/`}>{photo.title}</ItemLink> },
        { header: "Camera", cell: (photo) => photo.camera ?? "", mono: true },
        { header: "Date", cell: (photo) => formatDate(photo.date), mono: true, align: "right" },
      ]}
    />
  );
}

// Photos are authored content, not a synced source: no sync time.
export const photos: SectionDefinition<Photo[]> = {
  id: "photos",
  title: "Photos",
  visibility: "both",
  load: async () => ({ data: await getPhotos(), lastSuccessAt: null }),
  Site,
  Dashboard,
  href: "/photos/",
  count: (data) => data.length,
  span: 8,
};
```

Replace `components/sections/life.ts` with:

```ts
import { articles } from "./articles";
import { books } from "./books";
import { films } from "./films";
import { github } from "./github";
import { photos } from "./photos";
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
  photos,
  syncStatus,
];
```

Replace `app/[view]/life/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { visibleSections } from "@/components/sections/types";
import { PageHeader } from "@/components/shell/page-header";
import { PanelGrid } from "@/components/ui/panel";
import { assertView } from "@/lib/view/params";

export const metadata: Metadata = { title: "Life" };

export default async function LifePage({ params }: PageProps<"/[view]/life">) {
  const view = assertView((await params).view);
  const sections = visibleSections(lifeSections, view);
  const blocks = sections.map((section) => <SectionBlock key={section.id} section={section} view={view} />);

  if (view === "dashboard") {
    return (
      <main>
        <PageHeader view="dashboard" title="Life" meta={`${sections.length} sections`} />
        <PanelGrid>{blocks}</PanelGrid>
      </main>
    );
  }
  return (
    <main className="flex flex-col gap-16 pb-24 md:gap-24">
      <PageHeader view="site" title="Life" />
      {blocks}
    </main>
  );
}
```

- [ ] **Step 5: Update the e2e specs**

Replace `e2e/life.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";

test("site view renders a band for every section, with empty states", async ({ page }) => {
  await page.goto("/life/");
  for (const id of ["films", "books", "articles", "writing", "github", "photos"]) {
    await expect(page.locator(`[data-section="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
  await expect(page.locator('[data-section="films"]')).toContainText("Nothing here yet.");
});

test("the photos band links every photo with a decorative thumbnail", async ({ page }) => {
  await page.goto("/life/");
  const photos = page.locator('[data-section="photos"]');
  await expect(photos.locator("li a")).toHaveCount(5);
  await expect(photos.locator('li img[alt=""]')).toHaveCount(5);
  await expect(photos.getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", "/photos/");
});

test("dashboard view shows panels with real table headers", async ({ page }) => {
  await page.goto("/life/?view=dashboard");
  await expect(page.locator('[data-section="sync-status"]')).toBeVisible();
  const films = page.locator('[data-section="films"]');
  await expect(films).toContainText("Not synced yet");
  await expect(films.locator('thead th[scope="col"]')).toHaveText(["Title", "Year", "Rating", "Watched"]);
  await expect(page.locator('[data-section="photos"] tbody tr')).toHaveCount(5);
});

test("client navigation after a toggle lands on the new view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Dashboard" }).click();
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

Replace `e2e-fixtures/life.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";

// Runs against a build made with SOURCE_FIXTURES=1 (`npm run e2e:fixtures`),
// so every source carries the rows recorded in tests/fixtures/.

test("site bands show real rows from every source", async ({ page }) => {
  await page.goto("/life/");
  const films = page.locator('[data-section="films"]');
  await expect(films.locator("li")).toHaveCount(3);
  await expect(films).toContainText("Love & Other Drugs");
  await expect(films).toContainText("★★★½ · 2010");
  const books = page.locator('[data-section="books"]');
  await expect(books).toContainText("Harry Potter and the Deathly Hallows");
  await expect(books).toContainText("Hacı Komünist");
  await expect(books).toContainText("★★★★");
  const articles = page.locator('[data-section="articles"]');
  await expect(articles).toContainText("Jurassic Park computers in excruciating detail");
  await expect(articles).toContainText("fabiensanglard.net · 13 min");
  await expect(page.locator('[data-section="writing"]')).toContainText("Second post");
  const github = page.locator('[data-section="github"]');
  await expect(github).toContainText("7 contributions");
  await expect(github.getByRole("img", { name: "7 contributions in the last year" })).toBeVisible();
  await expect(page.getByText("Nothing here yet.")).toHaveCount(0);
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
});

test("dashboard panels show table rows, sync times and GitHub stats", async ({ page }) => {
  await page.goto("/life/?view=dashboard");
  const films = page.locator('[data-section="films"]');
  await expect(films.getByRole("row", { name: /Love & Other Drugs/ })).toBeVisible();
  await expect(films.getByText(/^Synced/)).toBeVisible();
  await expect(films.locator('time[datetime="2026-10-02T12:00:00.000Z"]')).toBeVisible();
  await expect(page.locator('[data-section="books"] tbody tr')).toHaveCount(6);
  const github = page.locator('[data-section="github"]');
  await expect(github.locator("dt")).toHaveText(["Contributions", "Active days", "Longest streak"]);
  await expect(github.locator("dd")).toHaveText(["7", "3", "3"]);
  const sources = page.locator('[data-section="sync-status"]');
  await expect(sources.locator("[data-health]")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(0);
  await expect(page.getByText("Not synced yet")).toHaveCount(0);
});
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 29 files, 139 tests. `tests/sections.test.ts` still passes unchanged.
- `e2e`: 43 passed.
- `e2e:fixtures`: 4 passed.

- [ ] **Step 7: Visual check**

```bash
SOURCE_FIXTURES=1 npm run build
SOURCE_FIXTURES=1 npm run screenshots -- .superpowers/screens/task-10 /life/
npm run build
npm run screenshots -- .superpowers/screens/task-10-empty /life/
```

Check these:
- **Site:** each band has a top rule and a "FILMS · LETTERBOXD … ALL →" header. GitHub's header reads just "GITHUB".
- **Covers:** 2:3 and square.
- **Heatmap:** monochrome. With the 2-week fixture it is tiny; the real feed has 53 weeks.
- **Dashboard:** Films (6) beside Books (6), Saved (8) beside Writing (4), GitHub full width, then Photos (8) beside Sources (4).
- **Mobile:** tables scroll sideways rather than squeezing titles.
- **Empty build:** "○ Nothing here yet." in every source band, and "Not synced yet" in the panel headers.

- [ ] **Step 8: Commit**

```bash
git add components/sections components/photos lib/sources/github-stats.ts "app/[view]/life/page.tsx" tests/sources/github-stats.test.ts e2e/life.spec.ts e2e-fixtures/life.spec.ts
git commit -m "Restyle /life as bands and panels with stars and the heatmap

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Photo pages and shared Open Graph defaults

Restyles `/photos/` and `/photos/[slug]/` with tokens in both views. It covers:
- **Grid:** `/photos/` uses `PhotoGrid` (from Task 10), whose `sizes` match the real columns in each view.
- **Thumbnails:** linked thumbnails use `alt=""`, and the visible title names the link.
- **Detail page:** the detail page gets previous/next links.

It also closes the OG follow-up. The root layout now carries shared Open Graph and Twitter defaults: site name, locale, `twitter:card=summary`, and no default image. Pages build their metadata with `pageMetadata()`, which spreads those defaults in. Next replaces a parent's `openGraph`/`twitter` object rather than merging it, so a plain page-level `openGraph` would drop them. Photo pages keep their absolute JPEG `summary_large_image`.

**Files:**
- Create: `lib/metadata.ts`, `tests/metadata.test.ts`
- Replace: `app/[view]/photos/page.tsx`, `app/[view]/photos/[slug]/page.tsx`, `e2e/photos.spec.ts`
- Modify: `app/layout.tsx`, `app/[view]/life/page.tsx`, `app/[view]/system/page.tsx`, `lib/content/photos.ts`, `tests/content/photos.test.ts`

**Interfaces:**
- Consumes: Task 10's `PhotoGrid`, Task 9's `PageHeader`, Task 2's `MetaLabel` and `TextLink`, and S2's photo loaders and image manifest.
- Produces:
  - Defaults: `OPEN_GRAPH_DEFAULTS` (`siteName`, `locale: "en_US"`, `type: "website"`) and `TWITTER_DEFAULTS` (`card: "summary"`) from `@/lib/metadata`.
  - Page metadata: `pageMetadata(title, extra?: Metadata): Metadata`, which sets `og:title` and `twitter:title` to "`<title> · Onur Senture`".
  - Neighbours: `adjacentPhotos(photos, slug): { previous: Photo | null; next: Photo | null }` from `@/lib/content/photos`, where previous is the newer photo and next the older one.
  - The photo page has `<nav aria-label="More photos">`.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/metadata.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { pageMetadata } from "@/lib/metadata";

describe("pageMetadata", () => {
  it("keeps the shared Open Graph and Twitter defaults, without an image", () => {
    expect(pageMetadata("Life")).toEqual({
      title: "Life",
      openGraph: { siteName: "Onur Senture", locale: "en_US", type: "website", title: "Life · Onur Senture" },
      twitter: { card: "summary", title: "Life · Onur Senture" },
    });
  });

  it("lets a page override fields on top of the defaults", () => {
    const metadata = pageMetadata("Stabilo", {
      description: "Stabilo",
      openGraph: { type: "article", images: ["/x.jpg"] },
      twitter: { card: "summary_large_image", images: ["/x.jpg"] },
    });
    expect(metadata.description).toBe("Stabilo");
    expect(metadata.openGraph).toMatchObject({ siteName: "Onur Senture", type: "article", images: ["/x.jpg"] });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Stabilo · Onur Senture" });
  });
});
```

In `tests/content/photos.test.ts`, replace:

```ts
const { loadPhotos, parsePhoto } = await import("@/lib/content/photos");
```

with:

```ts
const { adjacentPhotos, loadPhotos, parsePhoto } = await import("@/lib/content/photos");
```

and append to the end of the file:

```ts
describe("adjacentPhotos", () => {
  const photo = (slug: string) => ({ slug, title: slug, date: "2026-01-01", image: `photos/${slug}` });
  const photos = [photo("newest"), photo("middle"), photo("oldest")];

  it("returns the newer photo as previous and the older one as next", () => {
    expect(adjacentPhotos(photos, "middle")).toEqual({ previous: photos[0], next: photos[2] });
  });

  it("has no previous at the start, no next at the end, nothing for unknown slugs", () => {
    expect(adjacentPhotos(photos, "newest")).toEqual({ previous: null, next: photos[1] });
    expect(adjacentPhotos(photos, "oldest")).toEqual({ previous: photos[1], next: null });
    expect(adjacentPhotos(photos, "nope")).toEqual({ previous: null, next: null });
  });
});
```

Run: `npm test`
Expected: FAIL. `@/lib/metadata` cannot be resolved, and `adjacentPhotos` is not a function.

- [ ] **Step 2: Add the metadata helper and neighbours**

Create `lib/metadata.ts`:

```ts
import type { Metadata } from "next";
import { site } from "./site";

// Shared Open Graph and Twitter defaults. There is no default image: pages
// without a real one get a text-only summary card.
export const OPEN_GRAPH_DEFAULTS = {
  siteName: site.title,
  locale: "en_US",
  type: "website",
} as const;

export const TWITTER_DEFAULTS = { card: "summary" } as const;

// Next replaces a parent's `openGraph` / `twitter` with the page's instead of
// merging them, so pages build their metadata here, on top of the defaults.
export function pageMetadata(title: string, extra: Metadata = {}): Metadata {
  const fullTitle = `${title} · ${site.title}`;
  return {
    ...extra,
    title,
    openGraph: { ...OPEN_GRAPH_DEFAULTS, title: fullTitle, ...extra.openGraph },
    twitter: { ...TWITTER_DEFAULTS, title: fullTitle, ...extra.twitter },
  };
}
```

Append to `lib/content/photos.ts`:

```ts
// The neighbours of a photo in index order (newest first): previous is the
// newer one, next the older one.
export function adjacentPhotos(
  photos: Photo[],
  slug: string,
): { previous: Photo | null; next: Photo | null } {
  const index = photos.findIndex((p) => p.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return { previous: photos[index - 1] ?? null, next: photos[index + 1] ?? null };
}
```

Run: `npm test`
Expected: PASS (30 files, 143 tests).

- [ ] **Step 3: Put the defaults in the root layout and use them on every page**

In `app/layout.tsx`, replace:

```ts
import { site } from "@/lib/site";
```

with:

```ts
import { OPEN_GRAPH_DEFAULTS, TWITTER_DEFAULTS } from "@/lib/metadata";
import { site } from "@/lib/site";
```

and replace:

```ts
  title: { default: site.title, template: `%s · ${site.title}` },
};
```

with:

```ts
  title: { default: site.title, template: `%s · ${site.title}` },
  // Pages that set their own openGraph/twitter use pageMetadata() to keep these.
  openGraph: { ...OPEN_GRAPH_DEFAULTS, title: site.title },
  twitter: { ...TWITTER_DEFAULTS, title: site.title },
};
```

In `app/[view]/life/page.tsx`, replace:

```ts
import { assertView } from "@/lib/view/params";

export const metadata: Metadata = { title: "Life" };
```

with:

```ts
import { pageMetadata } from "@/lib/metadata";
import { assertView } from "@/lib/view/params";

export const metadata: Metadata = pageMetadata("Life");
```

In `app/[view]/system/page.tsx`, replace:

```ts
import { formatDate } from "@/lib/format";
```

with:

```ts
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
```

and replace:

```ts
export const metadata: Metadata = {
  title: "System",
  robots: { index: false, follow: false },
};
```

with:

```ts
export const metadata: Metadata = pageMetadata("System", { robots: { index: false, follow: false } });
```

- [ ] **Step 4: Restyle the photo pages**

Replace `app/[view]/photos/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { PhotoGrid } from "@/components/photos/photo-grid";
import { PageHeader } from "@/components/shell/page-header";
import { getPhotos } from "@/lib/content/photos";
import { pageMetadata } from "@/lib/metadata";
import { assertView } from "@/lib/view/params";

export const metadata: Metadata = pageMetadata("Photos");

export default async function PhotosPage({ params }: PageProps<"/[view]/photos">) {
  const view = assertView((await params).view);
  const photos = await getPhotos();
  if (view === "dashboard") {
    return (
      <main>
        <PageHeader view="dashboard" title="Photos" meta={`${photos.length} photos`} />
        <div className="p-4 md:p-6">
          <PhotoGrid photos={photos} view="dashboard" />
        </div>
      </main>
    );
  }
  return (
    <main className="flex flex-col gap-12 pb-24">
      <PageHeader view="site" title="Photos" />
      <PhotoGrid photos={photos} view="site" />
    </main>
  );
}
```

Replace `app/[view]/photos/[slug]/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "@/components/picture";
import { PageHeader } from "@/components/shell/page-header";
import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";
import { type Photo, adjacentPhotos, getPhoto, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { getImage } from "@/lib/images/manifest";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import { assertView } from "@/lib/view/params";
import type { View } from "@/lib/view/views";

// The picture spans the content column: the 1200px site container, or the
// dashboard column beside the 240px sidebar (24px padding each side).
const SIZES: Record<View, string> = {
  site: "(min-width: 1248px) 1200px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)",
  dashboard: "(min-width: 768px) calc(100vw - 288px), calc(100vw - 32px)",
};

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
  return pageMetadata(photo.title, {
    description: photo.title,
    openGraph: { type: "article", description: photo.title, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  });
}

function Neighbour({ label, photo, align }: { label: string; photo: Photo | null; align: "left" | "right" }) {
  if (!photo) return <div />;
  return (
    <div className={align === "right" ? "flex flex-col items-end gap-1 text-right" : "flex flex-col gap-1"}>
      <MetaLabel>{label}</MetaLabel>
      <TextLink href={`/photos/${photo.slug}/`} className="type-sans-14">
        {photo.title}
      </TextLink>
    </div>
  );
}

export default async function PhotoPage({ params }: PageProps<"/[view]/photos/[slug]">) {
  const { view: viewParam, slug } = await params;
  const view = assertView(viewParam);
  const photos = await getPhotos();
  const photo = photos.find((p) => p.slug === slug);
  if (!photo) notFound();
  const { previous, next } = adjacentPhotos(photos, slug);
  const details = [formatDate(photo.date), photo.camera].filter(Boolean).join(" · ");

  const picture = <Picture image={photo.image} alt={photo.title} sizes={SIZES[view]} priority />;
  const neighbours = (
    <nav aria-label="More photos" className="grid grid-cols-2 gap-6 border-t pt-4">
      <Neighbour label="Previous" photo={previous} align="left" />
      <Neighbour label="Next" photo={next} align="right" />
    </nav>
  );

  if (view === "dashboard") {
    return (
      <main>
        <PageHeader view="dashboard" title={photo.title} meta={details} />
        <div className="flex flex-col gap-6 p-4 md:p-6">
          {picture}
          {neighbours}
        </div>
      </main>
    );
  }
  return (
    <main className="flex flex-col gap-8 pt-8 pb-24 md:pt-12">
      {picture}
      <div className="flex flex-col gap-3">
        <h1 className="type-display-40">{photo.title}</h1>
        <p className="type-mono-12 text-fg-muted">
          <time dateTime={photo.date}>{formatDate(photo.date)}</time>
          {photo.camera ? ` · ${photo.camera}` : null}
        </p>
      </div>
      {neighbours}
    </main>
  );
}
```

- [ ] **Step 5: Update the e2e spec**

Replace `e2e/photos.spec.ts` with:

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

test("photo pages emit an absolute JPEG og:image on top of the shared defaults", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://onursenture.com/images/photos/stabilo-2560.jpg",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Onur Senture");
});

test("photo pages link to the previous and next photo", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  const more = page.getByRole("navigation", { name: "More photos" });
  await expect(more.getByRole("link")).toHaveText(["Bold, Vakıf Building →", "Kızılcıklı →"]);
  await more.getByRole("link", { name: "Kızılcıklı" }).click();
  await expect(page).toHaveURL(/\/photos\/kizilcikli\/$/);
  // The oldest photo has no next.
  await expect(page.getByRole("navigation", { name: "More photos" }).getByRole("link")).toHaveCount(1);
});

test("the photos index links every photo with decorative thumbnails", async ({ page }) => {
  await page.goto("/photos/");
  await expect(page.locator('main a[href^="/photos/"]')).toHaveCount(5);
  await expect(page.locator('main img[alt=""]')).toHaveCount(5);
  await expect(page.locator("main picture source").first()).toHaveAttribute(
    "sizes",
    "(min-width: 1248px) 384px, (min-width: 768px) calc((100vw - 96px) / 3), calc((100vw - 48px) / 2)",
  );
});

test("the dashboard photos grid declares its own sizes", async ({ page }) => {
  await page.goto("/photos/?view=dashboard");
  await expect(page.locator("main picture source").first()).toHaveAttribute(
    "sizes",
    "(min-width: 768px) calc((100vw - 336px) / 4), calc((100vw - 48px) / 2)",
  );
});

test("pages without a photo share the defaults: site name, summary card, no image", async ({ page }) => {
  for (const [path, title] of [
    ["/", "Onur Senture"],
    ["/life/", "Life · Onur Senture"],
  ]) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Onur Senture");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary");
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  }
});
```

- [ ] **Step 6: Verify**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 30 files, 143 tests.
- `e2e`: 46 passed.
- `e2e:fixtures`: 4 passed.

- [ ] **Step 7: Visual check**

```bash
npm run screenshots -- .superpowers/screens/task-11 /photos/ /photos/stabilo/
```

Check that:
- **Grid:** the site grid has 3 columns and the dashboard grid 4, with 3:2 thumbnails and the titles below.
- **Detail page:** the photo spans the content width, then the title (display-40), the mono date · camera line, then "PREVIOUS / NEXT" with → links.

- [ ] **Step 8: Commit**

```bash
git add lib/metadata.ts lib/content/photos.ts app tests e2e/photos.spec.ts
git commit -m "Restyle photo pages and share Open Graph defaults

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: e2e coverage for theme × view, back/forward and invalid views; CI and docs

Closes the remaining S2 e2e gaps and records the S3 rules for later sprints. The new e2e tests cover:
- **Theme × view:** every combination renders the real pages with the right attributes and token colors.
- **Paint timing:** the theme is set before `<body>` exists.
- **Back/forward:** after a view toggle, history navigation shows the chosen view.
- **Invalid views:** an invalid `?view=` is ignored, sets no cookie and keeps the URL.

CI uploads Playwright traces when a run fails. `CLAUDE.md` gains a "Design system" section.

**Files:**
- Create: `e2e/matrix.spec.ts`
- Modify: `.github/workflows/ci.yml`, `CLAUDE.md`

**Interfaces:**
- Consumes: everything above. No new code interfaces.

- [ ] **Step 1: Add the matrix spec**

Create `e2e/matrix.spec.ts`:

```ts
import { expect, type Page, test } from "@playwright/test";

type Probe = { __themeAtBody?: string | null };

const BACKGROUND = { light: "rgb(255, 255, 255)", dark: "rgb(0, 0, 0)" };
const SURFACE = { light: "rgb(250, 250, 250)", dark: "rgb(10, 10, 10)" };

const viewButton = (page: Page, name: "Site" | "Dashboard") =>
  page.getByRole("group", { name: "View" }).getByRole("button", { name });

for (const view of ["site", "dashboard"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`every page renders in the ${view} view with the ${theme} theme`, async ({ page, context, baseURL }) => {
      await context.addCookies([
        { name: "view", value: view, url: baseURL! },
        { name: "theme", value: theme, url: baseURL! },
      ]);
      for (const path of ["/", "/life/", "/photos/", "/photos/stabilo/", "/system/"]) {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("[data-view]")).toHaveAttribute("data-view", view);
        await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
        expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(BACKGROUND[theme]);
      }
      if (view === "dashboard") {
        const sidebar = page.locator("aside").locator("..");
        expect(await sidebar.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(SURFACE[theme]);
      }
    });
  }
}

test("the theme is set before the body exists, so the first paint is right", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (!document.body) return;
      (window as unknown as Probe).__themeAtBody = document.documentElement.dataset.theme ?? null;
      observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto("/");
  expect(await page.evaluate(() => (window as unknown as Probe).__themeAtBody)).toBe("dark");
});

test("back and forward after a view toggle keep the chosen view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Life" }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  await viewButton(page, "Dashboard").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  // Next keeps earlier trees mounted but hidden; check the visible one.
  await expect(page.locator("[data-view]:visible")).toHaveAttribute("data-view", "dashboard");

  await page.goForward();
  await expect(page).toHaveURL(/\/life\/$/);
  await expect(page.locator("[data-view]:visible")).toHaveAttribute("data-view", "dashboard");
});

test("an invalid ?view= is ignored: default view, no cookie, URL kept", async ({ page, context }) => {
  await page.goto("/?view=admin");
  await expect(page).toHaveURL(/\/\?view=admin$/);
  await expect(page.locator("[data-view]")).toHaveAttribute("data-view", "site");
  expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("view");
});
```

Run: `npm run build && npx playwright test e2e/matrix.spec.ts`
Expected: 7 passed.

- [ ] **Step 2: Upload traces from failed CI runs**

In `.github/workflows/ci.yml`, replace:

```yaml
      - run: SOURCE_FIXTURES=1 npm run build
      - run: npm run e2e:fixtures
```

with:

```yaml
      - run: SOURCE_FIXTURES=1 npm run build
      - run: npm run e2e:fixtures
      # Traces of failed tests (retried once in CI, traced on the retry).
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-traces
          path: test-results/
          retention-days: 7
```

- [ ] **Step 3: Record the S3 rules in CLAUDE.md**

In `CLAUDE.md`, replace:

```bash
npm run db:generate    # drizzle-kit generate; db:migrate applies it (--force)
```

with:

```bash
npm run db:generate    # drizzle-kit generate; db:migrate applies it (--force)
npm run screenshots -- <dir> <path>...  # 1440 + 390, both views, both themes (build first)
```

and replace:

```markdown
## Sources and sync
```

with:

````markdown
## Design system (S3)

- Tokens live in `app/globals.css` (`@theme static`), named exactly as the Figma variables (`--color-bg`, `--color-fg-muted`, `--radius-control`, …). `tests/tokens.test.ts` pins them to the S1 values. Tailwind's default palette, text sizes, radii and shadows are cleared, so only token utilities exist: `bg-bg`, `text-fg-muted`, `border` (a `--color-line` rule), `rounded-control`.
- Type comes only from the Figma text-style classes: `type-display-{160,96,64,40}`, `type-sans-{28,20,16,14,13}` (plus `-medium`), `type-mono-{13,12,11}`.
- Square corners except form controls (`rounded-control`). No shadows. Monochrome; `--color-danger` only for errors.
- No icons. Glyphs only: `→` (every link, internal or external; never `↗`), `●` ok, `○` empty, `◐` late or partial, `×` close. Status glyphs go through `<StatusGlyph>`.
- Primitives are in `components/ui/`. `/system/` renders all of them (not in the nav, `noindex`); check it in both views and themes after UI changes.
- Shells are in `components/shell/`. The nav comes from `lib/nav.ts`: flip `ready` when a section ships.
- The view switch cross-fades the whole page through React `<ViewTransition>` (`ShellFade`: each shell's outer element shares the name `shell`) and the `view-switch` transition type that `ViewToggle` adds; reduced motion skips it.
- Unknown URLs 404 inside the shell (`app/[view]/[...missing]`). Under Cache Components these 404s are served as an error shell that React renders on the client, so the inline theme script never runs there; `ThemeToggle` re-applies the cookie, and `ThemeSync` does the same on the root 404 (`app/not-found.tsx`).
- After a client navigation or a view switch, Next keeps the previous tree mounted but hidden. In e2e, prefer role locators (they skip hidden elements) or filter with `:visible`.
- Only confirmed facts go in `content/profile.ts`, `content/work-index.ts` and `content/lab-index.ts`.

## Sources and sync
````

- [ ] **Step 4: Verify (the full CI sequence)**

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected:
- Clean.
- Vitest: 30 files, 143 tests.
- `e2e`: 53 passed.
- `e2e:fixtures`: 4 passed.

Then run `npx playwright test --repeat-each 3`. It should stay green: 159 passed.

- [ ] **Step 5: Final visual pass for Onur's review**

```bash
SOURCE_FIXTURES=1 npm run build
SOURCE_FIXTURES=1 npm run screenshots -- .superpowers/screens/task-12 / /life/ /system/ /photos/stabilo/ /nope/
npm run build
```

Hand the folder to the reviewer. At sprint end, Onur reviews `/system/`, `/` and `/life/` on the Vercel preview, in both views and both themes.

- [ ] **Step 6: Commit**

```bash
git add e2e/matrix.spec.ts .github/workflows/ci.yml CLAUDE.md
git commit -m "Cover theme × view, back/forward and invalid views in e2e

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 13: Approved design tweaks — collapse empty index columns, numeric ratings

Onur approved two changes after the plan was verified. They land last, so Tasks 1–12 stay verbatim.

1. **Collapse empty index columns.** If no entry in a list has a value for a column (`years`, `role` in the work index; `year` in the Lab index), that column is not rendered at all: no empty grid track, no header. Titles then start in the first column. The column comes back on its own when any entry gets a value.
   - Apply this in the site-view index rows (`IndexRow` and its list) and in the dashboard `DataTable`s for Work and Lab, by filtering the column config.
   - Add a pure helper, `visibleColumns(entries, keys)`, in `lib/index-columns.ts`. It returns the keys that at least one entry has a non-empty value for. Unit-test it: none present, some present, all present.
2. **Numeric ratings instead of stars.** Neither Neue Haas Grotesk nor Fragment Mono has `★`, so star strings fall back to a small system glyph.
   - Wherever a rating is shown (the "Off the clock" film tile, the `/life` films and books bands, and the films and books dashboard tables), render the number in mono: `3.5` for `ratingValue`, and Goodreads `numRating` as `4`.
   - Unrated items show nothing.
   - Replace `lib/sources/stars.ts` and its usages with `lib/sources/rating.ts`, exporting `formatRating(value: number | null): string`. It returns `""` for null or 0, drops trailing `.0` (`4` → "4", `3.5` → "3.5"), and never invents stars. Update its tests accordingly, and delete `stars.ts` and its test.
   - `/system/` shows the numeric rating instead of stars.

3. **Index-row arrow at phone widths** (Task 8 review, inherited from Task 3). `components/ui/index-row.tsx` puts the `→` in a `col-span-1` cell of a 12-column grid. At 390px that cell is about 8px wide, so the glyph (about 20px) overhangs the 16px gutter by about 12px. Below about 344px it causes horizontal page scroll. Below `md`, give the arrow a content-sized track (for example `grid-cols-[minmax(0,1fr)_auto]`, with year and role spanning the row) or move it into the title cell. Acceptance: `scrollWidth === clientWidth` at 320px, and the `→` right edge stays inside the gutter at 390px. Add an e2e assertion for both.
4. **No-wrap fixes** (Task 8 review). In `components/home/meta-line.tsx`, add `whitespace-nowrap` to each segment span, so the line wraps between segments and never inside "OPEN TO ROLES". In `components/home/off-the-clock.tsx`, keep the Saved caption's reading time together ("13 min" must not break).

5. **Dashboard panel spans at tablet widths** (Task 9 review). `components/ui/panel.tsx` applies `span` from `md:`, but the dashboard already gives 240px to the sidebar. Between 768px and about 1300px the 8/4 pairs are too narrow: the Status rows wrap and spill, and Sources clips its columns. Apply spans from the lowest breakpoint at which every 4-column panel fits its content, and stack panels full width below it. Expect `xl:` or a custom `min-[1360px]:`. 1440px must keep the 8/4 layout. Acceptance: at 768, 1024, 1280 and 1440px, no panel content wraps out of its panel or is clipped, on `/` and `/life/` in the dashboard view. DataTable sideways scroll below `md` is still allowed. Record the widths you checked in the report.
6. **Honest stat tiles** (Onur, 2026-10-03). The dashboard home `StatRow` shows exactly two tiles: "Contributions · 12 mo" (GitHub `totalContributions`) and "Reading now" (the Goodreads currently-reading count). Drop the "Films synced" tile, because the feed is capped at 6 and would always read 6. Drop "Books", because reading plus the last 5 read isn't a library total. `profile.metrics` entries are still appended when present. Anywhere else a contributions figure appears, its label must name the period ("12 mo" or "last year"). That includes the `/life` GitHub band, and the dashboard GitHub panel's three tiles in `components/sections/github/index.tsx`: "Contributions · 12 mo", "Active days · 12 mo" and "Longest streak · 12 mo". All three are windowed, so a streak that crosses the window start is truncated. When GitHub has no data (no weeks), hide those tiles instead of showing 0. Update the unit and e2e assertions on these tiles, including the exact `dt` assertion in `e2e-fixtures/life.spec.ts`.
7. **Lab table without a Status column** (Onur, 2026-10-03). The dashboard `LabPanel` `DataTable` drops its Status column. The status glyph in the Project cell already carries it, with its "in progress" / "live" aria-label. The remaining columns are Project, Description and Year, and Year collapses through `visibleColumns` when empty.
8. **Lock the home → `/life` fragments** (Task 10 review). Add an e2e test asserting that `/life/#books`, `#films`, `#photos` and `#articles` each resolve to exactly one element, in both views. The home "Off the clock" tiles link there.

**Files:** Modify `components/ui/index-row.tsx`, `components/ui/panel.tsx`, `components/home/meta-line.tsx`, `components/home/off-the-clock.tsx`, `components/home/home-dashboard.tsx`, `components/home/lab-index.tsx`, `components/sections/github/index.tsx`. Create `lib/index-columns.ts`, `lib/sources/rating.ts`, `tests/index-columns.test.ts`, `tests/sources/rating.test.ts`. Delete `lib/sources/stars.ts` and its test. Modify the index/table components and the pages from Tasks 3, 8, 9 and 10 that render these.

- [ ] **Step 1:** Write the failing unit tests for `visibleColumns` and `formatRating`. Run `npm test` and expect FAIL.
- [ ] **Step 2:** Implement both helpers. Run `npm test` and expect PASS.
- [ ] **Step 3:** Wire both helpers into the components and pages. Remove `stars.ts` and every usage. `grep -rn "★" app components lib` must return nothing; fixtures may still contain ★.
- [ ] **Step 4:** Update any e2e assertions that expected stars, or that expected an empty year column, so they assert the numeric rating and the collapsed columns.
- [ ] **Step 5:** Verify with `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e`, then `SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures`, then a plain `npm run build`. The e2e counts stay 53 / 4 unless you added assertions, in which case report the new counts.
- [ ] **Step 6:** Visual check. Run `npm run screenshots` for home and `/life` in both views and both themes. Confirm that work-index titles start in the first column and that ratings render as mono numbers.
- [ ] **Step 7:** Commit with "Collapse empty index columns and show ratings as numbers", then a blank line, then the trailer.

---

## Out of scope (later sprints)

- Case studies, years/roles/eras in the work index, the career Gantt panel, and era-stamp content: S4.
- `/lab` (the Lab band gets "All →" then): S5.
- Resume, the booking embed and `profile.bookingUrl`: S6.
- Admin, notes and error details in the Sources panel: S7.
- Instapaper card redesign and theatre: S8.
- Changelog and the paddle effect in `data-slot="paddle"`: S9.

## Self-review against the spec

- **§1 Tokens, theme and fonts:**
  - Tokens, dark redefinition and the no-JS fallback: Task 1.
  - Type classes (named after Figma, see Deviation 1), `tabular-nums` on `body`, the Adobe kit with preconnects, Fragment Mono via `next/font`, `--radius-control` only, no shadows and the drift guard: Task 1.
- **§2 Primitives:**
  - `MetaLabel`, `EraStamp`, `StatusGlyph`/`Chip`, `Button`, `TextLink`, `Toggle` and `RelativeTime`: Task 2.
  - `Band`, `IndexRow`, `Cover`, `Stat`, `Panel` and `DataTable`: Task 3.
  - `Empty` restyled: Task 2. `/system/`: Task 3; noindex and not in the nav.
- **§3 Shells, toggles, transition:**
  - Nav config, site shell, dashboard shell (sidebar, toggles, sync line) and the mobile dialogs: Task 5.
  - Cookies centralized, regex anchored and `aria-pressed`: Task 4.
  - Transition: Task 6.
  - 404 inside the shell: Task 7.
- **§4 Pages and data:**
  - `profile.ts`: Task 5.
  - `work-index.ts`, `lab-index.ts`, the live clock (Task 2) and the site home: Task 8.
  - Dashboard home with Activity, Status, Lab and Sources: Task 9.
  - `/life` both views and stars from `ratingValue`: Tasks 8 and 10.
  - Photos with previous/next, `sizes` and `alt=""`: Tasks 10 and 11.
  - OG defaults: Task 11.
  - The currently-reading fixture: Task 8.
- **Testing:**
  - Vitest: drift guard (1), activity (9), health (5), stars (8), cookies (4).
  - Playwright:
    - Home in both views: Tasks 8 and 9.
    - `/system/`: Task 3.
    - Theme × view, back/forward and invalid `?view=`: Task 12.
    - 404 in both views: Task 7.
    - Mobile menu: Task 5.
    - Reduced motion: Task 6.
  - e2e:fixtures: the four-tile strip (8), `/life` rows (10), Activity and Sources (9).
