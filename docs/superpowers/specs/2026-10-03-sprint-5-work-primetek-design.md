# Sprint 5: Work I, PrimeTek — Design Spec

## Overview

Sprint 5 opens the Work section. It adds the `/work/` index, four PrimeTek case studies (PrimeOne, PrimeBlocks, PrimeIcons, Templates) and an Archive page for PrimeTek work that has no design files and is not fully remembered.

Onur has no time to prepare visuals. Three things make the pages complete without his time:
1. **Placeholders by default.** Every media slot starts as the Sprint 4 labelled dither wash.
2. **Figma as the source.** Onur has copies of the PrimeTek Figma files in his own account. A local script, `npm run figma`, exports chosen frames into the repo's image pipeline. A slot can also link to its Figma frame or embed it.
3. **Live content where it's free.** PrimeIcons 7.0.0 is MIT-licensed, so its page renders the real icon set from the `primeicons` package. Version 8 is not MIT; see §4.1.

The decisions below came out of a brainstorm on 2026-10-03, including two rounds of Mobbin research. Mockups are in `2026-10-03-sprint-5-mockups/`:
- `case-study-layout.html`: layout B is chosen.
- `media-sets.html` and `media-sets-v2.html`: direction 2, Log · Grid · Index.
- `figma-options.html`: 4a, 4b and 4c are all in.
- `work-index.html`: A is chosen.

Every mockup line is draft copy. The Mobbin references are Studio Freight (Grid / List / Zoom and 1X / 2X / ∞ switches), Base (file-like media cards), MOUTHWASH Studio (coded archive thumbnails) and GetYourGuide (viewer counter plus grid toggle).

## Decisions

| Topic | Decision |
|---|---|
| Structure | **One page per product** under `/work/<slug>/`. There is no PrimeTek hub. `/work/` groups the work by org and gives the PrimeTek context once. |
| Pages in Sprint 5 | PrimeOne, PrimeBlocks, PrimeIcons, Templates (one collection page) and Archive (everything else, curated from X posts). |
| Narrative spine | **Release log.** A short summary on top, then the product's evolution as dated entries (version · month · one or two sentences · source post). It needs little prose, and each entry can be checked against an X post. |
| Page layout | **B, wide showcase with sticky years.** A grid header, a full-width hero figure, then year groups whose Doto year stays stuck while the group scrolls. |
| Media | **Sets, not single figures.** Each entry carries 0–N media items. A page shows its media in three views, **Log · Grid · Index**, and they all open one shared full-screen viewer. Media never gets a page of its own. |
| Figma | Every media item may carry a Figma frame reference. It is used three ways: an "Open in Figma ↗" link (4a), a click-to-load embed (4b), and the local export script that fills the image (4c). |
| `/work/` index | **A, index table.** One row group per org: years · title · type · →. |
| Archive | Our own hairline log: date · title · one-line note · `post ↗`, plus an optional media slot. **X embeds are never used.** |
| PrimeIcons | Its Grid view is a **live icon grid** from the `primeicons` package, with search and copy-to-clipboard. The icon count comes from the package. |
| Content storage | Typed TypeScript in `content/work/<slug>.ts`, following the existing `content/*.ts`. No MDX. |
| Copy | Claude drafts every line from sources. Each entry stores its proof URL. Onur confirms on the preview, and unconfirmed lines are cut or rewritten (see [honest numbers](#copy-and-numbers)). |

## 1. Routes and IA

| Route | Contents |
|---|---|
| `/work/` | The index table (§5). |
| `/work/primeone/` | Case study (§3). |
| `/work/primeblocks/` | Case study (§3). |
| `/work/primeicons/` | Case study (§3) with a live icon grid (§4.1). |
| `/work/templates/` | Collection case study (§4.2). |
| `/work/archive/` | The Archive log (§4.3). The URL has no org in it, so Orkestra entries can join in Sprint 6. |

- Every route is statically generated. `generateStaticParams` comes from the content registry. An unknown slug returns the Work-side 404.
- The case study routes live under the existing `app/(work)/` group and use `WorkShell`.
- `lib/nav.ts`: Work becomes `ready: true`. The Sprint 4 e2e follow-ups apply once it does: assert the nav, and use `exact: true` on the Sources heading.
- **Home changes:**
  - `content/work-index.ts` entries gain `href`s to their case studies, and the Work row's "All work →" action turns on.
  - `content/experience.ts`: the PrimeTek children (PrimeOne, PrimeBlocks, PrimeIcons, Templates) get `href`s.
  - Fix the `nebuu` / `Nebuu` casing (use "Nebuu").
- **Metadata:** each page sets its title, description and canonical URL through the existing `lib/metadata.ts` helpers. If a case study's hero has an image, it becomes the OG image (JPEG, absolute URL). Otherwise there is no `og:image`, following the old site's rule.

## 2. Content model

All case-study content is typed data in `content/work/`. A registry, `content/work/index.ts`, exports the case studies in display order plus the archive entries. Every page reads its data only through `lib/work/` functions, so Sprint 7 can add a database overlay in one place.

```ts
// content/work/types.ts
export type WorkSlug = "primeone" | "primeblocks" | "primeicons" | "templates";

export interface FigmaRef {
  fileKey: string;            // from figma.com/design/<fileKey>/…
  nodeId: string;             // "12:345" (the URL's node-id=12-345, normalised)
  embed?: boolean;            // offer the click-to-load embed in the viewer
}

export interface Media {
  id: string;                 // stable, unique per case study, kebab-case; used in ?fig=
  caption: string;
  tags?: string[];            // free tags for Grid filters, e.g. "components", "tokens"
  image?: string;             // image manifest key, e.g. "work/primeone/tokens-overview"
  figma?: FigmaRef;
  aspect?: "16/9" | "16/10" | "4/3" | "1/1";   // default "16/10"
}

export interface Entry {
  id: string;                 // stable, e.g. "3-0"
  date: string;               // "YYYY-MM"
  version?: string;           // "3.0"
  title?: string;             // when there's no version, e.g. a template name
  note: string;               // one or two sentences, draft until confirmed
  source?: string;            // proof URL (usually an X post)
  links?: { label: string; href: string }[];   // e.g. a live demo
  frameworks?: string[];      // Templates only: "Vue", "Angular", "React", "JSF"
  media: Media[];
}

export interface CaseStudy {
  slug: WorkSlug;
  org: OrgId;
  title: string;
  kind: string;               // "design system", "UI blocks", "icon set", "app templates"
  years: string;              // "2022–2026", confirmed
  lead: { strong: string; rest: string };
  intro: string[];            // 1–2 short paragraphs
  facts: { label: string; value: string }[];   // Role, Years, Tools…
  links: { label: string; href: string }[];    // action column, external ↗
  hero: Media;
  entries: Entry[];           // any order in the file; rendered newest first
}

export interface ArchiveEntry {
  id: string;
  org: OrgId;
  date: string;               // "YYYY-MM"
  title: string;
  note: string;
  source: string;             // required: the archive is built from posts
  media?: Media;
}
```

**Derived values** live in `lib/work/` and are pure functions with unit tests:
- **FIG labels.**
  - The hero is `FIG. 01`.
  - Entry media are numbered `FIG. <entry ordinal, 2 digits>.<item ordinal>`, counting from the oldest entry (oldest = 02), so labels stay stable as new entries are added on top.
  - Labels are display-only. URLs use `Media.id`.
- **Filter chips and counts.**
  - Versions (or titles) of entries that have media, each with its media count.
  - Tags, each with its count.
  - "All", the total.
  - Counts are always computed from the data, never hand-written.
- **The Grid set:** all media of a case study in display order, newest entry first.

**Validation.** A Vitest suite loads the registry and asserts:
- ids are unique (media ids within a case study, entry ids within a case study, archive ids globally) and kebab-case;
- dates match `YYYY-MM`;
- every `image` exists in the image manifest;
- `figma.nodeId` matches `\d+:\d+`;
- `source` URLs are `https://`.

A failure breaks CI, not the build.

**Sprint 7 compatibility.** Media and entry ids are permanent once published. Sprint 7's admin writes overrides keyed by `(slug, mediaId)` (image, caption) into Postgres. `lib/work/` merges them over the repo data. Sprint 5 does not build this; it only keeps reads behind `lib/work/`.

## 3. Case study page

### 3.1 Header

The Sprint 4 section grid, `[200px label] [minmax(0,480px) content] [1fr action]`:
- **Label:**
  - `← Work`;
  - the title;
  - muted `kind`, then `PrimeTek · years`.
- **Content:**
  - `lead` in `type-lead` (strong part, then a muted continuation);
  - the `intro` paragraphs in `type-body`;
  - `facts` as a two-column `<dl>`.
- **Action:** `links`, right-aligned, each with `↗`.

Under the header, the **hero** spans the full content width (40px page padding on both sides) at 21/9 on desktop and 16/10 under 768px.

### 3.2 View bar

A hairline-bordered bar under the hero:
- **Left:** `Log · Grid · Index`, a segmented control with the active item underlined.
- **Middle (Grid and Index only):** the filter chips (§2), as `Chip` toggles, with one active at a time.
- **Right (Grid only):** density `1× · 2× · ∞`.

**URL state.**
- The URL holds the view state: `?view=grid|index`, `?tag=<chip key>` and `?density=2|inf`. The defaults (Log, All, 1×) are left out of the URL.
- Changes use `history.replaceState`.
- The server always renders the Log view, so there is one rendering per URL path and CDN caching is untouched. After hydration, a client component reads the query and switches views, wrapped in `<Suspense>` for `useSearchParams`.
- Unknown values fall back to the defaults.

### 3.3 Log view

- **Year groups.**
  - Entries are grouped by year, newest first.
  - Each group is a row: `[200px year] [content]`.
  - The year is `type-name` (Doto) and `position: sticky; top: <header offset>` inside its group, so it stays visible while the group scrolls.
- **Entries.** An entry is a two-column block, `[minmax(0,480px) text] [1fr media]`.
  - **Text:**
    - `version · Mon`, or `title · Mon`;
    - the note;
    - `post ↗` when a `source` exists;
    - any `links`.
  - **Media column:**
    - the entry's first media item, large;
    - "+N in Grid →" when it has more. The link switches to Grid filtered to that entry.
  - An entry with no media renders only its text, at full width.
- Section breaks between year groups use the Sprint 4 dither rule.

### 3.4 Grid view

- **Cards.** File-like cards in the style of Base:
  - a header line with the caption (truncated), then a muted `version · first tag`;
  - the media below it, at its aspect ratio.
- **Placeholders.** A card with no image shows the dither placeholder with its FIG label. Placeholder cards are not hidden, so a page without images is still complete.
- **Columns.** Density sets the column count: 1× = 2, 2× = 4, ∞ = 8 at 1024px and up. Under 768px, 1× = 1, 2× = 2, ∞ = 3.
- Clicking a card opens the viewer at that item, within the filtered set.

### 3.5 Index view

A mono list. Each row is `FIG label · caption · version · tags`, separated by dashed hairlines. Clicking a row opens the viewer.

### 3.6 Viewer

A `MediaViewer` client component on a native `<dialog>` (shown with `showModal()`), always in the Life palette (`#0B0B0C`):
- **Top line:** `<case study> · <version> · <Mon YYYY>` on the left, `▦ / ▭` (grid ↔ single) and `Esc ×` on the right.
- **Single mode:**
  - the media is centred, with `←` `→` buttons;
  - under it, `FIG label · caption` on the left and `NN / MM` on the right;
  - a thumbnail strip, with the current item outlined in `accent`.
- **Grid mode:** the filtered set as thumbnails. Clicking one returns to single mode at that item.
- **Figma:**
  - When the item has `figma`, the caption line adds "Open in Figma ↗", linking to `https://www.figma.com/design/<fileKey>?node-id=<nodeId with - >`.
  - When `figma.embed` is set, single mode shows a third control, "Figma ▶". It swaps the stage for a poster (dither wash, "Load Figma file · embed.figma.com · interactive"). Activating the poster mounts `<iframe src="https://embed.figma.com/design/<fileKey>?node-id=<id>&embed-host=onursenture">`. The iframe is unmounted when the item changes.
  - Under 768px the embed control is not shown; the link is.
- **Keys:** `←` `→` move within the filtered set and wrap. `Esc` closes. `G` toggles grid mode.
- **History:**
  - Opening pushes `?fig=<media id>` (keeping the view params), and moving between items replaces it. Closing calls `history.back()` when the viewer pushed the entry, or removes the param otherwise.
  - The Back button closes the viewer.
  - Loading a URL with `?fig=` opens the viewer on hydration. An unknown id is ignored.
- **Focus:** the dialog traps focus. On close, focus returns to the card, row or figure that opened it.
- **Motion:** a 150ms fade on open and close. Reduced motion: none.
- **Images:** the viewer uses `Picture` with `sizes="100vw"`. Placeholders render as a large wash with the FIG label.

The hero and the Log figures also open the viewer, on the full set.

### 3.7 Mobile (<768px)

- Labels stack above content, as on the home page.
- Years render as group headings, not sticky.
- The view bar scrolls horizontally.
- Grid follows §3.4. The viewer is full-screen, with swipe left/right (pointer events) in addition to the buttons.

## 4. Special pages

### 4.1 PrimeIcons

- It is a normal case study (header, hero, release log).
- Its **Grid view** shows the icon set instead of media cards. The filter chips become a search input; "All N" counts the icons.
- **Icon source.** Add `primeicons` **pinned to exactly `7.0.0`**:
  - **Why 7.0.0.** It is MIT-licensed and ships 313 files under `raw-svg/`. From 8.0.0 (July 2026) the package uses PrimeTek's commercial PrimeUI license, which requires a license key and forbids redistribution. **Never upgrade it past 7.x.** Say so in a comment next to the dependency's use and in `CLAUDE.md`.
  - **Rendering.** A server-only module reads `node_modules/primeicons/raw-svg/*.svg` at build time. It replaces hard-coded `stroke`/`fill` colours (other than `none`) with `currentColor` and renders each icon as inline SVG, 24px in a 64px cell.
  - The font and `primeicons.css` are not used.
- **Cells.** Each cell shows the icon and its name (`type-label`). Clicking copies `pi pi-<name>` to the clipboard and shows a 1.2s "copied" state in the cell (with `aria-live`).
- The Index view lists the icon names. The viewer is not used for icons.
- The icon count comes from the package at build time, and the header shows the version it rendered ("v7.0.0 · N icons"). The version is read from the package's `package.json`.
- The MIT licence notice ships with the page as a small footer line under the grid: "PrimeIcons 7.0.0 © PrimeTek, MIT License".
- The Log view and the release media work as on the other pages.

### 4.2 Templates

- **Entries.** Each template is an `Entry` with `title` (template name), `date` (launch month), `frameworks` (rendered as small chips), `links` (a demo link if it still resolves) and `media` (cover first).
- **Views.** Log groups the templates by year; Grid shows every template's media; the Templates chips filter by template title.
- **Coverage.** The header says how many templates the page covers, counted from the entries. It never says "25+" unless Onur confirms it.
- **Initial list.** Built from the X archives and PrimeTek's public template pages: Verona, Paradise, Manhattan, Avalon, Babylon, Diamond (remastered), Genesis… The final list is whatever the sources confirm.
- **Shared work.** Genesis was designed by a colleague (per Onur's post). Every entry must make Onur's role clear, and templates he didn't design are left out or credited.

### 4.3 Archive

- **Header.** The Work grid header, with label "Archive" and the lead "Archive. Other PrimeTek work, from the posts that announced it."
- **Rows.** One row per entry, newest first: `[200px date "Mon YYYY"] [title, then the note] [action: post ↗]`.
  - An entry with `media` shows a small figure under the note, which opens the viewer.
  - Rows are grouped by year with the dither rule.
- No view bar.
- **Initial candidates** (from the brainstorm, all to be confirmed by sources): Aura theme (2024), Visual Theme Editor (Nov 2024), PrimeVue/PrimeNG Theme Designer (2025), Material theme (2024), the 2022 Figma UI kit, and the Theme Designer gallery (2023).

## 5. `/work/` index

- **Header row.**
  - Label: "Work".
  - Lead (draft): "Work. **Ten years of design systems, icons, blocks and templates at PrimeTek.**" The bold part is the muted continuation. Sprint 6 rewrites the lead when Orkestra joins.
- **One row group per org that has ready work.** In Sprint 5 that is PrimeTek only. Orkestra renders nothing until Sprint 6.
  - **Label:** `OrgMark` and org name, then the role and span from `content/experience.ts`.
  - **Content:** a hairline table. Each line is `[years] [title link] [kind] [→]`, in registry order; the Archive line comes last as "Archive · everything else".
  - **Action:** the org's public site (`primefaces.org ↗`).
- **Mobile.** The table drops the kind column under 480px.

## 6. Figma pipeline

### 6.1 `npm run figma`

A new script, `scripts/figma.ts` (tsx), runs on Onur's machine only:

1. Load the work registry and collect every `Media` with `figma` whose `image` is either unset or equal to the derived key `work/<slug>/<media id>`. Hand-set images win over Figma.
2. Read `FIGMA_TOKEN` from `.env.local`. If it is missing, exit with an explanation and change nothing.
3. **Check what changed.** Group the nodes by `fileKey`. For each file, call `GET https://api.figma.com/v1/files/<fileKey>/nodes?ids=<ids>&depth=1` to read each node's `lastModified`. Skip the nodes whose `lastModified` and `nodeId` match `lib/images/figma-lock.json`.
4. **Export.** For the rest, call `GET /v1/images/<fileKey>?ids=<ids>&format=png&scale=2`, then download each returned URL to `images-src/work/<slug>/<media id>.png`.
5. **Record.** Update the lock with `{ fileKey, nodeId, lastModified, exportedAt }` per `<slug>/<media id>`.
6. **Fail soft per node.** A missing node, a null image URL or an HTTP error warns, leaves that node's previous file and lock entry alone, and continues. The exit code is non-zero only when the token is missing or every request failed.
7. Finish by running the existing image pipeline (`scripts/images.ts`).

**How a slot finds its image.** `lib/work/` resolves a media item's image as:
- the explicit `image` when set;
- otherwise `work/<slug>/<media id>` when the manifest has that key;
- otherwise none, and the slot renders the placeholder.

So content files never need editing after an export.

**Commits and secrets.**
- Outputs are committed: the PNG source, the AVIF and JPEG renditions, the manifest and the lock.
- `.env.local` is already ignored. Add `FIGMA_TOKEN=` to `.env.example` if one exists, otherwise document it in `CLAUDE.md`.
- No Figma call ever happens in CI, the build or production.

**Tests.** Unit tests, with `fetch` mocked:
- node collection and the hand-set override;
- staleness against the lock;
- `nodeId` normalisation (`12-345` → `12:345`);
- the partial-failure behaviour.

### 6.2 Choosing frames

The content workflow, not code:
1. Onur shares one Figma file link per product.
2. Claude browses each file with the Figma MCP (`get_metadata`, `get_screenshot`) and proposes frames for the hero and each entry, with ids, captions and tags.
3. Onur approves.
4. Claude writes them into `content/work/*.ts`.
5. Onur (or Claude, with Onur's token already in `.env.local`) runs `npm run figma`.

Embeds need the file shared as "anyone with the link can view". Onur decides per file and sets `embed: true` only on files he has shared.

## 7. Content gathering

This is the first work in the sprint. The plan schedules it before the content tasks; code tasks can run in parallel with placeholders.

| Source | How | Output |
|---|---|---|
| @w00f posts | Already scanned | `.superpowers/research/x-w00f-posts.md` (main checkout, gitignored) |
| PrimeVue, PrimeNG, PrimeReact and PrimeFaces on X | Claude in Chrome, Onur's signed-in browser, read-only. Scan the full timelines for releases of PrimeOne, PrimeBlocks, PrimeIcons, templates, themes and Theme Designer. | `.superpowers/research/x-prime-posts.md`, in the same format as the w00f file |
| PrimeTek public pages | WebFetch: template stores, demo sites, Figma Community pages | Notes appended to the same research file, plus which demo links still resolve |
| Figma files | §6.2 | Frame choices in the content files |

## Copy and numbers

- Claude drafts every line: leads, intros, facts, notes and captions.
- Every entry's `note` must be supported by its `source`. An entry without a source is cut, except one Onur states himself.
- **Numbers.**
  - Only numbers from a dated source ("480 blocks at launch, Sep 2024") or computed from data (icon count, figure count, template count).
  - "80+ components", "500 blocks" and "25+ templates" stay off the pages unless Onur confirms them.
  - This follows the honest-numbers rule from Sprint 4.
- **Years.** `years` on each case study and in the index are Onur's to confirm. Until then, use the span the sources show (first and last dated entry).
- **Credit.** Onur's role is stated on every case study. Shared work credits the others when a source names them.
- **Pre-merge check.** Onur reviews all copy on the preview. Unconfirmed lines are cut or rewritten before merge.

## Testing and review

- **Vitest:**
  - registry validation (§2);
  - FIG labels;
  - chip keys and counts;
  - year grouping and ordering;
  - view-state URL parsing and serialising (`view`, `tag`, `density`, `fig`, defaults, unknown values);
  - the Figma script units (§6.1);
  - the PrimeIcons icon-list loader (count and name format).
- **Playwright (production build, no DB, both themes where marked):**
  - `/work/` renders the PrimeTek group, every line links, and the Work nav item shows and is active.
  - Each case study renders the header, hero and Log (both themes).
  - Deep links: `?view=grid&tag=<chip>`, `?view=index` and `?fig=<id>` each render the right state after hydration.
  - Viewer: opens from a card; `→`, `←` and `Esc`; Back closes it; focus returns to the card; `G` toggles grid mode.
  - Mobile (375px): stacked layout, no embed control, swipe changes the item.
  - PrimeIcons: search narrows the grid; click copies (clipboard permission granted in the test context).
  - Archive renders rows with `post ↗` links.
  - Home: Work tiles and the PrimeTek experience rows link to their case studies; "All work →" is present.
  - 404: `/work/unknown/` renders the Work-side 404.
- **Visual checks:**
  - screenshots of every new page, light, dark and 375px;
  - the viewer frozen mid-fade;
  - sticky years captured mid-scroll;
  - the dither placeholders at all densities.
- **CDN:** repeat the Sprint 4 curl loop on the preview for `/work/` and `/work/primeone/`, with and without `?view=grid` and `?fig=…`. The second request must be `HIT`/`STALE`.
- **Final whole-branch review** (opus), then a follow-ups file, `docs/superpowers/plans/2026-10-03-sprint-5-followups.md`.

## Carried over

From `2026-10-03-sprint-4-followups.md`, Sprint 5 section:
- Shell e2e: assert the non-empty nav and use `exact: true` on the Sources heading, now that Work is ready.
- Stale comments in `page-header` ("display headline") and `/system/` ("S3 review surface").
- `nebuu` / `Nebuu` casing.

## Out of scope

- Orkestra, Nebuu and Lab pages (Sprint 6).
- Admin upload, editing and the DB overlay (Sprint 7). Sprint 5 only keeps ids stable and reads behind `lib/work/`.
- Figma API calls from production, and webhooks.
- X embeds and scraped X images.
- Video media. The `Media` type leaves room for it, but no renderer is built.
- Resume, Book a call and launch (Sprint 8).
