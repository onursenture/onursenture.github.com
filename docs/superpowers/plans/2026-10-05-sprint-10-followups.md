# Sprint 10 follow-ups

## Rollout (controller, in this order)

Steps 1 and 2 act on production before the merge: the controller confirms each with Onur first.

- [x] Onur checked `content/theatre-history.ts` (years; 2015 "and earlier").
- [ ] 1. Production migrated: `DATABASE_URL=<prod> npm run db:migrate` (expand-only, safe before the merge; the import needs `life_log`).
- [ ] 2. Letterboxd import ran against production from Onur's machine (`DATABASE_URL=<prod> npm run import:letterboxd -- ../letterboxd-export.zip --posters`); the row counts are in the PR body.
- [ ] 3. Merged (after CI is green, by Onur).
- [ ] 4. One sync per source, each a separate POST and each ok: `/api/sync/theatre/`, then `/api/sync/letterboxd/`, `/api/sync/instapaper/`, `/api/sync/goodreads/` (not one `?force=1`).
- [ ] 5. Production checks: the 2026 count on `/life/films/` is 70 (matches Letterboxd; also checks RSS–CSV key agreement); the second request for `/life/films/2025/` returns `x-vercel-cache: HIT`.

## After merge (Onur, on production)

- [ ] Draft ledes: "What I watched." / "What I read." / "Plays I saw." / "Articles I liked."
- [ ] Look at /life/films/ (current year and an older one), /life/books/, /life/theatre/, /life/saved/ on a phone.

## Later

From the final review (the fix wave took I1–I4, M1, M3, M4, M6, M7, M8):

- Sync in two passes (fetch and record every due source, then run the archive steps with the time left), so a slow archive step can't starve the next sources' snapshots. The theatre fetch (up to 10 POSTs) isn't deadline-aware either.
- Check that the Vercel project has Fluid compute on; `maxDuration` could then go above 60 s (the 45 s budget, `sync.yml`'s `--max-time 120` and the admin page's limit move with it).
- M2: same-day films are ordered by key, not diary order (store a sequence in `data`).
- M5: archive tags fire on every run (`updated` counts unchanged rows); count real changes and warm the four archive pages in `sync.yml`.
- An import `--prune` for film rows no longer in the CSV (re-dated or deleted diary entries).
- The deferred minors listed per task in the final review (`.superpowers/sdd/2026-10-05-sprint-10-life-archives/final-review.md`, local notes).
