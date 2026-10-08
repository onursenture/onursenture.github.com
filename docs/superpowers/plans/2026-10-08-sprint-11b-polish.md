# Sprint 11b: Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a changelog, a colophon, `/onur.md` and `/llms.txt`, and make one accessibility and performance pass over the site, with an axe guard in CI.

**Architecture:**
- The changelog, colophon, page descriptions and the `onur.md` intro are hand-written typed modules in `content/`, read through pure helpers in `lib/`, so each rule has a unit test.
- `/onur.md` and `/llms.txt` are prerendered route handlers built from `getPublishedContent()` and tagged `content`, like `/resume.pdf`.
- The accessibility fixes are small, local edits to existing primitives. One global focus style and one skip link cover both shells. A Playwright + axe spec over a route list (kept complete by a unit test) guards the result.

**Tech Stack:** Next.js 16 (`cacheComponents`), React 19, Tailwind CSS 4, Vitest, Playwright, `@axe-core/playwright` (new dev dependency).

**Spec:** `docs/superpowers/specs/2026-10-08-sprint-11b-polish-design.md`. Where this plan differs, the plan wins; Task 12 records each difference in the spec's Errata.

## Global Constraints

- Work in the worktree `/Users/w00f/Documents/GitHub/onursenture.github.com-sprint-11b` (branch `sprint-11b`, from `v2` 958412b). Run every command from there.
- Read `CLAUDE.md` and `AGENTS.md` first. `cacheComponents` is on; `trailingSlash: true` (internal links end with `/`); English only; type only through the `type-*` classes; no new fonts; square corners; no shadows.
- Every commit message ends with this line, exactly (never another model's name), and the subject has no "Task N" prefix:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
- Honest numbers only: every number in copy is literally true. No placeholder text on public pages; an empty section is left out.
- No email address in `/onur.md` or `/llms.txt`.
- Links inside running text are always underlined (`underline="always"`, Task 2). Nav, footer, list rows and actions keep hover-only underlines.
- Never `window.confirm`, `alert` or `prompt` (ESLint bans them).
- Before e2e locally, stop stale servers: `lsof -ti :3217 -ti :3219 -ti :3221 | xargs kill 2>/dev/null`. Run `npm run e2e` before `npm run e2e:admin` on the same build. Finish with a plain `npm run build` so `.next` isn't left in fixture mode.
- The task is done only when `npm run typecheck`, `npm run lint` and `npm test` pass, plus the e2e suites the task names.

## File map

| File | Task | Responsibility |
|---|---|---|
| `content/changelog.ts` | 1 | Releases and eras (hand-written) |
| `lib/changelog.ts` | 1 | `parseVersion`, `compareVersions`, `anchorOf`, `eraSpan`, `latestRelease`, `changelogIssues` |
| `components/ui/text-link.tsx`, `components/sections/item-link.tsx` | 2 | `underline` prop |
| `components/shell/skip-link.tsx` | 2 | "Skip to content" |
| `app/globals.css` | 2 | 2px focus style, file-input label focus, danger token |
| `content/descriptions.ts` | 3 | Meta description drafts |
| `lib/metadata.ts` | 3 | `describedMetadata()` |
| `app/(work)/changelog/page.tsx` | 4 | `/changelog/` |
| `content/colophon.ts`, `lib/colophon.ts`, `app/(work)/colophon/page.tsx` | 5 | `/colophon/` |
| `lib/build-info.ts`, `components/shell/site-footer.tsx` | 6 | Footer version and Colophon links |
| `content/agent-intro.ts`, `lib/agent/onur-md.ts`, `lib/agent/read.ts`, `app/onur.md/route.ts` | 7 | `/onur.md` |
| `lib/agent/llms-txt.ts`, `app/llms.txt/route.ts`, `app/layout.tsx`, `components/life/boot-readout.tsx` | 8 | `/llms.txt`, discovery |
| heatmap, data table, media button, live clock, experience list, readout | 9 | Component accessibility fixes |
| cover, remote image, archive tiles, photo grid, films row, Goodreads | 10 | Eager first images, smaller covers |
| `e2e/a11y-routes.ts`, `e2e/axe.ts`, `e2e/a11y.spec.ts`, `e2e-fixtures/a11y.spec.ts`, `e2e-admin/a11y.spec.ts`, `tests/a11y-routes.test.ts` | 11 | The axe guard |
| `CLAUDE.md`, the spec's Errata, `docs/superpowers/plans/2026-10-08-sprint-11b-followups.md` | 12 | Docs |

---

### Task 0: Worktree setup

The controller does this before Task 1.

- [ ] **Step 1: Install and check the baseline**

```bash
cd /Users/w00f/Documents/GitHub/onursenture.github.com-sprint-11b
npm ci
npm run typecheck && npm run lint && npm test
```

Expected: all pass on the untouched branch.

---

### Task 1: Changelog data and rules

**Files:**
- Create: `content/changelog.ts`
- Create: `lib/changelog.ts`
- Create: `tests/changelog.test.ts`
- Modify: `package.json` (`"version": "2.0.0"` → `"2.9.0"`), and `package-lock.json` through npm

**Interfaces:**
- Produces:
  - `content/changelog.ts`: `interface Release { version: string; date: string; title: string; items: string[] }`, `interface Era { major: number; name: string; from: string; to: string | null; summary: string }`, `releases: Release[]`, `eras: Era[]` (both newest first).
  - `lib/changelog.ts`: `parseVersion(v): [number, number, number] | null`, `compareVersions(a, b): number`, `anchorOf(version): string` (`"2.8.1"` → `"v2-8-1"`), `eraSpan(era): string`, `latestRelease(list?): Release`, `changelogIssues(releases, eras, packageVersion): string[]`.

- [ ] **Step 1: Write the failing tests**

`tests/changelog.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Era, type Release, eras, releases } from "@/content/changelog";
import { anchorOf, changelogIssues, compareVersions, eraSpan, latestRelease, parseVersion } from "@/lib/changelog";

const packageVersion = (JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version: string }).version;

const release = (version: string, date: string, items = ["Something changed."]): Release => ({ version, date, title: `Release ${version}`, items });
const era = (major: number, from: string, to: string | null): Era => ({ major, name: `Era ${major}`, from, to, summary: "An era." });
const okEras = [era(2, "2026-10-02", null), era(1, "2026-02-18", "2026-10-02")];

describe("the changelog", () => {
  it("follows every rule, and package.json carries the newest version", () => {
    expect(changelogIssues(releases, eras, packageVersion)).toEqual([]);
    expect(latestRelease().version).toBe(packageVersion);
  });

  it("starts in 2011 and has the three eras", () => {
    expect(eras.map((e) => e.major)).toEqual([2, 1, 0]);
    expect(eras.at(-1)?.from).toBe("2011-12-30");
  });
});

describe("versions", () => {
  it("parses major.minor.patch only", () => {
    expect(parseVersion("2.8.1")).toEqual([2, 8, 1]);
    expect(parseVersion("2.8")).toBeNull();
    expect(parseVersion("v2.8.1")).toBeNull();
  });

  it("compares numerically, not as text", () => {
    expect(compareVersions("2.10.0", "2.9.0")).toBeGreaterThan(0);
    expect(compareVersions("2.8.0", "2.8.1")).toBeLessThan(0);
    expect(compareVersions("2.8.1", "2.8.1")).toBe(0);
  });

  it("anchors a version", () => {
    expect(anchorOf("2.8.1")).toBe("v2-8-1");
  });
});

describe("eraSpan", () => {
  it("names the years", () => {
    expect(eraSpan(era(0, "2011-12-30", "2026-02-18"))).toBe("2011–2026");
    expect(eraSpan(era(1, "2026-02-18", "2026-10-02"))).toBe("2026");
    expect(eraSpan(era(2, "2026-10-02", null))).toBe("since 2026");
  });
});

describe("changelogIssues", () => {
  const ok = [release("2.1.0", "2026-10-04"), release("2.0.0", "2026-10-03")];

  it("accepts a valid list", () => {
    expect(changelogIssues(ok, okEras, "2.1.0")).toEqual([]);
  });

  it("refuses a package version that isn't the newest release", () => {
    expect(changelogIssues(ok, okEras, "2.0.0")).toContain("package.json is 2.0.0, but the newest release is 2.1.0");
  });

  it("refuses versions out of order, repeated or malformed", () => {
    expect(changelogIssues([release("2.0.0", "2026-10-04"), release("2.1.0", "2026-10-03")], okEras, "2.0.0")).toContain(
      "2.1.0 must be older than 2.0.0",
    );
    expect(changelogIssues([release("2.0.0", "2026-10-04"), release("2.0.0", "2026-10-03")], okEras, "2.0.0")).toContain(
      "2.0.0 must be older than 2.0.0",
    );
    expect(changelogIssues([release("2.0", "2026-10-04")], okEras, "2.0")).toContain("2.0 is not major.minor.patch");
  });

  it("refuses dates that go up, or aren't dates", () => {
    expect(changelogIssues([release("2.1.0", "2026-10-03"), release("2.0.0", "2026-10-04")], okEras, "2.1.0")).toContain(
      "2.0.0 is dated after 2.1.0",
    );
    expect(changelogIssues([release("2.0.0", "2026-13-01")], okEras, "2.0.0")).toContain("2.0.0 has an invalid date 2026-13-01");
  });

  it("refuses a release outside the current era", () => {
    expect(changelogIssues([release("1.0.0", "2026-10-03")], okEras, "1.0.0")).toContain("1.0.0 is not in the current era (v2)");
    expect(changelogIssues([release("2.0.0", "2026-10-01")], okEras, "2.0.0")).toContain("2.0.0 is dated before the current era began (2026-10-02)");
  });

  it("refuses an empty title, no items, more than five, or an empty item", () => {
    expect(changelogIssues([{ ...release("2.0.0", "2026-10-03"), title: " " }], okEras, "2.0.0")).toContain("2.0.0 has no title");
    expect(changelogIssues([release("2.0.0", "2026-10-03", [])], okEras, "2.0.0")).toContain("2.0.0 needs 1–5 items, has 0");
    expect(changelogIssues([release("2.0.0", "2026-10-03", ["a.", "b.", "c.", "d.", "e.", "f."])], okEras, "2.0.0")).toContain(
      "2.0.0 needs 1–5 items, has 6",
    );
    expect(changelogIssues([release("2.0.0", "2026-10-03", ["a.", " "])], okEras, "2.0.0")).toContain("2.0.0 has an empty item");
  });

  it("refuses eras that leave a gap or don't end with the current one", () => {
    expect(changelogIssues(ok, [era(2, "2026-10-02", null), era(1, "2026-02-18", "2026-10-01")], "2.1.0")).toContain(
      "v1 must end where v2 begins (2026-10-02)",
    );
    expect(changelogIssues(ok, [era(2, "2026-10-02", "2026-10-05"), era(1, "2026-02-18", "2026-10-02")], "2.1.0")).toContain(
      "the current era (v2) must have no end",
    );
    expect(changelogIssues(ok, [era(2, "2026-10-02", null), era(0, "2026-02-18", "2026-10-02")], "2.1.0")).toContain(
      "v0 must follow v2 as v1",
    );
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `npx vitest run tests/changelog.test.ts`
Expected: FAIL (`Cannot find module '@/content/changelog'`).

- [ ] **Step 3: Write `content/changelog.ts`**

```ts
// The site's changelog (Sprint 11b), newest first. Hand-written: every v2
// release is a merge into `v2` (a sprint is a minor, a follow-up fix a patch).
// package.json's version must equal the newest release (tests/changelog.test.ts),
// so a sprint ships with its entry. Draft copy: Onur approves it on production.

export interface Release {
  // major.minor.patch
  version: string;
  // YYYY-MM-DD: the merge date into v2.
  date: string;
  title: string;
  // 1–5 plain sentences about what changed on the site, for a visitor.
  items: string[];
}

export interface Era {
  major: number;
  name: string;
  // YYYY-MM-DD, from git.
  from: string;
  // null for the current era.
  to: string | null;
  summary: string;
}

export const releases: Release[] = [
  {
    version: "2.9.0",
    date: "2026-10-08",
    title: "Changelog, colophon and onur.md; an accessibility pass",
    items: [
      "This changelog, and a colophon that says how the site is built.",
      "onur.md and llms.txt: the site in Markdown, for AI agents.",
      "A skip link, stronger focus rings and underlined links in running text.",
      "Life pages load their first images sooner, and smaller covers.",
    ],
  },
  {
    version: "2.8.1",
    date: "2026-10-07",
    title: "In-page admin confirmations",
    items: ["The admin asks before deleting or leaving in its own dialog, so it works in browsers that block pop-up confirms."],
  },
  {
    version: "2.8.0",
    date: "2026-10-05",
    title: "Photos in the admin",
    items: [
      "Photos are posted from the admin, from a phone.",
      "The date and camera come from the photo's EXIF data; location data is never read or kept.",
    ],
  },
  {
    version: "2.7.0",
    date: "2026-10-05",
    title: "Life archives",
    items: [
      "Archive pages for films, books, theatre and saved articles.",
      "Films and books are grouped by year and month; plays by year.",
    ],
  },
  {
    version: "2.6.0",
    date: "2026-10-05",
    title: "Notes",
    items: [
      "Notes: short posts on the Work side, the Life side or both, with images or a link card.",
      "The feed at /feed.xml carries every note and photo.",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-10-04",
    title: "Resume and Book a call",
    items: [
      "A resume page and a one-page PDF, built from the same data as the home.",
      "Book a call: three kinds of call, booked through cal.com.",
    ],
  },
  {
    version: "2.4.1",
    date: "2026-10-04",
    title: "Admin follow-ups",
    items: ["The admin explains why a publish was refused, pins take an optional note, and drafts are saved by hand."],
  },
  {
    version: "2.4.0",
    date: "2026-10-04",
    title: "Admin",
    items: [
      "An admin, signed in with GitHub, for the product pages, the bio, Lab and Experience.",
      "Images are uploaded straight into a product page's slots.",
    ],
  },
  {
    version: "2.3.0",
    date: "2026-10-04",
    title: "Orkestra and two PrimeTek pages",
    items: [
      "Nine Orkestra product pages, from Nebuu to Beatografi.",
      "PrimeStore and Theme Designer join the PrimeTek pages.",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-10-03",
    title: "Product pages",
    items: [
      "Product pages for PrimeOne, PrimeBlocks, PrimeIcons and the templates.",
      "Selected work on the home, pinned from those pages.",
      "An image viewer with arrows, swipe and Esc.",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-10-03",
    title: "New visual direction and the Work/Life split",
    items: [
      "IBM Plex Mono and Sans, Doto for the name, one ultramarine accent and dithered textures.",
      "The site splits into Work and Life, with a switch in the header; Life is always dark.",
      "Life opens with a readout of what I'm watching, reading and saving.",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-10-03",
    title: "Next.js platform and design system",
    items: [
      "The site moves from Eleventy on GitHub Pages to Next.js on Vercel, with a database.",
      "Films, books, saved articles and GitHub activity sync on a schedule instead of at build time.",
      "A design system of colour tokens, type and one page grid.",
    ],
  },
];

export const eras: Era[] = [
  { major: 2, name: "Next.js", from: "2026-10-02", to: null, summary: "Next.js on Vercel, with a database, an admin and synced feeds." },
  { major: 1, name: "Eleventy", from: "2026-02-18", to: "2026-10-02", summary: "Eleventy on GitHub Pages, with live data widgets rebuilt every six hours." },
  { major: 0, name: "Jekyll", from: "2011-12-30", to: "2026-02-18", summary: "Jekyll on GitHub Pages, started from Jekyll Bootstrap with a commit called “version 0.0.1”." },
];
```

- [ ] **Step 4: Write `lib/changelog.ts`**

```ts
import { type Era, type Release, releases } from "@/content/changelog";

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseVersion(version: string): [number, number, number] | null {
  const match = VERSION.exec(version);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

// Negative when a is older than b. Both must be valid versions.
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa || !pb) throw new Error(`not a version: ${pa ? b : a}`);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

// "2.8.1" → "v2-8-1": the release's id on /changelog/ (dots would need escaping in a selector).
export function anchorOf(version: string): string {
  return `v${version.split(".").join("-")}`;
}

// "2011–2026", "2026" (one year), "since 2026" (the current era).
export function eraSpan(era: Era): string {
  const from = era.from.slice(0, 4);
  if (era.to === null) return `since ${from}`;
  const to = era.to.slice(0, 4);
  return from === to ? from : `${from}–${to}`;
}

export function latestRelease(list: Release[] = releases): Release {
  const [latest] = list;
  if (!latest) throw new Error("the changelog has no releases");
  return latest;
}

function validDate(date: string): boolean {
  if (!DATE.test(date)) return false;
  const time = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(time.getTime()) && time.toISOString().slice(0, 10) === date;
}

// Every rule the changelog breaks, as a sentence; empty when it is valid.
// Releases and eras are newest first.
export function changelogIssues(list: Release[], eraList: Era[], packageVersion: string): string[] {
  const issues: string[] = [];
  const current = eraList[0];

  list.forEach((release, index) => {
    const { version } = release;
    const parsed = parseVersion(version);
    if (!parsed) issues.push(`${version} is not major.minor.patch`);
    if (!validDate(release.date)) issues.push(`${version} has an invalid date ${release.date}`);
    if (!release.title.trim()) issues.push(`${version} has no title`);
    if (release.items.length < 1 || release.items.length > 5) issues.push(`${version} needs 1–5 items, has ${release.items.length}`);
    if (release.items.some((item) => !item.trim())) issues.push(`${version} has an empty item`);
    if (current && parsed && parsed[0] !== current.major) issues.push(`${version} is not in the current era (v${current.major})`);
    if (current && validDate(release.date) && release.date < current.from) {
      issues.push(`${version} is dated before the current era began (${current.from})`);
    }
    const newer = list[index - 1];
    if (newer && parsed && parseVersion(newer.version) && compareVersions(newer.version, version) <= 0) {
      issues.push(`${version} must be older than ${newer.version}`);
    }
    if (newer && validDate(newer.date) && validDate(release.date) && release.date > newer.date) {
      issues.push(`${version} is dated after ${newer.version}`);
    }
  });

  if (current && current.to !== null) issues.push(`the current era (v${current.major}) must have no end`);
  eraList.forEach((era, index) => {
    const newer = eraList[index - 1];
    if (!newer) return;
    if (era.major !== newer.major - 1) issues.push(`v${era.major} must follow v${newer.major} as v${newer.major - 1}`);
    else if (era.to !== newer.from) issues.push(`v${era.major} must end where v${newer.major} begins (${newer.from})`);
  });

  const latest = list[0];
  if (latest && latest.version !== packageVersion) {
    issues.push(`package.json is ${packageVersion}, but the newest release is ${latest.version}`);
  }
  return issues;
}
```

- [ ] **Step 5: Bump the version**

Run: `npm version 2.9.0 --no-git-tag-version`
Expected: `package.json` and `package-lock.json` both say `2.9.0`.

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/changelog.test.ts tests/build-info.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add content/changelog.ts lib/changelog.ts tests/changelog.test.ts package.json package-lock.json
git commit -m "Add the changelog data, its rules and version 2.9.0

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Accessibility foundations

Global fixes the later tasks build on: underlined links in running text (A1), resume hit areas (A2), the danger token (A3), the skip link (A7), the 2px focus style (A8), the file-input focus ring ("+ Add photo") and the Life switch under reduced motion (A9).

**Files:**
- Modify: `components/ui/text-link.tsx`
- Modify: `components/sections/item-link.tsx`
- Modify: `components/resume/resume-body.tsx`
- Modify: `components/resume/email-link.tsx` (only if needed; see Step 4)
- Modify: `app/not-found.tsx`, `app/(work)/not-found.tsx`, `app/life/not-found.tsx`
- Modify: `app/globals.css`
- Modify: `tests/tokens.test.ts`
- Create: `components/shell/skip-link.tsx`
- Modify: `components/shell/work-shell.tsx`, `components/shell/life-shell.tsx`
- Modify: `components/life-switch.tsx`
- Test: `tests/ui/text-primitives.test.tsx`, `e2e/shell.spec.ts`

**Interfaces:**
- Produces: `TextLink` and `ItemLink` take `underline?: "hover" | "always"` (default `"hover"`). `SkipLink` (no props). Both shells wrap the page in `<div id="content" tabIndex={-1}>`.

- [ ] **Step 1: Write the failing unit tests**

Append to `tests/ui/text-primitives.test.tsx` (it already has an `html()` helper and imports; add the `ItemLink` import if missing: `import { ItemLink } from "@/components/sections/item-link";`):

```tsx
describe("links in running text", () => {
  it("TextLink underlines always when asked, and only on hover by default", () => {
    expect(html(<TextLink href="/x/">Read</TextLink>)).toContain("group-hover:underline");
    const always = html(
      <TextLink href="/x/" underline="always">
        Read
      </TextLink>,
    );
    expect(always).toContain('class="underline decoration-1 underline-offset-[0.2em]"');
    expect(always).not.toContain("group-hover:underline");
  });

  it("ItemLink underlines always when asked", () => {
    expect(html(<ItemLink href="/x/">PrimeOne</ItemLink>)).toContain("hover:underline");
    const always = html(
      <ItemLink href="/x/" underline="always">
        PrimeOne
      </ItemLink>,
    );
    expect(always).toContain("underline decoration-1 underline-offset-[0.2em]");
    expect(always).not.toContain("hover:underline");
  });
});
```

Change the danger expectation in `tests/tokens.test.ts`:

```ts
  "--color-danger": { light: "#C9281C", dark: "#F97066" },
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/ui/text-primitives.test.tsx tests/tokens.test.ts`
Expected: FAIL (no `underline` prop; the token is still `#D92D20`).

- [ ] **Step 3: Add the `underline` prop**

`components/ui/text-link.tsx`: add the prop and use it on the inner text span.

```tsx
export function TextLink({
  href,
  children,
  className,
  ariaLabel,
  underline = "hover",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  // Replaces the accessible name when several links share the same visible text.
  ariaLabel?: string;
  // "always" for a link inside running text, where colour alone can't mark it (WCAG 1.4.1).
  underline?: "hover" | "always";
}) {
  const external = isExternal(href);
  const content = (
    <>
      <span className={underline === "always" ? "underline decoration-1 underline-offset-[0.2em]" : "group-hover:underline group-hover:underline-offset-[0.2em]"}>
        {children}
      </span>
      <span aria-hidden="true">{external ? "\u00a0\u2197" : "\u00a0\u2192"}</span>
    </>
  );
```

(The rest of the function is unchanged.)

`components/sections/item-link.tsx`:

```tsx
// A title link inside a list or table row: no arrow (the row is not a call
// to action), underlined on hover, or always when it sits in running text.
// External links never pass the referrer.
export function ItemLink({
  href,
  className,
  children,
  underline = "hover",
}: {
  href: string;
  className?: string;
  children: ReactNode;
  underline?: "hover" | "always";
}) {
  const classes = cx(
    underline === "always" ? "underline decoration-1 underline-offset-[0.2em]" : "hover:underline hover:underline-offset-[0.2em]",
    className,
  );
```

(The returned JSX is unchanged.)

- [ ] **Step 4: Use it where links sit in running text, and enlarge the resume actions**

`components/resume/resume-body.tsx`:
- the contact line: `EmailLink` gets `className="text-accent underline decoration-1 underline-offset-[0.2em]"`; the `onursenture.com` `ItemLink` and the LinkedIn `TextLink` get `underline="always"`;
- the products line (`role.products`) and Projects: each `ItemLink` gets `underline="always"`;
- the header actions: give each a hit area of 24px without changing the look. Replace the action `<span className="flex flex-col gap-1 lg:items-end">` contents with:

```tsx
        <span className="flex flex-col lg:items-end">
          {/* A plain <a>: next/link would try a client navigation to a route handler. */}
          {/* py-[3px] on an inline-block makes an 18px line a 24px target (WCAG 2.5.8). */}
          <a href="/resume.pdf" className="group inline-block py-[3px] text-accent">
            <span className="group-hover:underline group-hover:underline-offset-[0.2em]">Download PDF</span>
            <span aria-hidden="true">{" ↓"}</span>
          </a>
          {bookable ? (
            <TextLink href="/book/" className="inline-block py-[3px] text-accent">
              Book a call
            </TextLink>
          ) : null}
        </span>
```

(`gap-1` goes: the two 3px paddings now give the same 6px between the lines.)

`EmailLink` already merges `className` into the anchor after hydration and onto the span before it; no change is needed there.

In the three `not-found.tsx` files, the "Back to home" / "Back to Life" `TextLink` gets `underline="always"`.

- [ ] **Step 5: The focus style, the file-input focus ring and the danger token**

`app/globals.css`:
- in `@theme static`, the light block: `--color-danger: #C9281C;` (it was `#D92D20`; 5.08:1 on `--color-danger-bg`, 5.28:1 on the page). Leave the dark value.
- in `@layer base`, replace the `:focus-visible` rule and add the file-input rule:

```css
  /* One focus style everywhere: 2px accent, 2px off the element. */
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  /* An upload control is a label over a transparent or sr-only file input,
     so the input's own ring is invisible: draw it on the label. */
  label:has(input[type="file"]:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
```

- [ ] **Step 6: The skip link and its target**

`components/shell/skip-link.tsx`:

```tsx
// The first stop for keyboard users on both sides (WCAG 2.4.1): hidden until
// focused, it jumps past the header to the page.
export function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only type-meta focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:bg-bg focus:px-2 focus:py-1 focus:text-fg"
    >
      Skip to content
    </a>
  );
}
```

In `work-shell.tsx` and `life-shell.tsx`:
- import it and render `<SkipLink />` as the first child of the shell's root `div` (before `SideSync` on Life, before `DitherStrip` on Work);
- replace `<div className="flex-1">{children}</div>` with:

```tsx
        <div id="content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </div>
```

(`tabIndex={-1}` lets the skip link move focus there; a container never shows a ring.)

- [ ] **Step 7: The Life switch under reduced motion**

`components/life-switch.tsx`: add `motion-reduce:transition-none` to the track span's classes (after `transition-colors`) and to the knob span's classes (after `transition-[left]`).

- [ ] **Step 8: E2E for the skip link**

Append to `e2e/shell.spec.ts`:

```ts
for (const path of ["/", "/life/"]) {
  test(`the first Tab on ${path} reaches "Skip to content", which moves focus past the header`, async ({ page }) => {
    await page.goto(path);
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#content")).toBeFocused();
  });
}
```

- [ ] **Step 9: Run everything**

```bash
npx vitest run tests/ui/text-primitives.test.tsx tests/tokens.test.ts
npm run typecheck && npm run lint && npm test
npm run build && npx playwright test e2e/shell.spec.ts e2e/resume.spec.ts e2e/not-found.spec.ts e2e/system.spec.ts
```

Expected: all PASS. If a resume e2e pinned the old action markup, update its selector, not the behaviour.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Underline links in running text, add a skip link and a 2px focus ring

Darkens the light danger token to pass 4.5:1, gives the resume actions
24px targets, rings file-upload labels and stills the Life switch under
reduced motion.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Page descriptions and 404 titles

P3 (meta descriptions) and A10 (the 404 title).

**Files:**
- Create: `content/descriptions.ts`
- Modify: `lib/metadata.ts`
- Modify: `app/(work)/page.tsx`, `app/(work)/notes/page.tsx`, `app/(work)/notes/page/[n]/page.tsx`, `app/life/page.tsx`, `app/life/notes/page.tsx`, `app/life/notes/page/[n]/page.tsx`, `app/life/photos/page.tsx`, `app/life/films/page.tsx`, `app/life/films/[year]/page.tsx`, `app/life/books/page.tsx`, `app/life/theatre/page.tsx`, `app/life/saved/page.tsx`
- Modify: `app/(work)/[...missing]/page.tsx`, `app/life/[...missing]/page.tsx`
- Test: `tests/descriptions.test.ts`, `tests/metadata.test.ts`, `e2e/not-found.spec.ts`

**Interfaces:**
- Produces: `DESCRIPTIONS` (keys `home`, `notes`, `life`, `lifeNotes`, `photos`, `films`, `books`, `theatre`, `saved`, `changelog`, `colophon`; Tasks 4 and 5 use the last two). `describedMetadata(title: string, description: string): Metadata`.

- [ ] **Step 1: Write the failing tests**

`tests/descriptions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DESCRIPTIONS } from "@/content/descriptions";

describe("page descriptions", () => {
  it.each(Object.entries(DESCRIPTIONS))("%s is one sentence of 50–160 characters", (_key, text) => {
    expect(text.length).toBeGreaterThanOrEqual(50);
    expect(text.length).toBeLessThanOrEqual(160);
    expect(text).toMatch(/^[A-Z].*\.$/);
    expect(text.slice(0, -1)).not.toMatch(/[.!?]\s/);
  });

  it("has no email address", () => {
    for (const text of Object.values(DESCRIPTIONS)) expect(text).not.toContain("@");
  });
});
```

Append to `tests/metadata.test.ts` (add `describedMetadata` to its import from `@/lib/metadata`):

```ts
describe("describedMetadata", () => {
  it("sets the description on the page and on Open Graph", () => {
    const meta = describedMetadata("Films", "Films I watched, by year and month, from Letterboxd.");
    expect(meta.title).toBe("Films");
    expect(meta.description).toBe("Films I watched, by year and month, from Letterboxd.");
    expect(meta.openGraph).toMatchObject({ title: "Films · Onur Senture", description: "Films I watched, by year and month, from Letterboxd." });
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/descriptions.test.ts tests/metadata.test.ts`
Expected: FAIL (missing module / export).

- [ ] **Step 3: Write `content/descriptions.ts` and `describedMetadata`**

```ts
// Meta descriptions for the pages that have none from their data (Sprint 11b,
// P3). One sentence each, 50–160 characters. Draft copy: Onur approves it on
// production.
export const DESCRIPTIONS = {
  home: "Onur Senture is a designer who builds: ten years leading design at PrimeTek, and iOS games and apps at Orkestra since 2013.",
  notes: "Short notes from Onur Senture about design, building and work, newest first.",
  life: "The other side of Onur Senture's site: films, books, theatre, saved articles, photos and notes.",
  lifeNotes: "Notes from the Life side of Onur Senture's site, newest first.",
  photos: "Photos by Onur Senture, each with the day it was taken and the camera.",
  films: "Films Onur Senture has watched, grouped by year and month, from Letterboxd.",
  books: "Books Onur Senture is reading and has read, grouped by year and month, from Goodreads.",
  theatre: "Plays Onur Senture has seen, year by year, from tiyatrolar.com.tr.",
  saved: "Articles Onur Senture saved to read on Instapaper, newest first.",
  changelog: "Every release of onursenture.com, from the first Jekyll commit in 2011 to today.",
  colophon: "How onursenture.com is built: the stack, the type, the data sources and the tools.",
} as const;
```

In `lib/metadata.ts`, add after `pageMetadata`:

```ts
// pageMetadata with a description on the page and its Open Graph card.
export function describedMetadata(title: string, description: string): Metadata {
  return pageMetadata(title, { description, openGraph: { description } });
}
```

- [ ] **Step 4: Apply them**

Replace each page's `pageMetadata("…")` with `describedMetadata("…", DESCRIPTIONS.<key>)` and import both (`import { DESCRIPTIONS } from "@/content/descriptions";`, `import { describedMetadata } from "@/lib/metadata";`):

| Page | Title (unchanged) | Key |
|---|---|---|
| `app/(work)/notes/page.tsx` | `"Notes"` | `notes` |
| `app/(work)/notes/page/[n]/page.tsx` | `` `Notes, page ${n}` `` | `notes` |
| `app/life/page.tsx` | `"Life"` | `life` |
| `app/life/notes/page.tsx` | `"Life notes"` | `lifeNotes` |
| `app/life/notes/page/[n]/page.tsx` | `` `Life notes, page ${n}` `` | `lifeNotes` |
| `app/life/photos/page.tsx` | `"Photos"` | `photos` |
| `app/life/films/page.tsx` | `"Films"` | `films` |
| `app/life/films/[year]/page.tsx` | the existing year title | `films` |
| `app/life/books/page.tsx` | `"Books"` | `books` |
| `app/life/theatre/page.tsx` | `"Theatre"` | `theatre` |
| `app/life/saved/page.tsx` | `"Saved"` | `saved` |

The home keeps the plain site title (no template), so it sets its metadata directly. In `app/(work)/page.tsx`:

```tsx
import type { Metadata } from "next";
import { DESCRIPTIONS } from "@/content/descriptions";
import { OPEN_GRAPH_DEFAULTS } from "@/lib/metadata";
import { site } from "@/lib/site";

// The home keeps the bare site title; Next replaces the layout's openGraph,
// so it is rebuilt here with the description.
export const metadata: Metadata = {
  description: DESCRIPTIONS.home,
  openGraph: { ...OPEN_GRAPH_DEFAULTS, title: site.title, description: DESCRIPTIONS.home },
};
```

- [ ] **Step 5: The 404 title**

In both `[...missing]/page.tsx` files add:

```tsx
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";

// The 404's title ("Not found · Onur Senture"); Next renders this page's
// metadata with the not-found boundary.
export const metadata: Metadata = pageMetadata("Not found");
```

Append to `e2e/not-found.spec.ts`:

```ts
for (const path of ["/does-not-exist/", "/life/does-not-exist/"]) {
  test(`${path} is titled "Not found"`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle("Not found · Onur Senture");
  });
}
```

Build and run it. **If the title is still "Onur Senture"** (Next didn't apply the segment's metadata when the page throws `notFound()`), remove the `metadata` exports above and render the title in each layout's not-found component instead (React 19 hoists it into `<head>`): in `app/(work)/not-found.tsx` and `app/life/not-found.tsx`, add `<title>{fullTitle("Not found")}</title>` as the first child of `<main>` (import `fullTitle` from `@/lib/metadata`). Then make sure the page has exactly one `<title>`: `await expect(page.locator("title")).toHaveCount(1)` in the same test. Record which way worked in the report.

- [ ] **Step 6: E2E for descriptions**

Append to `e2e/home.spec.ts`:

```ts
test("the home and Life pages carry a meta description", async ({ page }) => {
  for (const path of ["/", "/notes/", "/life/", "/life/photos/", "/life/films/", "/life/books/", "/life/theatre/", "/life/saved/", "/life/notes/"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="description"]'), path).toHaveAttribute("content", /.{50,}/);
  }
});
```

- [ ] **Step 7: Run everything**

```bash
npm run typecheck && npm run lint && npm test
npm run build && npx playwright test e2e/home.spec.ts e2e/not-found.spec.ts e2e/life.spec.ts e2e/notes.spec.ts e2e/photos.spec.ts e2e/life-archives.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Give every public page a description and the 404 a Not found title

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The `/changelog/` page

**Files:**
- Create: `app/(work)/changelog/page.tsx`
- Create: `e2e/changelog.spec.ts`

**Interfaces:**
- Consumes: `releases`, `eras` (Task 1), `anchorOf`, `eraSpan` (Task 1), `DESCRIPTIONS.changelog`, `describedMetadata` (Task 3), `TextLink` `underline` (Task 2), `formatDate` from `@/lib/format`.

- [ ] **Step 1: Write the failing e2e**

`e2e/changelog.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { eras, releases } from "../content/changelog";
import { anchorOf } from "../lib/changelog";

test("/changelog/ lists every release newest first, each at its anchor, then the eras", async ({ page }) => {
  await page.goto("/changelog/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Changelog.");
  const ids = await page.locator("main section[id^='v']").evaluateAll((sections) => sections.map((s) => s.id));
  expect(ids).toEqual(releases.map((r) => anchorOf(r.version)));
  const newest = page.locator(`#${anchorOf(releases[0].version)}`);
  await expect(newest.getByRole("heading", { level: 2 })).toContainText(`v${releases[0].version}`);
  await expect(newest).toContainText(releases[0].title);
  for (const item of releases[0].items) await expect(newest).toContainText(item);
  const earlier = page.locator("#earlier");
  for (const era of eras) await expect(earlier).toContainText(`v${era.major} · ${era.name}`);
  // Scoped to main: the footer gets its own Colophon link in Task 6.
  await expect(page.locator("main").getByRole("link", { name: /Colophon/ })).toHaveAttribute("href", "/colophon/");
});

test("/changelog/ has a description", async ({ page }) => {
  await page.goto("/changelog/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /^Every release of onursenture\.com/);
  await expect(page).toHaveTitle("Changelog · Onur Senture");
});
```

- [ ] **Step 2: Build and run it to see it fail**

Run: `npm run build && npx playwright test e2e/changelog.spec.ts`
Expected: FAIL (404).

- [ ] **Step 3: Write the page**

`app/(work)/changelog/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { eras, releases } from "@/content/changelog";
import { DESCRIPTIONS } from "@/content/descriptions";
import { anchorOf, eraSpan } from "@/lib/changelog";
import { formatDate } from "@/lib/format";
import { describedMetadata } from "@/lib/metadata";

export const metadata: Metadata = describedMetadata("Changelog", DESCRIPTIONS.changelog);

// /changelog/ (Sprint 11b spec §1.5): the /book/ header pattern, then one row
// per release (anchored at v2-8-1, the footer's version links there) and the
// eras. Static: content/changelog.ts is the source.
export default function ChangelogPage() {
  const rows = [
    <SectionRow
      key="header"
      id="changelog"
      labelAs="div"
      label={
        <ItemLink href="/" className="text-fg-muted">
          ← Home
        </ItemLink>
      }
    >
      <h1 className="type-lead">
        Changelog. <span className="text-fg-muted">Every release of this site.</span>
      </h1>
      <p className="mt-2 type-meta text-fg-muted">
        How it&apos;s built:{" "}
        <TextLink href="/colophon/" underline="always">
          Colophon
        </TextLink>
      </p>
    </SectionRow>,
    ...releases.map((release) => (
      <SectionRow
        key={release.version}
        id={anchorOf(release.version)}
        label={
          <>
            v{release.version}
            <span className="block type-meta text-fg-muted">{formatDate(release.date)}</span>
          </>
        }
      >
        <p className="type-body text-fg">{release.title}</p>
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 type-body text-fg-soft marker:text-fg-muted">
          {release.items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </SectionRow>
    )),
    <SectionRow key="earlier" id="earlier" label="Earlier">
      <ul className="flex flex-col gap-3 type-body">
        {eras.map((era) => (
          <li key={era.major}>
            <span className="text-fg">
              v{era.major} · {era.name}
            </span>{" "}
            <span className="type-meta text-fg-muted">· {eraSpan(era)}</span>
            <p className="text-fg-soft">{era.summary}</p>
          </li>
        ))}
      </ul>
    </SectionRow>,
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

- [ ] **Step 4: Run it**

Run: `npm run typecheck && npm run lint && npm run build && npx playwright test e2e/changelog.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(work)/changelog/page.tsx" e2e/changelog.spec.ts
git commit -m "Add the /changelog/ page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The colophon

**Files:**
- Create: `content/colophon.ts`
- Create: `lib/colophon.ts`
- Create: `app/(work)/colophon/page.tsx`
- Create: `tests/colophon.test.ts`
- Create: `e2e/colophon.spec.ts`
- Modify: `components/ui/text-link.tsx` (file links)

**Interfaces:**
- Consumes: `DESCRIPTIONS.colophon`, `describedMetadata` (Task 3), `TextLink` `underline` (Task 2).
- Produces: `content/colophon.ts`: `type ColophonPart = string | { text: string; href: string }`, `interface ColophonSection { id: string; label: string; paragraphs: ColophonPart[][] }`, `STACK: StackEntry[]`, `sections: ColophonSection[]` (the rows after Stack). `lib/colophon.ts`: `interface StackEntry { name: string; href: string; pkg?: string; note?: string }`, `interface StackItem { name: string; href: string; version?: string; note?: string }`, `shortVersion(range: string): string | null`, `stackItems(entries, deps): StackItem[]`.

- [ ] **Step 1: Write the failing tests**

`tests/colophon.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STACK, sections } from "@/content/colophon";
import { shortVersion, stackItems } from "@/lib/colophon";

const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe("shortVersion", () => {
  it("keeps the major from 1.0 up, and major.minor below it", () => {
    expect(shortVersion("16.3.8")).toBe("16");
    expect(shortVersion("^4.3.3")).toBe("4");
    expect(shortVersion("~0.45.3")).toBe("0.45");
    expect(shortVersion("latest")).toBeNull();
  });
});

describe("stackItems", () => {
  it("adds versions from package.json and leaves out a package that isn't there", () => {
    const items = stackItems(
      [
        { name: "Next.js", href: "https://nextjs.org", pkg: "next" },
        { name: "Gone", href: "https://example.com", pkg: "not-installed" },
        { name: "Vercel", href: "https://vercel.com", note: "hosting" },
      ],
      { next: "16.3.8" },
    );
    expect(items).toEqual([
      { name: "Next.js", href: "https://nextjs.org", version: "16" },
      { name: "Vercel", href: "https://vercel.com", note: "hosting" },
    ]);
  });

  it("finds every package the real stack names", () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(stackItems(STACK, deps)).toHaveLength(STACK.length);
  });
});

describe("the colophon copy", () => {
  it("runs Built, Type, Texture, Data, Source, Agent, History after the Stack row", () => {
    expect(sections.map((s) => s.label)).toEqual(["Built", "Type", "Texture", "Data", "Source", "Agent", "History"]);
  });

  it("links only https, or a path inside the site", () => {
    for (const section of sections) {
      for (const part of section.paragraphs.flat()) {
        if (typeof part !== "string") expect(part.href).toMatch(/^(https:\/\/|\/)/);
      }
    }
  });

  it("credits Dither Kit and claims no Bluesky cross-posting", () => {
    const text = JSON.stringify(sections);
    expect(text).toContain("Dither Kit");
    expect(text).not.toMatch(/cross-?post/i);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/colophon.test.ts`
Expected: FAIL (missing modules).

- [ ] **Step 3: Write `lib/colophon.ts`**

```ts
export interface StackEntry {
  name: string;
  href: string;
  // The npm package whose version to show; without it, no version.
  pkg?: string;
  note?: string;
}

export interface StackItem {
  name: string;
  href: string;
  version?: string;
  note?: string;
}

// "16.3.8" → "16", "~0.45.3" → "0.45" (a 0.x major says nothing), else null.
export function shortVersion(range: string): string | null {
  const match = /(\d+)\.(\d+)/.exec(range);
  if (!match) return null;
  return match[1] === "0" ? `0.${match[2]}` : match[1];
}

// The Stack row's items, versions read from package.json at build time. An
// entry whose package isn't installed is left out, so the row can't go stale.
export function stackItems(entries: StackEntry[], deps: Record<string, string>): StackItem[] {
  const items: StackItem[] = [];
  for (const entry of entries) {
    const item: StackItem = { name: entry.name, href: entry.href };
    if (entry.pkg) {
      const range = deps[entry.pkg];
      const version = range ? shortVersion(range) : null;
      if (!version) continue;
      item.version = version;
    }
    if (entry.note) item.note = entry.note;
    items.push(item);
  }
  return items;
}
```

- [ ] **Step 4: Write `content/colophon.ts`**

```ts
import type { StackEntry } from "@/lib/colophon";

// The /colophon/ copy (Sprint 11b spec §2). Draft copy: Onur approves it on
// production. Only true statements: check a claim against the code before
// adding it.

export type ColophonPart = string | { text: string; href: string };

export interface ColophonSection {
  id: string;
  label: string;
  // Paragraphs of text and links.
  paragraphs: ColophonPart[][];
}

// The Stack row, after Built. Versions come from package.json (lib/colophon.ts).
export const STACK: StackEntry[] = [
  { name: "Next.js", href: "https://nextjs.org", pkg: "next" },
  { name: "React", href: "https://react.dev", pkg: "react" },
  { name: "Tailwind CSS", href: "https://tailwindcss.com", pkg: "tailwindcss" },
  { name: "Drizzle", href: "https://orm.drizzle.team", pkg: "drizzle-orm" },
  { name: "Neon Postgres", href: "https://neon.com" },
  { name: "Vercel", href: "https://vercel.com", note: "hosting and Blob storage" },
  { name: "react-pdf", href: "https://react-pdf.org", pkg: "@react-pdf/renderer", note: "the resume PDF" },
  { name: "GitHub OAuth", href: "https://docs.github.com/en/apps/oauth-apps", note: "the admin sign-in" },
];

// The rows after Stack, in order.
export const sections: ColophonSection[] = [
  {
    id: "built",
    label: "Built",
    paragraphs: [["Designed and built by Onur, with ", { text: "Claude Code", href: "https://claude.com/claude-code" }, "."]],
  },
  {
    id: "type",
    label: "Type",
    paragraphs: [
      [
        { text: "IBM Plex Mono", href: "https://fonts.google.com/specimen/IBM+Plex+Mono" },
        ", ",
        { text: "IBM Plex Sans", href: "https://fonts.google.com/specimen/IBM+Plex+Sans" },
        " and ",
        { text: "Doto", href: "https://fonts.google.com/specimen/Doto" },
        ", self-hosted.",
      ],
    ],
  },
  {
    id: "texture",
    label: "Texture",
    paragraphs: [["The dithered strips and washes are ", { text: "Dither Kit", href: "https://www.tripwire.sh/dither-kit" }, " by Tripwire (MIT), vendored with small changes."]],
  },
  {
    id: "data",
    label: "Data",
    paragraphs: [
      [
        "Life reads ",
        { text: "Letterboxd", href: "https://letterboxd.com/onur/" },
        ", ",
        { text: "Goodreads", href: "https://www.goodreads.com/onur" },
        ", ",
        { text: "Instapaper", href: "https://www.instapaper.com/p/w00f" },
        ", ",
        { text: "tiyatrolar.com.tr", href: "https://tiyatrolar.com.tr/u/onursenture" },
        " and ",
        { text: "w00f.org", href: "https://w00f.org" },
        "; the home reads ",
        { text: "GitHub", href: "https://github.com/onursenture" },
        ". A GitHub Actions job checks the sources every hour.",
      ],
      ["Calls are booked through ", { text: "cal.com", href: "https://cal.com/onursenture" }, ". Notes follow Bluesky's format: 300 characters, with links and mentions."],
    ],
  },
  {
    id: "source",
    label: "Source",
    paragraphs: [["The code is public on ", { text: "GitHub", href: "https://github.com/onursenture/onursenture.github.com" }, "."]],
  },
  {
    id: "agent",
    label: "Agent",
    paragraphs: [["For AI agents: ", { text: "onur.md", href: "/onur.md" }, ", the site as one Markdown profile, and ", { text: "llms.txt", href: "/llms.txt" }, "."]],
  },
  {
    id: "history",
    label: "History",
    paragraphs: [["Online since 2011: Jekyll, then Eleventy, now Next.js. Every release is in the ", { text: "changelog", href: "/changelog/" }, "."]],
  },
];
```

Before committing, check each Data claim against the code: the sync schedule is `17 * * * *` in `.github/workflows/sync.yml` on `master` (`git show master:.github/workflows/sync.yml | grep cron`); the Instapaper profile URL is the one in `components/life/archive/saved-archive.tsx`; the theatre profile is in `lib/sources/theatre.ts`. Fix the copy if any differs.

- [ ] **Step 5: Let `TextLink` link to a file**

The Agent row links `/onur.md` and `/llms.txt`, which are route handlers: next/link would try a client navigation to them. In `components/ui/text-link.tsx`, render a plain `<a>` for an internal href that ends in a file extension:

```tsx
  const external = isExternal(href);
  // A file such as /onur.md or /resume.pdf is a route handler, not a page:
  // next/link would try a client navigation to it.
  const file = !external && /\.[a-z0-9]+$/i.test(href.split("#")[0]);
```

and in the return, `external || file ? (<a href={href} rel={external ? "noopener noreferrer" : undefined} aria-label={ariaLabel} className={classes}>{content}</a>) : (<Link …/>)`. Update the component's comment to say so. (Task 7's e2e clicks the link.)

- [ ] **Step 6: Write the page**

`app/(work)/colophon/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Fragment } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { type ColophonPart, STACK, sections } from "@/content/colophon";
import { DESCRIPTIONS } from "@/content/descriptions";
import { stackItems } from "@/lib/colophon";
import { describedMetadata } from "@/lib/metadata";
import pkg from "@/package.json";

export const metadata: Metadata = describedMetadata("Colophon", DESCRIPTIONS.colophon);

const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };

function Part({ part }: { part: ColophonPart }) {
  if (typeof part === "string") return <>{part}</>;
  // Running text: links are always underlined (WCAG 1.4.1).
  return (
    <TextLink href={part.href} underline="always">
      {part.text}
    </TextLink>
  );
}

// /colophon/ (Sprint 11b spec §2): how the site is built. The /book/ header
// pattern, then one row per section; the Stack row's versions come from
// package.json at build time.
export default function ColophonPage() {
  const stack = stackItems(STACK, deps);
  const [built, ...rest] = sections;
  const textRow = (section: (typeof sections)[number]) => (
    <SectionRow key={section.id} id={section.id} label={section.label}>
      <div className="flex flex-col gap-2 type-body text-fg-soft">
        {section.paragraphs.map((paragraph, index) => (
          <p key={index}>
            {paragraph.map((part, partIndex) => (
              <Part key={partIndex} part={part} />
            ))}
          </p>
        ))}
      </div>
    </SectionRow>
  );
  const rows = [
    <SectionRow
      key="header"
      id="colophon"
      labelAs="div"
      label={
        <ItemLink href="/" className="text-fg-muted">
          ← Home
        </ItemLink>
      }
    >
      <h1 className="type-lead">
        Colophon. <span className="text-fg-muted">How this site is made.</span>
      </h1>
    </SectionRow>,
    textRow(built),
    <SectionRow key="stack" id="stack" label="Stack">
      <ul className="flex flex-col gap-1 type-body text-fg-soft">
        {stack.map((item) => (
          <li key={item.name}>
            <TextLink href={item.href}>{item.version ? `${item.name} ${item.version}` : item.name}</TextLink>
            {item.note ? <span className="text-fg-muted"> · {item.note}</span> : null}
          </li>
        ))}
      </ul>
    </SectionRow>,
    ...rest.map(textRow),
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

(Stack items are a list of links, not running text, so they keep hover-only underlines.)

- [ ] **Step 7: The e2e**

`e2e/colophon.spec.ts`:

```ts
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };
const nextMajor = /(\d+)\./.exec(pkg.dependencies.next)?.[1];

test("/colophon/ names the stack with versions from package.json, credits Dither Kit and links the changelog", async ({ page }) => {
  await page.goto("/colophon/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Colophon.");
  for (const label of ["Built", "Stack", "Type", "Texture", "Data", "Source", "Agent", "History"]) {
    await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.locator("#stack")).toContainText(`Next.js ${nextMajor}`);
  await expect(page.getByRole("link", { name: /Dither Kit/ })).toHaveAttribute("href", "https://www.tripwire.sh/dither-kit");
  await expect(page.locator("#history").getByRole("link", { name: /changelog/ })).toHaveAttribute("href", "/changelog/");
  await expect(page.locator("#agent").getByRole("link", { name: /onur\.md/ })).toHaveAttribute("href", "/onur.md");
  await expect(page).toHaveTitle("Colophon · Onur Senture");
});
```

- [ ] **Step 8: Run everything**

```bash
npx vitest run tests/colophon.test.ts
npm run typecheck && npm run lint && npm test
npm run build && npx playwright test e2e/colophon.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add content/colophon.ts lib/colophon.ts components/ui/text-link.tsx "app/(work)/colophon/page.tsx" tests/colophon.test.ts e2e/colophon.spec.ts
git commit -m "Add the /colophon/ page with stack versions read from package.json

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Footer links

**Files:**
- Modify: `lib/build-info.ts`
- Modify: `components/shell/site-footer.tsx`
- Modify: `tests/build-info.test.ts`
- Modify: `e2e/shell.spec.ts`, `e2e/life-switch.spec.ts`

**Interfaces:**
- Consumes: `anchorOf` (Task 1).
- Produces: `buildMeta(info?: BuildInfo): string[]` (the parts after the version).

- [ ] **Step 1: Write the failing tests**

Append to `tests/build-info.test.ts` (import `buildMeta` too):

```ts
describe("buildMeta", () => {
  it("lists the parts after the version", () => {
    expect(buildMeta({ version: "2.9.0", date: "2026-10-03", commit: "a2c817a" })).toEqual(["updated Oct 3, 2026", "commit a2c817a"]);
    expect(buildMeta({ version: "2.9.0", date: "", commit: "" })).toEqual([]);
  });
});
```

In `e2e/shell.spec.ts`, in the first test, replace `await expect(footer.locator('[data-slot="paddle"]')).toHaveCount(1);` with:

```ts
  await expect(footer.locator('[data-slot="paddle"]')).toHaveCount(0);
  const version = (JSON.parse(readFileSync("package.json", "utf8")) as { version: string }).version;
  await expect(footer.getByRole("link", { name: `v${version}` })).toHaveAttribute("href", `/changelog/#v${version.split(".").join("-")}`);
  await expect(footer.getByRole("link", { name: "Colophon", exact: true })).toHaveAttribute("href", "/colophon/");
```

and add `import { readFileSync } from "node:fs";` at the top. Add a navigation check:

```ts
test("the footer's version opens its changelog entry", async ({ page }) => {
  const version = (JSON.parse(readFileSync("package.json", "utf8")) as { version: string }).version;
  await page.goto("/");
  await page.locator("footer").getByRole("link", { name: `v${version}` }).click();
  await expect(page).toHaveURL(new RegExp(`/changelog/#v${version.split(".").join("-")}$`));
  await expect(page.locator(`#v${version.split(".").join("-")}`)).toBeInViewport();
});
```

In `e2e/life-switch.spec.ts`, replace the build-line test's regex so it follows `package.json`:

```ts
test("the footer carries the build line", async ({ page }) => {
  const version = (JSON.parse(readFileSync("package.json", "utf8")) as { version: string }).version;
  await page.goto("/");
  await expect(page.getByTestId("build-line")).toHaveText(new RegExp(`^v${version.replaceAll(".", "\\.")} · updated [A-Z][a-z]{2} \\d{1,2}, \\d{4}.* · Colophon$`));
});
```

(add `import { readFileSync } from "node:fs";` there too).

- [ ] **Step 2: Run the unit test to see it fail**

Run: `npx vitest run tests/build-info.test.ts`
Expected: FAIL (`buildMeta` is not exported).

- [ ] **Step 3: Implement `buildMeta`**

In `lib/build-info.ts`, replace `buildLine` with:

```ts
// The parts after the version: "updated Oct 3, 2026", "commit a2c817a"; parts a build lacks are left out.
export function buildMeta(info: BuildInfo = buildInfo): string[] {
  return [info.date ? `updated ${formatDate(info.date)}` : null, info.commit ? `commit ${info.commit}` : null].filter(
    (part): part is string => part !== null,
  );
}

// "v2.0.0 · updated Oct 3, 2026 · commit a2c817a".
export function buildLine(info: BuildInfo = buildInfo): string {
  return [`v${info.version}`, ...buildMeta(info)].join(" · ");
}
```

- [ ] **Step 4: The footer**

In `components/shell/site-footer.tsx`:
- imports: `import Link from "next/link";`, `import { anchorOf } from "@/lib/changelog";`, and `import { buildInfo, buildMeta } from "@/lib/build-info";` (in place of `buildLine`);
- the comment above `SiteFooter` becomes `// One mono line (the version linking its changelog entry, build metadata, the colophon, © and the social links) over the accent wash.`;
- replace `<p data-testid="build-line">{buildLine()}</p>` with:

```tsx
        <p data-testid="build-line">
          <Link href={`/changelog/#${anchorOf(buildInfo.version)}`} className="hover:text-fg hover:underline">
            v{buildInfo.version}
          </Link>
          {buildMeta().map((part) => (
            <Fragment key={part}> · {part}</Fragment>
          ))}
          {" · "}
          <Link href="/colophon/" className="hover:text-fg hover:underline">
            Colophon
          </Link>
        </p>
```

  (import `Fragment` from `react` alongside `Suspense`);
- delete `<div data-slot="paddle" className="empty:hidden" />`.

- [ ] **Step 5: Run everything**

```bash
npx vitest run tests/build-info.test.ts
npm run typecheck && npm run lint && npm test
npm run build && npx playwright test e2e/shell.spec.ts e2e/life-switch.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Link the footer's version to its changelog entry and add Colophon

Removes the empty paddle slot: the paddle effect was dropped.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `/onur.md`

**Files:**
- Create: `content/agent-intro.ts`
- Create: `lib/agent/onur-md.ts`
- Create: `lib/agent/read.ts`
- Create: `app/onur.md/route.ts`
- Create: `tests/agent/onur-md.test.ts`
- Create: `e2e/agent.spec.ts`

**Interfaces:**
- Consumes: `getPublishedContent()` and `CONTENT_TAG` (`lib/content/read.ts`), `experienceViews` (`lib/work/views.ts`), `homeSwitches`, `profile`, `socialLinks` (`content/profile.ts`), `booking`, `bookingEnabled`, `calUrl` (`content/booking.ts`), `ORGS` (`content/orgs.ts`), `site` (`lib/site.ts`).
- Produces:
  - `lib/agent/onur-md.ts` (pure): `interface AgentInput` (below), `absoluteUrl(siteUrl, href)`, `bioPlain(bio: BioSegment[][]): string[]`, `buildOnurMd(input: AgentInput): string`.
  - `lib/agent/read.ts` (server only): `agentInput(): Promise<{ input: AgentInput; fallback: boolean }>`.

```ts
export interface AgentInput {
  siteUrl: string;
  name: string;
  role: string;
  place: string;
  available: boolean;
  intro: string[];
  bio: string[];
  experience: { org: string; role: string; span: string; products: { title: string; href?: string }[] }[];
  work: { title: string; summary: string; href: string }[];
  lab: { title: string; description: string; year?: string; href?: string }[];
  booking: { title: string; minutes: number; href: string }[];
  socials: { label: string; href: string }[];
}
```

- [ ] **Step 1: Write the failing tests**

`tests/agent/onur-md.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { type AgentInput, absoluteUrl, bioPlain, buildOnurMd } from "@/lib/agent/onur-md";

const input: AgentInput = {
  siteUrl: "https://onursenture.com",
  name: "Onur Senture",
  role: "Designer who builds",
  place: "Ankara",
  available: true,
  intro: ["I'm Onur.", "Second paragraph."],
  bio: ["For ten years I led design at PrimeTek."],
  experience: [{ org: "PrimeTek", role: "Design lead", span: "May 2016–Apr 2026", products: [{ title: "PrimeOne", href: "/work/primeone/" }, { title: "Old thing" }] }],
  work: [{ title: "PrimeOne", summary: "A design system. Eighty components.", href: "/work/primeone/" }],
  lab: [{ title: "count.do [Remastered]", description: "A countdown app.", year: "2026", href: "https://countdo.orkestra.co/" }, { title: "No link", description: "Private." }],
  booking: [{ title: "Role / hiring", minutes: 30, href: "https://cal.com/onursenture/role" }],
  socials: [{ label: "GitHub", href: "https://github.com/onursenture" }],
};

describe("absoluteUrl", () => {
  it("prefixes site paths and keeps full URLs", () => {
    expect(absoluteUrl("https://onursenture.com", "/work/x/")).toBe("https://onursenture.com/work/x/");
    expect(absoluteUrl("https://onursenture.com", "https://x.com/w00f")).toBe("https://x.com/w00f");
  });
});

describe("buildOnurMd", () => {
  const md = buildOnurMd(input);

  it("opens with the name and the intro, then the sections in order", () => {
    expect(md.startsWith("# Onur Senture\n\nI'm Onur.\n\nSecond paragraph.\n\n## Profile\n")).toBe(true);
    const order = ["## Profile", "## Experience", "## Selected work", "## Lab", "## Resume", "## Contact", "## More"].map((h) => md.indexOf(h));
    expect(order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1]))).toBe(true);
  });

  it("states availability only when it is true", () => {
    expect(md).toContain("- Open to work");
    expect(buildOnurMd({ ...input, available: false })).not.toContain("Open to work");
  });

  it("writes absolute links and escapes brackets in titles", () => {
    expect(md).toContain("[PrimeOne](https://onursenture.com/work/primeone/)");
    expect(md).toContain("[count.do \\[Remastered\\]](https://countdo.orkestra.co/) (2026): A countdown app.");
    expect(md).toContain("- No link: Private.");
    expect(md).toContain("**PrimeTek**, Design lead (May 2016–Apr 2026): [PrimeOne](https://onursenture.com/work/primeone/), Old thing");
    expect(md).toContain("[Resume (PDF)](https://onursenture.com/resume.pdf)");
  });

  it("lists booking links, then socials, and never an email address", () => {
    expect(md).toContain("- [Book a call: Role / hiring (30 min)](https://cal.com/onursenture/role)");
    expect(md).toContain("- [GitHub](https://github.com/onursenture)");
    expect(md).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(md).not.toContain("mailto:");
  });

  it("leaves out an empty section", () => {
    const bare = buildOnurMd({ ...input, lab: [], work: [], booking: [] });
    expect(bare).not.toContain("## Lab");
    expect(bare).not.toContain("## Selected work");
    expect(bare).not.toContain("Book a call");
    expect(bare).toContain("## Contact");
  });
});

describe("bioPlain", () => {
  it("names the organisations in plain text", () => {
    expect(bioPlain([["At ", { org: "primetek" }, " and ", { org: "orkestra" }, "."]])).toEqual(["At PrimeTek and Orkestra Studios."]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/agent/onur-md.test.ts`
Expected: FAIL (missing modules).

- [ ] **Step 3: Write `lib/agent/onur-md.ts`**

```ts
// /onur.md (Sprint 11b spec §3.1): the site as one Markdown profile for AI
// agents. Pure: lib/agent/read.ts gathers the input from the published
// content. An empty section is left out; there is never an email address.
import { ORGS } from "@/content/orgs";
import type { BioSegment } from "@/content/profile";

export interface AgentInput {
  siteUrl: string;
  name: string;
  role: string;
  place: string;
  available: boolean;
  intro: string[];
  bio: string[];
  experience: { org: string; role: string; span: string; products: { title: string; href?: string }[] }[];
  work: { title: string; summary: string; href: string }[];
  lab: { title: string; description: string; year?: string; href?: string }[];
  booking: { title: string; minutes: number; href: string }[];
  socials: { label: string; href: string }[];
}

export function absoluteUrl(siteUrl: string, href: string): string {
  return /^https?:\/\//.test(href) ? href : `${siteUrl}${href}`;
}

// The home bio as plain paragraphs: an organisation mark becomes its name.
export function bioPlain(bio: BioSegment[][]): string[] {
  return bio.map((paragraph) => paragraph.map((segment) => (typeof segment === "string" ? segment : ORGS[segment.org].name)).join(""));
}

// Link text can't hold an unescaped bracket.
function text(value: string): string {
  return value.replace(/[[\]]/g, (bracket) => `\\${bracket}`);
}

function link(siteUrl: string, title: string, href: string): string {
  return `[${text(title)}](${absoluteUrl(siteUrl, href)})`;
}

function section(heading: string, lines: string[]): string[] {
  return lines.length > 0 ? [`## ${heading}`, "", ...lines, ""] : [];
}

export function buildOnurMd(input: AgentInput): string {
  const { siteUrl } = input;
  const profile = [`- Role: ${input.role}`, `- Location: ${input.place}`, ...(input.available ? ["- Open to work"] : [])];
  const experience = input.experience.map((entry) => {
    const products = entry.products.map((p) => (p.href ? link(siteUrl, p.title, p.href) : text(p.title))).join(", ");
    const head = `- **${text(entry.org)}**, ${entry.role}${entry.span ? ` (${entry.span})` : ""}`;
    return products ? `${head}: ${products}` : head;
  });
  const work = input.work.map((w) => `- ${link(siteUrl, w.title, w.href)}: ${w.summary}`);
  const lab = input.lab.map((entry) => {
    const name = entry.href ? link(siteUrl, entry.title, entry.href) : text(entry.title);
    return `- ${name}${entry.year ? ` (${entry.year})` : ""}: ${entry.description}`;
  });
  const resume = [`- ${link(siteUrl, "Resume", "/resume/")}`, `- ${link(siteUrl, "Resume (PDF)", "/resume.pdf")}`];
  const contact = [
    ...input.booking.map((b) => `- ${link(siteUrl, `Book a call: ${b.title} (${b.minutes} min)`, b.href)}`),
    ...input.socials.map((s) => `- ${link(siteUrl, s.label, s.href)}`),
  ];
  const more = [
    ["Notes", "/notes/"],
    ["Life", "/life/"],
    ["Changelog", "/changelog/"],
    ["Colophon", "/colophon/"],
  ].map(([title, href]) => `- ${link(siteUrl, title, href)}`);

  const lines = [
    `# ${input.name}`,
    "",
    ...input.intro.flatMap((paragraph) => [paragraph, ""]),
    "## Profile",
    "",
    ...profile,
    "",
    ...input.bio.flatMap((paragraph) => [paragraph, ""]),
    ...section("Experience", experience),
    ...section("Selected work", work),
    ...section("Lab", lab),
    ...section("Resume", resume),
    ...section("Contact", contact),
    ...section("More", more),
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}
```

- [ ] **Step 4: Write `content/agent-intro.ts`**

```ts
// The opening of /onur.md (Sprint 11b): first person, like the home bio,
// written for AI agents and the people who send them. Availability is not
// stated here: the Profile section adds "Open to work" from the published
// switch. Draft copy: Onur approves it on production.
export const agentIntro: string[] = [
  "I'm Onur Senture, a designer who builds: I design interfaces and design systems and ship them as working software, from components to complete apps.",
  "This file sums up my site for AI agents. Every link goes to the full page; to reach me, use a booking link or a profile under Contact.",
];
```

- [ ] **Step 5: Write `lib/agent/read.ts`**

```ts
import "server-only";
import { agentIntro } from "@/content/agent-intro";
import { booking, bookingEnabled, calUrl } from "@/content/booking";
import { ORGS } from "@/content/orgs";
import { homeSwitches, profile, socialLinks } from "@/content/profile";
import { safeSpan } from "@/content/experience";
import { getPublishedContent } from "@/lib/content/read";
import { site } from "@/lib/site";
import { experienceViews } from "@/lib/work/views";
import { type AgentInput, bioPlain } from "./onur-md";

// Everything /onur.md and /llms.txt say, from the published site (admin
// documents over the repo). `fallback` is true when the repo stands in for an
// unreadable store, so the caller can cache for minutes, like the resume PDF.
export async function agentInput(): Promise<{ input: AgentInput; fallback: boolean }> {
  const { site: content, fallback } = await getPublishedContent();
  const pinnedSlugs = [...new Set(content.pins.map((pin) => pin.slug))];
  const work = pinnedSlugs.flatMap((slug) => {
    const page = content.pages.find((p) => p.slug === slug);
    return page ? [{ title: page.title, summary: `${page.lead.strong} ${page.lead.rest}`.trim(), href: `/work/${page.slug}/` }] : [];
  });
  const input: AgentInput = {
    siteUrl: site.url,
    name: profile.name,
    role: profile.role,
    place: profile.location.place,
    available: homeSwitches(content.profile).available,
    intro: agentIntro,
    bio: bioPlain(content.profile.bio),
    experience: experienceViews(content).map((entry) => ({
      org: ORGS[entry.org].name,
      role: entry.role,
      span: safeSpan(entry.start, entry.end),
      products: entry.children.map((child) => ({ title: child.title, href: child.href })),
    })),
    work,
    lab: content.lab.map((entry) => ({ title: entry.title, description: entry.description, year: entry.year, href: entry.href })),
    booking: bookingEnabled() ? booking.types.map((type) => ({ title: type.title, minutes: type.minutes, href: calUrl(type) })) : [],
    socials: socialLinks().map((link) => ({ label: link.label, href: link.href })),
  };
  return { input, fallback };
}
```

- [ ] **Step 6: Write the route**

`app/onur.md/route.ts`:

```ts
import { cacheLife, cacheTag } from "next/cache";
import { buildOnurMd } from "@/lib/agent/onur-md";
import { agentInput } from "@/lib/agent/read";
import { CONTENT_TAG } from "@/lib/content/read";

// Prerendered at build and regenerated when an admin publish revalidates the
// content tag. Its own cacheLife wins over the content read's, so it follows
// the read's fallback: minutes while the repo stands in, days otherwise.
async function onurMd(): Promise<string> {
  "use cache";
  cacheTag(CONTENT_TAG);
  const { input, fallback } = await agentInput();
  cacheLife(fallback ? "minutes" : "days");
  return buildOnurMd(input);
}

export async function GET() {
  return new Response(await onurMd(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
```

- [ ] **Step 7: The e2e**

`e2e/agent.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { resume } from "../content/resume";

test("/onur.md is Markdown with the profile and no email address", async ({ request }) => {
  const response = await request.get("/onur.md");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("text/markdown; charset=utf-8");
  const md = await response.text();
  expect(md.startsWith("# Onur Senture\n")).toBe(true);
  for (const heading of ["## Profile", "## Experience", "## Resume", "## Contact"]) expect(md).toContain(heading);
  expect(md).toContain("https://onursenture.com/resume.pdf");
  if (resume.email) expect(md).not.toContain(resume.email);
  expect(md).not.toContain("mailto:");
});

test("the colophon's onur.md link opens the file", async ({ page }) => {
  await page.goto("/colophon/");
  await page.locator("#agent").getByRole("link", { name: /onur\.md/ }).click();
  await expect(page).toHaveURL(/\/onur\.md$/);
  await expect(page.locator("body")).toContainText("# Onur Senture");
});
```

Check the export name in `content/resume.ts` first (`grep -n "export const" content/resume.ts`) and use it; the field is `email`.

- [ ] **Step 8: Run everything**

```bash
npx vitest run tests/agent/onur-md.test.ts
npm run typecheck && npm run lint && npm test
npm run build && npx playwright test e2e/agent.spec.ts
```

Expected: PASS. Read the built file once (`curl -s localhost:3217/onur.md` while the e2e server runs, or `npm run start` briefly) and paste it into the report.

- [ ] **Step 9: Commit**

```bash
git add content/agent-intro.ts lib/agent tests/agent app/onur.md e2e/agent.spec.ts
git commit -m "Serve /onur.md, the site as one Markdown profile for AI agents

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `/llms.txt` and discovery

**Files:**
- Create: `lib/agent/llms-txt.ts`
- Create: `app/llms.txt/route.ts`
- Create: `tests/agent/llms-txt.test.ts`
- Modify: `app/layout.tsx`
- Modify: `components/life/boot-readout.tsx`
- Modify: `e2e/agent.spec.ts`, `e2e/life.spec.ts`

**Interfaces:**
- Consumes: `AgentInput`, `absoluteUrl` (Task 7), `agentInput()` (Task 7), `firstSentence` (`lib/resume/view.ts`).
- Produces: `buildLlmsTxt(input: AgentInput): string`.

- [ ] **Step 1: Write the failing tests**

`tests/agent/llms-txt.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "@/lib/agent/llms-txt";
import type { AgentInput } from "@/lib/agent/onur-md";

const input: AgentInput = {
  siteUrl: "https://onursenture.com",
  name: "Onur Senture",
  role: "Designer who builds",
  place: "Ankara",
  available: true,
  intro: ["I'm Onur Senture, a designer who builds. More here.", "Second."],
  bio: [],
  experience: [],
  work: [{ title: "PrimeOne", summary: "A design system.", href: "/work/primeone/" }],
  lab: [],
  booking: [],
  socials: [],
};

describe("buildLlmsTxt", () => {
  const txt = buildLlmsTxt(input);

  it("follows the llms.txt shape: one H1, a summary quote, then H2 sections of links", () => {
    expect(txt.match(/^# /gm)).toHaveLength(1);
    expect(txt.startsWith("# Onur Senture\n\n> Designer who builds. I'm Onur Senture, a designer who builds.\n")).toBe(true);
    expect(txt.match(/^## (.+)$/gm)).toEqual(["## Profile", "## Work", "## Optional"]);
    for (const line of txt.split("\n").filter((l) => l.startsWith("- "))) {
      expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)]+\)(: .+)?$/);
    }
  });

  it("lists onur.md first under Profile", () => {
    const profile = txt.split("## Profile\n\n")[1];
    expect(profile.startsWith("- [onur.md](https://onursenture.com/onur.md)")).toBe(true);
  });

  it("leaves out Work when nothing is pinned", () => {
    expect(buildLlmsTxt({ ...input, work: [] })).not.toContain("## Work");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/agent/llms-txt.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write `lib/agent/llms-txt.ts`**

```ts
import { firstSentence } from "@/lib/resume/view";
import { type AgentInput, absoluteUrl } from "./onur-md";

// /llms.txt (llmstxt.org; Sprint 11b spec §3.2): an H1, a one-line summary
// quote, then H2 sections of links. Built from the same input as /onur.md.
export function buildLlmsTxt(input: AgentInput): string {
  const { siteUrl } = input;
  const item = (title: string, href: string, note?: string) => `- [${title}](${absoluteUrl(siteUrl, href)})${note ? `: ${note}` : ""}`;
  const section = (heading: string, lines: string[]) => (lines.length > 0 ? [`## ${heading}`, "", ...lines, ""] : []);
  const summary = [`${input.role}.`, input.intro[0] ? firstSentence(input.intro[0]) : ""].filter(Boolean).join(" ");
  const lines = [
    `# ${input.name}`,
    "",
    `> ${summary}`,
    "",
    ...section("Profile", [
      item("onur.md", "/onur.md", "the whole site as one Markdown profile"),
      item("Resume", "/resume/", "experience, projects, skills and education"),
      item("Resume (PDF)", "/resume.pdf", "the same resume as a one-page PDF"),
    ]),
    ...section(
      "Work",
      input.work.map((w) => item(w.title, w.href, w.summary)),
    ),
    ...section("Optional", [
      item("Notes", "/notes/", "short notes"),
      item("Life", "/life/", "films, books, theatre, saved articles and photos"),
      item("Changelog", "/changelog/", "every release of the site"),
      item("Colophon", "/colophon/", "how the site is built"),
    ]),
  ];
  return `${lines.join("\n").trimEnd()}\n`;
}
```

`lib/resume/view.ts` imports only pure modules, so the test can load it.

- [ ] **Step 4: Write the route**

`app/llms.txt/route.ts`:

```ts
import { cacheLife, cacheTag } from "next/cache";
import { buildLlmsTxt } from "@/lib/agent/llms-txt";
import { agentInput } from "@/lib/agent/read";
import { CONTENT_TAG } from "@/lib/content/read";

// Cached like /onur.md: the content tag, minutes on the repo fallback, else days.
async function llmsTxt(): Promise<string> {
  "use cache";
  cacheTag(CONTENT_TAG);
  const { input, fallback } = await agentInput();
  cacheLife(fallback ? "minutes" : "days");
  return buildLlmsTxt(input);
}

export async function GET() {
  return new Response(await llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
```

- [ ] **Step 5: The alternate link on every page**

A page that sets `alternates` (note pages set a canonical) would replace a layout-level `metadata.alternates`, so the link goes straight into the root layout's `<head>`. In `app/layout.tsx`:

```tsx
    <html lang="en" className={`${plexMono.variable} ${plexSans.variable} ${doto.variable}`}>
      <head>
        {/* The Markdown profile for agents (Sprint 11b). In <head> directly, not
            metadata.alternates, which a page's own alternates would replace. */}
        <link rel="alternate" type="text/markdown" href="/onur.md" title="Onur Senture in Markdown" />
      </head>
      <body>{children}</body>
    </html>
```

- [ ] **Step 6: The readout line**

In `components/life/boot-readout.tsx`:
- after `const BOOT = [...]` add:

```tsx
// A pointer for agents after the boot lines (Sprint 11b), typed with them.
const AGENT = { head: "Not human? → ", link: "onur.md", href: "/onur.md" };
const AGENT_TEXT = AGENT.head + AGENT.link;
```

- `texts` becomes `[...BOOT, AGENT_TEXT, ...lines.map(readoutText)]`;
- the data lines read `visible[BOOT.length + 1 + i]` (was `visible[BOOT.length + i]`);
- in the boot block, after the `BOOT.map(...)`, add the agent line:

```tsx
        <p>{agentLine(visible[BOOT.length])}</p>
```

- and add this helper above `BootReadout` (a plain `<a>`: next/link would try a client navigation to a route handler):

```tsx
// The agent line, cut to the first n characters while typing.
function agentLine(n: number) {
  if (n <= 0) return "\u00a0";
  const linkPart = AGENT.link.slice(0, Math.max(0, n - AGENT.head.length));
  return (
    <>
      {AGENT.head.slice(0, n)}
      {linkPart ? (
        <a href={AGENT.href} className="underline decoration-fg-muted underline-offset-[3px] hover:decoration-fg">
          {linkPart}
        </a>
      ) : null}
    </>
  );
}
```

- [ ] **Step 7: E2E**

Append to `e2e/agent.spec.ts`:

```ts
test("/llms.txt is plain text in the llms.txt shape and links onur.md first", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("text/plain; charset=utf-8");
  const txt = await response.text();
  expect(txt.startsWith("# Onur Senture\n\n> ")).toBe(true);
  expect(txt).toContain("## Profile\n\n- [onur.md](https://onursenture.com/onur.md)");
});

for (const path of ["/", "/life/", "/resume/", "/changelog/"]) {
  test(`${path} links the Markdown profile in <head>`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('head link[rel="alternate"][type="text/markdown"]')).toHaveAttribute("href", "/onur.md");
  });
}
```

Append to `e2e/life.spec.ts`:

```ts
test("the readout points agents to onur.md after the boot lines", async ({ page }) => {
  await page.goto("/life/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("Not human? → onur.md");
  await expect(now.getByRole("link", { name: "onur.md" })).toHaveAttribute("href", "/onur.md");
});
```

- [ ] **Step 8: Run everything**

```bash
npx vitest run tests/agent
npm run typecheck && npm run lint && npm test
npm run build && npx playwright test e2e/agent.spec.ts e2e/life.spec.ts
```

Expected: PASS. The typing tests in `e2e/life.spec.ts` (waiting for "Human detected.") must still pass: the agent line comes after it.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Serve /llms.txt and point to onur.md from every page and the Life readout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Component accessibility fixes

A4 (scroll regions), A5 (figure button names), A6 (the clock label) and A8 (focus outlines clipped by truncation).

**Files:**
- Modify: `components/ui/heatmap.tsx`, `components/ui/data-table.tsx`
- Modify: `components/work/media-button.tsx`
- Modify: `components/ui/live-clock.tsx`
- Modify: `components/home/experience-list.tsx`
- Modify: `components/life/boot-readout.tsx`
- Modify: `app/globals.css` (one utility)
- Test: `tests/ui/text-primitives.test.tsx`, `tests/ui/layout-primitives.test.tsx`, `tests/ui/work.test.tsx`, `tests/ui/home.test.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Produces: the `focus-room` utility (4px padding, -4px margin) for a `truncate` box that holds links.

- [ ] **Step 1: Write the failing tests**

`tests/ui/text-primitives.test.tsx`: replace the LiveClock expectation with:

```tsx
  it("LiveClock prerenders --:-- with a visually hidden label (no aria-label on <time>)", () => {
    expect(html(<LiveClock timeZone="Europe/Istanbul" place="Ankara" />)).toBe(
      '<span class="sr-only">Local time in Ankara: </span><time data-testid="local-time">--:--</time>',
    );
  });
```

(keep the test's existing name if other tests reference it; only the expectation must change).

`tests/ui/work.test.tsx`: change the two label expectations to:

```tsx
    expect(markup).toContain('aria-label="FIG. 02 · Tokens, open in viewer"');
    expect(markup).toContain('aria-label="FIG. 03, open in viewer"');
```

`tests/ui/layout-primitives.test.tsx`: add (use the file's `columns` fixture and `html` helper; import `Heatmap` from `@/components/ui/heatmap` if not imported):

```tsx
describe("scrollable regions", () => {
  it("DataTable's scroller is a focusable, named region", () => {
    const markup = html(<DataTable columns={columns} rows={[]} rowKey={(r) => r.title} caption="Films" />);
    expect(markup).toContain('<div tabindex="0" role="region" aria-label="Films (scrolls sideways)" class="overflow-x-auto"');
  });

  it("Heatmap's scroller is a focusable, named region", () => {
    const markup = html(<Heatmap data={{ total: 3, weeks: [{ days: [{ date: "2026-01-04", count: 3, level: 2 }] }] }} />);
    expect(markup).toContain('tabindex="0" role="region" aria-label="Contributions heatmap (scrolls sideways)"');
  });
});
```

Check the `Contributions` type in `lib/sources/github.ts` and match the inline `data` to it.

`tests/ui/home.test.tsx` (or the closest file that renders `ExperienceList`; check with `grep -rln ExperienceList tests`): add

```tsx
it("doesn't clip a product link's focus ring: the link truncates itself, not a wrapper", () => {
  const markup = html(
    <ExperienceList entries={[{ org: "primetek", role: "Lead", start: "2016-05", end: null, children: [{ title: "PrimeOne", note: "design system", href: "/work/primeone/", years: "2018" }] }]} />,
  );
  expect(markup).toMatch(/<a [^>]*class="[^"]*\bblock truncate\b/);
  expect(markup).not.toContain('<span class="truncate"><a');
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/ui`
Expected: the four changed or new expectations FAIL.

- [ ] **Step 3: Scroll regions (A4)**

`components/ui/data-table.tsx`, the outer div:

```tsx
    // Focusable and named, so keyboard users can scroll a table wider than the screen (axe scrollable-region-focusable).
    <div tabIndex={0} role="region" aria-label={`${caption ?? "Table"} (scrolls sideways)`} className="overflow-x-auto">
```

`components/ui/heatmap.tsx`, the outer div:

```tsx
    // Focusable and named: on a phone the year is wider than the screen.
    <div tabIndex={0} role="region" aria-label="Contributions heatmap (scrolls sideways)" className="overflow-x-auto">
```

- [ ] **Step 4: Figure buttons (A5)**

`components/work/media-button.tsx`: the label starts with the visible text (WCAG 2.5.3):

```tsx
      aria-label={`${figureLabel(media)}, open in viewer`}
```

- [ ] **Step 5: The clock (A6)**

`components/ui/live-clock.tsx`:

```tsx
// HH:mm in a time zone, ticking each minute. Prerendered pages show --:--
// until hydration, so the HTML never carries a stale time. The place is
// visually hidden text: <time> may not carry an aria-label.
export function LiveClock({ timeZone, place }: { timeZone: string; place: string }) {
  const now = useNow();
  const time = now === null ? null : formatClock(now, timeZone);
  return (
    <>
      <span className="sr-only">{`Local time in ${place}: `}</span>
      <time data-testid="local-time" dateTime={time ?? undefined}>
        {time ?? "--:--"}
      </time>
    </>
  );
}
```

`e2e/home.spec.ts`: replace `page.getByLabel("Local time in Ankara")` with `page.locator("#identity").getByTestId("local-time")`.

- [ ] **Step 6: Truncation that clips focus rings (A8)**

`components/home/experience-list.tsx`, the product title cell:

```tsx
                  {/* The link truncates itself, so no overflow:hidden wrapper clips its focus ring. */}
                  <span className="min-w-0">
                    {child.href ? (
                      <ItemLink href={child.href} className="block truncate text-accent">
                        {child.title}
                      </ItemLink>
                    ) : (
                      <span className="block truncate text-fg">{child.title}</span>
                    )}
                  </span>
```

The readout's lines are text with a link inside, so they can't move the truncation. In `app/globals.css` add after the `type-*` utilities:

```css
/* A truncate box holding a link: 4px of padding, taken back by a negative
   margin, so the box's overflow clip no longer cuts the link's focus ring.
   Layout is unchanged. */
@utility focus-room {
  padding: 4px;
  margin: -4px;
}
```

In `components/life/boot-readout.tsx`:
- the final-state `<li key={line.key} className="truncate">` becomes `className="focus-room truncate"`;
- the typing-state `<li key={line.key} className="relative truncate">` becomes `className="focus-room relative truncate"`, and its overlay `<span className="absolute inset-0 truncate">` becomes `className="absolute inset-1 truncate"` (inset-1 = the 4px padding, so the typed text stays exactly over the invisible full line).

- [ ] **Step 7: Run everything and check the readout visually**

```bash
npx vitest run tests/ui
npm run typecheck && npm run lint && npm test
npm run build && npx playwright test e2e/home.spec.ts e2e/life.spec.ts e2e/system.spec.ts e2e/work-viewer.spec.ts e2e/work-product.spec.ts
npm run screenshots -- /tmp/s11b-task9 / /life/
```

Expected: PASS. In the screenshots, the readout lines and the Experience rows sit exactly where they do on production (onursenture.vercel.app at the same width): same line spacing, same left edge. Include the two 390px screenshots' paths in the report.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Make scroll regions focusable, fix figure and clock names, stop clipping focus rings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Life images load sooner and smaller

P1 (eager first images) and P2 (smaller covers).

**Files:**
- Modify: `components/ui/cover.tsx`
- Modify: `components/life/archive/remote-image.tsx`, `archive-tile.tsx`, `tile-row.tsx`, `year-months.tsx`, `films-archive.tsx`, `books-archive.tsx`, `theatre-archive.tsx`, `saved-list.tsx`, `saved-archive.tsx`
- Modify: `components/photos/photo-grid.tsx`, `app/life/photos/page.tsx`
- Modify: `components/sections/films/index.tsx`
- Modify: `lib/sources/goodreads.ts`
- Test: `tests/ui/layout-primitives.test.tsx`, `tests/ui/life-sections.test.tsx`, `tests/life/archive-components.test.tsx`, `tests/sources/goodreads.test.ts`

**Interfaces:**
- Produces: `EAGER_TILES = 4` (exported from `components/ui/cover.tsx`); `priority?: boolean` on `Cover`, `RemoteImage`, `ArchiveTile`; `eager?: number` (how many leading tiles load eagerly, default 0) on `TileRow`, `YearMonths`, `SavedList`, `PhotoGrid`.

- [ ] **Step 1: Write the failing tests**

`tests/ui/layout-primitives.test.tsx`, in `describe("Cover")`:

```tsx
  it("loads eagerly with high priority when asked", () => {
    const markup = html(<Cover src="https://example.com/p.jpg" alt="" priority />);
    expect(markup).toContain('loading="eager"');
    expect(markup).toContain('fetchPriority="high"');
  });
```

`tests/ui/life-sections.test.tsx`, in the films test block, add:

```tsx
  it("films load the first four posters eagerly, at the archive's poster size", () => {
    const Render = films.Render;
    const poster = "https://a.ltrbxd.com/resized/film-poster/2/1/8/0/1/21801-x-0-600-0-900-crop.jpg?v=1";
    const data = [1, 2, 3, 4, 5, 6].map((n) => ({ ...film, link: `https://letterboxd.com/onur/film/f${n}/`, poster }));
    const html = renderToStaticMarkup(<Render data={data} />);
    expect(html.match(/loading="eager"/g)).toHaveLength(4);
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
    expect(html).toContain("-0-230-0-345-crop");
    expect(html).not.toContain("-0-600-0-900-crop");
  });
```

`tests/life/archive-components.test.tsx`: add (match its imports and `item` fixture; `TileRow` from `@/components/life/archive/tile-row`):

```tsx
it("TileRow loads only its first `eager` tiles eagerly", () => {
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ ...item, key: `k${n}`, image: `https://example.com/${n}.jpg` }));
  const markup = renderToStaticMarkup(<TileRow heading="Sep" items={items} eager={4} />);
  expect(markup.match(/loading="eager"/g)).toHaveLength(4);
  expect(markup.match(/loading="lazy"/g)).toHaveLength(2);
  expect(renderToStaticMarkup(<TileRow heading="Sep" items={items} />)).not.toContain('loading="eager"');
});
```

`tests/sources/goodreads.test.ts`: the expected cover becomes `…/663561._SY160_.jpg` (same URL, `_SY475_` → `_SY160_`).

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/ui tests/life tests/sources/goodreads.test.ts`
Expected: the new and changed expectations FAIL.

- [ ] **Step 3: `Cover` and `RemoteImage`**

`components/ui/cover.tsx`:

```tsx
// How many leading images of a Life grid load eagerly with high priority:
// the first row on a phone (4 columns), which holds the page's LCP image.
export const EAGER_TILES = 4;
```

and give `Cover` a `priority = false` prop:

```tsx
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
```

`components/life/archive/remote-image.tsx`: the same `priority = false` prop and the same two attributes in place of `loading="lazy"`. Update the comment above the `ref` callback: "(A lazy image not yet requested is not complete…)" stays true.

- [ ] **Step 4: Thread it through the archive**

- `archive-tile.tsx`: `ArchiveTile({ item, priority = false }: { item: ArchiveItem; priority?: boolean })` passes `priority` to `RemoteImage`.
- `tile-row.tsx`: add `eager = 0` (`eager?: number`, comment: "How many leading tiles load eagerly (the page's first row)") and render `items.map((item, index) => <ArchiveTile key={item.key} item={item} priority={index < eager} />)`.
- `year-months.tsx`: add `eager = 0`; the first month's `TileRow` gets `eager={eager}`, the rest get nothing.
- `films-archive.tsx`: import `EAGER_TILES` from `@/components/ui/cover`; the Undated `TileRow` and the `YearMonths` get `eager={EAGER_TILES}`.
- `books-archive.tsx`: the first tile row on the page gets `eager={EAGER_TILES}`: keep `let eager = EAGER_TILES;` before the pushes, pass `eager={eager}` to each `TileRow` / `YearMonths` you push and set `eager = 0` after the first one.
- `theatre-archive.tsx`: the first year's `TileRow` gets `eager={EAGER_TILES}` (`eager={index === 0 ? EAGER_TILES : 0}` in the map).
- `saved-list.tsx`: add `eager = 0`; `items.map((item, index) => …)` passes `priority={index < eager}` to `RemoteImage`. `saved-archive.tsx` passes `eager={1}` (one image per row; on a phone the first image is at the top).

- [ ] **Step 5: Photos and the films row**

`components/photos/photo-grid.tsx`: add `eager = 0` (`eager?: number`) and pass `priority={index < eager}` to `PictureView` (`photos.map((photo, index) => …)`). `app/life/photos/page.tsx`: `<PhotoGrid photos={photos} eager={EAGER_TILES} />` (import from `@/components/ui/cover`).

`components/sections/films/index.tsx`:

```tsx
import { COVER_GRID, Cover, EAGER_TILES } from "@/components/ui/cover";
import { posterCrop } from "@/lib/life-log/films";
```

and in `Render`, `data.map((film, index) => …)` with:

```tsx
            {/* The archive's 230×345 crop: the RSS poster is 600×900 for a 96px tile. */}
            <Cover src={posterCrop(film.poster)} alt="" width={96} priority={index < EAGER_TILES} className="mb-1" />
```

(`posterCrop("")` returns `""`, so a film without a poster still renders the empty block.)

`lib/sources/goodreads.ts`:

```ts
// Goodreads serves tiny thumbnails (._SY75_ / ._SX50_); ask for 160px, twice
// the largest tile (84–96px). Covers already stored keep their URL until the
// next sync rewrites the snapshot.
function upgradeCover(url: string): string {
  return url.replace(/\._S[XY]\d+_/, "._SY160_").replace(/\/s\/[^/]+\//, "/l/");
}
```

- [ ] **Step 6: Run everything**

```bash
npx vitest run tests/ui tests/life tests/sources
npm run typecheck && npm run lint && npm test
npm run build && npx playwright test e2e/life.spec.ts e2e/life-archives.spec.ts e2e/photos.spec.ts
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected: PASS. In the fixture build, check one page by hand: `curl -s localhost:3219/life/films/ | grep -o 'loading="eager"' | wc -l` (with the fixture server running) prints 4.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Load the first Life images eagerly and request smaller covers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: The axe guard

**Files:**
- Modify: `package.json`, `package-lock.json` (`@axe-core/playwright` dev dependency)
- Create: `e2e/a11y-routes.ts`
- Create: `e2e/axe.ts`
- Create: `e2e/a11y.spec.ts`
- Create: `e2e-fixtures/a11y.spec.ts`
- Create: `e2e-admin/a11y.spec.ts`
- Create: `tests/a11y-routes.test.ts`

**Interfaces:**
- Produces: `auditRoutes(data?: AuditData): AuditRoute[]`; `expectNoViolations(page, label)` and `expectNoAdminLabelViolations(page, label)` in `e2e/axe.ts`.

- [ ] **Step 1: Install**

Run: `npm i -D @axe-core/playwright@4.13.0`
Expected: added to `devDependencies`, pinned.

- [ ] **Step 2: Write the route list and its completeness test**

`e2e/a11y-routes.ts` (data only, no Playwright import: the unit test reads it):

```ts
// Every public page route (app/**/page.tsx outside app/admin) and the URL the
// axe guard audits for it. tests/a11y-routes.test.ts fails when a page route
// is missing, so a new page can't skip the guard. `path: null` means nothing
// to audit in that build: the page needs data the build doesn't have (it would
// only be the 404, which the [...missing] rows cover) or it renders the same
// component as another row (noted inline).
export interface AuditData {
  workNoteTid?: string;
  lifeNoteTid?: string;
  photoSlug?: string;
  workNotesPage2?: boolean;
  lifeNotesPage2?: boolean;
}

export interface AuditRoute {
  route: string;
  path: string | null;
}

export function auditRoutes(data: AuditData = {}): AuditRoute[] {
  return [
    { route: "(work)", path: "/" },
    { route: "(work)/[...missing]", path: "/does-not-exist/" },
    { route: "(work)/book", path: "/book/" },
    { route: "(work)/changelog", path: "/changelog/" },
    { route: "(work)/colophon", path: "/colophon/" },
    { route: "(work)/notes", path: "/notes/" },
    { route: "(work)/notes/[tid]", path: data.workNoteTid ? `/notes/${data.workNoteTid}/` : null },
    { route: "(work)/notes/page/[n]", path: data.workNotesPage2 ? "/notes/page/2/" : null },
    { route: "(work)/resume", path: "/resume/" },
    { route: "(work)/system", path: "/system/" },
    { route: "(work)/work/[slug]", path: "/work/primeone/" },
    { route: "life", path: "/life/" },
    { route: "life/[...missing]", path: "/life/does-not-exist/" },
    { route: "life/books", path: "/life/books/" },
    { route: "life/films", path: "/life/films/" },
    // The same FilmsArchive body as /life/films/ (which shows the newest year).
    { route: "life/films/[year]", path: null },
    { route: "life/notes", path: "/life/notes/" },
    { route: "life/notes/[tid]", path: data.lifeNoteTid ? `/life/notes/${data.lifeNoteTid}/` : null },
    { route: "life/notes/page/[n]", path: data.lifeNotesPage2 ? "/life/notes/page/2/" : null },
    { route: "life/photos", path: "/life/photos/" },
    { route: "life/photos/[slug]", path: data.photoSlug ? `/life/photos/${data.photoSlug}/` : null },
    { route: "life/saved", path: "/life/saved/" },
    { route: "life/theatre", path: "/life/theatre/" },
  ];
}
```

`tests/a11y-routes.test.ts`:

```ts
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { auditRoutes } from "../e2e/a11y-routes";

const appDir = join(__dirname, "..", "app");

// app/**/page.tsx outside app/admin, as "(work)/notes/[tid]".
function pageRoutes(): string[] {
  return (readdirSync(appDir, { recursive: true }) as string[])
    .map((file) => file.split("\\").join("/"))
    .filter((file) => file.endsWith("/page.tsx") && !file.startsWith("admin/"))
    .map((file) => file.slice(0, -"/page.tsx".length))
    .sort();
}

describe("the axe guard's route list", () => {
  it("names every public page route exactly once", () => {
    const listed = auditRoutes().map((r) => r.route);
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual(pageRoutes());
  });
});
```

Run: `npx vitest run tests/a11y-routes.test.ts`
Expected: PASS (Tasks 4 and 5 added the changelog and colophon routes). If it fails, the diff names the missing or extra route; fix the list, not the test.

- [ ] **Step 3: The axe helper**

`e2e/axe.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { type Page, expect } from "@playwright/test";

// WCAG 2.2 A and AA (Sprint 11b spec §5.5).
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

function summary(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]): string[] {
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

export async function expectNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(summary(results.violations), label).toEqual([]);
}

// The admin gets the names-and-labels rules only (spec §5.3).
const ADMIN_RULES = ["label", "button-name", "link-name", "aria-input-field-name", "select-name", "scrollable-region-focusable"];

export async function expectNoAdminLabelViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withRules(ADMIN_RULES).analyze();
  expect(summary(results.violations), label).toEqual([]);
}
```

- [ ] **Step 4: The public specs**

`e2e/a11y.spec.ts` (empty-state build):

```ts
import { test } from "@playwright/test";
import { auditRoutes } from "./a11y-routes";
import { expectNoViolations } from "./axe";

// Every public route at phone and desktop width, in the empty-state build.
for (const { route, path } of auditRoutes()) {
  if (!path) continue;
  for (const width of [390, 1440]) {
    test(`axe: ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expectNoViolations(page, `${route} at ${width}px`);
    });
  }
}
```

`e2e-fixtures/a11y.spec.ts` (populated build):

```ts
import { test } from "@playwright/test";
import { auditRoutes } from "../e2e/a11y-routes";
import { expectNoViolations } from "../e2e/axe";
import { fixtureNotes } from "../lib/notes/fixtures";
import { NOTES_PAGE_SIZE, onSide } from "../lib/notes/views";
import { fixturePhotos } from "../lib/photos/fixtures";

const notes = fixtureNotes();
const data = {
  workNoteTid: notes.find((n) => n.side === "work")?.tid,
  lifeNoteTid: notes.find((n) => n.side === "life")?.tid,
  photoSlug: fixturePhotos()[0]?.slug,
  workNotesPage2: onSide(notes, "work").length > NOTES_PAGE_SIZE,
  lifeNotesPage2: onSide(notes, "life").length > NOTES_PAGE_SIZE,
};

// Every public route at phone and desktop width, with the recorded fixture data.
for (const { route, path } of auditRoutes(data)) {
  if (!path) continue;
  for (const width of [390, 1440]) {
    test(`axe (fixtures): ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expectNoViolations(page, `${route} at ${width}px`);
    });
  }
}
```

Check that `PublishedNote` has `tid` and `side`, and `Photo` has `slug` (they do in `lib/notes/types.ts` and `lib/photos/types.ts`); adjust names if not.

- [ ] **Step 5: The admin spec**

`e2e-admin/a11y.spec.ts`:

```ts
import { type Page, expect, test } from "@playwright/test";
import { expectNoAdminLabelViolations } from "../e2e/axe";

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

const PAGES = [
  "/admin/",
  "/admin/notes/",
  "/admin/photos/",
  "/admin/bio/",
  "/admin/lab/",
  "/admin/experience/",
  "/admin/resume/",
  "/admin/work/primeone/",
  "/admin/work/new/",
];

test("every admin console page names its controls", async ({ page }) => {
  await signIn(page, "/admin/");
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator("main, [role='main'], body").first()).toBeVisible();
    await expectNoAdminLabelViolations(page, path);
  }
});
```

- [ ] **Step 6: Run the guard and fix what it finds**

```bash
lsof -ti :3217 -ti :3219 -ti :3221 | xargs kill 2>/dev/null
npm run build
npx playwright test e2e/a11y.spec.ts
npm run e2e:admin -- a11y.spec.ts
SOURCE_FIXTURES=1 npm run build && npx playwright test --config playwright.fixtures.config.ts a11y.spec.ts
npm run build
```

Tasks 2 and 9 fixed every violation the production baseline found. A violation that remains is either new (a page or state the baseline didn't see) or a fix that didn't take:
- Fix it when the fix is local and keeps the look: a missing name or label, a focusable scroller, a contrast fix inside the token table already used (e.g. `text-fg-soft` for `text-fg-muted` on a small label), an `aria-*` attribute.
- Don't silence a rule (no `disableRules`, no `exclude`) and don't change a token's value or the layout. If the only fix is a design change, stop and report it as DONE_WITH_CONCERNS with the rule, the page, the element and the colours or sizes involved; the controller asks Onur.
- List every fix in the report.

- [ ] **Step 7: Run all suites**

```bash
npm run typecheck && npm run lint && npm test
npm run build && npm run e2e && npm run e2e:admin
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
npm run build
```

Expected: all PASS. CI needs no change: `npm run e2e`, `e2e:admin` and `e2e:fixtures` already run every spec in those folders.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Guard accessibility with axe on every public route and the admin's labels

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Docs

**Files:**
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-10-08-sprint-11b-polish-design.md` (append Errata)
- Create: `docs/superpowers/plans/2026-10-08-sprint-11b-followups.md`

- [ ] **Step 1: CLAUDE.md**

Add `- Sprint 11b (changelog, colophon, onur.md, accessibility): docs/superpowers/specs/2026-10-08-sprint-11b-polish-design.md` to the spec list at the top, and a new section before `## Sources and sync`:

```markdown
## Changelog, colophon and agents (Sprint 11b)

- **Changelog.** `content/changelog.ts` (releases and eras, newest first), rules in `lib/changelog.ts` (`changelogIssues`, tested in `tests/changelog.test.ts`). Every merge into `v2` that changes the site adds a release and bumps `package.json` to it (`npm version <x.y.z> --no-git-tag-version`): a sprint is a minor, a follow-up fix a patch. CI fails when they differ. Items are plain sentences for a visitor, 1–5 per release. `/changelog/` anchors each release at `anchorOf(version)` (`v2-9-0`); the footer's version links there.
- **Colophon.** `content/colophon.ts` (copy) and `lib/colophon.ts` (`stackItems`: versions from `package.json` at build; a missing package is left out). Only true claims: check one against the code before adding it.
- **Descriptions.** Pages without a data-derived description use `DESCRIPTIONS` (`content/descriptions.ts`) through `describedMetadata()`. One sentence, 50–160 characters.
- **Agents.** `/onur.md` and `/llms.txt` are route handlers over `agentInput()` (`lib/agent/read.ts`), built by the pure `buildOnurMd` / `buildLlmsTxt`, tagged `content` (minutes on the repo fallback, days otherwise). Never an email address. The root layout's `<head>` carries `<link rel="alternate" type="text/markdown" href="/onur.md">` directly (a page's `alternates` would replace a layout-level one). The Life readout's third boot line links `onur.md`.

## Accessibility (Sprint 11b)

- WCAG 2.2 AA. `e2e/a11y.spec.ts` and `e2e-fixtures/a11y.spec.ts` run axe on every route in `e2e/a11y-routes.ts` at 390 and 1440; `tests/a11y-routes.test.ts` fails when a page route is missing from that list, so add new pages there. `e2e-admin/a11y.spec.ts` checks the admin's names and labels. Never silence a rule.
- One focus style: `:focus-visible` is a 2px accent outline, 2px off (`app/globals.css`); file-upload labels draw it for their hidden input. Don't wrap a focusable in an `overflow:hidden` / `truncate` box: truncate the link itself, or add `focus-room` to the box.
- Both shells start with `SkipLink` and wrap the page in `<div id="content" tabIndex={-1}>`.
- A link inside running text takes `underline="always"` (`TextLink`, `ItemLink`); nav, footer, list rows and actions keep hover-only underlines.
- Small interactive text gets a 24px hit area (`inline-block py-[3px]` on an 18px line).
- A scroller that can overflow is `tabIndex={0} role="region"` with an `aria-label`.
- `<time>` never carries `aria-label`; put the label in `sr-only` text before it.
- Life grids load their first `EAGER_TILES` (4) images with `loading="eager"` and `fetchPriority="high"` (`priority` / `eager` props); everything else stays lazy.
```

Also fix the two lines this sprint made stale:
- in "Design system (Sprint 4)", the `--color-danger` mention needs no value change (values live in the tokens test), but the footer description in the shells bullet or wherever "paddle" is mentioned (`grep -n paddle CLAUDE.md`) must go;
- in "Sources and sync" or "Life archives", nothing changes.

- [ ] **Step 2: Spec errata**

Append to the spec:

```markdown
## Errata (planning)

- §1.5 / §2.3: both pages open with the `/book/` header pattern (`← Home` and an `h1` lead with a muted continuation) instead of `PageHeader`, like every other Work page.
- §2.1: notes do not cross-post to Bluesky (only their text format follows Bluesky's, through `@atproto/api` facets); the Data row says that instead.
- §2.2: versions are read from `dependencies` and `devDependencies` (Tailwind is a dev dependency). A 0.x package shows `major.minor` ("Drizzle 0.45"). Neon, Vercel and GitHub OAuth carry no version.
- §3.1: the intro is a TS module (`content/agent-intro.ts`), not Markdown, so a runtime regeneration needs no file tracing. It is in the first person, like the home bio, and says nothing about availability (the Profile section adds "Open to work" from the published switch). Booking links go to cal.com directly.
- §3.3: the `text/markdown` alternate is a `<link>` in the root layout's `<head>`, not `metadata.alternates`, because note pages set their own `alternates` (canonical), which would replace it.
- §5.2 A5: the figure button keeps an `aria-label`, now starting with its visible text ("FIG. 01 · Marketplace, open in viewer"). Removing it would leave the button nameless: its visible label is `aria-hidden`.
- §5.2 A8: Experience moves the truncation onto the link; the Life readout lines (text with a link inside) get the `focus-room` utility instead.
- §5.2 A1: the resume's contact line, products line and Projects, the 404 sentences, and the new colophon and changelog prose use `underline="always"`. Notes already underlined their links.
- §5.4 P1: four leading images (`EAGER_TILES`, the first phone row) load eagerly; on Saved, one.
- §5.5: the admin axe pass runs in `e2e-admin/a11y.spec.ts`; `/life/films/[year]` isn't audited separately (same component as `/life/films/`).
```

Add any difference the implementers reported (the 404 title approach in Task 3, `bioPlain`'s location in Task 7, `firstSentence` in Task 8, any Task 11 fixes).

- [ ] **Step 3: Follow-ups file**

`docs/superpowers/plans/2026-10-08-sprint-11b-followups.md`:

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/superpowers
git commit -m "Document the changelog, colophon, agent files and accessibility rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Controller: visual check, review, PR, rollout

Not for a subagent.

- [ ] **Step 1: Visual check (never skipped)**

```bash
npm run build && npm run screenshots -- /tmp/s11b /changelog/ /colophon/ / /life/ /resume/
SOURCE_FIXTURES=1 npm run build && SCREENSHOT_PORT=3220 npm run screenshots -- /tmp/s11b-fixtures / /life/ /life/films/ /life/photos/ && npm run build
```

Look at every image at 1440 and 390: the new pages on the grid with dither rules; the footer line (version link, Colophon) on both sides; underlined links on the resume; the readout's agent line. Tab through `/` and `/life/` in the browser pane: the skip link appears on the first Tab, focus rings are 2px and not clipped on the Experience rows and the readout. Freeze-frame the readout mid-typing (enter Life with the switch, screenshot at about 700ms) and check that the typed text sits exactly over the line.

Then the admin keyboard walk (spec §5.3), signed in on a local build with `CONTENT_STORE_FILE`: on `/admin/photos/` and `/admin/notes/`, Tab to "+ Add photo" / "Images" (a 2px ring on the label), open an item, edit, publish and delete through the in-page confirm dialog, using only the keyboard.

- [ ] **Step 2: Final review**

Dispatch an opus reviewer over the whole branch (`git diff v2...sprint-11b`) against the spec and this plan. Fix wave for what it finds; ask Onur only about findings that change behaviour or content.

- [ ] **Step 3: PR**

Ask Onur before pushing. Then push `sprint-11b`, open the PR into `v2` (body ends with the Claude Code line), bind it with the ccd_pr tools and wait for CI.

- [ ] **Step 4: Rollout**

Follow `docs/superpowers/plans/2026-10-08-sprint-11b-followups.md`, each step with Onur's OK.
