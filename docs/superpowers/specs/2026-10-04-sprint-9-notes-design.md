# Sprint 9: Notes — Design Spec

## Overview

Sprint 9 adds **Notes**: short posts Onur writes in the admin. They come in two streams:
- **Work** notes are about what he is making. They appear on the home page and at `/notes/`.
- **Life** notes are personal. They appear on `/life/` and at `/life/notes/`.

A note can also go to **both** streams.

Notes stay on the site for now. Each note has the exact shape of a Bluesky post (`app.bsky.feed.post`) and an AT Protocol record key (TID) as its id. Cross-posting to Onur's existing Bluesky account (**@w00f.org**) can therefore come later as a pure addition: one switch and one write per note, with no reshaping and no truncation.

The decisions come from a brainstorm with Onur on 2026-10-04. The mockups are in `2026-10-04-sprint-9-mockups/`:
- `home-notes-row.html`: option A is chosen ("stream");
- `notes-pages.html`: option A is chosen (stream split by year). The single-note page and the Life views are approved as shown;
- `admin-notes.html`: option **B** is chosen (compose box on top, timeline below).

The note texts in the mockups are examples.

## Decisions

| Topic | Decision |
|---|---|
| Streams | **Two streams, choosable per note:** `work`, `life` or `both`. A `both` note is listed on each side. |
| Format | **Bluesky-shaped.** At most 300 graphemes of plain text. Links, @handles and #tags are detected, not marked up, so there is no markdown. Each note has **one** optional attachment: 1–4 images (any ratio, alt text required) **or** one link card. |
| Origin | **Site only for now.** Notes are written in `/admin/notes/` and stored in Neon. Cross-posting to Bluesky is out of scope, but the model is ready for it. |
| Id and URL | **TID** (the AT Protocol record key, 13 chars, time-sortable), assigned when a note is first published. URLs are `/notes/<tid>/`, or `/life/notes/<tid>/` for life-only notes. |
| Publishing | **Several drafts** at once. Publish **now**, or **schedule** for a future time in 15-minute steps (Europe/Istanbul). |
| Schedule precision | **Quarter hour.** A GitHub Actions cron calls a publish endpoint every 15 minutes. A note scheduled for 09:15 appears between 09:15 and about 09:25. |
| Editing | Published notes can be **edited and deleted freely, with no trace**: no "edited" mark, and the URL and date stay the same. A deleted note's URL returns 404. |
| Images | **Any ratio, kept.** They go through the existing Blob pipeline (AVIF + JPEG renditions). Lists cap the frame, and the note page shows each image uncropped. The 16:10 rule stays for product pages only. |
| Home | A **Notes row** between Selected work and Experience shows the latest 3 Work notes, in mockup A's stream style, with "All notes" as the action. |
| `/notes/` | A **stream split by year**, with the year set in Doto in the label column. 30 notes per page. |
| Life | A **Notes section** above Writing on `/life/` (latest 3), a `note` line in the boot readout, and `/life/notes/`. |
| w00f.org | Stays Life's separate **Writing** section. It is not merged into Notes. |
| Feed | **One `/feed.xml`**: every published note (all sides) plus photos, newest first. It keeps the old site's URL. |
| Admin | **Mockup B**: an always-open compose box on top and a filtered timeline below. It must **work fully on a phone**. |
| Storage | **A new `notes` table** in Neon. Scheduled notes are flipped to published by the cron. |

## 1. Data

### 1.1 The `notes` table

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, pk | The internal id, used by the admin for drafts and edits. |
| `tid` | text, unique, nullable | Set once, when the note first becomes published, and never changed. |
| `text` | text, not null | At most 300 graphemes. May be empty only when the note has images. |
| `side` | text, not null | `work` \| `life` \| `both`. |
| `lang` | text, not null | `en` \| `tr`, default `en`. |
| `embed` | jsonb, nullable | See §1.2. |
| `status` | text, not null | `draft` \| `scheduled` \| `published`. |
| `publish_at` | timestamptz, nullable | Required when `scheduled`. Always on a quarter hour. |
| `published_at` | timestamptz, nullable | Set when the note is published. The public date and the sort key. |
| `created_at` / `updated_at` | timestamptz, not null | `updated_at` guards a save against a stale tab, like `draft_updated_at` in Sprint 7. |

Lists are sorted by `published_at` descending, with `tid` as the tie-break.

### 1.2 The attachment (`embed`)

It is a tagged union, and it maps one to one onto Bluesky's embeds:
- `{ kind: "images", images: [{ mediaKey, alt, width, height }] }`
  - 1–4 images;
  - `alt` is required and not blank;
  - `mediaKey` points into the existing `media` table.
- `{ kind: "link", url, title, description, siteName }`
  - fetched once on save (§4.4);
  - the URL is required, and the other fields may be empty.
- `null`: no attachment.

There is never more than one attachment. A Zod schema in `lib/notes/` validates every write, on the client before saving and on the server in each action.

### 1.3 Text rules

- **Counting:** graphemes, with `Intl.Segmenter("en", { granularity: "grapheme" })`. 👍🏽 counts as one. The same function drives the editor's counter and the server check.
- **Facets** are detected at render time, never stored. Because the detection follows Bluesky's own rules, a later cross-post produces the same links. There are three kinds:
  - **URLs** (`https://…`, or a bare domain with a path) become links. They are shown shortened to the host plus a short path, as Bluesky does.
  - **@handles that contain a dot** (for example `@w00f.org`) link to `https://bsky.app/profile/<handle>`. A bare `@w00f` stays plain text.
  - **#tags** render as muted text with no link, because there are no tag pages.
- Line breaks are kept. Anything else is plain text, escaped as usual.

### 1.4 TID

`lib/notes/tid.ts` implements the AT Protocol TID:
- a 64-bit value made of 53 bits of microseconds since the epoch plus a 10-bit clock id;
- written in the sortable base32 alphabet `234567abcdefghijklmnopqrstuvwxyz`, 13 characters long.

The microseconds come from the note's `published_at`, so TIDs sort the same way as dates. A scheduled note uses its `publish_at`, not the time the cron ran. If two notes share a microsecond, the clock id resolves the collision.

Tests check:
- the format (`^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$`);
- that the order matches time order;
- a round trip through the time.

### 1.5 Reading and caching

`lib/notes/read.ts` exposes:
- `getNotes({ side, page })`;
- `getNote(tid)`;
- `latestNotes(side, n)`;
- `adjacentNotes(tid, side)`.

They return **published** notes only, and are cached with the `notes` tag. Every admin write and every cron publish calls `revalidateTag("notes")`.

A scheduled note whose time has passed but which the cron hasn't flipped yet is **not** shown. The cron is the only path from scheduled to published, so a note can never be public before its revalidation.

When the database is unavailable, every read returns an empty list, so pages render without notes and the home Notes row is hidden. This is the fail-soft contract.

## 2. Entry points

- The **home Notes row**, with "All notes" as its action.
- The **Life Notes section**, with "All notes" as its action.
- The **RSS** link in the `/notes/` header row.
- The **boot readout** `note` line, which links to the note.

`NAV_ITEMS` gets `{ label: "Notes", href: "/notes/", ready: true, inHeader: false }`. There is still no header nav.

## 3. Pages

### 3.1 The note component (mockup A)

One `NoteItem` component renders a note everywhere: the home row, the lists and the Life views. It uses the Lab row's type:
- the text in `type-body`;
- then the attachment;
- then the date in `type-meta` muted. The date links to the note's page.

Items are separated by hairlines (`border-line`).
- **Images**: one image spans the full width; two to four sit in a 2-column grid. Each frame keeps its image's ratio, clamped between 4:5 and 2:1 with `object-fit: cover`. The `<Picture>` renditions are reused, and `width`/`height` are always set.
- **Link card**: a hairline box with the title (falling back to the URL), then the site name or host in muted text. The whole card is the link, and the `↗` glyph follows existing external-link usage.
- **Dates**: `Oct 4` in the current year, `Oct 4, 2025` otherwise, in Europe/Istanbul time.

### 3.2 Home

`HomeSite` gets a `notes` row between Selected work and Experience:
- the label is `Notes`;
- the action is `sectionLink("All notes", "/notes/")`;
- the content is the latest 3 notes with `side ∈ {work, both}`.

The row is hidden when there are none. `getHomeContent()` loads them.

### 3.3 `/notes/` and `/notes/page/<n>/`

- **Header row**: `← Home` in the label column. The lead is `Notes` followed by the line `What I'm making, in short.` in muted text; this is draft copy that Onur approves in the follow-ups. The action is `RSS` → `/feed.xml`.
- **Body**: one `SectionRow` per year, with the year in Doto as the label. The year rows are separated by dither rules. There are 30 notes per page, so a year can continue onto the next page.
- **Pagination**: `Older notes →` and `← Newer notes` sit in the last row's action column. Page 1 has no `/page/1/` URL. An out-of-range page returns a 404.
- **Empty**: with no notes, the page shows a single row reading "No notes yet."
- **Metadata**: `pageMetadata("Notes")`.

### 3.4 `/notes/<tid>/`

- **Header row**: `← Notes`, then the note.
  - The text is set in the lead size (`type-lead`, regular weight).
  - Images are full width at their own ratio, uncropped.
  - The date line reads `Oct 3, 2026 · 14:15`.
- **More row**: the previous and next note on the same side, shown as a truncated text link each.
- **Life-only notes**: `/notes/<tid>/` for a life-only note returns a 404. Its page is `/life/notes/<tid>/`, and the reverse holds for work-only notes. A `both` note's canonical URL is `/notes/<tid>/`, and `/life/notes/<tid>/` also renders it with `<link rel="canonical">` pointing to `/notes/<tid>/`.
- **Metadata**:
  - the title is the first 60 graphemes of the text (or "Note"), with ` · Notes` appended;
  - `og:description` is the full text;
  - a note with images gets `summary_large_image`, with the first image's largest JPEG rendition as `og:image` and its dimensions. This follows the existing social-metadata conventions.
  - Other notes get `summary`.
- **Rendering**: no note pages are built ahead. The plan picks the rendering strategy under Cache Components. Note pages must be cacheable by the CDN and refreshed by the `notes` tag.

### 3.5 Life

- **`/life/`**: a `notes` section is added to `lifeSections` above `writing`. It shows the latest 3 notes with `side ∈ {life, both}` and "All notes" → `/life/notes/`, and it is hidden when empty.
- **Boot readout**: a `note` line shows the latest life-or-both note's text, truncated by the readout's existing rule, and links to its page.
- **`/life/notes/`, `/life/notes/page/<n>/` and `/life/notes/<tid>/`**: these mirror §3.3–3.4 on the Life side, which is always dark. The header lead is `Notes` with `Off the clock.` muted (draft copy).

### 3.6 `/feed.xml`

- An RSS 2.0 route handler (`app/feed.xml/route.ts`), cached with the `notes` tag. Photos are repo content, so a deploy refreshes them.
- **Items**: every published note plus every photo, newest first, 50 items.
- **Note items** have no `<title>` (RSS 2.0 allows a description-only item).
  - `<description>` is HTML: the text with its facets as links, then `<img>` tags (1280 JPEG, with alt text) or a link to the card's URL.
  - `<link>` and `<guid isPermaLink="true">` are the note's canonical URL, and `<pubDate>` is in RFC 822.
- **Photo items** keep the old feed's shape: the title, the image and the photo page URL.
- The channel's title and link come from `lib/site.ts`. The response is `application/rss+xml; charset=utf-8`.

## 4. Admin

### 4.1 `/admin/notes/` (mockup B)

**Compose box**, always at the top:
- The **text area**, with a live grapheme counter that counts down from 300. It turns red past zero, and Publish is disabled while the text is over the limit.
- **Side**: a segmented control with Work, Life and Both. A new note starts on the side used last in this browser (Work the first time).
- **Language**: an `EN · TR` toggle, EN by default. It is stored as `lang` (§1.1). TR notes render with `lang="tr"`, as the foundation spec requires for Turkish content, and the field maps onto Bluesky's `langs`.
- The **Images** and **Link** buttons:
  - **Images** opens the file picker (`accept="image/*"`, multiple; on a phone this offers the camera or the library). Each image gets a thumbnail, a required alt field and a remove button, up to 4 images.
  - **Link** takes a URL and shows the fetched card.
  - Choosing one attachment kind clears the other, after a confirmation if the other had content.
- **Schedule**: off by default. When it is on, it shows a date input and a time select with quarter-hour options, in Istanbul time. A time in the past is refused.
- **Buttons**: `Save draft` (also bound to Cmd/Ctrl+S) and `Publish`, which reads `Schedule` when the schedule is on. A scheduled note that is opened offers `Publish now` and `Unschedule`, which returns it to a draft.
- **Editing mode**: when a note is open, the box shows `Editing · <status>` with `Cancel`, and `Delete`, which asks for confirmation.

**Timeline**, below the compose box:
- Filters: All · Drafts · Scheduled · Published.
- Rows show the first line of the text and a status pill:
  - `Draft`;
  - `Oct 6 · 09:00` in amber, for a scheduled note;
  - `Oct 4 · Work` for a published note.
- Selecting a row loads it into the compose box.

**Behaviour:**
- **No autosave**, which matches the Sprint 7 ruling.
- Leaving the page, or loading another note, with unsaved edits asks first.
- The state (dirty tracking, the stale-tab guard and the publish transitions) lives in a plain class, `NoteComposerState`, with fake-timer unit tests. This is the Sprint 7 lesson.

**Phone:**
- At a 375px width the compose box is full width and the controls wrap.
- The timeline rows stay tappable, with targets of at least 44px.

### 4.2 Server actions

The actions are `saveNoteDraft`, `publishNote`, `scheduleNote`, `unscheduleNote`, `deleteNote` and `fetchLinkCard`. Each one:
- checks the admin session;
- validates with the Zod schema;
- refuses a stale `updated_at`;
- calls `revalidateTag("notes")` after any change to a published note.

`publishNote` assigns a TID the first time a note is published. When it re-publishes a note that was already published, it keeps the TID and the `published_at`.

### 4.3 Images

Note uploads reuse the client-to-Blob upload and `processImage`. They use a **notes rule set**:
- any ratio between 1:3 and 3:1;
- a minimum width of 320px;
- PNG or JPEG (plus whatever the HEIC spike decides; see §6);
- at most 25 MB.

The renditions use the existing widths, capped at the source width. The media key is `media/notes/<noteId>/<n>-<hash>`.

The Sprint 7 16:10 rule stays unchanged for product pages. `rules.ts` is split so that each caller picks its rule set.

### 4.4 Link cards

`fetchLinkCard(url)` makes a server-side GET with a 5-second timeout and a 1 MB cap. It reads `og:title` (falling back to `<title>`), `og:description` and `og:site_name` (falling back to the host). On a failure it returns a card with the URL and the host only, so saving still works. The result is stored in the note's `embed`, and nothing is fetched at render time.

### 4.5 Admin home

A **Notes** section is added above Sources. It shows the drafts and scheduled counts, links to `/admin/notes/`, and has a `New note` action.

## 5. Scheduled publishing

- **Endpoint**: `POST /api/notes/publish-due`, behind the existing `SYNC_SECRET` bearer check. In one transaction it:
  - flips every `scheduled` note whose `publish_at ≤ now` to `published`;
  - assigns each one a TID from its `publish_at`;
  - sets `published_at = publish_at`.

  Then it calls `revalidateTag("notes")` and returns `{ published: n }`. It is idempotent, so a second call publishes nothing.
- **Workflow**: a new `.github/workflows/publish-notes.yml` on **`master`**, because scheduled workflows run only from the default branch.
  - It uses `cron: "1,16,31,46 * * * *"`. The minute offsets keep it off the quarter-hour peaks, and the notes for 09:15 go out at 09:16.
  - It runs the same curl as `sync.yml`.
  - When at least one note was published, it warms `/`, `/notes/`, `/life/`, `/life/notes/` and `/feed.xml`.
- The same change removes `sync.yml`'s stale `view=dashboard` warm-up lines, because the dashboard view no longer exists.
- Pushing to `master` is an outward action, so the controller asks Onur first.
- A deploy of `master` only rebuilds the old Eleventy site, which is harmless.

## 6. Risks and spikes (plan Task 1)

- **iPhone photos (HEIC).** iOS Safari usually hands an `accept="image/*"` input a JPEG ("Most Compatible"), but the "Keep originals" setting and other browsers may send HEIC. The prebuilt sharp/libvips can't decode HEIC. The spike checks what a real iPhone upload delivers.
  - **Fallback**: if HEIC arrives, decode it in the browser to a canvas and upload the result as JPEG, before the Blob upload.
- **Grapheme counting parity with Bluesky.** Check the counter against a handful of strings: emoji ZWJ sequences, flags, Turkish characters and combining marks.

## 7. Testing

**Unit (Vitest):**
- the grapheme counter;
- facet detection (URLs, dotted handles, tags, and look-alikes that must not match);
- TID format, order and collisions;
- the embed schema (one kind only, 1–4 images, alt text required);
- schedule validation (quarter hours, no past times, the Istanbul offset);
- publish-due (it flips only notes that are due, TIDs come from `publish_at`, and it is idempotent);
- the `NoteComposerState` transitions;
- feed XML (escaping, RFC 822 dates, description-only items);
- `fetchLinkCard` parsing against saved HTML fixtures.

**e2e (Playwright, with fixtures and the file content store):**
- the home Notes row shows the latest 3 Work notes and is hidden with none;
- `/notes/` year rows, pagination, and a 404 past the last page;
- `/notes/<tid>/` (and a 404 for a life-only note there);
- the `/life/` section, `/life/notes/` and the readout line;
- `/feed.xml` validity.

**e2e (admin):**
- write a draft → save → reload;
- schedule → call publish-due → the note is public;
- edit a published note → the URL is unchanged;
- delete → 404;
- the switch between attachment kinds;
- the leave warning;
- composing and uploading at 375px.

**Controller visual check:** the home row, `/notes/`, the note page and Life (dark), on desktop and at 375px; and the admin on a phone viewport. On production after the merge, a real phone upload and one real scheduled note.

## 8. Out of scope

- Cross-posting to Bluesky (and the AT Protocol OAuth or app password it needs). This is a later sprint, and the model is ready for it.
- X.
- Replies, likes or mentions from the network.
- Tag pages, note search, quotes, video, and versioning.
- Media cleanup for deleted notes' Blob files, which stays in the existing post-launch follow-up.

## Errata (implementation)

- **Dates.** Lists outside `/notes/` always show the year ("Oct 4, 2026"): a prerendered page can't know the current year. Under a year label they show "Oct 4".
- **HEIC.** There was no HEIC spike. The browser converts any non-PNG/JPEG file to JPEG before upload (`components/admin/notes/note-upload.ts`). A real iPhone upload on production is a follow-up check.
- **Facets** come from `@atproto/api` 0.23.0 `RichText` (spike on 2026-10-04: identical grapheme counts, and no false positives on file names). Link text renders as written, not shortened.
- **The Life section's action** reads "All", like every other Life section, not "All notes".
- **The scheduled pill** uses the accent token, because amber isn't a token.
- **Notes in dev and e2e** live in a sibling JSON file (`<content store>.notes.json`).
- **Note page text** is `type-lead` with an inline `fontWeight: 400`, a deliberate exception Onur approved (the mockup weight) to "type only from `type-*` classes".
- **Composer (`NoteComposerState`)**, after the Task 9 review fixes (all approved by Onur): `dirty` compares order-independently (key-sorted), because the server returns embeds in schema key order; `open()`/`startNew()` are ignored while an action runs, and the timeline rows, Cancel, Delete and Unschedule are disabled while an action or an upload runs; on a scheduled note whose schedule was moved, Save is disabled (use Reschedule, Publish now or Unschedule); for new notes and drafts the schedule toggle doesn't count as an unsaved change; `hasUnsaved` includes running uploads.
- **Feed descriptions** are HTML-escaped once for HTML and again for XML, so an apostrophe appears as `&amp;apos;` in the raw XML. That is correct.
- **Admin form labels.** The Note and Alt text textareas use a `<label htmlFor>` beside the control: a wrapping label pulled the typed value into Playwright's accessible-name match.
- **e2e.** After a client navigation Next keeps the previous route hidden, so counts use `:visible`. Playwright reuses a running server locally on 3217/3219/3221, so stop stale `next start` processes first.
- **Facet library and target.** `@atproto/api` is pinned to 0.23.0 (exact). tsconfig targets ES2017, so BigInt literals are not allowed; `lib/notes/tid.ts` uses `BigInt()`.
- **Media key.** An uploaded note image is stored at `media/notes/<hash16>`, not `media/notes/<noteId>/<n>-<hash>`.
- **publishDue** uses per-note optimistic updates with per-note error isolation (a note whose update throws is logged and skipped), not one transaction. The route revalidates `notes` when something went live, and also after a failure.
- **Side rule.** A published note's side can only widen to Both (Onur's ruling: "only widen after publishing"); the server refuses anything else and the composer disables those radios. A Life note widened to Both becomes canonical on the Work page, and its `/life/notes/<tid>/` URL keeps rendering (with its canonical pointing at Work).
- **Feed guids.** A note's `<guid>` is `tag:onursenture.com,2026:note/<tid>` (`isPermaLink="false"`), independent of its side, so a side change never duplicates the item in a reader. `<link>` stays the canonical URL. Photos keep their permalink guid.
- **Link-card fetches** count as a running upload in the composer (rows, Cancel, Delete, Unschedule, Save and Publish wait; `hasUnsaved` is true). `ComposerSnapshot.generation` increments on every load and keys `<Attachments>`, so its local state resets when another note is loaded.
