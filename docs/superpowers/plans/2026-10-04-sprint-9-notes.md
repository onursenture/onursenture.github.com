# Sprint 9: Notes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Notes: short posts shaped like Bluesky posts, written in `/admin/notes/` (draft, publish, schedule, edit, delete, fully usable on a phone) and shown on the Work side and the Life side:
- the Work side gets a home row, `/notes/` with pagination, and `/notes/<tid>/`;
- the Life side gets a `/life/` section, a readout line, `/life/notes/` and `/life/notes/<tid>/`;
- `/feed.xml` carries notes and photos.

**Architecture:**
- **Storage.** A new `notes` table in Neon holds every note. `NoteStore` has a Drizzle implementation and a JSON-file one, the same split as Sprint 7's `ContentStore`.
- **Writes.** They go through pure operations in `lib/notes/operations.ts`, wrapped by server actions that call `updateTag("notes")`.
- **Public reads.** Pages read one cached list, `getPublishedNotes()` (tag `notes`), and slice it with pure view helpers.
- **Facets.** Links, mentions and tags come from `@atproto/api`'s `RichText`, so the site links exactly what Bluesky would.
- **Scheduled notes** are flipped by `POST /api/notes/publish-due/`. A 15-minute GitHub Actions cron on `master` calls it.

**Tech Stack:** Next.js 16 (App Router, `cacheComponents`, `trailingSlash`), React 19, TypeScript, Tailwind 4 (token utilities only), zod 4, Drizzle (neon-http; PGlite in tests), `@atproto/api` 0.23.0 (server only), `@vercel/blob`, sharp, cheerio, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-04-sprint-9-notes-design.md`. Mockups are in `docs/superpowers/specs/2026-10-04-sprint-9-mockups/`:
- `home-notes-row.html`: A;
- `notes-pages.html`: A;
- `admin-notes.html`: **B**.

## Global Constraints

- **Branch and commits:**
  - Work in the worktree `../onursenture.github.com-sprint-9` on branch `sprint-9` (from `v2` 07940a7). Never push; the controller opens the PR.
  - Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No "Task N" prefixes in subjects.
- **Next.js rules:**
  - Read `node_modules/next/dist/docs/` before using a Next API you haven't used in this repo.
  - Pages never read `cookies()` / `headers()` / `searchParams`; data comes from `"use cache"` functions.
  - Under `cacheComponents`, `generateStaticParams` must return **at least one** param: use the placeholder when there are no notes.
- **`trailingSlash: true`.** Internal page links end with `/`, and so do API URLs (`/api/notes/publish-due/`).
- **`@atproto/api` is imported only from `lib/notes/facets.ts`**, and that module is only imported by server code (server components, the feed and tests). A `"use client"` module must never import it, directly or through another module. Client code counts graphemes with `lib/notes/graphemes.ts`.
- **The note format** (Bluesky-shaped):
  - text of at most **300 graphemes**, plain text with no markdown;
  - **one** attachment: 1–4 images (any ratio from 1:3 to 3:1, at least 320px wide, alt text required to publish) **or** one link card;
  - `side` is `work` | `life` | `both`, and `lang` is `en` | `tr`.
- **Times:** scheduling is in **Europe/Istanbul**, on quarter hours only. Dates render with `lib/format.ts` (always Istanbul).
- **Styling:**
  - Type comes only from `type-name`, `type-lead`, `type-body`, `type-meta`, `type-label`. Colours come only from tokens (`text-fg`, `text-fg-muted`, `text-fg-soft`, `text-accent`, `text-danger`, `border-line`).
  - Square corners except form controls (`rounded-control`). No shadows.
  - **No accent buttons on public pages**: every public entry point is a text link. Admin buttons use `buttonClass`/`Button` as the other editors do.
- **No header nav:** Notes is `ready: true, inHeader: false`.
- **Fail soft:**
  - a missing or broken database renders no notes; it never breaks a page or the build;
  - a stored row with a bad `embed` renders without the attachment.
- **Editing rules:** no autosave. Drafts are saved by hand (Save draft, Cmd/Ctrl+S), and leaving with unsaved edits asks with `LEAVE_QUESTION` (Sprint 7 rule).
- **Database:** schema changes are expand-only. Migrations run only on Vercel production builds.
- **Checks:**
  - Check every task with `npm run typecheck && npm run lint && npm test`. If `npm run typecheck` fails on stale `.next/dev/types`, run `rm -rf .next` first.
  - Tasks that touch pages also run `npm run build && npm run e2e`; fixture tasks add `SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures`; admin tasks add `npm run build && npm run e2e:admin`.
  - Finish every build-and-e2e run with a plain `npm run build`.
- English only on the site, and draft copy only where the spec names it.

## File map

| File | Task | Responsibility |
|---|---|---|
| `lib/notes/types.ts`, `schema.ts`, `rules.ts`, `graphemes.ts`, `facets.ts`, `tid.ts`, `schedule.ts`, `tags.ts` | 1 | The note model: types, zod shape, publish rules, grapheme count, Bluesky facets, TIDs, Istanbul schedule helpers, cache tag |
| `lib/db/schema.ts`, `drizzle/0002_notes.sql`, `lib/notes/store.ts`, `drizzle-store.ts`, `file-store.ts`, `get-store.ts` | 2 | The `notes` table and the two stores |
| `lib/notes/operations.ts`, `app/api/notes/publish-due/route.ts` | 3 | Save, publish, schedule, unschedule, delete, publish-due; the cron endpoint |
| `lib/notes/read.ts`, `views.ts`, `fixtures.ts`, `metadata.ts`, `lib/format.ts` | 4 | The cached published list, the pure list views, fixture notes, page metadata, the note date formats |
| `components/notes/*`, `components/home/home-site.tsx`, `app/(work)/page.tsx`, `lib/nav.ts`, `app/(work)/notes/**` | 5 | The note component, the home row, `/notes/`, `/notes/page/<n>/`, `/notes/<tid>/` |
| `components/sections/notes/index.tsx`, `components/sections/life.ts`, `lib/life/readout.ts`, `app/life/page.tsx`, `app/life/notes/**` | 6 | The Life section, the readout line, `/life/notes/**` |
| `lib/feed/rss.ts`, `app/feed.xml/route.ts` | 7 | `/feed.xml` |
| `lib/media/rules.ts`, `lib/media/process.ts`, `lib/notes/link-card.ts`, `app/admin/notes-actions.ts`, `lib/admin/notes.ts` | 8 | Note uploads, link cards, the note server actions and loader |
| `lib/admin/note-composer.ts` | 9 | `NoteComposerState`, the composer's logic |
| `components/admin/notes/*`, `app/admin/(console)/notes/page.tsx`, `components/admin/admin-home.tsx` | 10 | `/admin/notes/` (mockup B) and the admin home's Notes section |
| `e2e-admin/notes.spec.ts`, `playwright.admin.config.ts`, `e2e-admin/global-setup.ts` | 11 | The admin e2e for notes, including a 375px phone run |
| `CLAUDE.md`, the spec's Errata, `docs/superpowers/plans/2026-10-04-sprint-9-followups.md` | 12 | Docs and the full CI run |
| `.github/workflows/publish-notes.yml`, `.github/workflows/sync.yml` (on `master`) | 13 | The cron (controller, with Onur's OK) |

Suggested models for the controller:
- Task 1: haiku (the code is complete).
- Tasks 2, 3, 4, 7 and 8: sonnet.
- Task 9: sonnet to implement, **opus** to review (a state machine, the Sprint 7 lesson).
- Tasks 10 and 11: sonnet.
- The final review: opus.

---

### Task 1: The note model

**Files:**
- Create: `lib/notes/types.ts`, `lib/notes/schema.ts`, `lib/notes/rules.ts`, `lib/notes/graphemes.ts`, `lib/notes/facets.ts`, `lib/notes/tid.ts`, `lib/notes/schedule.ts`, `lib/notes/tags.ts`
- Modify: `package.json`, `package-lock.json` (add `@atproto/api` 0.23.0, exact)
- Test: `tests/notes/model.test.ts`, `tests/notes/facets.test.ts`, `tests/notes/tid.test.ts`, `tests/notes/schedule.test.ts`

**Interfaces:**
- Produces:
  - `types.ts`: `NoteSide`, `NoteLang`, `NoteStatus`, `NOTE_SIDES`, `NOTE_LANGS`, `NOTE_STATUSES`, `MAX_GRAPHEMES` (300), `MAX_IMAGES` (4), `NoteImage`, `NoteLinkCard`, `NoteEmbed`, `NoteContent`, `Note`, `PublishedNote`, `isPublished(note)`, `NoteIssue`.
  - `schema.ts`: `noteImageSchema`, `noteEmbedSchema`, `noteContentSchema`.
  - `rules.ts`: `publishIssues(content: NoteContent): NoteIssue[]`.
  - `graphemes.ts`: `graphemeCount(text)`, `truncateGraphemes(text, max)`.
  - `facets.ts`: `NoteSegment`, `noteSegments(text)`.
  - `tid.ts`: `TID_PATTERN`, `tidFromTime(ms, offsetMicros?, clockId?)`, `tidTime(tid)`, `randomClockId()`.
  - `schedule.ts`: `NOTE_TIME_ZONE`, `QUARTER_TIMES`, `isQuarterHour(date)`, `zonedToUtc(date, time)`, `utcToZoned(iso)`, `nextQuarter(now)`, `scheduleIssue(publishAt, now)`.
  - `tags.ts`: `NOTES_TAG` (`"notes"`).

- [ ] **Step 1: Add the dependency**

Run: `npm install --save-exact @atproto/api@0.23.0`
Expected: `package.json` lists `"@atproto/api": "0.23.0"` under `dependencies`. (It brings its own zod 3 nested under its folder; the app's zod 4 is unaffected.)

- [ ] **Step 2: Write the failing tests**

`tests/notes/model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { graphemeCount, truncateGraphemes } from "@/lib/notes/graphemes";
import { publishIssues } from "@/lib/notes/rules";
import { noteContentSchema } from "@/lib/notes/schema";
import type { NoteContent } from "@/lib/notes/types";

const content = (patch: Partial<NoteContent> = {}): NoteContent => ({ text: "Hello.", side: "work", lang: "en", embed: null, ...patch });
const image = (alt = "A dog") => ({ key: "photos/kizilcikli", alt, width: 2560, height: 1600, widths: [640, 1280, 2560] });

describe("graphemeCount", () => {
  it("counts user-perceived characters, not code units", () => {
    expect(graphemeCount("👍🏽")).toBe(1);
    expect(graphemeCount("👨‍👩‍👧‍👦")).toBe(1);
    expect(graphemeCount("🇹🇷")).toBe(1);
    expect(graphemeCount("ğüşıöç")).toBe(6);
    expect(graphemeCount("é")).toBe(1);
    expect(graphemeCount("")).toBe(0);
  });

  it("truncates on grapheme boundaries with an ellipsis", () => {
    expect(truncateGraphemes("short", 10)).toBe("short");
    expect(truncateGraphemes("👍🏽👍🏽👍🏽", 2)).toBe("👍🏽👍🏽…");
    expect(truncateGraphemes("  two words  ", 4)).toBe("two…");
  });
});

describe("noteContentSchema", () => {
  it("accepts every attachment kind", () => {
    expect(noteContentSchema.safeParse(content()).success).toBe(true);
    expect(noteContentSchema.safeParse(content({ embed: { kind: "images", images: [image()] } })).success).toBe(true);
    expect(noteContentSchema.safeParse(content({ embed: { kind: "link", url: "https://w00f.org/", title: "", description: "", siteName: "" } })).success).toBe(true);
  });

  it("refuses an unknown side, lang or attachment, and more than 4 images", () => {
    expect(noteContentSchema.safeParse({ ...content(), side: "home" }).success).toBe(false);
    expect(noteContentSchema.safeParse({ ...content(), lang: "de" }).success).toBe(false);
    expect(noteContentSchema.safeParse({ ...content(), embed: { kind: "video" } }).success).toBe(false);
    expect(noteContentSchema.safeParse(content({ embed: { kind: "images", images: [image(), image(), image(), image(), image()] } })).success).toBe(false);
  });
});

describe("publishIssues", () => {
  it("passes a plain note", () => {
    expect(publishIssues(content())).toEqual([]);
  });

  it("refuses more than 300 graphemes, and counts emoji as one", () => {
    expect(publishIssues(content({ text: "👍🏽".repeat(300) }))).toEqual([]);
    expect(publishIssues(content({ text: "x".repeat(301) }))).toEqual([{ at: "text", message: "The text is 301 characters; the limit is 300." }]);
  });

  it("needs text unless there are images", () => {
    expect(publishIssues(content({ text: "  " }))).toEqual([{ at: "text", message: "Write something or add an image." }]);
    expect(publishIssues(content({ text: "", embed: { kind: "images", images: [image()] } }))).toEqual([]);
  });

  it("needs alt text on every image and at least one image", () => {
    expect(publishIssues(content({ embed: { kind: "images", images: [image(), image(" ")] } }))).toEqual([{ at: "embed/images/1/alt", message: "Image 2 needs alt text." }]);
    expect(publishIssues(content({ embed: { kind: "images", images: [] } }))).toEqual([{ at: "embed", message: "Add an image or remove the attachment." }]);
  });

  it("needs an http(s) link", () => {
    const link = (url: string) => content({ embed: { kind: "link", url, title: "", description: "", siteName: "" } });
    expect(publishIssues(link("https://w00f.org/"))).toEqual([]);
    expect(publishIssues(link("javascript:alert(1)"))).toEqual([{ at: "embed/url", message: "Use an http or https link." }]);
  });
});
```

`tests/notes/facets.test.ts`:

```ts
import { RichText } from "@atproto/api";
import { describe, expect, it } from "vitest";
import { noteSegments } from "@/lib/notes/facets";
import { graphemeCount } from "@/lib/notes/graphemes";

describe("noteSegments", () => {
  it("links URLs, including bare domains with a real TLD, but not file names", () => {
    expect(noteSegments("See onursenture.com/resume/ and https://w00f.org/x. notes.ts stays text.")).toEqual([
      { kind: "text", text: "See " },
      { kind: "link", text: "onursenture.com/resume/", href: "https://onursenture.com/resume/" },
      { kind: "text", text: " and " },
      { kind: "link", text: "https://w00f.org/x", href: "https://w00f.org/x" },
      { kind: "text", text: ". notes.ts stays text." },
    ]);
  });

  it("finds dotted @handles and #tags, not bare @names or numeric tags", () => {
    expect(noteSegments("ping @w00f.org and @w00f #atproto #2026")).toEqual([
      { kind: "text", text: "ping " },
      { kind: "mention", text: "@w00f.org", handle: "w00f.org" },
      { kind: "text", text: " and @w00f " },
      { kind: "tag", text: "#atproto", tag: "atproto" },
      { kind: "text", text: " #2026" },
    ]);
  });

  it("returns one text segment for plain text, and nothing for empty text", () => {
    expect(noteSegments("Just text.")).toEqual([{ kind: "text", text: "Just text." }]);
    expect(noteSegments("")).toEqual([]);
  });
});

describe("grapheme parity with Bluesky", () => {
  it.each(["👍🏽 👨‍👩‍👧‍👦 🇹🇷", "ğüşıöç é", "plain ascii", "é́", "日本語のテキスト", "tab\tand\nnewline"])("%s", (text) => {
    expect(graphemeCount(text)).toBe(new RichText({ text }).graphemeLength);
  });
});
```

`tests/notes/tid.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TID_PATTERN, tidFromTime, tidTime } from "@/lib/notes/tid";

describe("TIDs", () => {
  it("are 13 sortable base32 characters", () => {
    const tid = tidFromTime(Date.parse("2026-10-04T11:00:00.000Z"), 0, 7);
    expect(tid).toMatch(TID_PATTERN);
    expect(tid).toHaveLength(13);
  });

  it("sort like their times", () => {
    const a = tidFromTime(Date.parse("2025-12-31T23:59:59.999Z"));
    const b = tidFromTime(Date.parse("2026-01-01T00:00:00.000Z"));
    const c = tidFromTime(Date.parse("2026-01-01T00:00:00.000Z"), 1);
    expect([c, a, b].sort()).toEqual([a, b, c]);
  });

  it("round-trip to the millisecond", () => {
    const ms = Date.parse("2026-10-04T11:15:00.000Z");
    expect(tidTime(tidFromTime(ms, 0, 1023))).toBe(ms);
  });

  it("differ by clock id at the same time", () => {
    const ms = Date.parse("2026-10-04T11:15:00.000Z");
    expect(tidFromTime(ms, 0, 1)).not.toBe(tidFromTime(ms, 0, 2));
  });

  it("refuses times before 1970 and clock ids out of range", () => {
    expect(() => tidFromTime(-1)).toThrow();
    expect(() => tidFromTime(0, 0, 1024)).toThrow();
  });
});
```

`tests/notes/schedule.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { QUARTER_TIMES, isQuarterHour, nextQuarter, scheduleIssue, utcToZoned, zonedToUtc } from "@/lib/notes/schedule";

describe("Istanbul time", () => {
  it("converts an Istanbul date and time to UTC (UTC+3)", () => {
    expect(zonedToUtc("2026-10-05", "09:15")?.toISOString()).toBe("2026-10-05T06:15:00.000Z");
    expect(zonedToUtc("2027-01-01", "00:00")?.toISOString()).toBe("2026-12-31T21:00:00.000Z");
  });

  it("refuses malformed input", () => {
    expect(zonedToUtc("2026-10-5", "09:15")).toBeNull();
    expect(zonedToUtc("2026-10-05", "9:15")).toBeNull();
  });

  it("converts UTC back to the Istanbul date and time", () => {
    expect(utcToZoned("2026-10-05T06:15:00.000Z")).toEqual({ date: "2026-10-05", time: "09:15" });
    expect(utcToZoned("2026-12-31T21:00:00.000Z")).toEqual({ date: "2027-01-01", time: "00:00" });
  });

  it("offers the 96 quarter-hour times of a day", () => {
    expect(QUARTER_TIMES).toHaveLength(96);
    expect(QUARTER_TIMES.slice(0, 3)).toEqual(["00:00", "00:15", "00:30"]);
    expect(QUARTER_TIMES.at(-1)).toBe("23:45");
  });
});

describe("schedule rules", () => {
  const now = new Date("2026-10-04T11:07:00.000Z");

  it("knows a quarter hour", () => {
    expect(isQuarterHour(new Date("2026-10-04T11:15:00.000Z"))).toBe(true);
    expect(isQuarterHour(new Date("2026-10-04T11:16:00.000Z"))).toBe(false);
    expect(isQuarterHour(new Date("2026-10-04T11:15:01.000Z"))).toBe(false);
  });

  it("finds the next quarter hour, strictly after now", () => {
    expect(nextQuarter(now).toISOString()).toBe("2026-10-04T11:15:00.000Z");
    expect(nextQuarter(new Date("2026-10-04T11:15:00.000Z")).toISOString()).toBe("2026-10-04T11:30:00.000Z");
  });

  it("accepts a future quarter hour and refuses the rest", () => {
    expect(scheduleIssue(new Date("2026-10-04T11:15:00.000Z"), now)).toBeNull();
    expect(scheduleIssue(new Date("2026-10-04T11:00:00.000Z"), now)).toBe("Pick a time in the future.");
    expect(scheduleIssue(new Date("2026-10-04T11:20:00.000Z"), now)).toBe("Pick a time on the quarter hour.");
    expect(scheduleIssue(new Date("nope"), now)).toBe("Pick a date and a time.");
  });
});
```

- [ ] **Step 3: Run the tests to make sure they fail**

Run: `npx vitest run tests/notes`
Expected: FAIL, because the modules under `lib/notes/` don't exist.

- [ ] **Step 4: Write the model**

`lib/notes/types.ts`:

```ts
// Notes (Sprint 9 spec §1): short posts shaped like a Bluesky post
// (app.bsky.feed.post), so a later cross-post needs no reshaping.

export const NOTE_SIDES = ["work", "life", "both"] as const;
export type NoteSide = (typeof NOTE_SIDES)[number];

export const NOTE_LANGS = ["en", "tr"] as const;
export type NoteLang = (typeof NOTE_LANGS)[number];

export const NOTE_STATUSES = ["draft", "scheduled", "published"] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];

// Bluesky's limits: 300 graphemes of text, 4 images per post.
export const MAX_GRAPHEMES = 300;
export const MAX_IMAGES = 4;

// An uploaded image with its renditions, self-contained so a note renders
// without a media lookup (the same fields as ImageEntry, plus key and alt).
export interface NoteImage {
  key: string;
  alt: string;
  width: number;
  height: number;
  widths: number[];
  baseUrl?: string;
}

export interface NoteLinkCard {
  kind: "link";
  url: string;
  title: string;
  description: string;
  siteName: string;
}

// One attachment at most, like a Bluesky embed.
export type NoteEmbed = { kind: "images"; images: NoteImage[] } | NoteLinkCard | null;

// What the author edits.
export interface NoteContent {
  text: string;
  side: NoteSide;
  lang: NoteLang;
  embed: NoteEmbed;
}

// A stored note. Plain data with ISO strings, so server actions can hand it
// to client components unchanged.
export interface Note extends NoteContent {
  id: string;
  // The AT Protocol record key, set the first time the note is published.
  tid: string | null;
  status: NoteStatus;
  publishAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedNote extends Note {
  tid: string;
  status: "published";
  publishedAt: string;
}

export function isPublished(note: Note): note is PublishedNote {
  return note.status === "published" && note.tid !== null && note.publishedAt !== null;
}

// A reason a note can't be published or scheduled; `at` is a path into the
// content ("text", "embed/images/1/alt", "publishAt").
export interface NoteIssue {
  at: string;
  message: string;
}
```

`lib/notes/schema.ts`:

```ts
import { z } from "zod";
import { MAX_IMAGES, NOTE_LANGS, NOTE_SIDES } from "./types";

// The shape every write is checked against (client and server). Loose on
// purpose: a draft may be over the limit or miss alt text; publishIssues
// (rules.ts) holds the rules for going live.

export const noteImageSchema = z.object({
  key: z.string().min(1).max(300),
  alt: z.string().max(2000),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  widths: z.array(z.number().int().positive()).min(1),
  baseUrl: z.string().max(2000).optional(),
});

const linkSchema = z.object({
  kind: z.literal("link"),
  url: z.string().min(1).max(2000),
  title: z.string().max(300),
  description: z.string().max(1000),
  siteName: z.string().max(200),
});

export const noteEmbedSchema = z.union([
  z.object({ kind: z.literal("images"), images: z.array(noteImageSchema).max(MAX_IMAGES) }),
  linkSchema,
  z.null(),
]);

export const noteContentSchema = z.object({
  // Generous for drafts; publishing enforces MAX_GRAPHEMES.
  text: z.string().max(3000),
  side: z.enum(NOTE_SIDES),
  lang: z.enum(NOTE_LANGS),
  embed: noteEmbedSchema,
});
```

`lib/notes/graphemes.ts`:

```ts
// Client-safe text helpers (no @atproto/api here: the admin composer imports
// this). Graphemes are what Bluesky counts: 👍🏽 is one.
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

export function graphemeCount(text: string): number {
  let count = 0;
  for (const _ of segmenter.segment(text)) count++;
  return count;
}

// The first `max` graphemes of the trimmed text, with "…" when it was cut.
export function truncateGraphemes(text: string, max: number): string {
  const trimmed = text.trim();
  const parts = Array.from(segmenter.segment(trimmed), (part) => part.segment);
  if (parts.length <= max) return trimmed;
  return `${parts.slice(0, max).join("").trimEnd()}…`;
}
```

`lib/notes/facets.ts`:

```ts
import { RichText } from "@atproto/api";

// Links, @handles and #tags, detected with Bluesky's own rules (RichText,
// without handle resolution), so the site links exactly what a cross-post
// would. Server only: @atproto/api is large and must stay out of client
// bundles.

export type NoteSegment =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; href: string }
  | { kind: "mention"; text: string; handle: string }
  | { kind: "tag"; text: string; tag: string };

export function noteSegments(text: string): NoteSegment[] {
  if (text === "") return [];
  const rich = new RichText({ text });
  rich.detectFacetsWithoutResolution();
  const segments: NoteSegment[] = [];
  for (const segment of rich.segments()) {
    const link = segment.link;
    const mention = segment.mention;
    const tag = segment.tag;
    if (link) segments.push({ kind: "link", text: segment.text, href: link.uri });
    // Without resolution the mention's "did" is the handle itself.
    else if (mention) segments.push({ kind: "mention", text: segment.text, handle: mention.did });
    else if (tag) segments.push({ kind: "tag", text: segment.text, tag: tag.tag });
    else segments.push({ kind: "text", text: segment.text });
  }
  return segments;
}
```

`lib/notes/rules.ts`:

```ts
import { graphemeCount } from "./graphemes";
import { MAX_GRAPHEMES, type NoteContent, type NoteIssue } from "./types";

// What a note needs to go live (publish, schedule, or saving a note that is
// already live). Drafts skip these, so a half-written note is never lost.
export function publishIssues(content: NoteContent): NoteIssue[] {
  const issues: NoteIssue[] = [];
  const count = graphemeCount(content.text);
  if (count > MAX_GRAPHEMES) issues.push({ at: "text", message: `The text is ${count} characters; the limit is ${MAX_GRAPHEMES}.` });
  const embed = content.embed;
  const hasImages = embed?.kind === "images" && embed.images.length > 0;
  if (content.text.trim() === "" && !hasImages) issues.push({ at: "text", message: "Write something or add an image." });
  if (embed?.kind === "images") {
    if (embed.images.length === 0) issues.push({ at: "embed", message: "Add an image or remove the attachment." });
    embed.images.forEach((image, index) => {
      if (image.alt.trim() === "") issues.push({ at: `embed/images/${index}/alt`, message: `Image ${index + 1} needs alt text.` });
    });
  }
  if (embed?.kind === "link" && !/^https?:\/\//i.test(embed.url)) issues.push({ at: "embed/url", message: "Use an http or https link." });
  return issues;
}
```

`lib/notes/tid.ts`:

```ts
// AT Protocol record keys (TIDs): 53 bits of microseconds since the epoch and
// a 10-bit clock id, as 13 characters of sortable base32. A note's TID is its
// URL and, later, its Bluesky record key.

const ALPHABET = "234567abcdefghijklmnopqrstuvwxyz";
export const TID_PATTERN = /^[234567abcdefghij][234567abcdefghijklmnopqrstuvwxyz]{12}$/;

export function tidFromTime(ms: number, offsetMicros = 0, clockId = 0): string {
  if (!Number.isInteger(ms) || ms < 0) throw new Error(`bad TID time ${ms}`);
  if (!Number.isInteger(clockId) || clockId < 0 || clockId > 1023) throw new Error(`bad TID clock id ${clockId}`);
  let value = ((BigInt(ms) * 1000n + BigInt(offsetMicros)) << 10n) | BigInt(clockId);
  let out = "";
  for (let i = 0; i < 13; i++) {
    out = ALPHABET[Number(value & 31n)] + out;
    value >>= 5n;
  }
  return out;
}

// The millisecond a TID was made at.
export function tidTime(tid: string): number {
  let value = 0n;
  for (const char of tid) value = (value << 5n) | BigInt(ALPHABET.indexOf(char));
  return Number((value >> 10n) / 1000n);
}

export function randomClockId(): number {
  return Math.floor(Math.random() * 1024);
}
```

`lib/notes/schedule.ts`:

```ts
// Scheduling (Sprint 9 spec §4.1, §5): quarter hours in Istanbul time. The
// browser sends a date and a time as typed; the server turns them into UTC.

export const NOTE_TIME_ZONE = "Europe/Istanbul";
const QUARTER_MS = 15 * 60_000;

export const QUARTER_TIMES: string[] = Array.from({ length: 96 }, (_, i) => {
  const hours = String(Math.floor(i / 4)).padStart(2, "0");
  const minutes = String((i % 4) * 15).padStart(2, "0");
  return `${hours}:${minutes}`;
});

function zonedParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ms);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

// Minutes the zone is ahead of UTC at this instant.
function offsetMinutes(ms: number, timeZone: string): number {
  const p = zonedParts(ms, timeZone);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60_000);
}

export function zonedToUtc(date: string, time: string, timeZone = NOTE_TIME_ZONE): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const guess = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  // Twice, so an instant next to an offset change lands on the right side.
  const first = guess - offsetMinutes(guess, timeZone) * 60_000;
  return new Date(guess - offsetMinutes(first, timeZone) * 60_000);
}

export function utcToZoned(iso: string, timeZone = NOTE_TIME_ZONE): { date: string; time: string } {
  const p = zonedParts(new Date(iso).getTime(), timeZone);
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

// Istanbul's offset is a whole number of hours, so a UTC quarter hour is an
// Istanbul one.
export function isQuarterHour(date: Date): boolean {
  return date.getTime() % QUARTER_MS === 0;
}

export function nextQuarter(now: Date): Date {
  return new Date((Math.floor(now.getTime() / QUARTER_MS) + 1) * QUARTER_MS);
}

export function scheduleIssue(publishAt: Date, now: Date): string | null {
  if (Number.isNaN(publishAt.getTime())) return "Pick a date and a time.";
  if (!isQuarterHour(publishAt)) return "Pick a time on the quarter hour.";
  if (publishAt.getTime() <= now.getTime()) return "Pick a time in the future.";
  return null;
}
```

`lib/notes/tags.ts`:

```ts
// The one cache tag for notes: admin writes call updateTag(NOTES_TAG), the
// publish-due route revalidateTag(NOTES_TAG, { expire: 0 }).
export const NOTES_TAG = "notes";
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npx vitest run tests/notes && npm run typecheck && npm run lint`
Expected: PASS. If a facet expectation differs from `RichText`'s output, **do not change the expectation to match**: report it to the controller, because the spike on 2026-10-04 produced exactly these segments with `@atproto/api` 0.23.0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/notes tests/notes
git commit -m "Add the note model: Bluesky-shaped content, facets, TIDs and Istanbul scheduling

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The `notes` table and the note stores

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0002_notes.sql` (generated) and its `drizzle/meta/*` entries, `lib/notes/store.ts`, `lib/notes/drizzle-store.ts`, `lib/notes/file-store.ts`, `lib/notes/get-store.ts`
- Test: `tests/helpers/note-store-contract.ts`, `tests/notes/drizzle-store.test.ts`, `tests/notes/file-store.test.ts`

**Interfaces:**
- Consumes: `Note`, `NoteContent`, `PublishedNote`, `isPublished`, `noteEmbedSchema` (Task 1).
- Produces:
  - `store.ts`: `NoteFields`, `NoteWrite`, `NoteStore`.
  - `DrizzleNoteStore(db)` and `FileNoteStore(path)`.
  - `notesFileFor(contentFile)`: `".e2e-admin/content.json"` → `".e2e-admin/content.notes.json"`.
  - `getNoteStore(): NoteStore | null`.

`NoteStore` (exact):

```ts
export interface NoteFields extends NoteContent {
  status: NoteStatus;
  tid: string | null;
  publishAt: Date | null;
  publishedAt: Date | null;
}

export type NoteWrite = { ok: true; note: Note } | { ok: false; reason: "conflict" | "missing" | "duplicate-tid" };

export interface NoteStore {
  // Every note, any status, most recently updated first.
  list(): Promise<Note[]>;
  // Published notes, newest first (publishedAt desc, then tid desc).
  listPublished(): Promise<PublishedNote[]>;
  get(id: string): Promise<Note | null>;
  create(fields: NoteFields, now: Date): Promise<NoteWrite>;
  // Optimistic: `expected` is the updatedAt (ISO) the caller last saw.
  update(id: string, fields: NoteFields, expected: string, now: Date): Promise<NoteWrite>;
  remove(id: string, expected: string): Promise<NoteWrite>;
  // Scheduled notes whose publishAt <= now, oldest publishAt first.
  due(now: Date): Promise<Note[]>;
}
```

- [ ] **Step 1: Write the contract test and the two runners**

`tests/helpers/note-store-contract.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { NoteFields, NoteStore } from "@/lib/notes/store";

const t0 = new Date("2026-10-04T10:00:00.000Z");
const t1 = new Date("2026-10-04T10:00:05.000Z");
const t2 = new Date("2026-10-04T10:00:09.000Z");

export const draftFields = (patch: Partial<NoteFields> = {}): NoteFields => ({
  text: "Hello.",
  side: "work",
  lang: "en",
  embed: null,
  status: "draft",
  tid: null,
  publishAt: null,
  publishedAt: null,
  ...patch,
});

const published = (tid: string, at: Date, patch: Partial<NoteFields> = {}) => draftFields({ status: "published", tid, publishedAt: at, ...patch });

// The behaviour both NoteStore implementations must share.
export function describeNoteStore(name: string, make: () => Promise<NoteStore>) {
  describe(name, () => {
    let store: NoteStore;
    beforeEach(async () => {
      store = await make();
    });

    it("starts empty", async () => {
      expect(await store.list()).toEqual([]);
      expect(await store.listPublished()).toEqual([]);
      expect(await store.get("00000000-0000-4000-8000-000000000000")).toBeNull();
    });

    it("creates a draft with a uuid and ISO times", async () => {
      const result = await store.create(draftFields({ embed: { kind: "link", url: "https://w00f.org/", title: "w00f", description: "", siteName: "" } }), t0);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.note).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        text: "Hello.",
        side: "work",
        lang: "en",
        embed: { kind: "link", url: "https://w00f.org/", title: "w00f", description: "", siteName: "" },
        status: "draft",
        tid: null,
        publishAt: null,
        publishedAt: null,
        createdAt: t0.toISOString(),
        updatedAt: t0.toISOString(),
      });
      expect(await store.get(result.note.id)).toEqual(result.note);
    });

    it("updates only when the caller saw the latest version", async () => {
      const created = await store.create(draftFields(), t0);
      if (!created.ok) throw new Error("create failed");
      const id = created.note.id;
      const first = await store.update(id, draftFields({ text: "Two." }), t0.toISOString(), t1);
      expect(first).toMatchObject({ ok: true, note: { text: "Two.", updatedAt: t1.toISOString(), createdAt: t0.toISOString() } });
      expect(await store.update(id, draftFields({ text: "Stale." }), t0.toISOString(), t2)).toEqual({ ok: false, reason: "conflict" });
      expect(await store.update("00000000-0000-4000-8000-000000000000", draftFields(), t0.toISOString(), t2)).toEqual({ ok: false, reason: "missing" });
      expect((await store.get(id))?.text).toBe("Two.");
    });

    it("refuses a TID another note already has", async () => {
      const a = await store.create(published("3m2k7xq4ab2c2", t0), t0);
      const b = await store.create(draftFields(), t0);
      if (!a.ok || !b.ok) throw new Error("create failed");
      expect(await store.update(b.note.id, published("3m2k7xq4ab2c2", t1), t0.toISOString(), t1)).toEqual({ ok: false, reason: "duplicate-tid" });
      expect(await store.create(published("3m2k7xq4ab2c2", t1), t1)).toEqual({ ok: false, reason: "duplicate-tid" });
    });

    it("lists every note by last update, and published notes by date then TID", async () => {
      const old = await store.create(published("3lzzzzzzzzzz2", new Date("2025-12-01T00:00:00.000Z")), t0);
      const draft = await store.create(draftFields({ text: "Draft." }), t1);
      const same1 = await store.create(published("3m22222222222", new Date("2026-10-01T00:00:00.000Z")), t2);
      const same2 = await store.create(published("3m22222222223", new Date("2026-10-01T00:00:00.000Z")), t2);
      if (!old.ok || !draft.ok || !same1.ok || !same2.ok) throw new Error("create failed");
      expect((await store.list()).map((n) => n.id).slice(0, 2).sort()).toEqual([same1.note.id, same2.note.id].sort());
      expect((await store.list()).map((n) => n.id).slice(2)).toEqual([draft.note.id, old.note.id]);
      expect((await store.listPublished()).map((n) => n.tid)).toEqual(["3m22222222223", "3m22222222222", "3lzzzzzzzzzz2"]);
    });

    it("removes only when the caller saw the latest version", async () => {
      const created = await store.create(draftFields(), t0);
      if (!created.ok) throw new Error("create failed");
      expect(await store.remove(created.note.id, t1.toISOString())).toEqual({ ok: false, reason: "conflict" });
      expect(await store.remove(created.note.id, t0.toISOString())).toEqual({ ok: true, note: created.note });
      expect(await store.get(created.note.id)).toBeNull();
      expect(await store.remove(created.note.id, t0.toISOString())).toEqual({ ok: false, reason: "missing" });
    });

    it("finds scheduled notes that are due, oldest first", async () => {
      const later = await store.create(draftFields({ status: "scheduled", publishAt: new Date("2026-10-04T10:15:00.000Z") }), t0);
      const earlier = await store.create(draftFields({ status: "scheduled", publishAt: new Date("2026-10-04T09:45:00.000Z") }), t0);
      await store.create(draftFields({ status: "scheduled", publishAt: new Date("2026-10-04T10:30:00.000Z") }), t0);
      await store.create(draftFields(), t0);
      if (!later.ok || !earlier.ok) throw new Error("create failed");
      expect((await store.due(new Date("2026-10-04T10:15:00.000Z"))).map((n) => n.id)).toEqual([earlier.note.id, later.note.id]);
    });
  });
}
```

`tests/notes/drizzle-store.test.ts`:

```ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DrizzleNoteStore } from "@/lib/notes/drizzle-store";
import { describeNoteStore } from "../helpers/note-store-contract";

describeNoteStore("DrizzleNoteStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return new DrizzleNoteStore(db);
});
```

`tests/notes/file-store.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileNoteStore, notesFileFor } from "@/lib/notes/file-store";
import { describeNoteStore } from "../helpers/note-store-contract";

describeNoteStore("FileNoteStore", async () => new FileNoteStore(join(mkdtempSync(join(tmpdir(), "notes-")), "content.notes.json")));

describe("notesFileFor", () => {
  it("puts the notes next to the content store file", () => {
    expect(notesFileFor(".e2e-admin/content.json")).toBe(".e2e-admin/content.notes.json");
    expect(notesFileFor("store")).toBe("store.notes.json");
  });
});
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `npx vitest run tests/notes/drizzle-store.test.ts tests/notes/file-store.test.ts`
Expected: FAIL (modules missing).

- [ ] **Step 3: Add the table and generate the migration**

Append to `lib/db/schema.ts` (and add `uuid` to the `drizzle-orm/pg-core` import):

```ts
// Notes (Sprint 9): one row per note, any status. tid is set the first time a
// note is published and never changes (its URL). Expand-only migration.
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey(),
  tid: text("tid").unique(),
  text: text("text").notNull(),
  side: text("side").notNull(),
  lang: text("lang").notNull().default("en"),
  embed: jsonb("embed"),
  status: text("status").notNull(),
  publishAt: timestamp("publish_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
```

Run: `npx drizzle-kit generate --name notes`
Expected: `drizzle/0002_notes.sql` holds one `CREATE TABLE "notes"` with a unique constraint on `tid`, and nothing else (no change to existing tables). Commit the generated `drizzle/meta/` files too.

- [ ] **Step 4: Write the stores**

`lib/notes/store.ts`:

```ts
import type { Note, NoteContent, NoteStatus, PublishedNote } from "./types";

// Persistence for notes. DrizzleNoteStore backs production (Neon);
// FileNoteStore backs local dev and the admin e2e. Same semantics, pinned by
// tests/helpers/note-store-contract.ts.

export interface NoteFields extends NoteContent {
  status: NoteStatus;
  tid: string | null;
  publishAt: Date | null;
  publishedAt: Date | null;
}

export type NoteWrite = { ok: true; note: Note } | { ok: false; reason: "conflict" | "missing" | "duplicate-tid" };

export interface NoteStore {
  // Every note, any status, most recently updated first.
  list(): Promise<Note[]>;
  // Published notes, newest first (publishedAt desc, then tid desc).
  listPublished(): Promise<PublishedNote[]>;
  get(id: string): Promise<Note | null>;
  create(fields: NoteFields, now: Date): Promise<NoteWrite>;
  // Optimistic: `expected` is the updatedAt (ISO) the caller last saw.
  update(id: string, fields: NoteFields, expected: string, now: Date): Promise<NoteWrite>;
  remove(id: string, expected: string): Promise<NoteWrite>;
  // Scheduled notes whose publishAt <= now, oldest publishAt first.
  due(now: Date): Promise<Note[]>;
}

// Newest first by publishedAt, then by TID (both sort as strings).
export function byPublished(a: PublishedNote, b: PublishedNote): number {
  return b.publishedAt.localeCompare(a.publishedAt) || b.tid.localeCompare(a.tid);
}
```

`lib/notes/drizzle-store.ts`:

```ts
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { notes } from "../db/schema";
import { noteEmbedSchema } from "./schema";
import { type NoteFields, type NoteStore, type NoteWrite, byPublished } from "./store";
import { type Note, type NoteLang, type NoteSide, type NoteStatus, type PublishedNote, isPublished } from "./types";

// Accepts any Postgres Drizzle database: neon-http in production, PGlite in tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;
type Row = typeof notes.$inferSelect;

// A stored embed that no longer parses renders without the attachment.
function toNote(row: Row): Note {
  const embed = noteEmbedSchema.safeParse(row.embed ?? null);
  if (!embed.success) console.warn(`[notes] note ${row.id} has an unreadable embed; showing none`);
  return {
    id: row.id,
    text: row.text,
    side: row.side as NoteSide,
    lang: row.lang as NoteLang,
    embed: embed.success ? embed.data : null,
    status: row.status as NoteStatus,
    tid: row.tid,
    publishAt: row.publishAt?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Postgres unique_violation, raised by the tid constraint. Drizzle may wrap
// the driver error, so look at the cause too.
function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) => (typeof e === "object" && e !== null && "code" in e ? (e as { code: unknown }).code : undefined);
  return code(error) === "23505" || code((error as { cause?: unknown })?.cause) === "23505";
}

export class DrizzleNoteStore implements NoteStore {
  constructor(private db: AnyPgDatabase) {}

  async list(): Promise<Note[]> {
    const rows = await this.db.select().from(notes).orderBy(desc(notes.updatedAt), desc(notes.id));
    return rows.map(toNote);
  }

  async listPublished(): Promise<PublishedNote[]> {
    const rows = await this.db.select().from(notes).where(eq(notes.status, "published"));
    return rows.map(toNote).filter(isPublished).sort(byPublished);
  }

  async get(id: string): Promise<Note | null> {
    const rows = await this.db.select().from(notes).where(eq(notes.id, id)).limit(1);
    return rows[0] ? toNote(rows[0]) : null;
  }

  async create(fields: NoteFields, now: Date): Promise<NoteWrite> {
    try {
      const rows = await this.db
        .insert(notes)
        .values({ id: randomUUID(), ...fields, createdAt: now, updatedAt: now })
        .returning();
      return { ok: true, note: toNote(rows[0]) };
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, reason: "duplicate-tid" };
      throw e;
    }
  }

  async update(id: string, fields: NoteFields, expected: string, now: Date): Promise<NoteWrite> {
    try {
      const rows = await this.db
        .update(notes)
        .set({ ...fields, updatedAt: now })
        .where(and(eq(notes.id, id), eq(notes.updatedAt, new Date(expected))))
        .returning();
      if (rows[0]) return { ok: true, note: toNote(rows[0]) };
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, reason: "duplicate-tid" };
      throw e;
    }
    return { ok: false, reason: (await this.get(id)) ? "conflict" : "missing" };
  }

  async remove(id: string, expected: string): Promise<NoteWrite> {
    const rows = await this.db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.updatedAt, new Date(expected))))
      .returning();
    if (rows[0]) return { ok: true, note: toNote(rows[0]) };
    return { ok: false, reason: (await this.get(id)) ? "conflict" : "missing" };
  }

  async due(now: Date): Promise<Note[]> {
    const rows = await this.db
      .select()
      .from(notes)
      .where(and(eq(notes.status, "scheduled"), lte(notes.publishAt, now)))
      .orderBy(asc(notes.publishAt), asc(notes.id));
    return rows.map(toNote);
  }
}
```

`lib/notes/file-store.ts`:

```ts
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { type NoteFields, type NoteStore, type NoteWrite, byPublished } from "./store";
import { type Note, type PublishedNote, isPublished } from "./types";

// A JSON-file NoteStore for local development and the admin e2e, next to the
// content store file (CONTENT_STORE_FILE). Same semantics as DrizzleNoteStore.

export function notesFileFor(contentFile: string): string {
  return `${contentFile.replace(/\.json$/, "")}.notes.json`;
}

interface FileData {
  notes: Record<string, Note>;
}

function toStored(id: string, fields: NoteFields, createdAt: string, updatedAt: string): Note {
  return {
    id,
    text: fields.text,
    side: fields.side,
    lang: fields.lang,
    embed: fields.embed,
    status: fields.status,
    tid: fields.tid,
    publishAt: fields.publishAt?.toISOString() ?? null,
    publishedAt: fields.publishedAt?.toISOString() ?? null,
    createdAt,
    updatedAt,
  };
}

export class FileNoteStore implements NoteStore {
  constructor(private path: string) {}

  private read(): FileData {
    if (!existsSync(this.path)) return { notes: {} };
    return JSON.parse(readFileSync(this.path, "utf8")) as FileData;
  }

  private write(data: FileData) {
    mkdirSync(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
    renameSync(temp, this.path);
  }

  private tidTaken(data: FileData, tid: string | null, except: string | null): boolean {
    return tid !== null && Object.values(data.notes).some((note) => note.tid === tid && note.id !== except);
  }

  async list(): Promise<Note[]> {
    return Object.values(this.read().notes).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id));
  }

  async listPublished(): Promise<PublishedNote[]> {
    return Object.values(this.read().notes).filter(isPublished).sort(byPublished);
  }

  async get(id: string): Promise<Note | null> {
    return this.read().notes[id] ?? null;
  }

  async create(fields: NoteFields, now: Date): Promise<NoteWrite> {
    const data = this.read();
    if (this.tidTaken(data, fields.tid, null)) return { ok: false, reason: "duplicate-tid" };
    const id = randomUUID();
    const note = toStored(id, fields, now.toISOString(), now.toISOString());
    data.notes[id] = note;
    this.write(data);
    return { ok: true, note };
  }

  async update(id: string, fields: NoteFields, expected: string, now: Date): Promise<NoteWrite> {
    const data = this.read();
    const current = data.notes[id];
    if (!current) return { ok: false, reason: "missing" };
    if (current.updatedAt !== expected) return { ok: false, reason: "conflict" };
    if (this.tidTaken(data, fields.tid, id)) return { ok: false, reason: "duplicate-tid" };
    const note = toStored(id, fields, current.createdAt, now.toISOString());
    data.notes[id] = note;
    this.write(data);
    return { ok: true, note };
  }

  async remove(id: string, expected: string): Promise<NoteWrite> {
    const data = this.read();
    const current = data.notes[id];
    if (!current) return { ok: false, reason: "missing" };
    if (current.updatedAt !== expected) return { ok: false, reason: "conflict" };
    delete data.notes[id];
    this.write(data);
    return { ok: true, note: current };
  }

  async due(now: Date): Promise<Note[]> {
    return Object.values(this.read().notes)
      .filter((note) => note.status === "scheduled" && note.publishAt !== null && note.publishAt <= now.toISOString())
      .sort((a, b) => (a.publishAt ?? "").localeCompare(b.publishAt ?? "") || a.id.localeCompare(b.id));
  }
}
```

`lib/notes/get-store.ts`:

```ts
import "server-only";
import { getDb } from "../db/client";
import { DrizzleNoteStore } from "./drizzle-store";
import { FileNoteStore, notesFileFor } from "./file-store";
import type { NoteStore } from "./store";

// The store for notes, chosen like getContentStore: CONTENT_STORE_FILE (local
// dev, the admin e2e; refused on Vercel) wins, then Neon, else null (no notes
// render and the admin can't write).
export function getNoteStore(): NoteStore | null {
  const file = process.env.CONTENT_STORE_FILE;
  if (file) {
    if (process.env.VERCEL) throw new Error("CONTENT_STORE_FILE is for local development and e2e only");
    return new FileNoteStore(notesFileFor(file));
  }
  const db = getDb();
  return db ? new DrizzleNoteStore(db) : null;
}
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npx vitest run tests/notes tests/content/drizzle-store.test.ts && npm run typecheck && npm run lint`
Expected: PASS. Both stores pass the same contract, and the content store tests still pass on the new migration.

- [ ] **Step 6: Commit**

```bash
git add lib/db/schema.ts drizzle lib/notes tests/helpers/note-store-contract.ts tests/notes
git commit -m "Add the notes table with a Drizzle store and a file store for dev and e2e

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Note operations and the publish-due endpoint

**Files:**
- Create: `lib/notes/operations.ts`, `app/api/notes/publish-due/route.ts`, `e2e/notes-api.spec.ts`
- Test: `tests/notes/operations.test.ts`

**Interfaces:**
- Consumes: `NoteStore`, `NoteFields`, `NoteWrite`, `FileNoteStore`, `getNoteStore` (Task 2); `noteContentSchema`, `publishIssues`, `scheduleIssue`, `tidFromTime`, `randomClockId`, `isPublished`, `NOTES_TAG` (Task 1); `isAuthorized` (`lib/sync/auth.ts`).
- Produces (exact):

```ts
export type NoteOpResult = { status: "ok"; note: Note } | { status: "conflict" } | { status: "missing" } | { status: "invalid"; issues: NoteIssue[] };
export interface NoteInput { id: string | null; expected: string | null; content: unknown }
export interface NoteRef { id: string; expected: string }
export function saveNote(store: NoteStore, input: NoteInput, now: Date): Promise<NoteOpResult>;
export function publishNote(store: NoteStore, input: NoteInput, now: Date): Promise<NoteOpResult>;
export function scheduleNote(store: NoteStore, input: NoteInput & { publishAt: string }, now: Date): Promise<NoteOpResult>;
export function unscheduleNote(store: NoteStore, ref: NoteRef, now: Date): Promise<NoteOpResult>;
export function deleteNote(store: NoteStore, ref: NoteRef): Promise<NoteOpResult>;
export function publishDue(store: NoteStore, now: Date): Promise<Note[]>;
```

- `POST /api/notes/publish-due/`:
  - the bearer must be `SYNC_SECRET`, else 401;
  - `{ published: n }` with 200;
  - 503 without a store, 500 on an error.

- [ ] **Step 1: Write the failing tests**

`tests/notes/operations.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { FileNoteStore } from "@/lib/notes/file-store";
import { deleteNote, publishDue, publishNote, saveNote, scheduleNote, unscheduleNote } from "@/lib/notes/operations";
import type { NoteStore } from "@/lib/notes/store";
import { TID_PATTERN, tidTime } from "@/lib/notes/tid";
import type { Note, NoteContent } from "@/lib/notes/types";

const t0 = new Date("2026-10-04T10:00:00.000Z");
const t1 = new Date("2026-10-04T10:01:00.000Z");
const t2 = new Date("2026-10-04T10:02:00.000Z");
const content = (patch: Partial<NoteContent> = {}): NoteContent => ({ text: "Hello.", side: "work", lang: "en", embed: null, ...patch });

let store: NoteStore;
beforeEach(() => {
  store = new FileNoteStore(join(mkdtempSync(join(tmpdir(), "note-ops-")), "content.notes.json"));
});

async function ok(promise: Promise<{ status: string }>): Promise<Note> {
  const result = await promise;
  if (result.status !== "ok") throw new Error(`expected ok, got ${JSON.stringify(result)}`);
  return (result as { note: Note }).note;
}

describe("saveNote", () => {
  it("creates a draft, even over the limit, then saves over it", async () => {
    const draft = await ok(saveNote(store, { id: null, expected: null, content: content({ text: "x".repeat(400) }) }, t0));
    expect(draft).toMatchObject({ status: "draft", tid: null, text: "x".repeat(400) });
    const next = await ok(saveNote(store, { id: draft.id, expected: draft.updatedAt, content: content({ text: "Shorter." }) }, t1));
    expect(next).toMatchObject({ status: "draft", text: "Shorter.", updatedAt: t1.toISOString() });
  });

  it("refuses a stale tab, a missing note and a bad shape", async () => {
    const draft = await ok(saveNote(store, { id: null, expected: null, content: content() }, t0));
    await ok(saveNote(store, { id: draft.id, expected: draft.updatedAt, content: content({ text: "One." }) }, t1));
    expect(await saveNote(store, { id: draft.id, expected: draft.updatedAt, content: content({ text: "Two." }) }, t2)).toEqual({ status: "conflict" });
    expect(await saveNote(store, { id: "00000000-0000-4000-8000-000000000000", expected: t0.toISOString(), content: content() }, t2)).toEqual({ status: "missing" });
    expect(await saveNote(store, { id: null, expected: null, content: { ...content(), side: "home" } }, t2)).toMatchObject({ status: "invalid" });
  });

  it("keeps a published note publishable and its TID unchanged", async () => {
    const live = await ok(publishNote(store, { id: null, expected: null, content: content() }, t0));
    expect(await saveNote(store, { id: live.id, expected: live.updatedAt, content: content({ text: "x".repeat(301) }) }, t1)).toMatchObject({ status: "invalid" });
    const edited = await ok(saveNote(store, { id: live.id, expected: live.updatedAt, content: content({ text: "Edited." }) }, t1));
    expect(edited).toMatchObject({ status: "published", tid: live.tid, publishedAt: live.publishedAt, text: "Edited." });
  });
});

describe("publishNote", () => {
  it("publishes a new note with a TID from now", async () => {
    const live = await ok(publishNote(store, { id: null, expected: null, content: content() }, t0));
    expect(live.status).toBe("published");
    expect(live.publishedAt).toBe(t0.toISOString());
    expect(live.tid).toMatch(TID_PATTERN);
    expect(tidTime(live.tid!)).toBe(t0.getTime());
  });

  it("publishes a saved draft, and a re-publish keeps the TID and date", async () => {
    const draft = await ok(saveNote(store, { id: null, expected: null, content: content() }, t0));
    const live = await ok(publishNote(store, { id: draft.id, expected: draft.updatedAt, content: content({ text: "Live." }) }, t1));
    expect(live).toMatchObject({ id: draft.id, status: "published", text: "Live.", publishedAt: t1.toISOString() });
    const again = await ok(publishNote(store, { id: live.id, expected: live.updatedAt, content: content({ text: "Again." }) }, t2));
    expect(again).toMatchObject({ tid: live.tid, publishedAt: t1.toISOString(), text: "Again." });
  });

  it("refuses what can't go live", async () => {
    expect(await publishNote(store, { id: null, expected: null, content: content({ text: " " }) }, t0)).toEqual({
      status: "invalid",
      issues: [{ at: "text", message: "Write something or add an image." }],
    });
  });
});

describe("scheduleNote and unscheduleNote", () => {
  it("schedules on a future quarter hour, without a TID", async () => {
    const scheduled = await ok(scheduleNote(store, { id: null, expected: null, content: content(), publishAt: "2026-10-04T10:15:00.000Z" }, t0));
    expect(scheduled).toMatchObject({ status: "scheduled", tid: null, publishedAt: null, publishAt: "2026-10-04T10:15:00.000Z" });
  });

  it("refuses a past or off-quarter time, and a published note", async () => {
    expect(await scheduleNote(store, { id: null, expected: null, content: content(), publishAt: "2026-10-04T09:45:00.000Z" }, t0)).toEqual({
      status: "invalid",
      issues: [{ at: "publishAt", message: "Pick a time in the future." }],
    });
    expect(await scheduleNote(store, { id: null, expected: null, content: content(), publishAt: "2026-10-04T10:20:00.000Z" }, t0)).toMatchObject({ status: "invalid" });
    const live = await ok(publishNote(store, { id: null, expected: null, content: content() }, t0));
    expect(await scheduleNote(store, { id: live.id, expected: live.updatedAt, content: content(), publishAt: "2026-10-04T10:15:00.000Z" }, t0)).toEqual({
      status: "invalid",
      issues: [{ at: "publishAt", message: "A published note can't be scheduled." }],
    });
  });

  it("unschedules back to a draft, and refuses a note that isn't scheduled", async () => {
    const scheduled = await ok(scheduleNote(store, { id: null, expected: null, content: content(), publishAt: "2026-10-04T10:15:00.000Z" }, t0));
    const draft = await ok(unscheduleNote(store, { id: scheduled.id, expected: scheduled.updatedAt }, t1));
    expect(draft).toMatchObject({ status: "draft", publishAt: null });
    expect(await unscheduleNote(store, { id: draft.id, expected: draft.updatedAt }, t2)).toMatchObject({ status: "invalid" });
  });
});

describe("deleteNote", () => {
  it("deletes only from the latest version", async () => {
    const draft = await ok(saveNote(store, { id: null, expected: null, content: content() }, t0));
    expect(await deleteNote(store, { id: draft.id, expected: t1.toISOString() })).toEqual({ status: "conflict" });
    await ok(deleteNote(store, { id: draft.id, expected: draft.updatedAt }));
    expect(await store.get(draft.id)).toBeNull();
  });
});

describe("publishDue", () => {
  it("publishes due notes with TIDs from their scheduled time, once", async () => {
    const at = "2026-10-04T10:15:00.000Z";
    const a = await ok(scheduleNote(store, { id: null, expected: null, content: content({ text: "A" }), publishAt: at }, t0));
    const b = await ok(scheduleNote(store, { id: null, expected: null, content: content({ text: "B" }), publishAt: at }, t0));
    await ok(scheduleNote(store, { id: null, expected: null, content: content({ text: "Later" }), publishAt: "2026-10-04T10:30:00.000Z" }, t0));

    const published = await publishDue(store, new Date("2026-10-04T10:16:00.000Z"));
    expect(published.map((n) => n.text).sort()).toEqual(["A", "B"]);
    for (const note of published) {
      expect(note).toMatchObject({ status: "published", publishedAt: at, publishAt: null });
      expect(tidTime(note.tid!)).toBe(Date.parse(at));
    }
    expect(new Set(published.map((n) => n.tid)).size).toBe(2);
    expect((await store.get(a.id))?.status).toBe("published");
    expect((await store.get(b.id))?.status).toBe("published");
    expect(await publishDue(store, new Date("2026-10-04T10:16:00.000Z"))).toEqual([]);
  });
});
```

`e2e/notes-api.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

// The cron endpoint is closed without the sync secret (unset in this run).
test("publish-due refuses a request without the sync secret", async ({ request }) => {
  const response = await request.post("/api/notes/publish-due/");
  expect(response.status()).toBe(401);
});
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `npx vitest run tests/notes/operations.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write the operations**

`lib/notes/operations.ts`:

```ts
import { publishIssues } from "./rules";
import { scheduleIssue } from "./schedule";
import { noteContentSchema } from "./schema";
import type { NoteFields, NoteStore, NoteWrite } from "./store";
import { randomClockId, tidFromTime } from "./tid";
import { type Note, type NoteContent, type NoteIssue, isPublished } from "./types";

// The admin's note writes (Sprint 9 spec §4.2), independent of Next so they
// can be tested against FileNoteStore. app/admin/notes-actions.ts wraps them
// with the session check, the store and updateTag(NOTES_TAG).

export type NoteOpResult = { status: "ok"; note: Note } | { status: "conflict" } | { status: "missing" } | { status: "invalid"; issues: NoteIssue[] };

// `id` null creates a note; otherwise `expected` is the updatedAt last seen.
export interface NoteInput {
  id: string | null;
  expected: string | null;
  content: unknown;
}

export interface NoteRef {
  id: string;
  expected: string;
}

// A TID can collide only with another note made in the same microsecond;
// a new clock id settles it.
const TID_ATTEMPTS = 3;

function invalid(issues: NoteIssue[]): NoteOpResult {
  return { status: "invalid", issues };
}

function parse(content: unknown): { ok: true; value: NoteContent } | { ok: false; issues: NoteIssue[] } {
  const parsed = noteContentSchema.safeParse(content);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, issues: parsed.error.issues.map((issue) => ({ at: issue.path.join("/"), message: issue.message })) };
}

function fieldsOf(note: Note): NoteFields {
  return {
    text: note.text,
    side: note.side,
    lang: note.lang,
    embed: note.embed,
    status: note.status,
    tid: note.tid,
    publishAt: note.publishAt ? new Date(note.publishAt) : null,
    publishedAt: note.publishedAt ? new Date(note.publishedAt) : null,
  };
}

function fromWrite(write: NoteWrite): NoteOpResult {
  if (write.ok) return { status: "ok", note: write.note };
  return write.reason === "missing" ? { status: "missing" } : { status: "conflict" };
}

// Creates or updates; `expected` must match for an update.
function write(store: NoteStore, current: Note | null, input: { expected: string | null }, fields: NoteFields, now: Date): Promise<NoteWrite> {
  return current ? store.update(current.id, fields, input.expected ?? "", now) : store.create(fields, now);
}

async function loadCurrent(store: NoteStore, id: string | null): Promise<Note | null | "missing"> {
  if (id === null) return null;
  return (await store.get(id)) ?? "missing";
}

export async function saveNote(store: NoteStore, input: NoteInput, now: Date): Promise<NoteOpResult> {
  const parsed = parse(input.content);
  if (!parsed.ok) return invalid(parsed.issues);
  const current = await loadCurrent(store, input.id);
  if (current === "missing") return { status: "missing" };
  if (!current) return fromWrite(await store.create({ ...parsed.value, status: "draft", tid: null, publishAt: null, publishedAt: null }, now));
  // A scheduled or published note is live, or about to be: it must stay publishable.
  if (current.status !== "draft") {
    const issues = publishIssues(parsed.value);
    if (issues.length > 0) return invalid(issues);
  }
  return fromWrite(await write(store, current, input, { ...fieldsOf(current), ...parsed.value }, now));
}

export async function publishNote(store: NoteStore, input: NoteInput, now: Date): Promise<NoteOpResult> {
  const parsed = parse(input.content);
  if (!parsed.ok) return invalid(parsed.issues);
  const issues = publishIssues(parsed.value);
  if (issues.length > 0) return invalid(issues);
  const current = await loadCurrent(store, input.id);
  if (current === "missing") return { status: "missing" };
  for (let attempt = 0; attempt < TID_ATTEMPTS; attempt++) {
    // Published once: the TID and the date never change.
    const fields: NoteFields =
      current && isPublished(current)
        ? { ...fieldsOf(current), ...parsed.value }
        : { ...parsed.value, status: "published", tid: tidFromTime(now.getTime(), 0, randomClockId()), publishAt: null, publishedAt: now };
    const result = await write(store, current, input, fields, now);
    if (!result.ok && result.reason === "duplicate-tid") continue;
    return fromWrite(result);
  }
  return { status: "conflict" };
}

export async function scheduleNote(store: NoteStore, input: NoteInput & { publishAt: string }, now: Date): Promise<NoteOpResult> {
  const parsed = parse(input.content);
  if (!parsed.ok) return invalid(parsed.issues);
  const issues = publishIssues(parsed.value);
  if (issues.length > 0) return invalid(issues);
  const publishAt = new Date(input.publishAt);
  const problem = scheduleIssue(publishAt, now);
  if (problem) return invalid([{ at: "publishAt", message: problem }]);
  const current = await loadCurrent(store, input.id);
  if (current === "missing") return { status: "missing" };
  if (current?.status === "published") return invalid([{ at: "publishAt", message: "A published note can't be scheduled." }]);
  return fromWrite(await write(store, current, input, { ...parsed.value, status: "scheduled", tid: null, publishAt, publishedAt: null }, now));
}

export async function unscheduleNote(store: NoteStore, ref: NoteRef, now: Date): Promise<NoteOpResult> {
  const current = await store.get(ref.id);
  if (!current) return { status: "missing" };
  if (current.status !== "scheduled") return invalid([{ at: "status", message: "Only a scheduled note can be unscheduled." }]);
  return fromWrite(await store.update(ref.id, { ...fieldsOf(current), status: "draft", publishAt: null }, ref.expected, now));
}

export async function deleteNote(store: NoteStore, ref: NoteRef): Promise<NoteOpResult> {
  return fromWrite(await store.remove(ref.id, ref.expected));
}

// The cron's step (spec §5): every scheduled note whose time has come goes
// live with a TID from its scheduled time (notes sharing a time get 1µs
// apart). A note edited or deleted meanwhile is skipped; the next run picks it
// up if it is still due. Running twice publishes nothing new.
export async function publishDue(store: NoteStore, now: Date): Promise<Note[]> {
  const published: Note[] = [];
  const sameTime = new Map<string, number>();
  for (const note of await store.due(now)) {
    if (!note.publishAt) continue;
    const at = new Date(note.publishAt);
    const offset = sameTime.get(note.publishAt) ?? 0;
    sameTime.set(note.publishAt, offset + 1);
    for (let attempt = 0; attempt < TID_ATTEMPTS; attempt++) {
      const fields: NoteFields = { ...fieldsOf(note), status: "published", tid: tidFromTime(at.getTime(), offset, randomClockId()), publishAt: null, publishedAt: at };
      const result = await store.update(note.id, fields, note.updatedAt, now);
      if (result.ok) published.push(result.note);
      if (result.ok || result.reason !== "duplicate-tid") break;
    }
  }
  return published;
}
```

`app/api/notes/publish-due/route.ts`:

```ts
import { revalidateTag } from "next/cache";
import { getNoteStore } from "@/lib/notes/get-store";
import { publishDue } from "@/lib/notes/operations";
import type { NoteStore } from "@/lib/notes/store";
import { NOTES_TAG } from "@/lib/notes/tags";
import { isAuthorized } from "@/lib/sync/auth";

// POST /api/notes/publish-due/: called every 15 minutes by
// .github/workflows/publish-notes.yml (on master) with
// Authorization: Bearer $SYNC_SECRET. Publishes the scheduled notes that are
// due. { expire: 0 } so the warm-up requests right after get the new list,
// not the stale one.
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"), process.env.SYNC_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  let store: NoteStore | null;
  try {
    store = getNoteStore();
  } catch {
    store = null;
  }
  if (!store) return Response.json({ error: "no note store" }, { status: 503 });
  try {
    const published = await publishDue(store, new Date());
    if (published.length > 0) revalidateTag(NOTES_TAG, { expire: 0 });
    return Response.json({ published: published.length });
  } catch (e) {
    console.warn("[notes] publish-due failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "publishing failed" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run the tests and the build**

Run: `npx vitest run tests/notes && npm run typecheck && npm run lint && npm run build && npx playwright test e2e/notes-api.spec.ts`
Expected: PASS. The build lists `/api/notes/publish-due` as a dynamic (ƒ) route. Then run a plain `npm run build`.

- [ ] **Step 5: Commit**

```bash
git add lib/notes/operations.ts app/api/notes tests/notes/operations.test.ts e2e/notes-api.spec.ts
git commit -m "Add note operations and the publish-due endpoint for scheduled notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Reads, list views, fixtures and note metadata

**Files:**
- Create: `lib/notes/read.ts`, `lib/notes/views.ts`, `lib/notes/fixtures.ts`, `lib/notes/metadata.ts`
- Modify: `lib/format.ts`
- Test: `tests/notes/views.test.ts`, `tests/notes/read.test.ts`, `tests/notes/fixtures.test.ts`, `tests/notes/metadata.test.ts`, `tests/format.test.ts`

**Interfaces:**
- Consumes: `PublishedNote`, `publishIssues`, `tidFromTime`, `TID_PATTERN`, `truncateGraphemes`, `NOTES_TAG` (Task 1); `getNoteStore` (Task 2); `findImage` (`lib/images/manifest.ts`); `renditionUrl` (`lib/images/plan.ts`); `pageMetadata` (`lib/metadata.ts`).
- Produces:
  - `read.ts`: `getPublishedNotes(): Promise<PublishedNote[]>`.
  - `views.ts`:
    - `NotesSide` (`"work" | "life"`), `NOTES_PAGE_SIZE` (30), `PLACEHOLDER_TID`;
    - `onSide`, `notesBase`, `notePathOn`, `canonicalPath`, `pagePath`, `pageCount`, `pageOf`, `parsePage`, `NotesPage`;
    - `noteYear`, `groupByYear`, `adjacentNotes`, `noteTitle`, `frameRatio`.
  - `fixtures.ts`: `fixtureNotes(): PublishedNote[]`.
  - `metadata.ts`: `noteMetadata(note): Metadata`.
  - `format.ts`: `formatMonthDay(iso)` → `"Oct 4"`, `formatNoteStamp(iso)` → `"Oct 3, 2026 · 14:15"`.

- [ ] **Step 1: Write the failing tests**

`tests/notes/views.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { tidFromTime } from "@/lib/notes/tid";
import type { NoteSide, PublishedNote } from "@/lib/notes/types";
import {
  NOTES_PAGE_SIZE,
  adjacentNotes,
  canonicalPath,
  frameRatio,
  groupByYear,
  noteTitle,
  notePathOn,
  onSide,
  pageCount,
  pageOf,
  pagePath,
  parsePage,
} from "@/lib/notes/views";

function note(at: string, side: NoteSide = "work", text = "Note."): PublishedNote {
  return {
    id: at,
    tid: tidFromTime(Date.parse(at)),
    text,
    side,
    lang: "en",
    embed: null,
    status: "published",
    publishAt: null,
    publishedAt: at,
    createdAt: at,
    updatedAt: at,
  };
}

describe("sides and paths", () => {
  const work = note("2026-10-04T10:00:00.000Z", "work");
  const life = note("2026-10-03T10:00:00.000Z", "life");
  const both = note("2026-10-02T10:00:00.000Z", "both");

  it("puts both-side notes on each side", () => {
    expect(onSide([work, life, both], "work")).toEqual([work, both]);
    expect(onSide([work, life, both], "life")).toEqual([life, both]);
  });

  it("links on the side you are on, with a canonical side per note", () => {
    expect(notePathOn(both, "life")).toBe(`/life/notes/${both.tid}/`);
    expect(canonicalPath(both)).toBe(`/notes/${both.tid}/`);
    expect(canonicalPath(life)).toBe(`/life/notes/${life.tid}/`);
    expect(pagePath("work", 1)).toBe("/notes/");
    expect(pagePath("life", 3)).toBe("/life/notes/page/3/");
  });
});

describe("pages", () => {
  const many = Array.from({ length: NOTES_PAGE_SIZE + 3 }, (_, i) => note(new Date(Date.UTC(2026, 0, 31 - i)).toISOString()));

  it("splits into pages of 30 and refuses out-of-range pages", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(many.length)).toBe(2);
    expect(pageOf(many, 1)?.items).toHaveLength(30);
    expect(pageOf(many, 2)).toMatchObject({ page: 2, pages: 2 });
    expect(pageOf(many, 2)?.items).toHaveLength(3);
    expect(pageOf(many, 3)).toBeNull();
    expect(pageOf([], 1)).toEqual({ items: [], page: 1, pages: 1 });
  });

  it("parses only positive integers", () => {
    expect(parsePage("2")).toBe(2);
    expect(parsePage("02")).toBeNull();
    expect(parsePage("0")).toBeNull();
    expect(parsePage("x")).toBeNull();
  });
});

describe("years, neighbours, titles and frames", () => {
  it("groups by the Istanbul year, newest first", () => {
    // 22:30 UTC on Dec 31 is already Jan 1 in Istanbul.
    const notes = [note("2026-02-01T10:00:00.000Z"), note("2025-12-31T22:30:00.000Z"), note("2025-06-01T10:00:00.000Z")];
    expect(groupByYear(notes).map((g) => [g.year, g.notes.length])).toEqual([
      ["2026", 2],
      ["2025", 1],
    ]);
  });

  it("finds the newer and older neighbour", () => {
    const [a, b, c] = [note("2026-03-01T00:00:00.000Z"), note("2026-02-01T00:00:00.000Z"), note("2026-01-01T00:00:00.000Z")];
    expect(adjacentNotes([a, b, c], b.tid)).toEqual({ newer: a, older: c });
    expect(adjacentNotes([a, b, c], a.tid)).toEqual({ newer: null, older: b });
  });

  it("titles a note by its first 60 graphemes, or 'Note'", () => {
    expect(noteTitle(note("2026-01-01T00:00:00.000Z", "work", "Short\nnote."))).toBe("Short note.");
    expect(noteTitle(note("2026-01-01T00:00:00.000Z", "work", "x".repeat(80)))).toBe(`${"x".repeat(60)}…`);
    expect(noteTitle(note("2026-01-01T00:00:00.000Z", "work", ""))).toBe("Note");
  });

  it("clamps list frames between 4:5 and 2:1", () => {
    expect(frameRatio(1600, 1000)).toBe(1.6);
    expect(frameRatio(1000, 3000)).toBe(0.8);
    expect(frameRatio(3000, 1000)).toBe(2);
  });
});
```

`tests/notes/read.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), getNoteStore: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: mocks.cacheLife, cacheTag: mocks.cacheTag }));
vi.mock("@/lib/notes/get-store", () => ({ getNoteStore: mocks.getNoteStore }));

import { getPublishedNotes } from "@/lib/notes/read";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getPublishedNotes", () => {
  it("tags the read and returns the store's published notes for days", async () => {
    mocks.getNoteStore.mockReturnValue({ listPublished: async () => ["n"] });
    expect(await getPublishedNotes()).toEqual(["n"]);
    expect(mocks.cacheTag).toHaveBeenCalledWith("notes");
    expect(mocks.cacheLife).toHaveBeenCalledWith("days");
  });

  it("returns nothing without a store", async () => {
    mocks.getNoteStore.mockReturnValue(null);
    expect(await getPublishedNotes()).toEqual([]);
    expect(mocks.cacheLife).toHaveBeenCalledWith("hours");
  });

  it("fails soft for minutes on a store error", async () => {
    mocks.getNoteStore.mockReturnValue({ listPublished: async () => Promise.reject(new Error("down")) });
    expect(await getPublishedNotes()).toEqual([]);
    expect(mocks.cacheLife).toHaveBeenCalledWith("minutes");
  });

  it("serves the fixture notes in fixture mode", async () => {
    vi.stubEnv("SOURCE_FIXTURES", "1");
    const notes = await getPublishedNotes();
    expect(notes.length).toBeGreaterThan(30);
    expect(mocks.getNoteStore).not.toHaveBeenCalled();
  });
});
```

`tests/notes/fixtures.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fixtureNotes } from "@/lib/notes/fixtures";
import { publishIssues } from "@/lib/notes/rules";
import { TID_PATTERN } from "@/lib/notes/tid";
import { groupByYear, onSide } from "@/lib/notes/views";

describe("fixtureNotes", () => {
  const notes = fixtureNotes();

  it("are valid published notes with unique TIDs, newest first", () => {
    for (const note of notes) {
      expect(publishIssues(note)).toEqual([]);
      expect(note.tid).toMatch(TID_PATTERN);
    }
    expect(new Set(notes.map((n) => n.tid)).size).toBe(notes.length);
    const dates = notes.map((n) => n.publishedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("cover two Work pages, two years, both sides, images, a link card and Turkish", () => {
    const work = onSide(notes, "work");
    expect(work.length).toBeGreaterThan(30);
    expect(groupByYear(work).map((g) => g.year)).toEqual(["2026", "2025"]);
    expect(onSide(notes, "life").length).toBeGreaterThanOrEqual(3);
    expect(notes.some((n) => n.embed?.kind === "images" && n.embed.images.length === 2)).toBe(true);
    expect(notes.some((n) => n.embed?.kind === "link")).toBe(true);
    expect(notes.some((n) => n.lang === "tr")).toBe(true);
  });
});
```

`tests/notes/metadata.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { noteMetadata } from "@/lib/notes/metadata";
import type { PublishedNote } from "@/lib/notes/types";

const base: PublishedNote = {
  id: "a",
  tid: "3m2k7xq4ab2c2",
  text: "Notes editor, first pass.",
  side: "both",
  lang: "en",
  embed: null,
  status: "published",
  publishAt: null,
  publishedAt: "2026-10-03T11:15:00.000Z",
  createdAt: "2026-10-03T11:15:00.000Z",
  updatedAt: "2026-10-03T11:15:00.000Z",
};

describe("noteMetadata", () => {
  it("titles the page by the note and points the canonical URL at its side", () => {
    const meta = noteMetadata(base);
    expect(meta.title).toBe("Notes editor, first pass. · Notes");
    expect(meta.description).toBe("Notes editor, first pass.");
    expect(meta.alternates).toEqual({ canonical: "/notes/3m2k7xq4ab2c2/" });
    expect(meta.twitter).toMatchObject({ card: "summary" });
    expect(meta.openGraph).not.toHaveProperty("images");
  });

  it("uses the first image's largest JPEG as a large card", () => {
    const meta = noteMetadata({
      ...base,
      side: "life",
      embed: { kind: "images", images: [{ key: "media/notes/abc", alt: "The editor", width: 2560, height: 1600, widths: [640, 1280, 2560], baseUrl: "https://x.public.blob.vercel-storage.com/media/notes/abc" }] },
    });
    expect(meta.alternates).toEqual({ canonical: "/life/notes/3m2k7xq4ab2c2/" });
    expect(meta.openGraph).toMatchObject({ images: [{ url: "https://x.public.blob.vercel-storage.com/media/notes/abc-2560.jpg", width: 2560, height: 1600, alt: "The editor" }] });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });
});
```

Add to `tests/format.test.ts` (inside a new `describe`; keep the existing tests):

```ts
import { formatMonthDay, formatNoteStamp } from "@/lib/format";

describe("note dates", () => {
  it("formats in Istanbul time", () => {
    expect(formatMonthDay("2026-10-04T11:00:00.000Z")).toBe("Oct 4");
    expect(formatMonthDay("2026-10-04T22:30:00.000Z")).toBe("Oct 5");
    expect(formatNoteStamp("2026-10-03T11:15:00.000Z")).toBe("Oct 3, 2026 · 14:15");
  });
});
```

(If `tests/format.test.ts` imports from `@/lib/format` already, merge the names into that import instead of adding a second one.)

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `npx vitest run tests/notes tests/format.test.ts`
Expected: FAIL (modules and exports missing).

- [ ] **Step 3: Write the formats, views, fixtures, read and metadata**

Add to `lib/format.ts` (after `formatDateTime`):

```ts
const monthDayFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "Europe/Istanbul" });

// "Oct 4": a note's date under its year label (/notes/).
export function formatMonthDay(iso: string): string {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? "" : monthDayFormat.format(time);
}

// "Oct 3, 2026 · 14:15": a note's own page.
export function formatNoteStamp(iso: string): string {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? "" : `${dateFormat.format(time)} · ${formatClock(time, "Europe/Istanbul")}`;
}
```

(`formatClock` is defined further down in the same file; function declarations are hoisted, so the order is fine.)

`lib/notes/views.ts`:

```ts
import { truncateGraphemes } from "./graphemes";
import type { PublishedNote } from "./types";

// Pure views over the published list (getPublishedNotes): which side a note
// shows on, paths, pages, year groups and neighbours. Tests and pages share
// them.

export type NotesSide = "work" | "life";

export const NOTES_PAGE_SIZE = 30;

// generateStaticParams must return one param under cacheComponents; this TID
// (time zero) is never a real note's, so its page is a 404.
export const PLACEHOLDER_TID = "2222222222222";

export function onSide(notes: PublishedNote[], side: NotesSide): PublishedNote[] {
  return notes.filter((note) => note.side === side || note.side === "both");
}

export function notesBase(side: NotesSide): string {
  return side === "work" ? "/notes/" : "/life/notes/";
}

// The note's page on the side being browsed (Life links stay on Life).
export function notePathOn(note: PublishedNote, side: NotesSide): string {
  return `${notesBase(side)}${note.tid}/`;
}

// A both-side note's canonical page is the Work one.
export function canonicalPath(note: PublishedNote): string {
  return notePathOn(note, note.side === "life" ? "life" : "work");
}

export function pagePath(side: NotesSide, page: number): string {
  return page === 1 ? notesBase(side) : `${notesBase(side)}page/${page}/`;
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / NOTES_PAGE_SIZE));
}

export interface NotesPage {
  items: PublishedNote[];
  page: number;
  pages: number;
}

export function pageOf(notes: PublishedNote[], page: number): NotesPage | null {
  const pages = pageCount(notes.length);
  if (!Number.isInteger(page) || page < 1 || page > pages) return null;
  return { items: notes.slice((page - 1) * NOTES_PAGE_SIZE, page * NOTES_PAGE_SIZE), page, pages };
}

// "2" → 2; "02", "0", "x" → null (one URL per page).
export function parsePage(param: string): number | null {
  return /^[1-9]\d*$/.test(param) ? Number(param) : null;
}

const yearFormat = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Istanbul" });

export function noteYear(iso: string): string {
  return yearFormat.format(new Date(iso));
}

// Consecutive runs by Istanbul year; the list is newest first, so are the groups.
export function groupByYear(notes: PublishedNote[]): { year: string; notes: PublishedNote[] }[] {
  const groups: { year: string; notes: PublishedNote[] }[] = [];
  for (const note of notes) {
    const year = noteYear(note.publishedAt);
    const last = groups.at(-1);
    if (last && last.year === year) last.notes.push(note);
    else groups.push({ year, notes: [note] });
  }
  return groups;
}

export function adjacentNotes(notes: PublishedNote[], tid: string): { newer: PublishedNote | null; older: PublishedNote | null } {
  const index = notes.findIndex((note) => note.tid === tid);
  if (index === -1) return { newer: null, older: null };
  return { newer: notes[index - 1] ?? null, older: notes[index + 1] ?? null };
}

// The page title and the neighbour links: the first 60 graphemes on one line.
export function noteTitle(note: Pick<PublishedNote, "text">): string {
  const line = note.text.replace(/\s+/g, " ").trim();
  return line ? truncateGraphemes(line, 60) : "Note";
}

// List frames keep the image's ratio between 4:5 (portrait) and 2:1.
export function frameRatio(width: number, height: number): number {
  return Math.min(2, Math.max(0.8, width / height));
}
```

`lib/notes/fixtures.ts`:

```ts
import { findImage } from "@/lib/images/manifest";
import { tidFromTime } from "./tid";
import type { NoteImage, NoteLang, NoteSide, NoteEmbed, PublishedNote } from "./types";

// Fixture mode (SOURCE_FIXTURES=1): a fixed set of published notes so the
// Notes pages can be built and tested without a database. Two Work pages
// (33 Work-side notes), 2026 and 2025, both sides, images, a link card and a
// Turkish note. Dev and CI only.

function image(key: string, alt: string): NoteImage {
  const entry = findImage(key);
  if (!entry) throw new Error(`fixture image ${key} is not in the manifest`);
  return { key, alt, width: entry.width, height: entry.height, widths: entry.widths };
}

function note(n: number, at: string, side: NoteSide, text: string, embed: NoteEmbed = null, lang: NoteLang = "en"): PublishedNote {
  const publishedAt = new Date(at).toISOString();
  return {
    id: `fixture-${n}`,
    tid: tidFromTime(Date.parse(at), 0, n),
    text,
    side,
    lang,
    embed,
    status: "published",
    publishAt: null,
    publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  };
}

export function fixtureNotes(): PublishedNote[] {
  const notes: PublishedNote[] = [
    note(1, "2026-10-04T11:00:00.000Z", "work", "Shipped /resume.pdf. It's rendered on the server from the same data as the page, so the paper copy can't drift from the site."),
    note(2, "2026-10-03T11:15:00.000Z", "both", "Notes editor, first pass. The counter counts graphemes, not characters: 👍🏽 is one.", {
      kind: "images",
      images: [image("photos/kizilcikli", "A fixture photo"), image("photos/bold-vakif-building", "Another fixture photo")],
    }),
    note(3, "2026-10-02T16:30:00.000Z", "life", "Yui found the one sunny square on the balcony again.", { kind: "images", images: [image("photos/kizilcikli", "A fixture photo")] }),
    note(4, "2026-09-30T08:00:00.000Z", "work", "Good walkthrough of publishing a personal site to the AT Protocol, via @w00f.org #atproto", {
      kind: "link",
      url: "https://stevedylan.dev/posts/using-atproto-for-posse/",
      title: "ATProto, POSSE, and Personal Sites",
      description: "",
      siteName: "stevedylan.dev",
    }),
    note(5, "2026-09-20T09:00:00.000Z", "life", "Bugün Ankara'da ilk yağmur.", null, "tr"),
  ];
  // 30 short Work notes, one per day back from Dec 20, 2025.
  for (let i = 0; i < 30; i++) {
    notes.push(note(6 + i, new Date(Date.UTC(2025, 11, 20 - i, 9)).toISOString(), "work", `Fixture note ${i + 1}.`));
  }
  return notes;
}
```

`lib/notes/read.ts`:

```ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fixtureNotes } from "./fixtures";
import { getNoteStore } from "./get-store";
import type { NoteStore } from "./store";
import { NOTES_TAG } from "./tags";
import type { PublishedNote } from "./types";

// The one public read of notes: every published note, newest first, cached
// and tagged so pages stay prerendered until an admin write or the cron
// revalidates NOTES_TAG. Never throws: no store or a store error renders no
// notes (an error is cached for minutes only, since it is probably transient).
export async function getPublishedNotes(): Promise<PublishedNote[]> {
  "use cache";
  cacheTag(NOTES_TAG);

  if (process.env.SOURCE_FIXTURES === "1") {
    cacheLife("hours");
    return fixtureNotes();
  }
  let store: NoteStore | null;
  try {
    store = getNoteStore();
  } catch (e) {
    console.warn("[notes] no store:", e instanceof Error ? e.message : e);
    store = null;
  }
  if (!store) {
    cacheLife("hours");
    return [];
  }
  try {
    const notes = await store.listPublished();
    cacheLife("days");
    return notes;
  } catch (e) {
    console.warn("[notes] reading notes failed:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return [];
  }
}
```

`lib/notes/metadata.ts`:

```ts
import type { Metadata } from "next";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import type { PublishedNote } from "./types";
import { canonicalPath, noteTitle } from "./views";

// A note page's metadata (spec §3.4): titled by its text, canonical on its
// side, and a large card with the first image's largest JPEG when it has
// images (social crawlers don't reliably render AVIF).
export function noteMetadata(note: PublishedNote): Metadata {
  const title = `${noteTitle(note)} · Notes`;
  const description = note.text.trim() || noteTitle(note);
  const alternates = { canonical: canonicalPath(note) };
  const first = note.embed?.kind === "images" ? note.embed.images[0] : undefined;
  if (!first) {
    return pageMetadata(title, { description, alternates, openGraph: { type: "article", description } });
  }
  const ogImage = { url: renditionUrl(first.key, first.width, "jpg", first.baseUrl), width: first.width, height: first.height, alt: first.alt };
  return pageMetadata(title, {
    description,
    alternates,
    openGraph: { type: "article", description, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  });
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run tests/notes tests/format.test.ts && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/notes lib/format.ts tests/notes tests/format.test.ts
git commit -m "Read published notes through one cached list, with list views, fixtures and page metadata

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: The note component, the home row and the `/notes/` pages

**Files:**
- Create:
  - `components/notes/note-text.tsx`, `components/notes/note-images.tsx`, `components/notes/link-card.tsx`, `components/notes/note-item.tsx`, `components/notes/note-list.tsx`, `components/notes/notes-index.tsx`, `components/notes/note-page.tsx`
  - `app/(work)/notes/page.tsx`, `app/(work)/notes/page/[n]/page.tsx`, `app/(work)/notes/[tid]/page.tsx`
  - `e2e/notes.spec.ts`, `e2e-fixtures/notes.spec.ts`
- Modify: `components/home/home-site.tsx`, `app/(work)/page.tsx`, `lib/nav.ts`, `tests/nav.test.ts`

**Interfaces:**
- Consumes: `noteSegments` (Task 1); `getPublishedNotes`, `onSide`, `notesBase`, `notePathOn`, `pageOf`, `pagePath`, `pageCount`, `parsePage`, `groupByYear`, `adjacentNotes`, `noteTitle`, `frameRatio`, `PLACEHOLDER_TID`, `noteMetadata`, `fixtureNotes`, `formatMonthDay`, `formatNoteStamp` (Task 4); `PictureView`, `SectionRow`, `DitherRule`, `ItemLink`, `Empty`, `hostname` (`lib/sources/http.ts`), `formatDate`.
- Produces (Task 6 reuses them):
  - `NoteList({ notes, side, dates })`, where `dates` is `"full"` (`Oct 4, 2026`) or `"month-day"` (`Oct 4`);
  - `NotesIndex({ side, page })` and `NotePage({ side, tid })`, async server components that call `notFound()`;
  - `HomeSite` gains an optional `notes?: PublishedNote[]` prop.

Dates: lists outside `/notes/` show the full date, because a prerendered page can't know "this year". Under a year label they show `Oct 4`. This differs from the spec's "Oct 4 in the current year"; record it in the Errata in Task 12.

- [ ] **Step 1: Write the failing e2e tests**

`e2e/notes.spec.ts` (a plain build, no database, no notes):

```ts
import { expect, test } from "@playwright/test";

test("with no notes the home has no Notes row and /notes/ says so", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#notes")).toHaveCount(0);
  await page.goto("/notes/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Notes What I'm making, in short.");
  await expect(page.getByText("No notes yet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/feed.xml");
});

test("unknown note pages and pages past the last are 404s", async ({ page }) => {
  expect((await page.goto("/notes/2222222222222/"))?.status()).toBe(404);
  expect((await page.goto("/notes/page/2/"))?.status()).toBe(404);
  expect((await page.goto("/notes/page/1/"))?.status()).toBe(404);
});
```

`e2e-fixtures/notes.spec.ts` (a `SOURCE_FIXTURES=1` build; `fixtureNotes()` is the data):

```ts
import { expect, test } from "@playwright/test";
import { fixtureNotes } from "../lib/notes/fixtures";
import { onSide } from "../lib/notes/views";

const notes = fixtureNotes();
const work = onSide(notes, "work");
const byId = (n: number) => notes.find((note) => note.id === `fixture-${n}`)!;

test("the home Notes row shows the latest three Work notes, between Selected work and Experience", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main > section").evaluateAll((sections) => sections.map((s) => s.id));
  expect(ids.indexOf("notes")).toBe(ids.indexOf("selected-work") + 1);
  expect(ids.indexOf("experience")).toBe(ids.indexOf("notes") + 1);
  const row = page.locator("#notes");
  await expect(row.getByRole("heading", { name: "Notes", exact: true })).toBeVisible();
  await expect(row.locator("article")).toHaveCount(3);
  await expect(row.locator("article").first()).toContainText("Shipped /resume.pdf.");
  await expect(row.locator("article").nth(1)).toContainText("Notes editor, first pass.");
  await expect(row.locator("article").nth(1).locator("img")).toHaveCount(2);
  await expect(row.locator("article").nth(1)).toContainText("Oct 3, 2026");
  await row.getByRole("link", { name: "All notes" }).click();
  await expect(page).toHaveURL(/\/notes\/$/);
});

test("/notes/ runs by year and pages after 30", async ({ page }) => {
  await page.goto("/notes/");
  await expect(page.getByRole("heading", { name: "2026", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2025", exact: true })).toBeVisible();
  await expect(page.locator("main article")).toHaveCount(30);
  await expect(page.locator("main article").first()).toContainText("Oct 4");
  await page.getByRole("link", { name: "Older notes →" }).click();
  await expect(page).toHaveURL(/\/notes\/page\/2\/$/);
  await expect(page.locator("main article")).toHaveCount(work.length - 30);
  await expect(page.getByRole("link", { name: "← Newer notes" })).toHaveAttribute("href", "/notes/");
});

test("a note page shows the note in full, with its neighbours and metadata", async ({ page }) => {
  const note = byId(2);
  await page.goto(`/notes/${note.tid}/`);
  await expect(page.locator("main article")).toContainText("Notes editor, first pass.");
  await expect(page.locator("main article img")).toHaveCount(2);
  await expect(page.locator("main article img").first()).toHaveAttribute("alt", "A fixture photo");
  await expect(page.locator("main article")).toContainText("Oct 3, 2026 · 14:15");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://onursenture.com/notes/${note.tid}/`);
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /\.jpg$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.getByRole("link", { name: /^← Shipped \/resume\.pdf/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Good walkthrough.*→$/ })).toBeVisible();
});

test("links, mentions and tags follow Bluesky's rules; a link card links out", async ({ page }) => {
  await page.goto(`/notes/${byId(4).tid}/`);
  const article = page.locator("main article");
  await expect(article.getByRole("link", { name: "@w00f.org" })).toHaveAttribute("href", "https://bsky.app/profile/w00f.org");
  await expect(article.getByRole("link", { name: "#atproto" })).toHaveCount(0);
  await expect(article.getByRole("link", { name: /ATProto, POSSE, and Personal Sites/ })).toHaveAttribute("href", "https://stevedylan.dev/posts/using-atproto-for-posse/");
});

test("a Life-only note has no Work page", async ({ page }) => {
  expect((await page.goto(`/notes/${byId(3).tid}/`))?.status()).toBe(404);
});
```

- [ ] **Step 2: Build and make sure they fail**

Run: `npm run build && npx playwright test e2e/notes.spec.ts; SOURCE_FIXTURES=1 npm run build && npx playwright test --config playwright.fixtures.config.ts e2e-fixtures/notes.spec.ts`
Expected: FAIL (`/notes/` is a 404, and there is no `#notes`).

- [ ] **Step 3: Write the note components**

`components/notes/note-text.tsx`:

```tsx
import { type CSSProperties, Fragment } from "react";
import { cx } from "@/lib/cx";
import { noteSegments } from "@/lib/notes/facets";

const LINK = "underline decoration-line underline-offset-[0.2em] hover:decoration-fg";

// A note's text with Bluesky's facets: links and dotted @handles link out
// (handles to their Bluesky profile), #tags are muted text (no tag pages).
// Line breaks are kept. Server only (facets.ts).
export function NoteText({ text, className, style }: { text: string; className?: string; style?: CSSProperties }) {
  if (text.trim() === "") return null;
  return (
    <p className={cx("break-words whitespace-pre-line", className)} style={style}>
      {noteSegments(text).map((segment, index) => {
        if (segment.kind === "link") {
          return (
            <a key={index} href={segment.href} rel="noopener noreferrer" className={LINK}>
              {segment.text}
            </a>
          );
        }
        if (segment.kind === "mention") {
          return (
            <a key={index} href={`https://bsky.app/profile/${segment.handle}`} rel="noopener noreferrer" className={LINK}>
              {segment.text}
            </a>
          );
        }
        if (segment.kind === "tag") {
          return (
            <span key={index} className="text-fg-muted">
              {segment.text}
            </span>
          );
        }
        return <Fragment key={index}>{segment.text}</Fragment>;
      })}
    </p>
  );
}
```

`components/notes/note-images.tsx`:

```tsx
import { PictureView } from "@/components/picture-view";
import { cx } from "@/lib/cx";
import type { NoteImage } from "@/lib/notes/types";
import { frameRatio } from "@/lib/notes/views";

// One image spans the column; two to four sit two across. In lists each frame
// keeps the image's ratio clamped to 4:5–2:1 and crops to fill; `full` (the
// note's page) shows every image whole at its own ratio.
export function NoteImages({ images, full = false }: { images: NoteImage[]; full?: boolean }) {
  const single = images.length === 1;
  const sizes = single ? "(min-width: 1024px) 480px, calc(100vw - 32px)" : "(min-width: 1024px) 240px, calc(50vw - 20px)";
  return (
    <div className={cx("grid gap-1", !single && "grid-cols-2")}>
      {images.map((image, index) => (
        <div
          key={`${index}-${image.key}`}
          className="overflow-hidden border"
          style={full ? undefined : { aspectRatio: String(frameRatio(image.width, image.height)) }}
        >
          <PictureView image={image.key} entry={image} alt={image.alt} sizes={sizes} className={full ? "block h-auto w-full" : "block h-full w-full object-cover"} />
        </div>
      ))}
    </div>
  );
}
```

`components/notes/link-card.tsx`:

```tsx
import type { NoteLinkCard } from "@/lib/notes/types";
import { hostname } from "@/lib/sources/http";

// A note's link card: a hairline box, the title (else the URL), then the site
// name (else the host) and ↗. The whole card is the link.
export function LinkCard({ card }: { card: NoteLinkCard }) {
  return (
    <a href={card.url} rel="noopener noreferrer" className="block border px-3 py-2 hover:border-fg">
      <span className="block type-body text-fg">{card.title || card.url}</span>
      <span className="block type-meta text-fg-muted">
        {card.siteName || hostname(card.url)}
        <span aria-hidden="true">{" ↗"}</span>
      </span>
    </a>
  );
}
```

`components/notes/note-item.tsx`:

```tsx
import Link from "next/link";
import type { PublishedNote } from "@/lib/notes/types";
import { LinkCard } from "./link-card";
import { NoteImages } from "./note-images";
import { NoteText } from "./note-text";

// One note in a list (mockup A, "stream"): the text, its attachment, then the
// muted date linking to the note's page.
export function NoteItem({ note, href, date }: { note: PublishedNote; href: string; date: string }) {
  const embed = note.embed;
  return (
    <article lang={note.lang === "tr" ? "tr" : undefined} className="flex flex-col gap-2 type-body">
      <NoteText text={note.text} />
      {embed?.kind === "images" && embed.images.length > 0 ? <NoteImages images={embed.images} /> : null}
      {embed?.kind === "link" ? <LinkCard card={embed} /> : null}
      <p className="type-meta">
        <Link href={href} className="text-fg-muted hover:underline hover:underline-offset-[0.2em]">
          <time dateTime={note.publishedAt}>{date}</time>
        </Link>
      </p>
    </article>
  );
}
```

`components/notes/note-list.tsx`:

```tsx
import { formatDate, formatMonthDay } from "@/lib/format";
import type { PublishedNote } from "@/lib/notes/types";
import { type NotesSide, notePathOn } from "@/lib/notes/views";
import { NoteItem } from "./note-item";

// Notes separated by hairlines. Links stay on the side being browsed.
// "month-day" only under a year label (/notes/); elsewhere the full date.
export function NoteList({ notes, side, dates }: { notes: PublishedNote[]; side: NotesSide; dates: "full" | "month-day" }) {
  return (
    <ul className="flex flex-col">
      {notes.map((note) => (
        <li key={note.tid} className="border-t py-4 first:border-t-0 first:pt-0 last:pb-0">
          <NoteItem note={note} href={notePathOn(note, side)} date={dates === "full" ? formatDate(note.publishedAt) : formatMonthDay(note.publishedAt)} />
        </li>
      ))}
    </ul>
  );
}
```

`components/notes/notes-index.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Empty } from "@/components/sections/empty";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { getPublishedNotes } from "@/lib/notes/read";
import { type NotesSide, groupByYear, onSide, pageOf, pagePath } from "@/lib/notes/views";
import { NoteList } from "./note-list";

// Draft copy (spec §3.3, §3.5): Onur approves it in the follow-ups.
const HEADER = {
  work: { href: "/", back: "← Home", line: "What I'm making, in short." },
  life: { href: "/life/", back: "← Life", line: "Off the clock." },
} as const;

// /notes/ and /life/notes/ (mockup A): a header row, then one row per year
// (the year in Doto in the label column), 30 notes per page, the pager in the
// last row's action column.
export async function NotesIndex({ side, page }: { side: NotesSide; page: number }) {
  const slice = pageOf(onSide(await getPublishedNotes(), side), page);
  if (!slice) notFound();
  const header = HEADER[side];
  const groups = groupByYear(slice.items);
  const pager =
    slice.pages > 1 ? (
      <span className="flex flex-wrap gap-x-4 gap-y-1 lg:justify-end">
        {slice.page > 1 ? <ItemLink href={pagePath(side, slice.page - 1)}>← Newer notes</ItemLink> : null}
        {slice.page < slice.pages ? <ItemLink href={pagePath(side, slice.page + 1)}>Older notes →</ItemLink> : null}
      </span>
    ) : undefined;

  const rows = [
    <SectionRow
      key="header"
      labelAs="div"
      label={
        <ItemLink href={header.href} className="text-fg-muted">
          {header.back}
        </ItemLink>
      }
      // A plain <a>: the feed is XML, not a page next/link can navigate to.
      action={
        <a href="/feed.xml" className="hover:underline hover:underline-offset-[0.2em]">
          RSS
        </a>
      }
    >
      <h1 className="type-lead">
        Notes <span className="text-fg-muted">{header.line}</span>
      </h1>
    </SectionRow>,
    ...(groups.length === 0
      ? [
          <SectionRow key="empty" label={null}>
            <Empty>No notes yet.</Empty>
          </SectionRow>,
        ]
      : groups.map((group, index) => (
          <SectionRow
            key={group.year}
            id={`year-${group.year}`}
            label={<span className="type-name">{group.year}</span>}
            action={index === groups.length - 1 ? pager : undefined}
          >
            <NoteList notes={group.notes} side={side} dates="month-day" />
          </SectionRow>
        ))),
  ];

  return (
    <main className="pb-8">
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          {row}
        </Fragment>
      ))}
    </main>
  );
}
```

`components/notes/note-page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { formatDate, formatNoteStamp } from "@/lib/format";
import { getPublishedNotes } from "@/lib/notes/read";
import { type NotesSide, adjacentNotes, notePathOn, notesBase, noteTitle, onSide } from "@/lib/notes/views";
import { LinkCard } from "./link-card";
import { NoteImages } from "./note-images";
import { NoteText } from "./note-text";

// A note's own page (spec §3.4): the text at the lead size (regular weight,
// like the mockup), images whole, the date and time, then the newer and older
// note on the same side. A note that isn't on this side is a 404.
export async function NotePage({ side, tid }: { side: NotesSide; tid: string }) {
  const notes = onSide(await getPublishedNotes(), side);
  const note = notes.find((item) => item.tid === tid);
  if (!note) notFound();
  const { newer, older } = adjacentNotes(notes, tid);
  const embed = note.embed;
  return (
    <main className="pb-8">
      <SectionRow
        labelAs="div"
        label={
          <ItemLink href={notesBase(side)} className="text-fg-muted">
            ← Notes
          </ItemLink>
        }
      >
        <article lang={note.lang === "tr" ? "tr" : undefined} className="flex flex-col gap-3">
          <h1 className="sr-only">Note from {formatDate(note.publishedAt)}</h1>
          <NoteText text={note.text} className="type-lead" style={{ fontWeight: 400 }} />
          {embed?.kind === "images" && embed.images.length > 0 ? <NoteImages images={embed.images} full /> : null}
          {embed?.kind === "link" ? <LinkCard card={embed} /> : null}
          <p className="type-meta text-fg-muted">
            <time dateTime={note.publishedAt}>{formatNoteStamp(note.publishedAt)}</time>
          </p>
        </article>
      </SectionRow>
      {newer || older ? (
        <>
          <DitherRule className="mx-4 md:mx-10" />
          <SectionRow label="More">
            <div className="flex flex-col gap-2 type-body sm:flex-row sm:justify-between sm:gap-6">
              {newer ? <ItemLink href={notePathOn(newer, side)}>← {noteTitle(newer)}</ItemLink> : <span />}
              {older ? (
                <ItemLink href={notePathOn(older, side)} className="sm:text-right">
                  {noteTitle(older)} →
                </ItemLink>
              ) : null}
            </div>
          </SectionRow>
        </>
      ) : null}
    </main>
  );
}
```

- [ ] **Step 4: Wire the home row, the nav and the routes**

`lib/nav.ts`: append `{ label: "Notes", href: "/notes/", ready: true, inHeader: false }` after Resume, and add "Notes shipped in Sprint 9 (the home's Notes row links it)" to the comment above the list. Update `tests/nav.test.ts` to match:
- the labels become `["Lab", "Resume", "Notes"]`;
- the ready items become `["Resume", "Notes"]`;
- `headerItems()` stays `[]`.

`components/home/home-site.tsx`:
- Import `NoteList` and the `PublishedNote` type.
- Change the signature to `export function HomeSite({ content, notes = [] }: { content: HomeContent; notes?: PublishedNote[] })`.
- Insert this row between the `pins` row and the Experience row:

```tsx
    notes.length > 0 ? (
      <SectionRow key="notes" id="notes" label="Notes" action={sectionLink("All notes", "/notes/")}>
        <NoteList notes={notes} side="work" dates="full" />
      </SectionRow>
    ) : null,
```

Update the component comment to "identity, Lab, Selected work, Notes, Experience and contributions". The admin's home preview (`app/admin/preview/home/page.tsx`) keeps passing only `content`, so the preview shows no notes. That is fine: notes are not part of a Bio draft.

`app/(work)/page.tsx`:

```tsx
import { HomeSite } from "@/components/home/home-site";
import { getPublishedNotes } from "@/lib/notes/read";
import { onSide } from "@/lib/notes/views";
import { getHomeContent } from "@/lib/work";

export default async function HomePage() {
  const [content, notes] = await Promise.all([getHomeContent(), getPublishedNotes()]);
  return <HomeSite content={content} notes={onSide(notes, "work").slice(0, 3)} />;
}
```

`app/(work)/notes/page.tsx`:

```tsx
import type { Metadata } from "next";
import { NotesIndex } from "@/components/notes/notes-index";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Notes");

export default function NotesPage() {
  return <NotesIndex side="work" page={1} />;
}
```

`app/(work)/notes/page/[n]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesIndex } from "@/components/notes/notes-index";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { onSide, pageCount, parsePage } from "@/lib/notes/views";

// Pages 2 and on; page 1 is /notes/. Under cacheComponents this must return
// at least one param, so "2" stands in when there is a single page (its page
// is a 404 until there are more than 30 notes).
export async function generateStaticParams() {
  const pages = pageCount(onSide(await getPublishedNotes(), "work").length);
  return pages > 1 ? Array.from({ length: pages - 1 }, (_, i) => ({ n: String(i + 2) })) : [{ n: "2" }];
}

export async function generateMetadata({ params }: PageProps<"/notes/page/[n]">): Promise<Metadata> {
  return pageMetadata(`Notes, page ${(await params).n}`);
}

export default async function NotesPageN({ params }: PageProps<"/notes/page/[n]">) {
  const page = parsePage((await params).n);
  if (page === null || page < 2) notFound();
  return <NotesIndex side="work" page={page} />;
}
```

`app/(work)/notes/[tid]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { NotePage } from "@/components/notes/note-page";
import { noteMetadata } from "@/lib/notes/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { PLACEHOLDER_TID, onSide } from "@/lib/notes/views";

// Work and both-side notes. Notes published later render on first visit and
// are cached with the notes tag. At least one param (cacheComponents): the
// placeholder TID is never a real note, so its page is a 404.
export async function generateStaticParams() {
  const tids = onSide(await getPublishedNotes(), "work").map((note) => ({ tid: note.tid }));
  return tids.length > 0 ? tids : [{ tid: PLACEHOLDER_TID }];
}

export async function generateMetadata({ params }: PageProps<"/notes/[tid]">): Promise<Metadata> {
  const { tid } = await params;
  const note = onSide(await getPublishedNotes(), "work").find((item) => item.tid === tid);
  return note ? noteMetadata(note) : {};
}

export default async function WorkNotePage({ params }: PageProps<"/notes/[tid]">) {
  return <NotePage side="work" tid={(await params).tid} />;
}
```

- [ ] **Step 5: Run everything**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e && SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures && npm run build`
Expected: PASS. Existing e2e tests that list the home's sections still pass, because the plain build has no notes. If `e2e-fixtures/home.spec.ts` asserts the full section list, add `"notes"` after `"selected-work"` there.

- [ ] **Step 6: Commit**

```bash
git add components/notes components/home/home-site.tsx "app/(work)" lib/nav.ts tests/nav.test.ts e2e/notes.spec.ts e2e-fixtures
git commit -m "Show notes on the home page and at /notes/, by year, with a page per note

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Notes on the Life side

**Files:**
- Create: `components/sections/notes/index.tsx`, `app/life/notes/page.tsx`, `app/life/notes/page/[n]/page.tsx`, `app/life/notes/[tid]/page.tsx`, `e2e-fixtures/life-notes.spec.ts`
- Modify: `components/sections/life.ts`, `lib/life/readout.ts`, `app/life/page.tsx`, `tests/life-readout.test.ts`, `e2e/notes.spec.ts`

**Interfaces:**
- Consumes: `NoteList`, `NotesIndex`, `NotePage` (Task 5); `getPublishedNotes`, `onSide`, `notePathOn`, `pageCount`, `parsePage`, `PLACEHOLDER_TID`, `noteMetadata`, `fixtureNotes` (Task 4).
- Produces: `ReadoutInput.note?: { text: string; href: string }`, which becomes a `note` line between `last photo` and `writing`.

- [ ] **Step 1: Write the failing tests**

Add to `tests/life-readout.test.ts`:

```ts
  it("adds the latest Life note on one line, after the photo", () => {
    const lines = buildReadout({
      photo: { title: "Night Boulevard", slug: "night-boulevard" },
      note: { text: "Yui found the sun\nagain.", href: "/life/notes/3m2k7xq4ab2c2/" },
      post: { title: "Hello", link: "https://w00f.org/hello" },
    });
    expect(lines.map(readoutText)).toEqual(["last photo: Night Boulevard", "note: Yui found the sun again.", "writing: Hello"]);
    expect(lines.find((l) => l.key === "note")!.href).toBe("/life/notes/3m2k7xq4ab2c2/");
  });
```

Add to `e2e/notes.spec.ts`:

```ts
test("with no notes /life/ has no Notes section and /life/notes/ says so", async ({ page }) => {
  await page.goto("/life/");
  await expect(page.locator('[data-section="notes"]')).toHaveCount(0);
  await page.goto("/life/notes/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Notes Off the clock.");
  await expect(page.getByText("No notes yet.")).toBeVisible();
});
```

`e2e-fixtures/life-notes.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { fixtureNotes } from "../lib/notes/fixtures";

const notes = fixtureNotes();
const byId = (n: number) => notes.find((note) => note.id === `fixture-${n}`)!;

test("/life/ shows the latest three Life notes above Writing, and a note line in the readout", async ({ page }) => {
  await page.goto("/life/");
  const sections = await page.locator("[data-section]").evaluateAll((els) => els.map((el) => el.getAttribute("data-section")));
  expect(sections.indexOf("notes")).toBe(sections.indexOf("writing") - 1);
  const section = page.locator('[data-section="notes"]');
  await expect(section.locator("article")).toHaveCount(3);
  await expect(section.locator("article").first()).toContainText("Notes editor, first pass.");
  await expect(section.locator('article[lang="tr"]')).toContainText("Bugün Ankara'da ilk yağmur.");
  await expect(section.getByRole("link", { name: "All" })).toHaveAttribute("href", "/life/notes/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("note: Notes editor, first pass.");
});

test("/life/notes/ lists Life notes; a both-side note's Life page is canonical on Work", async ({ page }) => {
  await page.goto("/life/notes/");
  await expect(page.locator("main article")).toHaveCount(3);
  const both = byId(2);
  await page.goto(`/life/notes/${both.tid}/`);
  await expect(page.locator("main article")).toContainText("Notes editor, first pass.");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://onursenture.com/notes/${both.tid}/`);
  await expect(page.locator('div[data-side="life"]')).toBeVisible();
});

test("a Work-only note has no Life page", async ({ page }) => {
  expect((await page.goto(`/life/notes/${byId(1).tid}/`))?.status()).toBe(404);
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run tests/life-readout.test.ts`
Expected: FAIL (`note` isn't an input yet).

- [ ] **Step 3: Write the section, the readout line and the routes**

`components/sections/notes/index.tsx`:

```tsx
import { NoteList } from "@/components/notes/note-list";
import { getPublishedNotes } from "@/lib/notes/read";
import type { PublishedNote } from "@/lib/notes/types";
import { onSide } from "@/lib/notes/views";
import type { SectionDefinition } from "../types";

function Render({ data }: { data: PublishedNote[] }) {
  return <NoteList notes={data} side="life" dates="full" />;
}

// The latest three Life notes (and both-side ones) on /life/. app/life/page.tsx
// leaves the section out while there are none.
export const notes: SectionDefinition<PublishedNote[]> = {
  id: "notes",
  title: "Notes",
  load: async () => ({ data: onSide(await getPublishedNotes(), "life").slice(0, 3), lastSuccessAt: null }),
  Render,
  href: "/life/notes/",
};
```

`components/sections/life.ts`: import `notes` from `./notes` and order the list as `films, books, articles, notes, writing, photos`.

`lib/life/readout.ts`:
- add `note?: { text: string; href: string };` to `ReadoutInput`, commented "The latest Life (or both-side) note.";
- destructure `note`;
- after the photo line, add:

```ts
  if (note) lines.push({ key: "note", label: "note", value: note.text.replace(/\s+/g, " ").trim(), href: note.href });
```

`app/life/page.tsx`:
- Add `getPublishedNotes()` to the `Promise.all` (as `allNotes`).
- Then:

```tsx
  const lifeNotes = onSide(allNotes, "life");
  const latestNote = lifeNotes[0];
```

- Pass `note: latestNote ? { text: latestNote.text, href: notePathOn(latestNote, "life") } : undefined` to `buildReadout`.
- Render `lifeSections.filter((section) => section.id !== "notes" || lifeNotes.length > 0)` instead of `lifeSections`, so an empty Notes section leaves no stray dither rule.
- Import `getPublishedNotes`, `onSide` and `notePathOn`.

`app/life/notes/page.tsx`:

```tsx
import type { Metadata } from "next";
import { NotesIndex } from "@/components/notes/notes-index";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata("Life notes");

export default function LifeNotesPage() {
  return <NotesIndex side="life" page={1} />;
}
```

`app/life/notes/page/[n]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesIndex } from "@/components/notes/notes-index";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { onSide, pageCount, parsePage } from "@/lib/notes/views";

// As /notes/page/[n]/, on the Life side.
export async function generateStaticParams() {
  const pages = pageCount(onSide(await getPublishedNotes(), "life").length);
  return pages > 1 ? Array.from({ length: pages - 1 }, (_, i) => ({ n: String(i + 2) })) : [{ n: "2" }];
}

export async function generateMetadata({ params }: PageProps<"/life/notes/page/[n]">): Promise<Metadata> {
  return pageMetadata(`Life notes, page ${(await params).n}`);
}

export default async function LifeNotesPageN({ params }: PageProps<"/life/notes/page/[n]">) {
  const page = parsePage((await params).n);
  if (page === null || page < 2) notFound();
  return <NotesIndex side="life" page={page} />;
}
```

`app/life/notes/[tid]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { NotePage } from "@/components/notes/note-page";
import { noteMetadata } from "@/lib/notes/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { PLACEHOLDER_TID, onSide } from "@/lib/notes/views";

// Life and both-side notes; a both-side note's canonical URL is its Work page
// (noteMetadata).
export async function generateStaticParams() {
  const tids = onSide(await getPublishedNotes(), "life").map((note) => ({ tid: note.tid }));
  return tids.length > 0 ? tids : [{ tid: PLACEHOLDER_TID }];
}

export async function generateMetadata({ params }: PageProps<"/life/notes/[tid]">): Promise<Metadata> {
  const { tid } = await params;
  const note = onSide(await getPublishedNotes(), "life").find((item) => item.tid === tid);
  return note ? noteMetadata(note) : {};
}

export default async function LifeNotePage({ params }: PageProps<"/life/notes/[tid]">) {
  return <NotePage side="life" tid={(await params).tid} />;
}
```

- [ ] **Step 4: Run everything**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e && SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures && npm run build`
Expected: PASS. `e2e/life.spec.ts`'s section list still holds, because the plain build has no notes.

- [ ] **Step 5: Commit**

```bash
git add components/sections lib/life/readout.ts app/life tests/life-readout.test.ts e2e/notes.spec.ts e2e-fixtures/life-notes.spec.ts
git commit -m "Show Life notes on /life/, in the readout and at /life/notes/

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `/feed.xml`

**Files:**
- Create: `lib/feed/rss.ts`, `app/feed.xml/route.ts`, `e2e/feed.spec.ts`, `e2e-fixtures/feed.spec.ts`
- Test: `tests/feed/rss.test.ts`

**Interfaces:**
- Consumes: `noteSegments` (Task 1); `getPublishedNotes`, `canonicalPath`, `fixtureNotes` (Task 4); `getPhotos` (`lib/content/photos.ts`); `getImage` (`lib/images/manifest.ts`); `renditionUrl`, `ImageEntry` (`lib/images/plan.ts`); `site` (`lib/site.ts`).
- Produces:
  - `buildFeed(input: FeedInput): string`, `escapeXml`, `noteHtml`, `FEED_LIMIT` (50);
  - the route `GET /feed.xml`, which serves `application/rss+xml; charset=utf-8`.

- [ ] **Step 1: Write the failing tests**

`tests/feed/rss.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FEED_LIMIT, buildFeed, escapeXml, noteHtml } from "@/lib/feed/rss";
import type { PublishedNote } from "@/lib/notes/types";

const SITE = "https://onursenture.com";

function note(patch: Partial<PublishedNote> = {}): PublishedNote {
  return {
    id: "a",
    tid: "3m2k7xq4ab2c2",
    text: "Fish & chips <3 at onursenture.com/resume/ with @w00f.org #tag",
    side: "work",
    lang: "en",
    embed: null,
    status: "published",
    publishAt: null,
    publishedAt: "2026-10-04T11:00:00.000Z",
    createdAt: "2026-10-04T11:00:00.000Z",
    updatedAt: "2026-10-04T11:00:00.000Z",
    ...patch,
  };
}

const photo = {
  photo: { slug: "stabilo", title: "Stabilo & co", date: "2026-02-10", image: "photos/stabilo" },
  entry: { width: 2560, height: 1707, widths: [640, 1280, 2560] },
};

describe("escapeXml", () => {
  it("escapes the five XML characters", () => {
    expect(escapeXml(`<a href="x">Tom & Jerry's</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;");
  });
});

describe("noteHtml", () => {
  it("links URLs and handles, escapes text and keeps tags as text", () => {
    expect(noteHtml(note(), SITE)).toBe(
      '<p>Fish &amp; chips &lt;3 at <a href="https://onursenture.com/resume/">onursenture.com/resume/</a> with <a href="https://bsky.app/profile/w00f.org">@w00f.org</a> #tag</p>',
    );
  });

  it("adds absolute 1280px JPEGs with alt text, and link cards", () => {
    const withImages = note({ text: "", embed: { kind: "images", images: [{ key: "media/notes/abc", alt: "A \"cat\"", width: 2560, height: 1600, widths: [640, 1280, 2560], baseUrl: "https://b.public.blob.vercel-storage.com/media/notes/abc" }] } });
    expect(noteHtml(withImages, SITE)).toBe('<p><img src="https://b.public.blob.vercel-storage.com/media/notes/abc-1280.jpg" alt="A &quot;cat&quot;"></p>');
    const local = note({ text: "", embed: { kind: "images", images: [{ key: "photos/x", alt: "x", width: 900, height: 600, widths: [640, 900] }] } });
    expect(noteHtml(local, SITE)).toBe('<p><img src="https://onursenture.com/images/photos/x-900.jpg" alt="x"></p>');
    const card = note({ text: "Read", embed: { kind: "link", url: "https://w00f.org/a", title: "", description: "", siteName: "" } });
    expect(noteHtml(card, SITE)).toBe('<p>Read</p><p><a href="https://w00f.org/a">https://w00f.org/a</a></p>');
  });
});

describe("buildFeed", () => {
  it("is RSS 2.0 with notes and photos newest first; notes have no title", () => {
    const xml = buildFeed({ siteUrl: SITE, title: "Onur Senture", notes: [note()], photos: [photo] });
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">')).toBe(true);
    expect(xml).toContain('<atom:link href="https://onursenture.com/feed.xml" rel="self" type="application/rss+xml"/>');
    expect(xml).toContain("<lastBuildDate>Sun, 04 Oct 2026 11:00:00 GMT</lastBuildDate>");
    const items = xml.split("<item>").slice(1);
    expect(items).toHaveLength(2);
    expect(items[0]).not.toContain("<title>");
    expect(items[0]).toContain('<guid isPermaLink="true">https://onursenture.com/notes/3m2k7xq4ab2c2/</guid>');
    expect(items[0]).toContain("<pubDate>Sun, 04 Oct 2026 11:00:00 GMT</pubDate>");
    expect(items[0]).toContain("<description>&lt;p&gt;Fish &amp;amp; chips");
    expect(items[1]).toContain("<title>Stabilo &amp; co</title>");
    expect(items[1]).toContain("<link>https://onursenture.com/life/photos/stabilo/</link>");
    expect(items[1]).toContain("https://onursenture.com/images/photos/stabilo-1280.jpg");
  });

  it("links a Life note to its Life page and keeps the newest 50 items", () => {
    const life = note({ side: "life" });
    expect(buildFeed({ siteUrl: SITE, title: "T", notes: [life], photos: [] })).toContain("<link>https://onursenture.com/life/notes/3m2k7xq4ab2c2/</link>");
    const many = Array.from({ length: 60 }, (_, i) => note({ id: String(i), tid: `3m2k7xq4ab${String(i).padStart(3, "2")}`, publishedAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString() }));
    const xml = buildFeed({ siteUrl: SITE, title: "T", notes: many, photos: [] });
    expect(xml.split("<item>").length - 1).toBe(FEED_LIMIT);
  });

  it("has no lastBuildDate when there are no items", () => {
    expect(buildFeed({ siteUrl: SITE, title: "T", notes: [], photos: [] })).not.toContain("lastBuildDate");
  });
});
```

`e2e/feed.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("/feed.xml is RSS with the photos when there are no notes", async ({ request }) => {
  const response = await request.get("/feed.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/rss+xml; charset=utf-8");
  const xml = await response.text();
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).toContain("/life/photos/");
  expect(xml).not.toContain("/notes/");
});
```

`e2e-fixtures/feed.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { fixtureNotes } from "../lib/notes/fixtures";
import { canonicalPath } from "../lib/notes/views";

test("/feed.xml carries the notes, newest first, before older photos", async ({ request }) => {
  const xml = await (await request.get("/feed.xml")).text();
  const [newest] = fixtureNotes();
  const first = xml.split("<item>")[1];
  expect(first).toContain(`<link>https://onursenture.com${canonicalPath(newest)}</link>`);
  expect(xml).toContain("Bugün Ankara&apos;da ilk yağmur.");
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run tests/feed`
Expected: FAIL (module missing).

- [ ] **Step 3: Write the feed**

`lib/feed/rss.ts`:

```ts
import type { Photo } from "@/lib/content/photos";
import { type ImageEntry, renditionUrl } from "@/lib/images/plan";
import { noteSegments } from "@/lib/notes/facets";
import type { PublishedNote } from "@/lib/notes/types";
import { canonicalPath } from "@/lib/notes/views";

// /feed.xml (spec §3.6): every published note and every photo, newest first,
// at the old site's URL. Notes are description-only items (RSS 2.0 allows
// it); their HTML is the text with its links, then the images or the card.
// Server only (facets.ts).

export const FEED_LIMIT = 50;
const DESCRIPTION = "Notes and photos by Onur Senture.";

export function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function absolute(siteUrl: string, url: string): string {
  return url.startsWith("/") ? `${siteUrl}${url}` : url;
}

// The largest rendition up to 1280px wide, as a JPEG (readers and AVIF don't mix).
function feedImage(siteUrl: string, key: string, entry: ImageEntry): string {
  const width = [...entry.widths].reverse().find((w) => w <= 1280) ?? entry.widths[0];
  return absolute(siteUrl, renditionUrl(key, width, "jpg", entry.baseUrl));
}

export function noteHtml(note: PublishedNote, siteUrl: string): string {
  const text = noteSegments(note.text)
    .map((segment) => {
      if (segment.kind === "link") return `<a href="${escapeXml(segment.href)}">${escapeXml(segment.text)}</a>`;
      if (segment.kind === "mention") return `<a href="https://bsky.app/profile/${escapeXml(segment.handle)}">${escapeXml(segment.text)}</a>`;
      return escapeXml(segment.text);
    })
    .join("")
    .replace(/\n/g, "<br>");
  const parts = text.trim() ? [`<p>${text}</p>`] : [];
  const embed = note.embed;
  if (embed?.kind === "images") {
    for (const image of embed.images) parts.push(`<p><img src="${escapeXml(feedImage(siteUrl, image.key, image))}" alt="${escapeXml(image.alt)}"></p>`);
  }
  if (embed?.kind === "link") parts.push(`<p><a href="${escapeXml(embed.url)}">${escapeXml(embed.title || embed.url)}</a></p>`);
  return parts.join("");
}

interface FeedItem {
  title: string | null;
  link: string;
  description: string;
  date: string;
}

export interface FeedInput {
  siteUrl: string;
  title: string;
  notes: PublishedNote[];
  photos: { photo: Pick<Photo, "slug" | "title" | "date" | "image">; entry: ImageEntry }[];
}

export function buildFeed({ siteUrl, title, notes, photos }: FeedInput): string {
  const items: FeedItem[] = [
    ...notes.map((note) => ({ title: null, link: `${siteUrl}${canonicalPath(note)}`, description: noteHtml(note, siteUrl), date: note.publishedAt })),
    ...photos.map(({ photo, entry }) => ({
      title: photo.title,
      link: `${siteUrl}/life/photos/${photo.slug}/`,
      description: `<p><img src="${escapeXml(feedImage(siteUrl, photo.image, entry))}" alt="${escapeXml(photo.title)}"></p>`,
      date: `${photo.date}T00:00:00.000Z`,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, FEED_LIMIT);

  const rfc822 = (iso: string) => new Date(iso).toUTCString();
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(title)}</title>`,
    `<link>${siteUrl}/</link>`,
    `<description>${escapeXml(DESCRIPTION)}</description>`,
    "<language>en</language>",
    `<atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>`,
    // The newest item's date, not the build time, so an unchanged feed stays byte-identical.
    ...(items[0] ? [`<lastBuildDate>${rfc822(items[0].date)}</lastBuildDate>`] : []),
    ...items.map((item) =>
      [
        "<item>",
        item.title ? `<title>${escapeXml(item.title)}</title>` : "",
        `<link>${escapeXml(item.link)}</link>`,
        `<guid isPermaLink="true">${escapeXml(item.link)}</guid>`,
        `<pubDate>${rfc822(item.date)}</pubDate>`,
        `<description>${escapeXml(item.description)}</description>`,
        "</item>",
      ].join(""),
    ),
    "</channel>",
    "</rss>",
  ];
  return `${lines.join("\n")}\n`;
}
```

`app/feed.xml/route.ts`:

```ts
import { cacheLife, cacheTag } from "next/cache";
import { getPhotos } from "@/lib/content/photos";
import { buildFeed } from "@/lib/feed/rss";
import { getImage } from "@/lib/images/manifest";
import { getPublishedNotes } from "@/lib/notes/read";
import { NOTES_TAG } from "@/lib/notes/tags";
import { site } from "@/lib/site";

// Prerendered at build and regenerated when the notes tag is revalidated (a
// publish, an edit, the cron). Photos are repo content: a deploy refreshes
// them. "hours" caps how long a database error's empty list could stick.
async function feedXml(): Promise<string> {
  "use cache";
  cacheTag(NOTES_TAG);
  cacheLife("hours");
  const [notes, photos] = await Promise.all([getPublishedNotes(), getPhotos()]);
  return buildFeed({ siteUrl: site.url, title: site.title, notes, photos: photos.map((photo) => ({ photo, entry: getImage(photo.image) })) });
}

export async function GET() {
  return new Response(await feedXml(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
```

- [ ] **Step 4: Run everything**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e && SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures && npm run build`
Expected: PASS. `curl -s localhost:3217/feed.xml | xmllint --noout -` (with `npm run start -- --port 3217` running) prints nothing, which means well-formed XML.

- [ ] **Step 5: Commit**

```bash
git add lib/feed app/feed.xml tests/feed e2e/feed.spec.ts e2e-fixtures/feed.spec.ts
git commit -m "Serve /feed.xml with every note and photo, at the old site's URL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 8: Note uploads, link cards and the note server actions

**Files:**
- Modify: `lib/media/rules.ts`, `lib/media/process.ts`, `lib/notes/operations.ts` (add `NoteActionResult`)
- Create: `lib/notes/link-card.ts`, `app/admin/notes-actions.ts`, `lib/admin/notes.ts`
- Test: `tests/media/note-rules.test.ts`, `tests/notes/link-card.test.ts`

**Interfaces:**
- Consumes: the operations, `NoteInput`, `NoteRef`, `NoteOpResult` (Task 3); `getNoteStore` (Task 2); `NOTES_TAG`, `NoteImage`, `NoteLinkCard`, `NoteIssue`, `Note` (Task 1); `isAdmin`; `getMediaStorage`, `uploadMode`; `getContentStore`; `hostname`.
- Produces:
  - `rules.ts`: `checkNoteDimensions(width, height)`, `NOTE_MIN_WIDTH` (320).
  - `process.ts`: `processImageWith(input, options, storage, now)` with `ProcessOptions { key(sourceHash): string; check(width, height): string | null }`. `processImage` keeps its signature and behaviour.
  - `operations.ts`: `NoteActionResult = NoteOpResult | { status: "unauthorized" } | { status: "unavailable" }`.
  - `link-card.ts`: `parseLinkCard(html, url)`, `fetchLinkCard(url, fetchImpl?)`, which returns `NoteLinkCard | null` (null for a non-http(s) or unparseable URL).
  - `notes-actions.ts` (`"use server"`):
    - `saveNoteAction(input: NoteInput)`, `publishNoteAction(input: NoteInput)`, `scheduleNoteAction(input: NoteInput & { publishAt: string })`, `unscheduleNoteAction(ref: NoteRef)` and `deleteNoteAction(ref: NoteRef)`, each `Promise<NoteActionResult>`;
    - `fetchLinkCardAction(url): Promise<{ status: "ok"; card: NoteLinkCard } | { status: "invalid"; issues: NoteIssue[] } | { status: "unauthorized" }>`;
    - `processNoteUploadAction({ source }): Promise<{ status: "ok"; image: NoteImage } | { status: "invalid"; issues: NoteIssue[] } | { status: "unauthorized" } | { status: "unavailable" }>`.
  - `lib/admin/notes.ts` (server only):
    - `NotesConsoleInit { notes: Note[]; available: boolean; uploadMode: "blob" | "local" | null }` and `loadNotesConsole()`;
    - `noteCounts(): Promise<{ drafts: number; scheduled: number; published: number } | null>`.

- [ ] **Step 1: Write the failing tests**

`tests/media/note-rules.test.ts`:

```ts
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processImage, processImageWith } from "@/lib/media/process";
import { checkDimensions, checkNoteDimensions } from "@/lib/media/rules";
import type { MediaStorage } from "@/lib/media/storage";

const now = new Date("2026-10-04T10:00:00.000Z");

function memory(): MediaStorage & { files: Map<string, Buffer> } {
  const files = new Map<string, Buffer>();
  return {
    mode: "local",
    files,
    async saveSource() {
      return "local:uploads/x.png";
    },
    async readSource() {
      return Buffer.alloc(0);
    },
    async deleteSource() {},
    async putFile(pathname, body) {
      files.set(pathname, body);
      return `https://cdn.test/${pathname}`;
    },
    resolveLocal() {
      return null;
    },
  };
}

const png = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#2F55F5" } }).png().toBuffer();

describe("checkNoteDimensions", () => {
  it("takes any ratio from 1:3 to 3:1, at least 320px wide", () => {
    expect(checkNoteDimensions(1600, 1200)).toBeNull();
    expect(checkNoteDimensions(1170, 2532)).toBeNull();
    expect(checkNoteDimensions(900, 2700)).toBeNull();
    expect(checkNoteDimensions(400, 1300)).toBe("The image is 400×1300; notes take ratios from 1:3 to 3:1.");
    expect(checkNoteDimensions(1300, 400)).toBe("The image is 1300×400; notes take ratios from 1:3 to 3:1.");
    expect(checkNoteDimensions(300, 300)).toBe("The image is 300px wide; it needs at least 320px.");
  });

  it("leaves the product-page rule as it was", () => {
    expect(checkDimensions(1600, 1200)).not.toBeNull();
  });
});

describe("processImageWith", () => {
  it("renders a 4:3 note image under the given key", async () => {
    const storage = memory();
    const result = await processImageWith(await png(800, 600), { key: (hash) => `media/notes/${hash.slice(0, 16)}`, check: checkNoteDimensions }, storage, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.record).toMatchObject({ width: 800, height: 600, widths: [640, 800] });
    expect(result.record.key).toMatch(/^media\/notes\/[0-9a-f]{16}$/);
    expect([...storage.files.keys()].sort()).toEqual([`${result.record.key}-640.avif`, `${result.record.key}-640.jpg`, `${result.record.key}-800.avif`, `${result.record.key}-800.jpg`].sort());
  });

  it("refuses what the check refuses, writing nothing", async () => {
    const storage = memory();
    const result = await processImageWith(await png(1300, 400), { key: () => "k", check: checkNoteDimensions }, storage, now);
    expect(result).toEqual({ ok: false, reason: "The image is 1300×400; notes take ratios from 1:3 to 3:1." });
    expect(storage.files.size).toBe(0);
  });

  it("keeps processImage on the work rules and keys", async () => {
    const storage = memory();
    const result = await processImage(await png(1280, 800), { slug: "nebuu", imageId: "game" }, storage, now);
    expect(result.ok && result.record.key).toMatch(/^media\/work\/nebuu\/game-[0-9a-f]{8}$/);
  });
});
```

`tests/notes/link-card.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fetchLinkCard, parseLinkCard } from "@/lib/notes/link-card";

const html = `<!doctype html><html><head>
<title>Fallback title</title>
<meta property="og:title" content="ATProto, POSSE, and Personal Sites">
<meta property="og:description" content="Using the AT Protocol for POSSE.">
<meta property="og:site_name" content="Steve Simkins">
</head><body></body></html>`;

function stub(body: string, init: { status?: number; type?: string } = {}): typeof fetch {
  return (async () => new Response(body, { status: init.status ?? 200, headers: { "content-type": init.type ?? "text/html; charset=utf-8" } })) as typeof fetch;
}

describe("parseLinkCard", () => {
  it("reads Open Graph tags", () => {
    expect(parseLinkCard(html, "https://stevedylan.dev/posts/x/")).toEqual({
      kind: "link",
      url: "https://stevedylan.dev/posts/x/",
      title: "ATProto, POSSE, and Personal Sites",
      description: "Using the AT Protocol for POSSE.",
      siteName: "Steve Simkins",
    });
  });

  it("falls back to <title>, the description meta and the host", () => {
    const plain = `<html><head><title> Plain </title><meta name="description" content="Desc"></head></html>`;
    expect(parseLinkCard(plain, "https://www.example.com/a")).toEqual({ kind: "link", url: "https://www.example.com/a", title: "Plain", description: "Desc", siteName: "example.com" });
  });
});

describe("fetchLinkCard", () => {
  it("fetches and parses an HTML page", async () => {
    expect(await fetchLinkCard("https://stevedylan.dev/posts/x/", stub(html))).toMatchObject({ title: "ATProto, POSSE, and Personal Sites" });
  });

  it("returns a bare card when the page fails or isn't HTML, so saving still works", async () => {
    const bare = { kind: "link", url: "https://w00f.org/a", title: "", description: "", siteName: "w00f.org" };
    expect(await fetchLinkCard("https://w00f.org/a", stub("nope", { status: 500 }))).toEqual(bare);
    expect(await fetchLinkCard("https://w00f.org/a", stub("{}", { type: "application/json" }))).toEqual(bare);
    expect(await fetchLinkCard("https://w00f.org/a", (async () => Promise.reject(new Error("offline"))) as typeof fetch)).toEqual(bare);
  });

  it("refuses non-http(s) and malformed URLs", async () => {
    expect(await fetchLinkCard("javascript:alert(1)", stub(html))).toBeNull();
    expect(await fetchLinkCard("not a url", stub(html))).toBeNull();
  });
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run tests/media/note-rules.test.ts tests/notes/link-card.test.ts`
Expected: FAIL (`checkNoteDimensions`, `processImageWith` and `link-card.ts` are missing).

- [ ] **Step 3: Write the rules, the processing split and the link cards**

Append to `lib/media/rules.ts`:

```ts
// Notes (Sprint 9 spec §4.3): any ratio from 1:3 to 3:1 (screenshots, phone
// photos), at least 320px wide. The 16:10 rule above stays for product pages.
export const NOTE_MIN_WIDTH = 320;
const NOTE_MAX_RATIO = 3;

export function checkNoteDimensions(width: number, height: number): string | null {
  const ratio = width / height;
  if (ratio > NOTE_MAX_RATIO || ratio < 1 / NOTE_MAX_RATIO) return `The image is ${width}×${height}; notes take ratios from 1:3 to 3:1.`;
  if (width < NOTE_MIN_WIDTH) return `The image is ${width}px wide; it needs at least ${NOTE_MIN_WIDTH}px.`;
  return null;
}
```

In `lib/media/process.ts`, turn `processImage`'s body into `processImageWith` and keep `processImage` as a wrapper. The function body stays the same except for two lines:
- `checkDimensions(width, height)` becomes `options.check(width, height)`;
- the `key` line becomes `const key = options.key(sourceHash);`.

The top of the file then reads:

```ts
export interface UploadTarget {
  slug: string;
  imageId: string;
}

// Where the renditions go and which sizes are accepted: product pages use
// 16:10 under media/work/ (processImage), notes any ratio under media/notes/.
export interface ProcessOptions {
  key: (sourceHash: string) => string;
  check: (width: number, height: number) => string | null;
}

// Checks an uploaded original and renders its renditions (the same widths and
// encoder as `npm run images`) into storage. Nothing is written for a
// rejected file; the caller records the returned MediaRecord.
export async function processImageWith(
  input: Buffer,
  options: ProcessOptions,
  storage: MediaStorage,
  now: Date,
): Promise<{ ok: true; record: MediaRecord } | { ok: false; reason: string }> {
  // ... the existing body, with options.check and options.key as described ...
}

export function processImage(input: Buffer, target: UploadTarget, storage: MediaStorage, now: Date) {
  return processImageWith(input, { key: (hash) => `media/work/${target.slug}/${target.imageId}-${hash.slice(0, 8)}`, check: checkDimensions }, storage, now);
}
```

`tests/media/process.test.ts` must pass unchanged.

`lib/notes/link-card.ts`:

```ts
import * as cheerio from "cheerio";
import { hostname } from "@/lib/sources/http";
import type { NoteLinkCard } from "./types";

// A note's link card (spec §4.4), fetched once when the author adds the link
// and stored in the note; nothing is fetched at render time. A page that
// fails, times out or isn't HTML still gives a card: the URL and its host.

const TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 1_000_000;
const USER_AGENT = "Mozilla/5.0 (compatible; onursenture.com-notes/1.0)";

function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

export function parseLinkCard(html: string, url: string): NoteLinkCard {
  const $ = cheerio.load(html);
  const meta = (name: string) => ($(`meta[property="${name}"]`).attr("content") ?? $(`meta[name="${name}"]`).attr("content") ?? "").trim();
  return {
    kind: "link",
    url,
    title: clip(meta("og:title") || $("title").first().text().trim(), 300),
    description: clip(meta("og:description") || meta("description"), 1000),
    siteName: clip(meta("og:site_name") || hostname(url), 200),
  };
}

function bareCard(url: string): NoteLinkCard {
  return { kind: "link", url, title: "", description: "", siteName: hostname(url) };
}

// Reads at most `max` bytes, so a huge page can't hold the action.
async function readCapped(response: Response, max: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < max) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  await reader.cancel().catch(() => undefined);
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, max));
}

export async function fetchLinkCard(url: string, fetchImpl: typeof fetch = globalThis.fetch): Promise<NoteLinkCard | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const href = parsed.toString();
  try {
    const response = await fetchImpl(href, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "User-Agent": USER_AGENT, Accept: "text/html" } });
    if (!response.ok || !(response.headers.get("content-type") ?? "").includes("text/html")) return bareCard(href);
    return parseLinkCard(await readCapped(response, MAX_HTML_BYTES), href);
  } catch {
    return bareCard(href);
  }
}
```

Add to `lib/notes/operations.ts` (below `NoteOpResult`):

```ts
// What a server action returns: the operation's result, or the two outcomes
// that only exist at the request level.
export type NoteActionResult = NoteOpResult | { status: "unauthorized" } | { status: "unavailable" };
```

- [ ] **Step 4: Write the server actions and the loader**

`app/admin/notes-actions.ts`:

```ts
"use server";

import { updateTag } from "next/cache";
import { isAdmin } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { processImageWith } from "@/lib/media/process";
import { checkNoteDimensions } from "@/lib/media/rules";
import { type MediaStorage, getMediaStorage } from "@/lib/media/storage";
import { getNoteStore } from "@/lib/notes/get-store";
import { fetchLinkCard } from "@/lib/notes/link-card";
import {
  type NoteActionResult,
  type NoteInput,
  type NoteOpResult,
  type NoteRef,
  deleteNote,
  publishNote,
  saveNote,
  scheduleNote,
  unscheduleNote,
} from "@/lib/notes/operations";
import type { NoteStore } from "@/lib/notes/store";
import { NOTES_TAG } from "@/lib/notes/tags";
import type { NoteImage, NoteIssue, NoteLinkCard } from "@/lib/notes/types";

// Server actions for /admin/notes/ (spec §4.2). Each checks the session, then
// the store; a store error reads as "unavailable". Every successful write
// updates the notes tag, so the next request renders the change.

async function withStore(work: (store: NoteStore) => Promise<NoteOpResult>): Promise<NoteActionResult> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  let store: NoteStore | null;
  try {
    store = getNoteStore();
  } catch {
    store = null;
  }
  if (!store) return { status: "unavailable" };
  try {
    const result = await work(store);
    if (result.status === "ok") updateTag(NOTES_TAG);
    return result;
  } catch (e) {
    console.warn("[notes]", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  }
}

export async function saveNoteAction(input: NoteInput): Promise<NoteActionResult> {
  return withStore((store) => saveNote(store, input, new Date()));
}

export async function publishNoteAction(input: NoteInput): Promise<NoteActionResult> {
  return withStore((store) => publishNote(store, input, new Date()));
}

export async function scheduleNoteAction(input: NoteInput & { publishAt: string }): Promise<NoteActionResult> {
  return withStore((store) => scheduleNote(store, input, new Date()));
}

export async function unscheduleNoteAction(ref: NoteRef): Promise<NoteActionResult> {
  return withStore((store) => unscheduleNote(store, ref, new Date()));
}

export async function deleteNoteAction(ref: NoteRef): Promise<NoteActionResult> {
  return withStore((store) => deleteNote(store, ref));
}

export async function fetchLinkCardAction(
  url: string,
): Promise<{ status: "ok"; card: NoteLinkCard } | { status: "invalid"; issues: NoteIssue[] } | { status: "unauthorized" }> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const card = await fetchLinkCard(url.trim());
  return card ? { status: "ok", card } : { status: "invalid", issues: [{ at: "embed/url", message: "Use an http or https link." }] };
}

// After the browser uploaded an original (PNG or JPEG; the browser converts
// anything else): check it against the note rules, render the renditions and
// hand back a self-contained NoteImage. The original is deleted either way. A
// media row is recorded too, for the later media cleanup; notes never read it.
export async function processNoteUploadAction(input: {
  source: string;
}): Promise<{ status: "ok"; image: NoteImage } | { status: "invalid"; issues: NoteIssue[] } | { status: "unauthorized" } | { status: "unavailable" }> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const invalid = (message: string) => ({ status: "invalid" as const, issues: [{ at: "embed/images", message }] });
  let storage: MediaStorage;
  try {
    storage = getMediaStorage();
  } catch {
    return { status: "unavailable" };
  }
  try {
    let bytes: Buffer;
    try {
      bytes = await storage.readSource(input.source);
    } catch {
      return invalid("The upload could not be read. Try again.");
    }
    const result = await processImageWith(bytes, { key: (hash) => `media/notes/${hash.slice(0, 16)}`, check: checkNoteDimensions }, storage, new Date());
    if (!result.ok) return invalid(result.reason);
    await getContentStore()?.putMedia(result.record);
    const { key, baseUrl, width, height, widths } = result.record;
    return { status: "ok", image: { key, baseUrl, width, height, widths, alt: "" } };
  } catch (e) {
    console.warn("[notes] upload failed:", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  } finally {
    await storage.deleteSource(input.source).catch(() => undefined);
  }
}
```

`lib/admin/notes.ts`:

```ts
import "server-only";
import { uploadMode } from "@/lib/media/storage";
import { getNoteStore } from "@/lib/notes/get-store";
import type { NoteStore } from "@/lib/notes/store";
import type { Note } from "@/lib/notes/types";

// What /admin/notes/ starts from: every note, whether the store can be
// written, and where uploads go.
export interface NotesConsoleInit {
  notes: Note[];
  available: boolean;
  uploadMode: "blob" | "local" | null;
}

function store(): NoteStore | null {
  try {
    return getNoteStore();
  } catch {
    return null;
  }
}

export async function loadNotesConsole(): Promise<NotesConsoleInit> {
  const notes = store();
  const mode = uploadMode();
  if (!notes) return { notes: [], available: false, uploadMode: mode };
  try {
    return { notes: await notes.list(), available: true, uploadMode: mode };
  } catch (e) {
    console.warn("[notes] loading the console failed:", e instanceof Error ? e.message : e);
    return { notes: [], available: false, uploadMode: mode };
  }
}

// The admin home's Notes line; null when the store can't be read.
export async function noteCounts(): Promise<{ drafts: number; scheduled: number; published: number } | null> {
  const notes = store();
  if (!notes) return null;
  try {
    const all = await notes.list();
    const count = (status: Note["status"]) => all.filter((note) => note.status === status).length;
    return { drafts: count("draft"), scheduled: count("scheduled"), published: count("published") };
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run the checks**

Run: `npx vitest run tests/media tests/notes && npm run typecheck && npm run lint && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/media lib/notes app/admin/notes-actions.ts lib/admin/notes.ts tests/media/note-rules.test.ts tests/notes/link-card.test.ts
git commit -m "Add the note server actions, any-ratio note uploads and link cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: `NoteComposerState`

The composer's logic as a plain class, tested without a DOM: the value, dirty tracking, the schedule, the attachment rules, the busy guard and each action's outcome. This is the Sprint 7 lesson for state machines. The controller has it reviewed by **opus**.

**Files:**
- Create: `lib/admin/note-composer.ts`
- Test: `tests/admin/note-composer.test.ts`

**Interfaces:**
- Consumes: `NoteInput`, `NoteRef`, `NoteActionResult` (types only, from `lib/notes/operations.ts`); `graphemeCount` (`lib/notes/graphemes.ts`); `nextQuarter`, `utcToZoned`, `zonedToUtc` (`lib/notes/schedule.ts`); the note types. It must not import `lib/notes/facets.ts`, `lib/notes/read.ts` or anything `server-only`. Use `import type` for `operations.ts`.
- Produces (Task 10 uses exactly these):

```ts
export interface NoteActions {
  save(input: NoteInput): Promise<NoteActionResult>;
  publish(input: NoteInput): Promise<NoteActionResult>;
  schedule(input: NoteInput & { publishAt: string }): Promise<NoteActionResult>;
  unschedule(ref: NoteRef): Promise<NoteActionResult>;
  remove(ref: NoteRef): Promise<NoteActionResult>;
}
export interface ScheduleValue { on: boolean; date: string; time: string }
export type ComposerStatus = "idle" | "saved" | "published" | "scheduled" | "unscheduled" | "deleted" | "invalid" | "conflict" | "missing" | "unauthorized" | "unavailable";
export interface ComposerSnapshot {
  notes: Note[]; editing: Note | null; value: NoteContent; schedule: ScheduleValue;
  count: number; over: boolean; dirty: boolean; busy: boolean; uploads: number;
  status: ComposerStatus; issues: NoteIssue[]; blocked: boolean; lastSide: NoteSide;
  primary: "publish" | "schedule" | "update"; primaryLabel: string; saveLabel: string | null;
  canSave: boolean; canPrimary: boolean;
}
export class NoteComposerState {
  constructor(init: { notes: Note[]; available: boolean; side: NoteSide }, actions: NoteActions, now?: () => Date);
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => ComposerSnapshot;
  get hasUnsaved(): boolean;
  setDefaultSide(side: NoteSide): void;
  edit(patch: Partial<NoteContent>): void;
  setSchedule(patch: Partial<ScheduleValue>): void;
  addImage(image: NoteImage): void; removeImage(index: number): void; setAlt(index: number, alt: string): void;
  setLink(card: NoteLinkCard | null): void;
  uploadStarted(): void; uploadFinished(): void;
  open(id: string): void; startNew(): void;
  save(): Promise<void>; primaryAction(): Promise<void>; unschedule(): Promise<void>; remove(): Promise<void>;
}
```

Labels:

| Note being edited | `primary` | `primaryLabel` | `saveLabel` |
|---|---|---|---|
| New or draft, schedule off | `publish` | `Publish` | `Save draft` |
| New or draft, schedule on | `schedule` | `Schedule` | `Save draft` |
| Scheduled, schedule on | `schedule` | `Reschedule` | `Save` |
| Scheduled, schedule off | `publish` | `Publish now` | `Save` |
| Published | `update` | `Save` | `null` |

- [ ] **Step 1: Write the failing tests**

`tests/admin/note-composer.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { type NoteActions, NoteComposerState } from "@/lib/admin/note-composer";
import type { NoteActionResult, NoteInput, NoteRef } from "@/lib/notes/operations";
import type { Note, NoteImage } from "@/lib/notes/types";

const NOW = new Date("2026-10-04T11:07:00.000Z"); // 14:07 in Istanbul

function stored(patch: Partial<Note> = {}): Note {
  return {
    id: "n1",
    text: "Stored.",
    side: "work",
    lang: "en",
    embed: null,
    status: "draft",
    tid: null,
    publishAt: null,
    publishedAt: null,
    createdAt: "2026-10-04T10:00:00.000Z",
    updatedAt: "2026-10-04T10:00:00.000Z",
    ...patch,
  };
}

const image = (key = "media/notes/a"): NoteImage => ({ key, alt: "", width: 800, height: 600, widths: [640, 800], baseUrl: `/api/media-dev/${key}` });

function actions(overrides: Partial<NoteActions> = {}): NoteActions {
  const ok = async (input: { content?: unknown }): Promise<NoteActionResult> => ({
    status: "ok",
    note: stored({ id: "saved", ...(input.content as object), updatedAt: "2026-10-04T11:07:00.000Z" }),
  });
  return {
    save: vi.fn(ok),
    publish: vi.fn(async (input: NoteInput): Promise<NoteActionResult> => ({
      status: "ok",
      note: stored({ id: "live", ...(input.content as object), status: "published", tid: "3m2k7xq4ab2c2", publishedAt: NOW.toISOString() }),
    })),
    schedule: vi.fn(async (input: NoteInput & { publishAt: string }): Promise<NoteActionResult> => ({
      status: "ok",
      note: stored({ id: "later", ...(input.content as object), status: "scheduled", publishAt: input.publishAt }),
    })),
    unschedule: vi.fn(async (ref: NoteRef): Promise<NoteActionResult> => ({ status: "ok", note: stored({ id: ref.id, status: "draft", updatedAt: "2026-10-04T11:08:00.000Z" }) })),
    remove: vi.fn(async (ref: NoteRef): Promise<NoteActionResult> => ({ status: "ok", note: stored({ id: ref.id }) })),
    ...overrides,
  };
}

const make = (notes: Note[] = [], a = actions()) => new NoteComposerState({ notes, available: true, side: "work" }, a, () => NOW);

describe("a new note", () => {
  it("starts empty on the given side, with nothing to save or publish", () => {
    const s = make().getSnapshot();
    expect(s.value).toEqual({ text: "", side: "work", lang: "en", embed: null });
    expect(s).toMatchObject({ dirty: false, canSave: false, canPrimary: false, primaryLabel: "Publish", saveLabel: "Save draft" });
  });

  it("follows the remembered side until it is edited", () => {
    const c = make();
    c.setDefaultSide("life");
    expect(c.getSnapshot()).toMatchObject({ value: { side: "life" }, dirty: false, lastSide: "life" });
  });

  it("counts graphemes and blocks publishing past 300", () => {
    const c = make();
    c.edit({ text: "👍🏽".repeat(300) });
    expect(c.getSnapshot()).toMatchObject({ count: 300, over: false, canPrimary: true });
    c.edit({ text: "x".repeat(301) });
    expect(c.getSnapshot()).toMatchObject({ over: true, canPrimary: false, canSave: true });
  });
});

describe("saving and publishing", () => {
  it("saves a draft, then edits the stored note", async () => {
    const a = actions();
    const c = make([], a);
    c.edit({ text: "Draft." });
    await c.save();
    expect(a.save).toHaveBeenCalledWith({ id: null, expected: null, content: { text: "Draft.", side: "work", lang: "en", embed: null } });
    expect(c.getSnapshot()).toMatchObject({ status: "saved", dirty: false, editing: { id: "saved" } });
    expect(c.getSnapshot().notes.map((n) => n.id)).toEqual(["saved"]);
    c.edit({ text: "Draft two." });
    await c.save();
    expect(a.save).toHaveBeenLastCalledWith({ id: "saved", expected: "2026-10-04T11:07:00.000Z", content: expect.objectContaining({ text: "Draft two." }) });
  });

  it("publishes and clears the box for the next note, keeping the side", async () => {
    const a = actions();
    const c = make([], a);
    c.edit({ text: "Live.", side: "both" });
    await c.primaryAction();
    expect(a.publish).toHaveBeenCalledOnce();
    expect(c.getSnapshot()).toMatchObject({ status: "published", editing: null, value: { text: "", side: "both" }, dirty: false, lastSide: "both" });
    expect(c.getSnapshot().notes[0]).toMatchObject({ id: "live", status: "published" });
  });

  it("ignores a second action while one is in flight", async () => {
    let release: (r: NoteActionResult) => void = () => {};
    const a = actions({ save: vi.fn(() => new Promise<NoteActionResult>((resolve) => (release = resolve))) });
    const c = make([], a);
    c.edit({ text: "Once." });
    const first = c.save();
    expect(c.getSnapshot()).toMatchObject({ busy: true, canSave: false, canPrimary: false });
    await c.save();
    await c.primaryAction();
    release({ status: "ok", note: stored({ id: "saved", text: "Once." }) });
    await first;
    expect(a.save).toHaveBeenCalledOnce();
    expect(a.publish).not.toHaveBeenCalled();
  });

  it("shows issues until the next edit", async () => {
    const c = make([], actions({ publish: vi.fn(async () => ({ status: "invalid" as const, issues: [{ at: "embed/images/0/alt", message: "Image 1 needs alt text." }] })) }));
    c.edit({ text: "x" });
    await c.primaryAction();
    expect(c.getSnapshot()).toMatchObject({ status: "invalid", issues: [{ message: "Image 1 needs alt text." }] });
    c.edit({ text: "xy" });
    expect(c.getSnapshot()).toMatchObject({ status: "idle", issues: [] });
  });

  it("blocks every write after a conflict, but lets an unavailable store be retried", async () => {
    const conflicted = make([], actions({ save: vi.fn(async () => ({ status: "conflict" as const })) }));
    conflicted.edit({ text: "x" });
    await conflicted.save();
    expect(conflicted.getSnapshot()).toMatchObject({ status: "conflict", blocked: true, canSave: false, canPrimary: false });

    const down = make([], actions({ save: vi.fn(async () => ({ status: "unavailable" as const })) }));
    down.edit({ text: "x" });
    await down.save();
    expect(down.getSnapshot()).toMatchObject({ status: "unavailable", blocked: false, canSave: true });
  });

  it("reads a thrown action (a dropped network) as unavailable", async () => {
    const c = make([], actions({ save: vi.fn(async () => Promise.reject(new Error("offline"))) }));
    c.edit({ text: "x" });
    await c.save();
    expect(c.getSnapshot()).toMatchObject({ status: "unavailable", busy: false, dirty: true });
  });

  it("starts blocked without a database", () => {
    const c = new NoteComposerState({ notes: [], available: false, side: "work" }, actions(), () => NOW);
    c.edit({ text: "x" });
    expect(c.getSnapshot()).toMatchObject({ blocked: true, canSave: false });
  });
});

describe("scheduling", () => {
  it("turns on at the next quarter hour in Istanbul and schedules that instant", async () => {
    const a = actions();
    const c = make([], a);
    c.edit({ text: "Later." });
    c.setSchedule({ on: true });
    expect(c.getSnapshot()).toMatchObject({ schedule: { on: true, date: "2026-10-04", time: "14:15" }, primary: "schedule", primaryLabel: "Schedule" });
    c.setSchedule({ time: "09:00", date: "2026-10-06" });
    await c.primaryAction();
    expect(a.schedule).toHaveBeenCalledWith(expect.objectContaining({ publishAt: "2026-10-06T06:00:00.000Z" }));
    expect(c.getSnapshot()).toMatchObject({ status: "scheduled", editing: null });
  });

  it("offers Publish now, Reschedule, Save and Unschedule on a scheduled note", async () => {
    const a = actions();
    const c = make([stored({ status: "scheduled", publishAt: "2026-10-06T06:00:00.000Z" })], a);
    c.open("n1");
    expect(c.getSnapshot()).toMatchObject({ schedule: { on: true, date: "2026-10-06", time: "09:00" }, primaryLabel: "Reschedule", saveLabel: "Save", dirty: false });
    c.setSchedule({ on: false });
    expect(c.getSnapshot()).toMatchObject({ primary: "publish", primaryLabel: "Publish now", dirty: true });
    c.setSchedule({ on: true });
    expect(c.getSnapshot().dirty).toBe(false);
    await c.unschedule();
    expect(a.unschedule).toHaveBeenCalledWith({ id: "n1", expected: "2026-10-04T10:00:00.000Z" });
    expect(c.getSnapshot()).toMatchObject({ status: "unscheduled", schedule: { on: false }, editing: { status: "draft" } });
  });
});

describe("a published note", () => {
  it("saves in place with one Save button, enabled only when changed", async () => {
    const a = actions({
      save: vi.fn(async (input: NoteInput): Promise<NoteActionResult> => ({
        status: "ok",
        note: stored({ id: "n1", ...(input.content as object), status: "published", tid: "3m2k7xq4ab2c2", publishedAt: NOW.toISOString(), updatedAt: "2026-10-04T11:09:00.000Z" }),
      })),
    });
    const c = make([stored({ status: "published", tid: "3m2k7xq4ab2c2", publishedAt: NOW.toISOString() })], a);
    c.open("n1");
    expect(c.getSnapshot()).toMatchObject({ primary: "update", primaryLabel: "Save", saveLabel: null, canPrimary: false });
    c.edit({ text: "Fixed a typo." });
    expect(c.getSnapshot().canPrimary).toBe(true);
    await c.primaryAction();
    expect(a.save).toHaveBeenCalledOnce();
    expect(c.getSnapshot()).toMatchObject({ status: "saved", dirty: false, editing: { id: "n1", text: "Fixed a typo." } });
  });
});

describe("attachments", () => {
  it("keeps one kind: images replace a link card and a link card replaces images", () => {
    const c = make();
    c.setLink({ kind: "link", url: "https://w00f.org/", title: "", description: "", siteName: "w00f.org" });
    c.addImage(image());
    expect(c.getSnapshot().value.embed).toEqual({ kind: "images", images: [image()] });
    c.setLink({ kind: "link", url: "https://w00f.org/", title: "", description: "", siteName: "w00f.org" });
    expect(c.getSnapshot().value.embed).toMatchObject({ kind: "link" });
  });

  it("takes four images at most, edits alt text and drops the attachment with the last image", () => {
    const c = make();
    for (const key of ["a", "b", "c", "d", "e"]) c.addImage(image(`media/notes/${key}`));
    const embed = c.getSnapshot().value.embed;
    expect(embed?.kind === "images" && embed.images.map((i) => i.key)).toEqual(["media/notes/a", "media/notes/b", "media/notes/c", "media/notes/d"]);
    c.setAlt(1, "Second");
    const after = c.getSnapshot().value.embed;
    expect(after?.kind === "images" && after.images[1].alt).toBe("Second");
    for (let i = 0; i < 4; i++) c.removeImage(0);
    expect(c.getSnapshot().value.embed).toBeNull();
  });

  it("blocks saving and publishing while an upload runs", () => {
    const c = make();
    c.edit({ text: "x" });
    c.uploadStarted();
    expect(c.getSnapshot()).toMatchObject({ uploads: 1, canSave: false, canPrimary: false });
    c.uploadFinished();
    expect(c.getSnapshot()).toMatchObject({ uploads: 0, canSave: true, canPrimary: true });
  });
});

describe("deleting and switching", () => {
  it("deletes the open note and starts a new one", async () => {
    const a = actions();
    const c = make([stored()], a);
    c.open("n1");
    await c.remove();
    expect(a.remove).toHaveBeenCalledWith({ id: "n1", expected: "2026-10-04T10:00:00.000Z" });
    expect(c.getSnapshot()).toMatchObject({ status: "deleted", editing: null, notes: [] });
  });

  it("reports unsaved changes, including an action in flight", () => {
    const c = make([stored()]);
    expect(c.hasUnsaved).toBe(false);
    c.open("n1");
    c.edit({ text: "Changed." });
    expect(c.hasUnsaved).toBe(true);
    c.startNew();
    expect(c.hasUnsaved).toBe(false);
  });
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npx vitest run tests/admin/note-composer.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write the class**

`lib/admin/note-composer.ts`:

```ts
import { graphemeCount } from "@/lib/notes/graphemes";
import type { NoteActionResult, NoteInput, NoteRef } from "@/lib/notes/operations";
import { nextQuarter, utcToZoned, zonedToUtc } from "@/lib/notes/schedule";
import { MAX_GRAPHEMES, MAX_IMAGES, type Note, type NoteContent, type NoteImage, type NoteIssue, type NoteLinkCard, type NoteSide } from "@/lib/notes/types";

// The /admin/notes/ composer (Sprint 9 spec §4.1) as plain TypeScript, so it
// is tested without a DOM. components/admin/notes/notes-console.tsx binds it
// to React (useSyncExternalStore) and adds the window listeners. No autosave:
// a write happens only when the author asks for one, one at a time.

export interface NoteActions {
  save(input: NoteInput): Promise<NoteActionResult>;
  publish(input: NoteInput): Promise<NoteActionResult>;
  schedule(input: NoteInput & { publishAt: string }): Promise<NoteActionResult>;
  unschedule(ref: NoteRef): Promise<NoteActionResult>;
  remove(ref: NoteRef): Promise<NoteActionResult>;
}

export interface ScheduleValue {
  on: boolean;
  date: string;
  time: string;
}

export type ComposerStatus =
  | "idle"
  | "saved"
  | "published"
  | "scheduled"
  | "unscheduled"
  | "deleted"
  | "invalid"
  | "conflict"
  | "missing"
  | "unauthorized"
  | "unavailable";

export interface ComposerSnapshot {
  notes: Note[];
  editing: Note | null;
  value: NoteContent;
  schedule: ScheduleValue;
  count: number;
  over: boolean;
  dirty: boolean;
  busy: boolean;
  uploads: number;
  status: ComposerStatus;
  issues: NoteIssue[];
  // Writes are off until a reload: another tab won, the session ended, the
  // note is gone, or there was never a database.
  blocked: boolean;
  lastSide: NoteSide;
  primary: "publish" | "schedule" | "update";
  primaryLabel: string;
  saveLabel: string | null;
  canSave: boolean;
  canPrimary: boolean;
}

const OFF: ScheduleValue = { on: false, date: "", time: "" };
// Outcomes that end the tab's writes until a reload.
const BLOCKING: ComposerStatus[] = ["conflict", "missing", "unauthorized"];

function emptyValue(side: NoteSide): NoteContent {
  return { text: "", side, lang: "en", embed: null };
}

function contentOf(note: Note): NoteContent {
  return { text: note.text, side: note.side, lang: note.lang, embed: note.embed };
}

function scheduleOf(note: Note | null): ScheduleValue {
  if (!note || note.status !== "scheduled" || !note.publishAt) return OFF;
  return { on: true, ...utcToZoned(note.publishAt) };
}

// Schedule fields only count while the schedule is on.
function comparable(value: NoteContent, schedule: ScheduleValue): string {
  return JSON.stringify({ value, schedule: schedule.on ? schedule : OFF });
}

function byUpdated(a: Note, b: Note): number {
  return b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id);
}

export class NoteComposerState {
  private notes: Note[];
  private editing: Note | null = null;
  private value: NoteContent;
  private schedule: ScheduleValue = OFF;
  private baseline: string;
  private busy = false;
  private uploads = 0;
  private status: ComposerStatus = "idle";
  private issues: NoteIssue[] = [];
  private blocked: boolean;
  private lastSide: NoteSide;
  private listeners = new Set<() => void>();
  private snapshot: ComposerSnapshot;

  constructor(
    init: { notes: Note[]; available: boolean; side: NoteSide },
    private actions: NoteActions,
    private now: () => Date = () => new Date(),
  ) {
    this.notes = [...init.notes].sort(byUpdated);
    this.blocked = !init.available;
    this.lastSide = init.side;
    this.value = emptyValue(init.side);
    this.baseline = comparable(this.value, OFF);
    this.snapshot = this.build();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  get hasUnsaved(): boolean {
    return this.busy || this.snapshot.dirty;
  }

  private build(): ComposerSnapshot {
    const count = graphemeCount(this.value.text);
    const over = count > MAX_GRAPHEMES;
    const dirty = comparable(this.value, this.schedule) !== this.baseline;
    const status = this.editing?.status;
    const primary = status === "published" ? "update" : this.schedule.on ? "schedule" : "publish";
    const primaryLabel =
      primary === "update" ? "Save" : primary === "schedule" ? (status === "scheduled" ? "Reschedule" : "Schedule") : status === "scheduled" ? "Publish now" : "Publish";
    const saveLabel = status === "published" ? null : status === "scheduled" ? "Save" : "Save draft";
    const embed = this.value.embed;
    const hasContent = this.value.text.trim() !== "" || (embed?.kind === "images" && embed.images.length > 0);
    const free = !this.blocked && !this.busy && this.uploads === 0;
    return {
      notes: this.notes,
      editing: this.editing,
      value: this.value,
      schedule: this.schedule,
      count,
      over,
      dirty,
      busy: this.busy,
      uploads: this.uploads,
      status: this.status,
      issues: this.issues,
      blocked: this.blocked,
      lastSide: this.lastSide,
      primary,
      primaryLabel,
      saveLabel,
      canSave: free && dirty && saveLabel !== null,
      canPrimary: free && !over && hasContent && (primary !== "update" || dirty),
    };
  }

  private emit() {
    this.snapshot = this.build();
    for (const listener of this.listeners) listener();
  }

  // An edit clears the last outcome and its issues (Sprint 7 rule).
  private changed() {
    if (!BLOCKING.includes(this.status)) {
      this.status = "idle";
      this.issues = [];
    }
    this.emit();
  }

  private load(note: Note | null, side: NoteSide) {
    this.editing = note;
    this.value = note ? contentOf(note) : emptyValue(side);
    this.schedule = scheduleOf(note);
    this.baseline = comparable(this.value, this.schedule);
  }

  // The side remembered in this browser, applied to an untouched new note.
  setDefaultSide(side: NoteSide) {
    this.lastSide = side;
    if (!this.editing && !this.snapshot.dirty) this.load(null, side);
    this.emit();
  }

  edit(patch: Partial<NoteContent>) {
    this.value = { ...this.value, ...patch };
    this.changed();
  }

  setSchedule(patch: Partial<ScheduleValue>) {
    const next = { ...this.schedule, ...patch };
    // Turning it on picks the next quarter hour, unless a time is kept.
    if (next.on && (!next.date || !next.time)) Object.assign(next, utcToZoned(nextQuarter(this.now()).toISOString()));
    this.schedule = next;
    this.changed();
  }

  addImage(image: NoteImage) {
    const current = this.value.embed?.kind === "images" ? this.value.embed.images : [];
    if (current.length >= MAX_IMAGES) return;
    this.edit({ embed: { kind: "images", images: [...current, image] } });
  }

  removeImage(index: number) {
    if (this.value.embed?.kind !== "images") return;
    const images = this.value.embed.images.filter((_, i) => i !== index);
    this.edit({ embed: images.length > 0 ? { kind: "images", images } : null });
  }

  setAlt(index: number, alt: string) {
    if (this.value.embed?.kind !== "images") return;
    this.edit({ embed: { kind: "images", images: this.value.embed.images.map((image, i) => (i === index ? { ...image, alt } : image)) } });
  }

  setLink(card: NoteLinkCard | null) {
    this.edit({ embed: card });
  }

  uploadStarted() {
    this.uploads++;
    this.emit();
  }

  uploadFinished() {
    this.uploads = Math.max(0, this.uploads - 1);
    this.emit();
  }

  // The caller asks before dropping unsaved edits (LEAVE_QUESTION).
  open(id: string) {
    const note = this.notes.find((item) => item.id === id);
    if (!note) return;
    this.load(note, note.side);
    this.changed();
  }

  startNew() {
    this.load(null, this.lastSide);
    this.changed();
  }

  private input(): NoteInput {
    return { id: this.editing?.id ?? null, expected: this.editing?.updatedAt ?? null, content: this.value };
  }

  private ref(): NoteRef | null {
    return this.editing ? { id: this.editing.id, expected: this.editing.updatedAt } : null;
  }

  // One action at a time; an outcome other than ok keeps the edit.
  private async run(call: () => Promise<NoteActionResult>, onOk: (note: Note) => void) {
    if (this.busy || this.blocked) return;
    this.busy = true;
    this.emit();
    let result: NoteActionResult;
    try {
      result = await call();
    } catch {
      result = { status: "unavailable" };
    }
    this.busy = false;
    if (result.status === "ok") {
      this.notes = [result.note, ...this.notes.filter((note) => note.id !== result.note.id)].sort(byUpdated);
      this.issues = [];
      onOk(result.note);
    } else if (result.status === "invalid") {
      this.status = "invalid";
      this.issues = result.issues;
    } else {
      this.status = result.status;
      this.issues = [];
      if (BLOCKING.includes(result.status)) this.blocked = true;
    }
    this.emit();
  }

  async save() {
    if (!this.snapshot.canSave) return;
    await this.run(
      () => this.actions.save(this.input()),
      (note) => {
        this.lastSide = note.side;
        this.editing = note;
        this.baseline = comparable(contentOf(note), scheduleOf(note));
        this.status = "saved";
      },
    );
  }

  async primaryAction() {
    if (!this.snapshot.canPrimary) return;
    const { primary } = this.snapshot;
    if (primary === "update") {
      await this.run(
        () => this.actions.save(this.input()),
        (note) => {
          this.editing = note;
          this.baseline = comparable(contentOf(note), scheduleOf(note));
          this.status = "saved";
        },
      );
      return;
    }
    if (primary === "schedule") {
      const at = zonedToUtc(this.schedule.date, this.schedule.time);
      await this.run(
        () => this.actions.schedule({ ...this.input(), publishAt: at ? at.toISOString() : "invalid" }),
        (note) => {
          this.lastSide = note.side;
          this.load(null, note.side);
          this.status = "scheduled";
        },
      );
      return;
    }
    await this.run(
      () => this.actions.publish(this.input()),
      (note) => {
        this.lastSide = note.side;
        this.load(null, note.side);
        this.status = "published";
      },
    );
  }

  async unschedule() {
    const ref = this.ref();
    if (!ref || this.editing?.status !== "scheduled") return;
    await this.run(
      () => this.actions.unschedule(ref),
      (note) => {
        this.load(note, note.side);
        this.status = "unscheduled";
      },
    );
  }

  async remove() {
    const ref = this.ref();
    if (!ref) return;
    await this.run(
      () => this.actions.remove(ref),
      (note) => {
        this.notes = this.notes.filter((item) => item.id !== note.id);
        this.load(null, this.lastSide);
        this.status = "deleted";
      },
    );
  }
}
```

The ok branch of `run` upserts the note into `notes` before `onOk`, so the delete handler then filters it out again; that is intended.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run tests/admin/note-composer.test.ts && npm run typecheck && npm run lint`
Expected: PASS. If a test fails, fix the class, not the test, unless the test contradicts the label table above. In that case, report the contradiction to the controller.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/note-composer.ts tests/admin/note-composer.test.ts
git commit -m "Add the note composer's state: drafts, publish, schedule, attachments and one write at a time

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: `/admin/notes/` (mockup B) and the admin home's Notes section

**Files:**
- Create:
  - `components/admin/notes/notes-console.tsx`, `components/admin/notes/compose-box.tsx`, `components/admin/notes/attachments.tsx`, `components/admin/notes/schedule-field.tsx`, `components/admin/notes/timeline.tsx`, `components/admin/notes/note-upload.ts`
  - `app/admin/(console)/notes/page.tsx`
- Modify: `components/admin/admin-home.tsx`

**Interfaces:**
- Consumes: `NoteComposerState`, `NoteActions`, `ComposerSnapshot` (Task 9); the actions, `fetchLinkCardAction` and `processNoteUploadAction` (Task 8); `NotesConsoleInit`, `loadNotesConsole` and `noteCounts` (Task 8); `LEAVE_QUESTION`, `isSaveShortcut` and `leavesPage` (`lib/admin/leave-guard.ts`); `Button` and `buttonClass` (`components/ui/button.tsx`); `CONTROL` (`components/admin/fields.tsx`); `PictureView`; `checkNoteDimensions` and `MAX_BYTES`; `QUARTER_TIMES`, `utcToZoned`, `formatMonthDay`, `MAX_GRAPHEMES` and `MAX_IMAGES`.
- **No client module here may import `lib/notes/facets.ts`, `lib/notes/read.ts` or `lib/admin/notes.ts`** (type-only imports of `NotesConsoleInit` are fine).
- Accessible names (Task 11 relies on them exactly):

| Control | Name |
|---|---|
| Text area | label `Note` |
| Side | radiogroup `Side` with radios `Work`, `Life`, `Both` |
| Language | radiogroup `Language` with radios `EN`, `TR` |
| File input | `Add images` |
| Each image | alt text area label `Alt text <n>`, remove button `Remove image <n>` |
| Link | button `Link`, input label `Link URL`, button `Fetch card`, button `Remove link` |
| Schedule | checkbox `Schedule`, input label `Date`, select label `Time` |
| Buttons | the snapshot's `saveLabel` and `primaryLabel`, `Unschedule`, `Delete`, `Cancel` |
| Status | `p[role="status"]` |
| Timeline | filter buttons `All`, `Drafts`, `Scheduled`, `Published` (`aria-pressed`); rows are `button[data-testid="note-row"]` |
| Breadcrumb | `nav[aria-label="Breadcrumb"]` with the link `Admin` |

Status text (first match wins):

| Condition | Text |
|---|---|
| busy | `Saving…` |
| uploads | `Uploading…` |
| conflict | `This note changed in another tab. Reload to continue.` |
| missing | `This note was deleted elsewhere. Reload to continue.` |
| unauthorized | `Signed out — sign in again.` |
| unavailable | `Database unavailable — try again.` |
| blocked (no database) | `Database unavailable: notes can't be saved.` |
| invalid | `Can't publish yet:` (the issues are listed under it) |
| dirty | `Unsaved changes` |
| saved | `Draft saved` while the edited note is a draft, else `Saved` |
| published | `Published` |
| scheduled | `Scheduled` |
| unscheduled | `Unscheduled` |
| deleted | `Deleted` |
| otherwise | empty |

- [ ] **Step 1: Write the upload helper**

`components/admin/notes/note-upload.ts`:

```ts
"use client";

import { upload } from "@vercel/blob/client";
import { processNoteUploadAction } from "@/app/admin/notes-actions";
import { MAX_BYTES, checkNoteDimensions } from "@/lib/media/rules";
import type { NoteImage } from "@/lib/notes/types";

type UploadResult = Awaited<ReturnType<typeof processNoteUploadAction>>;

// Big phone photos (48 MP) would pass iOS Safari's canvas limit; 4096px on the
// long side is still more than the largest rendition (2560).
const MAX_CONVERT_SIDE = 4096;

function refused(message: string): UploadResult {
  return { status: "invalid", issues: [{ at: "embed/images", message }] };
}

// PNG and JPEG upload as they are. Anything the browser can decode (HEIC on
// an iPhone, WebP) is redrawn as a JPEG first, because the server's sharp
// can't read HEIC (spec §6).
async function prepare(file: File): Promise<File | UploadResult> {
  if (file.size > MAX_BYTES) return refused("The file is larger than 25 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return refused("This browser can't read the image. Use a PNG or JPEG.");
  }
  const problem = checkNoteDimensions(bitmap.width, bitmap.height);
  if (problem) {
    bitmap.close();
    return refused(problem);
  }
  if (file.type === "image/png" || file.type === "image/jpeg") {
    bitmap.close();
    return file;
  }
  const scale = Math.min(1, MAX_CONVERT_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return blob ? new File([blob], "note.jpg", { type: "image/jpeg" }) : refused("The image could not be converted. Use a PNG or JPEG.");
}

async function signedOut(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/upload/", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    return response.status === 401;
  } catch {
    return false;
  }
}

export async function uploadNoteImage(original: File, mode: "blob" | "local"): Promise<{ status: "ok"; image: NoteImage } | Exclude<UploadResult, { status: "ok" }>> {
  const prepared = await prepare(original);
  if (!(prepared instanceof File)) return prepared as Exclude<UploadResult, { status: "ok" }>;
  let source: string;
  if (mode === "blob") {
    const extension = prepared.type === "image/png" ? "png" : "jpg";
    try {
      const blob = await upload(`uploads/notes/${crypto.randomUUID()}.${extension}`, prepared, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/",
        contentType: prepared.type,
      });
      source = blob.url;
    } catch (e) {
      if (await signedOut()) return { status: "unauthorized" };
      throw e;
    }
  } else {
    const response = await fetch("/api/admin/upload-dev/", { method: "POST", headers: { "content-type": prepared.type }, body: prepared });
    if (response.status === 401) return { status: "unauthorized" };
    const data = (await response.json()) as { source?: string; error?: string };
    if (!response.ok || !data.source) return refused(data.error ?? "The upload failed. Try again.");
    source = data.source;
  }
  return processNoteUploadAction({ source });
}
```

- [ ] **Step 2: Write the components**

`components/admin/notes/schedule-field.tsx`:

```tsx
"use client";

import type { ComposerSnapshot, NoteComposerState } from "@/lib/admin/note-composer";
import { QUARTER_TIMES } from "@/lib/notes/schedule";
import { CONTROL } from "../fields";

// Schedule: off by default; on, a date and a quarter-hour time in Istanbul.
// A published note can't be scheduled, so it shows nothing.
export function ScheduleField({ composer, snap, disabled }: { composer: NoteComposerState; snap: ComposerSnapshot; disabled: boolean }) {
  if (snap.editing?.status === "published") return null;
  const { schedule } = snap;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-h-8 items-center gap-2 type-body">
        <input type="checkbox" checked={schedule.on} disabled={disabled} onChange={(event) => composer.setSchedule({ on: event.target.checked })} />
        Schedule
      </label>
      {schedule.on ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="type-label text-fg-muted">Date</span>
            <input type="date" value={schedule.date} disabled={disabled} onChange={(event) => composer.setSchedule({ date: event.target.value })} className={CONTROL} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="type-label text-fg-muted">Time</span>
            <select value={schedule.time} disabled={disabled} onChange={(event) => composer.setSchedule({ time: event.target.value })} className={CONTROL}>
              {QUARTER_TIMES.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <span className="pb-1.5 type-meta text-fg-muted">Istanbul</span>
        </>
      ) : null}
    </div>
  );
}
```

`components/admin/notes/attachments.tsx`:

```tsx
"use client";

import { useState } from "react";
import { fetchLinkCardAction } from "@/app/admin/notes-actions";
import { PictureView } from "@/components/picture-view";
import { Button, buttonClass } from "@/components/ui/button";
import type { ComposerSnapshot, NoteComposerState } from "@/lib/admin/note-composer";
import { cx } from "@/lib/cx";
import { MAX_IMAGES } from "@/lib/notes/types";
import { CONTROL } from "../fields";
import { uploadNoteImage } from "./note-upload";

// One attachment per note: up to four images (alt text required to publish)
// or one link card. Switching kinds asks first when the other has content.
export function Attachments({
  composer,
  snap,
  uploadMode,
  disabled,
}: {
  composer: NoteComposerState;
  snap: ComposerSnapshot;
  uploadMode: "blob" | "local" | null;
  disabled: boolean;
}) {
  const embed = snap.value.embed;
  const images = embed?.kind === "images" ? embed.images : [];
  const [linkOpen, setLinkOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showLink = linkOpen || embed?.kind === "link";

  async function pick(list: FileList | null) {
    if (!list || !uploadMode) return;
    if (composer.getSnapshot().value.embed?.kind === "link" && !window.confirm("Replace the link card with images?")) return;
    setLinkOpen(false);
    setError(null);
    const room = MAX_IMAGES - images.length;
    for (const file of Array.from(list).slice(0, room)) {
      composer.uploadStarted();
      try {
        const result = await uploadNoteImage(file, uploadMode);
        if (result.status === "ok") composer.addImage(result.image);
        else if (result.status === "invalid") setError(result.issues.map((issue) => issue.message).join(" "));
        else setError(result.status === "unauthorized" ? "Signed out — sign in again." : "The upload failed. Try again.");
      } catch {
        setError("The upload failed. Try again.");
      } finally {
        composer.uploadFinished();
      }
    }
  }

  function openLink() {
    if (images.length > 0 && !window.confirm("Replace the images with a link card?")) return;
    if (images.length > 0) composer.setLink(null);
    setLinkOpen(true);
  }

  const full = images.length >= MAX_IMAGES;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {uploadMode ? (
          <label className={cx(buttonClass("ghost"), "relative cursor-pointer", (disabled || full) && "pointer-events-none opacity-40")}>
            Images
            <input
              type="file"
              accept="image/*"
              multiple
              aria-label="Add images"
              disabled={disabled || full}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(event) => {
                void pick(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        ) : (
          <span className="type-meta text-fg-muted">Uploads are off: no media store is configured.</span>
        )}
        <Button variant="ghost" onClick={openLink} disabled={disabled || embed?.kind === "link"}>
          Link
        </Button>
      </div>
      {error ? (
        <p role="alert" className="type-meta text-danger">
          {error}
        </p>
      ) : null}
      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={`${index}-${image.key}`} className="flex flex-col gap-1">
              <div className="relative aspect-square overflow-hidden border">
                <PictureView image={image.key} entry={image} alt="" sizes="160px" className="block h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() => composer.removeImage(index)}
                  disabled={disabled}
                  className="absolute top-1 right-1 h-7 w-7 bg-bg type-body text-fg"
                >
                  ×
                </button>
              </div>
              <label className="flex flex-col gap-1">
                <span className="type-label text-fg-muted">Alt text {index + 1}</span>
                <textarea
                  rows={2}
                  value={image.alt}
                  disabled={disabled}
                  onChange={(event) => composer.setAlt(index, event.target.value)}
                  className={cx(CONTROL, "resize-y")}
                />
              </label>
            </li>
          ))}
        </ul>
      ) : null}
      {showLink ? <LinkField composer={composer} snap={snap} disabled={disabled} onClose={() => setLinkOpen(false)} /> : null}
    </div>
  );
}

function LinkField({ composer, snap, disabled, onClose }: { composer: NoteComposerState; snap: ComposerSnapshot; disabled: boolean; onClose: () => void }) {
  const card = snap.value.embed?.kind === "link" ? snap.value.embed : null;
  const [url, setUrl] = useState(card?.url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchCard() {
    setBusy(true);
    setError(null);
    try {
      const result = await fetchLinkCardAction(url);
      if (result.status === "ok") composer.setLink(result.card);
      else setError(result.status === "invalid" ? result.issues[0].message : "Signed out — sign in again.");
    } catch {
      setError("Fetching the card failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="type-label text-fg-muted">Link URL</span>
          <input type="url" inputMode="url" value={url} disabled={disabled} onChange={(event) => setUrl(event.target.value)} className={CONTROL} />
        </label>
        <Button variant="ghost" onClick={() => void fetchCard()} disabled={disabled || busy || url.trim() === ""}>
          {busy ? "Fetching…" : "Fetch card"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="type-meta text-danger">
          {error}
        </p>
      ) : null}
      {card ? (
        <div className="flex items-start justify-between gap-3 border px-3 py-2">
          <div className="min-w-0">
            <p className="truncate type-body">{card.title || card.url}</p>
            <p className="type-meta text-fg-muted">{card.siteName}</p>
          </div>
          <Button
            variant="text"
            disabled={disabled}
            onClick={() => {
              composer.setLink(null);
              setUrl("");
              onClose();
            }}
          >
            Remove link
          </Button>
        </div>
      ) : null}
    </div>
  );
}
```

`components/admin/notes/compose-box.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import type { ComposerSnapshot, NoteComposerState } from "@/lib/admin/note-composer";
import { cx } from "@/lib/cx";
import { MAX_GRAPHEMES, type NoteLang, type NoteSide } from "@/lib/notes/types";
import { CONTROL } from "../fields";
import { Attachments } from "./attachments";
import { ScheduleField } from "./schedule-field";

const STATUS_WORD = { draft: "Draft", scheduled: "Scheduled", published: "Published" } as const;

export function statusText(snap: ComposerSnapshot): string {
  if (snap.busy) return "Saving…";
  if (snap.uploads > 0) return "Uploading…";
  switch (snap.status) {
    case "conflict":
      return "This note changed in another tab. Reload to continue.";
    case "missing":
      return "This note was deleted elsewhere. Reload to continue.";
    case "unauthorized":
      return "Signed out — sign in again.";
    case "unavailable":
      return "Database unavailable — try again.";
  }
  if (snap.blocked) return "Database unavailable: notes can't be saved.";
  if (snap.status === "invalid") return "Can't publish yet:";
  if (snap.dirty) return "Unsaved changes";
  switch (snap.status) {
    case "saved":
      return snap.editing?.status === "draft" ? "Draft saved" : "Saved";
    case "published":
      return "Published";
    case "scheduled":
      return "Scheduled";
    case "unscheduled":
      return "Unscheduled";
    case "deleted":
      return "Deleted";
    default:
      return "";
  }
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (next: T) => void;
  disabled: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-control border">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          disabled={disabled}
          onClick={() => onChange(key)}
          className={cx("min-h-8 px-3 type-meta", value === key ? "bg-fg text-bg" : "text-fg hover:bg-line")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

// Mockup B's compose box: always on top of /admin/notes/.
export function ComposeBox({
  composer,
  snap,
  uploadMode,
  onNew,
}: {
  composer: NoteComposerState;
  snap: ComposerSnapshot;
  uploadMode: "blob" | "local" | null;
  onNew: () => void;
}) {
  const disabled = snap.busy || snap.blocked;
  const left = MAX_GRAPHEMES - snap.count;
  return (
    <section aria-label="Compose" className="flex flex-col gap-3">
      {snap.editing ? (
        <div className="flex items-baseline justify-between gap-3 type-meta text-fg-muted">
          <span>Editing · {STATUS_WORD[snap.editing.status]}</span>
          <button type="button" onClick={onNew} className="hover:text-fg">
            Cancel
          </button>
        </div>
      ) : null}
      <label className="flex flex-col gap-1">
        <span className="type-label text-fg-muted">Note</span>
        <textarea
          rows={4}
          value={snap.value.text}
          disabled={disabled}
          lang={snap.value.lang}
          placeholder="What are you making?"
          onChange={(event) => composer.edit({ text: event.target.value })}
          className={cx(CONTROL, "min-h-24 resize-y")}
        />
      </label>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmented<NoteSide>
          label="Side"
          options={[
            ["work", "Work"],
            ["life", "Life"],
            ["both", "Both"],
          ]}
          value={snap.value.side}
          onChange={(side) => composer.edit({ side })}
          disabled={disabled}
        />
        <Segmented<NoteLang>
          label="Language"
          options={[
            ["en", "EN"],
            ["tr", "TR"],
          ]}
          value={snap.value.lang}
          onChange={(lang) => composer.edit({ lang })}
          disabled={disabled}
        />
        <span aria-live="polite" className={cx("ml-auto type-meta", snap.over ? "text-danger" : "text-fg-muted")}>
          {left} left
        </span>
      </div>
      <Attachments composer={composer} snap={snap} uploadMode={uploadMode} disabled={disabled} />
      <ScheduleField composer={composer} snap={snap} disabled={disabled} />
      <div className="flex flex-wrap items-center gap-2">
        <p role="status" className="mr-auto type-meta text-fg-muted">
          {statusText(snap)}
        </p>
        {snap.editing ? (
          <Button
            variant="text"
            disabled={disabled}
            onClick={() => {
              if (window.confirm("Delete this note? This can't be undone.")) void composer.remove();
            }}
          >
            Delete
          </Button>
        ) : null}
        {snap.editing?.status === "scheduled" ? (
          <Button variant="ghost" disabled={disabled} onClick={() => void composer.unschedule()}>
            Unschedule
          </Button>
        ) : null}
        {snap.saveLabel ? (
          <Button variant="ghost" disabled={!snap.canSave} onClick={() => void composer.save()}>
            {snap.saveLabel}
          </Button>
        ) : null}
        <Button variant="primary" disabled={!snap.canPrimary} onClick={() => void composer.primaryAction()}>
          {snap.primaryLabel}
        </Button>
      </div>
      {snap.issues.length > 0 ? (
        <ul className="flex flex-col gap-0.5 type-meta text-danger">
          {snap.issues.map((issue) => (
            <li key={`${issue.at}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
```

`components/admin/notes/timeline.tsx`:

```tsx
"use client";

import { cx } from "@/lib/cx";
import { formatMonthDay } from "@/lib/format";
import { utcToZoned } from "@/lib/notes/schedule";
import type { Note } from "@/lib/notes/types";

export type Filter = "all" | "draft" | "scheduled" | "published";

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["draft", "Drafts"],
  ["scheduled", "Scheduled"],
  ["published", "Published"],
];

const SIDE = { work: "Work", life: "Life", both: "Both" } as const;

function firstLine(note: Note): string {
  const line = note.text.split("\n")[0]?.trim();
  if (line) return line;
  if (note.embed?.kind === "images") return note.embed.images.length === 1 ? "1 image" : `${note.embed.images.length} images`;
  return "Empty note";
}

// Draft · "Oct 6 · 09:00" (scheduled, in the accent) · "Oct 4 · Work" (published).
function Pill({ note }: { note: Note }) {
  const base = "shrink-0 border px-1.5 type-label";
  if (note.status === "draft") return <span className={cx(base, "text-fg-muted")}>Draft</span>;
  if (note.status === "scheduled" && note.publishAt) {
    return <span className={cx(base, "border-accent text-accent")}>{`${formatMonthDay(note.publishAt)} · ${utcToZoned(note.publishAt).time}`}</span>;
  }
  return <span className={cx(base, "text-fg-muted")}>{`${formatMonthDay(note.publishedAt ?? note.updatedAt)} · ${SIDE[note.side]}`}</span>;
}

// Mockup B's timeline: every note in one list, filtered by status; a row loads
// its note into the compose box.
export function Timeline({
  notes,
  filter,
  onFilter,
  activeId,
  onOpen,
}: {
  notes: Note[];
  filter: Filter;
  onFilter: (next: Filter) => void;
  activeId: string | null;
  onOpen: (id: string) => void;
}) {
  const shown = filter === "all" ? notes : notes.filter((note) => note.status === filter);
  return (
    <section aria-label="Notes" className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 type-meta">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => onFilter(key)}
            className={filter === key ? "text-fg underline underline-offset-[0.2em]" : "text-fg-muted hover:text-fg"}
          >
            {label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="type-meta text-fg-muted">No notes here yet.</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((note) => (
            <li key={note.id} className="border-t">
              <button
                type="button"
                data-testid="note-row"
                aria-current={note.id === activeId ? "true" : undefined}
                onClick={() => onOpen(note.id)}
                className={cx("flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left", note.id === activeId && "text-accent")}
              >
                <span className="min-w-0 truncate type-body">{firstLine(note)}</span>
                <Pill note={note} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

`components/admin/notes/notes-console.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { deleteNoteAction, publishNoteAction, saveNoteAction, scheduleNoteAction, unscheduleNoteAction } from "@/app/admin/notes-actions";
import { LEAVE_QUESTION, isSaveShortcut, leavesPage } from "@/lib/admin/leave-guard";
import { type NoteActions, NoteComposerState } from "@/lib/admin/note-composer";
import type { NotesConsoleInit } from "@/lib/admin/notes";
import type { NoteSide } from "@/lib/notes/types";
import { ComposeBox } from "./compose-box";
import { type Filter, Timeline } from "./timeline";

const ACTIONS: NoteActions = {
  save: saveNoteAction,
  publish: publishNoteAction,
  schedule: scheduleNoteAction,
  unschedule: unscheduleNoteAction,
  remove: deleteNoteAction,
};

// The side a new note starts on, remembered per browser (spec §4.1).
const SIDE_KEY = "notes.lastSide";

function readSide(): NoteSide {
  try {
    const side = window.localStorage.getItem(SIDE_KEY);
    return side === "life" || side === "both" ? side : "work";
  } catch {
    return "work";
  }
}

// /admin/notes/ (mockup B): the compose box on top, the timeline below. Leaving
// with an unsaved note asks first and never saves (Sprint 7 rule); Cmd/Ctrl+S
// saves; closing the tab asks too.
export function NotesConsole({ init }: { init: NotesConsoleInit }) {
  const [composer] = useState(() => new NoteComposerState({ notes: init.notes, available: init.available, side: "work" }, ACTIONS));
  const snap = useSyncExternalStore(composer.subscribe, composer.getSnapshot, composer.getSnapshot);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    composer.setDefaultSide(readSide());
  }, [composer]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDE_KEY, snap.lastSide);
    } catch {
      // Private mode or blocked storage: the default side is simply Work.
    }
  }, [snap.lastSide]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (composer.hasUnsaved) event.preventDefault();
    }
    function onClick(event: MouseEvent) {
      if (!composer.hasUnsaved || !(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const target = { href: anchor.href, target: anchor.target, download: anchor.hasAttribute("download") };
      if (!leavesPage(event, target, window.location.href)) return;
      if (window.confirm(LEAVE_QUESTION)) return;
      event.preventDefault();
      event.stopPropagation();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (!isSaveShortcut(event)) return;
      event.preventDefault();
      void composer.save();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [composer]);

  function leaveCurrent(): boolean {
    return !composer.hasUnsaved || window.confirm(LEAVE_QUESTION);
  }

  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-8 px-4 py-6">
      <nav aria-label="Breadcrumb" className="type-meta text-fg-muted">
        <Link href="/admin/" className="hover:text-fg">
          Admin
        </Link>{" "}
        / <span className="text-fg">Notes</span>
      </nav>
      <ComposeBox
        composer={composer}
        snap={snap}
        uploadMode={init.uploadMode}
        onNew={() => {
          if (leaveCurrent()) composer.startNew();
        }}
      />
      <Timeline
        notes={snap.notes}
        filter={filter}
        onFilter={setFilter}
        activeId={snap.editing?.id ?? null}
        onOpen={(id) => {
          if (!leaveCurrent()) return;
          composer.open(id);
          window.scrollTo({ top: 0 });
        }}
      />
    </main>
  );
}
```

`app/admin/(console)/notes/page.tsx`:

```tsx
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { NotesConsole } from "@/components/admin/notes/notes-console";
import { loadNotesConsole } from "@/lib/admin/notes";
import { requireAdminPage } from "@/lib/auth/admin";

// Image uploads render their renditions inside this page's server actions.
export const maxDuration = 60;

export default function NotesAdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/notes/");
  return <NotesConsole init={await loadNotesConsole()} />;
}
```

`components/admin/admin-home.tsx`:
- Add `noteCounts()` to the `Promise.all`.
- Add this section between "Selected work" and "Sources" (import `noteCounts` from `@/lib/admin/notes`):

```tsx
      <Section
        title="Notes"
        action={
          <Link href="/admin/notes/" className={buttonClass("ghost")}>
            New note
          </Link>
        }
      >
        <p className="type-body">
          <Link href="/admin/notes/" className="text-accent hover:underline">
            All notes
          </Link>{" "}
          <span className="type-meta text-fg-muted">
            {counts ? `· ${counts.drafts} drafts · ${counts.scheduled} scheduled · ${counts.published} published` : "· database unavailable"}
          </span>
        </p>
      </Section>
```

- [ ] **Step 3: Check it in a browser**

Run: `npm run typecheck && npm run lint && npm test && npm run build`, then serve the build the same way the admin e2e does:

```bash
CONTENT_STORE_FILE=.e2e-admin/content.json MEDIA_DEV_DIR=.e2e-admin/media ADMIN_E2E=1 ADMIN_GITHUB_ID=1 AUTH_SECRET=e2e-only-secret-e2e-only-secret-000000 DATABASE_URL= BLOB_READ_WRITE_TOKEN= npm run start -- --port 3221
```

Open `http://localhost:3221/api/auth/test-signin/?next=/admin/notes/` and do the following:
1. Write a note, choose Work and Save draft.
2. Reload and open it from the timeline.
3. Publish it, then check `/` and `/notes/`.

Then repeat at a 375px viewport. Expected: no horizontal scroll, the controls wrap, and the rows are at least 44px tall. Stop the server and run a plain `npm run build`.

- [ ] **Step 4: Commit**

```bash
git add components/admin "app/admin/(console)/notes"
git commit -m "Add /admin/notes/: a compose box over a filtered timeline, usable on a phone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: The admin e2e for notes

**Files:**
- Create: `e2e-admin/notes.spec.ts`
- Modify: `playwright.admin.config.ts` (add `SYNC_SECRET: "e2e-sync-secret"` to `webServer.env`), `e2e-admin/editor.spec.ts` (the admin home test also expects a `Notes` heading)

**Interfaces:**
- Consumes: the accessible names from Task 10; `notesFileFor` (Task 2); `LEAVE_QUESTION`; `.e2e-admin/fixtures/four-three.png` (made by the existing global setup).

- [ ] **Step 1: Write the spec**

In `e2e-admin/editor.spec.ts`, change the first test's list to `["Pages", "Home", "Selected work", "Notes", "Sources"]`.

`e2e-admin/notes.spec.ts`:

```ts
import { readFileSync, writeFileSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import { LEAVE_QUESTION } from "../lib/admin/leave-guard";
import { notesFileFor } from "../lib/notes/file-store";
import { TID_PATTERN } from "../lib/notes/tid";
import type { Note } from "../lib/notes/types";

test.describe.configure({ mode: "serial" });

const NOTES_FILE = notesFileFor(".e2e-admin/content.json");
const SECRET = "e2e-sync-secret";

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

const status = (page: Page) => page.locator('p[role="status"]:visible').first();
const box = (page: Page) => page.getByLabel("Note", { exact: true });
const row = (page: Page, text: string) => page.getByTestId("note-row").filter({ hasText: text });

async function publishDue(page: Page): Promise<number> {
  const response = await page.request.post("/api/notes/publish-due/", { headers: { Authorization: `Bearer ${SECRET}` } });
  expect(response.status()).toBe(200);
  return ((await response.json()) as { published: number }).published;
}

test("a draft is saved by hand, survives a reload, then publishes to the home and /notes/", async ({ page }) => {
  await signIn(page, "/admin/notes/");
  await box(page).fill("E2E draft note");
  await page.getByRole("radio", { name: "Work" }).click();
  await expect(status(page)).toHaveText("Unsaved changes");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(status(page)).toHaveText("Draft saved");

  await page.reload();
  await expect(row(page, "E2E draft note")).toContainText("Draft");
  await row(page, "E2E draft note").click();
  await expect(box(page)).toHaveValue("E2E draft note");
  await box(page).fill("E2E published note, see w00f.org");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(status(page)).toHaveText("Published");
  await expect(box(page)).toHaveValue("");

  await page.goto("/");
  await expect(page.locator("#notes article").first()).toContainText("E2E published note");
  await expect(page.locator("#notes article").first().getByRole("link", { name: "w00f.org" })).toHaveAttribute("href", "https://w00f.org");
  await page.goto("/notes/");
  await page.locator("main article").first().locator("time").click();
  await expect(page).toHaveURL(/\/notes\/[2-7a-z]{13}\/$/);
  expect(page.url().split("/").at(-2)).toMatch(TID_PATTERN);
});

test("editing a published note keeps its URL; deleting it makes the URL a 404", async ({ page }) => {
  await page.goto("/notes/");
  await page.locator("main article").first().locator("time").click();
  const url = page.url();

  await signIn(page, "/admin/notes/");
  await page.getByRole("button", { name: "Published", exact: true }).click();
  await row(page, "E2E published note").click();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await box(page).fill("E2E edited note");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(status(page)).toHaveText("Saved");

  await page.goto(url);
  await expect(page.locator("main article")).toContainText("E2E edited note");

  await signIn(page, "/admin/notes/");
  await row(page, "E2E edited note").click();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(status(page)).toHaveText("Deleted");
  expect((await page.goto(url))?.status()).toBe(404);
});

test("a scheduled Life note goes live only when publish-due runs after its time", async ({ page }) => {
  await signIn(page, "/admin/notes/");
  await box(page).fill("E2E scheduled note");
  await page.getByRole("radio", { name: "Life" }).click();
  await page.getByLabel("Schedule").check();
  await expect(page.getByLabel("Time")).toHaveValue(/^\d{2}:(00|15|30|45)$/);
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(status(page)).toHaveText("Scheduled");
  await page.getByRole("button", { name: "Scheduled", exact: true }).click();
  await expect(row(page, "E2E scheduled note")).toContainText(/\d{2}:\d{2}/);

  expect(await publishDue(page)).toBe(0);
  await page.goto("/life/notes/");
  await expect(page.locator("main")).not.toContainText("E2E scheduled note");

  // Move it into the past, as if its quarter hour had come.
  const data = JSON.parse(readFileSync(NOTES_FILE, "utf8")) as { notes: Record<string, Note> };
  const note = Object.values(data.notes).find((n) => n.text === "E2E scheduled note")!;
  note.publishAt = new Date(Date.now() - 60_000).toISOString();
  writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2));

  expect(await publishDue(page)).toBe(1);
  await page.goto("/life/notes/");
  await expect(page.locator("main article").first()).toContainText("E2E scheduled note");
  await page.goto("/life/");
  await expect(page.getByRole("region", { name: "Now" })).toContainText("note: E2E scheduled note");
  expect(await publishDue(page)).toBe(0);
});

test("an image needs alt text to publish; a link card replaces images after a confirm", async ({ page }) => {
  await signIn(page, "/admin/notes/");
  await box(page).fill("E2E image note");
  await page.getByRole("radio", { name: "Work" }).click();
  await page.getByLabel("Add images").setInputFiles(".e2e-admin/fixtures/four-three.png");
  await expect(page.getByLabel("Alt text 1")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(status(page)).toHaveText("Can't publish yet:");
  await expect(page.getByText("Image 1 needs alt text.")).toBeVisible();

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Link" }).click();
  await expect(page.getByLabel("Alt text 1")).toHaveCount(0);
  await page.getByLabel("Link URL").fill("https://example.com/");
  await page.getByRole("button", { name: "Fetch card" }).click();
  await expect(page.getByRole("button", { name: "Remove link" })).toBeVisible({ timeout: 15_000 });

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByLabel("Add images").setInputFiles(".e2e-admin/fixtures/four-three.png");
  await page.getByLabel("Alt text 1").fill("A blue square");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(status(page)).toHaveText("Published");
  await page.goto("/notes/");
  await expect(page.locator("main article").first().locator("img")).toHaveAttribute("alt", "A blue square");
});

test("leaving with an unsaved note asks first", async ({ page }) => {
  await signIn(page, "/admin/notes/");
  await box(page).fill("E2E unsaved");
  const asked = page.waitForEvent("dialog").then(async (dialog) => {
    const message = dialog.message();
    await dialog.dismiss();
    return message;
  });
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Admin" }).click();
  expect(await asked).toBe(LEAVE_QUESTION);
  await expect(page).toHaveURL(/\/admin\/notes\/$/);
  await expect(box(page)).toHaveValue("E2E unsaved");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("composes, uploads and publishes without sideways scrolling", async ({ page }) => {
    await signIn(page, "/admin/notes/");
    await box(page).fill("E2E phone note");
    await page.getByRole("radio", { name: "Both" }).click();
    await page.getByLabel("Add images").setInputFiles(".e2e-admin/fixtures/four-three.png");
    await page.getByLabel("Alt text 1").fill("From the phone run");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    const rowBox = await page.getByTestId("note-row").first().boundingBox();
    expect(rowBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(status(page)).toHaveText("Published");
    await page.goto("/life/notes/");
    await expect(page.locator("main article").first()).toContainText("E2E phone note");
  });
});
```

- [ ] **Step 2: Run it**

Run: `npm run build && npm run e2e:admin && npm run build`
Expected: PASS, including the existing editor spec.

If the link card test fails only because the e2e machine has no network, the card still shows. `fetchLinkCard` fails soft to a bare `example.com` card, and `Remove link` appears either way. So a failure there is a real bug.

- [ ] **Step 3: Commit**

```bash
git add e2e-admin playwright.admin.config.ts
git commit -m "Cover notes in the admin e2e: drafts, publish, edit, delete, schedule, images, links and a phone run

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Docs, errata and the full CI run

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-04-sprint-9-notes-design.md` (Errata), `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md` (roadmap row)
- Create: `docs/superpowers/plans/2026-10-04-sprint-9-followups.md`

- [ ] **Step 1: CLAUDE.md**

1. Add the spec link under the others.
2. Add `npm run e2e:admin` needs the `SYNC_SECRET` from `playwright.admin.config.ts` (already set there) to the commands note, and add `SYNC_SECRET` as "also the bearer for `POST /api/notes/publish-due/`" in Environment.
3. Add a `## Notes (Sprint 9)` section after "Resume and Book a call" with these bullets (one line each):
   - **Model.** `lib/notes/`: Bluesky-shaped notes:
     - at most 300 graphemes of plain text;
     - one embed: 1–4 images (any ratio from 1:3 to 3:1, alt required to publish) or a link card;
     - `side` is work/life/both and `lang` is en/tr;
     - the id is a TID, set at first publish and never changed.
     Drafts may break the rules; `publishIssues` holds the publish rules.
   - **Facets** come from `@atproto/api` `RichText` (`lib/notes/facets.ts`, server only). Never import it from a client module; client code counts with `lib/notes/graphemes.ts`.
   - **Storage.**
     - The `notes` table (`DrizzleNoteStore`), or `FileNoteStore` at `<CONTENT_STORE_FILE minus .json>.notes.json` in dev and e2e (`getNoteStore`).
     - The contract is `tests/helpers/note-store-contract.ts`.
     - Writes are optimistic on `updatedAt`.
   - **Reads.** Pages read only `getPublishedNotes()` (tag `notes`) plus the pure views in `lib/notes/views.ts`. In fixture mode it serves `fixtureNotes()` (33 Work-side notes, so `/notes/` has two pages).
   - **Routes.**
     - `/notes/`, `/notes/page/<n>/` and `/notes/<tid>/` cover Work and both-side notes; `/life/notes/**` covers Life and both.
     - A both-side note is canonical on Work.
     - `generateStaticParams` returns a placeholder (`PLACEHOLDER_TID`, page `2`) when empty, because cacheComponents needs one param.
   - **Writes.**
     - The actions are in `app/admin/notes-actions.ts`, over `lib/notes/operations.ts`, and call `updateTag("notes")`.
     - `/admin/notes/` is mockup B, and its logic is `NoteComposerState` (`lib/admin/note-composer.ts`, plain TS, tested).
     - No autosave, and one write at a time.
     - Publish and Schedule clear the box.
     - A published note has a single Save, and it keeps its TID and date.
   - **Scheduling.**
     - Times are quarter hours in Istanbul.
     - `POST /api/notes/publish-due/` (bearer `SYNC_SECRET`) flips due notes, gives each a TID from its scheduled time, and calls `revalidateTag("notes", { expire: 0 })`.
     - `.github/workflows/publish-notes.yml` on `master` calls it at :01/:16/:31/:46 and warms `/`, `/notes/`, `/life/`, `/life/notes/` and `/feed.xml` when something went live.
   - **Uploads.**
     - `processNoteUploadAction` uses `checkNoteDimensions` and the key `media/notes/<hash16>`.
     - The browser converts non-PNG/JPEG files (HEIC, WebP) to JPEG first, capped at 4096px.
     - `NoteImage` carries its rendition fields, so notes never look up `media`.
   - **Feed.** `/feed.xml` (`lib/feed/rss.ts`) holds all notes plus photos, newest 50. Note items have no title. Images are the ≤1280 JPEG rendition, as absolute URLs.
4. Update the home bullet in "Design system" so the row list reads identity, Lab, Selected work, **Notes**, Experience, Contributions (with "Notes hidden while there are no Work notes").

- [ ] **Step 2: Errata in the spec**

Append `## Errata (implementation)` to the spec, one bullet per deviation:
- **Dates.** Lists outside `/notes/` always show the year ("Oct 4, 2026"): a prerendered page can't know the current year. Under a year label they show "Oct 4".
- **HEIC.** There was no HEIC spike. The browser converts any non-PNG/JPEG file to JPEG before upload (`components/admin/notes/note-upload.ts`). A real iPhone upload on production is a follow-up check.
- **Facets** come from `@atproto/api` 0.23.0 `RichText` (spike on 2026-10-04: identical grapheme counts, and no false positives on file names). Link text renders as written, not shortened.
- **The Life section's action** reads "All", like every other Life section, not "All notes".
- **The scheduled pill** uses the accent token, because amber isn't a token.
- **Notes in dev and e2e** live in a sibling JSON file (`<content store>.notes.json`).

- [ ] **Step 3: The foundation spec**

In its roadmap table, change the Sprint 9 row to `Notes — done: see 2026-10-04-sprint-9-notes-design.md`.

- [ ] **Step 4: The follow-ups file**

`docs/superpowers/plans/2026-10-04-sprint-9-followups.md` gets one checkbox per item:

**Before merge (Onur, on the Vercel preview):**
- [ ] The draft copy: "What I'm making, in short." and "Off the clock."
- [ ] The look of the home Notes row, `/notes/` and a note page.

**After merge (production):**
- [ ] The migration ran: the `notes` table exists.
- [ ] A first real note from Onur's phone, with a photo (HEIC conversion).
- [ ] A scheduled note goes live within ~10 minutes of its time.
- [ ] `/feed.xml` validates (W3C feed validator).

**Controller (Task 13):**
- [ ] Push `publish-notes.yml` and the `sync.yml` warm-up cleanup to `master`, **after** the merge, so the cron never calls a missing endpoint.

**Later:**
- [ ] Bluesky cross-posting.
- [ ] Media cleanup for deleted notes' Blob files.

- [ ] **Step 5: The full CI run**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e && npm run e2e:admin && SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures && npm run build`
Expected: everything passes, and the last build is a plain one.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md docs
git commit -m "Document Sprint 9: notes, scheduling, the feed and the follow-ups

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Visual review, final review, the PR and the cron (controller)

Nothing here is dispatched to an implementer.

- [ ] **Step 1: Visual review**

Run `npm run screenshots -- .superpowers/sprint-9-shots / /notes/ /notes/page/2/ /life/ /life/notes/` against a `SOURCE_FIXTURES=1` build, plus one note page per side (take the TIDs from `fixtureNotes()`). Then check:
- the rows line up with the home grid;
- the hairlines and the Doto years;
- the frames are clamped;
- the link card;
- the dark Life version;
- 390px.

Then sign in on a plain build and screenshot `/admin/notes/` at 1440px and at 375px. Fix what's off, re-run the affected e2e, and commit.

- [ ] **Step 2: Final review**

Dispatch an **opus** reviewer over the whole branch (`git diff v2...sprint-9`) against the spec and this plan. Pay special attention to:
- `NoteComposerState`;
- the publish-due path;
- `@atproto/api` staying out of client bundles: check `.next/static` with `grep -rl "detectFacets" .next/static`, which must find nothing;
- the fail-soft reads.

Apply the fixes in one wave and re-run the full CI line from Task 12.

- [ ] **Step 3: The PR**

Push `sprint-9` and open a PR into `v2`. The body gives a summary, the spec link and the follow-ups link, and ends with the attribution line. Bind it with `ccd_pr`. Ask Onur (AskUserQuestion) to check the preview and approve the merge; a merge to `v2` is a production deploy.

- [ ] **Step 4: After Onur merges, the cron on `master` (ask Onur first: pushing `master` is outward)**

In the main checkout on `master`:
1. Add `.github/workflows/publish-notes.yml`:

```yaml
name: Publish scheduled notes

# Lives on master because GitHub only runs scheduled workflows from the
# default branch. Calls the v2 site's publish-due endpoint one minute after
# each quarter hour; skipped until the SITE_URL repository variable is set.
on:
  schedule:
    - cron: "1,16,31,46 * * * *"
  workflow_dispatch:

# No token scopes needed: the job only uses curl against the site.
permissions: {}

concurrency:
  group: publish-notes
  cancel-in-progress: false

jobs:
  publish:
    if: ${{ vars.SITE_URL != '' }}
    runs-on: ubuntu-latest
    steps:
      - name: Publish due notes
        id: publish
        env:
          SITE_URL: ${{ vars.SITE_URL }}
          SYNC_SECRET: ${{ secrets.SYNC_SECRET }}
        run: |
          body=$(curl --fail-with-body --silent --show-error --max-time 60 \
            -X POST "${SITE_URL%/}/api/notes/publish-due/" \
            -H "Authorization: Bearer ${SYNC_SECRET}")
          echo "$body"
          echo "published=$(echo "$body" | jq -r '.published // 0')" >> "$GITHUB_OUTPUT"

      # Request the pages that list notes so the first visitor after a publish
      # isn't the one who waits for the render. Never fails the job.
      - name: Warm the cache
        if: ${{ steps.publish.outputs.published != '0' }}
        env:
          SITE_URL: ${{ vars.SITE_URL }}
        run: |
          for path in / /notes/ /life/ /life/notes/ /feed.xml; do
            curl --silent --show-error --output /dev/null --max-time 60 "${SITE_URL%/}${path}" || true
          done
```

2. In `.github/workflows/sync.yml`, remove the stale dashboard warm-up. The view no longer exists, so delete the `-H "Cookie: view=dashboard"` line, and change "Both views are warmed: the site view (no cookie) and the dashboard view (cookie)." to "The Work home and /life/ are warmed.".
3. Commit with the attribution line, then push `master` with Onur's OK.
4. Run the workflow once with `gh workflow run publish-notes.yml` and check that it answers `{"published":0}`.
5. Update memory (`site-v2-redesign.md`) with the Sprint 9 outcome.
