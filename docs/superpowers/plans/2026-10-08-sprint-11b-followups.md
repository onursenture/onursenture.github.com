# Sprint 11b follow-ups

## Rollout (each step needs Onur's OK)

1. CI green on the PR.
2. Set the 2.9.0 release date in `content/changelog.ts` to the merge day if it isn't 2026-10-08.
3. Merge into `v2` (a production deploy).
4. Production checks: `/changelog/`, `/colophon/`, `/onur.md` and `/llms.txt` return 200 with CDN HIT; the footer's version and Colophon links work; `/onur.md` has no email address.
5. Rerun the baseline audit (Lighthouse mobile and desktop, better of two runs, and axe) on production. Target: mobile performance ≥ 90 on `/life/`, `/life/photos/` and `/life/films/`, and no LCP image with `loading="lazy"`. Record the numbers here.
6. Onur reads and approves on production: the changelog entries, the colophon, the `onur.md` intro and the page descriptions. Edits come as a follow-up commit (a patch release, 2.9.1).

## Later

- A 320w photo rendition for thumbnails (needs a backfill of every stored photo; 14–50 KiB per page).
- About 40 KiB of shared-chunk and polyfill JavaScript (owned by Next's build).
- Theatre posters are 382×574 for a 90px tile; tiyatrolar has no size parameter.
- Goodreads covers already in the snapshot keep `_SY475_` until the next sync rewrites them.
