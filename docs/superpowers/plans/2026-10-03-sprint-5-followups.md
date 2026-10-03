# Sprint 5 Follow-ups

Branch `sprint-5` (PR #27) now holds Sprint 5 and the 2026-10-03 polish rounds:
- **Site polish part 1:** a light-only site, the Life switch next to the name, a new home order, text-only Lab, the Contributions heatmap, and Life's Now block, avatar, reading line, no ratings and compact covers.
- **Work rethink part 2:** Selected work pinned from block-based product pages, Experience as product rows, and the removal of the release log, posts, Archive, `/work/` index and Figma path.

The specs are `docs/superpowers/specs/2026-10-03-site-polish-design.md` and `2026-10-03-work-rethink-design.md`.

## Before merge (Onur, on the Vercel preview of `sprint-5`)

- **Copy approval for the product pages** (PrimeOne, PrimeBlocks, PrimeIcons, Templates): the lead, intro, "What I did", image captions, and pin titles and notes. All of it reuses facts that were already in the content. Points to look at:
  - The Apollo pin note describes the 2016 Apollo ("dark-concept template with a horizontal menu bar"). Change it if the image will be the 2022 Apollo.
  - PrimeOne's "What I did" repeats the intro almost word for word.
- **Images.**
  - **Format:** 16:10, 2560×1600 PNG or JPG, delivered into `images-src/work/<slug>/<image id>.png`.
  - **Per page, tell Claude:** the blocks (heading, a 1-, 2- or 3-column grid, captions) and which images to pin to Selected work, in what order. There are four placeholder pins today, which fill a 3-up row plus one orphan, so 3 or 6 pins fill full rows.
- **Life and home pass:** check the switch position, the Now block alignment, the avatar, the reading line and the compact covers.
- **CDN caching check.** The preview is behind Vercel Authentication, so add the bypass header:
  ```bash
  U=https://<preview>.vercel.app
  for p in / /work/primeone/ "/work/primeone/?fig=components" /life/; do for i in 1 2; do
    curl -sI -H "x-vercel-protection-bypass: $BYPASS" "$U$p" | grep -iE '^(cache-control|x-vercel-cache|age):'; echo; done; done
  ```
  The second request of each pair must be `HIT` or `STALE`.

## Sprint 6 (Work II: Orkestra and Lab)

- New product pages, decided by Onur from the Figma survey:
  - **PrimeStore 2025:** a full store redesign, 63 screens, "In Progress".
  - **PrimeDesigner:** a theme designer app, "On Hold".

  Both are framed as designed-but-unreleased work. Sakai Pro is skipped. The frames are listed in `.superpowers/research/figma-survey.md` in the main checkout, which is gitignored.
- A Nebuu page. The Experience row links it once the page exists.

## Sprint 7 (admin)

- Admin upload into placeholder images; the DB overlay merges in `lib/work/`.
- The `NavLinks` and `MenuDialog` branch of the header is untested until a nav item is ready again (Lab or Resume).

## Sprint 11 (polish)

- Easter egg: PrimeIcons 1.0 was drawn in Illustrator. The source is github.com/onursenture/primeicons-ai, and Onur may share screenshots of the `.ai` file.
- The swipe handler fires on mouse drags. Restrict it to `pointerType === "touch"` and switch the swipe e2e to touch emulation.
- The vendored `DitherGradient` renders a `div` inside the placeholder `span`. It is client-only and harmless.
- `recolorIcon` leaves a dangling `clip-path` on the `twitter` icon. It renders fine.
- `CreditLine` keys by name, so a repeated name would warn.
- Readout lines are truncated with no `title` to show the full text.
- The vendored dither-kit `area`, `area-chart` and `DitherAvatar` are unused. They are kept because the kit is re-vendored wholesale.

## Research (done 2026-10-03)

- The PrimeFaces blog walk is done: `primefaces-blog-2016-2019.md` and `primefaces-blog-2020-2026.md` in the main checkout's `.superpowers/research/`. The release-level detail it produced is no longer rendered; it stays there as the record.
