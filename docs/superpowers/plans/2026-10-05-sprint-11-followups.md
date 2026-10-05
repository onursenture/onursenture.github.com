# Sprint 11 follow-ups: Photos in the admin

Branch `sprint-11` (from `v2` 179266e). Spec: `docs/superpowers/specs/2026-10-05-sprint-11-photos-admin-design.md`. Plan: `docs/superpowers/plans/2026-10-05-sprint-11-photos-admin.md`.

## State at PR time

- **Tests:** all green. 783 unit tests; typecheck and lint clean. e2e 112 (2 skipped, both already skipped before), e2e:admin 22, e2e:fixtures 31.
- **Reviews:** every task review passed, and the opus whole-branch review returned "With fixes". One fix wave covered:
  - the import guard;
  - JPEG originals redrawn before upload;
  - the slug-race tests.
- **Controller checks, on a local server against a file store:**
  - A rehearsal import of the real 5 photos from the `v2` worktree kept their slugs, dates and cameras, and the same order as today. Running it again skipped all 5.
  - Visual check of `/life/photos/`, a photo page, the `/life/` row and readout, the `/admin/` counts, and `/admin/photos/` at desktop width and 375px.

## Rollout

Each production step needs Onur's OK. Secrets never go through chat: use `vercel env pull` into a git-ignored file, and never echo it.

1. **Migrate production** (expand-only, `drizzle/0004_photos.sql`). Run `npm run db:migrate` with the production `DATABASE_URL`.
2. **Import the photos.**
   - First a dry run: `npm run import:photos -- ../onursenture.github.com-v2 --dry-run`. It must print the Neon host and `storage blob`.
   - Then the real run, with the production `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`. Expect "imported 5". `--local` is refused against a non-local database.
3. **Check the preview before merging.** The `sprint-11` preview reads the production `photos` table. Check:
   - `/life/photos/` shows 5 photos;
   - one photo page has its `og:image` as a Blob JPEG;
   - `/feed.xml` lists the photos.
4. **Merge the PR into `v2`.** This deploys production.
5. **Check production:**
   - the 5 photo URLs and `/life/photos/` return 200 with CDN HIT;
   - `/feed.xml` lists the photos;
   - `/life/` shows "last photo";
   - `og:image` is the Blob JPEG.
   - Then edit one imported photo's alt text in `/admin/photos/`. Confirm the page and feed update, then revert. This exercises a prerendered photo plus `updateTag`.
6. **Onur posts a real photo from his iPhone (HEIC).**
   - Check that the date and camera came from EXIF, that the new slug renders and is cached, and that it updates after an edit.
   - This also closes the Sprint 9 phone-upload check.
7. Remove the `sprint-11` worktree and branch, locally and on origin.

## For Onur

- Use `/admin/photos/` from the phone (rollout step 6).
- The 5 existing photos have no alt text, so the title stands in. Add alt text in the admin whenever you like.

## Later

- **Legacy image URLs.** The Eleventy site's `og:image` URLs (`https://onursenture.com/images/photos/<slug>.jpeg`) no longer exist on v2. The old page URLs redirect and carry the new `og:image`, so only cached previews refer to them. Note this in the Sprint 12 cutover checklist.
- **Notes upload hydration race.** `components/admin/notes/attachments.tsx` renders its file input before hydration, as Photos did before its `useHydrated` fix. Use the same fix if it ever flakes.
- **Keyboard focus on "+ Add photo".** It has no visible focus ring (it mirrors Notes). Fold this into the Sprint 11b accessibility pass.
- **Deferred minors from the reviews** (none block the merge):
  - Slugs: the `TURKISH` map and its regex are kept in sync by hand.
  - EXIF:
    - brand acronyms are title-cased ("DJI" becomes "Dji"; the camera is editable);
    - an invalid exif payload becomes "no EXIF" without a log.
  - Upload and storage:
    - renditions are orphaned if draft creation fails after processing;
    - the uploaded original is left behind on the unauthorized and no-storage early returns. JPEGs are now redrawn, so it carries no location data.
  - Drizzle store:
    - a malformed `expected` throws (and is shown as "unavailable") instead of returning a conflict;
    - unreadable rows are hidden from the admin.
  - Status copy: slug exhaustion reads "changed in another tab", and a delete in flight reads "Saving…".
  - Test gaps:
    - the Blob `media/` guard is not tested with a valid Blob `baseUrl`;
    - the fixture neighbour-nav e2e no longer asserts link hrefs.
  - Running `e2e:admin` before `e2e` on the same build makes `e2e` see the admin's notes and photos. Rebuild between them, or run `e2e` first.
