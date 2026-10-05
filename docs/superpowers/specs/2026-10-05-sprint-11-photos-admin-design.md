# Sprint 11: Photos in the admin — Design Spec

## Overview

Today photos are repo-only. Each of the 5 photos is a `content/photos/<slug>.mdx` (frontmatter `title`, `date`, `image`, `camera`) plus an original in `images-src/photos/`, and `npm run images` builds the renditions into `public/images/photos/`. `getPhotos()` is cached with no tag, so a photo only changes with a deploy.

Sprint 11 moves photos into the database and the admin, so Onur can post a photo from his phone: upload, title, date and camera from EXIF, draft, publish, edit and delete. The 5 existing photos are migrated and the repo copies removed.

The rest of the old Sprint 11 (changelog, paddle effect, Konami easter egg, performance and accessibility) becomes **Sprint 11b** with its own brainstorm. The foundation spec's roadmap table is updated on this branch.

The decisions come from a brainstorm with Onur on 2026-10-05, held in Turkish. The mockup is in `2026-10-05-sprint-11-mockups/`.

| Mockup | Outcome |
|---|---|
| `admin-photos-layout.html` | **Option A is chosen**: the Notes pattern, with "+ Add photo" and the form on top and the photo list below. |

## Decisions

| Topic | Decision |
|---|---|
| Scope | Photos in the admin only. Polish moves to Sprint 11b. |
| Publish flow | **Draft + Publish.** Several drafts may exist. No scheduling. A published photo is edited in place and saved live, as with Notes; there is no unpublish. |
| Order | **By date taken**, newest first. Same-day photos are ordered by the EXIF time. To reorder, edit the date. There is no manual ordering UI. |
| EXIF | **Date and camera only**, both prefilled in the form and editable. GPS is never read, and no metadata survives into the renditions. |
| Alt text | **An optional field.** When empty, the title is used, as today. |
| URL | `/life/photos/<slug>/`. The slug comes from the title, with Turkish characters transliterated, and **freezes at first publish**. A later title change keeps the URL. A collision gets `-2`, `-3`, and so on. |
| Migration | **A one-time import** moves the 5 photos into the database and Blob with their current slugs, dates and cameras. Then the repo copies are deleted, so the database is the only source. |
| Admin layout | **Mockup A**, built phone-first. |
| Storage | A new `photos` table with its own store and cache tag, modelled on Notes. A single `content_docs` document was rejected, because one draft would then cover the whole list. |

## 1. Data

### 1.1 `photos` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text, unique, nullable | Null while a draft that was never published. Set at first publish and never changed afterwards. |
| `title` | text | Required to publish. May be empty on a draft. |
| `alt` | text | Empty string means "use the title". |
| `takenAt` | text, `YYYY-MM-DDTHH:mm:ss` | The **wall-clock** time the photo was taken (EXIF `DateTimeOriginal` is local time, with no zone). Fixed-width text sorts correctly and needs no time-zone conversion. Only the date part is shown. |
| `camera` | text | Empty string allowed. |
| `image` | jsonb | The renditions, self-contained like a Notes image: `{ key, width, height, widths, baseUrl }`. A photo renders without a media lookup. |
| `exif` | jsonb | What EXIF gave at upload, `{ takenAt, camera }` (each null when missing), so the form can show the "EXIF" hint. |
| `status` | text | `draft` or `published`. |
| `publishedAt` | timestamptz, nullable | Set at first publish. |
| `createdAt`, `updatedAt` | timestamptz | `updatedAt` drives optimistic updates (`expected=updatedAt`), as in Notes. |

The migration is generated with `npm run db:generate` into `drizzle/` and is expand-only.

### 1.2 Store

A `PhotoStore` interface in `lib/photos/store.ts`, chosen by `lib/photos/get-store.ts` exactly like `NoteStore`:
- `FilePhotoStore` when `CONTENT_STORE_FILE` is set (dev and e2e; refused on Vercel);
- `DrizzlePhotoStore` otherwise; its tests run on PGlite.

Store methods: `list()`, `listPublished()`, `get(id)`, `slugs()`, `create(fields)`, `update(id, fields, expected)` and `remove(id, expected)`. The rules live in `lib/photos/operations.ts`, as with Notes: creating a draft from an upload, saving, publishing and deleting. Publishing needs a non-empty title and, on first publish, assigns the slug. Slug rules live in `lib/photos/slug.ts`:
- lowercase, with Turkish characters transliterated (`ç→c`, `ğ→g`, `ı→i`, `İ→i`, `ö→o`, `ş→s`, `ü→u`);
- anything else non-alphanumeric collapses to `-`, trimmed at both ends;
- an empty result (a title of only symbols or emoji) falls back to `photo`;
- a collision with any existing slug appends `-2`, `-3`, and so on.

### 1.3 Reading and caching

`lib/content/photos.ts` keeps its public API (`getPhotos`, `getPhoto`, `adjacentPhotos`) but reads the store:
- `getPhotos()` returns published photos only, ordered by `takenAt` descending, then `id` (a stable tie-break). It uses `"use cache"` with `cacheTag(PHOTOS_TAG)`. `PHOTOS_TAG` lives in `lib/photos/tags.ts`.
- Each `Photo` carries its own image entry. Rendering uses `PictureView` with that entry, because `Picture` throws on keys that are not in the repo manifest.
- Admin writes (save on a published photo, publish, delete) call `updateTag(PHOTOS_TAG)`.
- `/feed.xml` adds `cacheTag(PHOTOS_TAG)` beside `NOTES_TAG`, and builds photo items from the photo's own entry instead of `getImage`. The item date is the `takenAt` date at `T00:00:00Z`, as today.

## 2. Upload pipeline

1. **EXIF is read in the browser, before any conversion**, because the HEIC→JPEG canvas step and sharp both drop it. Add `exifr` (it parses HEIC and JPEG) and read **only** `DateTimeOriginal`, `Make` and `Model` (the `pick` option, so GPS is never parsed).
   - `lib/photos/exif.ts` turns the result into `{ takenAt, camera }`.
   - The camera name is normalised: Apple models use `Model` as is ("iPhone 17 Pro"); for others, `Make` is title-cased and joined with `Model` unless `Model` already starts with it ("FUJIFILM" + "X100VI" → "Fujifilm X100VI").
   - Missing EXIF (a screenshot, an exported file) gives today's date at the current time and an empty camera. The form then shows no "EXIF" hint on those fields.
2. The client checks the file: any ratio, **long side at least 1280px**, at most 25 MB. Non-PNG/JPEG files (HEIC, WebP) are redrawn to JPEG on a canvas, reusing the Notes code in `components/admin/notes/note-upload.ts` (moved to a shared module, not copied).
3. The original goes to Blob through the existing admin upload route, under `uploads/photos/`. Locally it goes through `upload-dev`.
4. A server action runs `processImageWith`: 640/1280/2560 AVIF and JPEG renditions (plus the source width when smaller) at `media/photos/<hash16>-<rand8>-<w>.{avif,jpg}`. The random part keeps two uploads of the same file apart, so deleting one never removes the other's files. No `media` row is written: the photo row holds the entry, and delete removes the files itself. sharp strips all metadata; the original is deleted in `finally`. **No location data is stored anywhere.**
5. The action creates the draft row with the image key and the EXIF fields, and returns it to the form.

**Delete** removes the row and deletes that photo's renditions from Blob (local files in dev) through a new `MediaStorage.deleteRenditions`. Like Notes, it leaves no trace. A published photo's page returns 404 afterwards.

## 3. Admin

### 3.1 Admin home

A **Photos** section, wired like Notes in `components/admin/admin-home.tsx`: a "+ Add photo" action and a counts line ("6 photos · 1 draft").

### 3.2 `/admin/photos/`

Mockup A, one 720px column, phone-first (`app/admin/(console)/photos/page.tsx` with the Gate pattern and `maxDuration = 60`).

**Top:** "+ Add photo", a file input with `accept="image/*"`. Choosing a file runs the upload pipeline, then opens the form in place. Selecting a row in the list loads that photo into the same form.

**Form:**
- the image preview at its own ratio;
- **Title**;
- **Alt text**, marked optional, with the placeholder "Falls back to the title";
- **Date** and **Camera** side by side, each with an "EXIF" hint while its value still matches what EXIF gave. Editing the date keeps the stored time of day;
- actions: Delete (with a confirm), Save draft, and Publish. On a published photo they are Delete and **Save**, which writes live.

Saving is manual, as in Notes: Save draft, Cmd/Ctrl+S, a leave warning when the form is dirty, and a status line ("Draft saved 14:02"). The form logic lives in a plain `PhotoFormState` class with unit tests: a dirty check that ignores key order, and a busy guard while an upload or save runs.

**List:** a 44px square thumbnail, the title and the date, and a status pill (Draft or Live). Drafts come first, then published photos in site order.

## 4. Site

The look does not change. The 3:2-cropped grid, the photo page and the Life row stay as they are. The changes:
- every consumer reads the store: `/life/photos/`, `/life/photos/<slug>/`, the Life section, the Life readout's "last photo", `/system/` and the feed;
- `/life/photos/<slug>/` keeps `generateStaticParams`, with the Notes placeholder pattern: when there are no photos it returns one placeholder slug (`_`, which a slug can never be), because `cacheComponents` requires one param. A slug published later renders on demand and is cached under `PHOTOS_TAG`, as new notes are, so a new photo needs no deploy;
- `alt` (or the title when empty) feeds the photo page `<img>` and `og:image:alt`. The grid keeps `alt=""`, because the title names the link;
- the `/photos/` → `/life/photos/` redirects stay.

## 5. Migration

`npm run import:photos -- <checkout>` (`scripts/import-photos.ts`):
- reads `content/photos/*.mdx` and `images-src/photos/<slug>.jpeg` from `<checkout>`, a checkout that still has them (the `v2` worktree before the merge), because this branch deletes them;
- runs each image through the same `processImageWith` path into Blob (or `.media-dev` locally);
- inserts a `published` row with the **current slug**, the title, `takenAt` = the frontmatter date at 00:00, the camera, an empty alt, an all-null `exif` and `publishedAt` = now;
- is idempotent: a slug that already exists is skipped;
- takes `--dry-run`.

The same commit series then deletes:
- `content/photos/`;
- `images-src/photos/`;
- `public/images/photos/`, including the unreferenced `<slug>.avif` and `<slug>.jpeg` files;
- the photo entries in `lib/images/manifest.json`.

The Notes fixtures (`lib/notes/fixtures.ts`) reference `photos/kizilcikli` and `photos/bold-vakif-building`. They move to their own fixture images. A photos fixture for the file store gives dev and e2e a few published photos and one draft.

### 5.1 Rollout order

The repo copies are gone after the merge, so the database must be filled first. Production steps need Onur's OK, and secrets never go through chat (`vercel env pull`).

1. Migrate production (expand-only).
2. `npm run import:photos` against production.
3. Merge.
4. Checks on production: the 5 photo URLs return 200 with CDN HIT, the feed lists them, `/life/` shows the "last photo" line.
5. Onur posts a real photo from his phone (HEIC) and publishes it. This also closes the open phone-upload check from Sprint 9.

## 6. Testing

**Unit (vitest):**
- slug: transliteration, symbol-only titles, collisions, freezing after publish;
- camera-name normalisation;
- EXIF extraction from JPEG and HEIC fixtures with EXIF, a file without EXIF, and a check that GPS is not in the result;
- upload rules (ratio-free, 1280 minimum, size);
- both stores, including optimistic-update conflicts and publish validation;
- ordering (`takenAt`, then `id`);
- `PhotoFormState` (dirty, busy guard, EXIF hint);
- feed items built from DB photos;
- the import script in `--dry-run` against fixtures.

**e2e:**
- `e2e/photos.spec.ts` runs against the fixture store.
- A new admin e2e: upload → draft → publish → visible on `/life/photos/` and in `/feed.xml` → edit the title (URL unchanged) → delete → 404. It runs at 1440×900 and at **390px**.

**Controller visual check:** the admin at desktop and 390px, the photo pages, and the Life row.

## 7. Risks and spikes

Spikes run during planning (2026-10-05):
- **`exifr` 7.1.3** reads `Make`, `Model` and the raw `DateTimeOriginal` string (`reviveValues: false`) from a JPEG and from a HEIC written by ImageIO. With `pick` it returns only those three tags, even when the file carries GPS. The fixtures `tests/fixtures/photos/exif.heic` and `exif-gps.jpg` (both with GPS) come from `make-fixtures.swift`.
- **sharp** output carries no EXIF (`metadata().exif` is undefined), and sharp cannot write GPS, which is why the fixtures come from ImageIO.
- **tsx** resolves the `@/` aliases in `lib/media/process.ts`, so the import script can reuse the pipeline.

Still open:
- **iOS file picker.** With `accept="image/*"`, iOS Safari may hand over a JPEG transcode instead of the HEIC. Either way EXIF is read before the canvas step. This is checked on Onur's phone in rollout step 5.
- **On-demand photo pages.** A slug published after the build must render, be CDN-cached, and refresh on `updateTag(PHOTOS_TAG)`. The admin e2e covers render and refresh; the CDN is checked on production.

## 8. Out of scope

- Scheduling, manual ordering, albums, captions or descriptions beyond the title.
- Shooting settings (lens, aperture, shutter, ISO).
- Bluesky cross-posting of photos.
- Sprint 11b: changelog, paddle effect, Konami easter egg, performance and accessibility.

## Errata (implementation)

- **Uploads are redrawn.** Every photo upload is redrawn on a canvas to JPEG (q 0.92, at most 4096px on the long side) before it leaves the browser, PNGs included. Notes keep PNGs as they are and redraw everything else. This keeps a GPS-bearing JPEG original out of the public `uploads/` area, so "no location data is stored anywhere" also holds for the few seconds before the server deletes the original. EXIF is still read from the untouched file first.
- **The import names its target.** Every run, dry runs included, prints the database host and the storage mode. It refuses `--local` unless the database is localhost.
- **Editor state.**
  - Edits are ignored while a save or upload runs.
  - A refused upload reads "Can't upload:"; a refused write reads "Can't publish yet:".
- **The file input waits for hydration.** "+ Add photo" renders its file input only after hydration, so a file picked before React attaches can't be lost.
