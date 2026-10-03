# Sprint 5 Follow-ups

Sprint 5 (Work I: PrimeTek) is complete on branch `sprint-5`: `/work/`, four case studies with Log · Grid · Index · Posts views, the shared viewer, PrimeIcons 7.0.0 live grid, `/work/archive/`, `npm run figma`, the `figmaLinks` switch (off), Figma images (78 sources) and ~150 curated posts. The items below were deferred by the per-task and final reviews, each labelled with the sprint that should pick it up. Items fixed before merge are not listed.

## Before merge (Onur, on the Vercel preview of `sprint-5`)

- **Copy approval.** Read every case study, the Archive and the Posts views. Unconfirmed lines are cut or rewritten before merge. Points to look at:
  - PrimeOne starts in 2022 with the Figma kit; 3.1 has no entry (no public date found; give the month to add it).
  - Apollo's first release: a Nov 2017 PrimeFaces "remastered Apollo" post exists, so Apollo may predate the 2018 entry.
  - "Apollo (2022)" naming for the all-new 2022 Apollo.
  - The Archive "Aura" row shows PrimeVue 4 launch art (captioned as such): keep or drop.
  - Archive rows that are engineering releases (e.g. Theme Designer updated to Angular 7): keep only if they were your design work.
  - Grid and Index show credit names next to figures.
  - Templates coverage reads "26 templates · 8 remasters · 33 pages".
- **Template covers.** 23 template slots are still placeholders (no Figma source for those templates). Supply exports later via Sprint 7's upload, or leave them.
- **CDN caching check** (preview is behind Vercel Authentication; add the bypass header):
  ```bash
  U=https://<preview>.vercel.app
  for p in /work/ /work/primeone/ "/work/primeone/?view=grid" "/work/primeone/?fig=cover"; do for i in 1 2; do
    curl -sI -H "x-vercel-protection-bypass: $BYPASS" "$U$p" | grep -iE '^(cache-control|x-vercel-cache|age):'; echo; done; done
  ```
  The second request of each pair must be `HIT` or `STALE`.

## Sprint 6 (Work II: Orkestra and Lab)

- New case studies from the Figma survey (Onur's decision): **PrimeStore 2025** (full store redesign, 63 screens, "In Progress") and **PrimeDesigner** (theme designer app, "On Hold"), framed as designed-but-unreleased work. Sakai Pro is skipped. Frames are listed in the gitignored `.superpowers/research/figma-survey.md` of the main checkout.
- `/work/` lead is PrimeTek-only; rewrite it when Orkestra joins.
- `lib/work/index-groups.ts`: an org without an experience entry renders empty role/span spans; guard it when a second org is added.

## Sprint 7 (admin)

- Admin upload into the remaining placeholder slots; the DB overlay merges in `lib/work/`.
- `npm run figma` writes an uncropped PNG next to hand-processed sources (5 JPEG, ~15 top-cropped); add crop support or keep editing `figma.local.json` (see CLAUDE.md).
- Tests to add once `figmaLinks` is ever turned on: poster → iframe flow, embed hidden after the viewport shrinks below 768px, close-after-push and Forward in the viewer; `content/work.test` figma check is vacuous until a ref exists.
- `?fig=` on the Archive has no test (no archive media opens from a deep link yet).

## Sprint 11 (polish)

- Easter egg: PrimeIcons 1.0 was drawn in Illustrator (source: github.com/onursenture/primeicons-ai). Onur may share screenshots of the `.ai` file.
- Validator: reject the reserved entry id `all`; reject a bare `https://`.
- `viewerItems(view: string)` → `WorkView`.
- Swipe handler fires on mouse drags; restrict to `pointerType === "touch"` (switch the swipe e2e to touch emulation).
- Deep link to a figure not shown in the Log has no focus target on close (falls back to default); could focus the entry's "+N in Grid" button.
- Vendored `DitherGradient` renders a `div` inside the placeholder `span` (client-only; harmless).
- `recolorIcon` leaves a dangling `clip-path` on the `twitter` icon (renders fine).
- Filter chips are hand-rolled `aria-pressed` buttons, not the `Chip` primitive (which is a status span); consider a toggle variant.
- `CreditLine` keys by name; a repeated name would warn.
- No test pins "no og:image when the hero is a placeholder".
- ~9 short post summaries still mirror one or two source items in order; reword if they bother you.

## Research (any sprint)

- **PrimeFaces blog, full walk (its own task, Onur 2026-10-03).** The blog index redirects, but every article links to the previous and next post. Walk it end to end in both directions separately, from a mid-point article backwards to 2016 and forwards to 2026, covering Onur's ten years. Record every post relevant to his work: PrimeOne, PrimeBlocks, PrimeIcons, templates, themes, Theme Designer, the store and design tooling. The goal is to fill gaps and correct the record of what he did across those years, not only single dates like PrimeOne 3.1. Output a research file like `x-prime-posts.md`, then run a content pass.
- The 2019-06 – 2020-10 X search window was thin; templates from that period may be missing posts.
