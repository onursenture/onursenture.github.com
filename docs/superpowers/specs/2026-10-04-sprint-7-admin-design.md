# Sprint 7: Admin — Design Spec

## Overview

Sprint 7 adds the admin layer the foundation spec reserved (`2026-10-02-site-v2-foundation-design.md`, "Admin layer"). Onur signs in with GitHub and edits the site's professional content himself:
- the product pages: header, facts, Live links, blocks (add, remove, reorder), images (upload into the slots), pins;
- new product pages, and removing one;
- the home's Lab rows, bio and Experience;
- the order of Selected work.

The admin home also shows which documents have an unpublished draft and the health of the external sources, with a "Sync now" button.

The decisions come from a brainstorm with Onur on 2026-10-04. The editor mockup is `2026-10-04-sprint-7-mockups/editor-layout.html`; option A is chosen.

## Decisions

| Topic | Decision |
|---|---|
| Storage | **Postgres (Neon) for content, Vercel Blob for images.** A publish is live in seconds; no commit, no deploy. |
| Content shape | **Document overlay.** One `content_docs` row per editable unit, each with a `draft` and a `published` JSON. A published row wins; without one the repo's typed content is used. The repo content stays as the seed and the no-database fallback. |
| Publishing | **Draft, preview, publish.** Edits autosave to the draft; the preview renders the draft with the real components; Publish makes it live. Discard draft and Reset to repo version exist. No version history. |
| Editor | **`/admin/`, two panes (mockup option A):** a form column with blocks as collapsible, draggable cards on the left, the live draft preview on the right. Public pages stay fully static. |
| Image ratio | **16:10 only.** An upload that is not 16:10 (±1%) or narrower than 1280px is rejected with the reason. |
| Scope | Product pages, new and removed pages, Lab, bio, Experience, Selected work order, a drafts summary, source health with Sync now. |
| Auth | Single user. **Hand-written GitHub OAuth** (no Auth.js), allowlisted to `ADMIN_GITHUB_ID`, session in a signed httpOnly cookie. |

## 1. Documents

### 1.1 Table

`content_docs` (Drizzle, `lib/db/schema.ts`):

| Column | Type | Notes |
|---|---|---|
| `key` | text, primary key | see 1.2 |
| `draft` | jsonb, null | the unpublished edit; null when there is none |
| `published` | jsonb, null | the live value; null means "use the repo" |
| `draft_updated_at` | timestamptz, null | optimistic concurrency for autosave (§4.4) |
| `published_at` | timestamptz, null | shown in the admin |

The migration is additive (expand only), so a preview deploy sharing the production database is safe.

### 1.2 Keys and shapes

| Key | Shape | Repo fallback |
|---|---|---|
| `work/<slug>` | `ProductPage` | `content/work/<slug>.ts` |
| `work-index` | `{ slugs: string[] }`, the registry order | `productPages` order |
| `pins` | `{ order: { slug: string; imageId: string }[] }` | derived from the repo's `pin.order` |
| `lab` | `LabEntry[]` | `content/lab-index.ts` |
| `profile` | `{ lead: { strong; rest }; bio: BioSegment[][] }` | the same fields of `content/profile.ts` |
| `experience` | `ExperienceEntry[]` | `content/experience.ts` |

Every shape has a zod schema in `lib/content/schemas.ts`. The TypeScript types in `content/` become `z.infer` of these schemas, or are checked against them with a type-level test, so the repo content and the database can't drift apart in shape.

Type changes that follow from the overlay:
- `WorkSlug` becomes `string` (validated as kebab-case), since pages can now be created at runtime.
- `Pin` loses `order`: `{ title; note }` stays on the image; the order lives in the `pins` document. A pinned image missing from `pins.order` is appended at the end; an entry in `pins.order` whose image is gone or no longer pinned is skipped.
- The repo pages keep their content; their `pin.order` values move into the repo fallback of `pins` (`content/pins.ts`).

### 1.3 Reads

All public reads go through one module per area, as today: `lib/work/` (`getProductSlugs`, `getProductPage`, `getPins`, `getExperience`), plus `lib/content/` for Lab and profile. They become async `"use cache"` functions with one cache tag, `content`.

Resolution, per key: the row's `published` if present, otherwise the repo value. The registry is `work-index`: a slug in it resolves to its `work/<slug>` document or, failing that, the repo page. A database error (or no `DATABASE_URL`) resolves everything from the repo, so CI, fixtures and local builds behave exactly as today.

`generateStaticParams` returns the resolved slugs. A slug created after the build renders on its first request and is cached.

The image manifest becomes the union of `lib/images/manifest.json` and the `media` table (§3), behind the same `findImage` / `hasImage` interface, read inside the same cached functions.

### 1.4 Writes

- **Save draft** (autosave): writes `draft` and `draft_updated_at`. No validation beyond the zod shape, so a half-finished edit is never lost.
- **Publish**: builds the would-be site (this draft over every other published document over the repo), runs the zod schemas, `validateWork` and the cross-document rules (§1.5). On success it copies `draft` to `published`, clears `draft`, sets `published_at`, and calls `updateTag("content")` so the next request sees it. On failure nothing changes and the errors are returned per field.
- **Discard draft**: clears `draft`.
- **Reset to repo version**: deletes the row (confirmation required). For a page created in the admin there is no repo version; the action is "Delete page" instead (§2.3).

### 1.5 Validation

`validateWork` keeps every current rule (kebab-case unique ids, `columns` 1–3, icons only on `primeicons`, non-empty intro, at least one block, explicit image keys exist, https links, no external links on PrimeTek pages, `then` first with year and body). New and cross-document rules:
- slugs are kebab-case and unique; `work-index` lists each existing page once;
- every Experience `href` of the form `/work/<slug>/` points at a page in `work-index`;
- every page linked from Experience has a `Years` fact (today a build-time throw in `getExperience()`; now a publish error, and the build still throws if the repo fallback breaks it);
- `pins.order` has no duplicates;
- Lab, profile and Experience pass their zod schemas (`start`/`end` are `YYYY-MM`, `end` null or not before `start`).

### 1.6 Ids

Block and image ids stay permanent once published. The editor generates an id in kebab-case from the block heading (or `block-n`) or the image caption (or `image-n`), unique within the page. The id field is editable until the id appears in the page's `published` value (or the repo page when nothing is published); then it shows as locked.

## 2. Admin UI

### 2.1 Routes and shell

`app/admin/` has its own layout (outside `(work)` and `life`), light, on the site tokens and type classes, `noindex`, and disallowed in `robots`. It reads the session (`cookies()`) inside Suspense, which is allowed here and nowhere on public pages.

| Route | Content |
|---|---|
| `/admin/` | Sign-in when signed out; otherwise the admin home |
| `/admin/work/<slug>/` | Product page editor |
| `/admin/work/new/` | New page form |
| `/admin/lab/`, `/admin/bio/`, `/admin/experience/` | List editors |
| `/admin/preview/work/<slug>/`, `/admin/preview/home/` | The draft rendered with the real page components (session required, dynamic, never cached) |

### 2.2 Admin home

- **Content:** product pages in registry order, then Lab, Bio, Experience. A document with a draft shows `◐ draft`; a published one shows its `published_at`.
- **Selected work:** every pinned image in one list (frame thumbnail, title, page), draggable with ↑/↓ buttons too, with its own Publish (the `pins` document).
- **Sources:** each source's last success (relative), last error and item count from `source_snapshots`, and "Sync now", a server action that runs the existing sync runner with `force` for all sources.
- **New page** button.

### 2.3 Product page editor (option A)

A top bar: breadcrumb, save status ("Draft saved 4s ago · N unpublished changes" or "Published"), Discard draft, Open page ↗, Publish. Below it two panes: the form (about 440px) and the preview.

The form:
- **Header:** lead strong and rest, intro, facts (Role, Years, At required; Platform and others optional, reorderable), Live links. On PrimeTek pages the link fields are hidden.
- **Blocks:** collapsible cards with a drag grip, ↑/↓ buttons, kind label, id (with a lock once published) and delete (confirmation; deleting a block with a pinned image warns that its Selected work item goes). "+ Add block" offers `text`, `images`, `then` (only when the page has no then block; it is inserted first) and `icons` (only on `primeicons`, at most one).
  - `text`: heading, body paragraphs (one textarea per paragraph, add/remove), links (hidden on PrimeTek).
  - `then`: year, body paragraphs, sources (hidden on PrimeTek).
  - `images`: heading, columns 1/2/3, image cards (add, remove, reorder).
- **Image card:** the 16:10 slot (thumbnail or placeholder), drop a file or pick one, replace, remove (back to the placeholder), caption, credits (name, role), Pin toggle with title (2–4 words) and note (one line).

Behaviour:
- Autosave about 1s after the last change; the preview iframe reloads after each save and scrolls to the block being edited, which it outlines.
- Publish runs the validation; errors show next to their fields and in a list at the top, and Publish stays disabled while the last validation failed and nothing changed.
- Below 1024px the preview becomes a "Preview" tab.
- Drag and drop uses `@dnd-kit/sortable`; the ↑/↓ buttons are the keyboard path.

**New page** (`/admin/work/new/`): slug (kebab-case, permanent, unique), org, title, kind. It creates the `work/<slug>` document with a header (lead, intro, facts with Role, Years, At pre-filled from the org) and one empty text block, adds the slug to the end of `work-index`, and opens the editor. Nothing is live until the first Publish (the slug enters the published `work-index` then).

**Delete page:** removes the slug from `work-index` and deletes the `work/<slug>` row on publish. Validation blocks it while Experience still links the page.

### 2.4 Lab, bio, Experience

The same two panes; the preview is `/admin/preview/home/`.
- **Lab:** rows with title, description, year, href; add, remove, reorder.
- **Bio:** lead (strong, rest) and paragraphs. An organisation mark is the token `{primetek}` in the text, inserted with a button per org; it parses to the existing `BioSegment` shape. Unknown tokens are validation errors.
- **Experience:** roles (org, role, start `YYYY-MM`, end `YYYY-MM` or "now"), each with product rows (title, note, and either a page from `work-index` or a manual years value). Roles and rows reorder.

### 2.5 Edit link on public pages

When signed in, the public footer shows a small "Edit" link to the matching editor (product page → its editor, home → admin home). A client component reads a non-httpOnly `admin_hint=1` cookie set at sign-in and removed at sign-out; it carries no authority. Public pages never read `cookies()` on the server.

## 3. Media

### 3.1 Upload flow

1. The browser uploads the original directly to Vercel Blob with a client-upload token (`@vercel/blob/client`). The token route (`/api/admin/upload/`) checks the session and allows only `image/png` and `image/jpeg` up to 25 MB. This keeps the file away from the 4.5 MB server-action body limit.
2. A server action `processUpload(blobUrl, slug, imageId)` checks the session, fetches the original and checks it: 16:10 within ±1% and at least 1280px wide, otherwise it returns the reason and deletes the original.
3. It renders the renditions with sharp using the current `IMAGE_SETTINGS` (AVIF q60 4:2:0, JPEG q82 progressive mozjpeg, widths from `widthsFor`), uploads them to Blob as `media/work/<slug>/<imageId>-<hash8>-<w>.<ext>`, and writes a `media` row.
4. The draft's image gets `image: "media/work/<slug>/<imageId>-<hash8>"`. The upload itself is not a draft (it is just an unreferenced file until a published page uses it).

If any step fails, no `media` row is written and the slot keeps its previous image.

### 3.2 `media` table

| Column | Notes |
|---|---|
| `key` (PK) | `media/work/<slug>/<imageId>-<hash8>` |
| `base_url` | Blob URL prefix the renditions share |
| `width`, `height`, `widths` | as in `ImageEntry` |
| `source_hash`, `settings` | as in `ManifestEntry` |
| `created_at` | |

`ImageEntry` gains an optional `baseUrl`; `renditionUrl` uses it when present, otherwise `/images/…` as today. The OG image rule is unchanged (the largest JPEG, absolute URL). Blob URLs are already absolute.

### 3.3 Storage interface

`lib/media/store.ts` has two implementations: Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, and a local one that writes under `public/uploads-dev/` (gitignored) for dev and e2e. Production refuses the local store.

## 4. Auth and security

### 4.1 Sign-in

- `GET /api/auth/signin/` redirects to GitHub's authorize URL with a random `state` (stored in a short-lived httpOnly cookie) and an optional `next` path (only paths starting with `/admin/`).
- `GET /api/auth/callback/` checks `state`, exchanges the code, reads the GitHub user, and compares its numeric id with `ADMIN_GITHUB_ID`. Not allowed: a plain "Not allowed" page, no session. Allowed: sets the session cookie and `admin_hint`, redirects to `next` or `/admin/`.
- `POST /api/auth/signout/` clears both cookies.

### 4.2 Session

A JWT signed with `AUTH_SECRET` (HS256, `jose`) holding the GitHub id, 30 days, in an httpOnly, `Secure`, `SameSite=Lax` cookie scoped to `/`. `requireAdmin()` (`lib/auth/session.ts`) verifies it and the id; every server action, the upload token route and the preview routes call it first. Hiding UI is never the protection.

### 4.3 Environments

Two GitHub OAuth Apps: production (callback on `onursenture.vercel.app`, later `onursenture.com`) and local (`localhost:3000`). Preview deployments have no admin sign-in (a GitHub OAuth App has one callback host); they still show published content because they share the production database.

### 4.4 Concurrency

Single user, last write wins, with one guard: autosave sends the `draft_updated_at` it last saw; if the row is newer (another tab), the save is refused and the editor shows "A newer draft exists — reload".

## 5. Errors

- **No database or a database error:** public pages resolve from the repo (§1.3). The admin shows "Database unavailable" and disables writes.
- **Upload:** wrong ratio, too small, wrong type, too large, or a processing failure shows the reason under the slot; nothing else changes.
- **Session expired mid-edit:** the next save returns 401; the editor shows "Signed out — sign in again", which returns to the same editor. The draft up to the last successful save is kept.
- **Not allowed:** a GitHub account other than `ADMIN_GITHUB_ID` gets "Not allowed" and no cookie.

## 6. Testing

- **Vitest:**
  - document resolution (published row, repo fallback, database error → repo);
  - zod schemas against every repo document (the repo content must parse);
  - publish validation over the merged site, including the cross-document rules;
  - id generation and locking;
  - pins resolution (append missing, skip stale);
  - bio token parsing both ways;
  - upload checks (ratio ±1%, minimum width, type);
  - session signing, expiry and the id check; `requireAdmin` rejecting a missing, forged or foreign session.
  - Database tests run on PGlite, as `tests/sync/drizzle-store.test.ts` does.
- **Playwright:**
  - signed out: `/admin/` shows sign-in, `/admin/work/nebuu/` redirects to it, a preview route returns 401/redirect, public pages render exactly as before and carry no Edit link;
  - the editor flow against a test build: add, reorder and delete a block, upload a 16:10 image and see a rejection for a 4:3 one, publish, and see the public page change. It uses PGlite, the local media store and a test session that is only accepted when `ADMIN_E2E=1` and the build is not on Vercel (`VERCEL` unset); production code refuses it otherwise.
- **Visual checks** after every UI task: both panes at 1440 and the Preview tab at 390, drag mid-transition frozen, the error states.

## 7. Setup (Onur)

The plan walks through these as a controller task:
1. Create the two GitHub OAuth Apps; note the client ids and secrets.
2. Connect a Vercel Blob store to the project (Production and Preview).
3. Set `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `ADMIN_GITHUB_ID` in Vercel (Production) and in `.env.local` with the local app's values.

## 8. Out of scope

- version history and rollback of publishes;
- cleaning up unreferenced Blob files;
- exporting database content back into the repo;
- adding organisations (`ORGS` stays in code);
- editing anything on the Life side, the name, location, social handles or availability;
- Notes, Resume and the booking link (Sprints 8 and 9).

## Errata (implementation)

Where the shipped admin differs from this spec:

- **`work-index` has no draft** (§1, §2 New page / Delete page). A new page's slug is not added to `work-index` when the page is created: publishing an unlisted page appends it, and Delete page removes it from the published `work-index` and drops the `work/<slug>` row in one validated step.
- **Previews render drafts loosely** (§1.5). Publish and public reads are strict, but the preview routes resolve drafts with the loose schemas (`{ loose: true }`), so an unfinished draft still renders before it validates.
- **Local media** (§3.3) lives in `.media-dev/` (or `MEDIA_DEV_DIR`), not `public/uploads-dev/`, behind `lib/media/storage.ts` (not `lib/media/store.ts`), and is served by `/api/media-dev/`. Off Vercel it is the default when `BLOB_READ_WRITE_TOKEN` is unset; on Vercel without a token uploads are off.
- **The session check** (§4.2) is `isAdmin()` / `requireAdminPage()` in `lib/auth/admin.ts`; `lib/auth/session.ts` only signs and verifies the JWT.
- **The admin e2e** (§6) uses a JSON file content store (`CONTENT_STORE_FILE`, `lib/content/file-store.ts`), not PGlite. The database store keeps its own PGlite tests.
- **The toolbar shows no change count** (§2.2): the status reads "Draft saved 4s ago", "Published …" or "Repo version", without "· N unpublished changes".
- Drafts are saved by hand (Save draft, Cmd/Ctrl+S) instead of autosave, per Onur after launch; the preview reloads on save.
- One GitHub OAuth App instead of two: GitHub's OAuth App form now takes up to 10 Redirect URIs, so production and localhost share one app (§4.3, §7).
