# Work Rethink (part 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Sprint 5 release-log case studies with block-based product pages, swap the home's Work tiles for "Selected work" (images pinned from those pages), and restyle Experience as product rows.

**Architecture:**
- `content/work/<slug>.ts` holds one typed `ProductPage` per product. Each page has a header and ordered blocks: `text`, `images` and `icons`.
- `lib/work/` is the only reader of that content. It exposes `getProductPage`, `getProductSlugs`, `getPins`, `pageImages` and `validateWork`.
- The product page renders on the shared `ROW_GRID` and keeps the `?fig=` viewer.
- The home's Selected work reads `getPins()`.
- The release log, posts, Archive, `/work/` index and Figma path are deleted.

**Tech Stack:** Next.js 16.3.8 (App Router, `cacheComponents`, `trailingSlash`), React 19, Tailwind 4 (token utilities only), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-03-work-rethink-design.md`. It is binding, so read it in full before starting. The mockups are in `.superpowers/brainstorm/23460-1791055492/content/`: `experience.html`, `selected-work-v2.html` (option B) and `product-page.html` (option A).

## Global Constraints

- **Workspace:** the `sprint-5` branch in the worktree `/Users/w00f/Documents/GitHub/onursenture.github.com-sprint-5`.
- **Checks before each commit:**
  - `npm run typecheck`
  - `npm run lint`
  - `npx vitest run`
  - `npm run build`
  - `npx playwright test`
  - `SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures`, then a plain `npm run build` last
- **Styling:** token utilities only (`bg-bg`, `text-fg`, `text-fg-muted`, `text-fg-soft`, `border-line`, `text-accent`…) and the six type classes (`type-name`, `type-lead`, `type-body`, `type-meta`, `type-label`, `type-boot`). Rows use `ROW_GRID` / `SectionRow` from `components/ui/section-row.tsx`, with a `DitherRule` between rows.
- **External links:** none on `/work/**` or in the home's work rows, except x.com/w00f status posts (there are none now).
- **No invented facts:** copy reuses the current content's `lead`, `intro` and `facts`. Every number must be literally true.
- **Images:** all 16:10. Placeholders are the faint `PlaceholderWash` with a FIG label.
- **Server rendering:** the server renders every page in its default state. `?fig=` is read on the client after hydration, inside `<Suspense>`, to keep CDN caching.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push.
- **Dead code:** delete it together with its tests, `/system` specimens and docs. Keep `CLAUDE.md` accurate.

---

### Task 1: Block-based product pages, Selected work, and the removals

This is a single task because the old content types feed both the product pages and the home's Work tiles. Replacing the model forces both to change together.

**Files:**
- Rewrite: `content/work/types.ts`, `content/work/primeone.ts`, `content/work/primeblocks.ts`, `content/work/primeicons.ts`, `content/work/templates.ts`, `content/work/index.ts`
- Delete:
  - content: `content/work/archive.ts`, `content/work/posts/`, `content/work/settings.ts`, `content/work-index.ts`
  - Figma path: `lib/work/figma*.ts`, `scripts/figma.ts`, `figma.example.json`, and the `figma` script in `package.json`
  - lib: `lib/work/index-groups.ts`
  - components: every `components/work/*` file the new pages don't use (log-view, posts list, archive-log, archive-browser, work-table, case-study-header, study-body and study-browser if replaced, view state beyond `?fig=`)
  - home: `components/home/work-tiles.tsx`
  - pages: `app/(work)/work/page.tsx`, `app/(work)/work/archive/page.tsx`
- Rewrite: `lib/work/index.ts`, `lib/work/validate.ts`, and `lib/work/derive.ts` (only what the new pages need). `lib/work/url-state.ts` keeps `?fig=` only.
- Modify: `app/(work)/work/[slug]/page.tsx`, `components/work/media-viewer.tsx` (drop the Figma link and embed), `components/home/home-site.tsx`, `next.config.ts` (redirects), `app/(work)/system/page.tsx`, `CLAUDE.md`
- Create: `components/work/product-header.tsx`, `components/work/blocks.tsx` (the `TextBlock`, `ImagesBlock` and `IconsBlock` rows), `components/work/product-browser.tsx` (client: the viewer and `?fig=`), `components/home/selected-work.tsx`
- Tests: rewrite `tests/work/*`, `tests/content/work.test.ts`, `tests/ui/work.test.tsx`, `e2e/work-*.spec.ts` and the home e2e Work assertions. Delete the tests for deleted code.

**Interfaces:**
- **Produces** (`content/work/types.ts`), verbatim from spec §1:

```ts
import type { OrgId } from "../orgs";

export type WorkSlug = "primeone" | "primeblocks" | "primeicons" | "templates";

// Only designers are credited. href is kept as provenance and NOT rendered
// (no external links on /work/**).
export interface Credit { name: string; role?: string; href?: string }

// Pinned to the home's Selected work.
export interface Pin {
  // Display order on the home, unique across all pins.
  order: number;
  title: string;
  // One line of context.
  note: string;
}

export interface WorkImage {
  // Stable, kebab-case, unique within its page; keys the image file
  // (work/<slug>/<id>) and ?fig= URLs.
  id: string;
  caption?: string;
  credits?: Credit[];
  // Manifest key. Unset: lib/work finds work/<slug>/<id>, else a placeholder.
  image?: string;
  pin?: Pin;
}

export type Block =
  | { kind: "text"; id: string; heading: string; body: string[] }
  | { kind: "images"; id: string; heading?: string; columns?: 1 | 2 | 3; images: WorkImage[] }
  // PrimeIcons only: the live icon set.
  | { kind: "icons"; id: string; heading?: string };

export interface Fact { label: string; value: string }

export interface ProductPage {
  slug: WorkSlug;
  org: OrgId;
  title: string;
  kind: string;
  lead: { strong: string; rest: string };
  intro: string;
  facts: Fact[];
  blocks: Block[];
}
```

- **Produces** (`lib/work/index.ts`, server):

```ts
export function getProductSlugs(): WorkSlug[];
export function getProductPage(slug: string): ProductPageView | null;
export function getPins(): PinView[]; // sorted by pin.order
// PinView = { slug: WorkSlug; pageTitle: string; blockId: string; image: ImageView; pin: Pin }
// ImageView = WorkImage plus the resolved image (manifest entry or null) and a 1-based FIG number on its page
// ProductPageView = ProductPage with every images block's images resolved to ImageView, plus `images: ImageView[]` (pageImages, block order)
```

- **Consumes:** `validateWork(pages: ProductPage[]): string[]`. It returns error strings, and `lib/work/index.ts` throws on any of them at build time (keep the current pattern). The rules are spec §1's validation list.

- [ ] **Step 1: Write the failing unit tests.** In `tests/work/validate.test.ts`, write one test per rule:
  - duplicate block id
  - duplicate image id within a page
  - duplicate pin order across pages
  - `columns: 4`
  - `icons` block on a non-PrimeIcons page
  - empty `intro`
  - no blocks

  In `tests/work/pins.test.ts`, test that `getPins()` is ordered by `order`, that each pin carries its `slug` and `blockId`, and that `pageImages` follows block order. Use `ProductPage` fixtures written in the test files, not the real content.

- [ ] **Step 2: Run them.** `npx vitest run tests/work` fails, because the modules don't exist yet.

- [ ] **Step 3: Content model and data.**
  - Write `types.ts` as above.
  - Rewrite the four page files following spec §6:
    - Keep each page's current `lead`, and use its current intro as `intro` (joined into one paragraph).
    - `facts`: Role, Years, At (org name).
    - One `text` block (`id: "what-i-did"`, heading "What I did") of 2–3 sentences, built only from the current intro.
    - One `images` block (`id: "highlights"`, `columns: 3`) with three placeholder images and short captions.
    - Templates gets six images captioned Apollo, Diamond, Ultima, Verona, Atlantis and Genesis. Genesis carries `credits: [{ name: "Ümit Çelik" }]`.
    - PrimeIcons adds `{ kind: "icons", id: "icon-set", heading: "Icon set" }` after the images block.
    - Pin the first image of each `highlights` block, with orders 1–4 (PrimeOne, PrimeBlocks, PrimeIcons, Templates). Each pin gets a title and a one-line note from facts already in the content.
  - `content/work/index.ts` exports `productPages: ProductPage[]` in that order.
  - Delete `archive.ts`, `posts/`, `settings.ts` and `content/work-index.ts`.

- [ ] **Step 4: lib/work.**
  - Rewrite `index.ts` (the API above), `validate.ts` and the needed parts of `derive.ts`.
  - Image resolution follows the current approach: the manifest key `work/<slug>/<id>`, or a placeholder.
  - Delete `index-groups.ts`, `figma*.ts`, `scripts/figma.ts`, `figma.example.json` and the `figma` npm script. `npm run images` must still handle `images-src/work/<slug>/*`.
  - Grep for anything else importing them.

- [ ] **Step 5: Run the unit tests.** Expected: PASS.

- [ ] **Step 6: Product page.** In `app/(work)/work/[slug]/page.tsx`:
  - Use `generateStaticParams` from `getProductSlugs()`, and `notFound()` for unknown slugs.
  - Metadata: the title is the page title. The OG image is the first resolved real image, or none.
  - Render `<ProductHeader>`, then each block as a row with a `DitherRule` between rows, inside `<ProductBrowser>`. ProductBrowser is the client wrapper that owns the `MediaViewer` and `?fig=` history; reuse the existing `useViewerHistory` and `use-view-state` code, reduced to `fig`.
  - The `<Suspense>` fallback is the same markup with no viewer. Spec §4 gives the layout exactly:
    - **header:** `← Home` in the label column; then the wide content with the `h1` lead, the intro and the facts list
    - **text:** heading in the label column, body in the 480px column, `type-body text-fg-soft`
    - **images:** heading in the label column; the wide grid at `columns` from md, with 3 as `md:grid-cols-2 lg:grid-cols-3`. Each figure is a button that opens the viewer, with the caption and "Design: Name" credit under it in `type-meta`. The row's `id` is the block id.
    - **icons:** the existing `IconGrid`, server-rendered, in a wide row
  - In `MediaViewer`, remove the Figma link and embed code and their settings import.

- [ ] **Step 7: Routes.**
  - In `next.config.ts`, add redirects `{ source: "/work", destination: "/", permanent: true }` and `{ source: "/work/archive", destination: "/", permanent: true }`. Check how `trailingSlash: true` matches, and test the real URLs `/work/` and `/work/archive/`.
  - Delete the two pages.

- [ ] **Step 8: Home Selected work.** In `components/home/selected-work.tsx`:
  - Render `getPins()` as spec §3: a `SectionRow id="selected-work" label="Selected work" wide` with no action.
  - The grid is `grid gap-4 md:grid-cols-2 lg:grid-cols-3`.
  - Each item is:
    - a 16:10 frame (the `Picture` with correct `sizes`, or the `PlaceholderWash` with a FIG label);
    - the title (`type-body`);
    - the note (`type-meta text-fg-muted truncate`);
    - `TextLink` "<pageTitle>" to `/work/<slug>/#<blockId>`.
  - The frame also links there.
  - Hidden when there are no pins.
  - `sizes`: `"(min-width: 1024px) calc((100vw - 308px - 32px) / 3), (min-width: 768px) calc((100vw - 80px - 16px) / 2), calc(100vw - 32px)"`. Verify it against the wide row the same way the Life photo row was verified, with an e2e measurement at 1440.
  - In `home-site.tsx`, replace the Work row with this row and remove `WorkTiles`, `heroImageKey` and the `All work` action. The order is identity, Lab, Selected work, Experience, Contributions.

- [ ] **Step 9: E2E (spec §8).**
  - **Home:** the order. Selected work has 4 pins in order, each linking to `/work/<slug>/#highlights`.
  - **Product page:**
    - the header, blocks and anchors render;
    - clicking an image puts `?fig=<id>` in the URL and opens the dialog, and Back closes it;
    - every `main a[href^="http"]` is an x.com/w00f status URL (there are none today);
    - PrimeIcons has its search, and the licence line is in the server HTML.
  - **Redirects:** `/work/` and `/work/archive/` land on `/`.
  - **Mobile:** at 390, Selected work has 1 column.
  - Rewrite or delete the old `e2e/work-*.spec.ts` tests about views, posts, the archive, coverage and Figma.

- [ ] **Step 10: Clean-up and docs.**
  - `grep -rn "Entry\b\|posts\|archive\|figma\|workIndex\|heroImageKey\|coverage" app components lib content tests e2e scripts` must find no stale live code.
  - Update the `/system` specimens.
  - Rewrite `CLAUDE.md`'s "Work (Sprint 5)" section for the new model (blocks, pins, images under `images-src/work/<slug>/`, the redirects, no Figma).
  - Remove the Figma docs.

- [ ] **Step 11: Run every check.** Take screenshots of `/` and `/work/primeone/` at 1440 and 390, and of `/work/primeicons/` and `/work/templates/` at 1440, and look at them. Then commit:

```bash
git add -A
git commit -m "Rebuild the work pages as blocks and pin images to Selected work

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Experience as product rows

**Files:**
- Modify: `components/home/experience-tree.tsx`. Rename it to `components/home/experience-list.tsx` (export `ExperienceList`) and update its imports.
- Modify: `CLAUDE.md` (drop `├─` and `└─` from the glyph list; describe the rows), `app/(work)/system/page.tsx` if it has a specimen
- Tests: `tests/ui/home.test.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `experience` / `ExperienceEntry` / `ExperienceChild` from `content/experience.ts` (unchanged), `formatSpan`, `OrgMark` and `ORGS`.

- [ ] **Step 1: Write the failing tests.**

```tsx
describe("ExperienceList", () => {
  it("renders each role's products as rows, linked only when they have a page, with no tree glyphs", () => {
    const markup = html(
      <ExperienceList
        entries={[
          { org: "primetek", role: "Design lead", start: "2016-05", end: "2026-04", children: [
            { title: "PrimeOne", note: "design system", href: "/work/primeone/" },
            { title: "Nebuu", note: "word game, iOS" },
          ] },
          { org: "etiya", role: "Design specialist", start: "2014-04", end: "2016-03", children: [] },
        ]}
      />,
    );
    expect(markup).toContain('href="/work/primeone/"');
    expect(markup).toContain("Nebuu");
    expect(markup.match(/<a /g)).toHaveLength(1);
    expect(markup).not.toMatch(/[├└]/);
    expect(markup).toContain("May 2016–Apr 2026");
  });
});
```

  - Home e2e: in `#experience`, PrimeTek's four products are links, Nebuu is plain text, and the row text contains no `├` or `└`.

- [ ] **Step 2: Run them.** Expected: FAIL.

- [ ] **Step 3: Implement** spec §3 "Experience row":
  - **Role header line:** `OrgMark`, the org name (`text-fg`), `· role` (`text-fg-muted`), and the span right-aligned (`type-meta text-fg-muted`), as one flex row.
  - **Children:** a `grid grid-cols-[minmax(0,140px)_1fr] gap-x-4` list.
  - **Each child:** a row with `border-t border-line py-1.5` and two cells. The first cell is the title: an `ItemLink` (internal) when there is an `href`, otherwise plain text. The second cell is the note in `text-fg-muted`.
  - **Spacing:** `mt-2` between the header and its rows, and `gap-6` between roles.

- [ ] **Step 4: Run every check.** Take screenshots of `/` at 1440 and 390 and look at them.

- [ ] **Step 5: Commit.**

```bash
git add -A components tests e2e app CLAUDE.md
git commit -m "Show experience as product rows instead of a tree

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Verification and push (controller)

- [ ] Run every check on the final branch, including the fixture pass. Finish with a plain build.
- [ ] Check `/`, `/work/primeone/`, `/work/primeicons/` and `/work/templates/` in the in-app browser at 1440 and 390.
- [ ] Update `docs/superpowers/plans/2026-10-03-sprint-5-followups.md`:
  - "Before merge": copy approval for the new product pages, and the images per page (block, columns, and which images to pin).
  - Delete the stale Sprint 5 items: release log, posts, archive, Figma and coverage.
- [ ] Push `sprint-5` and report to Onur.
