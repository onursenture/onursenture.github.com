# Sprint 5: Work I, PrimeTek — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Work section's first half: the `/work/` index, four PrimeTek case studies (PrimeOne, PrimeBlocks, PrimeIcons, Templates) and `/work/archive/`, with media sets, a shared viewer, Figma links/embeds and a local Figma export script.

**Architecture:**
- **Content.** Case studies are typed data in `content/work/*.ts`. Pages read them only through `lib/work/`:
  - `derive.ts` (pure) turns content into serialisable views: FIG labels, year groups, filter chips, credits and resolved images.
  - `url-state.ts` (pure) parses and serialises the `?view/tag/density/fig` query.
  - `index.ts` (server) binds the views to the image manifest.
- **Rendering.** The server renders every case study in its default Log state. A client `StudyBrowser` inside `<Suspense>` reads the query with `useSearchParams` and switches views. It updates the URL with `history.pushState`/`replaceState`, so CDN caching (one rendering per path) is untouched.
- **Viewer.** One native-`<dialog>` `MediaViewer` serves every case study and the Archive.
- **Figma.** Images come from `npm run figma`, a local script that exports Figma frames into `images-src/work/` for the existing `npm run images` pipeline. Production never calls Figma.

**Tech Stack:** Next.js 16.3.8 (App Router, `cacheComponents`, `trailingSlash`), React 19.2.8, Tailwind CSS 4.3.3, Vitest 5, Playwright 1.63, `primeicons@7.0.0` (MIT), the Figma REST API (local script only), and `tsx` for scripts.

**Spec:** `docs/superpowers/specs/2026-10-03-sprint-5-work-primetek-design.md`. Mockups are in `docs/superpowers/specs/2026-10-03-sprint-5-mockups/`; open them in a browser:
- `case-study-layout.html` (layout B);
- `media-sets-v2.html` (direction 2, Log · Grid · Index);
- `figma-options.html`;
- `work-index.html` (A).

## Global Constraints

- **Workspace.** Work in the worktree `/Users/w00f/Documents/GitHub/onursenture.github.com-sprint-5` on branch `sprint-5`. Never touch `master` or `v2` directly.
- **Done means every check passes:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run build`
  - `npm run e2e`
  - `SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures`
  - a final plain `npm run build`, so `.next` is not left in fixture mode
  - If `npm run typecheck` fails on stale `.next/dev/types`, run `rm -rf .next` and retry.
- **Next.js.** Next.js 16 differs from older versions. Read `node_modules/next/dist/docs/` before using an API. The two pages that matter here:
  - `01-app/03-api-reference/04-functions/use-search-params.md`: the component must sit inside `<Suspense>` on a prerendered route.
  - `01-app/01-getting-started/04-linking-and-navigating.md` § "Native History API": `pushState`/`replaceState` sync with `useSearchParams`.
- **Rendering rules.**
  - `cacheComponents` is on: pages never read `cookies()`, `headers()` or the `searchParams` prop. Query state is client-only.
  - `trailingSlash: true`: every internal link ends with `/`.
- **Faces and glyphs.**
  - Faces to avoid: Inter, Geist, Geist Mono, Instrument Serif/Sans, Söhne, Tiempos, Styrene, Space Grotesk, DM Sans, Manrope, Satoshi, Fraunces, PP Neue Montreal, PP Editorial New, JetBrains Mono. Only IBM Plex Mono, IBM Plex Sans and Doto.
  - Glyphs: `→` for internal links, `↗` for external links (`TextLink` adds both), `←` for back and previous, `×` for close.
  - Never `★`; `grep -rn "★" app components lib` must stay empty.
  - Don't introduce `▦`, `▭` or `▶`: Plex coverage is unverified, so use words ("Grid", "Single", "Load Figma file").
- **Tokens and type.**
  - Only the existing token utilities (`bg-bg`, `text-fg`, `text-fg-muted`, `text-fg-soft`, `border` for a line, `text-accent`, `rounded-control`).
  - Type comes only from `type-name`, `type-lead`, `type-body`, `type-meta`, `type-label` and `type-boot`.
  - No shadows, and square corners except form controls.
- **Honest numbers.** Only numbers that are computed from data or come with a dated source. Never "80+ components", "500 blocks" or "25+ templates" (spec, "Copy and numbers").
- **Copy.** Copy marked *draft* ships, and Onur reviews it on the preview. Only facts with a source go into `content/`.
- **Accessibility.**
  - Every `<canvas>` is decorative: its wrapper is `aria-hidden="true"`, and meaning lives in adjacent text.
  - `prefers-reduced-motion: reduce` disables the viewer fade.
- **English only.**
- **PrimeIcons.** `primeicons` is pinned to exactly `7.0.0` (MIT). 8.x is under PrimeTek's commercial PrimeUI license, which requires a license key and forbids redistribution. **Never upgrade it.**
- **Commits.**
  - Subjects are imperative, with no "Task N" prefix.
  - Every commit message ends with this trailer, and no other model name:

    ```
    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    ```
- **E2E locators.** Prefer role locators, or `:visible`. Next keeps the previous route's tree mounted but hidden after a client navigation.

## File structure

| Path | Responsibility | Task |
|---|---|---|
| `content/work/types.ts` | Content types (`CaseStudy`, `Entry`, `Media`, `Credit`, `FigmaRef`, `ArchiveEntry`, `Fact`, `Link`) | 2 |
| `content/work/index.ts` | Registry: `caseStudies`, `archive` | 2 (empty), 3 (filled) |
| `content/work/{primeone,primeblocks,primeicons,templates,archive}.ts` | Draft content from the @w00f archive | 3, then 11 |
| `lib/work/derive.ts` | Pure view builders: FIG labels, groups, chips, filters, credits, archive view, viewer items | 2 |
| `lib/work/url-state.ts` | Pure `?view/tag/density/fig` parsing and serialising | 2 |
| `lib/work/figma.ts` | Pure Figma URL helpers | 2 |
| `lib/work/validate.ts` | `validateWork()`, the registry checks run by Vitest | 2 |
| `lib/work/index.ts` | Server read API bound to the image manifest | 2, 4, 9 |
| `lib/work/index-groups.ts` | Pure `/work/` index grouping | 9 |
| `lib/work/icons.ts` | Pure SVG recolouring and icon search | 7 |
| `lib/work/primeicons.ts` | Server loader for `primeicons/raw-svg` | 7 |
| `lib/work/figma-plan.ts`, `lib/work/figma-export.ts` | Pure target collection and lock logic; export loop with injected IO | 10 |
| `scripts/figma.ts` | `npm run figma` entry point | 10 |
| `components/picture-view.tsx` | `<picture>` from a manifest entry (no manifest import; client-safe) | 2 |
| `components/work/*` | Header, figure, buttons, credit line, Log/Grid/Index views, view bar, body, browser, viewer, icon grid, archive log, work table | 4–9 |
| `app/(work)/work/page.tsx` | `/work/` index | 9 |
| `app/(work)/work/[slug]/page.tsx` | Case studies | 4, 5, 7 |
| `app/(work)/work/archive/page.tsx` | Archive | 8 |

## Task order and parallelism

- Task 1 (controller, content research) runs in parallel with Tasks 2–10.
- Tasks 2 → 3 → 4 → 5 → 6 are sequential.
- Tasks 7, 8 and 9 each need 6.
- Task 10 needs 2 and 3.
- Task 11 (controller) needs 1 and 3.
- Task 12 (controller) comes last.

Run the implementer tasks one at a time in this order: 2, 3, 4, 5, 6, 7, 8, 9, 10. Each later brief must list the review fixes made in files it modifies.

---

### Task 1: Content research — PrimeTek X accounts and public pages (controller)

Not a subagent task. The controller runs it, because it needs Onur's signed-in Chrome (Claude in Chrome tools, read-only). It produces research only, no code.

**Files:**
- Create: `/Users/w00f/Documents/GitHub/onursenture.github.com/.superpowers/research/x-prime-posts.md` (main checkout, gitignored; never commit it)

- [ ] **Step 1: Ask Onur to have Chrome open and signed in to X.**

  Load the Chrome tools in one ToolSearch call: `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__get_page_text,mcp__claude-in-chrome__tabs_create_mcp`.

- [ ] **Step 2: Scan each account's timeline, oldest relevant post to newest.**

  The accounts are `x.com/primevue`, `x.com/prime_ng`, `x.com/primereact` and `x.com/primefaces`. Use X search with each account and keyword, for example `from:primevue PrimeOne`. Keywords:
  - PrimeOne
  - PrimeBlocks
  - PrimeIcons
  - template, plus each template name: Verona, Paradise, Manhattan, Avalon, Babylon, Ultima, Diamond, Genesis, Apollo, Sakai, Atlantis, Freya, Verona…
  - Aura, Theme Designer, Visual Theme Editor, Figma, UI Kit, Material

  For each relevant post record one line, in the format of `x-w00f-posts.md`: `- YYYY-MM-DD · @account · text (trimmed) · media count · https://x.com/<account>/status/<id>`.

  Read only. Never like, follow, reply or post.

- [ ] **Step 3: Read PrimeTek's public pages with WebFetch.** Record:
  - template names, frameworks and demo URLs that still resolve (try `https://<name>.primevue.org`, `https://<name>.primeng.org` and the template store pages);
  - PrimeBlocks figures with their dates;
  - PrimeIcons release dates;
  - Figma Community file URLs for PrimeOne.

  Append them to the same file under `## Public pages`.

- [ ] **Step 4: Summarise the findings.** For each case study (PrimeOne, PrimeBlocks, PrimeIcons, Templates) and for the Archive, add a section listing the candidate entries: date, version or title, a one-line fact and the source URL. Task 11 uses this.

---

### Task 2: Work content model, pure view logic and `PictureView`

**Files:**
- Create: `content/work/types.ts`, `content/work/index.ts`
- Create: `lib/work/derive.ts`, `lib/work/url-state.ts`, `lib/work/figma.ts`, `lib/work/validate.ts`, `lib/work/index.ts`
- Create: `components/picture-view.tsx`
- Modify: `components/picture.tsx`, `lib/images/manifest.ts`
- Test: `tests/work/derive.test.ts`, `tests/work/url-state.test.ts`, `tests/work/figma.test.ts`, `tests/work/validate.test.ts`, `tests/content/work.test.ts`

**Interfaces:**
- Consumes: `ImageEntry` from `lib/images/plan.ts`; `OrgId`, `ORGS` from `content/orgs.ts`.
- Produces (later tasks rely on these exact names):
  - `content/work/types.ts`: `WorkSlug`, `MediaAspect`, `Credit`, `FigmaRef`, `Media`, `Link`, `Fact`, `Entry`, `CaseStudy`, `ArchiveEntry`.
  - `content/work/index.ts`: `caseStudies: CaseStudy[]`, `archive: ArchiveEntry[]`.
  - `lib/work/derive.ts`:
    - types `ImageLookup`, `ResolvedImage`, `MediaView`, `EntryView`, `YearGroup<T>`, `ChipView`, `StudyView`, `ArchiveRowView`, `ArchiveView`, `CreditGroup`;
    - functions `formatYearMonth`, `pad2`, `imageKey`, `resolveImage`, `entryHeading`, `oldestFirst`, `groupByYear`, `chipsFor`, `filterMedia`, `buildStudyView`, `buildArchiveView`, `groupCredits`, `viewerItems`.
  - `lib/work/url-state.ts`: `WorkView`, `Density`, `ViewState`, `ValidValues`, `DEFAULT_VIEW_STATE`, `parseViewState`, `viewStateQuery`, `validValues`.
  - `lib/work/figma.ts`: `normalizeNodeId`, `figmaDesignUrl`, `figmaEmbedUrl`.
  - `lib/work/validate.ts`: `validateWork(studies, archive, hasImage): string[]`.
  - `lib/work/index.ts`: `getCaseStudies()`, `getCaseStudy(slug)`, `getStudyView(study)`, `getArchiveView()`, `caseStudyFacts(study, view)`.
  - `lib/images/manifest.ts`: adds `findImage(key): ImageEntry | undefined`.
  - `components/picture-view.tsx`: `PictureView({ image, entry, alt, sizes?, priority?, className? })`.

- [ ] **Step 1: Write `content/work/types.ts`**

```ts
import type { OrgId } from "../orgs";

// Sprint 5 case studies. Content is typed data, read only through lib/work/
// so Sprint 7's admin can overlay edits in one place. Ids are permanent once
// published: they key image files (work/<slug>/<media id>) and ?fig= URLs.

export type WorkSlug = "primeone" | "primeblocks" | "primeicons" | "templates";

export type MediaAspect = "16/9" | "16/10" | "4/3" | "1/1";

// A collaborator credited on an entry or a single media item. Onur led all
// PrimeTek design, so his role is stated once per case study (facts); credits
// name the others where they designed a piece.
export interface Credit {
  name: string;
  // "design" (the default), "illustration", "implementation"…
  role?: string;
  href?: string;
}

export interface FigmaRef {
  // From figma.com/design/<fileKey>/…
  fileKey: string;
  // "12:345" (a URL's node-id=12-345, normalised).
  nodeId: string;
  // Offer the click-to-load embed in the viewer (the file must be shared as
  // "anyone with the link can view").
  embed?: boolean;
}

export interface Media {
  // Stable, kebab-case, unique within its case study.
  id: string;
  caption: string;
  credits?: Credit[];
  // Grid filter tags, kebab-case: "components", "tokens", "page"…
  tags?: string[];
  // An image manifest key. Leave unset: lib/work/ finds work/<slug>/<id>
  // when `npm run figma` (or a hand-placed file) has produced it.
  image?: string;
  figma?: FigmaRef;
  // Defaults to "16/10".
  aspect?: MediaAspect;
}

export interface Link {
  label: string;
  href: string;
}

export interface Fact {
  label: string;
  value: string;
}

export interface Entry {
  // Stable, kebab-case, unique within its case study, e.g. "3-0".
  id: string;
  // "YYYY-MM"
  date: string;
  version?: string;
  // Used when there is no version, e.g. a template's name.
  title?: string;
  // One or two sentences; must be supported by `source`.
  note: string;
  // Proof URL, usually an X post.
  source?: string;
  links?: Link[];
  // Templates only: "Vue", "Angular", "React", "JSF".
  frameworks?: string[];
  credits?: Credit[];
  media: Media[];
}

export interface CaseStudy {
  slug: WorkSlug;
  org: OrgId;
  title: string;
  // "design system", "UI blocks", "icon set", "app templates"
  kind: string;
  // "2022–2026"
  years: string;
  lead: { strong: string; rest: string };
  intro: string[];
  facts: Fact[];
  // Action column; external links get ↗.
  links: Link[];
  hero: Media;
  // Any order; rendered newest first.
  entries: Entry[];
}

export interface ArchiveEntry {
  // Stable, kebab-case, unique across the archive.
  id: string;
  org: OrgId;
  date: string;
  title: string;
  note: string;
  // Required: the archive is built from the posts that announced the work.
  source: string;
  credits?: Credit[];
  media?: Media;
}
```

- [ ] **Step 2: Write `content/work/index.ts` (empty until Task 3)**

```ts
import type { ArchiveEntry, CaseStudy } from "./types";

// Case studies in /work/ display order, and the Archive entries. Task 3 fills
// both.
export const caseStudies: CaseStudy[] = [];

export const archive: ArchiveEntry[] = [];
```

- [ ] **Step 3: Add `findImage` to `lib/images/manifest.ts`**

Append after `hasImage`:

```ts
// The entry for a key, or undefined. For optional slots (work media) that
// fall back to a placeholder instead of failing the build.
export function findImage(key: string): ImageEntry | undefined {
  return manifest[key];
}
```

- [ ] **Step 4: Split `PictureView` out of `Picture`**

Create `components/picture-view.tsx`:

```tsx
import { type ImageEntry, renditionUrl, srcSet } from "@/lib/images/plan";

// Responsive AVIF + JPEG <picture> from a manifest entry the caller already
// has. It doesn't import the manifest, so client components can use it with
// entries resolved on the server (lib/work/).
export function PictureView({
  image,
  entry,
  alt,
  sizes = "100vw",
  priority = false,
  className,
}: {
  image: string;
  entry: ImageEntry;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(image, entry, "avif")} sizes={sizes} />
      <img
        src={renditionUrl(image, entry.width, "jpg")}
        srcSet={srcSet(image, entry, "jpg")}
        sizes={sizes}
        width={entry.width}
        height={entry.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
```

Replace `components/picture.tsx` with:

```tsx
import { getImage } from "@/lib/images/manifest";
import { PictureView } from "./picture-view";

// Responsive AVIF + JPEG <picture> for an image produced by `npm run images`.
// `image` is the manifest key, e.g. "photos/stabilo". Throws for an unknown
// key (getImage), so a missing `npm run images` fails the build.
export function Picture({
  image,
  alt,
  sizes = "100vw",
  priority = false,
  className,
}: {
  image: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <PictureView image={image} entry={getImage(image)} alt={alt} sizes={sizes} priority={priority} className={className} />
  );
}
```

- [ ] **Step 5: Write the failing tests for `lib/work/derive.ts`**

Create `tests/work/derive.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";
import type { ImageEntry } from "@/lib/images/plan";
import {
  buildArchiveView,
  buildStudyView,
  filterMedia,
  formatYearMonth,
  groupCredits,
  resolveImage,
  viewerItems,
} from "@/lib/work/derive";

const IMAGE: ImageEntry = { width: 2560, height: 1600, widths: [640, 1280, 2560] };
const lookup = (key: string) => (key === "work/primeone/cover" || key === "custom/pic" ? IMAGE : undefined);

const study: CaseStudy = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  years: "2023–2026",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: ["Intro."],
  facts: [{ label: "Role", value: "Design lead" }],
  links: [],
  hero: { id: "cover", caption: "Cover" },
  entries: [
    {
      id: "3-0",
      date: "2024-11",
      version: "3.0",
      note: "Rebuilt.",
      media: [
        { id: "overview", caption: "Overview" },
        { id: "tokens", caption: "Tokens", tags: ["tokens"], credits: [{ name: "Ada" }] },
        { id: "button", caption: "Button", tags: ["components"], image: "custom/pic" },
      ],
    },
    { id: "4-0", date: "2026-01", version: "4.0", note: "Variables.", media: [] },
    { id: "2-2", date: "2023-12", version: "2.2", note: "Aligned.", media: [{ id: "table", caption: "Token table", tags: ["tokens"] }] },
  ],
};

describe("formatYearMonth", () => {
  it("formats YYYY-MM as a short month and year", () => {
    expect(formatYearMonth("2024-11")).toBe("Nov 2024");
    expect(formatYearMonth("2017-01")).toBe("Jan 2017");
  });
});

describe("resolveImage", () => {
  it("uses the explicit key, else work/<scope>/<id>, else none", () => {
    expect(resolveImage("primeone", { id: "x", caption: "", image: "custom/pic" }, lookup)?.key).toBe("custom/pic");
    expect(resolveImage("primeone", { id: "cover", caption: "" }, lookup)).toEqual({ key: "work/primeone/cover", ...IMAGE });
    expect(resolveImage("primeone", { id: "nope", caption: "" }, lookup)).toBeNull();
  });
});

describe("buildStudyView", () => {
  const view = buildStudyView(study, lookup);

  it("labels the hero FIG. 01 and resolves its image", () => {
    expect(view.hero.label).toBe("FIG. 01");
    expect(view.hero.image?.key).toBe("work/primeone/cover");
    expect(view.hero.group).toBe("Cover");
    expect(view.hero.entryId).toBeNull();
  });

  it("groups entries by year, newest first", () => {
    expect(view.groups.map((g) => g.year)).toEqual(["2026", "2024", "2023"]);
    expect(view.groups[1].items[0]).toMatchObject({ id: "3-0", heading: "3.0", month: "Nov" });
  });

  it("numbers entry figures from the oldest entry (02), so new entries don't renumber", () => {
    const labels = view.media.map((m) => m.label);
    expect(labels).toEqual(["FIG. 01", "FIG. 03.1", "FIG. 03.2", "FIG. 03.3", "FIG. 02.1"]);
  });

  it("gives each figure its entry context and defaults", () => {
    const tokens = view.media.find((m) => m.id === "tokens")!;
    expect(tokens).toMatchObject({ group: "3.0", context: "3.0 · Nov 2024", aspect: "16/10", entryId: "3-0", figma: null });
    expect(tokens.credits).toEqual([{ name: "Ada" }]);
  });

  it("builds chips: All, then entries with media, then tags, each with a computed count", () => {
    expect(view.chips).toEqual([
      { key: "all", label: "All", count: 5 },
      { key: "3-0", label: "3.0", count: 3 },
      { key: "2-2", label: "2.2", count: 1 },
      { key: "tokens", label: "Tokens", count: 2 },
      { key: "components", label: "Components", count: 1 },
    ]);
  });

  it("says 'page(s) in Grid' only on Templates", () => {
    expect(view.moreLabel).toEqual({ one: "in Grid", many: "in Grid" });
    expect(buildStudyView({ ...study, slug: "templates" }, lookup).moreLabel).toEqual({ one: "page in Grid", many: "pages in Grid" });
  });
});

describe("filterMedia and viewerItems", () => {
  const view = buildStudyView(study, lookup);

  it("filters by entry id or tag; 'all' keeps everything", () => {
    expect(filterMedia(view.media, "all")).toHaveLength(5);
    expect(filterMedia(view.media, "3-0").map((m) => m.id)).toEqual(["overview", "tokens", "button"]);
    expect(filterMedia(view.media, "tokens").map((m) => m.id)).toEqual(["tokens", "table"]);
  });

  it("uses the full set in Log, the filtered set elsewhere, and falls back to the full set for an outside fig", () => {
    expect(viewerItems(view.media, "log", "tokens", null)).toHaveLength(5);
    expect(viewerItems(view.media, "grid", "tokens", "tokens").map((m) => m.id)).toEqual(["tokens", "table"]);
    expect(viewerItems(view.media, "grid", "tokens", "cover")).toHaveLength(5);
  });
});

describe("groupCredits", () => {
  it("groups by role, defaulting to Design, keeping first-seen order", () => {
    expect(
      groupCredits([
        { name: "A" },
        { name: "B", role: "implementation" },
        { name: "C", role: "design" },
      ]),
    ).toEqual([
      { role: "Design", people: [{ name: "A" }, { name: "C", role: "design" }] },
      { role: "Implementation", people: [{ name: "B", role: "implementation" }] },
    ]);
  });
});

describe("buildArchiveView", () => {
  const entries: ArchiveEntry[] = [
    { id: "aura", org: "primetek", date: "2024-01", title: "Aura", note: "A theme.", source: "https://x.com/a/status/1", media: { id: "aura", caption: "Aura" } },
    { id: "gallery", org: "primetek", date: "2023-09", title: "Gallery", note: "A gallery.", source: "https://x.com/a/status/2" },
    { id: "editor", org: "primetek", date: "2024-11", title: "Editor", note: "An editor.", source: "https://x.com/a/status/3" },
  ];
  const view = buildArchiveView(entries, () => undefined);

  it("groups rows by year, newest first, with the org name and month", () => {
    expect(view.groups.map((g) => g.year)).toEqual(["2024", "2023"]);
    expect(view.groups[0].items.map((r) => r.id)).toEqual(["editor", "aura"]);
    expect(view.groups[0].items[1]).toMatchObject({ monthYear: "Jan 2024", orgName: "PrimeTek" });
  });

  it("numbers archive figures from the oldest entry and lists them for the viewer", () => {
    expect(view.media.map((m) => [m.id, m.label, m.context])).toEqual([["aura", "FIG. 02", "Aura · Jan 2024"]]);
  });
});
```

Run: `npx vitest run tests/work/derive.test.ts`
Expected: FAIL, because `@/lib/work/derive` doesn't exist yet.

- [ ] **Step 6: Write `lib/work/derive.ts`**

```ts
import { ORGS } from "@/content/orgs";
import type { ArchiveEntry, CaseStudy, Credit, Entry, FigmaRef, Link, Media, MediaAspect } from "@/content/work/types";
import type { ImageEntry } from "@/lib/images/plan";

// Pure builders from content (content/work/) to the serialisable views the
// work pages render. No manifest import: the caller passes `lookup`, so client
// code can import these types and helpers.

export type ImageLookup = (key: string) => ImageEntry | undefined;

export interface ResolvedImage extends ImageEntry {
  key: string;
}

export interface MediaView {
  id: string;
  // "FIG. 01" (hero), "FIG. 03.2" (entry figures), "FIG. 04" (archive).
  label: string;
  caption: string;
  aspect: MediaAspect;
  tags: string[];
  credits: Credit[];
  image: ResolvedImage | null;
  figma: FigmaRef | null;
  // The entry (or archive row) it belongs to; null for a case study's hero.
  entryId: string | null;
  // Short owner name for cards: "3.0", "Verona", "Cover".
  group: string;
  // Viewer top line: "3.0 · Nov 2024", or "Cover".
  context: string;
}

export interface EntryView {
  id: string;
  date: string;
  year: string;
  // "Nov"
  month: string;
  // Version, else title, else "Nov 2024".
  heading: string;
  note: string;
  source: string | null;
  links: Link[];
  frameworks: string[];
  credits: Credit[];
  media: MediaView[];
}

export interface YearGroup<T> {
  year: string;
  items: T[];
}

export interface ChipView {
  // "all", an entry id, or a tag.
  key: string;
  label: string;
  count: number;
}

export interface StudyView {
  slug: string;
  title: string;
  hero: MediaView;
  groups: YearGroup<EntryView>[];
  // The hero, then every entry's media, newest entry first.
  media: MediaView[];
  chips: ChipView[];
  // "+N in Grid →"; Templates says "+1 page in Grid →" / "+N pages in Grid →".
  moreLabel: { one: string; many: string };
}

export interface ArchiveRowView {
  id: string;
  date: string;
  // "Nov 2024"
  monthYear: string;
  title: string;
  note: string;
  source: string;
  credits: Credit[];
  orgName: string;
  media: MediaView | null;
}

export interface ArchiveView {
  groups: YearGroup<ArchiveRowView>[];
  media: MediaView[];
}

export interface CreditGroup {
  role: string;
  people: Credit[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthOf(ym: string): string {
  return MONTHS[Number(ym.slice(5, 7)) - 1];
}

// "2024-11" → "Nov 2024"
export function formatYearMonth(ym: string): string {
  return `${monthOf(ym)} ${ym.slice(0, 4)}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The manifest key a media slot uses when it has no explicit `image`:
// npm run figma writes images-src/work/<scope>/<id>.png.
export function imageKey(scope: string, mediaId: string): string {
  return `work/${scope}/${mediaId}`;
}

export function resolveImage(scope: string, media: Media, lookup: ImageLookup): ResolvedImage | null {
  const key = media.image ?? imageKey(scope, media.id);
  const entry = lookup(key);
  return entry ? { key, width: entry.width, height: entry.height, widths: entry.widths } : null;
}

function mediaView(
  scope: string,
  media: Media,
  label: string,
  group: string,
  context: string,
  entryId: string | null,
  lookup: ImageLookup,
): MediaView {
  return {
    id: media.id,
    label,
    caption: media.caption,
    aspect: media.aspect ?? "16/10",
    tags: media.tags ?? [],
    credits: media.credits ?? [],
    image: resolveImage(scope, media, lookup),
    figma: media.figma ?? null,
    entryId,
    group,
    context,
  };
}

export function entryHeading(entry: Entry): string {
  return entry.version ?? entry.title ?? formatYearMonth(entry.date);
}

// FIG ordinals count from the oldest item, so adding a newer entry on top
// never renumbers the existing figures.
export function oldestFirst<T extends { date: string; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function groupByYear<T extends { date: string }>(newestFirst: T[]): YearGroup<T>[] {
  const groups: YearGroup<T>[] = [];
  for (const item of newestFirst) {
    const year = item.date.slice(0, 4);
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(item);
    else groups.push({ year, items: [item] });
  }
  return groups;
}

// All, then each entry that has media (newest first), then each tag in
// first-seen order. Counts are always computed, never written by hand.
export function chipsFor(media: MediaView[], entries: EntryView[]): ChipView[] {
  const chips: ChipView[] = [{ key: "all", label: "All", count: media.length }];
  for (const entry of entries) {
    if (entry.media.length > 0) chips.push({ key: entry.id, label: entry.heading, count: entry.media.length });
  }
  const tags = new Map<string, number>();
  for (const item of media) for (const tag of item.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
  for (const [tag, count] of tags) chips.push({ key: tag, label: capitalise(tag), count });
  return chips;
}

export function filterMedia(media: MediaView[], key: string): MediaView[] {
  if (key === "all") return media;
  return media.filter((item) => item.entryId === key || item.tags.includes(key));
}

// The set the viewer steps through: everything from the Log (hero and Log
// figures open the full set), the filtered set from Grid and Index. A fig
// outside the filter (a hand-edited URL) falls back to the full set.
export function viewerItems(media: MediaView[], view: string, tag: string, fig: string | null): MediaView[] {
  if (view === "log") return media;
  const filtered = filterMedia(media, tag);
  return fig && !filtered.some((item) => item.id === fig) ? media : filtered;
}

export function buildStudyView(study: CaseStudy, lookup: ImageLookup): StudyView {
  const ordered = oldestFirst(study.entries);
  const ordinal = new Map(ordered.map((entry, index) => [entry.id, pad2(index + 2)]));
  const entries: EntryView[] = [...ordered].reverse().map((entry) => {
    const heading = entryHeading(entry);
    const context = `${heading} · ${formatYearMonth(entry.date)}`;
    return {
      id: entry.id,
      date: entry.date,
      year: entry.date.slice(0, 4),
      month: monthOf(entry.date),
      heading,
      note: entry.note,
      source: entry.source ?? null,
      links: entry.links ?? [],
      frameworks: entry.frameworks ?? [],
      credits: entry.credits ?? [],
      media: entry.media.map((item, index) =>
        mediaView(study.slug, item, `FIG. ${ordinal.get(entry.id)}.${index + 1}`, heading, context, entry.id, lookup),
      ),
    };
  });
  const hero = mediaView(study.slug, study.hero, "FIG. 01", "Cover", "Cover", null, lookup);
  const media = [hero, ...entries.flatMap((entry) => entry.media)];
  return {
    slug: study.slug,
    title: study.title,
    hero,
    groups: groupByYear(entries),
    media,
    chips: chipsFor(media, entries),
    moreLabel:
      study.slug === "templates" ? { one: "page in Grid", many: "pages in Grid" } : { one: "in Grid", many: "in Grid" },
  };
}

export function buildArchiveView(entries: ArchiveEntry[], lookup: ImageLookup): ArchiveView {
  const ordered = oldestFirst(entries);
  const ordinal = new Map(ordered.map((entry, index) => [entry.id, pad2(index + 1)]));
  const rows: ArchiveRowView[] = [...ordered].reverse().map((entry) => {
    const monthYear = formatYearMonth(entry.date);
    return {
      id: entry.id,
      date: entry.date,
      monthYear,
      title: entry.title,
      note: entry.note,
      source: entry.source,
      credits: entry.credits ?? [],
      orgName: ORGS[entry.org].name,
      media: entry.media
        ? mediaView("archive", entry.media, `FIG. ${ordinal.get(entry.id)}`, entry.title, `${entry.title} · ${monthYear}`, entry.id, lookup)
        : null,
    };
  });
  return { groups: groupByYear(rows), media: rows.flatMap((row) => (row.media ? [row.media] : [])) };
}

// Credits by role, in first-seen order; a missing role means design.
export function groupCredits(credits: Credit[]): CreditGroup[] {
  const groups: CreditGroup[] = [];
  for (const credit of credits) {
    const role = credit.role ? capitalise(credit.role) : "Design";
    const group = groups.find((g) => g.role === role);
    if (group) group.people.push(credit);
    else groups.push({ role, people: [credit] });
  }
  return groups;
}
```

Run: `npx vitest run tests/work/derive.test.ts`
Expected: PASS.

- [ ] **Step 7: Write the failing tests for `url-state` and `figma`**

Create `tests/work/url-state.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW_STATE, parseViewState, validValues, viewStateQuery } from "@/lib/work/url-state";

const valid = validValues([{ id: "cover" }, { id: "tokens" }], [{ key: "all" }, { key: "3-0" }, { key: "tokens" }]);
const parse = (query: string) => parseViewState(new URLSearchParams(query), valid);

describe("parseViewState", () => {
  it("defaults to Log, All, 1×, no figure", () => {
    expect(parse("")).toEqual(DEFAULT_VIEW_STATE);
    expect(DEFAULT_VIEW_STATE).toEqual({ view: "log", tag: "all", density: "1", fig: null });
  });

  it("reads view, tag, density and fig", () => {
    expect(parse("view=grid&tag=3-0&density=inf&fig=tokens")).toEqual({ view: "grid", tag: "3-0", density: "inf", fig: "tokens" });
    expect(parse("view=index&tag=tokens")).toEqual({ view: "index", tag: "tokens", density: "1", fig: null });
  });

  it("falls back to defaults for unknown values", () => {
    expect(parse("view=wall&tag=nope&density=9&fig=ghost")).toEqual(DEFAULT_VIEW_STATE);
  });

  it("ignores tag in Log and density outside Grid", () => {
    expect(parse("tag=tokens&density=2")).toEqual(DEFAULT_VIEW_STATE);
    expect(parse("view=index&density=2").density).toBe("1");
  });

  it("keeps a figure in any view", () => {
    expect(parse("fig=cover")).toEqual({ ...DEFAULT_VIEW_STATE, fig: "cover" });
  });
});

describe("viewStateQuery", () => {
  it("leaves defaults out", () => {
    expect(viewStateQuery(DEFAULT_VIEW_STATE)).toBe("");
    expect(viewStateQuery({ ...DEFAULT_VIEW_STATE, tag: "tokens", density: "2" })).toBe("");
  });

  it("writes params in a fixed order", () => {
    expect(viewStateQuery({ view: "grid", tag: "3-0", density: "inf", fig: "tokens" })).toBe("?view=grid&tag=3-0&density=inf&fig=tokens");
    expect(viewStateQuery({ view: "index", tag: "all", density: "inf", fig: null })).toBe("?view=index");
    expect(viewStateQuery({ ...DEFAULT_VIEW_STATE, fig: "cover" })).toBe("?fig=cover");
  });

  it("round-trips through parseViewState", () => {
    const state = { view: "grid" as const, tag: "tokens", density: "2" as const, fig: "cover" };
    expect(parse(viewStateQuery(state).slice(1))).toEqual(state);
  });
});
```

Create `tests/work/figma.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { figmaDesignUrl, figmaEmbedUrl, normalizeNodeId } from "@/lib/work/figma";

describe("Figma URLs", () => {
  it("normalises a URL node-id to the API form", () => {
    expect(normalizeNodeId("12-345")).toBe("12:345");
    expect(normalizeNodeId(" 12:345 ")).toBe("12:345");
  });

  it("builds the design and embed URLs with the dashed node-id", () => {
    const ref = { fileKey: "AbC123", nodeId: "12:345" };
    expect(figmaDesignUrl(ref)).toBe("https://www.figma.com/design/AbC123?node-id=12-345");
    expect(figmaEmbedUrl(ref)).toBe("https://embed.figma.com/design/AbC123?node-id=12-345&embed-host=onursenture");
  });
});
```

Run: `npx vitest run tests/work/url-state.test.ts tests/work/figma.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 8: Write `lib/work/url-state.ts` and `lib/work/figma.ts`**

`lib/work/url-state.ts`:

```ts
// A work page's view state lives in the query: ?view=grid|index, ?tag=<chip
// key>, ?density=2|inf and ?fig=<media id>. Defaults are left out. The server
// always renders the defaults; the client reads the real query after
// hydration (components/work/use-view-state.ts).

export type WorkView = "log" | "grid" | "index";
export type Density = "1" | "2" | "inf";

export interface ViewState {
  view: WorkView;
  tag: string;
  density: Density;
  fig: string | null;
}

export interface ValidValues {
  tags: ReadonlySet<string>;
  figs: ReadonlySet<string>;
}

export const DEFAULT_VIEW_STATE: ViewState = { view: "log", tag: "all", density: "1", fig: null };

const VIEWS: readonly string[] = ["log", "grid", "index"];

interface ParamReader {
  get(name: string): string | null;
}

export function validValues(media: { id: string }[], chips: { key: string }[]): ValidValues {
  return { tags: new Set(chips.map((chip) => chip.key)), figs: new Set(media.map((item) => item.id)) };
}

// Unknown or out-of-place values fall back to the defaults: tag only applies
// outside the Log, density only in the Grid.
export function parseViewState(params: ParamReader, valid: ValidValues): ViewState {
  const viewParam = params.get("view") ?? "";
  const view = VIEWS.includes(viewParam) ? (viewParam as WorkView) : "log";
  const tagParam = params.get("tag");
  const tag = view !== "log" && tagParam && valid.tags.has(tagParam) ? tagParam : "all";
  const densityParam = params.get("density");
  const density: Density = view === "grid" && (densityParam === "2" || densityParam === "inf") ? densityParam : "1";
  const figParam = params.get("fig");
  const fig = figParam && valid.figs.has(figParam) ? figParam : null;
  return { view, tag, density, fig };
}

export function viewStateQuery(state: ViewState): string {
  const params = new URLSearchParams();
  if (state.view !== "log") params.set("view", state.view);
  if (state.view !== "log" && state.tag !== "all") params.set("tag", state.tag);
  if (state.view === "grid" && state.density !== "1") params.set("density", state.density);
  if (state.fig) params.set("fig", state.fig);
  const query = params.toString();
  return query ? `?${query}` : "";
}
```

`lib/work/figma.ts`:

```ts
import type { FigmaRef } from "@/content/work/types";

// Figma's URLs use node-id=12-345; its API uses 12:345.
export function normalizeNodeId(id: string): string {
  return id.trim().replace(/-/g, ":");
}

function dashed(nodeId: string): string {
  return nodeId.replace(/:/g, "-");
}

export function figmaDesignUrl(ref: FigmaRef): string {
  return `https://www.figma.com/design/${ref.fileKey}?node-id=${dashed(ref.nodeId)}`;
}

// Loaded only after a click (MediaViewer), so Figma's script and cookies
// reach only visitors who ask for them.
export function figmaEmbedUrl(ref: FigmaRef): string {
  return `https://embed.figma.com/design/${ref.fileKey}?node-id=${dashed(ref.nodeId)}&embed-host=onursenture`;
}
```

Run: `npx vitest run tests/work/url-state.test.ts tests/work/figma.test.ts`
Expected: PASS.

- [ ] **Step 9: Write the failing tests for `validateWork`**

Create `tests/work/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";
import { validateWork } from "@/lib/work/validate";

function study(overrides: Partial<CaseStudy> = {}): CaseStudy {
  return {
    slug: "primeone",
    org: "primetek",
    title: "PrimeOne",
    kind: "design system",
    years: "2023–2026",
    lead: { strong: "PrimeOne.", rest: "A kit." },
    intro: [],
    facts: [],
    links: [{ label: "primevue.org", href: "https://primevue.org" }],
    hero: { id: "cover", caption: "Cover" },
    entries: [
      { id: "3-0", date: "2024-11", version: "3.0", note: "n", source: "https://x.com/w00f/status/1", media: [{ id: "overview", caption: "o", tags: ["tokens"] }] },
    ],
    ...overrides,
  };
}

const row: ArchiveEntry = { id: "aura", org: "primetek", date: "2024-01", title: "Aura", note: "n", source: "https://x.com/primevue/status/1" };
const noImages = () => false;

describe("validateWork", () => {
  it("accepts valid content", () => {
    expect(validateWork([study()], [row], noImages)).toEqual([]);
  });

  it("rejects ids that aren't kebab-case or repeat", () => {
    const errors = validateWork(
      [study({ hero: { id: "Cover", caption: "c" }, entries: [
        { id: "a", date: "2024-01", note: "n", media: [{ id: "x", caption: "" }] },
        { id: "a", date: "2024-02", note: "n", media: [{ id: "x", caption: "" }] },
      ] })],
      [row, row],
      noImages,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('media id "Cover" is not kebab-case'),
        expect.stringContaining('duplicate entry id "a"'),
        expect.stringContaining('duplicate media id "x"'),
        expect.stringContaining('duplicate archive id "aura"'),
      ]),
    );
  });

  it("rejects bad dates, non-https URLs, unknown images and bad node ids", () => {
    const errors = validateWork(
      [study({ links: [{ label: "x", href: "http://x.com" }], entries: [
        { id: "b", date: "2024-13", note: "n", source: "http://x.com", media: [
          { id: "y", caption: "", image: "work/missing", figma: { fileKey: "k", nodeId: "12-3" }, credits: [{ name: "A", href: "ftp://a" }] },
        ] },
      ] })],
      [{ ...row, date: "2024", source: "x.com/1" }],
      noImages,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('date "2024-13"'),
        expect.stringContaining('"http://x.com" must be https'),
        expect.stringContaining('image "work/missing" is not in the manifest'),
        expect.stringContaining('nodeId "12-3"'),
        expect.stringContaining('"ftp://a" must be https'),
        expect.stringContaining('date "2024"'),
        expect.stringContaining('"x.com/1" must be https'),
      ]),
    );
  });

  it("rejects tags that would collide with a chip key", () => {
    const errors = validateWork(
      [study({ entries: [{ id: "3-0", date: "2024-11", note: "n", media: [{ id: "o", caption: "", tags: ["all", "3-0", "Bad Tag"] }] }] })],
      [],
      noImages,
    );
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('tag "all" collides'),
        expect.stringContaining('tag "3-0" collides'),
        expect.stringContaining('tag "Bad Tag" is not kebab-case'),
      ]),
    );
  });

  it("rejects duplicate slugs", () => {
    expect(validateWork([study(), study()], [], noImages)).toEqual([expect.stringContaining('duplicate slug "primeone"')]);
  });
});
```

Run: `npx vitest run tests/work/validate.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 10: Write `lib/work/validate.ts`**

```ts
import type { ArchiveEntry, CaseStudy, Credit, Media } from "@/content/work/types";

// Registry checks, run by tests/content/work.test.ts in CI. Returns every
// problem as a readable line instead of throwing at the first one.

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const NODE_ID = /^\d+:\d+$/;

export function validateWork(
  studies: CaseStudy[],
  archive: ArchiveEntry[],
  hasImage: (key: string) => boolean,
): string[] {
  const errors: string[] = [];

  const url = (where: string, href: string) => {
    if (!href.startsWith("https://")) errors.push(`${where}: "${href}" must be https`);
  };
  const date = (where: string, value: string) => {
    if (!YEAR_MONTH.test(value)) errors.push(`${where}: date "${value}" must be YYYY-MM`);
  };
  const credits = (where: string, list: Credit[] = []) => {
    for (const credit of list) if (credit.href) url(where, credit.href);
  };
  const media = (where: string, item: Media, seen: Set<string>, chipKeys: Set<string>) => {
    if (!KEBAB.test(item.id)) errors.push(`${where}: media id "${item.id}" is not kebab-case`);
    if (seen.has(item.id)) errors.push(`${where}: duplicate media id "${item.id}"`);
    seen.add(item.id);
    if (item.image && !hasImage(item.image)) errors.push(`${where}: image "${item.image}" is not in the manifest`);
    if (item.figma && !NODE_ID.test(item.figma.nodeId)) {
      errors.push(`${where}: figma nodeId "${item.figma.nodeId}" must look like 12:345`);
    }
    for (const tag of item.tags ?? []) {
      if (!KEBAB.test(tag)) errors.push(`${where}: tag "${tag}" is not kebab-case`);
      else if (chipKeys.has(tag)) errors.push(`${where}: tag "${tag}" collides with a chip key`);
    }
    credits(where, item.credits);
  };

  const slugs = new Set<string>();
  for (const study of studies) {
    if (slugs.has(study.slug)) errors.push(`duplicate slug "${study.slug}"`);
    slugs.add(study.slug);
    for (const link of study.links) url(`${study.slug} link`, link.href);

    const entryIds = new Set<string>();
    for (const entry of study.entries) {
      const where = `${study.slug}/${entry.id}`;
      if (!KEBAB.test(entry.id)) errors.push(`${where}: entry id "${entry.id}" is not kebab-case`);
      if (entryIds.has(entry.id)) errors.push(`${where}: duplicate entry id "${entry.id}"`);
      entryIds.add(entry.id);
    }
    // Tags share the ?tag= namespace with "all" and the entry ids.
    const chipKeys = new Set(["all", ...entryIds]);
    const mediaIds = new Set<string>();
    media(`${study.slug} hero`, study.hero, mediaIds, chipKeys);
    for (const entry of study.entries) {
      const where = `${study.slug}/${entry.id}`;
      date(where, entry.date);
      if (entry.source) url(where, entry.source);
      for (const link of entry.links ?? []) url(where, link.href);
      credits(where, entry.credits);
      for (const item of entry.media) media(where, item, mediaIds, chipKeys);
    }
  }

  const archiveIds = new Set<string>();
  const archiveMedia = new Set<string>();
  for (const row of archive) {
    const where = `archive/${row.id}`;
    if (!KEBAB.test(row.id)) errors.push(`${where}: archive id "${row.id}" is not kebab-case`);
    if (archiveIds.has(row.id)) errors.push(`${where}: duplicate archive id "${row.id}"`);
    archiveIds.add(row.id);
    date(where, row.date);
    url(where, row.source);
    credits(where, row.credits);
    if (row.media) media(where, row.media, archiveMedia, new Set(["all"]));
  }

  return errors;
}
```

Run: `npx vitest run tests/work/validate.test.ts`
Expected: PASS.

- [ ] **Step 11: Write `lib/work/index.ts` and the registry test**

`lib/work/index.ts`:

```ts
import { archive, caseStudies } from "@/content/work";
import type { CaseStudy, Fact } from "@/content/work/types";
import { findImage } from "@/lib/images/manifest";
import { type ArchiveView, type StudyView, buildArchiveView, buildStudyView } from "./derive";

// The server-side read API for the work pages: content bound to the image
// manifest. Sprint 7's admin overlay will merge its edits here.

export function getCaseStudies(): CaseStudy[] {
  return caseStudies;
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}

export function getStudyView(study: CaseStudy): StudyView {
  return buildStudyView(study, findImage);
}

export function getArchiveView(): ArchiveView {
  return buildArchiveView(archive, findImage);
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// The header facts, plus computed ones. Templates counts its templates and
// their pages (media tagged "page"), so the numbers are always true.
export function caseStudyFacts(study: CaseStudy, view: StudyView): Fact[] {
  if (study.slug !== "templates") return study.facts;
  const pages = view.media.filter((item) => item.tags.includes("page")).length;
  const templates = plural(study.entries.length, "template");
  return [...study.facts, { label: "Coverage", value: pages > 0 ? `${templates} · ${plural(pages, "page")}` : templates }];
}
```

Create `tests/content/work.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { archive, caseStudies } from "@/content/work";
import { hasImage } from "@/lib/images/manifest";
import { validateWork } from "@/lib/work/validate";

describe("content/work", () => {
  it("passes every registry check", () => {
    expect(validateWork(caseStudies, archive, hasImage)).toEqual([]);
  });
});
```

Run: `npx vitest run tests/work tests/content/work.test.ts`
Expected: PASS.

- [ ] **Step 12: Run every check and commit**

Run the Global Constraints checks (typecheck, lint, test, build, e2e, fixture build + e2e, final build). All pass. Existing photo pages still render through `Picture`, so `e2e/photos.spec.ts` covers the split.

```bash
git add content/work lib/work lib/images/manifest.ts components/picture.tsx components/picture-view.tsx tests/work tests/content/work.test.ts
git commit -m "Add the work content model and its pure view logic

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Seed content from the @w00f archive

Draft content, from Onur's own posts only. Every entry carries its source. Task 11 extends and corrects it with the PrimeTek-account research. Each media item is a placeholder slot (dither wash) until `npm run figma` fills it.

**Files:**
- Create: `content/work/primeone.ts`, `content/work/primeblocks.ts`, `content/work/primeicons.ts`, `content/work/templates.ts`, `content/work/archive.ts`
- Modify: `content/work/index.ts`
- Test: `tests/content/work.test.ts`

**Interfaces:**
- Consumes: the types from Task 2 (`content/work/types.ts`).
- Produces:
  - `caseStudies` in order PrimeOne, PrimeBlocks, PrimeIcons, Templates.
  - `archive` with two entries.
  - Ids later tasks' e2e tests rely on:
    - PrimeOne: hero `cover`; entries `kit-2022`, `2-2`, `3-0` (media `overview-3-0`, `tokens-3-0` tagged `tokens`) and `4-0`.
    - Templates: entry `genesis` with media `genesis-cover`, credited to `@umitceliks` (design) and `@tanerengiin` (implementation); entry `verona` with media `verona-cover` and `verona-landing` (tagged `page`).
    - Archive: `theme-gallery`, `visual-theme-editor`.

- [ ] **Step 1: Extend the registry test (failing)**

Replace `tests/content/work.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { archive, caseStudies } from "@/content/work";
import { hasImage } from "@/lib/images/manifest";
import { validateWork } from "@/lib/work/validate";

describe("content/work", () => {
  it("passes every registry check", () => {
    expect(validateWork(caseStudies, archive, hasImage)).toEqual([]);
  });

  it("lists the four PrimeTek case studies in display order", () => {
    expect(caseStudies.map((s) => s.slug)).toEqual(["primeone", "primeblocks", "primeicons", "templates"]);
    for (const study of caseStudies) expect(study.org).toBe("primetek");
  });

  it("gives every entry a source, so each note can be checked", () => {
    for (const study of caseStudies) {
      expect(study.entries.length).toBeGreaterThan(0);
      for (const entry of study.entries) expect(entry.source, `${study.slug}/${entry.id}`).toMatch(/^https:\/\//);
    }
  });

  it("states Onur's role on every case study", () => {
    for (const study of caseStudies) expect(study.facts.find((f) => f.label === "Role")?.value).toBe("Design lead");
  });

  it("credits Genesis to the colleagues who designed and built it", () => {
    const genesis = caseStudies.find((s) => s.slug === "templates")!.entries.find((e) => e.id === "genesis")!;
    expect(genesis.credits).toEqual([
      { name: "@umitceliks", href: "https://x.com/umitceliks" },
      { name: "@tanerengiin", role: "implementation", href: "https://x.com/tanerengiin" },
    ]);
  });

  it("never states an unconfirmed headline number", () => {
    const text = JSON.stringify({ caseStudies, archive });
    for (const claim of ["80+", "500 blocks", "25+"]) expect(text).not.toContain(claim);
  });
});
```

Run: `npx vitest run tests/content/work.test.ts`
Expected: FAIL (the registry is empty).

- [ ] **Step 2: Write `content/work/primeone.ts`**

```ts
import type { CaseStudy } from "./types";

// Draft (Sprint 5, Task 3): every line comes from Onur's posts; Task 11 adds
// the PrimeTek-account research and Onur confirms on the preview.
export const primeone: CaseStudy = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  years: "2022–2026",
  lead: {
    strong: "PrimeOne.",
    rest: "The Figma design system behind PrimeVue, PrimeNG and PrimeReact.",
  },
  intro: ["A token-driven Figma kit that mirrors the components and themes of the Prime libraries, release for release."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2022–2026" },
    { label: "Tools", value: "Figma, Figma Variables, design tokens" },
  ],
  links: [],
  hero: { id: "cover", caption: "PrimeOne" },
  entries: [
    {
      // Draft: confirm this kit is PrimeOne's first release (Task 11).
      id: "kit-2022",
      date: "2022-07",
      title: "Figma UI kit",
      note: "An all-new Figma UI kit, rebuilt on variants and auto layout, in light and dark modes.",
      source: "https://x.com/w00f/status/1551880003134128128",
      media: [{ id: "kit-2022", caption: "Figma UI kit" }],
    },
    {
      id: "2-2",
      date: "2023-12",
      version: "2.2",
      note: "Tokens reworked and aligned with the code.",
      source: "https://x.com/w00f/status/1734153327552672006",
      media: [{ id: "tokens-2-2", caption: "Tokens", tags: ["tokens"] }],
    },
    {
      id: "3-0",
      date: "2024-11",
      version: "3.0",
      note: "Redesigned from the ground up for the new theming engine.",
      source: "https://x.com/w00f/status/1854537901700186303",
      media: [
        { id: "overview-3-0", caption: "Overview" },
        { id: "tokens-3-0", caption: "Tokens", tags: ["tokens"] },
      ],
    },
    {
      id: "4-0",
      date: "2026-01",
      version: "4.0",
      note: "Design tokens re-architected around native Figma Variable collections.",
      source: "https://x.com/w00f/status/2013248948748656769",
      media: [{ id: "variables-4-0", caption: "Variable collections", tags: ["tokens"] }],
    },
  ],
};
```

- [ ] **Step 3: Write `content/work/primeblocks.ts`**

```ts
import type { CaseStudy } from "./types";

// Draft (Sprint 5, Task 3); see primeone.ts.
export const primeblocks: CaseStudy = {
  slug: "primeblocks",
  org: "primetek",
  title: "PrimeBlocks",
  kind: "UI blocks",
  years: "2022–2025",
  lead: {
    strong: "PrimeBlocks.",
    rest: "Ready-made UI blocks for the Prime libraries, designed in Figma and kept in sync with the code.",
  },
  intro: ["Application and marketing blocks, relaunched in 2024 on Tailwind CSS and redesigned block by block."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2022–2025" },
    { label: "Tools", value: "Figma, Tailwind CSS" },
  ],
  links: [{ label: "primeblocks.org", href: "https://primeblocks.org" }],
  hero: { id: "cover", caption: "PrimeBlocks" },
  entries: [
    {
      id: "3-1-1",
      date: "2022-12",
      version: "3.1.1",
      note: "The Figma file fully synced with the code.",
      source: "https://x.com/w00f/status/1602656029464006658",
      media: [{ id: "figma-sync", caption: "Figma file" }],
    },
    {
      id: "next-gen",
      date: "2024-09",
      title: "Next-gen PrimeBlocks",
      note: "Relaunched on Tailwind CSS, starting with Vue: PrimeTek's first SaaS product.",
      source: "https://x.com/w00f/status/1834178438665576753",
      media: [{ id: "next-gen", caption: "Next-gen launch" }],
    },
    {
      id: "redesign",
      date: "2025-07",
      title: "Full redesign",
      note: "The e-commerce update completed the redesign of every block.",
      source: "https://x.com/w00f/status/1948024774577287515",
      media: [{ id: "ecommerce", caption: "E-commerce blocks" }],
    },
  ],
};
```

- [ ] **Step 4: Write `content/work/primeicons.ts`**

```ts
import type { CaseStudy } from "./types";

// Draft (Sprint 5, Task 3); see primeone.ts. The live icon grid comes from
// the primeicons package (7.0.0, MIT), not from this file.
export const primeicons: CaseStudy = {
  slug: "primeicons",
  org: "primetek",
  title: "PrimeIcons",
  kind: "icon set",
  years: "2018–2024",
  lead: {
    strong: "PrimeIcons.",
    rest: "The icon library of the Prime libraries, drawn to replace Font Awesome.",
  },
  intro: ["Started in 2018 to drop the Font Awesome dependency; past a million downloads by April 2019."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2018–2024" },
    { label: "Tools", value: "Figma, SVG, icon fonts" },
  ],
  links: [{ label: "GitHub", href: "https://github.com/primefaces/primeicons" }],
  hero: { id: "cover", caption: "PrimeIcons" },
  entries: [
    {
      id: "alpha",
      date: "2018-05",
      title: "First alpha",
      note: "Drawing the set that would remove the Font Awesome dependency, three icons short of the first alpha.",
      source: "https://x.com/w00f/status/991654451231494144",
      media: [],
    },
    {
      id: "150k",
      date: "2018-09",
      title: "150,000 downloads",
      note: "The pre-release passed 150,000 downloads on the way to 1.0.",
      source: "https://x.com/w00f/status/1039612365258547200",
      media: [],
    },
    {
      id: "1-0",
      date: "2018-10",
      version: "1.0",
      note: "Version 1.0 released.",
      source: "https://x.com/w00f/status/1052113437382328320",
      media: [{ id: "set-1-0", caption: "The 1.0 set" }],
    },
    {
      id: "1m",
      date: "2019-04",
      title: "1M downloads",
      note: "Past one million downloads.",
      source: "https://x.com/w00f/status/1123275841079795712",
      media: [],
    },
    {
      id: "7-0",
      date: "2024-03",
      version: "7.0",
      note: "That year's icon update: version 7.0.0.",
      source: "https://x.com/w00f/status/1773662703183118550",
      media: [{ id: "set-7-0", caption: "The 7.0 set" }],
    },
  ],
};
```

- [ ] **Step 5: Write `content/work/templates.ts`**

```ts
import type { CaseStudy } from "./types";

// Draft (Sprint 5, Task 3); see primeone.ts. Onur led design on every
// template; `credits` names colleagues where they designed a template or a
// page (spec §4.2).
export const templates: CaseStudy = {
  slug: "templates",
  org: "primetek",
  title: "Templates",
  kind: "app templates",
  years: "2017–2024",
  lead: {
    strong: "Templates.",
    rest: "Premium application templates for PrimeFaces, PrimeNG, PrimeVue and PrimeReact.",
  },
  intro: ["Each one a complete app: dashboards, apps, landing and auth pages, themed for the Prime component libraries."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2017–2024" },
  ],
  links: [],
  hero: { id: "cover", caption: "Templates" },
  entries: [
    {
      id: "verona",
      date: "2017-01",
      title: "Verona",
      frameworks: ["JSF"],
      note: "A premium application template for PrimeFaces.",
      source: "https://x.com/w00f/status/821000764709539840",
      media: [
        { id: "verona-cover", caption: "Verona" },
        { id: "verona-landing", caption: "Landing", tags: ["page"] },
      ],
    },
    {
      id: "paradise",
      date: "2017-04",
      title: "Paradise",
      frameworks: ["JSF", "Angular"],
      note: "A minimalist application template for PrimeFaces, followed by a PrimeNG version a month later.",
      source: "https://x.com/w00f/status/856854851145408512",
      links: [{ label: "PrimeNG launch", href: "https://x.com/w00f/status/867305687549980672" }],
      media: [{ id: "paradise-cover", caption: "Paradise" }],
    },
    {
      id: "manhattan",
      date: "2017-07",
      title: "Manhattan",
      frameworks: ["JSF"],
      note: "A premium application template for PrimeFaces.",
      source: "https://x.com/w00f/status/881829683440099330",
      media: [{ id: "manhattan-cover", caption: "Manhattan" }],
    },
    {
      id: "avalon",
      date: "2017-08",
      title: "Avalon",
      frameworks: ["JSF"],
      note: "Bootstrap meets PrimeFaces: an application template for PrimeFaces.",
      source: "https://x.com/w00f/status/894495436509261824",
      media: [{ id: "avalon-cover", caption: "Avalon" }],
    },
    {
      id: "babylon",
      date: "2018-10",
      title: "Babylon",
      frameworks: ["JSF"],
      note: "A premium application template for PrimeFaces.",
      source: "https://x.com/w00f/status/1047438960329408512",
      media: [{ id: "babylon-cover", caption: "Babylon" }],
    },
    {
      id: "genesis",
      date: "2024-12",
      title: "Genesis",
      frameworks: ["React"],
      note: "Prime's first multipurpose premium template, built with React and Next.js.",
      source: "https://x.com/w00f/status/1867143128396058914",
      credits: [
        { name: "@umitceliks", href: "https://x.com/umitceliks" },
        { name: "@tanerengiin", role: "implementation", href: "https://x.com/tanerengiin" },
      ],
      media: [{ id: "genesis-cover", caption: "Genesis" }],
    },
  ],
};
```

- [ ] **Step 6: Write `content/work/archive.ts` and fill the registry**

`content/work/archive.ts`:

```ts
import type { ArchiveEntry } from "./types";

// Other PrimeTek work, from the posts that announced it (spec §4.3). Draft
// (Sprint 5, Task 3): Task 11 adds the PrimeTek-account research.
export const archiveEntries: ArchiveEntry[] = [
  {
    id: "theme-gallery",
    org: "primetek",
    date: "2023-09",
    title: "Theme Designer gallery",
    note: "A gallery for sharing designs made with the new Theme Designer.",
    source: "https://x.com/w00f/status/1699028097872371916",
  },
  {
    id: "visual-theme-editor",
    org: "primetek",
    date: "2024-11",
    title: "Visual Theme Editor",
    note: "A visual editor for custom PrimeVue themes, from idea to release in under a week.",
    source: "https://x.com/w00f/status/1857050715224494345",
  },
];
```

Replace `content/work/index.ts` with:

```ts
import { archiveEntries } from "./archive";
import { primeblocks } from "./primeblocks";
import { primeicons } from "./primeicons";
import { primeone } from "./primeone";
import { templates } from "./templates";
import type { ArchiveEntry, CaseStudy } from "./types";

// Case studies in /work/ display order, and the Archive entries.
export const caseStudies: CaseStudy[] = [primeone, primeblocks, primeicons, templates];

export const archive: ArchiveEntry[] = archiveEntries;
```

Run: `npx vitest run tests/content/work.test.ts`
Expected: PASS.

- [ ] **Step 7: Run every check and commit**

Run the Global Constraints checks. All pass.

```bash
git add content/work tests/content/work.test.ts
git commit -m "Seed the PrimeTek case studies and archive from Onur's posts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The case study page — header, hero and release log

**Files:**
- Create: `components/work/media-figure.tsx`, `components/work/media-button.tsx`, `components/work/credit-line.tsx`, `components/work/log-view.tsx`, `components/work/study-body.tsx`, `components/work/case-study-header.tsx`
- Create: `app/(work)/work/[slug]/page.tsx`
- Test: `tests/ui/work.test.tsx`, `e2e/work-case-study.spec.ts`

**Interfaces:**
- Consumes: from Task 2, `StudyView`, `MediaView`, `EntryView`, `groupCredits` (`lib/work/derive.ts`); `getCaseStudies`, `getCaseStudy`, `getStudyView`, `caseStudyFacts` (`lib/work/index.ts`); `PictureView`; `CaseStudy`, `Fact`.
- Produces:
  - `MediaFigure({ media, sizes, ratio?, bare?, fit?, priority?, className? })`.
  - `MediaButton({ media, onOpen?, ...MediaFigure props })`, which renders `button[data-media=<id>]`.
  - `CreditLine({ credits, className? })`, which renders `p[data-credits]`.
  - `LogView({ study, onOpen?, onShowEntry? })`, a `div[data-view="log"]`.
  - `StudyBody({ study, onChange?, onOpen? })`. Task 5 adds `state`.
  - `CaseStudyHeader({ study, facts })`.
  - The route `/work/<slug>/`.

- [ ] **Step 1: Write the failing component tests**

Create `tests/ui/work.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CreditLine } from "@/components/work/credit-line";
import { LogView } from "@/components/work/log-view";
import { MediaFigure } from "@/components/work/media-figure";
import type { CaseStudy } from "@/content/work/types";
import { buildStudyView } from "@/lib/work/derive";

const html = renderToStaticMarkup;

const study: CaseStudy = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  years: "2023–2026",
  lead: { strong: "PrimeOne.", rest: "A kit." },
  intro: [],
  facts: [],
  links: [],
  hero: { id: "cover", caption: "Cover" },
  entries: [
    {
      id: "3-0",
      date: "2024-11",
      version: "3.0",
      note: "Rebuilt.",
      source: "https://x.com/w00f/status/1",
      credits: [{ name: "Ada", href: "https://ada.example" }],
      media: [
        { id: "overview", caption: "Overview" },
        { id: "tokens", caption: "Tokens" },
      ],
    },
    { id: "4-0", date: "2026-01", version: "4.0", note: "Variables.", media: [] },
  ],
};
const view = buildStudyView(study, (key) => (key === "work/primeone/cover" ? { width: 1600, height: 1000, widths: [640, 1280, 1600] } : undefined));

describe("MediaFigure", () => {
  it("renders the image when one exists", () => {
    const markup = html(<MediaFigure media={view.hero} sizes="100vw" />);
    expect(markup).toContain("/images/work/primeone/cover-1600.jpg");
    expect(markup).toContain('alt="Cover"');
  });

  it("renders a labelled placeholder otherwise, and drops the label when bare", () => {
    const placeholder = view.media.find((m) => m.id === "tokens")!;
    expect(html(<MediaFigure media={placeholder} sizes="100vw" />)).toContain("FIG. 02.2 · Tokens");
    expect(html(<MediaFigure media={placeholder} sizes="100vw" bare />)).not.toContain("FIG.");
  });
});

describe("CreditLine", () => {
  it("renders nothing without credits, and role-grouped linked names otherwise", () => {
    expect(html(<CreditLine credits={[]} />)).toBe("");
    const markup = html(<CreditLine credits={[{ name: "Ada", href: "https://ada.example" }, { name: "Bo", role: "implementation" }]} />);
    expect(markup).toContain("Design: ");
    expect(markup).toContain('href="https://ada.example"');
    expect(markup).toContain(" · Implementation: ");
    expect(markup).toContain("Bo");
  });
});

describe("LogView", () => {
  const markup = html(<LogView study={view} />);

  it("groups by year, newest first", () => {
    expect(markup.indexOf(">2026<")).toBeLessThan(markup.indexOf(">2024<"));
  });

  it("shows the heading with its month, the note, the credit and the source", () => {
    expect(markup).toContain("3.0");
    expect(markup).toContain("· Nov");
    expect(markup).toContain("Rebuilt.");
    expect(markup).toContain("Design: ");
    expect(markup).toContain('href="https://x.com/w00f/status/1"');
  });

  it("shows the first figure and a link to the rest", () => {
    expect(markup).toContain('data-media="overview"');
    expect(markup).not.toContain('data-media="tokens"');
    expect(markup).toContain("+1 in Grid →");
  });
});
```

Run: `npx vitest run tests/ui/work.test.tsx`
Expected: FAIL (components missing).

- [ ] **Step 2: Write `components/work/media-figure.tsx`, `media-button.tsx` and `credit-line.tsx`**

`components/work/media-figure.tsx`:

```tsx
import { PictureView } from "@/components/picture-view";
import { PlaceholderWash } from "@/components/ui/dither";
import { cx } from "@/lib/cx";
import type { MediaAspect } from "@/content/work/types";
import type { MediaView } from "@/lib/work/derive";

const RATIO: Record<MediaAspect, string> = {
  "16/9": "aspect-[16/9]",
  "16/10": "aspect-[16/10]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
};

export interface MediaFigureProps {
  media: MediaView;
  sizes: string;
  // A ratio class that overrides the media's aspect (the hero: 16/10, 21/9
  // from md; thumbnails: 4/3).
  ratio?: string;
  // No FIG label (thumbnails, the densest grid).
  bare?: boolean;
  // Fit inside the viewer stage instead of filling the width.
  fit?: boolean;
  priority?: boolean;
  className?: string;
}

// A work media slot. It renders the image when one exists. Otherwise it is
// the Sprint 4 labelled dither wash ("FIG. 03.2 · Tokens"): it stays live
// until `npm run figma` or Sprint 7's upload fills it, so it must look
// intentional. Server- and client-safe: no manifest import.
export function MediaFigure({ media, sizes, ratio, bare = false, fit = false, priority = false, className }: MediaFigureProps) {
  if (media.image) {
    return (
      <PictureView
        image={media.image.key}
        entry={media.image}
        alt={media.caption}
        sizes={sizes}
        priority={priority}
        className={cx(
          fit ? "mx-auto max-h-[62dvh] w-auto max-w-full border object-contain" : cx("w-full border object-cover", ratio ?? RATIO[media.aspect]),
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cx(
        "relative overflow-hidden border",
        fit ? "aspect-[16/10] max-h-[62dvh] w-full max-w-5xl" : cx("w-full", ratio ?? RATIO[media.aspect]),
        className,
      )}
    >
      <PlaceholderWash tone="accent" />
      {bare ? null : (
        <span aria-hidden="true" className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-bg px-1.5 type-label text-fg">
          {media.label} · {media.caption}
        </span>
      )}
    </div>
  );
}
```

`components/work/media-button.tsx`:

```tsx
import { MediaFigure, type MediaFigureProps } from "./media-figure";

// A figure that opens the viewer. `onOpen` arrives from the client
// StudyBrowser. In the server-rendered fallback it is undefined and the
// button is inert until hydration.
export function MediaButton({ onOpen, ...figure }: MediaFigureProps & { onOpen?: (id: string) => void }) {
  const { media } = figure;
  return (
    <button
      type="button"
      data-media={media.id}
      onClick={() => onOpen?.(media.id)}
      aria-label={`Open ${media.label}: ${media.caption}`}
      className="block w-full cursor-zoom-in text-left"
    >
      <MediaFigure {...figure} />
    </button>
  );
}

```

`components/work/credit-line.tsx`:

```tsx
import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { cx } from "@/lib/cx";
import type { Credit } from "@/content/work/types";
import { groupCredits } from "@/lib/work/derive";

// "Design: Ada, Bo · Implementation: Cy". Names link when they have an href.
// Renders nothing without credits.
export function CreditLine({ credits, className }: { credits: Credit[]; className?: string }) {
  if (credits.length === 0) return null;
  return (
    <p data-credits className={cx("type-meta text-fg-muted", className)}>
      {groupCredits(credits).map((group, groupIndex) => (
        <Fragment key={group.role}>
          {groupIndex > 0 ? " · " : null}
          {group.role}:{" "}
          {group.people.map((person, personIndex) => (
            <Fragment key={person.name}>
              {personIndex > 0 ? ", " : null}
              {person.href ? (
                <ItemLink href={person.href} className="text-fg">
                  {person.name}
                </ItemLink>
              ) : (
                <span className="text-fg">{person.name}</span>
              )}
            </Fragment>
          ))}
        </Fragment>
      ))}
    </p>
  );
}
```

- [ ] **Step 3: Write `components/work/log-view.tsx` and `components/work/study-body.tsx`**

`components/work/log-view.tsx`:

```tsx
import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { TextLink } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";
import type { EntryView, StudyView } from "@/lib/work/derive";
import { CreditLine } from "./credit-line";
import { MediaButton } from "./media-button";

// At lg the figure column is what's left after the padding (80), the label
// (200), the text (480) and two gaps (56).
const FIGURE_SIZES = "(min-width: 1024px) calc(100vw - 816px), (min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)";

// The release log: year groups, newest first. The Doto year sticks while its
// group scrolls (lg only). Each entry shows its first figure; "+N in Grid →"
// opens the Grid filtered to that entry.
export function LogView({
  study,
  onOpen,
  onShowEntry,
}: {
  study: StudyView;
  onOpen?: (id: string) => void;
  onShowEntry?: (entryId: string) => void;
}) {
  return (
    <div data-view="log">
      {study.groups.map((group, index) => (
        <Fragment key={group.year}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          <section
            aria-labelledby={`year-${group.year}`}
            className="grid gap-4 px-4 py-8 md:px-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-7 lg:py-[30px]"
          >
            <div>
              <h2 id={`year-${group.year}`} className="type-name lg:sticky lg:top-6">
                {group.year}
              </h2>
            </div>
            <ol className="flex flex-col gap-10">
              {group.items.map((entry) => (
                <li key={entry.id} id={`entry-${entry.id}`}>
                  <EntryBlock entry={entry} moreLabel={study.moreLabel} onOpen={onOpen} onShowEntry={onShowEntry} />
                </li>
              ))}
            </ol>
          </section>
        </Fragment>
      ))}
    </div>
  );
}

function EntryBlock({
  entry,
  moreLabel,
  onOpen,
  onShowEntry,
}: {
  entry: EntryView;
  moreLabel: StudyView["moreLabel"];
  onOpen?: (id: string) => void;
  onShowEntry?: (entryId: string) => void;
}) {
  const [first, ...rest] = entry.media;
  return (
    <article className={cx("grid gap-4", first && "lg:grid-cols-[minmax(0,480px)_1fr] lg:gap-7")}>
      <div className="flex flex-col gap-2">
        <h3 className="type-body">
          <span className="font-medium">{entry.heading}</span> <span className="text-fg-muted">· {entry.month}</span>
        </h3>
        {entry.frameworks.length > 0 ? (
          <ul aria-label="Frameworks" className="flex flex-wrap gap-1.5">
            {entry.frameworks.map((framework) => (
              <li key={framework} className="border px-1.5 type-label text-fg-muted">
                {framework}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="type-body text-fg-soft">{entry.note}</p>
        <CreditLine credits={entry.credits} />
        {entry.source || entry.links.length > 0 ? (
          <p className="flex flex-wrap gap-x-4 type-meta">
            {entry.source ? (
              <TextLink href={entry.source} className="text-accent">
                post
              </TextLink>
            ) : null}
            {entry.links.map((link) => (
              <TextLink key={link.href} href={link.href} className="text-accent">
                {link.label}
              </TextLink>
            ))}
          </p>
        ) : null}
      </div>
      {first ? (
        <div className="flex flex-col gap-1.5">
          <MediaButton media={first} onOpen={onOpen} sizes={FIGURE_SIZES} />
          {rest.length > 0 ? (
            <button
              type="button"
              onClick={() => onShowEntry?.(entry.id)}
              className="self-start type-meta text-accent hover:underline"
            >
              +{rest.length} {rest.length === 1 ? moreLabel.one : moreLabel.many} →
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
```

`components/work/study-body.tsx`:

```tsx
"use client";

import type { StudyView } from "@/lib/work/derive";
import type { ViewState } from "@/lib/work/url-state";
import { LogView } from "./log-view";
import { MediaButton } from "./media-button";

const HERO_SIZES = "(min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)";

// Everything under a case study's header: the hero and the release log. A
// client component so StudyBrowser (Task 5) can drive it. The server renders
// it with no handlers as the <Suspense> fallback.
export function StudyBody({
  study,
  onChange,
  onOpen,
}: {
  study: StudyView;
  onChange?: (patch: Partial<ViewState>) => void;
  onOpen?: (id: string) => void;
}) {
  return (
    <div>
      <div className="px-4 pb-8 md:px-10">
        <MediaButton media={study.hero} onOpen={onOpen} sizes={HERO_SIZES} ratio="aspect-[16/10] md:aspect-[21/9]" priority />
      </div>
      <LogView study={study} onOpen={onOpen} onShowEntry={(entryId) => onChange?.({ view: "grid", tag: entryId })} />
    </div>
  );
}
```

Run: `npx vitest run tests/ui/work.test.tsx`
Expected: PASS.

- [ ] **Step 4: Write `components/work/case-study-header.tsx`**

```tsx
import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { ORGS } from "@/content/orgs";
import type { CaseStudy, Fact } from "@/content/work/types";

// The grid header (spec §3.1): back link and identity in the label column;
// lead, intro and facts in the content column; external links in the action
// column.
export function CaseStudyHeader({ study, facts }: { study: CaseStudy; facts: Fact[] }) {
  return (
    <SectionRow
      labelAs="div"
      label={
        <>
          <ItemLink href="/work/" className="text-fg-muted">
            ← Work
          </ItemLink>
          <span className="mt-4 block text-fg">{study.title}</span>
          <span className="block text-fg-muted">{study.kind}</span>
          <span className="block text-fg-muted">
            {ORGS[study.org].name} · {study.years}
          </span>
        </>
      }
      action={
        study.links.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {study.links.map((link) => (
              <li key={link.href}>
                <TextLink href={link.href}>{link.label}</TextLink>
              </li>
            ))}
          </ul>
        ) : undefined
      }
    >
      <h1 className="mb-2.5 type-lead">
        {study.lead.strong} <span className="text-fg-muted">{study.lead.rest}</span>
      </h1>
      {study.intro.map((paragraph, index) => (
        <p key={index} className="mb-2 type-body text-fg-soft">
          {paragraph}
        </p>
      ))}
      <dl className="mt-3 grid grid-cols-[10ch_1fr] gap-x-3 gap-y-0.5 type-meta">
        {facts.map((fact) => (
          <Fragment key={fact.label}>
            <dt className="text-fg-muted">{fact.label}</dt>
            <dd>{fact.value}</dd>
          </Fragment>
        ))}
      </dl>
    </SectionRow>
  );
}
```

- [ ] **Step 5: Write the route `app/(work)/work/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyHeader } from "@/components/work/case-study-header";
import { StudyBody } from "@/components/work/study-body";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import { caseStudyFacts, getCaseStudies, getCaseStudy, getStudyView } from "@/lib/work";

// One page per PrimeTek product (Sprint 5 spec §3). Unknown slugs 404 inside
// the Work shell, like unknown photos.
export function generateStaticParams() {
  return getCaseStudies().map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  const description = `${study.lead.strong} ${study.lead.rest}`;
  const hero = getStudyView(study).hero.image;
  if (!hero) return pageMetadata(study.title, { description, openGraph: { description } });
  // Social crawlers don't reliably render AVIF: always the largest JPEG.
  const ogImage = { url: renditionUrl(hero.key, hero.width, "jpg"), width: hero.width, height: hero.height, alt: study.title };
  return pageMetadata(study.title, {
    description,
    openGraph: { type: "article", description, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  });
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();
  const view = getStudyView(study);
  return (
    <main className="pb-16">
      <CaseStudyHeader study={study} facts={caseStudyFacts(study, view)} />
      <StudyBody study={view} />
    </main>
  );
}
```

- [ ] **Step 6: Write the e2e tests**

Create `e2e/work-case-study.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const STUDIES = [
  ["primeone", "PrimeOne"],
  ["primeblocks", "PrimeBlocks"],
  ["primeicons", "PrimeIcons"],
  ["templates", "Templates"],
] as const;

for (const [slug, title] of STUDIES) {
  test(`${title} renders its header, hero and release log`, async ({ page }) => {
    await page.goto(`/work/${slug}/`);
    await expect(page).toHaveTitle(`${title} · Onur Senture`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`${title}.`);
    await expect(page.getByText("Design lead", { exact: true })).toBeVisible();
    await expect(page.locator('[data-media="cover"]')).toContainText("FIG. 01");
    await expect(page.locator('[data-view="log"] h2').first()).toHaveText(/^\d{4}$/);
    await expect(page.getByRole("link", { name: "← Work" })).toHaveAttribute("href", "/work/");
  });
}

test("the PrimeOne log is newest first and links each entry's post", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.locator('[data-view="log"] h2')).toHaveText(["2026", "2024", "2023", "2022"]);
  const entry = page.locator("#entry-3-0");
  await expect(entry).toContainText("3.0");
  await expect(entry).toContainText("· Nov");
  await expect(entry.getByRole("link", { name: "post" })).toHaveAttribute("href", "https://x.com/w00f/status/1854537901700186303");
  await expect(entry.locator('[data-media="overview-3-0"]')).toContainText("FIG. 04.1 · Overview");
  await expect(entry.getByRole("button", { name: "+1 in Grid →" })).toBeVisible();
});

test("Templates credits Genesis and counts its coverage from the data", async ({ page }) => {
  await page.goto("/work/templates/");
  await expect(page.locator("#entry-genesis [data-credits]")).toHaveText("Design: @umitceliks · Implementation: @tanerengiin");
  await expect(page.locator("#entry-genesis").getByRole("list", { name: "Frameworks" })).toContainText("React");
  await expect(page.locator("dl")).toContainText(/Coverage\s*6 templates · 1 page$/);
  await expect(page.locator("#entry-verona").getByRole("button", { name: "+1 page in Grid →" })).toBeVisible();
});

test("an unknown case study 404s inside the Work shell", async ({ page }) => {
  const response = await page.goto("/work/unknown/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found." })).toBeVisible();
});

test("every canvas on a case study is decorative", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.locator("canvas").first()).toBeAttached();
  const unlabelled = await page
    .locator("canvas")
    .evaluateAll((canvases) => canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length);
  expect(unlabelled).toBe(0);
});
```

Run: `npm run build && npx playwright test e2e/work-case-study.spec.ts`
Expected: PASS.

- [ ] **Step 7: Run every check and commit**

Run the Global Constraints checks. All pass.

```bash
git add components/work app/\(work\)/work lib/work tests e2e/work-case-study.spec.ts
git commit -m "Add the case study pages with their header, hero and release log

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: Log · Grid · Index views and URL state

**Files:**
- Create: `components/work/view-bar.tsx`, `components/work/grid-view.tsx`, `components/work/index-view.tsx`, `components/work/use-view-state.ts`, `components/work/study-browser.tsx`
- Modify: `components/work/study-body.tsx`, `app/(work)/work/[slug]/page.tsx`
- Test: `tests/ui/work.test.tsx` (append), `e2e/work-views.spec.ts`

**Interfaces:**
- Consumes:
  - from Task 2: `filterMedia`, `ChipView`, `MediaView`, `StudyView`; `ViewState`, `WorkView`, `Density`, `DEFAULT_VIEW_STATE`, `parseViewState`, `viewStateQuery`, `validValues`, `ValidValues`;
  - from Task 4: `MediaFigure`, `LogView`, `MediaButton`, `StudyBody`.
- Produces:
  - `ViewBar({ chips, state, onChange?, showChips?, showDensity? })`, with button groups labelled "View", "Filter" and "Density".
  - `GridView({ media, density, onOpen? })` → `ul[data-view="grid"][data-density]`.
  - `IndexView({ media, onOpen? })` → `ol[data-view="index"]`.
  - `useViewState(valid)` → `[state, update]`, where `update(patch, mode?: "push" | "replace")`. The type is exported as `UpdateViewState`.
  - `StudyBrowser({ study })`. Task 6 adds the viewer.
  - `StudyBody({ study, state, onChange?, onOpen? })`. `state` is now required.

Review fixes from Task 4 (the controller fills these in before dispatch): _none yet_.

- [ ] **Step 1: Append failing component tests**

Append to `tests/ui/work.test.tsx`:

```tsx
import { GridView } from "@/components/work/grid-view";
import { IndexView } from "@/components/work/index-view";
import { StudyBody } from "@/components/work/study-body";
import { ViewBar } from "@/components/work/view-bar";
import { DEFAULT_VIEW_STATE } from "@/lib/work/url-state";

describe("ViewBar", () => {
  it("presses the current view, and shows chips and density only where they apply", () => {
    const log = html(<ViewBar chips={view.chips} state={DEFAULT_VIEW_STATE} />);
    expect(log).toMatch(/aria-pressed="true"[^>]*>Log</);
    expect(log).not.toContain('aria-label="Filter"');
    expect(log).not.toContain('aria-label="Density"');
    const grid = html(<ViewBar chips={view.chips} state={{ ...DEFAULT_VIEW_STATE, view: "grid", tag: "3-0" }} />);
    expect(grid).toContain('aria-label="Filter"');
    expect(grid).toContain('aria-label="Density"');
    expect(grid).toMatch(/aria-pressed="true"[^>]*>3\.0 <span[^>]*>2<\/span>/);
    const index = html(<ViewBar chips={view.chips} state={{ ...DEFAULT_VIEW_STATE, view: "index" }} />);
    expect(index).toContain('aria-label="Filter"');
    expect(index).not.toContain('aria-label="Density"');
  });
});

describe("GridView and IndexView", () => {
  it("renders a file-like card per figure with caption and group", () => {
    const markup = html(<GridView media={view.media} density="2" />);
    expect(markup).toContain('data-density="2"');
    expect(markup.match(/data-media="/g)).toHaveLength(3);
    expect(markup).toContain("Tokens");
    expect(markup).toContain("3.0");
  });

  it("lists figures with their FIG number", () => {
    const markup = html(<IndexView media={view.media} />);
    expect(markup).toContain(">02.1<");
    expect(markup).toContain(">01<");
  });
});

describe("StudyBody", () => {
  it("renders the view the state asks for", () => {
    expect(html(<StudyBody study={view} state={DEFAULT_VIEW_STATE} />)).toContain('data-view="log"');
    expect(html(<StudyBody study={view} state={{ ...DEFAULT_VIEW_STATE, view: "grid" }} />)).toContain('data-view="grid"');
    expect(html(<StudyBody study={view} state={{ ...DEFAULT_VIEW_STATE, view: "index", tag: "3-0" }} />)).not.toContain(">01<");
  });
});
```

Move the new `import` lines to the top of the file with the existing imports.

Run: `npx vitest run tests/ui/work.test.tsx`
Expected: FAIL (components missing).

- [ ] **Step 2: Write `components/work/view-bar.tsx`**

```tsx
import { cx } from "@/lib/cx";
import type { ChipView } from "@/lib/work/derive";
import type { Density, ViewState, WorkView } from "@/lib/work/url-state";

const VIEWS: { value: WorkView; label: string }[] = [
  { value: "log", label: "Log" },
  { value: "grid", label: "Grid" },
  { value: "index", label: "Index" },
];

const DENSITIES: { value: Density; label: string }[] = [
  { value: "1", label: "1×" },
  { value: "2", label: "2×" },
  { value: "inf", label: "∞" },
];

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange?: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 gap-4">
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange?.(option.value)}
            className={pressed ? "text-fg underline underline-offset-4" : "text-fg-muted hover:text-fg"}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// The bar under the hero (spec §3.2): views on the left, filter chips in Grid
// and Index, density in Grid. Scrolls sideways on narrow screens.
export function ViewBar({
  chips,
  state,
  onChange,
  showChips = true,
  showDensity = true,
}: {
  chips: ChipView[];
  state: ViewState;
  onChange?: (patch: Partial<ViewState>) => void;
  showChips?: boolean;
  showDensity?: boolean;
}) {
  return (
    <div className="flex items-center gap-x-6 overflow-x-auto border-y px-4 py-2.5 whitespace-nowrap type-meta md:px-10">
      <Segmented label="View" options={VIEWS} value={state.view} onChange={(view) => onChange?.({ view })} />
      {state.view !== "log" && showChips ? (
        <div role="group" aria-label="Filter" className="flex shrink-0 gap-1.5">
          {chips.map((chip) => {
            const pressed = chip.key === state.tag;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={pressed}
                onClick={() => onChange?.({ tag: chip.key })}
                className={cx("border px-1.5 type-label", pressed ? "border-fg text-fg" : "text-fg-muted hover:text-fg")}
              >
                {chip.label} <span className="text-fg-muted">{chip.count}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      {state.view === "grid" && showDensity ? (
        <div className="ml-auto">
          <Segmented label="Density" options={DENSITIES} value={state.density} onChange={(density) => onChange?.({ density })} />
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Write `components/work/grid-view.tsx` and `components/work/index-view.tsx`**

`components/work/grid-view.tsx`:

```tsx
import { cx } from "@/lib/cx";
import type { MediaView } from "@/lib/work/derive";
import type { Density } from "@/lib/work/url-state";
import { MediaFigure } from "./media-figure";

// Columns per density (spec §3.4): 1× = 2, 2× = 4, ∞ = 8 from lg; 1, 2, 3
// on phones.
const COLUMNS: Record<Density, string> = {
  "1": "grid-cols-1 md:grid-cols-2",
  "2": "grid-cols-2 lg:grid-cols-4",
  inf: "grid-cols-3 lg:grid-cols-8",
};

const SIZES: Record<Density, string> = {
  "1": "(min-width: 768px) 50vw, 100vw",
  "2": "(min-width: 1024px) 25vw, 50vw",
  inf: "(min-width: 1024px) 13vw, 33vw",
};

// Every figure as a file-like card (after Base): caption and "group · tag ·
// credit" over the figure. Placeholder cards stay, so a page without images
// is still complete.
export function GridView({
  media,
  density,
  onOpen,
}: {
  media: MediaView[];
  density: Density;
  onOpen?: (id: string) => void;
}) {
  return (
    <ul data-view="grid" data-density={density} className={cx("grid gap-2.5 px-4 py-6 md:px-10", COLUMNS[density])}>
      {media.map((item) => {
        const meta = [item.group, item.tags[0], ...item.credits.map((c) => c.name)].filter(Boolean).join(" · ");
        return (
          <li key={item.id} className="min-w-0">
            <button
              type="button"
              data-media={item.id}
              onClick={() => onOpen?.(item.id)}
              aria-label={`Open ${item.label}: ${item.caption}`}
              className="flex w-full cursor-zoom-in flex-col border bg-bg text-left"
            >
              <span className="block border-b px-2 py-1 type-label">
                <span className="block truncate text-fg">{item.caption}</span>
                <span className="block truncate text-fg-muted">{meta}</span>
              </span>
              <MediaFigure media={item} sizes={SIZES[density]} bare={density === "inf"} className="border-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
```

`components/work/index-view.tsx`:

```tsx
import type { MediaView } from "@/lib/work/derive";

// Every figure as a mono list row: number, caption, group, tags, credits.
export function IndexView({ media, onOpen }: { media: MediaView[]; onOpen?: (id: string) => void }) {
  return (
    <ol data-view="index" className="px-4 py-6 type-meta md:px-10">
      {media.map((item) => (
        <li key={item.id} className="border-b border-dashed last:border-b-0">
          <button
            type="button"
            data-media={item.id}
            onClick={() => onOpen?.(item.id)}
            className="grid w-full grid-cols-[8ch_minmax(0,1fr)] gap-3 py-1.5 text-left hover:text-accent md:grid-cols-[8ch_minmax(0,1fr)_14ch_18ch_18ch]"
          >
            <span className="text-fg-muted">{item.label.replace("FIG. ", "")}</span>
            <span className="truncate">{item.caption}</span>
            <span className="hidden truncate text-fg-muted md:block">{item.group}</span>
            <span className="hidden truncate text-fg-muted md:block">{item.tags.join(", ")}</span>
            <span className="hidden truncate text-fg-muted md:block">{item.credits.map((c) => c.name).join(", ")}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Update `components/work/study-body.tsx` to take `state`**

Replace the file with:

```tsx
"use client";

import { type StudyView, filterMedia } from "@/lib/work/derive";
import type { ViewState } from "@/lib/work/url-state";
import { GridView } from "./grid-view";
import { IndexView } from "./index-view";
import { LogView } from "./log-view";
import { MediaButton } from "./media-button";
import { ViewBar } from "./view-bar";

const HERO_SIZES = "(min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)";

// Everything under a case study's header: the hero, the view bar and the
// current view. The server renders it with the default state and no
// handlers as the <Suspense> fallback; StudyBrowser drives it after
// hydration.
export function StudyBody({
  study,
  state,
  onChange,
  onOpen,
}: {
  study: StudyView;
  state: ViewState;
  onChange?: (patch: Partial<ViewState>) => void;
  onOpen?: (id: string) => void;
}) {
  const shown = filterMedia(study.media, state.tag);
  return (
    <div>
      <div className="px-4 pb-8 md:px-10">
        <MediaButton media={study.hero} onOpen={onOpen} sizes={HERO_SIZES} ratio="aspect-[16/10] md:aspect-[21/9]" priority />
      </div>
      <ViewBar chips={study.chips} state={state} onChange={onChange} />
      {state.view === "grid" ? (
        <GridView media={shown} density={state.density} onOpen={onOpen} />
      ) : state.view === "index" ? (
        <IndexView media={shown} onOpen={onOpen} />
      ) : (
        <LogView study={study} onOpen={onOpen} onShowEntry={(entryId) => onChange?.({ view: "grid", tag: entryId })} />
      )}
    </div>
  );
}
```

Run: `npx vitest run tests/ui/work.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write `components/work/use-view-state.ts` and `components/work/study-browser.tsx`**

`components/work/use-view-state.ts`:

```ts
"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { type ValidValues, type ViewState, parseViewState, viewStateQuery } from "@/lib/work/url-state";

export type UpdateViewState = (patch: Partial<ViewState>, mode?: "push" | "replace") => void;

// The view state lives in the query (lib/work/url-state.ts). The server
// always renders the defaults; this reads the real query after hydration.
// Next syncs useSearchParams with history.pushState/replaceState, so Back and
// Forward update it too. Must render inside <Suspense> (prerendered route).
export function useViewState(valid: ValidValues): readonly [ViewState, UpdateViewState] {
  const params = useSearchParams();
  const state = useMemo(() => parseViewState(params, valid), [params, valid]);
  const update = useCallback<UpdateViewState>(
    (patch, mode = "replace") => {
      const url = `${window.location.pathname}${viewStateQuery({ ...state, ...patch })}`;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [state],
  );
  return [state, update] as const;
}
```

`components/work/study-browser.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import type { StudyView } from "@/lib/work/derive";
import { validValues } from "@/lib/work/url-state";
import { StudyBody } from "./study-body";
import { useViewState } from "./use-view-state";

// The interactive case study body: URL-driven view, filter and density.
// Changing the view closes any open figure.
export function StudyBrowser({ study }: { study: StudyView }) {
  const valid = useMemo(() => validValues(study.media, study.chips), [study]);
  const [state, update] = useViewState(valid);
  return <StudyBody study={study} state={state} onChange={(patch) => update({ ...patch, fig: null })} />;
}
```

- [ ] **Step 6: Render `StudyBrowser` inside `<Suspense>` in the route**

In `app/(work)/work/[slug]/page.tsx`:
- add `import { Suspense } from "react";`, `import { StudyBrowser } from "@/components/work/study-browser";` and `import { DEFAULT_VIEW_STATE } from "@/lib/work/url-state";`;
- replace `<StudyBody study={view} />` with:

```tsx
      {/* The fallback is the prerendered default (Log) view. StudyBrowser
          reads ?view/tag/density after hydration, so every query shares one
          cached HTML (spec §3.2). */}
      <Suspense fallback={<StudyBody study={view} state={DEFAULT_VIEW_STATE} />}>
        <StudyBrowser study={view} />
      </Suspense>
```

- [ ] **Step 7: Write the e2e tests**

Create `e2e/work-views.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("switching views updates the URL and the page", async ({ page }) => {
  await page.goto("/work/primeone/");
  const views = page.getByRole("group", { name: "View" });
  await views.getByRole("button", { name: "Grid" }).click();
  await expect(page).toHaveURL(/\/work\/primeone\/\?view=grid$/);
  const grid = page.locator('[data-view="grid"]');
  await expect(grid).toBeVisible();
  // Hero + five entry figures.
  await expect(grid.locator("[data-media]")).toHaveCount(6);
  await expect(page.getByRole("group", { name: "Filter" }).getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");

  await views.getByRole("button", { name: "Index" }).click();
  await expect(page).toHaveURL(/\?view=index$/);
  await expect(page.locator('[data-view="index"] li')).toHaveCount(6);

  await views.getByRole("button", { name: "Log" }).click();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(page.locator('[data-view="log"]')).toBeVisible();
});

test("chips filter by entry or tag with computed counts", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid");
  const filter = page.getByRole("group", { name: "Filter" });
  await filter.getByRole("button", { name: /^Tokens/ }).click();
  await expect(page).toHaveURL(/\?view=grid&tag=tokens$/);
  await expect(page.locator('[data-view="grid"] [data-media]')).toHaveCount(3);
  await filter.getByRole("button", { name: /^3\.0/ }).click();
  await expect(page.locator('[data-view="grid"] [data-media]')).toHaveCount(2);
});

test("density changes the grid and is kept in the URL", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid");
  await page.getByRole("group", { name: "Density" }).getByRole("button", { name: "∞" }).click();
  await expect(page).toHaveURL(/\?view=grid&density=inf$/);
  await expect(page.locator('[data-view="grid"]')).toHaveAttribute("data-density", "inf");
});

test("a deep link opens the filtered view after hydration", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid&tag=3-0&density=2");
  await expect(page.locator('[data-view="grid"]')).toHaveAttribute("data-density", "2");
  await expect(page.locator('[data-view="grid"] [data-media]')).toHaveCount(2);
  await expect(page.getByRole("group", { name: "Filter" }).getByRole("button", { name: /^3\.0/ })).toHaveAttribute("aria-pressed", "true");
});

test("unknown query values fall back to the Log", async ({ page }) => {
  await page.goto("/work/primeone/?view=wall&tag=nope");
  await expect(page.locator('[data-view="log"]')).toBeVisible();
});

test("'+N in Grid' opens the Grid filtered to that entry", async ({ page }) => {
  await page.goto("/work/primeone/");
  await page.locator("#entry-3-0").getByRole("button", { name: "+1 in Grid →" }).click();
  await expect(page).toHaveURL(/\?view=grid&tag=3-0$/);
  await expect(page.locator('[data-view="grid"] [data-media]')).toHaveCount(2);
});

test("the server HTML is the Log whatever the query", async ({ request }) => {
  const html = await (await request.get("/work/primeone/?view=grid")).text();
  expect(html).toContain('data-view="log"');
  expect(html).not.toContain('data-view="grid"');
});
```

Run: `npm run build && npx playwright test e2e/work-views.spec.ts e2e/work-case-study.spec.ts`
Expected: PASS.

- [ ] **Step 8: Run every check and commit**

Run the Global Constraints checks. All pass.

```bash
git add components/work app/\(work\)/work tests/ui/work.test.tsx e2e/work-views.spec.ts
git commit -m "Add the Log, Grid and Index views with URL state

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The media viewer and Figma embeds

**Files:**
- Create: `components/work/media-viewer.tsx`
- Modify: `components/work/use-view-state.ts` (add `useViewerHistory`), `components/work/study-browser.tsx`, `app/globals.css`
- Test: `tests/ui/media-viewer.test.tsx`, `e2e/work-viewer.spec.ts`

**Interfaces:**
- Consumes:
  - from Task 2: `MediaView`, `viewerItems`, `pad2`, `figmaDesignUrl`, `figmaEmbedUrl`;
  - from Task 4: `MediaFigure`, `CreditLine`;
  - from Task 5: `useViewState`, `UpdateViewState`, `StudyBody`.
- Produces:
  - `MediaViewer({ title, items, current, onSelect, onClose })`, a native `<dialog class="media-viewer">` labelled `"<title>, <FIG label>"`.
  - `useViewerHistory(fig, update)` → `{ open(id), close(), select(id) }`.

Review fixes from Tasks 4–5 (the controller fills these in): _none yet_.

- [ ] **Step 1: Write the failing component test**

Create `tests/ui/media-viewer.test.tsx`:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MediaViewer } from "@/components/work/media-viewer";
import type { MediaView } from "@/lib/work/derive";

const base: MediaView = {
  id: "a",
  label: "FIG. 02.1",
  caption: "Tokens",
  aspect: "16/10",
  tags: [],
  credits: [],
  image: null,
  figma: null,
  entryId: "3-0",
  group: "3.0",
  context: "3.0 · Nov 2024",
};
const items: MediaView[] = [
  base,
  { ...base, id: "b", label: "FIG. 02.2", caption: "Button", credits: [{ name: "Ada" }], figma: { fileKey: "K", nodeId: "1:2", embed: true } },
];
const noop = () => {};
const html = (current: string | null) =>
  renderToStaticMarkup(<MediaViewer title="PrimeOne" items={items} current={current} onSelect={noop} onClose={noop} />);

describe("MediaViewer", () => {
  it("renders an empty dialog while closed", () => {
    const markup = html(null);
    expect(markup).toContain("<dialog");
    expect(markup).not.toContain("FIG. 02.1");
  });

  it("shows the context, caption, position and the thumbnail strip", () => {
    const markup = html("a");
    expect(markup).toContain('aria-label="PrimeOne, FIG. 02.1"');
    expect(markup).toContain("3.0 · Nov 2024");
    expect(markup).toContain("FIG. 02.1</span> · Tokens");
    expect(markup).toContain("01 / 02");
    expect(markup).toContain('aria-label="Show FIG. 02.2"');
    expect(markup).not.toContain("Open in Figma");
  });

  it("links to Figma and offers the embed only from md (it's hidden on phones)", () => {
    const markup = html("b");
    expect(markup).toContain('href="https://www.figma.com/design/K?node-id=1-2"');
    expect(markup).toContain("Open in Figma");
    expect(markup).toMatch(/class="hidden[^"]*md:inline[^"]*"[^>]*>Load Figma file/);
    expect(markup).toContain("Design: ");
    expect(markup).not.toContain("<iframe");
  });
});
```

Run: `npx vitest run tests/ui/media-viewer.test.tsx`
Expected: FAIL (component missing).

- [ ] **Step 2: Write `components/work/media-viewer.tsx`**

```tsx
"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { PlaceholderWash } from "@/components/ui/dither";
import { cx } from "@/lib/cx";
import { type MediaView, pad2 } from "@/lib/work/derive";
import { figmaDesignUrl, figmaEmbedUrl } from "@/lib/work/figma";
import { CreditLine } from "./credit-line";
import { MediaFigure } from "./media-figure";

// Horizontal travel (px) that counts as a swipe on touch screens.
const SWIPE = 50;

// The shared full-screen viewer (spec §3.6): a native modal <dialog> in the
// Life palette. `current` (the ?fig= id) drives it: a known id opens it, null
// closes it. The owner keeps the URL in step (useViewerHistory). Keys: ← →
// step through `items` (wrapping), G toggles single/grid, Esc closes. On
// close, focus returns to whatever opened it.
export function MediaViewer({
  title,
  items,
  current,
  onSelect,
  onClose,
}: {
  title: string;
  items: MediaView[];
  current: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [mode, setMode] = useState<"single" | "grid">("single");
  const index = current ? items.findIndex((item) => item.id === current) : -1;
  const item = index >= 0 ? items[index] : null;
  const open = item !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // After a client navigation Next keeps this tree mounted but hidden; an
  // open modal would leave the new page inert.
  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);

  function step(delta: number) {
    if (index < 0) return;
    onSelect(items[(index + delta + items.length) % items.length].id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "g" || event.key === "G") {
      event.preventDefault();
      setMode((m) => (m === "single" ? "grid" : "single"));
    }
  }

  return (
    <dialog
      ref={ref}
      aria-label={item ? `${title}, ${item.label}` : title}
      data-side="life"
      onCancel={(event) => {
        // Esc: let the owner update the URL; the effect then closes the dialog.
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        setMode("single");
        returnTo.current?.focus();
        returnTo.current = null;
      }}
      onKeyDown={onKeyDown}
      className="media-viewer m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-fg"
    >
      {item ? (
        <div className="flex h-full flex-col px-4 pt-3 pb-4 md:px-6">
          <div className="flex items-center justify-between gap-4 type-meta text-fg-muted">
            <p className="truncate">
              <span className="text-fg">{title}</span> · {item.context}
            </p>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                aria-pressed={mode === "grid"}
                onClick={() => setMode(mode === "single" ? "grid" : "single")}
                className="hover:text-fg"
              >
                {mode === "single" ? "Grid" : "Single"}
              </button>
              <button type="button" onClick={onClose} aria-label="Close viewer" className="hover:text-fg">
                Esc ×
              </button>
            </div>
          </div>
          {mode === "single" ? (
            <>
              <ViewerStage
                key={item.id}
                item={item}
                position={`${pad2(index + 1)} / ${pad2(items.length)}`}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
              />
              <ol aria-label="All figures" className="flex shrink-0 gap-1.5 overflow-x-auto pt-3">
                {items.map((other) => (
                  <li key={other.id} className="w-16 shrink-0">
                    <button
                      type="button"
                      aria-label={`Show ${other.label}`}
                      aria-current={other.id === item.id ? "true" : undefined}
                      onClick={() => onSelect(other.id)}
                      className={cx("block w-full border", other.id === item.id ? "border-accent" : "border-transparent")}
                    >
                      <MediaFigure media={other} sizes="64px" ratio="aspect-[4/3]" bare className="border-0" />
                    </button>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <ul aria-label="All figures" className="mt-4 grid min-h-0 flex-1 auto-rows-min grid-cols-3 gap-2 overflow-y-auto md:grid-cols-6">
              {items.map((other) => (
                <li key={other.id}>
                  <button
                    type="button"
                    aria-label={`Show ${other.label}`}
                    onClick={() => {
                      onSelect(other.id);
                      setMode("single");
                    }}
                    className={cx("block w-full border", other.id === item.id ? "border-accent" : "border-line")}
                  >
                    <MediaFigure media={other} sizes="(min-width: 768px) 16vw, 33vw" ratio="aspect-[4/3]" bare className="border-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </dialog>
  );
}

// One figure with previous/next, the caption line and, for Figma-backed
// items, the link and (from md) the click-to-load embed. Keyed by item, so
// the embed state resets when the figure changes (and unmounts the iframe).
function ViewerStage({
  item,
  position,
  onPrev,
  onNext,
}: {
  item: MediaView;
  position: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [embed, setEmbed] = useState<"off" | "poster" | "live">("off");
  const startX = useRef<number | null>(null);
  const figma = item.figma;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const dx = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) >= SWIPE) (dx < 0 ? onNext : onPrev)();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        data-stage
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="grid min-h-0 flex-1 touch-pan-y grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-4 md:gap-4"
      >
        <button type="button" aria-label="Previous figure" onClick={onPrev} className="px-2 py-4 type-body text-fg-muted hover:text-fg">
          ←
        </button>
        <div className="flex h-full min-h-0 items-center justify-center">
          {figma && embed === "live" ? (
            <iframe title={`${item.caption} in Figma`} src={figmaEmbedUrl(figma)} allowFullScreen className="h-full w-full border" />
          ) : figma && embed === "poster" ? (
            <button
              type="button"
              onClick={() => setEmbed("live")}
              className="relative grid aspect-[16/10] w-full max-w-5xl place-items-center overflow-hidden border"
            >
              <PlaceholderWash tone="accent" />
              <span className="relative bg-fg px-3 py-2 text-left type-meta text-bg">
                Load Figma file
                <span className="block type-label opacity-70">embed.figma.com · interactive</span>
              </span>
            </button>
          ) : (
            <MediaFigure media={item} sizes="100vw" fit />
          )}
        </div>
        <button type="button" aria-label="Next figure" onClick={onNext} className="px-2 py-4 type-body text-fg-muted hover:text-fg">
          →
        </button>
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 type-meta">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
          <p>
            <span className="text-fg">{item.label}</span> · {item.caption}
          </p>
          <CreditLine credits={item.credits} />
          {figma ? (
            <a href={figmaDesignUrl(figma)} rel="noopener noreferrer" className="text-accent hover:underline">
              Open in Figma{" ↗"}
            </a>
          ) : null}
          {figma?.embed ? (
            <button
              type="button"
              aria-pressed={embed !== "off"}
              onClick={() => setEmbed(embed === "off" ? "poster" : "off")}
              className="hidden text-accent hover:underline md:inline"
            >
              {embed === "off" ? "Load Figma file" : "Back to image"}
            </button>
          ) : null}
        </div>
        <p className="shrink-0 text-fg-muted">{position}</p>
      </div>
    </div>
  );
}
```

Run: `npx vitest run tests/ui/media-viewer.test.tsx`
Expected: PASS.

- [ ] **Step 3: Add `useViewerHistory` to `components/work/use-view-state.ts`**

Add `useEffect` and `useRef` to the React import, then append:

```ts
// Opening a figure pushes a history entry (?fig=id), so Back closes it.
// Stepping replaces it. Closing goes back when this page pushed the entry,
// or drops the param when the page was loaded with it.
export function useViewerHistory(fig: string | null, update: UpdateViewState) {
  const pushed = useRef(false);
  useEffect(() => {
    if (!fig) pushed.current = false;
  }, [fig]);
  const open = useCallback(
    (id: string) => {
      pushed.current = true;
      update({ fig: id }, "push");
    },
    [update],
  );
  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      update({ fig: null });
    }
  }, [update]);
  const select = useCallback((id: string) => update({ fig: id }), [update]);
  return { open, close, select };
}
```

- [ ] **Step 4: Wire the viewer into `components/work/study-browser.tsx`**

Replace the file with:

```tsx
"use client";

import { useMemo } from "react";
import { type StudyView, viewerItems } from "@/lib/work/derive";
import { validValues } from "@/lib/work/url-state";
import { MediaViewer } from "./media-viewer";
import { StudyBody } from "./study-body";
import { useViewerHistory, useViewState } from "./use-view-state";

// The interactive case study body: URL-driven view, filter, density and the
// open figure. Changing the view closes any open figure.
export function StudyBrowser({ study }: { study: StudyView }) {
  const valid = useMemo(() => validValues(study.media, study.chips), [study]);
  const [state, update] = useViewState(valid);
  const viewer = useViewerHistory(state.fig, update);
  const items = viewerItems(study.media, state.view, state.tag, state.fig);
  return (
    <>
      <StudyBody study={study} state={state} onChange={(patch) => update({ ...patch, fig: null })} onOpen={viewer.open} />
      <MediaViewer title={study.title} items={items} current={state.fig} onSelect={viewer.select} onClose={viewer.close} />
    </>
  );
}
```

- [ ] **Step 5: Add the viewer fade to `app/globals.css`**

Append at the end of the file:

```css
/* Work media viewer (components/work/media-viewer.tsx): a 150ms fade in and
   out. display/overlay transition discretely so the closing fade runs before
   the dialog leaves the top layer. */
.media-viewer {
  opacity: 0;
  transition:
    opacity 150ms ease-out,
    overlay 150ms ease-out allow-discrete,
    display 150ms ease-out allow-discrete;
}
.media-viewer[open] {
  opacity: 1;
}
@starting-style {
  .media-viewer[open] {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .media-viewer {
    transition: none;
  }
}
```

- [ ] **Step 6: Write the e2e tests**

Create `e2e/work-viewer.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const viewer = (page: import("@playwright/test").Page) => page.getByRole("dialog");

test("the hero opens the viewer on the full set, with its URL", async ({ page }) => {
  await page.goto("/work/primeone/");
  await page.locator('[data-media="cover"]').click();
  await expect(viewer(page)).toBeVisible();
  await expect(page).toHaveURL(/\?fig=cover$/);
  await expect(viewer(page)).toContainText("01 / 06");
  await expect(viewer(page)).toHaveAttribute("aria-label", "PrimeOne, FIG. 01");
});

test("arrows step and wrap, replacing the URL; Esc closes and returns focus", async ({ page }) => {
  await page.goto("/work/primeone/");
  const hero = page.locator('[data-media="cover"]');
  await hero.click();
  await page.keyboard.press("ArrowRight");
  await expect(viewer(page)).toContainText("02 / 06");
  await expect(page).toHaveURL(/\?fig=variables-4-0$/);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(viewer(page)).toContainText("06 / 06");
  await page.keyboard.press("Escape");
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(hero).toBeFocused();
});

test("Back closes the viewer and stays on the page", async ({ page }) => {
  await page.goto("/work/primeone/");
  await page.locator('[data-media="cover"]').click();
  await expect(viewer(page)).toBeVisible();
  await page.goBack();
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PrimeOne.");
});

test("a ?fig= deep link opens the viewer on load; closing drops the param", async ({ page }) => {
  await page.goto("/work/primeone/?fig=tokens-3-0");
  await expect(viewer(page)).toBeVisible();
  await expect(viewer(page)).toContainText("FIG. 04.2 · Tokens");
  await viewer(page).getByRole("button", { name: "Close viewer" }).click();
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
});

test("from the Grid the viewer steps through the filtered set", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid&tag=tokens");
  await page.locator('[data-view="grid"] [data-media="tokens-3-0"]').click();
  await expect(viewer(page)).toContainText("02 / 03");
  await expect(page).toHaveURL(/\?view=grid&tag=tokens&fig=tokens-3-0$/);
});

test("G toggles the grid inside the viewer", async ({ page }) => {
  await page.goto("/work/primeone/?fig=cover");
  await page.keyboard.press("g");
  await expect(viewer(page).getByRole("list", { name: "All figures" }).getByRole("button")).toHaveCount(6);
  await viewer(page).getByRole("button", { name: "Show FIG. 03.1" }).click();
  await expect(viewer(page)).toContainText("FIG. 03.1 · Tokens");
});

test("the viewer's top line names the figure's entry and month", async ({ page }) => {
  await page.goto("/work/templates/?fig=genesis-cover");
  await expect(viewer(page)).toContainText("Genesis · Dec 2024");
});

test.describe("at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("a swipe steps to the next figure", async ({ page }) => {
    await page.goto("/work/primeone/?fig=cover");
    const stage = viewer(page).locator("[data-stage]");
    const box = (await stage.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.75, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 5 });
    await page.mouse.up();
    await expect(viewer(page)).toContainText("02 / 06");
  });
});
```

The Genesis media item has no credits of its own: entry-level credits show on the entry (spec §3.7) and are covered in `e2e/work-case-study.spec.ts`. Media-level credits in the viewer are covered by `tests/ui/media-viewer.test.tsx`.

Run: `npm run build && npx playwright test e2e/work-viewer.spec.ts e2e/work-views.spec.ts e2e/work-case-study.spec.ts`
Expected: PASS.

- [ ] **Step 7: Visual check (implementer)**

Run `npm run start -- --port 3217` and open `/work/primeone/?fig=tokens-3-0` at 1440px and 375px, in light and dark. Record in the task report:
- the dialog is dark in both themes (Life palette);
- the placeholder stage is centred, and the strip doesn't push the caption off-screen;
- focus outlines are visible.

- [ ] **Step 8: Run every check and commit**

Run the Global Constraints checks. All pass.

```bash
git add components/work app/globals.css tests/ui/media-viewer.test.tsx e2e/work-viewer.spec.ts
git commit -m "Add the shared media viewer with Figma links and embeds

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 7: PrimeIcons, the live icon grid

**Files:**
- Modify: `package.json`, `package-lock.json` (add `primeicons` 7.0.0, exact)
- Create: `lib/work/icons.ts`, `lib/work/primeicons.ts`, `components/work/icon-grid.tsx`
- Modify: `components/work/study-body.tsx`, `components/work/study-browser.tsx`, `app/(work)/work/[slug]/page.tsx`, `CLAUDE.md`
- Test: `tests/work/icons.test.ts`, `e2e/work-primeicons.spec.ts`

**Interfaces:**
- Consumes: `StudyBody`, `StudyBrowser` and `ViewBar` (`showChips`, `showDensity`) from Tasks 5–6.
- Produces:
  - `IconView { name, svg }`, `IconSet { version, icons }`, `recolorIcon(svg)` and `filterIcons(icons, query)` in `lib/work/icons.ts`;
  - `loadIcons(dir?)` and `getPrimeIcons()` in `lib/work/primeicons.ts`;
  - `IconGrid({ set })` and `IconIndex({ set })`;
  - an optional `icons?: IconSet` prop on `StudyBody` and `StudyBrowser`.

Review fixes from Tasks 4–6 (the controller fills these in): _none yet_.

- [ ] **Step 1: Add the package, pinned**

```bash
npm install --save-exact primeicons@7.0.0
```

Check that `package.json` has `"primeicons": "7.0.0"` under `dependencies`, and that `node_modules/primeicons/raw-svg/` exists.

- [ ] **Step 2: Write the failing tests**

Create `tests/work/icons.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filterIcons, recolorIcon } from "@/lib/work/icons";
import { loadIcons } from "@/lib/work/primeicons";

describe("recolorIcon", () => {
  it("paints a bare icon with currentColor and hides it from assistive tech", () => {
    const out = recolorIcon('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="check"><path d="M1"/></g></svg>');
    expect(out).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><g><path d="M1"/></g></svg>');
  });

  it("drops the root size, keeps fill=none, and maps black and white to tokens", () => {
    const out = recolorIcon(
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill="black" d="M1"/><rect width="2" height="2" fill="white"/><path stroke="#000" d="M2"/></svg>',
    );
    expect(out).toBe(
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1"/><rect width="2" height="2" style="fill:var(--color-bg)"/><path stroke="currentColor" d="M2"/></svg>',
    );
  });
});

describe("filterIcons", () => {
  const icons = ["arrow-up", "arrow-down", "chart-bar", "user"].map((name) => ({ name, svg: "" }));

  it("matches every term, case-insensitively; an empty query keeps all", () => {
    expect(filterIcons(icons, "").map((i) => i.name)).toHaveLength(4);
    expect(filterIcons(icons, "ARROW").map((i) => i.name)).toEqual(["arrow-up", "arrow-down"]);
    expect(filterIcons(icons, "arrow down").map((i) => i.name)).toEqual(["arrow-down"]);
    expect(filterIcons(icons, "nope")).toEqual([]);
  });
});

describe("loadIcons", () => {
  it("reads the pinned MIT release: 7.0.0 and its 313 SVGs", () => {
    const set = loadIcons();
    expect(set.version).toBe("7.0.0");
    expect(set.icons).toHaveLength(313);
    expect(set.icons.find((i) => i.name === "chart-bar")?.svg).toMatch(/^<svg[^>]*aria-hidden="true"/);
    for (const icon of set.icons) {
      expect(icon.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(icon.svg).not.toContain(' id="');
    }
  });
});
```

Run: `npx vitest run tests/work/icons.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Write `lib/work/icons.ts` and `lib/work/primeicons.ts`**

`lib/work/icons.ts`:

```ts
export interface IconView {
  // "chart-bar", used as `pi pi-chart-bar`.
  name: string;
  // Inline, recoloured SVG markup (recolorIcon).
  svg: string;
}

export interface IconSet {
  version: string;
  icons: IconView[];
}

// PrimeIcons' raw SVGs are drawn in black (mostly by omission) at a fixed
// size. Inline on the page they must follow the text colour and theme, and
// carry no ids (313 inline icons would collide with page ids).
export function recolorIcon(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*>\s*/, "")
    .replace(/<svg\b([^>]*)>/, (_, attrs: string) => {
      let root = attrs.replace(/\s(?:width|height)="[^"]*"/g, "");
      if (!/\sfill="/.test(root)) root += ' fill="currentColor"';
      return `<svg${root} aria-hidden="true" focusable="false">`;
    })
    .replace(/\sid="[^"]*"/g, "")
    .replace(/(fill|stroke)="(?:black|#000|#000000)"/gi, '$1="currentColor"')
    .replace(/(fill|stroke)="(?:white|#fff|#ffffff)"/gi, 'style="$1:var(--color-bg)"');
}

// Every whitespace-separated term must appear in the name.
export function filterIcons(icons: IconView[], query: string): IconView[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return icons;
  return icons.filter((icon) => terms.every((term) => icon.name.includes(term)));
}
```

`lib/work/primeicons.ts`:

```ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { type IconSet, recolorIcon } from "./icons";

// primeicons is pinned to exactly 7.0.0, the last MIT release. 8.x is under
// PrimeTek's commercial PrimeUI license (key required, no redistribution):
// never upgrade it. Read at build time; the page is static.
const PACKAGE_DIR = join(process.cwd(), "node_modules", "primeicons");

export function loadIcons(dir: string = PACKAGE_DIR): IconSet {
  const { version } = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { version: string };
  const svgDir = join(dir, "raw-svg");
  const icons = readdirSync(svgDir)
    .filter((file) => file.endsWith(".svg"))
    .sort()
    .map((file) => ({ name: file.replace(/\.svg$/, ""), svg: recolorIcon(readFileSync(join(svgDir, file), "utf8")) }));
  return { version, icons };
}

export async function getPrimeIcons(): Promise<IconSet> {
  "use cache";
  cacheLife("max");
  return loadIcons();
}
```

Run: `npx vitest run tests/work/icons.test.ts`
Expected: PASS.

- [ ] **Step 4: Write `components/work/icon-grid.tsx`**

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type IconSet, filterIcons } from "@/lib/work/icons";

// PrimeIcons' Grid view (spec §4.1): the real set from the pinned package,
// searchable; a click copies the class name.
export function IconGrid({ set }: { set: IconSet }) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const shown = useMemo(() => filterIcons(set.icons, query), [set.icons, query]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy(name: string) {
    try {
      await navigator.clipboard.writeText(`pi pi-${name}`);
    } catch {
      return;
    }
    setCopied(name);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div data-view="grid" className="px-4 py-6 md:px-10">
      <label className="flex flex-wrap items-center gap-3 type-meta">
        <span className="text-fg-muted">Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="arrow, chart, user"
          className="h-8 w-64 max-w-full rounded-control border bg-bg px-2 type-body"
        />
      </label>
      <p className="mt-2 type-meta text-fg-muted">
        {shown.length} of {set.icons.length} icons
      </p>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] border-t border-l">
        {shown.map((icon) => (
          <li key={icon.name} className="border-r border-b">
            <button
              type="button"
              onClick={() => copy(icon.name)}
              aria-label={`Copy pi pi-${icon.name}`}
              className="flex h-24 w-full flex-col items-center justify-center gap-2 px-1 hover:bg-fg hover:text-bg"
            >
              <span className="size-6 [&>svg]:size-6" dangerouslySetInnerHTML={{ __html: icon.svg }} />
              <span className="max-w-full truncate type-label">{copied === icon.name ? "copied" : icon.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="sr-only">
        {copied ? `Copied pi pi-${copied}` : ""}
      </p>
      <p className="mt-4 type-label text-fg-muted">PrimeIcons {set.version} © PrimeTek, MIT License</p>
    </div>
  );
}

// PrimeIcons' Index view: the names in columns.
export function IconIndex({ set }: { set: IconSet }) {
  return (
    <ol data-view="index" className="columns-2 gap-6 px-4 py-6 type-meta md:columns-4 md:px-10 lg:columns-6">
      {set.icons.map((icon) => (
        <li key={icon.name} className="truncate">
          pi-{icon.name}
        </li>
      ))}
    </ol>
  );
}
```

The SVG markup comes from the pinned npm package and is recoloured by regex; it is trusted, build-time input, never user input.

- [ ] **Step 5: Pass icons through `StudyBody`, `StudyBrowser` and the route**

In `components/work/study-body.tsx`:
- import `import type { IconSet } from "@/lib/work/icons";` and `import { IconGrid, IconIndex } from "./icon-grid";`;
- add the prop `icons?: IconSet` (also in the props type);
- change the ViewBar line to `<ViewBar chips={study.chips} state={state} onChange={onChange} showChips={!icons} showDensity={!icons} />`;
- replace the view switch with:

```tsx
      {state.view === "grid" ? (
        icons ? <IconGrid set={icons} /> : <GridView media={shown} density={state.density} onOpen={onOpen} />
      ) : state.view === "index" ? (
        icons ? <IconIndex set={icons} /> : <IndexView media={shown} onOpen={onOpen} />
      ) : (
        <LogView study={study} onOpen={onOpen} onShowEntry={(entryId) => onChange?.({ view: "grid", tag: entryId })} />
      )}
```

In `components/work/study-browser.tsx`:
- add `import type { IconSet } from "@/lib/work/icons";`;
- take `{ study, icons }: { study: StudyView; icons?: IconSet }`;
- pass `icons={icons}` to `StudyBody`.

In `app/(work)/work/[slug]/page.tsx`:
- import `getPrimeIcons` from `@/lib/work/primeicons`;
- in the page body, after `const view = getStudyView(study);`, add:

```tsx
  // PrimeIcons shows the real set (spec §4.1); its size and version are facts
  // counted from the package, not written by hand.
  const icons = study.slug === "primeicons" ? await getPrimeIcons() : undefined;
  const facts = icons
    ? [...caseStudyFacts(study, view), { label: "Set", value: `v${icons.version} · ${icons.icons.length} icons` }]
    : caseStudyFacts(study, view);
```

- pass `facts={facts}` to the header, and `icons={icons}` to `StudyBrowser` only. The fallback renders the Log, which doesn't use the icons. Passing them twice would serialise the 313 SVGs into the payload twice.

- [ ] **Step 6: Note the pin in `CLAUDE.md`**

Under `## Rules`, append:

```markdown
- `primeicons` is pinned to exactly `7.0.0`, the last MIT release (the PrimeIcons case study renders it live). 8.x is under PrimeTek's commercial PrimeUI license (license key, no redistribution): never upgrade it, and keep it out of automated dependency bumps.
```

- [ ] **Step 7: Write the e2e tests**

Create `e2e/work-primeicons.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("the header counts the set from the package", async ({ page }) => {
  await page.goto("/work/primeicons/");
  await expect(page.locator("dl")).toContainText("v7.0.0 · 313 icons");
});

test("the Grid is the live icon set, searchable, with no chips or density", async ({ page }) => {
  await page.goto("/work/primeicons/?view=grid");
  await expect(page.getByRole("group", { name: "Filter" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Density" })).toHaveCount(0);
  await expect(page.getByText("313 of 313 icons")).toBeVisible();
  await page.getByRole("searchbox").fill("chart-bar");
  await expect(page.getByText("1 of 313 icons")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Copy pi pi-/ })).toHaveCount(1);
  await expect(page.getByText("PrimeIcons 7.0.0 © PrimeTek, MIT License")).toBeVisible();
});

test("clicking an icon copies its class name", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/work/primeicons/?view=grid");
  const button = page.getByRole("button", { name: "Copy pi pi-chart-bar" });
  await button.click();
  await expect(button).toContainText("copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pi pi-chart-bar");
});

test("the Index lists the class names", async ({ page }) => {
  await page.goto("/work/primeicons/?view=index");
  await expect(page.locator('[data-view="index"] li')).toHaveCount(313);
  await expect(page.locator('[data-view="index"]')).toContainText("pi-chart-bar");
});
```

Run: `npm run build && npx playwright test e2e/work-primeicons.spec.ts`
Expected: PASS.

- [ ] **Step 8: Visual check, every check, commit**

Open `/work/primeicons/?view=grid` in light and dark: the icons follow the text colour, and the `twitter` icon's white cut-out reads as background. Run the Global Constraints checks.

```bash
git add package.json package-lock.json lib/work/icons.ts lib/work/primeicons.ts components/work app/\(work\)/work CLAUDE.md tests/work/icons.test.ts e2e/work-primeicons.spec.ts
git commit -m "Render the live PrimeIcons set on its case study

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: The Archive page

**Files:**
- Create: `components/work/archive-log.tsx`, `components/work/archive-browser.tsx`, `app/(work)/work/archive/page.tsx`
- Test: `tests/ui/work.test.tsx` (append), `e2e/work-archive.spec.ts`

**Interfaces:**
- Consumes:
  - `ArchiveView`, `getArchiveView()` (Task 2);
  - `MediaButton`, `CreditLine` (Task 4);
  - `useViewState`, `useViewerHistory`, `MediaViewer` (Tasks 5–6).
- Produces:
  - `ArchiveLog({ view, onOpen? })` → `div[data-view="archive"]`, rows `li#archive-<id>`;
  - `ArchiveBrowser({ view })`;
  - the route `/work/archive/`.

Review fixes from Tasks 4–7 (the controller fills these in): _none yet_.

- [ ] **Step 1: Append a failing component test**

Append to `tests/ui/work.test.tsx` (imports at the top):

```tsx
import { ArchiveLog } from "@/components/work/archive-log";
import { buildArchiveView } from "@/lib/work/derive";

describe("ArchiveLog", () => {
  const archive = buildArchiveView(
    [
      { id: "aura", org: "primetek", date: "2024-01", title: "Aura", note: "A theme.", source: "https://x.com/primevue/status/1", credits: [{ name: "Bo" }], media: { id: "aura", caption: "Aura" } },
      { id: "gallery", org: "primetek", date: "2023-09", title: "Gallery", note: "A gallery.", source: "https://x.com/w00f/status/2" },
    ],
    () => undefined,
  );
  const markup = html(<ArchiveLog view={archive} />);

  it("renders year groups, newest first, with month, title, note and post link", () => {
    expect(markup.indexOf(">2024<")).toBeLessThan(markup.indexOf(">2023<"));
    expect(markup).toContain("Jan 2024");
    expect(markup).toContain("Aura");
    expect(markup).toContain('href="https://x.com/primevue/status/1"');
    expect(markup).toContain("Design: ");
  });

  it("shows a figure only for rows that have one", () => {
    expect(markup.match(/data-media="/g)).toHaveLength(1);
  });
});
```

Run: `npx vitest run tests/ui/work.test.tsx`
Expected: FAIL (component missing).

- [ ] **Step 2: Write `components/work/archive-log.tsx` and `components/work/archive-browser.tsx`**

`components/work/archive-log.tsx`:

```tsx
import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { TextLink } from "@/components/ui/text-link";
import type { ArchiveView } from "@/lib/work/derive";
import { CreditLine } from "./credit-line";
import { MediaButton } from "./media-button";

// The Archive (spec §4.3): a hairline log grouped by year, newest first.
// Each row is month | title, note, credits, optional figure | post ↗.
export function ArchiveLog({ view, onOpen }: { view: ArchiveView; onOpen?: (id: string) => void }) {
  return (
    <div data-view="archive">
      {view.groups.map((group) => (
        <Fragment key={group.year}>
          <DitherRule className="mx-4 md:mx-10" />
          <section aria-labelledby={`year-${group.year}`} className="px-4 py-8 md:px-10 lg:py-[30px]">
            <h2 id={`year-${group.year}`} className="type-name">
              {group.year}
            </h2>
            <ol className="mt-4">
              {group.items.map((row) => (
                <li
                  key={row.id}
                  id={`archive-${row.id}`}
                  className="grid gap-2 border-b py-4 last:border-b-0 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7"
                >
                  <p className="type-meta text-fg-muted">{row.monthYear}</p>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="type-body font-medium">{row.title}</h3>
                    <p className="type-body text-fg-soft">{row.note}</p>
                    <CreditLine credits={row.credits} />
                    {row.media ? (
                      <div className="mt-1 max-w-xs">
                        <MediaButton media={row.media} onOpen={onOpen} sizes="320px" />
                      </div>
                    ) : null}
                  </div>
                  <p className="type-meta lg:text-right">
                    <TextLink href={row.source} className="text-accent">
                      post
                    </TextLink>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </Fragment>
      ))}
    </div>
  );
}
```

`components/work/archive-browser.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import type { ArchiveView } from "@/lib/work/derive";
import { ArchiveLog } from "./archive-log";
import { MediaViewer } from "./media-viewer";
import { useViewerHistory, useViewState } from "./use-view-state";

const TAGS: ReadonlySet<string> = new Set(["all"]);

// The Archive with its figures in the shared viewer (?fig=).
export function ArchiveBrowser({ view }: { view: ArchiveView }) {
  const valid = useMemo(() => ({ tags: TAGS, figs: new Set(view.media.map((item) => item.id)) }), [view]);
  const [state, update] = useViewState(valid);
  const viewer = useViewerHistory(state.fig, update);
  return (
    <>
      <ArchiveLog view={view} onOpen={viewer.open} />
      <MediaViewer title="Archive" items={view.media} current={state.fig} onSelect={viewer.select} onClose={viewer.close} />
    </>
  );
}
```

Run: `npx vitest run tests/ui/work.test.tsx`
Expected: PASS.

- [ ] **Step 3: Write `app/(work)/work/archive/page.tsx`**

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { SectionRow } from "@/components/ui/section-row";
import { ArchiveBrowser } from "@/components/work/archive-browser";
import { ArchiveLog } from "@/components/work/archive-log";
import { pageMetadata } from "@/lib/metadata";
import { getArchiveView } from "@/lib/work";

const DESCRIPTION = "Other PrimeTek work, from the posts that announced it.";

export const metadata: Metadata = pageMetadata("Archive", { description: DESCRIPTION, openGraph: { description: DESCRIPTION } });

// "Everything else" (spec §4.3). A static segment, so it wins over
// /work/[slug]/.
export default function ArchivePage() {
  const view = getArchiveView();
  return (
    <main className="pb-16">
      <SectionRow
        labelAs="div"
        label={
          <>
            <ItemLink href="/work/" className="text-fg-muted">
              ← Work
            </ItemLink>
            <span className="mt-4 block text-fg">Archive</span>
          </>
        }
      >
        <h1 className="type-lead">
          Archive. <span className="text-fg-muted">{DESCRIPTION}</span>
        </h1>
      </SectionRow>
      <Suspense fallback={<ArchiveLog view={view} />}>
        <ArchiveBrowser view={view} />
      </Suspense>
    </main>
  );
}
```

- [ ] **Step 4: Write the e2e tests**

Create `e2e/work-archive.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("the Archive lists dated rows, newest first, each linking its post", async ({ page }) => {
  await page.goto("/work/archive/");
  await expect(page).toHaveTitle("Archive · Onur Senture");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Archive.");
  await expect(page.locator('[data-view="archive"] h2')).toHaveText(["2024", "2023"]);
  const editor = page.locator("#archive-visual-theme-editor");
  await expect(editor).toContainText("Nov 2024");
  await expect(editor.getByRole("link", { name: "post" })).toHaveAttribute("href", "https://x.com/w00f/status/1857050715224494345");
  await expect(page.getByRole("link", { name: "← Work" })).toHaveAttribute("href", "/work/");
});
```

Run: `npm run build && npx playwright test e2e/work-archive.spec.ts`
Expected: PASS.

- [ ] **Step 5: Run every check and commit**

```bash
git add components/work app/\(work\)/work/archive tests/ui/work.test.tsx e2e/work-archive.spec.ts
git commit -m "Add the Archive page for other PrimeTek work

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: The `/work/` index, the nav, and the home links

**Files:**
- Create: `lib/work/index-groups.ts`, `components/work/work-table.tsx`, `app/(work)/work/page.tsx`
- Modify:
  - `content/orgs.ts`, `lib/work/index.ts`, `lib/nav.ts`;
  - `content/work-index.ts`, `content/experience.ts`;
  - `components/home/work-tiles.tsx`, `components/home/home-site.tsx`;
  - `components/shell/page-header.tsx` (stale comment);
  - `CLAUDE.md`.
- Test:
  - Create: `tests/work/index-groups.test.ts`, `e2e/work-index.spec.ts`.
  - Modify: `tests/nav.test.ts`, `tests/ui/home.test.tsx`, `tests/content/experience.test.ts`, `e2e/home.spec.ts`, `e2e/shell.spec.ts`, `e2e/system.spec.ts`.

**Interfaces:**
- Consumes: `caseStudies`, `archive` (Task 3); `experience`, `formatSpan` (`content/experience.ts`); `ORGS`; `getStudyView` and `getCaseStudy` (Task 2).
- Produces:
  - `WorkIndexRow`, `WorkIndexGroup`, `buildWorkIndex(studies, archive, experience)`;
  - `getWorkIndexGroups()` and `heroImageKey(slug)` in `lib/work/index.ts`;
  - `WorkTable({ rows })`;
  - the `Org.site` field;
  - the route `/work/`.

Review fixes from Tasks 4–8 (the controller fills these in): _none yet_.

- [ ] **Step 1: Write the failing tests for the index grouping**

Create `tests/work/index-groups.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { archive, caseStudies } from "@/content/work";
import { experience } from "@/content/experience";
import { buildWorkIndex } from "@/lib/work/index-groups";

describe("buildWorkIndex", () => {
  const groups = buildWorkIndex(caseStudies, archive, experience);

  it("groups case studies by org, only orgs with ready work", () => {
    expect(groups.map((g) => g.org)).toEqual(["primetek"]);
  });

  it("takes the role and span from the experience list, and the org's site", () => {
    expect(groups[0]).toMatchObject({ role: "Design lead", span: "May 2016–Apr 2026", site: "https://primefaces.org" });
  });

  it("lists the case studies in registry order, then the Archive with its year span", () => {
    expect(groups[0].rows.map((r) => [r.title, r.href])).toEqual([
      ["PrimeOne", "/work/primeone/"],
      ["PrimeBlocks", "/work/primeblocks/"],
      ["PrimeIcons", "/work/primeicons/"],
      ["Templates", "/work/templates/"],
      ["Archive", "/work/archive/"],
    ]);
    expect(groups[0].rows[4]).toMatchObject({ years: "2023–2024", kind: "everything else" });
  });
});
```

Run: `npx vitest run tests/work/index-groups.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 2: Add `site` to orgs and write `lib/work/index-groups.ts`**

In `content/orgs.ts`:
- add `site?: string;` to `interface Org`, with the comment `// The org's public site, shown on /work/.`;
- set `primetek: { name: "PrimeTek", monogram: "P", site: "https://primefaces.org" },`.

`lib/work/index-groups.ts`:

```ts
import { type ExperienceEntry, formatSpan } from "@/content/experience";
import { ORGS, type OrgId } from "@/content/orgs";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";

export interface WorkIndexRow {
  years: string;
  title: string;
  kind: string;
  href: string;
}

export interface WorkIndexGroup {
  org: OrgId;
  role: string;
  span: string;
  site?: string;
  rows: WorkIndexRow[];
}

function yearSpan(dates: string[]): string {
  const years = dates.map((date) => date.slice(0, 4)).sort();
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? first : `${first}–${last}`;
}

// /work/ (spec §5): one group per org that has ready case studies, in the
// order those first appear. Its Archive line, if any, comes last.
export function buildWorkIndex(studies: CaseStudy[], archive: ArchiveEntry[], experience: ExperienceEntry[]): WorkIndexGroup[] {
  const orgs = [...new Set(studies.map((study) => study.org))];
  return orgs.map((org) => {
    const role = experience.find((entry) => entry.org === org);
    const rows: WorkIndexRow[] = studies
      .filter((study) => study.org === org)
      .map((study) => ({ years: study.years, title: study.title, kind: study.kind, href: `/work/${study.slug}/` }));
    const archived = archive.filter((entry) => entry.org === org);
    if (archived.length > 0) {
      rows.push({ years: yearSpan(archived.map((entry) => entry.date)), title: "Archive", kind: "everything else", href: "/work/archive/" });
    }
    return {
      org,
      role: role?.role ?? "",
      span: role ? formatSpan(role.start, role.end) : "",
      site: ORGS[org].site,
      rows,
    };
  });
}
```

Append to `lib/work/index.ts` (and add `import { experience } from "@/content/experience";`, `import type { WorkSlug } from "@/content/work/types";` and `import { type WorkIndexGroup, buildWorkIndex } from "./index-groups";`):

```ts
export function getWorkIndexGroups(): WorkIndexGroup[] {
  return buildWorkIndex(caseStudies, archive, experience);
}

// The home Work tiles show a case study's hero once it has an image.
export function heroImageKey(slug: WorkSlug): string | undefined {
  const study = getCaseStudy(slug);
  return study ? (getStudyView(study).hero.image?.key ?? undefined) : undefined;
}
```

Run: `npx vitest run tests/work/index-groups.test.ts`
Expected: PASS.

- [ ] **Step 3: Write `components/work/work-table.tsx` and `app/(work)/work/page.tsx`**

`components/work/work-table.tsx`:

```tsx
import { ItemLink } from "@/components/sections/item-link";
import type { WorkIndexRow } from "@/lib/work/index-groups";

// A hairline table: years · title · kind · →. The kind drops under 480px.
export function WorkTable({ rows }: { rows: WorkIndexRow[] }) {
  return (
    <ul className="type-body">
      {rows.map((row) => (
        <li
          key={row.href}
          className="grid grid-cols-[10ch_minmax(0,1fr)_2ch] gap-3 border-b py-1.5 last:border-b-0 min-[480px]:grid-cols-[10ch_minmax(0,1fr)_16ch_2ch]"
        >
          <span className="text-fg-muted">{row.years}</span>
          <ItemLink href={row.href} className="text-accent">
            {row.title}
          </ItemLink>
          <span className="hidden text-fg-muted min-[480px]:block">{row.kind}</span>
          <span aria-hidden="true" className="text-fg-muted">
            →
          </span>
        </li>
      ))}
    </ul>
  );
}
```

`app/(work)/work/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Fragment } from "react";
import { DitherRule } from "@/components/ui/dither";
import { OrgMark } from "@/components/ui/org-mark";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { WorkTable } from "@/components/work/work-table";
import { ORGS } from "@/content/orgs";
import { pageMetadata } from "@/lib/metadata";
import { getWorkIndexGroups } from "@/lib/work";

// Draft lead (Sprint 5); Sprint 6 rewrites it when Orkestra joins.
const LEAD = "Ten years of design systems, icons, blocks and templates at PrimeTek.";

export const metadata: Metadata = pageMetadata("Work", { description: LEAD, openGraph: { description: LEAD } });

// The Work index (spec §5): one index table per org with ready work.
export default function WorkIndexPage() {
  const groups = getWorkIndexGroups();
  return (
    <main className="pb-16">
      <SectionRow label="Work" labelAs="div">
        <h1 className="type-lead">
          Work. <span className="text-fg-muted">{LEAD}</span>
        </h1>
      </SectionRow>
      {groups.map((group) => (
        <Fragment key={group.org}>
          <DitherRule className="mx-4 md:mx-10" />
          <SectionRow
            id={group.org}
            label={
              <>
                <OrgMark org={group.org} /> {ORGS[group.org].name}
                <span className="block text-fg-muted">{group.role}</span>
                <span className="block text-fg-muted">{group.span}</span>
              </>
            }
            action={group.site ? <TextLink href={group.site}>{new URL(group.site).hostname}</TextLink> : undefined}
          >
            <WorkTable rows={group.rows} />
          </SectionRow>
        </Fragment>
      ))}
    </main>
  );
}
```

- [ ] **Step 4: Turn on the nav item and link the home**

`lib/nav.ts`: set the Work item to `ready: true`.

`content/work-index.ts`: replace the file with:

```ts
import type { WorkSlug } from "./work/types";

// The home page's selected work, in display order; the first four are tiles.
// Each tile links to its case study and shows the case study's hero once it
// has an image (lib/work heroImageKey). Only confirmed facts: no headline
// numbers here.
export interface WorkEntry {
  title: string;
  meta?: string;
  slug?: WorkSlug;
  href?: string;
}

export const workIndex: WorkEntry[] = [
  { title: "PrimeOne", meta: "design system", slug: "primeone", href: "/work/primeone/" },
  { title: "PrimeBlocks", meta: "UI blocks", slug: "primeblocks", href: "/work/primeblocks/" },
  { title: "PrimeIcons", meta: "icon set", slug: "primeicons", href: "/work/primeicons/" },
  { title: "Templates", meta: "app templates", slug: "templates", href: "/work/templates/" },
  { title: "Nebuu", meta: "ongoing, Orkestra" },
];
```

`content/experience.ts`: in the PrimeTek `children`, give each its case study and drop the unconfirmed "25+":

```ts
    children: [
      { title: "PrimeOne", note: "design system", href: "/work/primeone/" },
      { title: "PrimeBlocks", note: "UI blocks", href: "/work/primeblocks/" },
      { title: "PrimeIcons", note: "icon set", href: "/work/primeicons/" },
      { title: "Templates", note: "app templates", href: "/work/templates/" },
    ],
```

Also update its header comment: `// Roles and dates as on Onur's LinkedIn (read 2026-10-03). Only confirmed facts. PrimeTek products link to their case studies (Sprint 5).`

`components/home/work-tiles.tsx`: replace with:

```tsx
import Link from "next/link";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import type { WorkEntry } from "@/content/work-index";

// The home Work row: one tile per entry (first four), 2-up, with a caption.
// A tile links to its case study and shows the case study's hero image once
// there is one; until then the numbered placeholder.
export function WorkTiles({ entries }: { entries: (WorkEntry & { image?: string })[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {entries.slice(0, 4).map((entry, index) => {
        const tile = (
          <>
            <MediaPlaceholder label={entry.title} index={index + 1} tone={index % 2 ? "ink" : "accent"} image={entry.image} />
            <p className="mt-1.5 type-meta">
              <span className="group-hover:underline group-hover:underline-offset-[0.2em]">{entry.title}</span>
              {entry.meta ? <span className="text-fg-muted"> · {entry.meta}</span> : null}
            </p>
          </>
        );
        return (
          <li key={entry.title}>
            {entry.href ? (
              <Link href={entry.href} className="group block">
                {tile}
              </Link>
            ) : (
              tile
            )}
          </li>
        );
      })}
    </ul>
  );
}
```

`components/home/home-site.tsx`:
- add `import { heroImageKey } from "@/lib/work";`;
- change `<WorkTiles entries={workIndex} />` to `<WorkTiles entries={workIndex.map((entry) => ({ ...entry, image: entry.slug ? heroImageKey(entry.slug) : undefined }))} />`.

`components/shell/page-header.tsx`: replace the stale comment with `// A page's title: the dot-matrix name style (type-name) with an optional mono meta line.`

- [ ] **Step 5: Update the existing tests**

- `tests/nav.test.ts`: in "renders only ready items", the description becomes `"renders only ready items (Work from Sprint 5)"` and the first expectation becomes `expect(readyItems().map((i) => i.label)).toEqual(["Work"]);`.
- `tests/ui/home.test.tsx`, in the `WorkTiles` describe, add:

```tsx
  it("links a tile to its case study", () => {
    const markup = html(<WorkTiles entries={[{ title: "PrimeOne", meta: "design system", href: "/work/primeone/" }]} />);
    expect(markup).toContain('href="/work/primeone/"');
  });
```

- `tests/content/experience.test.ts`, in "nests PrimeTek's products under it", add `expect(primetek.children.every((c) => c.href?.startsWith("/work/"))).toBe(true);`.
- `e2e/home.spec.ts`: replace the "Work shows four numbered placeholders with captions, unlinked" test with:

```ts
test("Work shows four numbered tiles, each linking to its case study", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#work");
  for (const label of ["FIG. 01 · PrimeOne", "FIG. 02 · PrimeBlocks", "FIG. 03 · PrimeIcons", "FIG. 04 · Templates"]) {
    await expect(work).toContainText(label);
  }
  await expect(work.getByRole("link")).toHaveCount(4);
  await expect(work.getByRole("link", { name: /PrimeOne/ })).toHaveAttribute("href", "/work/primeone/");
  await expect(page.locator("#work").getByRole("link", { name: "All work" })).toHaveAttribute("href", "/work/");
});
```

  In "Experience is a tree with confirmed dates", add `await expect(tree.getByRole("link", { name: "PrimeIcons" })).toHaveAttribute("href", "/work/primeicons/");`.
- `e2e/shell.spec.ts`: replace the comment and line `// No nav item is ready yet, so the list is empty.` and `await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveCount(0);` with:

```ts
  // Work is the first ready section (Sprint 5).
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveCount(1);
  await expect(nav.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/work/");
```

  In the 390px test, `page.getByRole("navigation", { name: "Main" })` must stay hidden before the menu opens. It does, because the bar nav sits in a `hidden md:flex` wrapper and the menu's copy only mounts when the menu opens.
- `e2e/system.spec.ts`: change `page.getByRole("heading", { name: "Sources" })` to `page.getByRole("heading", { name: "Sources", exact: true })`.

- [ ] **Step 6: Write the `/work/` e2e tests**

Create `e2e/work-index.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("/work/ lists PrimeTek's work and the Archive, and marks Work active", async ({ page }) => {
  await page.goto("/work/");
  await expect(page).toHaveTitle("Work · Onur Senture");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Work.");
  const group = page.locator("#primetek");
  await expect(group).toContainText("PrimeTek");
  await expect(group).toContainText("Design lead");
  await expect(group).toContainText("May 2016–Apr 2026");
  for (const [name, href] of [
    ["PrimeOne", "/work/primeone/"],
    ["PrimeBlocks", "/work/primeblocks/"],
    ["PrimeIcons", "/work/primeicons/"],
    ["Templates", "/work/templates/"],
    ["Archive", "/work/archive/"],
  ]) {
    await expect(group.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
  await expect(group.getByRole("link", { name: "primefaces.org" })).toHaveAttribute("href", "https://primefaces.org");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "page");
});

test("a case study keeps Work active in the nav", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "page");
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the table drops the kind column", async ({ page }) => {
    await page.goto("/work/");
    await expect(page.locator("#primetek").getByText("design system")).toBeHidden();
  });
});
```

Run: `npm run build && npm run e2e`
Expected: PASS (all specs, including the updated home, shell and system specs).

- [ ] **Step 7: Document the Work section in `CLAUDE.md`**

Add a section after `## Design system (Sprint 4)`:

```markdown
## Work (Sprint 5)

- Spec: `docs/superpowers/specs/2026-10-03-sprint-5-work-primetek-design.md`.
- **Content and reads.**
  - Case studies are typed data in `content/work/` (`types.ts`; registry `index.ts`: `caseStudies`, `archive`).
  - Pages read them only through `lib/work/` (`index.ts`). Sprint 7's admin overlay merges in there.
  - `lib/work/derive.ts` builds serialisable views: FIG labels, year groups, chips, credits and resolved images.
  - `tests/content/work.test.ts` runs `validateWork` on the registry.
- **Ids are permanent once published.** They key `?fig=` URLs and image files.
- **Images.**
  - A media slot shows `image` when set, otherwise `work/<slug>/<media id>` when the manifest has it, otherwise the dither placeholder.
  - FIG numbers count from the oldest entry (02 upwards; the hero is 01), so new entries don't renumber.
- **View state.**
  - It lives in the query (`?view`, `?tag`, `?density`, `?fig`; `lib/work/url-state.ts`).
  - The server always renders the default Log as a `<Suspense>` fallback, and `StudyBrowser` (`useSearchParams`) applies the query after hydration. Never read `searchParams` in these pages: one HTML per path keeps the CDN cache.
- **Viewer.**
  - `MediaViewer` is a native `<dialog>` in the Life palette.
  - Opening pushes `?fig=`, so Back closes it; stepping replaces it.
- **Credits.** Onur's role is a case-study fact. `credits` on an entry or a media item names colleagues, and Templates uses media-level credits for pages others designed.
- **Numbers.** Coverage (Templates) and the icon count (PrimeIcons) are computed, never written by hand.
```

- [ ] **Step 8: Run every check and commit**

```bash
git add lib content components app CLAUDE.md tests e2e
git commit -m "Add the /work/ index, turn on the Work nav and link the home to the case studies

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: `npm run figma`, the Figma export script

**Files:**
- Create: `lib/work/figma-plan.ts`, `lib/work/figma-export.ts`, `scripts/figma.ts`, `lib/images/figma-lock.json`
- Modify: `package.json` (script), `CLAUDE.md`
- Test: `tests/work/figma-plan.test.ts`, `tests/work/figma-export.test.ts`

**Interfaces:**
- Consumes: `caseStudies`, `archive` (Task 3); `imageKey` (Task 2); `normalizeNodeId` (Task 2).
- Produces:
  - `FigmaTarget`, `LockEntry`, `FigmaLock`, `collectTargets`, `groupByFile` and `isFresh` in `figma-plan.ts`;
  - `ExportIO`, `ExportResult` and `exportFrames` in `figma-export.ts`;
  - the `npm run figma` script.

Review fixes from Tasks 2–9 that touch `lib/work/derive.ts` or `lib/work/figma.ts` (the controller fills these in): _none yet_.

- [ ] **Step 1: Write the failing tests**

Create `tests/work/figma-plan.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";
import { collectTargets, groupByFile, isFresh } from "@/lib/work/figma-plan";

const study = (media: CaseStudy["hero"][]): CaseStudy => ({
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "k",
  years: "y",
  lead: { strong: "", rest: "" },
  intro: [],
  facts: [],
  links: [],
  hero: { id: "cover", caption: "c", figma: { fileKey: "F1", nodeId: "1-2" } },
  entries: [{ id: "e", date: "2024-01", note: "n", media }],
});

describe("collectTargets", () => {
  it("collects Figma-backed media, normalising node ids, and skips hand-set images", () => {
    const archive: ArchiveEntry[] = [
      { id: "aura", org: "primetek", date: "2024-01", title: "A", note: "n", source: "https://x.com/1", media: { id: "aura", caption: "a", figma: { fileKey: "F2", nodeId: "9:9" } } },
    ];
    const targets = collectTargets(
      [
        study([
          { id: "tokens", caption: "t", figma: { fileKey: "F1", nodeId: "3:4" } },
          { id: "manual", caption: "m", image: "photos/x", figma: { fileKey: "F1", nodeId: "5:6" } },
          { id: "derived", caption: "d", image: "work/primeone/derived", figma: { fileKey: "F1", nodeId: "7:8" } },
          { id: "plain", caption: "p" },
        ]),
      ],
      archive,
    );
    expect(targets).toEqual([
      { key: "work/primeone/cover", fileKey: "F1", nodeId: "1:2", out: "images-src/work/primeone/cover.png" },
      { key: "work/primeone/tokens", fileKey: "F1", nodeId: "3:4", out: "images-src/work/primeone/tokens.png" },
      { key: "work/primeone/derived", fileKey: "F1", nodeId: "7:8", out: "images-src/work/primeone/derived.png" },
      { key: "work/archive/aura", fileKey: "F2", nodeId: "9:9", out: "images-src/work/archive/aura.png" },
    ]);
    expect([...groupByFile(targets).keys()]).toEqual(["F1", "F2"]);
  });
});

describe("isFresh", () => {
  const target = { key: "work/primeone/cover", fileKey: "F1", nodeId: "1:2", out: "images-src/work/primeone/cover.png" };
  const lock = { "work/primeone/cover": { fileKey: "F1", nodeId: "1:2", lastModified: "2026-01-01T00:00:00Z", exportedAt: "x" } };

  it("is fresh only when file, node and the file's lastModified all match", () => {
    expect(isFresh(target, lock, "2026-01-01T00:00:00Z")).toBe(true);
    expect(isFresh(target, lock, "2026-02-01T00:00:00Z")).toBe(false);
    expect(isFresh({ ...target, nodeId: "1:3" }, lock, "2026-01-01T00:00:00Z")).toBe(false);
    expect(isFresh(target, {}, "2026-01-01T00:00:00Z")).toBe(false);
  });
});
```

Create `tests/work/figma-export.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { type ExportIO, exportFrames } from "@/lib/work/figma-export";
import type { FigmaTarget } from "@/lib/work/figma-plan";

const targets: FigmaTarget[] = [
  { key: "work/primeone/a", fileKey: "F1", nodeId: "1:1", out: "images-src/work/primeone/a.png" },
  { key: "work/primeone/b", fileKey: "F1", nodeId: "1:2", out: "images-src/work/primeone/b.png" },
  { key: "work/primeone/c", fileKey: "F1", nodeId: "1:3", out: "images-src/work/primeone/c.png" },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function io(fetchImpl: (url: string) => Promise<Response>, existing: string[] = []): ExportIO & { written: Map<string, Uint8Array> } {
  const written = new Map<string, Uint8Array>();
  return {
    written,
    fetch: vi.fn((input: RequestInfo | URL) => fetchImpl(String(input))) as unknown as typeof fetch,
    exists: (path) => existing.includes(path),
    write: (path, data) => void written.set(path, data),
    log: () => {},
    warn: vi.fn(),
    now: () => "2026-10-03T00:00:00Z",
  };
}

describe("exportFrames", () => {
  it("skips fresh frames, exports stale ones, and survives a node that fails", async () => {
    const lock = { "work/primeone/a": { fileKey: "F1", nodeId: "1:1", lastModified: "L1", exportedAt: "old" } };
    const env = io(async (url) => {
      if (url.includes("/files/F1/nodes")) return json({ lastModified: "L1", nodes: { "1:1": {}, "1:2": {}, "1:3": null } });
      if (url.includes("/images/F1")) {
        expect(url).toContain("ids=1%3A2");
        expect(url).not.toContain("1%3A1");
        return json({ err: null, images: { "1:2": "https://cdn.figma/b.png" } });
      }
      if (url === "https://cdn.figma/b.png") return new Response(new Uint8Array([1, 2, 3]));
      throw new Error(`unexpected ${url}`);
    }, ["images-src/work/primeone/a.png"]);

    const result = await exportFrames(targets, lock, "TOKEN", env);

    expect([...env.written.keys()]).toEqual(["images-src/work/primeone/b.png"]);
    expect(result.written).toEqual(["work/primeone/b"]);
    expect(result.lock["work/primeone/b"]).toEqual({ fileKey: "F1", nodeId: "1:2", lastModified: "L1", exportedAt: "2026-10-03T00:00:00Z" });
    expect(result.lock["work/primeone/a"].exportedAt).toBe("old");
    expect(result.lock["work/primeone/c"]).toBeUndefined();
    expect(env.warn).toHaveBeenCalledWith(expect.stringContaining("work/primeone/c: node 1:3 not found"));
    expect(result.failed).toBe(false);
  });

  it("re-exports a fresh frame whose output file is missing", async () => {
    const lock = { "work/primeone/a": { fileKey: "F1", nodeId: "1:1", lastModified: "L1", exportedAt: "old" } };
    const env = io(async (url) => {
      if (url.includes("/files/")) return json({ lastModified: "L1", nodes: { "1:1": {} } });
      if (url.includes("/images/")) return json({ err: null, images: { "1:1": "https://cdn.figma/a.png" } });
      return new Response(new Uint8Array([9]));
    });
    const result = await exportFrames([targets[0]], lock, "TOKEN", env);
    expect(result.written).toEqual(["work/primeone/a"]);
  });

  it("sends the token and reports failure when every request fails", async () => {
    const env = io(async () => json({ status: 403, err: "Invalid token" }, 403));
    const result = await exportFrames(targets, {}, "TOKEN", env);
    expect(result.failed).toBe(true);
    expect(result.written).toEqual([]);
    const [, init] = (env.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init).toEqual({ headers: { "X-Figma-Token": "TOKEN" } });
  });
});
```

Run: `npx vitest run tests/work/figma-plan.test.ts tests/work/figma-export.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 2: Write `lib/work/figma-plan.ts`**

```ts
import type { ArchiveEntry, CaseStudy, Media } from "@/content/work/types";
import { imageKey } from "./derive";
import { normalizeNodeId } from "./figma";

// What `npm run figma` exports. A target is a media slot with a Figma frame
// and no hand-set image (an explicit `image` that isn't the derived key
// wins). Output goes to images-src/, where `npm run images` picks it up.

export interface FigmaTarget {
  // The manifest key: "work/<slug>/<media id>".
  key: string;
  fileKey: string;
  // API form, "12:345".
  nodeId: string;
  // Relative to the repo root.
  out: string;
}

export interface LockEntry {
  fileKey: string;
  nodeId: string;
  // The Figma file's lastModified when exported (Figma reports it per file).
  lastModified: string;
  exportedAt: string;
}

export type FigmaLock = Record<string, LockEntry>;

export function collectTargets(studies: CaseStudy[], archive: ArchiveEntry[]): FigmaTarget[] {
  const targets: FigmaTarget[] = [];
  const add = (scope: string, media: Media | undefined) => {
    if (!media?.figma) return;
    const key = imageKey(scope, media.id);
    if (media.image && media.image !== key) return;
    targets.push({ key, fileKey: media.figma.fileKey, nodeId: normalizeNodeId(media.figma.nodeId), out: `images-src/${key}.png` });
  };
  for (const study of studies) {
    add(study.slug, study.hero);
    for (const entry of study.entries) for (const media of entry.media) add(study.slug, media);
  }
  for (const entry of archive) add("archive", entry.media);
  return targets;
}

export function groupByFile(targets: FigmaTarget[]): Map<string, FigmaTarget[]> {
  const groups = new Map<string, FigmaTarget[]>();
  for (const target of targets) groups.set(target.fileKey, [...(groups.get(target.fileKey) ?? []), target]);
  return groups;
}

export function isFresh(target: FigmaTarget, lock: FigmaLock, fileLastModified: string): boolean {
  const entry = lock[target.key];
  return entry !== undefined && entry.fileKey === target.fileKey && entry.nodeId === target.nodeId && entry.lastModified === fileLastModified;
}
```

- [ ] **Step 3: Write `lib/work/figma-export.ts`**

```ts
import { type FigmaLock, type FigmaTarget, groupByFile, isFresh } from "./figma-plan";

const API = "https://api.figma.com/v1";

// Side effects are injected, so the loop is unit-tested without the network.
export interface ExportIO {
  fetch: typeof fetch;
  // Paths are relative to the repo root.
  exists(path: string): boolean;
  write(path: string, data: Uint8Array): void;
  log(message: string): void;
  warn(message: string): void;
  now(): string;
}

export interface ExportResult {
  lock: FigmaLock;
  // Manifest keys written in this run.
  written: string[];
  // True when there was work to do and every request failed (a bad token, no
  // network). One failing node only warns.
  failed: boolean;
}

// For each Figma file: read its lastModified and check the nodes exist, skip
// frames that are fresh in the lock (and on disk), export the rest as 2× PNG
// and download them. Failures warn and leave that frame's file and lock entry
// alone.
export async function exportFrames(targets: FigmaTarget[], lock: FigmaLock, token: string, io: ExportIO): Promise<ExportResult> {
  const next: FigmaLock = { ...lock };
  const written: string[] = [];
  let requests = 0;
  let failures = 0;

  async function api<T>(path: string): Promise<T> {
    requests++;
    const response = await io.fetch(`${API}${path}`, { headers: { "X-Figma-Token": token } });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
    return (await response.json()) as T;
  }

  for (const [fileKey, group] of groupByFile(targets)) {
    let meta: { lastModified: string; nodes: Record<string, unknown> };
    try {
      meta = await api(`/files/${fileKey}/nodes?ids=${encodeURIComponent(group.map((t) => t.nodeId).join(","))}&depth=1`);
    } catch (error) {
      failures++;
      io.warn(`warn  ${fileKey}: ${(error as Error).message}`);
      continue;
    }

    const stale = group.filter((target) => {
      if (!meta.nodes[target.nodeId]) {
        io.warn(`warn  ${target.key}: node ${target.nodeId} not found in ${fileKey}`);
        return false;
      }
      if (isFresh(target, lock, meta.lastModified) && io.exists(target.out)) {
        io.log(`skip  ${target.key}`);
        return false;
      }
      return true;
    });
    if (stale.length === 0) continue;

    let images: Record<string, string | null>;
    try {
      const result = await api<{ err: string | null; images: Record<string, string | null> }>(
        `/images/${fileKey}?ids=${encodeURIComponent(stale.map((t) => t.nodeId).join(","))}&format=png&scale=2`,
      );
      images = result.images;
    } catch (error) {
      failures++;
      io.warn(`warn  ${fileKey}: export failed (${(error as Error).message})`);
      continue;
    }

    for (const target of stale) {
      const url = images[target.nodeId];
      if (!url) {
        io.warn(`warn  ${target.key}: Figma returned no image`);
        continue;
      }
      try {
        requests++;
        const response = await io.fetch(url);
        if (!response.ok) throw new Error(`${response.status}`);
        io.write(target.out, new Uint8Array(await response.arrayBuffer()));
        next[target.key] = { fileKey, nodeId: target.nodeId, lastModified: meta.lastModified, exportedAt: io.now() };
        written.push(target.key);
        io.log(`wrote ${target.key}`);
      } catch (error) {
        failures++;
        io.warn(`warn  ${target.key}: download failed (${(error as Error).message})`);
      }
    }
  }

  return { lock: next, written, failed: requests > 0 && failures === requests };
}
```

Run: `npx vitest run tests/work/figma-plan.test.ts tests/work/figma-export.test.ts`
Expected: PASS.

- [ ] **Step 4: Write `scripts/figma.ts`, the lock file and the npm script**

`scripts/figma.ts`:

```ts
// Exports the Figma frames named in content/work/ into images-src/work/, then
// `npm run images` optimises them (the npm script chains both).
//
//   npm run figma
//
// Runs on Onur's machine only. It needs FIGMA_TOKEN in .env.local, a Figma
// personal access token with the file_content:read scope (Figma → Settings →
// Security). CI, builds and production never call Figma. Commit the PNGs,
// the renditions, lib/images/manifest.json and lib/images/figma-lock.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { archive, caseStudies } from "../content/work";
import { exportFrames } from "../lib/work/figma-export";
import { type FigmaLock, collectTargets } from "../lib/work/figma-plan";

const ROOT = process.cwd();
const LOCK = join(ROOT, "lib", "images", "figma-lock.json");

async function main(): Promise<number> {
  try {
    process.loadEnvFile(join(ROOT, ".env.local"));
  } catch {
    // No .env.local: FIGMA_TOKEN may still come from the environment.
  }
  const token = process.env.FIGMA_TOKEN;
  if (!token) {
    console.error(
      "FIGMA_TOKEN is not set. Create a personal access token in Figma (Settings → Security, scope file_content:read) and add FIGMA_TOKEN=... to .env.local.",
    );
    return 1;
  }

  const targets = collectTargets(caseStudies, archive);
  if (targets.length === 0) {
    console.log("No Figma frames in content/work/.");
    return 0;
  }

  const lock: FigmaLock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : {};
  const result = await exportFrames(targets, lock, token, {
    fetch,
    exists: (path) => existsSync(join(ROOT, path)),
    write: (path, data) => {
      const out = join(ROOT, path);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, data);
    },
    log: (message) => console.log(message),
    warn: (message) => console.warn(message),
    now: () => new Date().toISOString(),
  });
  writeFileSync(LOCK, `${JSON.stringify(result.lock, null, 2)}\n`);
  console.log(`${result.written.length} frame(s) exported.`);
  return result.failed ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
```

`lib/images/figma-lock.json`:

```json
{}
```

`package.json`, in `scripts` after `"images"`:

```json
    "figma": "tsx scripts/figma.ts && tsx scripts/images.ts",
```

- [ ] **Step 5: Smoke-test the script without a token**

Run: `env -u FIGMA_TOKEN npx tsx scripts/figma.ts; echo "exit $?"`

Expected: the "FIGMA_TOKEN is not set…" message and `exit 1`. This also proves that `tsx` resolves the `@/` imports inside `content/work/` and `lib/work/`. If it fails on module resolution, change those imports to relative paths, in `content/work/*.ts` and in `lib/work/{derive,figma,figma-plan,figma-export}.ts` only. Re-run every test after the change.

Make sure there is no `.env.local` with a real token in the worktree while running this; never print the token.

- [ ] **Step 6: Document it in `CLAUDE.md`**

In `## Commands`, add after the `npm run images` line:

```bash
npm run figma          # export Figma frames named in content/work/ (needs FIGMA_TOKEN in .env.local), then npm run images
```

In `## Environment`, add:

```markdown
- `FIGMA_TOKEN`: local only (`.env.local`), for `npm run figma`. A Figma personal access token with `file_content:read`. Never set it on Vercel or in CI.
```

In `## Work (Sprint 5)`, add:

```markdown
- **Filling media from Figma.**
  1. Set `figma: { fileKey, nodeId }` on a media item (`nodeId` "12:345"; the URL's `node-id=12-345`).
  2. Run `npm run figma`. It writes `images-src/work/<slug>/<id>.png`, updates `lib/images/figma-lock.json` (skipping frames whose file hasn't changed) and runs `npm run images`.
  3. Commit everything.

  `embed: true` adds the click-to-load embed in the viewer. Set it only on files shared as "anyone with the link can view".
```

- [ ] **Step 7: Run every check and commit**

```bash
git add lib/work/figma-plan.ts lib/work/figma-export.ts scripts/figma.ts lib/images/figma-lock.json package.json CLAUDE.md tests/work/figma-plan.test.ts tests/work/figma-export.test.ts
git commit -m "Add npm run figma to export case study frames from Figma

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 11: Content pass from the research, and Figma frames (controller)

The controller does this with Onur, not a subagent: it needs his judgement, his Figma links and his token.

**Files:**
- Modify: `content/work/*.ts`
- Modify: tests that assert seed content, if entries change (`e2e/work-*.spec.ts`, `tests/work/index-groups.test.ts`, `tests/content/work.test.ts`)
- Possibly create: `images-src/work/**`, `public/images/work/**`, `lib/images/manifest.json`, `lib/images/figma-lock.json`

- [ ] **Step 1: Draft entries from Task 1's research.** For each case study and the Archive, add or correct entries:
  - each with `date`, a version or title, a one-sentence `note` and a `source`;
  - template frameworks and live demo `links`;
  - credits where a post names a colleague.

  Candidates already known from the @w00f retweets: Aura (Jan 2024), PrimeVue Material theme (Oct 2024), Diamond remastered (Oct 2024), the PrimeVue and PrimeNG Theme Designers (Feb/Apr 2025), PrimeBlocks Q1/Q2 2025, and PrimeBlocks for Angular (Sep 2025). Each needs its PrimeTek-account post as the source.

  Keep every number dated and sourced. No "80+", "500" or "25+" unless Onur confirms it.
- [ ] **Step 2: Ask Onur the open content questions in one AskUserQuestion batch.** Recommended option first in each:
  - Confirm the `years` spans.
  - Is the July 2022 "UI kit for Figma" the first PrimeOne?
  - Real names for `@umitceliks` / `@tanerengiin`?
  - Which templates and pages did colleagues design?
  - Should the home's fourth tile be "Templates", replacing "Premium admin dashboards"?
- [ ] **Step 3: Figma frames.**
  1. Ask Onur for one Figma file link per case study, plus `FIGMA_TOKEN` in `.env.local` (he adds it himself; never ask him to paste it in chat).
  2. Browse each file with the Figma MCP (`get_metadata`, then `get_screenshot` on candidate frames).
  3. Propose a hero and per-entry frames, with ids, captions, tags and credits, as a table. Onur approves.
  4. Write the `figma` refs into the content files.
  5. Run `npm run figma` and check the renditions.
  6. Set `embed: true` only for files Onur confirms are shared by link.

  If Onur has no time yet, skip this step: the pages ship with placeholders, and the step moves to the follow-ups file.
- [ ] **Step 4: Update the tests that pin seed content.** Run every check, then commit:

```bash
git add content images-src public/images lib/images tests e2e
git commit -m "Fill the PrimeTek case studies from the PrimeTek posts and Figma

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Whole-sprint verification, review and PR (controller)

- [ ] **Step 1: Visual check.** Run `npm run build`, then:

```bash
npm run screenshots -- /tmp/sprint-5 /work/ /work/primeone/ "/work/primeone/?view=grid" "/work/primeone/?view=index" /work/primeicons/ "/work/primeicons/?view=grid" /work/templates/ /work/archive/ /
```

  Look at every screenshot (1440 and 390, light and dark). Also check, with the Browser tools:
  - The sticky Doto year mid-scroll on `/work/primeone/`.
  - The viewer frozen mid-fade: open it, then within 100ms run `document.getAnimations()` / `getComputedStyle(dialog).opacity` and expect a value strictly between 0 and 1.
  - The viewer at 375px.
  - Placeholders at every Grid density.
  - Focus outlines on the view bar, the cards and the viewer controls.
- [ ] **Step 2: Run every check on the final branch**, from the Global Constraints.
- [ ] **Step 3: Final whole-branch review.** Dispatch an opus code reviewer over `git diff v2...sprint-5`, with the spec and this plan as context. Fix or triage each finding:
  - fix technical issues;
  - ask Onur about behaviour and content.
- [ ] **Step 4: Write the follow-ups file.** Create `docs/superpowers/plans/2026-10-03-sprint-5-followups.md`, in the format of the Sprint 4 follow-ups. It holds:
  - the pre-merge checks for Onur: copy approval, Figma frames if Step 3 of Task 11 was skipped, and the CDN check below;
  - deferred items, labelled by sprint.

  The CDN check runs on the preview:

```bash
U=https://<preview>.vercel.app
for p in /work/ /work/primeone/ "/work/primeone/?view=grid" "/work/primeone/?fig=cover"; do for i in 1 2; do
  curl -sI -H "x-vercel-protection-bypass: $BYPASS" "$U$p" | grep -iE '^(cache-control|x-vercel-cache|age):'; echo; done; done
```

  The second request of each pair must be `HIT` or `STALE`.
- [ ] **Step 5: Update the foundation spec's roadmap row** for Sprint 5 to point at this sprint's spec. Commit it.
- [ ] **Step 6: Ask Onur before any outward action.** Push `sprint-5`, then open a PR into `v2` (its body ends with the Claude Code line). Hand over the Vercel preview URL and the follow-ups checklist.
