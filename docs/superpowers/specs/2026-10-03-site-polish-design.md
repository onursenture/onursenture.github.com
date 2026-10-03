# Site polish (part 1 of 2) — design

Onur, 2026-10-03, on the `sprint-5` preview. This is part 1, a set of concrete fixes to the shell, the home page and Life. Part 2 is a separate brainstorm and spec. It covers the home page's "Selected work", which will be separate from the experience-linked work pages, the experience presentation, and simpler case study pages rebuilt from scratch.

Part 1 lands on branch `sprint-5` (PR #27), so Onur reviews one preview. Nothing here touches `/work/**` beyond what the shell changes imply.

## 1. Theme: light only

- The Work side is light only. Remove the Light / Dark / Auto selector (`components/theme-toggle.tsx`), the theme script and `data-theme`, the `[data-theme="dark"]` palette and the `prefers-color-scheme: dark` fallback in `app/globals.css`.
- The `dark:` variant keeps working for the Life side (`data-side="life"`). The Life palette stays as it is.
- The media viewer keeps its dark Life palette.
- `color-scheme` is `light` on the Work side and `dark` on Life.
- Remove every test, the `/system` specimen and any doc text about the theme toggle, and add a test that no theme control renders.

## 2. Header

- Remove the nav (`Work`), but keep `NAV_ITEMS` as data. Set every item to `ready: false` until Lab or Resume ships. While there are no ready items, the header renders no nav and no mobile "Menu" button.
- The Life switch moves from the top-right to the top-left, directly after the name (`ONUR SENTURE  Life ◯`). The Life side renders it in the same position, so it does not move when you switch sides.
- The right side of the header is empty while there is no nav.

## 3. Home

**Order:** identity (bio), Lab, Work, Experience, Contributions.

- **Bio:** no first-line indent on its paragraphs.
- **Lab:**
  - Delete the placeholder entries ("Project 02" and "Project 03") and the `placeholder` field.
  - Remove the dither avatar thumbnails. If `LabAvatar` is then unused, delete it.
  - Rows are text only: title, description, year and status glyph. The title links when there is an `href`.
  - The section shows whatever real entries exist (today, one: onursenture.com).
- **Contributions** (renamed from "Latest work"):
  - Replace the dither chart with the GitHub contribution heatmap: the existing `components/sections/github/heatmap.tsx`, or a shared extraction of it.
  - The heatmap uses GitHub's own greens. Level 0 is `#ebedf0`, then `#9be9a8`, `#40c463`, `#30a14e` and `#216e39`. These are the only colours on the Work side outside the palette, and that is deliberate: the audience recognises them.
  - Keep the "N contributions in the last 12 months" line and the GitHub action link.
  - Keep the empty state, for when the source has no data.
- **Work tiles and the Experience tree:** unchanged here. Part 2 replaces them.

## 4. Life

- **Now block:**
  - Not centred any more. It sits in the same grid as the home identity row, with the same label column and content column and the same left edge, so switching sides keeps the content in place.
  - The avatar is Onur's illustration, a 96px square, full colour. Its source is `images-src/avatar.webp`, run through the image pipeline, or a static optimised file.
  - It replaces `DitherPortrait`. Delete the dither portrait code if it is then unused.
- **Readout:**
  - The reading line lists every book currently being read: `reading: Title, Title, Title`. It is one line, truncated with an ellipsis when it overflows, with the full list in the line's accessible text.
  - The other lines are unchanged.
- **Ratings:** removed everywhere on Life: film and book items, and the readout ("last watched: Love & Other Drugs 3.5" becomes "last watched: Love & Other Drugs"). Parsers may keep the rating in data. Nothing renders it.
- **Books:** the "Reading" group lists all currently-reading books, not one.
- **Smaller images:**
  - Film posters and book covers become a compact grid: 4 per row on mobile and 10 per row from md.
  - Each cover is at its natural aspect, with a one-line truncated caption under it: the title, then the year or the author in muted text.
  - The photo grid uses the same compact density.
  - `sizes` is updated to match, so the browser fetches small renditions.

## Testing

- Unit and UI tests: update the tests for the header, Lab, the readout, books, films and the heatmap colours.
- Home e2e: section order, the Contributions label and the heatmap.
- Life e2e: the switch stays in the same position on both sides; check its bounding box. The Now block's left edge matches the home bio's left edge at 1440.
- Fixture e2e: several currently-reading books in the fixture, so the readout and Books show more than one.
- Screenshots at 1440 and 390 of `/` and `/life/`, inspected.

## Out of scope (part 2)

Home "Selected work", the experience presentation (replacing the tree), the `/work/` index, and the case study pages.
