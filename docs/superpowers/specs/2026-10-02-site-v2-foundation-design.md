# Site v2 Foundation — Design Spec

## Overview

onursenture.com moves from Eleventy on GitHub Pages to Next.js on Vercel. The main goal is a repositioning: today the site is almost entirely personal (films, books, photos, saved articles). v2 leads with Onur's professional work (portfolio, career, resume, booking). The personal layer stays, because it reflects who he is, but it moves to second place.

This spec covers the **foundation**: the decisions, the architecture, the shared mechanics (view modes, theme, admin layer, external sources, images), the migration and launch, and the sprint roadmap. Feature areas with their own design depth (visual direction, portfolio, admin capabilities, Instapaper cards, theatre) each get a separate spec → plan → implementation cycle, as the roadmap below says.

## Decisions

| Topic | Decision |
|---|---|
| Audience | Mixed, weighted toward **full-time roles** (recruiters, hiring managers). Freelance/consulting stays open. Mentoring and intros are secondary. |
| Content storage | **Hybrid.** Long-form, authored content lives in the repo as MDX. Short, frequent, admin-written content lives in Postgres. |
| Dashboard vs admin | **Layered.** Dashboard mode is public. When Onur signs in, the same dashboard gains write capabilities and private panels. `/admin` is only for sign-in and rare settings. |
| Language | **English only.** Turkish content (theatre titles, some notes) is shown as-is and marked with `lang="tr"`. |
| Information architecture | **Two-tier home page plus a personal hub.** Nav: **Work · Lab · Resume · Notes · Life**, plus a "Book a call" action. |
| Framework | **Next.js App Router** on Vercel. |
| Styling | **Tailwind CSS v4** with design tokens as CSS variables. |
| Database | **Neon Postgres** with **Drizzle ORM**. |
| Auth | Single user. **GitHub OAuth**, allowlisted to Onur's GitHub user ID. |
| Vercel plan | **Hobby.** Scheduled jobs run on GitHub Actions, not Vercel Cron. |
| Images | Authored-time optimization script (sharp). No dependency on Vercel's image optimization quota. |

## Information Architecture

- **Home (`/`)**, two tiers:
  1. *Professional:* a short intro (who, what, track record), selected work, a career timeline, and a "Book a call" call to action.
  2. *Off the clock:* a thin strip at the bottom with the current book, the latest film or play, the latest note, and one photo. It links to `/life`.
- **Work (`/work`, `/work/[slug]`)**: career case studies (PrimeTek, Orkestra). The portfolio is the most important area of the site and gets its own design spec (S4).
- **Lab (`/lab`, `/lab/[slug]`)**: "just for fun" side projects.
- **Resume (`/resume`)**: a dynamic resume rendered for the web, with a PDF export.
- **Notes (`/notes`)**: micro posts. The w00f.org (Bear Blog) feed is also listed here as long-form writing; the blog itself stays on w00f.org.
- **Life (`/life`)**: the personal hub. It holds every personal widget: films (Letterboxd), books (Goodreads), theatre, saved articles (Instapaper), photos, and GitHub activity.
- **Photos (`/photos/[slug]/`)**, **Changelog (`/changelog`)**, **Feed (`/feed.xml`)**.
- **Book a call**: a cal.com embed with two primary event types, "Role / hiring conversation" and "Project / freelance", plus a secondary "Mentoring / intro".

A nav item appears only once its section ships.

## Architecture

### Core principle

Every section is **one typed data function plus two presentational components**. The page picks the renderer based on the view mode. Data is written once; only the presentation exists twice. The dashboard is a different reading of the same site, not a second site.

### Directory layout

```
app/
  [view]/              all public routes; generateStaticParams → ['site', 'dashboard']
                       (middleware rewrites /work → /site/work or /dashboard/work)
  admin/               sign-in + rare settings
  api/
    auth/              GitHub OAuth (Auth.js)
    sync/[source]/     source sync endpoint (secret-protected)
  feed.xml/route.ts    RSS, same URL as today
content/               long-form content, MDX, in git
  work/*.mdx           case studies
  lab/*.mdx
  changelog/*.mdx
  photos/*.mdx
  resume.ts            resume base data (until admin overrides exist)
lib/
  sources/             one module per external source (fetch + parse + zod schema)
  db/                  Drizzle schema + queries
  content/             MDX loaders + zod frontmatter validation
  images/              image manifest reader
components/
  sections/<name>/     data.ts (server) · Site.tsx · Dashboard.tsx
  ui/                  design-system primitives
scripts/
  images.ts            image optimization (npm run images)
public/
  images/              optimized image outputs
  favicon.ico, keybase.txt
```

### Repo strategy

- v2 is built from scratch on a long-lived **`v2` branch** in this repo. Git history is kept.
- Vercel builds a preview for every push to `v2` and to feature branches.
- `master` and GitHub Pages stay live and untouched until launch.
- At launch, `v2` merges into `master`.
- The old SCSS and Nunjucks templates are **not** ported. v2 is a redesign.

### Data flow

- **MDX content** is read at build time and rendered as static pages.
- **External sources** are synced into Postgres snapshots by a scheduled job. Pages read from those snapshots, never from upstream (see External Sources).
- **Database content** (notes, resume overrides, settings) is read at render time with cache tags. An admin write calls `revalidateTag` for the affected tags, so the change shows up immediately.

### Database tables (initial)

| Table | Purpose |
|---|---|
| `source_snapshots` | `source` (pk), `payload` (jsonb), `last_success_at`, `last_attempt_at`, `last_error`, `item_count` |
| `link_enrichments` | `url` (pk), `title`, `description`, `image_url`, `site_name`, `reading_minutes`, `fetched_at`. Used by the Instapaper cards. |
| `notes` | micro posts (added in S7) |
| `resume_overrides` | admin edits on top of `content/resume.ts` (added in S7) |
| `settings` | key/value admin settings (added in S7) |

## View Mode, Theme and Admin Layer

### Two independent axes

| Axis | Values | Stored in | Applied by |
|---|---|---|---|
| Theme | `light` · `dark` · `system` | cookie | An inline `<head>` script sets `data-theme` before first paint, so the page never flashes the wrong theme |
| View | `site` · `dashboard` | cookie; `?view=dashboard` also sets it | Middleware reads the cookie and internally rewrites `/x` to `/site/x` or `/dashboard/x` |

- All public routes live under a single `app/[view]/` segment, prerendered for both values with `generateStaticParams`. (Two route groups would not work, because they would resolve to the same URLs and conflict.) Pages receive `view` as a param and pick the renderer. They never read the view cookie, because that would force dynamic rendering.
- The internal prefixed URLs are never shown to users. Middleware redirects direct requests for `/site/...` or `/dashboard/...` to the clean URL.
- Switching view sets the cookie and refreshes the route. The View Transitions API animates the swap.
- `?view=dashboard` gives a shareable link that opens directly in dashboard mode.
- The header holds both toggles.

### Visibility

Each section declares `visibility: 'both' | 'dashboard'`. Dashboard-only examples:
- yearly stats (books, films, plays)
- detailed GitHub activity
- a "now" status
- the site's own changelog feed
- a denser career timeline

On mobile, the dashboard becomes a dense card stack.

The dashboard mode is also a portfolio piece in itself: it shows the dashboard design language Onur built at PrimeTek.

### Admin layer

- **Auth:** GitHub OAuth through Auth.js, accepting only Onur's GitHub user ID. The session lives in an httpOnly cookie.
- **Rendering:** admin UI (compose box, inline edit, drafts, private panels) renders inside Suspense-wrapped dynamic holes (Next.js Cache Components / Partial Prerendering). For visitors the holes render nothing, and the static shell is unaffected.
- **Security:** every mutation is a Server Action that checks the session on the server. Private panel data is only returned to authenticated requests. Hiding something in the UI never counts as protection.
- **Site mode, signed in:** a thin admin bar appears ("Compose", "Edit this page"). The main workspace is the dashboard mode.
- The exact admin capabilities are decided in S7. This spec only fixes the mechanism.

## External Sources

### Sync model

```
GitHub Actions (cron) ──► POST /api/sync/[source] (SYNC_SECRET)
                             ──► fetch upstream ──► zod validate
                             ──► upsert source_snapshots ──► revalidateTag(source)
Page render ──► read snapshot from Postgres
```

- **Last-known-good:** a failed sync leaves the existing snapshot untouched, records `last_error` and `last_attempt_at`, and returns a non-2xx status. If no snapshot exists yet, the data function returns the empty shape and the widget handles it. This keeps today's fail-soft contract and makes it stronger: a flaky upstream no longer blanks a widget.
- **Health:** the dashboard shows when each source last synced ("Letterboxd · 2h ago"). The admin layer adds a source-health panel built from `last_error` and `item_count`.
- **Schedule:** a GitHub Actions workflow runs hourly and calls each source whose interval is due:
  - Instapaper, GitHub: every hour
  - Letterboxd, Goodreads, w00f.org: every 3 hours
  - theatre: daily
- The endpoint also accepts `?force=1`, used by `workflow_dispatch` and after deploys.

### Sources

| Source | Status | Notes |
|---|---|---|
| Letterboxd (`letterboxd.com/onur/rss/`) | port | Same parsing as today, rewritten in TypeScript with a zod schema |
| Goodreads (RSS, user `8143905`) | port | Same, including the read-date sort |
| w00f.org (`/feed/`) | port | Same |
| GitHub (GraphQL, `GH_PAT`) | port | Same, including the contribution-level mapping |
| Instapaper (`instapaper.com/data/profile/w00f`) | port + **enrich** | For each liked article, fetch `og:image`, description, site name and estimated reading time once, and store them in `link_enrichments` keyed by URL. The card redesign (S8) depends on this. |
| tiyatrolar.com.tr (`/u/onursenture/izlediklerim`) | new (S8) | Inspect the page structure and robots rules first. If the page is client-rendered, look for the JSON endpoint behind it, as with Instapaper. |
| Bluesky | later, outbound | Optional cross-posting (POSSE) of notes through the AT Protocol, with an app password. This is a target, not a source. |
| cal.com | embed | Not a source. A webhook into the admin layer is possible later. |

Every parser has Vitest tests against saved sample responses (fixtures), so an upstream format change breaks a test, not the site.

## Images

The portfolio will be image-heavy. Optimization therefore happens once, when an image is added, not on Vercel's per-request quota.

- `npm run images` (sharp) takes a source image and writes several widths (640 / 1280 / 2560, capped at the source width), each as **AVIF and JPEG**, into `public/images/...`. It records the dimensions in a manifest.
- A `<Picture>` component builds `srcset` and `sizes` from the manifest and always emits `width` and `height`, so there is no layout shift.
- It replaces today's manual `sips` / `avifenc` / `mozjpeg` flow. The output targets stay the same: AVIF at about q60 4:2:0, JPEG at about q82 progressive.
- Remote images from sources (book covers, film posters, `og:image`) are rendered with plain `<img>` tags with explicit dimensions. They do not go through optimization.

### Social metadata

The existing conventions carry over:
- The OG image is always a **JPEG**, never AVIF, with an absolute URL.
- Pages with no real image omit `og:image` and use `twitter:card = summary`.
- Photos and case studies (through their cover image) get `summary_large_image`.

## Migration and Launch

### URL preservation

- `trailingSlash: true`, so `/photos/<slug>/` URLs keep working.
- `/feed.xml` keeps its URL. Its content becomes notes plus photos.
- `favicon.ico` and `keybase.txt` move to `public/`.

### Launch scope (the "presentable professionally" line)

| In launch (S6) | After launch |
|---|---|
| Two-tier home, Work (the PrimeTek series plus selected Orkestra work), Lab, Resume (web + PDF), Book a call, Life (ported widgets), photos, feed, theme and view toggles | Admin layer, Notes, theatre, Instapaper cards, changelog, paddle effect |

Until the admin layer ships, the resume reads only from `content/resume.ts`.

### Cutover steps

1. Set the Vercel env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `ADMIN_GITHUB_ID`, `GH_PAT`, `SYNC_SECRET`.
2. Configure the sync workflow in GitHub Actions: the secret `SYNC_SECRET` and the repository variable `SITE_URL`. (The workflow lives on `master`, because GitHub only runs scheduled workflows from the default branch.)
3. Run a forced sync of every source against production, and confirm all snapshots are populated.
4. Add `onursenture.com` in Vercel. **Onur** updates the DNS records at the registrar.
5. Merging `v2` into `master` removes the GitHub Pages deploy workflow and `CNAME` (`v2` already deleted both). GitHub Pages keeps serving its last deployment until DNS moves to Vercel. After DNS has propagated, disable Pages in the repository settings.

## Roadmap

Onur and Claude design together, using Mobbin MCP, Figma MCP and reference sites Onur shares, and subagents build. The sprints in the table below run in order, with no separate design and platform tracks. The early sprints don't block each other.

> Revised 2026-10-03 (Sprint 4): sprints are named "Sprint N"; the S1 direction and the dashboard view were replaced (see `2026-10-03-sprint-4-visual-direction-design.md`).

| Sprint | Contents |
|---|---|
| Sprint 4 | This spec |
| Sprint 5 | Work I: PrimeTek, with placeholder media |
| Sprint 6 | Work II: Orkestra and Lab |
| Sprint 7 | Admin: GitHub auth, media upload into placeholder slots, simple page editing |
| Sprint 8 | Resume, Book a call, launch |
| Sprint 9 | Notes |
| Sprint 10 | Personal layer and Life sub-pages |
| Sprint 11 | Polish: changelog, paddle effect, Konami easter egg, performance and accessibility |

Priority within the roadmap is intentional. The professional core (portfolio, resume, booking) is what the site exists for. Personal touches come last and can always be added later.

### Content inventory (can start now, in parallel)

Sprint 5 (Work I) and Sprint 6 (Work II) will be blocked by material, not code. Placeholders unblock them: each case study can ship with `MediaPlaceholder` slots, and Sprint 7's upload swaps real media in. For each project, gather:
- Figma links
- old screenshots and exports
- the year(s)
- Onur's role
- the team size
- anything that shows the project was ahead of its time

**Internal note:** where PrimeTek material is missing or forgotten (for example premium admin dashboards with no Figma history), mine the PrimeVue, PrimeNG and PrimeReact X accounts. They document years of Onur's work.

### Per-sprint cycle

1. Brainstorming (when the sprint has open design questions) → a spec in `docs/superpowers/specs/`.
2. `writing-plans` → a task-level plan in `docs/superpowers/plans/`.
3. `subagent-driven-development`: a fresh subagent per task, with review between tasks.
4. A code review over the whole sprint diff.
5. Onur checks the Vercel preview → merge into `v2` (into `master` from launch onward).

## Testing and Verification

There are no tests today. v2 adds them, because subagent-driven work needs objective gates.

- **Vitest:**
  - source parsers, against fixtures
  - MDX frontmatter schemas
  - resume composition (base data + overrides)
  - sync behavior: a failure keeps the previous snapshot
- **Playwright smoke tests:** key routes × both view modes × both themes. Each route renders without errors, the toggles switch and persist, and admin holes render nothing when signed out.
- **CI on every PR:** typecheck, lint, Vitest, and Playwright against a local production build (no database, so the empty states are exercised). A task is done only when everything is green.

## Out of Scope for This Spec

These are deliberately left to their own sprint specs:
- the visual language (S1)
- the case study template and portfolio narrative (S4)
- the exact admin capabilities (S7)
- the Instapaper card design and the theatre source details (S8)
- the changelog format (S9)
