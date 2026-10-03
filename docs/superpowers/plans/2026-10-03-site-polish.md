# Site Polish (part 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Onur's 2026-10-03 polish round:
- a light-only Work side;
- the Life switch next to the name;
- a reordered home with text-only Lab rows and a green GitHub heatmap;
- a left-aligned Life "Now" block with his illustrated avatar;
- no ratings;
- every book he is currently reading;
- compact cover and photo grids.

**Architecture:** Every change is to existing components in the Next.js 16 App Router site. The approach is to remove code paths rather than add new ones:
- The theme machinery, the dither chart, the Lab avatars and the dither portrait go away.
- The existing `Heatmap` moves to home.
- The Life "Now" block reuses the home grid's column widths.

**Tech Stack:** Next.js 16.3.8 (App Router, `cacheComponents`), React 19, Tailwind 4 (token utilities only), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-03-site-polish-design.md`

## Global Constraints

- **Branch and tests:** work on branch `sprint-5` (worktree `/Users/w00f/Documents/GitHub/onursenture.github.com-sprint-5`). Run every check before each commit:
  - `npm run typecheck`
  - `npm run lint`
  - `npx vitest run`
  - `npm run build`
  - `npx playwright test`
  - for Task 4 also: `SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures`, then a plain `npm run build` again.
- **Styling:** use Tailwind token utilities only (`bg-bg`, `text-fg`, `text-fg-muted`, `border-line`…) and the six type classes (`type-name`, `type-lead`, `type-body`, `type-meta`, `type-label`, `type-boot`).
  - The only exception is the five GitHub greens in Task 2, which are hex values used on purpose.
- **Themes:** the Work side is light only. The Life side (`data-side="life"`) keeps its dark palette exactly as it is today, and so does the media viewer.
- **Sources:** external sources fail soft. Every section keeps its empty state.
- **Commits:** end every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Don't push.
- **Dead code:** delete code the change leaves unused, along with its tests and its `/system` specimens. Do not leave dead exports.
- **Docs:** update `CLAUDE.md` wherever it describes something you change (theme, header, home order, Lab, Life).

---

### Task 1: Light-only Work side and the header

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `app/not-found.tsx`
- Modify: `components/shell/work-shell.tsx`
- Modify: `components/shell/life-shell.tsx`
- Modify: `lib/nav.ts`
- Modify: `app/(work)/system/page.tsx`
- Modify: `CLAUDE.md`
- Delete: `components/theme-toggle.tsx`, `components/shell/shell-controls.tsx`, `lib/theme/theme.ts`, `lib/theme/cookies.ts`
  - Delete `menu-dialog.tsx` and `nav-links.tsx` only if nothing else uses them. Keep them if the header still renders them when items are ready (see Step 3).
- Tests:
  - Delete or rewrite `e2e/theme.spec.ts` and `tests/cookies.test.ts`.
  - Update `e2e/shell.spec.ts`, `e2e/life-switch.spec.ts`, `e2e/not-found.spec.ts` and `e2e/tokens.spec.ts` where they touch the theme or the nav.

**Interfaces:**
- Produces: `WorkShell` and `LifeShell` render `<header>` with the name link immediately followed by `<LifeSwitch />`, inside one left group.

- [ ] **Step 1: Write the failing e2e checks.** In `e2e/shell.spec.ts`:

```ts
test("the Work side has no theme control, no nav and no menu button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("theme-toggle")).toHaveCount(0);
  await expect(page.locator("header nav")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /menu/i })).toHaveCount(0);
});

test("the Work side is light even when the OS prefers dark", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/");
  const bg = await page.evaluate(() => getComputedStyle(document.body.firstElementChild!).backgroundColor);
  expect(bg).toBe("rgb(250, 250, 248)"); // --color-bg #FAFAF8
  await context.close();
});
```

  In `e2e/life-switch.spec.ts`, add a check that the switch sits right after the name, in the same place on both sides:

```ts
test("the Life switch sits next to the name, in the same place on both sides", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const work = await page.getByRole("switch", { name: /life/i }).boundingBox();
  await page.goto("/life/");
  const life = await page.getByRole("switch", { name: /life/i }).boundingBox();
  expect(work && life).toBeTruthy();
  expect(Math.abs(work!.x - life!.x)).toBeLessThan(1);
  expect(Math.abs(work!.y - life!.y)).toBeLessThan(1);
  expect(work!.x).toBeLessThan(720); // left half, next to the name
});
```

  Check the switch's real role and name in `components/life-switch.tsx` first. If it is not `role="switch"` with a "Life" name, use the locator the existing life-switch specs use.

- [ ] **Step 2: Run** `npm run build && npx playwright test e2e/shell.spec.ts e2e/life-switch.spec.ts`. Expected: the new tests FAIL.

- [ ] **Step 3: Header.**
  - In `lib/nav.ts`, set `Work` to `ready: false`. Update the comment: "No item is ready until Lab or Resume ships; the header then shows no nav."
  - In `work-shell.tsx`:
    - Render `<div className="flex items-center gap-4">{name}<LifeSwitch on={false} /></div>` on the left.
    - When `readyItems().length > 0`, render the nav on the right: the desktop `NavLinks`, plus the mobile `MenuDialog` with `NavLinks` only. When the list is empty, render nothing on the right, so there is no Menu button.
    - Remove `ThemeToggle` and `ShellControls`.
  - In `life-shell.tsx`, use the same left group: name link, then `<LifeSwitch on />`.
  - Update both shells' comments.

- [ ] **Step 4: Light only.**
  - In `app/globals.css`:
    - Change the custom variant to `@custom-variant dark (&:where([data-side="life"], [data-side="life"] *));` and reword its comment, since the Life side is the only dark context.
    - Change the `[data-theme="dark"], [data-side="life"]` selector to `[data-side="life"]` only.
    - Delete the whole `@media (prefers-color-scheme: dark)` block.
  - In `app/layout.tsx`, remove the `themeScript` `<script>`, the `lib/theme` import and the comment about `data-theme`. Keep `suppressHydrationWarning` only if something else still needs it: `SideSync` sets `html[data-side]` after hydration, so check and keep it if that is why.
  - In `app/not-found.tsx`, remove `ThemeSync`.
  - Delete `components/theme-toggle.tsx`, `components/shell/shell-controls.tsx` and `lib/theme/*`, and remove their tests.
  - The `Toggle` UI primitive stays if `/system` or anything else still uses it. Otherwise delete it too.
  - In `app/(work)/system/page.tsx`, remove the ThemeToggle specimen and any dark-mode preview. The page's dark specimens may stay only if they render under `data-side="life"`.
  - Update `e2e/system.spec.ts` if it lists specimen names.

- [ ] **Step 5: Run every check** (Global Constraints). Expected: all PASS, including the new tests. Fix the older e2e specs that asserted the theme toggle or the `Work` nav link.

- [ ] **Step 6: Update `CLAUDE.md`.** Remove the theme-toggle and cookie text, and describe the header: name plus Life switch on the left, nav only once an item is ready.

- [ ] **Step 7: Commit.**

```bash
git add -A app components lib tests e2e CLAUDE.md
git commit -m "Make the Work side light only and move the Life switch next to the name

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Home order, bio, Lab and Contributions

**Files:**
- Modify: `components/home/home-site.tsx`
- Modify: `components/home/bio.tsx`
- Modify: `components/home/lab-grid.tsx`
- Modify: `components/home/contributions-row.tsx`
- Modify: `components/sections/github/heatmap.tsx`
- Modify: `content/lab-index.ts`
- Modify: `app/(work)/system/page.tsx`
- Modify: `CLAUDE.md`
- Delete if unused afterwards:
  - `components/ui/contribution-chart.tsx`, `lib/sources/weekly.ts`, `tests/weekly.test.ts`;
  - `components/sections/github/index.tsx`, if no Life section or page uses the `github` section definition (check with grep).
- Tests: `tests/ui/home.test.tsx`, `e2e/home.spec.ts` (or the spec that covers the home rows).

**Interfaces:**
- Consumes: `Heatmap({ data }: { data: Contributions })` from `components/sections/github/heatmap.tsx`. You may move it to `components/ui/heatmap.tsx` if the github section is deleted; update its imports.

- [ ] **Step 1: Write the failing tests.**
  - In `tests/ui/home.test.tsx`:

```tsx
describe("Bio", () => {
  it("has no first-line indent", () => {
    const markup = html(<Bio paragraphs={[["Hello."]]} />);
    expect(markup).not.toContain("indent-[3ch]");
  });
});

describe("LabGrid", () => {
  it("renders text rows without avatars", () => {
    const markup = html(
      <LabGrid entries={[{ title: "onursenture.com", description: "This site.", year: "2026", status: "wip", href: "https://github.com/onursenture/onursenture.github.com" }]} />,
    );
    expect(markup).toContain("onursenture.com");
    expect(markup).toContain("This site.");
    expect(markup).toContain("2026");
    expect(markup).not.toContain("<canvas");
    expect(markup).not.toContain("data-lab-avatar");
  });
});
```

  - Check `LabAvatar`'s actual markup. If it renders neither a `<canvas>` nor a `data-lab-avatar` attribute, assert on whatever identifies it.
  - Add a content test: `labIndex.every((entry) => !("placeholder" in entry))`, and no entry titled `Project 0N`.
  - Add a heatmap test:

```tsx
import { Heatmap } from "@/components/sections/github/heatmap"; // or its new path

it("colours the heatmap with GitHub's greens", () => {
  const data = { total: 3, weeks: [{ days: [
    { date: "2026-09-27", count: 0, level: 0 },
    { date: "2026-09-28", count: 1, level: 1 },
    { date: "2026-09-29", count: 2, level: 2 },
    { date: "2026-09-30", count: 3, level: 3 },
    { date: "2026-10-01", count: 4, level: 4 },
  ] }] };
  const markup = html(<Heatmap data={data} />);
  for (const hex of ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"]) expect(markup).toContain(hex);
});
```

  Match `data` to the real `Contributions` type in `lib/sources/github.ts`.
  - In the home e2e, the section headings in order are: the identity row (h1), then "Lab", "Work", "Experience" and "Contributions". "Latest work" does not appear.

- [ ] **Step 2: Run** `npx vitest run tests/ui/home.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **Bio:** remove `indent-[3ch]` and the org span's `indent-0`, and update the comment.
  - **`content/lab-index.ts`:** delete the two placeholder entries and the `placeholder` field and its comment.
  - **`LabGrid`:** render a single-column list of text rows, with no `LabAvatar`. Each row is `[status glyph] title ↗ · year` on one line, with the description under it in `type-meta text-fg-muted`. Use `<ul className="flex flex-col gap-4">`. Keep the "hidden while empty" behaviour.
  - **`HomeSite`:**
    - Row order: identity, lab, work, experience, contributions.
    - The contributions row's `label` is `"Contributions"`, its id is `contributions`, and its action remains the GitHub link.
  - **`Contributions`:** render `<Heatmap data={data} />` under the "N contributions in the last 12 months" line, instead of `ContributionChart`.
  - **`Heatmap` levels:**

```ts
// GitHub's own contribution greens (levels 0–4). The only colours on the Work
// side outside the palette, on purpose: the audience knows them (Onur 2026-10-03).
const LEVELS = ["bg-[#ebedf0]", "bg-[#9be9a8]", "bg-[#40c463]", "bg-[#30a14e]", "bg-[#216e39]"];
```

  - **Unused code:**
    - If `ContributionChart`, `weeklyTotals` and the `github` section definition are unused, delete them, their tests and their `/system` specimens.
    - Keep `LabAvatar` for now: `DitherPortrait` still uses it, and Task 3 removes both. Remove only its Lab specimen if the `/system` page shows it as "Lab".

- [ ] **Step 4: Run every check.** Expected: PASS. Screenshot `/` at 1440 and 390 (`npm run screenshots -- /tmp/polish-2 /`) and look at the Lab rows and the heatmap.

- [ ] **Step 5: Update `CLAUDE.md`** with the home order, text-only Lab rows and the Contributions heatmap.

- [ ] **Step 6: Commit.**

```bash
git add -A components content app tests e2e lib CLAUDE.md
git commit -m "Reorder the home page, simplify Lab and show the GitHub heatmap under Contributions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Life "Now" block, avatar, reading line and no ratings

**Files:**
- Modify: `app/life/page.tsx`
- Modify: `lib/life/readout.ts`
- Modify: `components/sections/films/index.tsx`
- Modify: `components/sections/books/index.tsx`
- Modify: `scripts/images.ts`
- Create: `components/life/avatar.tsx`
- Delete: `components/life/dither-portrait.tsx`, `lib/images/portrait.json` (if only the portrait uses it), `components/ui/lab-avatar.tsx` (if then unused), and the portrait dither code in `scripts/images.ts`
- Source: `images-src/avatar.webp` (already committed; 1254×1254 illustration)
- Tests: `tests/life/readout.test.ts` (or wherever `buildReadout` is tested), `tests/ui/*` for films and books, and `e2e/life.spec.ts` or `e2e-fixtures/life.spec.ts`

**Interfaces:**
- Change `ReadoutInput.book` to `books?: Pick<Book, "title" | "link">[]`. `ReadoutInput.film` drops `ratingValue`.
- The reading line is `{ key: "books", label: "reading", value: "<title>, <title>, …" }`, with no `href` and no `detail`.

- [ ] **Step 1: Write the failing tests.**
  - Readout:

```ts
it("lists every book being read on one line, and no film rating", () => {
  const lines = buildReadout({
    film: { title: "Love & Other Drugs", link: "https://letterboxd.com/x" },
    books: [
      { title: "Book A", link: "https://goodreads.com/a" },
      { title: "Book B", link: "https://goodreads.com/b" },
      { title: "Book C", link: "https://goodreads.com/c" },
    ],
  });
  expect(lines.map(readoutText)).toEqual(["last watched: Love & Other Drugs", "reading: Book A, Book B, Book C"]);
});
```

  - Films and books: the rendered markup contains no `formatRating` output. With a `ratingValue` of `3.5`, the markup must not contain `3.5`.
  - Life e2e at 1440:

```ts
test("the Now block starts at the same left edge as the home bio", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const bio = await page.locator("#identity h1").boundingBox();
  await page.goto("/life/");
  const readout = await page.locator('section[aria-label="Now"] .type-boot').boundingBox();
  expect(Math.abs(bio!.x - readout!.x)).toBeLessThan(1);
});
```

- [ ] **Step 2: Run** the readout unit test. Expected: FAIL.

- [ ] **Step 3: Readout and ratings.**
  - In `lib/life/readout.ts`:
    - Drop `formatRating` and the film `detail`.
    - Replace the single book with `books`: when `books.length > 0`, push `{ key: "books", label: "reading", value: books.map((b) => b.title).join(", ") }`.
  - In `app/life/page.tsx`, pass `books: books.data.currentlyReading`.
  - In `components/life/boot-readout.tsx`, give each line `li` the class `truncate`. Keep the full text in the DOM; truncation is visual only. The typewriter's invisible sizing span must also be single-line, so add `whitespace-nowrap` to the `li` content wrapper. Check that typing still has no layout jump.
  - Films: remove the rating, so the meta line is the year only.
  - Books: remove the rating column from the Read list. Use `md:col-span-6` for the title and `md:col-span-6` for the author.
  - If `formatRating` is unused afterwards, delete `lib/sources/rating.ts` and its tests. Keep the rating fields in the parsers' data.

- [ ] **Step 4: The "Now" block grid.** Replace the centred section in `app/life/page.tsx` with the home grid's columns, so the readout's left edge matches the home content column:

```tsx
<section aria-label="Now" className="grid gap-4 px-4 py-8 md:px-10 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7 lg:py-[30px]">
  <Avatar />
  <BootReadout lines={lines} />
</section>
```

  These are the same values as `components/ui/section-row.tsx`. If you can, extract a shared `ROW_GRID` class string constant into `section-row.tsx` and use it in both places, so they cannot drift.

- [ ] **Step 5: Avatar.**
  - In `scripts/images.ts`:
    - Replace the 1-bit portrait step. When `images-src/avatar.webp` exists, write `public/images/avatar-192.webp` and `public/images/avatar-192.avif`: 192×192 with sharp, quality 80. 192px is the 2× rendition for 96px.
    - Write `lib/images/avatar.json` as `{ "webp": "/images/avatar-192.webp", "avif": "/images/avatar-192.avif", "size": 96 }`, or `null` when there is no source. This mirrors how `portrait.json` worked.
  - Run `npm run images` and commit the outputs.
  - Create `components/life/avatar.tsx`:

```tsx
import avatar from "@/lib/images/avatar.json";

// Onur's illustrated avatar (images-src/avatar.webp), 96px square, full colour.
export function Avatar() {
  const data = avatar as { webp: string; avif: string; size: number } | null;
  if (!data) return null;
  return (
    <picture>
      <source srcSet={data.avif} type="image/avif" />
      {/* eslint-disable-next-line @next/next/no-img-element -- one fixed 96px image */}
      <img src={data.webp} alt="" aria-hidden="true" width={96} height={96} className="size-24" />
    </picture>
  );
}
```

  - Delete `DitherPortrait`, the portrait script code, `portrait.json` and `public/images/portrait-dither.png` if present.
  - Delete `LabAvatar` if it is now unused, along with its `/system` specimen and tests.

- [ ] **Step 6: Run every check**, including the fixture build and `e2e:fixtures`, then rebuild plain. Update the fixture e2e expectations that included the rating (`"last watched: Love & Other Drugs 3.5"` → `"last watched: Love & Other Drugs"`) and the single reading line. Expected: PASS.

- [ ] **Step 7: Update `CLAUDE.md`** with the avatar source and pipeline, the readout's reading line and "no ratings rendered". Then commit.

```bash
git add -A app components lib scripts public images-src tests e2e e2e-fixtures CLAUDE.md
git commit -m "Align the Life Now block with home, add the illustrated avatar and drop ratings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Compact covers and photos on Life, every book being read

**Files:**
- Modify: `components/sections/films/index.tsx`
- Modify: `components/sections/books/index.tsx`
- Modify: `components/photos/photo-grid.tsx`
- Modify: `components/sections/photos/index.tsx`
- Modify: `components/ui/cover.tsx` (only the `width` default, if needed)
- Modify: the goodreads fixture in `tests/fixtures/` (several currently-reading books)
- Tests: `tests/ui/*` for films, books and the photo grid; `e2e-fixtures/life.spec.ts`

**Interfaces:**
- Produces: `COVER_GRID = "grid grid-cols-4 gap-x-3 gap-y-4 md:grid-cols-10 md:gap-x-4"`, exported from `components/ui/cover.tsx` and shared by films, books and Life photos.

- [ ] **Step 1: Write the failing tests.**
  - Films and books markup uses `md:grid-cols-10`, and each caption is one line (`truncate`).
  - Life photos use `PHOTO_GRID_ROW_SIZES` with the new compact density.
  - Fixture: give the goodreads fixture at least 4 currently-reading books. Add a fixture e2e asserting that the Books "Reading" list has as many items as the fixture's currently-reading books, and that the readout's reading line names all of them.

- [ ] **Step 2: Run them.** Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **Films and books "Reading":** use `<ul className={COVER_GRID}>`. Each item is the `Cover`, then one truncated caption line: the title in `type-label text-fg` and, under it, the year (films) or the author (books) in `type-label text-fg-muted truncate`. Use `type-label`, which is smaller than `type-body`, and pass `Cover width={96}`.
  - **Books "Reading":** it already maps `currentlyReading`, so it shows every book. Confirm that no `.slice(0, 1)` or similar exists anywhere in the chain (parser, `readSource`, page).
  - **The `/life/` photos row:** it uses `COVER_GRID`-like density, 4 per row on mobile and 10 from md, with `aspect-[3/2]` thumbnails and a truncated `type-label` title.
    - Add a `density?: "default" | "compact"` prop to `PhotoGrid`. `compact` uses `grid grid-cols-4 gap-x-3 gap-y-4 md:grid-cols-10 md:gap-x-4`.
    - Add `PHOTO_GRID_COMPACT_SIZES = "(min-width: 1024px) calc((100vw - 356px - 9 * 16px) / 10), (min-width: 768px) calc((100vw - 80px - 9 * 16px) / 10), calc((100vw - 32px - 3 * 12px) / 4)"`.
    - Check the `/life/` photos section's row type (it is `wide`) and adjust the 356px if the row is not wide.
    - The `/life/photos/` page keeps the default density.

- [ ] **Step 4: Run every check**, including the fixture build and `e2e:fixtures`, then rebuild plain. Screenshot `/life/` at 1440 and 390 with fixtures (`SOURCE_FIXTURES=1 npm run build && npm run screenshots -- /tmp/polish-4 /life/`), look at it, then rebuild plain. Expected: PASS, and covers are small.

- [ ] **Step 5: Update `CLAUDE.md`** wherever it describes the Life sections. Then commit.

```bash
git add -A components tests e2e-fixtures CLAUDE.md
git commit -m "Make Life covers and photos compact and list every book being read

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Verification and push (controller)

- [ ] Run every check on the final branch, including the fixture pass, and finish with a plain build.
- [ ] Look at `/`, `/life/` and `/work/primeone/` at 1440 and 390 in the in-app browser. Check the switch position on both sides and the Now block's left edge against the bio.
- [ ] Add the part 1 items to the "Before merge" list in `docs/superpowers/plans/2026-10-03-sprint-5-followups.md`, plus a "Part 2" note: Selected work, experience presentation and case study rethink, brainstorm next.
- [ ] Push `sprint-5` (PR #27). Report to Onur.
