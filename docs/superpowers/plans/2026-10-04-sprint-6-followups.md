# Sprint 6 Follow-ups

Branch `sprint-6` adds:
- 11 product pages: 9 Orkestra projects, PrimeStore and Theme Designer;
- the Then block and Live links;
- Experience with a year column;
- 6 curated Selected work pins;
- 6 new Lab entries.

The spec is `docs/superpowers/specs/2026-10-04-sprint-6-work-orkestra-design.md`. The copy comes from the research fact sheet and Onur's questionnaire answers, both in the main checkout's gitignored `.superpowers/research/orkestra-projects.md` and `orkestra-answers.md`.

## Before merge (Onur, on the Vercel preview of `sprint-6`)

- **Copy approval for the 11 pages**:
  - **The pages:** the lead, intro, facts, Then, What I did, extra blocks, captions and pin titles and notes.
  - **Lines Onur already ruled on:**
    - Nebuu's "every update since 2013" and its Then wording are kept.
    - count.do "already worked on iOS 7"; the 640 KB claim is dropped.
    - İmparator: "Its 2018 update brought…".
    - Nebuu: "In 2026 it holds more than 50,000 Turkish words" (Onur's figure).
  - **Lines still worth a look:**
    - Harf Marf's intro, "A calm iOS puzzle". The source only says "relaxing music".
    - Gonna's "What I learned", which is worded from the 2014 post-mortem.
    - count.do's intro, "I remastered it for the web in 2026".
- **Lab lines** (`content/lab-index.ts`): Cehennem Rebirth, count.do Remastered, Motif, tanerman.com, Dönerverse, Nebuu Deck Studio.
- **Images**: 3 per new page, 33 in all.
  - Format: 16:10, 2560×1600, delivered into `images-src/work/<slug>/<image id>.(png|jpg)`.
  - The ids are in each `content/work/<slug>.ts` `highlights` block.
  - These new pages' first images are pinned to Selected work: PrimeStore `store`, Nebuu `game`, Beatografi `marketplace`.
- **CDN caching check.** The preview is behind Vercel Authentication, so add the bypass header:
  ```bash
  U=https://<preview>.vercel.app
  for p in / /work/nebuu/ /work/gonna/ /work/theme-designer/; do for i in 1 2; do
    curl -sI -H "x-vercel-protection-bypass: $BYPASS" "$U$p" | grep -iE '^(cache-control|x-vercel-cache|age):'; echo; done; done
  ```
  The second request of each pair must be `HIT` or `STALE`.

## Later

- "Orkestra reached more than 1 million people (2016)" is approved but has no home yet. It could go in an Orkestra bio line or a future Orkestra page.
- The Orkestra Live links depend on App Store listings that haven't been updated since 2017–2019 (Harf Marf, İmparator, Hi Jump, Rebound Line). Check them once a year, and drop a link when its listing is gone.
- **Sprint 7 (admin):** the image upload covers the 33 new slots too. Link and source editing can come later.
- **Deferred minors from the reviews** (none block merge):
  - `LinkLine` keys by href.
  - The paragraph map is duplicated in the Text and Then blocks.
  - `resolveExperience` ignores `years` on a linked row instead of rejecting it.
  - The 390px Experience e2e reads the year as `span.last()`.
