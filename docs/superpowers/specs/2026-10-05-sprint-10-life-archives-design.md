# Sprint 10: Life archives — Design Spec

## Overview

Sprint 10 builds the **personal layer**: four archive pages under `/life/`, one for each personal source. Today the Life home shows a short sample of each source, and its "All ↗" links leave the site.

| Page | Source | Size today (2026-10-05) |
|---|---|---|
| `/life/films/` | Letterboxd | 798 films; 70 of them in 2026 |
| `/life/books/` | Goodreads | 151 books on the read shelf, plus 4 currently reading |
| `/life/theatre/` | tiyatrolar.com.tr (new source) | 77 plays |
| `/life/saved/` | Instapaper | 43 liked articles |

The decisions come from a brainstorm with Onur on 2026-10-05, held in Turkish. The mockups are in `2026-10-05-sprint-10-mockups/`. They show Onur's real data; the lede lines are drafts.

| Mockup | Outcome |
|---|---|
| `archive-layout-v2.html` | First round (A year wall, B diary list, C month strips). Onur asked for a hybrid of B and C. |
| `archive-hybrid.html` | **Option 1 is chosen** (captioned month strips), but **without the release year** in the caption. |
| `reading-cards.html` | First round. Onur preferred the list (B) and asked for alternatives. |
| `reading-list.html` | **Option 3 is chosen** (site and length in the label column, image on the right). |
| `books-theatre.html` | **Books is approved as shown.** Its Theatre options were superseded once the activity feed turned out to carry every watch. |
| `theatre-years.html` | **Approved**: one strip per year, with the company in the caption and "and earlier" on 2015. |

## Decisions

| Topic | Decision |
|---|---|
| Scope | Films, Books, Theatre and Saved pages, the Life home changes, and the personal-layer hardening follow-ups. |
| Shared layout | **Captioned month strips.** The year sits in the label column, set in Doto. Each month is one row: the month name and its real item count on the left, and a strip of 2:3 tiles on the right. Every tile carries a caption. |
| Ratings | **None** anywhere. This carries forward the Sprint 5 polish rule. |
| Films history | **The full archive.** A one-time import of Onur's Letterboxd export, after which every sync adds new diary entries. |
| Films paging | **One page per year.** `/life/films/` shows the current year, with a Doto year index on top. Each year has its own URL, `/life/films/<year>/`, and undated films are at `/life/films/undated/`. |
| Films caption | Title, then the watch day (`Sep 8`), with `↻` on a rewatch. **No release year**: next to the watch date it read like a second date. |
| Books | One page. "Reading now" comes first, then year and month strips by read date, then "Undated". The caption is title · author · read day. |
| Theatre dates | **Year only, for every play.** tiyatrolar.com.tr shows only relative times ("5 ay önce", "11 yıl önce"), so years are the honest common precision. Onur didn't want new plays by day and old ones by year side by side. |
| Theatre 2015 | The 17 watches at "11 yıl önce" have near-consecutive activity ids (94778–94791). They were bulk-entered when the account was set up, so that group reads **"2015 · and earlier"**. Onur confirmed that some of those plays were seen before 2015. |
| Theatre caption | Title · company or stage. |
| Saved | Named **Saved**, at **`/life/saved/`**, so it doesn't clash with Books' "Reading now". The layout is list option 3. All liked articles are shown, in Instapaper's order, without month grouping (Instapaper exposes the save time, not the like time). |
| Missing images | A **Dither Kit fallback** tile with the item's initial. |
| Life home | The "All" links go to the new pages (→). A new **Theatre** section comes after Books. The boot readout gets a `last play:` line. **Writing is hidden while w00f.org has no posts** (the blog is empty for now, not gone). |
| Storage | A new `life_log` table holds Films and Theatre, which must accumulate. A new `link_enrichments` table holds Saved metadata. Books stays a snapshot. |

## 1. Pages

### 1.1 Shared frame

Every archive page reuses the `/life/notes/` header row:
- the label column holds `← Life`;
- the content column holds the title (Plex Sans 600) and the lede (Plex Sans 500, muted);
- the action column holds the upstream link (`Letterboxd ↗`, `Goodreads ↗`, `tiyatrolar.com.tr ↗`, `Instapaper ↗`).

A dashed rule follows the header row. The pages are on the Life side: always dark, with the Life tokens.

**Ledes (drafts; Onur approves them on production):**

| Page | Lede |
|---|---|
| Films | "What I watched." |
| Books | "What I read." |
| Theatre | "Plays I saw." |
| Saved | "Articles I liked." |

**Year and month rows.**
- **Year row:** the Doto year, in the label column.
- **Month row:** the hairline-topped `ROW_GRID`, as in the mockups. The label holds the month name (Plex Mono 500, fg), then on the next line `<n> films`, `<n> books` or `<n> plays` (muted). The singular is used for one.
- **Counts:** a count is always the real number of items in that group, never a capped sample.

**Tile (`ArchiveTile`).**
- **Image:** a 2:3 image, `loading="lazy"`.
- **Captions:** a caption of up to two lines (fg), then one or two meta lines (muted).
- **Grid:** strips use `repeat(auto-fill, minmax(84px, 1fr))` with `gap: 12px 10px`, which gives 3–4 columns at 390px.
- **Link:** the whole tile links to the item upstream (the Letterboxd diary entry, the Goodreads book, the tiyatrolar play page).
- **Fallback:** with no image, the tile shows the Dither fallback, the dither texture with the title's initial in Doto. It reuses the Dither Kit; nothing new is vendored.

**Small screens.** Below `md`, the label column stacks above its content, as the existing `ROW_GRID` already does.

### 1.2 `/life/films/` and `/life/films/<year>/`

- **Year index.** A row under the header lists every year that has films, newest first, as Doto links, plus `Undated` when it exists. The current page's year is shown as the selected link (fg). The others are muted, with an underline on hover.
- **`/life/films/`** renders the newest year that has films. **`/life/films/<year>/`** renders that year. An unknown year returns 404.
- **Months.** Within a year, months run newest first. Within a month, entries run by watch date, newest first. Same-day entries keep the diary order.
- **Captions.** The caption is the film title. The meta line is `Sep 8`, with ` · ↻` added for a rewatch.
- **`/life/films/undated/`** holds films Onur marked as watched without a diary date (Letterboxd `watched.csv`). It is one strip, in alphabetical order, with the title only. The page doesn't exist when there are no undated films.
- **Rewatches.** A film watched twice appears twice, once per diary entry.

### 1.3 `/life/books/`

- **"Reading now"** is the first row: the currently-reading shelf in shelf order. Its caption is title · author, with no date.
- **Read books.** Then come year and month rows by read date, newest first. The caption is title, then the meta lines author and `Sep 25`.
- **"Undated"** is the last row: read books with no read date, in shelf order, captioned title · author.
- **Titles.** A series suffix such as `(Harry Potter, #7)` is dropped from the caption, and the full title goes in the tile's `title` attribute.

### 1.4 `/life/theatre/`

- **Rows.** There is one row per year, newest first. The label holds the Doto year and `<n> plays`. The oldest backfilled year (2015) adds a second muted line, `and earlier`.
- **Strip.** Each row has one strip, in activity order (newest first). The caption is the play title and the meta line is the company or stage (`Ankara Devlet Tiyatrosu`).
- **No months.** There is no month grouping, by decision.

### 1.5 `/life/saved/`

There is one list in the content area, with no year rows. Each item is a row on the site grid (`reading-list.html` option 3):

| Column | Content |
|---|---|
| Label | Site name, then `<n> min` (muted, 10px). |
| Content | The title (Plex Sans 500, 15px), then the description clamped to 2 lines (fg-soft). |
| Action | A 16:10 image, 104px wide. It falls back to the Dither tile with the site's initial. |

- **Link.** The whole row links to the article.
- **Order.** The list keeps Instapaper's own order (the order of the profile page).
- **Description.** The enriched `og:description` is used when present, otherwise Instapaper's description. Whitespace is collapsed, and a description that only repeats the title is dropped.
- **Small screens.** Below `md`, the image sits above the title at full width (16:10), and the site and length move under the title.

### 1.6 Life home (`/life/`)

- **"All" links.** The Films, Books and Saved sections now link "All →" to `/life/films/`, `/life/books/` and `/life/saved/`. The section's source label stays ("Films · Letterboxd").
- **Saved section.** It shows the latest **5** articles. It shows 15 today, and the full list now has its own page.
- **New Theatre section.** It comes after Books and shows the latest 6 plays as a cover row, like Films. Its label is "Theatre · tiyatrolar.com.tr" and its action is "All →" to `/life/theatre/`.
- **Boot readout.** A new line, `last play: <title>`, goes right after `last watched:`, and only when there is a play.
- **Writing** is hidden while the writing source has no items. The source stays registered and is picked up again automatically when w00f.org publishes. An empty or 404 feed must not be counted as a sync error in that state; see §2.6.
- **Section order:** Films, Books, Theatre, Saved, Notes, Writing, Photos.

## 2. Data

### 2.1 `life_log` table

The Films and Theatre archives must outlive their upstream windows: RSS keeps 50 entries, and the activity feed pages back slowly. They go into one append-mostly table:

| Column | Type | Notes |
|---|---|---|
| `source` | text | `letterboxd` or `theatre`. Part of the primary key. |
| `key` | text | A stable per-source key (below). Part of the primary key. |
| `occurred_on` | date, nullable | The watch date. For theatre, Jan 1 of the year. Null means undated. |
| `precision` | text | `day`, `year` or `none`. |
| `data` | jsonb | The display fields (below). |
| `first_seen_at` | timestamptz | When the row was first written. |
| `updated_at` | timestamptz | When the row was last written. |

The migration only adds the table (expand-only), like the Sprint 9 `notes` table.

**Films rows.**
- `key` = `<watched YYYY-MM-DD or "undated">|<normalised title>|<release year>|<n>`. The `n` counts same-key duplicates, so a film watched twice on one day keeps both rows. Normalised means NFC, lower-case, with whitespace collapsed.
- `data` = `{ title, year, link, poster, rewatch }`. `poster` may be empty until enrichment fills it (§2.3).

**Theatre rows.**
- `key` = the activity post id (for example `1481396`).
- `data` = `{ title, slug, company, poster, link, andEarlier }`. `andEarlier` is true only on the 2015 bulk group.

### 2.2 Films: import and sync

**One-time import.**
- **Command:** `npm run import:letterboxd <export.zip>`, run by the controller against production `DATABASE_URL`. The script reads the zip directly.
- **`diary.csv`:** each row becomes a `day` row. Its columns are Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags and Watched Date; the rating is ignored.
- **`watched.csv`:** each film there that has no diary entry becomes a `none` row (undated).
- **Idempotent:** re-running it upserts by key and changes nothing.

**Ongoing sync.**
- The `letterboxd` source keeps all 50 RSS items in its snapshot. Today it keeps 6; the Life home slices 6 itself.
- After a successful sync, an archive step upserts every RSS item into `life_log` by the same key. RSS items carry posters, so they fill or refresh `poster`.
- The CSV and RSS keys agree because both use watched date, title and release year.

### 2.3 Films: posters

Imported rows have no poster. The archive step after each Letterboxd sync fills up to **30** rows whose poster is empty, newest first:
- resolve the entry's film page: follow the boxd.it `Letterboxd URI` redirect and read only the `Location` header, which contains `/film/<slug>/`;
- fetch `https://letterboxd.com/film/<slug>/`;
- read the JSON-LD `image`, rewritten to the 230×345 crop.

Notes:
- **Requests.** Film pages answer plain server requests (checked 2026-10-05), but profile pages return 403. So the script never fetches a profile page body.
- **Failures.** A failed lookup leaves the poster empty and moves on. Failures are counted in the sync result, never thrown.
- **Throughput.** At the 3-hour Letterboxd interval, 798 posters take about 3 days. To finish sooner, the import script can pass `--posters` to fill all posters in one run, with 1 request per second.

### 2.4 Theatre source

A new source, `theatre`, with a daily interval:
- **Fetch.** It POSTs to `https://tiyatrolar.com.tr/posts/load_more_user_item_via_ajax/` with the profile's parameters (`username=onursenture`, `user_id=1702`, `page=activity`, `limit=5`, `offset=n`). Each call returns 5 activity items as an HTML fragment, plus `html_btn` (whether more remain) and `new_offset`. This is the endpoint behind the profile's "Daha fazla yükle" button. `robots.txt` allows everything.
- **Parsing.** It keeps only "tiyatro izledi" posts and parses:
  - the post id;
  - the relative time;
  - the play title (`h6`, text before the `.wall_extra_info` span);
  - the company (the span text after ` / `);
  - the play URL and slug;
  - the poster (`-41x59` stripped, which gives the full-size image).
- **Incremental.** It stops at the first page that contains an already-known post id, after at most 10 pages per run. The snapshot holds the watches from the pages read; it is for health and debugging only.
- **Archive step.** It inserts unknown post ids into `life_log` as `year` rows. The year is computed from the relative time at the moment of the sync: today in Europe/Istanbul, minus `n` of the unit (`dakika`, `saat`, `gün`, `hafta`, `ay`, `yıl`), and then that date's year. So "3 gün önce" on 2 January gives the previous year. An existing row is never re-dated.
- **Backfill.** The 77 current watches come from a committed file, `content/theatre-history.ts`. A one-off script produces it from a full crawl, and Onur checks the years once (Task 1). The archive step seeds `life_log` from this file whenever a row is missing, so the file is the source of truth for history. **Onur can correct a year by editing the file**: the seed overwrites rows whose key is in the file.

### 2.5 Books

The `goodreads` source fetches every page of the read shelf (`&page=n`, 100 per page, until an empty page), not only the first.
- **Snapshot.** It keeps all read books (about 151, a small payload) and up to 10 currently reading.
- **Home.** The Life home slices the latest 5 read itself.
- **Dates.** Each book gets two fields: `readAt`, which is `user_read_at` and may be null, and `addedAt`, the shelf-add date.
  - The archive groups by `readAt` only. A book without one is undated, because the shelf-add date isn't a read date.
  - The Life home keeps today's ordering: `readAt`, falling back to `addedAt`.

### 2.6 Saved and `link_enrichments`

- **Paging.** The `instapaper` source fetches every profile page (`?page=n` while `has_next`), at most 10. It keeps every liked bookmark; the home slices 5.
- **`link_enrichments` table.** This is the table from the foundation spec: `url` (pk), `title`, `description`, `image_url`, `image_width`, `site_name`, `fetched_at`, `error`.
  - **When.** After each Instapaper sync, the enrichment step fetches up to 10 URLs that have no row, or whose row errored more than 7 days ago.
  - **What it reads.** `og:image` (with `og:image:width` when given), `og:description` and `og:site_name`, from the first 300 KB of HTML, with an 8 s timeout.
- **Image rules.**
  - An image narrower than 400px (by `og:image:width`, or by a known small-avatar pattern such as `128x128` in the URL) is dropped, and the row shows the Dither fallback.
  - An image is only used if it is `https:`.
  - Images are hot-linked, like the posters.
- **Writing source.** A 404 or empty w00f.org feed is recorded as **ok with 0 items**, not as an error, and the section hides. The "0 items while a good snapshot exists" guard still applies once posts exist.

### 2.7 Reading and caching

**Reads.** Pages read `life_log` and `link_enrichments` through cached functions, the same pattern as `readSource`:
- `readLifeLog(source)` uses the tag `life:<source>`;
- `readEnrichments(urls)` uses the tag `enrichments`.

**Revalidation.** The sync route revalidates `source:<id>` as today. It also revalidates `life:letterboxd`, `life:theatre` or `enrichments` whenever the archive or enrichment step wrote rows.

**Fixture mode** (`SOURCE_FIXTURES=1`) serves committed fixtures for both. They include an undated film, a rewatch, a 2015 "and earlier" theatre group, and a Saved item without an image.

**Year pages.** `/life/films/<year>/` is rendered on demand and cached. It has no `generateStaticParams`, because the years live in the database.

### 2.8 Hardening (carried follow-ups)

These are the personal-layer items from the S2 and S3 follow-up files that still apply:
- **URL validation.** Upstream URLs (links, images) must be http(s) before rendering; anything else is dropped.
- **`fetchText` headers.** `fetchText` merges `Headers` instances and tuple arrays, not only plain objects.
- **Goodreads `<br>`.** Goodreads review and description `<br>` tags become newlines before `.text()`, so paragraphs don't glue together.
- **Instapaper.** A bookmark with a bad field is skipped, not fatal to the whole parse.
- **GitHub.** The heatmap uses the `contributionLevel` enum instead of matching colours, and GraphQL `errors[0].message` is surfaced in the sync error.
- **Moot items.** Panel counts and dashboard items are moot since Sprint 4. Rating aria-labels are moot because there are no ratings.

## 3. Admin

There is no new editor. The **Sources** panel lists `theatre`. For `letterboxd`, `theatre` and `instapaper`, it shows the result of the last archive or enrichment step (rows added, posters filled, failures) next to the snapshot health.

## 4. Onur's inputs (plan Task 1)

1. **Letterboxd export.** In Letterboxd, go to Settings → Import & Export → Export your data and send the zip. The controller runs the import and the poster fill.
2. **Theatre years.** Check `content/theatre-history.ts`: 77 rows of title, company and year, with 2015 marked "and earlier". Edit any wrong year.

## 5. Testing

**Unit tests:**
- the Letterboxd CSV parse (diary and watched; rewatch; duplicate keys on the same day);
- RSS–CSV key agreement;
- the poster resolver against recorded HTML;
- theatre fragment parsing;
- relative time → year, including the year boundary in January;
- theatre incremental stop;
- seed-overrides-row;
- Goodreads paging and undated books;
- Instapaper paging and the skip-bad-bookmark rule;
- the enrichment parse, with the small-image drop;
- month and year grouping and real counts;
- year-index links;
- the Writing empty-is-ok rule.

**e2e (fixtures):**
- every new route returns 200;
- `/life/films/1999/` returns 404;
- the year index navigates between years;
- tiles link upstream;
- the Life home "All →" links and the Theatre section;
- the readout `last play:` line;
- Writing is hidden when empty.

**Visual (controller):** every page at 1280px and 390px, with real data on production after the merge. That covers Dither fallbacks, long Turkish titles, the two-line clamp, and the 2015 "and earlier" label.

## 6. Risks and spikes (plan Task 2)

- **The boxd.it redirect** might need a browser user agent, or redirect to a profile URL that 403s on the follow. Read only the `Location` header (`redirect: "manual"`). The fallback is a slug guessed from the title and year, checked on the film page.
- **Hot-linked tiyatrolar posters.** Check that they load from a non-tiyatrolar referrer in a real browser (the CDN sends `cache-control: public`).
- **The ajax endpoint** might want a session cookie in some cases. Check it from a Vercel function, not only locally.
- **Next 16.** Check caching of on-demand year pages under `cacheComponents` (see the Sprint 9 lessons: prove it by reproduction).

## 7. Out of scope

- Ratings and reviews.
- Letterboxd lists and watchlists.
- Bluesky cross-posting.
- The paddle effect and other Sprint 11 polish.
- Per-photo changes. Photos stay as they are.
- An admin editor for archive rows. Theatre corrections go through the committed file.

## Errata (implementation)

- `/life/films/<year>/` uses `generateStaticParams`. It returns the years that have films, or `undated` as a placeholder when there are none, because `cacheComponents` needs one param; this is the notes routes' pattern. The spec said "no generateStaticParams".
- Saved titles use `type-lead` (Plex Sans 20). The mockup's 15px isn't a type class, and type comes only from `type-*`.
- The theatre snapshot (health only) is never empty on a healthy feed, and the archive step ignores watches that are already known. How `theatre.fetch` crawls is in the Theatre bullet below.
- `life_log` upserts collapse duplicate (source, key) rows within a batch before writing (`lib/life-log/collapse.ts`: data merged in batch order, date from the last occurrence), and incoming `data` goes through JSON semantics (undefined fields dropped), so the memory and Drizzle stores behave identically and Postgres never sees a key twice in one statement.
- Films posters: a failed lookup stamps `posterTriedAt` on the row; `fillPosters` skips rows tried less than 7 days ago, so permanent failures don't block older films. The import script's `--posters` loop stops when a batch has no candidates. (Narrowed by the time-budget bullet below: only a real miss stamps.)
- Theatre: `theatre.fetch` returns every watch on the pages it crawled (known ones included) and stops at the first page holding a known id (history ids + `life_log` keys); it throws only when the crawl finds no watches. The archive step tags `life:theatre` whenever the history re-seed or the fresh upsert touched rows; since the re-seed counts as updated, the theatre tag fires on every run. `andEarlier` is no longer stored in `content/theatre-history.ts`: `historyRows()` derives it as "the oldest year in the file", so a corrected year moves the flag automatically.
- The Life home caps (Saved 5, Theatre 6) are covered by unit tests (`tests/sections/home-caps.test.ts`) instead of a fixture e2e that couldn't fail.
- Sync time budget (final review I1). `syncAll` and `syncSource` take a `deadline` (epoch ms; the routes and the admin Sync now use `Date.now() + 45_000`) and pass it to archive steps in `ArchiveArgs`. `syncAll` doesn't start a due source with under 10 s left: it reports it `skipped` (`reason: "deadline"`) and it stays due. `fillPosters` and `enrichPending` stop before an item that might not finish by the deadline, and each request's timeout is capped at the time left. `resolvePoster` returns `found` / `missing` / `error`; only `missing` (no slug, no image, a non-2xx) stamps `posterTriedAt`, so an aborted lookup or a network error is retried next run. Batches are 15 posters (was 30) and 5 enrichments (was 10) a run; the import script passes no deadline. Revalidation is per result: `syncAll` takes `onResult`, which the sync route and Sync now wire to `revalidateResults([result])`, and `syncResponse` no longer revalidates. A failed archive-note write is logged and never fails the sync (M1). The two-pass sync (fetch everything, then archive) is a follow-up.
- Remote images (I2). Archive tiles, the Theatre home row and the Saved list render remote images through the client `RemoteImage` (`components/life/archive/remote-image.tsx`): `referrerPolicy="no-referrer"`, and it swaps to `TileFallback` on `onError`, or when a ref callback finds the image complete with no pixels (an error that fired before hydration). `Cover` is unchanged. The fixture e2e answers the Disclosure Day poster and the Jurassic Park og:image with a 404 and asserts the fallback.
- Theatre history at read time (I3). `readLifeLog("theatre")` merges `historyRows()` into the database rows (`mergeTheatreHistory`): database rows by key, the file's year (`occurredOn`, `precision`) and `andEarlier` winning for history ids, database-only rows kept. It does this with no database and when the read fails too, but not in fixture mode. The archive-step re-seed is unchanged.
- Films (M3). `filmArchive` drops an undated row when a dated row has the same normalised title and release year, so a film logged in the diary after the import doesn't show twice.
- Enrichments (M8). `readEnrichments()` reads every row and takes no URL argument (§2.7 had `readEnrichments(urls)`); there are tens of rows.
