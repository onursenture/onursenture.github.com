# Sprint 8: Resume and Book a call — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/resume/` (admin-edited, on the site grid), `/resume.pdf` (server-rendered A4), `/book/` (three call types with the cal.com inline embed) and the home entry points, all as plain text links.

**Architecture:** A new `resume` document on the Sprint 7 `content_docs` overlay (repo fallback `content/resume.ts`) joins the Experience document for org, role and dates; `lib/resume/view.ts` derives one `ResumeView` that both the web page and the `@react-pdf/renderer` document render. Booking is a repo config (`content/booking.ts`); `/book/` is one static page whose call type lives in the URL hash and whose cal.com script loads only after the first choice. The `profile` document gains two optional switches (`available`, `bookOnHome`).

**Tech Stack:** Next.js 16 (App Router, `cacheComponents`, `trailingSlash`), React 19, TypeScript, Tailwind 4 (token utilities only), zod 4, `@react-pdf/renderer` 4.9.0, IBM Plex WOFF fonts (OFL), vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-04-sprint-8-resume-book-design.md`. Mockups: `docs/superpowers/specs/2026-10-04-sprint-8-mockups/` (option A everywhere).

## Global Constraints

- Work in the worktree `../onursenture.github.com-sprint-8` on branch `sprint-8` (from `v2` 4522390). Never push; the controller opens the PR.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No "Task N" prefixes in subjects.
- **No accent buttons anywhere in this sprint.** Every new entry point (Book a call, Resume, Download PDF, Choose) is a text link. Do not use `PrimaryButton` or `buttonClass` on public pages.
- **No header nav.** `lib/nav.ts` items stay out of the header (`inHeader: false` for Resume, Lab not ready).
- Read `node_modules/next/dist/docs/` before using a Next API you haven't used in this repo. Pages never read `cookies()` / `headers()` / `searchParams`; data comes from `"use cache"` functions.
- `trailingSlash: true`: internal page links end with `/`. `/resume.pdf` has an extension, so it is served without the slash (verified: `/resume.pdf/` 308s to `/resume.pdf`).
- Type comes only from `type-name`, `type-lead`, `type-body`, `type-meta`, `type-label`. Colours only from tokens (`text-fg`, `text-fg-muted`, `text-fg-soft`, `text-accent`, `border-line`). Square corners, no shadows.
- Only confirmed facts in `content/resume.ts`: every number literally true and naming its period. English only.
- Fail soft: a bad published row warns and renders without the broken part; it never takes a page down.
- Check every task with `npm run typecheck && npm run lint && npm test`. Tasks that touch pages also run `npm run build && npm run e2e` (and `npm run e2e:admin` where noted). If `npm run typecheck` fails on stale `.next/dev/types`, run `rm -rf .next` first.
- Finish every build-and-e2e run with a plain `npm run build` (no `SOURCE_FIXTURES`).

## File map

| File | Task | Responsibility |
|---|---|---|
| `content/booking.ts` | 2 | Booking config (cal.com username, three call types) and pure helpers |
| `content/profile.ts` | 2 | `bookOnHome`, `ProfileCopy` with the switches, `homeSwitches()`; `bookingUrl` removed |
| `lib/nav.ts`, `components/shell/work-shell.tsx` | 2 | `inHeader` split from `ready`; Resume ready, header empty |
| `components/home/home-site.tsx` | 2 | Open to work and Book a call from the switches; Book a call as a `TextLink` |
| `content/resume.ts` | 3 | `Resume` types, `linkedinUrl()`, the repo draft |
| `lib/content/keys.ts`, `schemas.ts`, `site.ts`, `validate-site.ts`, `issue-labels.ts` | 2–3 | The `resume` document in the overlay: key, schema, resolution, rules, issue labels |
| `lib/resume/view.ts`, `lib/resume/index.ts`, `lib/resume/email.ts` | 4 | `ResumeView` derivation, the published read, email encoding |
| `components/resume/resume-body.tsx`, `components/resume/email-link.tsx` | 4 | The `/resume/` rows; the client email link |
| `app/(work)/resume/page.tsx` | 4 | The `/resume/` route |
| `lib/resume/pdf/fonts/*`, `lib/resume/pdf/document.tsx`, `lib/resume/pdf/published.ts` | 5 | Vendored fonts, the PDF document, the cached published PDF |
| `app/resume.pdf/route.ts`, `app/admin/preview/resume.pdf/route.ts` | 5 | The PDF routes |
| `components/book/cal.ts`, `components/book/cal-embed.tsx`, `components/book/booking-picker.tsx`, `app/(work)/book/page.tsx` | 6 | `/book/` |
| `lib/admin/resume.ts`, `lib/admin/load.ts`, `components/admin/resume-editor.tsx`, `components/admin/bio-editor.tsx`, `lib/admin/overview.ts`, admin routes | 7 | The admin side |
| `CLAUDE.md`, the spec's Errata, `docs/superpowers/plans/2026-10-04-sprint-8-followups.md` | 8 | Docs |

---

### Task 1: Onur's setup (controller)

The controller does this with Onur, before dispatching Task 2. Nothing is implemented here.

- [ ] **Step 1: Ask Onur (AskUserQuestion, one question per item, recommended option first)**

1. The cal.com username, after he creates three event types: slugs `role`, `project`, `mentoring`; lengths 30, 30, 20 minutes (or his own values). If the event types aren't ready yet, booking ships off (`calUsername: ""`) and he fills it in later.
2. The work email address for the resume (shown on the web and in the PDF), or blank.
3. The LinkedIn handle (the part after `linkedin.com/in/`).
4. Optional: his Bilkent years, e.g. `2005–2010`.

- [ ] **Step 2: Record the answers in the ledger**

Write them to `.superpowers/sprint-8-ledger.md` in the main checkout (gitignored) as:

```
BOOKING_USERNAME=<username or empty>
BOOKING_SLUGS=role,project,mentoring  (or his)
BOOKING_MINUTES=30,30,20              (or his)
RESUME_EMAIL=<address or empty>
RESUME_LINKEDIN=<handle or empty>
EDU_YEARS=<years or empty>
```

- [ ] **Step 3: Substitute into the briefs**

When dispatching Task 2 and Task 3, the controller replaces `{{BOOKING_USERNAME}}`, `{{RESUME_EMAIL}}`, `{{RESUME_LINKEDIN}}` and `{{EDU_YEARS}}` in the code blocks with the recorded values (empty string when blank; delete the `years` key when `EDU_YEARS` is empty), and changes the slugs/minutes in `content/booking.ts` if Onur gave other values. Implementers never see a `{{…}}` token.

---

### Task 2: Booking config, profile switches and the home entry points

**Files:**
- Create: `content/booking.ts`
- Modify: `content/profile.ts`, `lib/content/schemas.ts:65-68`, `lib/content/site.ts:47-49`, `lib/nav.ts`, `components/shell/work-shell.tsx:6,22`, `components/home/home-site.tsx`
- Test: `tests/content/booking.test.ts` (new), `tests/content/profile.test.ts`, `tests/nav.test.ts`, `e2e/home.spec.ts`

**Interfaces:**
- Produces: `content/booking.ts` exports `type BookingTypeId = "role" | "project" | "mentoring"`, `interface BookingType { id; slug; title; minutes; description }`, `interface Booking { calUsername: string; types: BookingType[] }`, `booking: Booking`, `bookingEnabled(config?: Booking): boolean`, `calLink(type: BookingType, config?: Booking): string`, `calUrl(type: BookingType, config?: Booking): string`, `typeFromHash(hash: string, config?: Booking): BookingType | null`.
- Produces: `content/profile.ts` exports `interface ProfileCopy { lead; bio; available?: boolean; bookOnHome?: boolean }` and `homeSwitches(copy: ProfileCopy, repo?: Profile): { available: boolean; bookOnHome: boolean }`; `Profile` gains `bookOnHome: boolean` and loses `bookingUrl`.
- Produces: `lib/nav.ts` exports `NavItem` with `inHeader: boolean`, `readyItems()`, `headerItems()`.

- [ ] **Step 1: Write the failing booking test**

Create `tests/content/booking.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { type Booking, booking, bookingEnabled, calLink, calUrl, typeFromHash } from "@/content/booking";

describe("booking config", () => {
  it("lists three call types with unique ids and slugs, copy and a positive length", () => {
    expect(booking.types.map((type) => type.id)).toEqual(["role", "project", "mentoring"]);
    expect(new Set(booking.types.map((type) => type.slug)).size).toBe(3);
    for (const type of booking.types) {
      expect(type.minutes, type.id).toBeGreaterThan(0);
      expect(type.title.trim(), type.id).not.toBe("");
      expect(type.description.trim(), type.id).not.toBe("");
      expect(type.slug, type.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("is off while the username is blank", () => {
    expect(bookingEnabled({ ...booking, calUsername: " " })).toBe(false);
    expect(bookingEnabled({ ...booking, calUsername: "someone" })).toBe(true);
  });

  it("builds the embed link and the cal.com URL", () => {
    const config: Booking = { ...booking, calUsername: "someone" };
    const project = config.types[1];
    expect(calLink(project, config)).toBe(`someone/${project.slug}`);
    expect(calUrl(project, config)).toBe(`https://cal.com/someone/${project.slug}`);
  });

  it("reads the chosen type from the URL hash", () => {
    expect(typeFromHash("#project")?.id).toBe("project");
    expect(typeFromHash("mentoring")?.id).toBe("mentoring");
    expect(typeFromHash("")).toBeNull();
    expect(typeFromHash("#nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/content/booking.test.ts`
Expected: FAIL, cannot resolve `@/content/booking`.

- [ ] **Step 3: Create `content/booking.ts`**

```ts
// Book a call (Sprint 8 spec §1.4): the cal.com account and its event types,
// in the order /book/ lists them. An empty calUsername turns booking off
// everywhere: /book/ 404s and no "Book a call" link renders.
export type BookingTypeId = "role" | "project" | "mentoring";

export interface BookingType {
  id: BookingTypeId;
  // The cal.com event type slug: cal.com/<calUsername>/<slug>.
  slug: string;
  title: string;
  // Must match the event type's length on cal.com.
  minutes: number;
  description: string;
}

export interface Booking {
  calUsername: string;
  types: BookingType[];
}

export const booking: Booking = {
  calUsername: "{{BOOKING_USERNAME}}",
  types: [
    { id: "role", slug: "role", title: "Role / hiring", minutes: 30, description: "You're hiring for a design or design-engineering role." },
    { id: "project", slug: "project", title: "Project / freelance", minutes: 30, description: "A product, design system or app you want built." },
    { id: "mentoring", slug: "mentoring", title: "Mentoring / intro", minutes: 20, description: "Portfolio feedback, design systems, a first hello." },
  ],
};

export function bookingEnabled(config: Booking = booking): boolean {
  return config.calUsername.trim() !== "";
}

// "<username>/<slug>": the embed's calLink.
export function calLink(type: BookingType, config: Booking = booking): string {
  return `${config.calUsername.trim()}/${type.slug}`;
}

export function calUrl(type: BookingType, config: Booking = booking): string {
  return `https://cal.com/${calLink(type, config)}`;
}

// The call type a /book/ hash names ("#project"), or null.
export function typeFromHash(hash: string, config: Booking = booking): BookingType | null {
  const id = hash.replace(/^#/, "");
  return config.types.find((type) => type.id === id) ?? null;
}
```

- [ ] **Step 4: Run the booking test**

Run: `npx vitest run tests/content/booking.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Update the profile test (failing)**

In `tests/content/profile.test.ts`, replace the test `"ships without a booking link until Sprint 8 sets one"` with:

```ts
  it("turns both home switches on in the repo, and reads a missing stored switch from the repo", () => {
    expect(profile.available).toBe(true);
    expect(profile.bookOnHome).toBe(true);
    expect(homeSwitches({ lead: profile.lead, bio: profile.bio })).toEqual({ available: true, bookOnHome: true });
    expect(homeSwitches({ lead: profile.lead, bio: profile.bio, available: false })).toEqual({ available: false, bookOnHome: true });
    expect(homeSwitches({ lead: profile.lead, bio: profile.bio, bookOnHome: false })).toEqual({ available: true, bookOnHome: false });
  });
```

and change the import to `import { homeSwitches, profile, socialLinks } from "@/content/profile";`.

Run: `npx vitest run tests/content/profile.test.ts`
Expected: FAIL (`homeSwitches` is not exported, `bookOnHome` missing).

- [ ] **Step 6: Change `content/profile.ts`**

In `interface Profile`, replace

```ts
  available: boolean;
  // "Book a call" renders only when this is set (Sprint 8).
  bookingUrl?: string;
```

with

```ts
  // "Open to work ●" on the home (the admin switches it, Sprint 8).
  available: boolean;
  // "Book a call →" under the home bio, while booking is set up (content/booking.ts).
  bookOnHome: boolean;
```

Replace

```ts
// The part of the profile the admin edits (Sprint 7): the home's lead and bio.
export type ProfileCopy = Pick<Profile, "lead" | "bio">;
```

with

```ts
// The part of the profile the admin edits: the home's lead and bio (Sprint 7)
// and its two switches (Sprint 8). The switches are optional so a profile
// document published before Sprint 8 still parses; homeSwitches() reads a
// missing one from the repo.
export interface ProfileCopy {
  lead: { strong: string; rest: string };
  bio: BioSegment[][];
  available?: boolean;
  bookOnHome?: boolean;
}
```

In the `profile` value, after `available: true,` add `bookOnHome: true,`.

At the end of the file add:

```ts
// The home's switches, with a missing stored value read from the repo.
export function homeSwitches(copy: ProfileCopy, repo: Profile = profile): { available: boolean; bookOnHome: boolean } {
  return { available: copy.available ?? repo.available, bookOnHome: copy.bookOnHome ?? repo.bookOnHome };
}
```

- [ ] **Step 7: Let the profile document carry the switches**

In `lib/content/schemas.ts`, replace the `profileSchema` definition with:

```ts
  const profileSchema = z.object({
    lead: z.object({ strong: text(), rest: z.string() }),
    bio: z.array(z.array(z.union([z.string(), z.object({ org: orgIdSchema })]))),
    // Sprint 8; optional so rows published before it still parse.
    available: z.boolean().optional(),
    bookOnHome: z.boolean().optional(),
  });
```

In `lib/content/site.ts`, in `repoSite()`, replace `profile: { lead: profile.lead, bio: profile.bio }` with `profile: { lead: profile.lead, bio: profile.bio, available: profile.available, bookOnHome: profile.bookOnHome }`.

Run: `npx vitest run tests/content/profile.test.ts tests/content/schemas.test.ts`
Expected: PASS (the schemas test's `toEqualTypeOf<ProfileCopy>()` must still hold).

- [ ] **Step 8: Update the nav test (failing)**

In `tests/nav.test.ts`, change the import to `import { NAV_ITEMS, headerItems, isActive, readyItems } from "@/lib/nav";` and replace the test `"renders only ready items; none is ready yet, so the header shows no nav"` with:

```ts
  it("marks Resume ready for the home's section link but keeps it out of the header, which has no nav", () => {
    expect(readyItems().map((i) => i.label)).toEqual(["Resume"]);
    expect(headerItems()).toEqual([]);
    expect(headerItems([{ label: "X", href: "/x/", ready: true, inHeader: true }]).map((i) => i.label)).toEqual(["X"]);
    expect(headerItems([{ label: "Y", href: "/y/", ready: false, inHeader: true }])).toEqual([]);
    expect(headerItems([{ label: "Z", href: "/z/", ready: true, inHeader: false }])).toEqual([]);
  });
```

Run: `npx vitest run tests/nav.test.ts`
Expected: FAIL (`headerItems` is not exported).

- [ ] **Step 9: Split `inHeader` from `ready` in `lib/nav.ts`**

Replace the whole file with:

```ts
export interface NavItem {
  label: string;
  href: string;
  // The section has shipped: links to it may render (the home's section actions).
  ready: boolean;
  // Also listed in the header nav.
  inHeader: boolean;
}

// The Work side's IA order (Sprint 4 spec §1). Resume shipped in Sprint 8
// without a header entry: it is reached from the home's Experience row, so the
// header still shows no nav. The product pages are reached from the home page
// (Selected work, Experience), not the header: there is no /work/ index (it
// redirects to /). Life is not a nav item: the Life switch in the header
// reaches it. Notes returns in Sprint 9.
export const NAV_ITEMS: NavItem[] = [
  { label: "Lab", href: "/lab/", ready: false, inHeader: true },
  { label: "Resume", href: "/resume/", ready: true, inHeader: false },
];

export function readyItems(items: NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.ready);
}

// The header nav: ready items that are listed there.
export function headerItems(items: NavItem[] = NAV_ITEMS): NavItem[] {
  return items.filter((item) => item.ready && item.inHeader);
}

export function isActive(item: NavItem, pathname: string): boolean {
  return pathname.startsWith(item.href);
}
```

In `components/shell/work-shell.tsx`, change the import to `import { headerItems } from "@/lib/nav";` and `const items = readyItems();` to `const items = headerItems();`. In its leading comment, replace "the nav on the right once an item is ready (none is yet, so no nav and no Menu button)" with "the nav on the right once an item is listed there (none is, so no nav and no Menu button)".

Run: `npx vitest run tests/nav.test.ts`
Expected: PASS.

- [ ] **Step 10: Wire the home**

In `components/home/home-site.tsx`:
- Remove `import { PrimaryButton } from "@/components/ui/primary-button";`.
- Add `import { bookingEnabled } from "@/content/booking";` and change `import { profile } from "@/content/profile";` to `import { homeSwitches, profile } from "@/content/profile";`.
- At the top of `HomeSite`, after `const { pins } = content;`, add `const switches = homeSwitches(content.profile);`.
- Replace `profile.available ? (` with `switches.available ? (`.
- Replace the block

```tsx
      {profile.bookingUrl ? (
        <div className="mt-3.5">
          <PrimaryButton href={profile.bookingUrl}>Book a call →</PrimaryButton>
        </div>
      ) : null}
```

with

```tsx
      {switches.bookOnHome && bookingEnabled() ? (
        // A text link, not a button: the home has no call to action (Sprint 8).
        <p className="mt-2 type-body">
          <TextLink href="/book/" className="text-accent">
            Book a call
          </TextLink>
        </p>
      ) : null}
```

The Experience row already renders `sectionLink("Resume", "/resume/")`; with Resume ready it now shows "Resume →".

- [ ] **Step 11: Add the home e2e checks**

In `e2e/home.spec.ts`, add `import { bookingEnabled } from "../content/booking";` to the imports and append:

```ts
test("the Experience row links the resume, and the header still has no nav", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#experience").getByRole("link", { name: "Resume" })).toHaveAttribute("href", "/resume/");
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
});

test("Book a call is a plain text link under the bio while booking is set up", async ({ page }) => {
  await page.goto("/");
  const book = page.locator("#identity").getByRole("link", { name: "Book a call" });
  if (!bookingEnabled()) {
    await expect(book).toHaveCount(0);
    return;
  }
  await expect(book).toHaveAttribute("href", "/book/");
  await expect(book).not.toHaveClass(/bg-/);
});
```

- [ ] **Step 12: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npx playwright test e2e/home.spec.ts e2e/shell.spec.ts`
Expected: all pass. (`/resume/` itself 404s until Task 4; nothing here navigates to it.)

- [ ] **Step 13: Commit**

```bash
git add content/booking.ts content/profile.ts lib/content/schemas.ts lib/content/site.ts lib/nav.ts components/shell/work-shell.tsx components/home/home-site.tsx tests/content/booking.test.ts tests/content/profile.test.ts tests/nav.test.ts e2e/home.spec.ts
git commit -m "Add the booking config, the home switches and the Resume link

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The resume document

**Files:**
- Create: `content/resume.ts`
- Modify: `lib/content/keys.ts:5`, `lib/content/schemas.ts`, `lib/content/site.ts`, `lib/content/validate-site.ts`, `lib/content/issue-labels.ts`
- Test: `tests/content/schemas.test.ts`, `tests/content/validate-site.test.ts`, `tests/content/issue-labels.test.ts`, `tests/admin/operations.test.ts`

**Interfaces:**
- Consumes: `OrgId`, `ORGS` (`content/orgs.ts`); `SiteContent` (`lib/content/site.ts`).
- Produces: `content/resume.ts` exports `ResumeRole { org: OrgId; bullets: string[] }`, `ResumeProject { title; line; href? }`, `ResumeSkill { group; items }`, `ResumeEducation { degree; school; years? }`, `Resume { contact: { email; linkedin }; summary; roles; projects; skills; education }`, `linkedinUrl(handle: string): string`, `resume: Resume`.
- Produces: `SiteContent.resume: Resume`; `resumeSchema`, `looseResumeSchema`; doc key `"resume"`; `validateSite` resume rules; `labelIssue` / `fieldMessage` for `resume`.

- [ ] **Step 1: Write the failing schema tests**

In `tests/content/schemas.test.ts`:
- add `import { type Resume, resume } from "@/content/resume";`
- add `resumeSchema, looseResumeSchema` to the `@/lib/content/schemas` import;
- in `"document keys"`, add `"resume"` to the accepted keys list;
- in `"match the content types exactly"`, add `expectTypeOf<z.infer<typeof resumeSchema>>().toEqualTypeOf<Resume>();`;
- in `"accept every repo document"`, add `expect(resumeSchema.safeParse(resume).success).toBe(true);`;
- in `"pick the schema for a key"`, add `expect(schemaFor("resume")).toBe(resumeSchema);`;
- append inside `describe("schemas")`:

```ts
  it("reject an empty bullet, project line or degree in the resume, but not in its loose variant", () => {
    const rough = {
      ...resume,
      roles: [{ org: "primetek", bullets: [""] }],
      projects: [{ title: "PrimeOne", line: "" }],
      education: [{ degree: "", school: "Bilkent University" }],
    };
    expect(resumeSchema.safeParse(rough).success).toBe(false);
    expect(looseResumeSchema.safeParse(rough).success).toBe(true);
    expect(resumeSchema.safeParse({ ...resume, roles: [{ org: "nowhere", bullets: [] }] }).success).toBe(false);
  });
```

Run: `npx vitest run tests/content/schemas.test.ts`
Expected: FAIL (cannot resolve `@/content/resume`).

- [ ] **Step 2: Create `content/resume.ts`**

```ts
import type { OrgId } from "./orgs";

// The resume (Sprint 8 spec §1.1). Organisation, role and dates are not here:
// they come from the Experience document, so the home and the resume can't
// disagree. Only confirmed facts (LinkedIn, the research notes, the approved
// Sprint 6 numbers); Onur rewrites the copy in /admin/resume/.

export interface ResumeRole {
  org: OrgId;
  bullets: string[];
}

export interface ResumeProject {
  title: string;
  line: string;
  // /work/<slug>/ for a product page, else an https URL.
  href?: string;
}

export interface ResumeSkill {
  group: string;
  // One line: "Design systems, Figma, icons".
  items: string;
}

export interface ResumeEducation {
  degree: string;
  school: string;
  years?: string;
}

export interface Resume {
  contact: {
    // Blank hides it.
    email: string;
    // The handle; the URL is https://www.linkedin.com/in/<handle>/. Blank hides it.
    linkedin: string;
  };
  // Blank hides the row.
  summary: string;
  roles: ResumeRole[];
  projects: ResumeProject[];
  skills: ResumeSkill[];
  education: ResumeEducation[];
}

export function linkedinUrl(handle: string): string {
  return `https://www.linkedin.com/in/${handle}/`;
}

export const resume: Resume = {
  contact: { email: "{{RESUME_EMAIL}}", linkedin: "{{RESUME_LINKEDIN}}" },
  summary:
    "Designer who builds. Ten years leading design at PrimeTek, where I built the PrimeOne design system, PrimeBlocks, PrimeIcons and the templates behind PrimeVue, PrimeNG and PrimeReact. Since 2013 I've also run Orkestra Studios, making iOS games and apps end to end.",
  roles: [
    {
      org: "orkestra",
      bullets: [
        "Co-founded the studio in 2013, carrying on from the Gonna team.",
        "Designed iOS games and apps including Nebuu, Rebound Line, Hi Jump and İmparator.",
        "Nebuu reached #1 in Turkish word games (2014); count.do passed 300k users (Dec 2014).",
      ],
    },
    {
      org: "primetek",
      bullets: [
        "Built PrimeOne, the Figma design system behind PrimeVue, PrimeNG and PrimeReact.",
        "Designed PrimeBlocks, PrimeIcons and 25+ premium application templates.",
        "Designed PrimeStore and Theme Designer, a visual theme editor for the Prime libraries.",
      ],
    },
    {
      org: "etiya",
      bullets: ["Designed Telaura Suite, Ofisim.com and Somemto."],
    },
  ],
  projects: [
    { title: "PrimeOne", line: "The Figma design system behind PrimeVue, PrimeNG and PrimeReact.", href: "/work/primeone/" },
    { title: "Theme Designer", line: "A visual theme editor for the Prime libraries.", href: "/work/theme-designer/" },
    { title: "Nebuu", line: "A word-guessing party game, #1 in Turkish word games (2014).", href: "/work/nebuu/" },
    {
      title: "onursenture.com",
      line: "This site — designed in Figma, built in Next.js with an AI-agent workflow.",
      href: "https://github.com/onursenture/onursenture.github.com",
    },
  ],
  skills: [
    { group: "Design", items: "Design systems, Figma, UI kits, icons, product design" },
    { group: "Build", items: "Next.js, TypeScript, AI-agent workflows" },
    { group: "Platforms", items: "Web, iOS" },
  ],
  education: [{ degree: "BS Computer Science", school: "Bilkent University", years: "{{EDU_YEARS}}" }],
};
```

- [ ] **Step 3: Add the key, the schema and the resolution**

In `lib/content/keys.ts`: `export const SINGLETON_KEYS = ["work-index", "pins", "lab", "profile", "experience", "resume"] as const;`

In `lib/content/schemas.ts`, inside `build()` before the `return`, add:

```ts
  const resumeSchema = z.object({
    contact: z.object({ email: z.string(), linkedin: z.string() }),
    summary: z.string(),
    roles: z.array(z.object({ org: orgIdSchema, bullets: z.array(text()) })),
    projects: z.array(z.object({ title: text(), line: text(), href: z.string().optional() })),
    skills: z.array(z.object({ group: text(), items: text() })),
    education: z.array(z.object({ degree: text(), school: text(), years: z.string().optional() })),
  });
```

Add `resumeSchema` to the `return { … }` object and to the `export const { … } = strictSchemas;` destructuring, add `export const looseResumeSchema = looseSchemas.resumeSchema;` after `looseExperienceSchema`, and in `schemaFor` add before `default:`:

```ts
    case "resume":
      return resumeSchema;
```

In `lib/content/site.ts`:
- add `import { type Resume, resume } from "@/content/resume";`
- add `looseResumeSchema` and `resumeSchema` to the `./schemas` import;
- add `resume: Resume;` to `interface SiteContent` after `experience`;
- in `repoSite()` add `resume` to the returned object (`…, experience, resume }`);
- in `repoValue`, before `default:` add `case "resume": return repo.resume;`;
- in `resolveSite`'s returned object add `resume: parsed(values, "resume", loose ? looseResumeSchema : resumeSchema) ?? repo.resume,`.

Run: `npx vitest run tests/content/schemas.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing validation tests**

Append to `tests/content/validate-site.test.ts` inside `describe("validateSite")`:

```ts
  it("accepts the repo resume, and checks its orgs against Experience", () => {
    expect(validateSite(repo, hasImage)).toEqual([]);
    const dropped = { ...repo, experience: repo.experience.filter((entry) => entry.org !== "etiya") };
    expect(validateSite(dropped, hasImage)).toContainEqual({ doc: "resume", at: "roles/2", message: "Etiya is not in Experience" });
    const twice = { ...repo, resume: { ...repo.resume, roles: [...repo.resume.roles, repo.resume.roles[0]] } };
    expect(validateSite(twice, hasImage)).toContainEqual({ doc: "resume", at: "roles/3", message: "Orkestra Studios is listed twice" });
  });

  it("checks the resume's email, LinkedIn handle and project links", () => {
    const site = {
      ...repo,
      resume: {
        ...repo.resume,
        contact: { email: "not-an-email", linkedin: "https://www.linkedin.com/in/someone/" },
        projects: [
          { title: "Gone", line: "A page that doesn't exist.", href: "/work/gone/" },
          { title: "Plain", line: "An http link.", href: "http://example.com" },
        ],
      },
    };
    expect(validateSite(site, hasImage)).toEqual([
      { doc: "resume", at: "contact/email", message: "is not an email address" },
      { doc: "resume", at: "contact/linkedin", message: "use the handle (linkedin.com/in/<handle>), not the URL" },
      { doc: "resume", at: "projects/0/href", message: "/work/gone/ is not a product page" },
      { doc: "resume", at: "projects/1/href", message: 'link "http://example.com" must be https' },
    ]);
  });

  it("allows a blank email and LinkedIn handle", () => {
    const site = { ...repo, resume: { ...repo.resume, contact: { email: "", linkedin: "" } } };
    expect(validateSite(site, hasImage)).toEqual([]);
  });
```

Run: `npx vitest run tests/content/validate-site.test.ts`
Expected: the new tests FAIL (no resume rules yet).

- [ ] **Step 5: Add the resume rules to `validateSite`**

In `lib/content/validate-site.ts` add `import { ORGS } from "@/content/orgs";` and, above `export function validateSite`, add:

```ts
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A LinkedIn public profile handle: letters, digits and hyphens.
const LINKEDIN_HANDLE = /^[A-Za-z0-9-]{3,100}$/;
```

Before `return issues;` add:

```ts
  // The resume (Sprint 8 spec §1.3). Checked on every publish, so publishing
  // Experience without an org the resume uses is refused too.
  const { resume } = site;
  const experienceOrgs = new Set(site.experience.map((entry) => entry.org));
  const listed = new Set<string>();
  resume.roles.forEach((role, index) => {
    const name = ORGS[role.org].name;
    if (!experienceOrgs.has(role.org)) issues.push({ doc: "resume", at: `roles/${index}`, message: `${name} is not in Experience` });
    if (listed.has(role.org)) issues.push({ doc: "resume", at: `roles/${index}`, message: `${name} is listed twice` });
    listed.add(role.org);
  });
  if (resume.contact.email && !EMAIL.test(resume.contact.email)) {
    issues.push({ doc: "resume", at: "contact/email", message: "is not an email address" });
  }
  if (resume.contact.linkedin && !LINKEDIN_HANDLE.test(resume.contact.linkedin)) {
    issues.push({ doc: "resume", at: "contact/linkedin", message: "use the handle (linkedin.com/in/<handle>), not the URL" });
  }
  resume.projects.forEach((project, index) => {
    if (!project.href) return;
    const at = `projects/${index}/href`;
    if (project.href.startsWith("/")) {
      if (!site.pages.some((page) => `/work/${page.slug}/` === project.href)) issues.push({ doc: "resume", at, message: `${project.href} is not a product page` });
    } else if (!project.href.startsWith("https://")) {
      issues.push({ doc: "resume", at, message: `link "${project.href}" must be https` });
    }
  });
```

Run: `npx vitest run tests/content/validate-site.test.ts`
Expected: PASS. (If Task 1 left `contact.email` or `contact.linkedin` with a value that fails these rules, fix the value in `content/resume.ts` with the controller, not the rule.)

- [ ] **Step 6: Write the failing operations test**

Append to `describe("publishDoc")` in `tests/admin/operations.test.ts`:

```ts
  it("refuses an Experience publish that drops an org the resume uses", async () => {
    await saveDraft(store, "experience", experience.filter((entry) => entry.org !== "etiya"), null, t0);
    const result = await publishDoc(store, "experience", t1, any);
    expect(result).toEqual({ status: "invalid", issues: [{ doc: "resume", at: "roles/2", message: "Etiya is not in Experience" }] });
  });
```

Run: `npx vitest run tests/admin/operations.test.ts`
Expected: PASS already (validateSite runs over the whole site). This test pins that behaviour.

- [ ] **Step 7: Write the failing issue-label tests**

Append to `tests/content/issue-labels.test.ts` (add `import { resume } from "@/content/resume";` at the top):

```ts
describe("labelIssue for the resume", () => {
  const onResume = { doc: "resume" as const, value: resume };
  const label = (at: string, message = "is required") => labelIssue({ doc: "resume", at, message }, onResume).text;

  it("names the section, the entry and the field", () => {
    expect(label("roles/1/bullets/1")).toBe("Resume › Roles › PrimeTek › Bullet 2: is required");
    expect(label("roles/2", "Etiya is not in Experience")).toBe("Resume › Roles › Etiya: Etiya is not in Experience");
    expect(label("projects/0/href", "/work/gone/ is not a product page")).toBe("Resume › Projects › PrimeOne › Link: /work/gone/ is not a product page");
    expect(label("projects/1/line")).toBe("Resume › Projects › Theme Designer › Line: is required");
    expect(label("skills/0/items")).toBe("Resume › Skills › Design › Items: is required");
    expect(label("education/0/degree")).toBe("Resume › Education › BS Computer Science › Degree: is required");
    expect(label("contact/email", "is not an email address")).toBe("Resume › Email: is not an email address");
    expect(label("contact/linkedin", "use the handle")).toBe("Resume › LinkedIn: use the handle");
    expect(label("summary")).toBe("Resume › Summary: is required");
  });

  it("keeps a path the value doesn't have", () => {
    expect(label("projects/9/title")).toBe("Resume › Projects › 9/title: is required");
  });

  it("prefixes the field inside a card", () => {
    expect(fieldMessage({ doc: "resume", at: "roles/1/bullets/0", message: "is required" })).toBe("Bullet 1: is required");
    expect(fieldMessage({ doc: "resume", at: "projects/0/title", message: "is required" })).toBe("Title: is required");
    expect(fieldMessage({ doc: "resume", at: "contact/email", message: "is not an email address" })).toBe("Email: is not an email address");
  });
});
```

Run: `npx vitest run tests/content/issue-labels.test.ts`
Expected: the new tests FAIL.

- [ ] **Step 8: Teach `issue-labels.ts` the resume**

In `lib/content/issue-labels.ts`:
- add `import type { Resume, ResumeRole } from "@/content/resume";`
- change `type Scope = …` to add `| "resume"`;
- add `resume: "Resume",` to `DOC_NAMES`;
- add to `NAMES`: `line: "Line", group: "Group", items: "Items", degree: "Degree", school: "School", summary: "Summary",`;
- in `fieldName`, add these cases before `case "href":`:

```ts
    case "bullets":
      return numbered ? `Bullet ${ordinal(second)}` : "Bullets";
    case "contact":
      return second === "email" ? "Email" : second === "linkedin" ? "LinkedIn" : "Contact";
```

- above `function walk(`, add:

```ts
// The resume's lists: the section's name and what names an entry in it.
const RESUME_LISTS: Record<string, { section: string; name: (item: Record<string, unknown>) => unknown; fallback: string }> = {
  projects: { section: "Projects", name: (item) => item.title, fallback: "Project" },
  skills: { section: "Skills", name: (item) => item.group, fallback: "Group" },
  education: { section: "Education", name: (item) => item.degree, fallback: "Entry" },
};

function walkResume(resume: Resume | undefined, segments: string[]): Walk {
  const [section, index] = segments;
  if (section === "roles" && index !== undefined) {
    const role = at<ResumeRole>(resume?.roles, index);
    if (!role) return unresolved(["Roles"], segments.slice(1));
    return { parts: ["Roles", ORGS[role.org]?.name ?? `Role ${ordinal(index)}`], target: null, scope: "resume", rest: segments.slice(2) };
  }
  const list = RESUME_LISTS[section];
  if (list && index !== undefined) {
    const item = at<Record<string, unknown>>((resume as unknown as Record<string, unknown> | undefined)?.[section], index);
    if (!item) return unresolved([list.section], segments.slice(1));
    const name = list.name(item);
    return {
      parts: [list.section, typeof name === "string" && name.trim() ? name.trim() : `${list.fallback} ${ordinal(index)}`],
      target: null,
      scope: "resume",
      rest: segments.slice(2),
    };
  }
  return { parts: [], target: null, scope: "resume", rest: segments };
}
```

- in `walk`, add before `default:`:

```ts
    case "resume":
      return walkResume(value as Resume | undefined, segments);
```

- in `fieldPath`, add before `default:`:

```ts
    case "resume":
      if (a === "roles" || a === "projects" || a === "skills" || a === "education") return index(b) ? { scope: "resume", rest: segments.slice(2) } : null;
      return { scope: "resume", rest: segments };
```

Run: `npx vitest run tests/content/issue-labels.test.ts`
Expected: PASS.

- [ ] **Step 9: Verify**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass. Fix any test or fixture that builds a `SiteContent` literal without `resume` by spreading `repoSite()`.

- [ ] **Step 10: Commit**

```bash
git add content/resume.ts lib/content tests/content tests/admin/operations.test.ts
git commit -m "Add the resume document to the content overlay

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The resume view and `/resume/`

**Files:**
- Create: `lib/resume/view.ts`, `lib/resume/index.ts`, `lib/resume/email.ts`, `components/resume/email-link.tsx`, `components/resume/resume-body.tsx`, `app/(work)/resume/page.tsx`
- Modify: `lib/content/preview.ts`, `components/shell/edit-link.tsx:8-11`
- Test: `tests/resume/view.test.ts`, `tests/resume/email.test.tsx`, `tests/ui/edit-link.test.ts`, `e2e/resume.spec.ts`

**Interfaces:**
- Consumes: `SiteContent.resume` (Task 3), `resolveExperience` (`lib/work/experience.ts`), `formatSpan` (`content/experience.ts`), `profile`, `linkedinUrl`, `bookingEnabled` (Task 2).
- Produces: `lib/resume/view.ts` exports `ResumeLink { title: string; href?: string }`, `ResumeRoleView { org: OrgId; orgName: string; role: string; span: string; bullets: string[]; products: ResumeLink[] }`, `ResumeProjectView { title; line; href? }`, `ResumeView { name; role; place; email: string | null; linkedin: { handle: string; url: string } | null; summary; roles: ResumeRoleView[]; projects: ResumeProjectView[]; skills: ResumeSkill[]; education: ResumeEducation[] }`, `resumeView(site: SiteContent, options?: { loose?: boolean }): ResumeView`, `firstSentence(text: string): string`.
- Produces: `getResume(): Promise<ResumeView>` (`lib/resume/index.ts`), `draftResumeView(store: ContentStore | null): Promise<ResumeView>` (`lib/content/preview.ts`), `encodeEmail(address: string): string`, `decodeEmail(code: string): string`, `emailPieces(address: string): string[]` (`lib/resume/email.ts`), `<ResumeBody resume={ResumeView} bookable={boolean} />`.

- [ ] **Step 1: Write the failing view test**

Create `tests/resume/view.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { repoSite } from "@/lib/content/site";
import { firstSentence, resumeView } from "@/lib/resume/view";

const repo = repoSite();

describe("resumeView", () => {
  it("joins each Experience entry, in its order, with the resume's bullets and the entry's products", () => {
    const view = resumeView(repo);
    expect(view.name).toBe("Onur Senture");
    expect(view.role).toBe("Designer who builds");
    expect(view.place).toBe("Ankara");
    expect(view.roles.map((role) => role.org)).toEqual(repo.experience.map((entry) => entry.org));
    const primetek = view.roles.find((role) => role.org === "primetek")!;
    expect(primetek).toMatchObject({ orgName: "PrimeTek", role: "Design lead", span: "May 2016–Apr 2026" });
    expect(primetek.bullets).toEqual(repo.resume.roles.find((role) => role.org === "primetek")!.bullets);
    expect(primetek.products[0]).toEqual({ title: "PrimeOne", href: "/work/primeone/" });
  });

  it("gives an Experience org without resume bullets an empty list, and leaves out bullets for an org not in Experience", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const site = { ...repo, resume: { ...repo.resume, roles: repo.resume.roles.filter((role) => role.org !== "etiya") } };
    expect(resumeView(site).roles.find((role) => role.org === "etiya")!.bullets).toEqual([]);
    const gone = { ...repo, experience: repo.experience.filter((entry) => entry.org !== "etiya") };
    expect(resumeView(gone).roles.map((role) => role.org)).not.toContain("etiya");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Etiya is not in Experience"));
    warn.mockRestore();
  });

  it("drops a project link to a missing page, and hides blank contact fields", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const site = {
      ...repo,
      resume: { ...repo.resume, contact: { email: " ", linkedin: "" }, projects: [{ title: "Gone", line: "x", href: "/work/gone/" }] },
    };
    const view = resumeView(site);
    expect(view.projects).toEqual([{ title: "Gone", line: "x" }]);
    expect(view.email).toBeNull();
    expect(view.linkedin).toBeNull();
    warn.mockRestore();
  });

  it("builds the LinkedIn URL from the handle", () => {
    const site = { ...repo, resume: { ...repo.resume, contact: { email: "a@b.co", linkedin: "someone" } } };
    expect(resumeView(site).linkedin).toEqual({ handle: "someone", url: "https://www.linkedin.com/in/someone/" });
    expect(resumeView(site).email).toBe("a@b.co");
  });

  it("stays quiet and prints no 'undefined' span for a half-filled draft in loose mode", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const site = { ...repo, experience: [{ ...repo.experience[0], start: "" }] };
    expect(resumeView(site, { loose: true }).roles[0].span).toBe("");
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("firstSentence", () => {
  it("takes the summary's first sentence for the meta description", () => {
    expect(firstSentence("Designer who builds. Ten years at PrimeTek.")).toBe("Designer who builds.");
    expect(firstSentence("No full stop")).toBe("No full stop");
    expect(firstSentence("  ")).toBe("");
  });
});
```

Run: `npx vitest run tests/resume/view.test.ts`
Expected: FAIL (cannot resolve `@/lib/resume/view`).

- [ ] **Step 2: Create `lib/resume/view.ts`**

```ts
import { formatSpan } from "@/content/experience";
import { ORGS, type OrgId } from "@/content/orgs";
import { profile } from "@/content/profile";
import { type ResumeEducation, type ResumeSkill, linkedinUrl } from "@/content/resume";
import type { SiteContent } from "@/lib/content/site";
import { resolveExperience } from "@/lib/work/experience";

// One view of the resume for both the web page and the PDF (Sprint 8 spec
// §1.1): the resume document joined with Experience, which stays the only
// source of an org's name, role, dates and products. Published content fails
// soft like Experience: a part that breaks the rules (data changed underneath)
// warns and is left out; `loose` (the admin preview) does the same quietly.

export interface ResumeLink {
  title: string;
  href?: string;
}

export interface ResumeRoleView {
  org: OrgId;
  orgName: string;
  role: string;
  span: string;
  bullets: string[];
  products: ResumeLink[];
}

export interface ResumeProjectView {
  title: string;
  line: string;
  href?: string;
}

export interface ResumeView {
  name: string;
  role: string;
  place: string;
  email: string | null;
  linkedin: { handle: string; url: string } | null;
  summary: string;
  roles: ResumeRoleView[];
  projects: ResumeProjectView[];
  skills: ResumeSkill[];
  education: ResumeEducation[];
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// A half-filled draft has blank months; formatSpan would print "undefined".
function span(start: string, end: string | null): string {
  return MONTH.test(start) && (end === null || MONTH.test(end)) ? formatSpan(start, end) : "";
}

export function resumeView(site: SiteContent, { loose = false }: { loose?: boolean } = {}): ResumeView {
  const warn = (message: string) => {
    if (!loose) console.warn(`[resume] ${message}`);
  };
  const { resume } = site;
  const orgs = new Set(site.experience.map((entry) => entry.org));
  for (const role of resume.roles) {
    if (!orgs.has(role.org)) warn(`${ORGS[role.org].name} is not in Experience; leaving its bullets out`);
  }
  const bullets = new Map(resume.roles.map((role) => [role.org, role.bullets]));
  const pages = new Set(site.pages.map((page) => `/work/${page.slug}/`));
  const email = resume.contact.email.trim();
  const handle = resume.contact.linkedin.trim();

  return {
    name: profile.name,
    role: profile.role,
    place: profile.location.place,
    email: email || null,
    linkedin: handle ? { handle, url: linkedinUrl(handle) } : null,
    summary: resume.summary.trim(),
    roles: resolveExperience(site.experience, site.pages, { loose }).map((entry) => ({
      org: entry.org,
      orgName: ORGS[entry.org].name,
      role: entry.role,
      span: span(entry.start, entry.end),
      bullets: bullets.get(entry.org) ?? [],
      products: entry.children.map((child) => (child.href ? { title: child.title, href: child.href } : { title: child.title })),
    })),
    projects: resume.projects.map((project) => {
      if (project.href?.startsWith("/") && !pages.has(project.href)) {
        warn(`${project.title} links ${project.href}, which is not a product page; showing it without the link`);
        return { title: project.title, line: project.line };
      }
      return project.href ? { title: project.title, line: project.line, href: project.href } : { title: project.title, line: project.line };
    }),
    skills: resume.skills,
    education: resume.education,
  };
}

// The summary's first sentence: the page's meta description.
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  return /^.*?[.!?](?=\s|$)/.exec(trimmed)?.[0] ?? trimmed;
}
```

Run: `npx vitest run tests/resume/view.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the failing email test**

Create `tests/resume/email.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EmailLink } from "@/components/resume/email-link";
import { decodeEmail, emailPieces, encodeEmail } from "@/lib/resume/email";

describe("resume email", () => {
  it("round-trips through the encoded prop", () => {
    expect(decodeEmail(encodeEmail("hello@onursenture.com"))).toBe("hello@onursenture.com");
    expect(encodeEmail("hello@onursenture.com")).not.toContain("@");
  });

  it("splits the address so '@' and each '.' are their own pieces", () => {
    expect(emailPieces("hello@onur.co")).toEqual(["hello", "@", "onur", ".", "co"]);
  });

  it("renders text without the address as one string and without a link before hydration", () => {
    const html = renderToStaticMarkup(<EmailLink code={encodeEmail("hello@onur.co")} />);
    expect(html).not.toContain("hello@onur.co");
    expect(html).not.toContain("mailto:");
    expect(html.replace(/<[^>]+>/g, "")).toBe("hello@onur.co");
  });
});
```

Run: `npx vitest run tests/resume/email.test.tsx`
Expected: FAIL (modules missing).

- [ ] **Step 4: Create the email helpers and link**

`lib/resume/email.ts`:

```ts
// The resume email never sits in the static HTML as one string (basic scraper
// protection, Sprint 8 spec §3.1): the server passes it base64-encoded and
// renders it in pieces; the client turns it into a mailto: link.

export function encodeEmail(address: string): string {
  return Buffer.from(address, "utf8").toString("base64");
}

export function decodeEmail(code: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(code), (char) => char.charCodeAt(0)));
}

export function emailPieces(address: string): string[] {
  return address.split(/([@.])/).filter(Boolean);
}
```

`components/resume/email-link.tsx`:

```tsx
"use client";

import { Fragment, useSyncExternalStore } from "react";
import { decodeEmail, emailPieces } from "@/lib/resume/email";
import { cx } from "@/lib/cx";

const subscribe = () => () => {};

// Plain pieces in the server HTML and during hydration; a mailto: link after.
export function EmailLink({ code, className }: { code: string; className?: string }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const address = decodeEmail(code);
  const text = emailPieces(address).map((piece, index) =>
    piece === "@" || piece === "." ? <span key={index}>{piece}</span> : <Fragment key={index}>{piece}</Fragment>,
  );
  if (!hydrated) return <span className={className}>{text}</span>;
  return (
    <a href={`mailto:${address}`} className={cx("hover:underline hover:underline-offset-[0.2em]", className)}>
      {text}
    </a>
  );
}
```

Run: `npx vitest run tests/resume/email.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add the reads**

`lib/resume/index.ts`:

```ts
import { getPublishedContent } from "@/lib/content/read";
import { type ResumeView, resumeView } from "./view";

// The live resume: the published documents over the repo content.
export async function getResume(): Promise<ResumeView> {
  return resumeView((await getPublishedContent()).site);
}
```

In `lib/content/preview.ts` add `import { type ResumeView, resumeView } from "@/lib/resume/view";` and append:

```ts
export async function draftResumeView(store: ContentStore | null): Promise<ResumeView> {
  const { values } = await drafts(store);
  return resumeView(resolveSite(values, { loose: true }), { loose: true });
}
```

- [ ] **Step 6: Create `components/resume/resume-body.tsx`**

```tsx
import { Fragment, type ReactNode } from "react";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { OrgMark } from "@/components/ui/org-mark";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { encodeEmail } from "@/lib/resume/email";
import type { ResumeView } from "@/lib/resume/view";
import { EmailLink } from "./email-link";

// The /resume/ rows (Sprint 8 spec §3.1, mockup A): header, Summary,
// Experience, Projects, Skills, Education on the site grid, dither rules
// between them; an empty section is left out. Every action is a text link.
export function ResumeBody({ resume, bookable }: { resume: ResumeView; bookable: boolean }) {
  const contact: ReactNode[] = [
    resume.email ? <EmailLink key="email" code={encodeEmail(resume.email)} className="text-accent" /> : null,
    <ItemLink key="site" href="/" className="text-accent">
      onursenture.com
    </ItemLink>,
    resume.linkedin ? (
      <TextLink key="linkedin" href={resume.linkedin.url} className="text-accent">
        LinkedIn
      </TextLink>
    ) : null,
  ].filter(Boolean);

  const rows = [
    <SectionRow
      key="header"
      id="resume"
      labelAs="div"
      label={
        <ItemLink href="/" className="text-fg-muted">
          ← Home
        </ItemLink>
      }
      action={
        <span className="flex flex-col gap-1 lg:items-end">
          {/* A plain <a>: next/link would try a client navigation to a route handler. */}
          <a href="/resume.pdf" className="group inline text-accent">
            <span className="group-hover:underline group-hover:underline-offset-[0.2em]">Download PDF</span>
            <span aria-hidden="true">{" ↓"}</span>
          </a>
          {bookable ? (
            <TextLink href="/book/" className="text-accent">
              Book a call
            </TextLink>
          ) : null}
        </span>
      }
    >
      <h1 className="type-lead">
        {resume.name} <span className="text-fg-muted">{resume.role}.</span>
      </h1>
      <p className="mt-2 type-meta text-fg-muted">{resume.place} · remote / hybrid</p>
      <p className="mt-1 type-meta text-fg-muted">
        {contact.map((item, index) => (
          <Fragment key={index}>
            {index > 0 ? " · " : null}
            {item}
          </Fragment>
        ))}
      </p>
    </SectionRow>,
    resume.summary ? (
      <SectionRow key="summary" id="summary" label="Summary">
        <p className="type-body text-fg-soft">{resume.summary}</p>
      </SectionRow>
    ) : null,
    resume.roles.length > 0 ? (
      <SectionRow key="experience" id="experience" label="Experience">
        <ul className="flex flex-col gap-6 type-body">
          {resume.roles.map((role) => (
            <li key={role.org}>
              <div className="flex items-baseline justify-between gap-4">
                <span>
                  <OrgMark org={role.org} /> <span className="text-fg">{role.orgName}</span>{" "}
                  <span className="whitespace-nowrap text-fg-muted">· {role.role}</span>
                </span>
                <span className="shrink-0 type-meta text-fg-muted">{role.span}</span>
              </div>
              {role.bullets.length > 0 ? (
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-fg-soft marker:text-fg-muted">
                  {role.bullets.map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {role.products.length > 0 ? (
                <p className="mt-2 type-meta text-fg-muted">
                  {role.products.map((product, index) => (
                    <Fragment key={product.title}>
                      {index > 0 ? " · " : null}
                      {product.href ? (
                        <ItemLink href={product.href} className="text-accent">
                          {product.title}
                        </ItemLink>
                      ) : (
                        product.title
                      )}
                    </Fragment>
                  ))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionRow>
    ) : null,
    resume.projects.length > 0 ? (
      <SectionRow key="projects" id="projects" label="Projects">
        <ul className="flex flex-col gap-2 type-body">
          {resume.projects.map((project) => (
            <li key={project.title}>
              {project.href ? (
                <TextLink href={project.href} className="text-accent">
                  {project.title}
                </TextLink>
              ) : (
                <span className="text-fg">{project.title}</span>
              )}{" "}
              <span className="text-fg-soft">— {project.line}</span>
            </li>
          ))}
        </ul>
      </SectionRow>
    ) : null,
    resume.skills.length > 0 ? (
      <SectionRow key="skills" id="skills" label="Skills">
        <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1 type-body">
          {resume.skills.map((skill) => (
            <Fragment key={skill.group}>
              <dt className="text-fg-muted">{skill.group}</dt>
              <dd className="text-fg-soft">{skill.items}</dd>
            </Fragment>
          ))}
        </dl>
      </SectionRow>
    ) : null,
    resume.education.length > 0 ? (
      <SectionRow key="education" id="education" label="Education">
        <ul className="flex flex-col gap-1 type-body">
          {resume.education.map((entry) => (
            <li key={`${entry.degree}-${entry.school}`} className="flex items-baseline justify-between gap-4">
              <span className="text-fg-soft">
                {entry.degree}, {entry.school}
              </span>
              {entry.years ? <span className="shrink-0 type-meta text-fg-muted">{entry.years}</span> : null}
            </li>
          ))}
        </ul>
      </SectionRow>
    ) : null,
  ].filter(Boolean);

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

- [ ] **Step 7: Create the route `app/(work)/resume/page.tsx`**

```tsx
import type { Metadata } from "next";
import { ResumeBody } from "@/components/resume/resume-body";
import { bookingEnabled } from "@/content/booking";
import { pageMetadata } from "@/lib/metadata";
import { getResume } from "@/lib/resume";
import { firstSentence } from "@/lib/resume/view";

export async function generateMetadata(): Promise<Metadata> {
  const resume = await getResume();
  const description = firstSentence(resume.summary) || `${resume.name}, ${resume.role}.`;
  return pageMetadata("Resume", { description, openGraph: { description } });
}

export default async function ResumePage() {
  return <ResumeBody resume={await getResume()} bookable={bookingEnabled()} />;
}
```

- [ ] **Step 8: Point the footer's Edit link at the resume editor**

In `tests/ui/edit-link.test.ts` add `expect(editHref("/resume/")).toBe("/admin/resume/");` to the existing test. Run it: FAIL. Then in `components/shell/edit-link.tsx` change `editHref` to:

```ts
// The editor for the page you're on: a product page's or the resume's editor, else the admin home.
export function editHref(pathname: string): string {
  if (pathname === "/resume/") return "/admin/resume/";
  const match = /^\/work\/([a-z0-9-]+)\/$/.exec(pathname);
  return match ? `/admin/work/${match[1]}/` : "/admin/";
}
```

Run: `npx vitest run tests/ui/edit-link.test.ts`
Expected: PASS.

- [ ] **Step 9: Write the e2e**

Create `e2e/resume.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { bookingEnabled } from "../content/booking";
import { resume } from "../content/resume";

test("the resume shows every section of the repo draft on the site grid, with no header nav", async ({ page }) => {
  await page.goto("/resume/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Onur Senture");
  for (const name of ["Summary", "Experience", "Projects", "Skills", "Education"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Awards" })).toHaveCount(0);
  const experience = page.locator("#experience");
  for (const name of ["Orkestra Studios", "PrimeTek", "Etiya"]) await expect(experience).toContainText(name);
  for (const role of resume.roles) for (const bullet of role.bullets) await expect(experience).toContainText(bullet);
  await expect(experience.getByRole("link", { name: "PrimeOne", exact: true })).toHaveAttribute("href", "/work/primeone/");
  await expect(page.locator("#projects").getByRole("link", { name: "PrimeOne" })).toHaveAttribute("href", "/work/primeone/");
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
});

test("the header links the PDF and, while booking is set up, Book a call, as text links", async ({ page }) => {
  await page.goto("/resume/");
  const header = page.locator("#resume");
  await expect(header.getByRole("link", { name: "Download PDF" })).toHaveAttribute("href", "/resume.pdf");
  const book = header.getByRole("link", { name: "Book a call" });
  if (bookingEnabled()) await expect(book).toHaveAttribute("href", "/book/");
  else await expect(book).toHaveCount(0);
  await expect(header.locator("a[class*='bg-']")).toHaveCount(0);
});

test("the email is a mailto link after hydration and never one string in the HTML", async ({ page, request }) => {
  test.skip(!resume.contact.email, "the repo resume has no email");
  const html = await (await request.get("/resume/")).text();
  expect(html).not.toContain(resume.contact.email);
  await page.goto("/resume/");
  await expect(page.locator("#resume").getByRole("link", { name: resume.contact.email })).toHaveAttribute("href", `mailto:${resume.contact.email}`);
});
```

- [ ] **Step 10: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npx playwright test e2e/resume.spec.ts e2e/home.spec.ts`
Expected: all pass. `/resume/` is listed as prerendered (`○` or `◐`) in the build output.

- [ ] **Step 11: Commit**

```bash
git add lib/resume components/resume "app/(work)/resume" lib/content/preview.ts components/shell/edit-link.tsx tests/resume tests/ui/edit-link.test.ts e2e/resume.spec.ts
git commit -m "Add the resume page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `/resume.pdf`

**Files:**
- Create: `lib/resume/pdf/fonts/` (5 files), `lib/resume/pdf/document.tsx`, `lib/resume/pdf/published.ts`, `app/resume.pdf/route.ts`, `app/admin/preview/resume.pdf/route.ts`
- Modify: `package.json` / `package-lock.json` (dependency), `next.config.ts`
- Test: `tests/resume/pdf.test.ts`, `e2e/resume.spec.ts`

**Interfaces:**
- Consumes: `ResumeView`, `resumeView` (Task 4), `draftResumeView` (Task 4), `getPublishedContent`, `CONTENT_TAG` (`lib/content/read.ts`), `isAdmin` (`lib/auth/admin.ts`), `site.url` (`lib/site.ts`).
- Produces: `renderResumePdf(resume: ResumeView): Promise<Buffer>` and `ResumeDocument` (`lib/resume/pdf/document.tsx`); `publishedResumePdf(): Promise<string>` (base64, `lib/resume/pdf/published.ts`).

Verified before planning (spike, 2026-10-04): `@react-pdf/renderer@4.9.0` renders Plex WOFF fonts in Node (Turkish characters, `↗`, `→` fine), and a `GET` route at `app/<name>.pdf/route.ts` whose data comes from a `"use cache"` helper is prerendered by `next build`, served as `application/pdf`, with no trailing-slash redirect. `@react-pdf/renderer` is on Next's default `serverExternalPackages` list, so no config is needed for it.

- [ ] **Step 1: Install the renderer**

Run: `npm i --save-exact @react-pdf/renderer@4.9.0`
Expected: `package.json` dependencies gain `"@react-pdf/renderer": "4.9.0"`.

- [ ] **Step 2: Vendor the fonts**

Run from the worktree root:

```bash
ROOT="$PWD"; mkdir -p "$ROOT/lib/resume/pdf/fonts"; TMP="$(mktemp -d)"; cd "$TMP" \
  && npm pack @ibm/plex-mono@2.5.0 @ibm/plex-sans@1.1.0 --silent \
  && mkdir mono sans && tar xzf ibm-plex-mono-2.5.0.tgz -C mono && tar xzf ibm-plex-sans-1.1.0.tgz -C sans \
  && cp mono/package/fonts/complete/woff/IBMPlexMono-Regular.woff mono/package/fonts/complete/woff/IBMPlexMono-Medium.woff "$ROOT/lib/resume/pdf/fonts/" \
  && cp sans/package/fonts/complete/woff/IBMPlexSans-SemiBold.woff "$ROOT/lib/resume/pdf/fonts/" \
  && cp mono/package/LICENSE.txt "$ROOT/lib/resume/pdf/fonts/LICENSE.txt" \
  && cd "$ROOT" && rm -rf "$TMP" && ls lib/resume/pdf/fonts
```

Expected: `IBMPlexMono-Medium.woff IBMPlexMono-Regular.woff IBMPlexSans-SemiBold.woff LICENSE.txt`. Then create `lib/resume/pdf/fonts/README.md`:

```md
IBM Plex Mono (Regular, Medium) and IBM Plex Sans (SemiBold), WOFF, from the npm packages `@ibm/plex-mono@2.5.0` and `@ibm/plex-sans@1.1.0` (`fonts/complete/woff/`). SIL Open Font License 1.1: see `LICENSE.txt`. Embedded in `/resume.pdf` by `lib/resume/pdf/document.tsx`. The web pages load Plex through `next/font/google`, not these files.
```

- [ ] **Step 3: Write the failing PDF test**

Create `tests/resume/pdf.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { repoSite } from "@/lib/content/site";
import { renderResumePdf } from "@/lib/resume/pdf/document";
import { resumeView } from "@/lib/resume/view";

const pageCount = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type \/Page[^s]/g) ?? []).length;

describe("resume PDF", () => {
  it("renders the repo resume as an A4 PDF of one or two pages", async () => {
    const pdf = await renderResumePdf(resumeView(repoSite()));
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.toString("latin1")).toMatch(/\/MediaBox \[0 0 595\.28\d* 841\.89\d*\]/);
    expect(pageCount(pdf)).toBeGreaterThanOrEqual(1);
    expect(pageCount(pdf)).toBeLessThanOrEqual(2);
  }, 30_000);

  it("changes when the resume changes", async () => {
    const site = repoSite();
    const a = await renderResumePdf(resumeView(site));
    const b = await renderResumePdf(resumeView({ ...site, resume: { ...site.resume, summary: `${site.resume.summary} One more sentence.` } }));
    expect(a.equals(b)).toBe(false);
  }, 30_000);
});
```

Run: `npx vitest run tests/resume/pdf.test.ts`
Expected: FAIL (cannot resolve `@/lib/resume/pdf/document`).

- [ ] **Step 4: Create `lib/resume/pdf/document.tsx`**

```tsx
import path from "node:path";
import { Document, Font, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { ResumeView } from "@/lib/resume/view";
import { site } from "@/lib/site";

// The resume on paper (Sprint 8 spec §3.2, paper A): the web page's label |
// content rows on A4, Plex Mono text, the name in Plex Sans, hairline rules,
// black ink, the accent only on links. The fonts are vendored (OFL) and read
// from disk; next.config.ts traces them into the PDF routes.

const FONTS = path.join(process.cwd(), "lib/resume/pdf/fonts");
Font.register({
  family: "Plex Mono",
  fonts: [{ src: path.join(FONTS, "IBMPlexMono-Regular.woff") }, { src: path.join(FONTS, "IBMPlexMono-Medium.woff"), fontWeight: 500 }],
});
Font.register({ family: "Plex Sans", fonts: [{ src: path.join(FONTS, "IBMPlexSans-SemiBold.woff"), fontWeight: 600 }] });
// Never hyphenate: words stay whole.
Font.registerHyphenationCallback((word) => [word]);

// The light Work tokens (app/globals.css); the rule is a step darker than
// --color-line so it survives printing.
const INK = "#1F1F22";
const MUTED = "#6E6E73";
const SOFT = "#52525A";
const RULE = "#CFCFC9";
const ACCENT = "#2F55F5";

const styles = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 40, fontFamily: "Plex Mono", fontSize: 8.5, lineHeight: 1.45, color: INK },
  header: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  name: { fontFamily: "Plex Sans", fontWeight: 600, fontSize: 18, lineHeight: 1.2, marginBottom: 2 },
  muted: { color: MUTED },
  soft: { color: SOFT },
  link: { color: ACCENT, textDecoration: "none" },
  contact: { alignItems: "flex-end" },
  rule: { borderTopWidth: 0.5, borderTopColor: RULE, marginVertical: 10 },
  row: { flexDirection: "row", gap: 12 },
  label: { width: 70, color: MUTED },
  content: { flex: 1 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  role: { marginBottom: 8 },
  bullet: { flexDirection: "row", marginTop: 2 },
  dash: { width: 10, color: MUTED },
  grow: { flex: 1 },
});

const absolute = (href: string) => (href.startsWith("/") ? `${site.url}${href}` : href);
const bare = (url: string) => url.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <View style={styles.rule} />
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.content}>{children}</View>
      </View>
    </>
  );
}

export function ResumeDocument({ resume }: { resume: ResumeView }) {
  return (
    <Document title={`${resume.name} — Resume`} author={resume.name} subject="Resume" language="en">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{resume.name}</Text>
            <Text style={styles.muted}>
              {resume.role} · {resume.place} · remote / hybrid
            </Text>
          </View>
          <View style={styles.contact}>
            {resume.email ? (
              <Link src={`mailto:${resume.email}`} style={styles.link}>
                {resume.email}
              </Link>
            ) : null}
            <Link src={site.url} style={styles.link}>
              {bare(site.url)}
            </Link>
            {resume.linkedin ? (
              <Link src={resume.linkedin.url} style={styles.link}>
                {bare(resume.linkedin.url)}
              </Link>
            ) : null}
          </View>
        </View>

        {resume.summary ? (
          <Row label="Summary">
            <Text style={styles.soft}>{resume.summary}</Text>
          </Row>
        ) : null}

        {resume.roles.length > 0 ? (
          <Row label="Experience">
            {resume.roles.map((role) => (
              // A role never splits across pages.
              <View key={role.org} style={styles.role} wrap={false}>
                <View style={styles.line}>
                  <Text>
                    {role.orgName} <Text style={styles.muted}>· {role.role}</Text>
                  </Text>
                  <Text style={styles.muted}>{role.span}</Text>
                </View>
                {role.bullets.map((bullet, index) => (
                  <View key={index} style={styles.bullet}>
                    <Text style={styles.dash}>–</Text>
                    <Text style={[styles.soft, styles.grow]}>{bullet}</Text>
                  </View>
                ))}
                {role.products.length > 0 ? (
                  <Text style={[styles.muted, { marginTop: 2 }]}>
                    {role.products.map((product, index) => (
                      <Text key={product.title}>
                        {index > 0 ? " · " : ""}
                        {product.href ? (
                          <Link src={absolute(product.href)} style={styles.link}>
                            {product.title}
                          </Link>
                        ) : (
                          product.title
                        )}
                      </Text>
                    ))}
                  </Text>
                ) : null}
              </View>
            ))}
          </Row>
        ) : null}

        {resume.projects.length > 0 ? (
          <Row label="Projects">
            {resume.projects.map((project) => (
              <Text key={project.title} style={{ marginBottom: 2 }}>
                {project.href ? (
                  <Link src={absolute(project.href)} style={styles.link}>
                    {project.title}
                  </Link>
                ) : (
                  project.title
                )}
                <Text style={styles.soft}> — {project.line}</Text>
              </Text>
            ))}
          </Row>
        ) : null}

        {resume.skills.length > 0 ? (
          <Row label="Skills">
            {resume.skills.map((skill) => (
              <Text key={skill.group}>
                <Text style={styles.muted}>{skill.group} </Text>
                <Text style={styles.soft}>{skill.items}</Text>
              </Text>
            ))}
          </Row>
        ) : null}

        {resume.education.length > 0 ? (
          <Row label="Education">
            {resume.education.map((entry) => (
              <View key={`${entry.degree}-${entry.school}`} style={styles.line}>
                <Text style={styles.soft}>
                  {entry.degree}, {entry.school}
                </Text>
                {entry.years ? <Text style={styles.muted}>{entry.years}</Text> : null}
              </View>
            ))}
          </Row>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderResumePdf(resume: ResumeView): Promise<Buffer> {
  return renderToBuffer(<ResumeDocument resume={resume} />);
}
```

Run: `npx vitest run tests/resume/pdf.test.ts`
Expected: PASS. If the page count is above 2, report it to the controller (copy length is Onur's call), do not shrink the type below 8pt.

- [ ] **Step 5: Create the cached published PDF**

`lib/resume/pdf/published.ts`:

```ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CONTENT_TAG, getPublishedContent } from "@/lib/content/read";
import { resumeView } from "@/lib/resume/view";
import { renderResumePdf } from "./document";

// The published resume as a PDF, base64 (a "use cache" value must be
// serialisable). Tagged with the content tag, so a publish regenerates it.
export async function publishedResumePdf(): Promise<string> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("days");
  const { site } = await getPublishedContent();
  return (await renderResumePdf(resumeView(site))).toString("base64");
}
```

- [ ] **Step 6: Create the routes**

`app/resume.pdf/route.ts`:

```ts
import { publishedResumePdf } from "@/lib/resume/pdf/published";

// /resume.pdf (Sprint 8 spec §3.2): prerendered from the published resume and
// regenerated when a publish updates the content tag. The extension keeps it
// out of the trailing-slash redirect. A render error is a plain 500; /resume/
// never depends on this route.
export async function GET() {
  try {
    const pdf = Buffer.from(await publishedResumePdf(), "base64");
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="onur-senture-resume.pdf"' },
    });
  } catch (e) {
    console.error("[resume.pdf]", e instanceof Error ? e.message : e);
    return new Response("The resume PDF could not be rendered.", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
```

`app/admin/preview/resume.pdf/route.ts`:

```ts
import { isAdmin } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { draftResumeView } from "@/lib/content/preview";
import { renderResumePdf } from "@/lib/resume/pdf/document";

// The resume editor's "Preview PDF": the draft, rendered on every request.
// Signed-in only; anyone else gets a 404.
export async function GET() {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  try {
    const pdf = await renderResumePdf(await draftResumeView(getContentStore()));
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="onur-senture-resume-draft.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[admin resume.pdf]", e instanceof Error ? e.message : e);
    return new Response("The draft PDF could not be rendered.", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
```

- [ ] **Step 7: Trace the fonts into the routes**

In `next.config.ts`, add to `nextConfig` after `trailingSlash: true,`:

```ts
  // The resume PDF reads its vendored fonts from disk when a publish
  // regenerates it, so they must ship with these two routes.
  outputFileTracingIncludes: {
    "/resume.pdf": ["./lib/resume/pdf/fonts/**"],
    "/admin/preview/resume.pdf": ["./lib/resume/pdf/fonts/**"],
  },
```

- [ ] **Step 8: Add the PDF e2e**

Append to `e2e/resume.spec.ts`:

```ts
test("/resume.pdf is a one- or two-page PDF, served without a trailing-slash redirect", async ({ request }) => {
  const response = await request.get("/resume.pdf", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  expect(response.headers()["content-disposition"]).toBe('inline; filename="onur-senture-resume.pdf"');
  const body = await response.body();
  expect(body.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  const pages = (body.toString("latin1").match(/\/Type \/Page[^s]/g) ?? []).length;
  expect(pages).toBeGreaterThanOrEqual(1);
  expect(pages).toBeLessThanOrEqual(2);
});

test("the draft PDF preview is admin-only", async ({ request }) => {
  expect((await request.get("/admin/preview/resume.pdf")).status()).toBe(404);
});
```

- [ ] **Step 9: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npx playwright test e2e/resume.spec.ts`
Expected: all pass; the build lists `/resume.pdf` as prerendered. Then confirm the fonts are traced:

Run: `grep -o "lib/resume/pdf/fonts/[A-Za-z-]*\.woff" .next/server/app/resume.pdf/route.js.nft.json | sort -u`
Expected: the three `.woff` files.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json lib/resume/pdf app/resume.pdf app/admin/preview/resume.pdf next.config.ts tests/resume/pdf.test.ts e2e/resume.spec.ts
git commit -m "Render the resume as a PDF at /resume.pdf

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `/book/`

**Files:**
- Create: `components/book/cal.ts`, `components/book/cal-embed.tsx`, `components/book/booking-picker.tsx`, `app/(work)/book/page.tsx`
- Test: `tests/book/booking-picker.test.tsx`, `e2e/book.spec.ts`

**Interfaces:**
- Consumes: `Booking`, `BookingType`, `booking`, `bookingEnabled`, `calLink`, `calUrl`, `typeFromHash` (Task 2); `SectionRow`, `DitherRule`, `ItemLink`.
- Produces: `loadCal(): CalGlobal`, `CAL_ORIGIN`, `CAL_SCRIPT` (`components/book/cal.ts`); `<CalEmbed type config />`; `<BookingPicker config />`.

- [ ] **Step 1: Write the failing picker test**

Create `tests/book/booking-picker.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingPicker } from "@/components/book/booking-picker";
import { type Booking, booking, calUrl } from "@/content/booking";

const config: Booking = { ...booking, calUsername: "someone" };

describe("BookingPicker (server HTML)", () => {
  it("lists every type with its length and description, each linking to cal.com until hydration", () => {
    const html = renderToStaticMarkup(<BookingPicker config={config} />);
    for (const type of config.types) {
      expect(html).toContain(type.title);
      expect(html).toContain(`· ${type.minutes} min`);
      expect(html).toContain(type.description);
      expect(html).toContain(`href="${calUrl(type, config)}"`);
      expect(html).toContain(`aria-label="Choose ${type.title}"`);
    }
  });

  it("selects nothing and loads no calendar in the server HTML", () => {
    const html = renderToStaticMarkup(<BookingPicker config={config} />);
    expect(html).not.toContain("Selected");
    expect(html).not.toContain('role="region"');
  });
});
```

Run: `npx vitest run tests/book/booking-picker.test.tsx`
Expected: FAIL (module missing).

- [ ] **Step 2: Create the cal.com loader `components/book/cal.ts`**

```ts
// cal.com's official embed loader (the vanilla snippet from cal.com's Embed
// tab, ported to TypeScript). Calling it queues commands until
// app.cal.com/embed/embed.js loads and injects that script on the first call
// only, so /book/ makes no cal.com request before a call type is chosen.
export const CAL_ORIGIN = "https://app.cal.com";
export const CAL_SCRIPT = `${CAL_ORIGIN}/embed/embed.js`;

type Args = unknown[];

interface Queued {
  (...args: Args): void;
  q: Args[];
}

export interface CalGlobal extends Queued {
  loaded: boolean;
  ns: Record<string, Queued>;
}

declare global {
  interface Window {
    Cal?: CalGlobal;
  }
}

export function loadCal(): CalGlobal {
  if (window.Cal) return window.Cal;
  const queued = (): Queued => {
    const api = ((...args: Args) => {
      api.q.push(args);
    }) as Queued;
    api.q = [];
    return api;
  };
  const cal = ((...args: Args) => {
    if (!cal.loaded) {
      const script = document.createElement("script");
      script.src = CAL_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
      cal.loaded = true;
    }
    const [command, namespace] = args;
    if (command === "init" && typeof namespace === "string") {
      cal.ns[namespace] ??= queued();
      cal.ns[namespace].q.push(args);
      cal.q.push(["initNamespace", namespace]);
      return;
    }
    cal.q.push(args);
  }) as CalGlobal;
  cal.q = [];
  cal.ns = {};
  cal.loaded = false;
  window.Cal = cal;
  return cal;
}
```

- [ ] **Step 3: Create `components/book/cal-embed.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { type Booking, type BookingType, calLink } from "@/content/booking";
import { CAL_ORIGIN, loadCal } from "./cal";

// One init per page load; each mounted embed then renders inline into its own element.
let initialised = false;

// The cal.com month view for one call type, inside the 480px content column
// (never stretched across the row). Light theme, the site accent as the brand
// colour, cal.com's own event details hidden (the row above says them).
export function CalEmbed({ type, config }: { type: BookingType; config: Booking }) {
  const ref = useRef<HTMLDivElement>(null);
  const link = calLink(type, config);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.focus();
    const Cal = loadCal();
    if (!initialised) {
      Cal("init", { origin: CAL_ORIGIN });
      initialised = true;
    }
    const accent = getComputedStyle(element).getPropertyValue("--color-accent").trim() || "#2F55F5";
    Cal("inline", { elementOrSelector: element, calLink: link, config: { layout: "month_view", theme: "light" } });
    Cal("ui", { theme: "light", cssVarsPerTheme: { light: { "cal-brand": accent } }, hideEventTypeDetails: true, layout: "month_view" });
    return () => element.replaceChildren();
  }, [link]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={`Calendar for ${type.title}`}
      data-cal-link={link}
      className="min-h-[420px] w-full max-w-[480px] outline-none"
    />
  );
}
```

- [ ] **Step 4: Create `components/book/booking-picker.tsx`**

```tsx
"use client";

import { type MouseEvent, useSyncExternalStore } from "react";
import { type Booking, calUrl, typeFromHash } from "@/content/booking";
import { CalEmbed } from "./cal-embed";

// The chosen call type lives only in the URL hash (#role, #project,
// #mentoring), so /book/ stays one static HTML and a link can open a type.
// replaceState doesn't fire hashchange, so choose() notifies the store itself.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", listener);
  };
}

// Replace, not push: Back leaves /book/ instead of stepping through choices.
function choose(id: string) {
  window.history.replaceState(null, "", `#${id}`);
  for (const listener of listeners) listener();
}

const noop = () => () => {};

export function BookingPicker({ config }: { config: Booking }) {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => "");
  // Before hydration (and without JavaScript) "Choose" links straight to cal.com.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const selected = typeFromHash(hash, config);

  return (
    <ul className="type-body">
      {config.types.map((type) => {
        const on = selected?.id === type.id;
        const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
          if (!hydrated || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          choose(type.id);
        };
        return (
          <li key={type.id} className="border-t border-line py-3 first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between gap-4">
              <div className="min-w-0">
                <span className={on ? "text-accent" : "text-fg"}>{type.title}</span> <span className="text-fg-muted">· {type.minutes} min</span>
                <p className="text-fg-soft">{type.description}</p>
              </div>
              {on ? (
                <span className="shrink-0 type-meta text-fg-muted">Selected</span>
              ) : (
                <a
                  href={hydrated ? `#${type.id}` : calUrl(type, config)}
                  onClick={onClick}
                  aria-label={`Choose ${type.title}`}
                  className="group inline shrink-0 type-meta text-accent"
                >
                  <span className="group-hover:underline group-hover:underline-offset-[0.2em]">Choose</span>
                  <span aria-hidden="true">{" →"}</span>
                </a>
              )}
            </div>
            {on ? (
              <div className="mt-3">
                <CalEmbed type={type} config={config} />
                <p className="mt-2 type-meta text-fg-muted">
                  Trouble loading?{" "}
                  <a href={calUrl(type, config)} rel="noopener noreferrer" className="hover:underline hover:underline-offset-[0.2em]">
                    Open on cal.com{" ↗"}
                  </a>
                </p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
```

Run: `npx vitest run tests/book/booking-picker.test.tsx`
Expected: PASS.

- [ ] **Step 5: Create the page `app/(work)/book/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPicker } from "@/components/book/booking-picker";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { booking, bookingEnabled } from "@/content/booking";
import { pageMetadata } from "@/lib/metadata";

const description = "Book a call with Onur Senture: hiring, a project, or mentoring.";

export const metadata: Metadata = pageMetadata("Book a call", { description, openGraph: { description } });

// /book/ (Sprint 8 spec §3.3): the call types on the site grid, the calendar
// opening under the chosen one. 404s while booking isn't set up.
export default function BookPage() {
  if (!bookingEnabled()) notFound();
  return (
    <main className="pb-8">
      <SectionRow
        id="book"
        labelAs="div"
        label={
          <ItemLink href="/" className="text-fg-muted">
            ← Home
          </ItemLink>
        }
      >
        <h1 className="type-lead">
          Book a call. <span className="text-fg-muted">Pick what it&apos;s about; times show in your time zone.</span>
        </h1>
      </SectionRow>
      <DitherRule className="mx-4 md:mx-10" />
      <SectionRow id="call-type" label="Call type">
        <BookingPicker config={booking} />
      </SectionRow>
    </main>
  );
}
```

- [ ] **Step 6: Write the e2e `e2e/book.spec.ts`**

```ts
import { expect, test } from "@playwright/test";
import { booking, bookingEnabled, calLink, calUrl } from "../content/booking";

const byId = (id: string) => booking.types.find((type) => type.id === id)!;

test.describe("booking set up", () => {
  test.skip(!bookingEnabled(), "booking is not set up in content/booking.ts");

  test("lists the call types and asks cal.com for nothing until one is chosen", async ({ page }) => {
    const calls: string[] = [];
    await page.route("https://app.cal.com/**", (route) => {
      calls.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "text/javascript", body: "/* cal.com stub */" });
    });
    await page.goto("/book/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Book a call.");
    for (const type of booking.types) await expect(page.getByRole("link", { name: `Choose ${type.title}` })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(calls).toEqual([]);

    const project = byId("project");
    await page.getByRole("link", { name: `Choose ${project.title}` }).click();
    await expect(page).toHaveURL(/\/book\/#project$/);
    const region = page.getByRole("region", { name: `Calendar for ${project.title}` });
    await expect(region).toBeVisible();
    await expect(region).toHaveAttribute("data-cal-link", calLink(project));
    await expect(region).toBeFocused();
    await expect.poll(() => calls.some((url) => url.endsWith("/embed/embed.js"))).toBe(true);
    await expect(page.getByRole("link", { name: /Open on cal\.com/ })).toHaveAttribute("href", calUrl(project));
    // The calendar stays in the 480px content column.
    expect((await region.boundingBox())!.width).toBeLessThanOrEqual(480);
  });

  test("a hash opens that type, the fallback stays when cal.com is blocked, and Back leaves the page", async ({ page }) => {
    await page.route("https://app.cal.com/**", (route) => route.abort());
    await page.goto("/");
    await page.goto("/book/#mentoring");
    const mentoring = byId("mentoring");
    await expect(page.getByRole("region", { name: `Calendar for ${mentoring.title}` })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open on cal\.com/ })).toHaveAttribute("href", calUrl(mentoring));
    const role = byId("role");
    await page.getByRole("link", { name: `Choose ${role.title}` }).click();
    await expect(page).toHaveURL(/\/book\/#role$/);
    await page.goBack();
    await expect(page).toHaveURL(/:\d+\/$/);
  });

  test("without JavaScript every row links to cal.com", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/book/");
    for (const type of booking.types) await expect(page.getByRole("link", { name: `Choose ${type.title}` })).toHaveAttribute("href", calUrl(type));
    await context.close();
  });
});

test.describe("booking not set up", () => {
  test.skip(bookingEnabled(), "booking is set up");

  test("/book/ is a 404 and no page links it", async ({ page }) => {
    expect((await page.goto("/book/"))?.status()).toBe(404);
    for (const path of ["/", "/resume/"]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "Book a call" })).toHaveCount(0);
    }
  });
});
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npx playwright test e2e/book.spec.ts e2e/resume.spec.ts e2e/home.spec.ts`
Expected: all pass (one describe block skipped, depending on Task 1).

- [ ] **Step 8: Commit**

```bash
git add components/book "app/(work)/book" tests/book e2e/book.spec.ts
git commit -m "Add the Book a call page with the cal.com inline embed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: The admin: resume editor and the Bio switches

**Files:**
- Create: `lib/admin/resume.ts`, `components/admin/resume-editor.tsx`, `app/admin/(console)/resume/page.tsx`, `app/admin/preview/resume/page.tsx`
- Modify: `lib/admin/load.ts`, `lib/admin/overview.ts:39`, `components/admin/bio-editor.tsx`
- Test: `tests/admin/resume.test.ts`, `tests/admin/overview.test.ts`, `e2e-admin/editor.spec.ts`

**Interfaces:**
- Consumes: `Resume` (Task 3), `ResumeBody` (Task 4), `draftResumeView` (Task 4), `homeSwitches`, `bookingEnabled` (Task 2), `loadDoc`, `EditorFrame`, `useDocEditor`, `useKeyedList`, `SortableList`, fields (Sprint 7).
- Produces: `alignRoles(roles: ResumeRole[], experience: ExperienceEntry[]): ResumeRole[]`, `interface ResumeEditorData { init: DocEditorInit<Resume>; roles: { org: OrgId; name: string; role: string; span: string }[]; sources: { kind: "Page" | "Lab"; title: string; href: string }[] }` (`lib/admin/resume.ts`); `loadResumeEditor(): Promise<ResumeEditorData>` (`lib/admin/load.ts`).

- [ ] **Step 1: Write the failing `alignRoles` test**

Create `tests/admin/resume.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { experience } from "@/content/experience";
import { alignRoles } from "@/lib/admin/resume";

describe("alignRoles", () => {
  it("gives every Experience org one role, in Experience order, keeping existing bullets", () => {
    const roles = alignRoles(
      [
        { org: "primetek", bullets: ["A"] },
        { org: "orkestra", bullets: ["B"] },
      ],
      experience,
    );
    expect(roles).toEqual([
      { org: "orkestra", bullets: ["B"] },
      { org: "primetek", bullets: ["A"] },
      { org: "etiya", bullets: [] },
    ]);
  });

  it("drops a role whose org left Experience", () => {
    expect(alignRoles([{ org: "bilkent", bullets: ["x"] }], experience).map((role) => role.org)).toEqual(["orkestra", "primetek", "etiya"]);
  });
});
```

Run: `npx vitest run tests/admin/resume.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 2: Create `lib/admin/resume.ts`**

```ts
import type { ExperienceEntry } from "@/content/experience";
import type { OrgId } from "@/content/orgs";
import type { Resume, ResumeRole } from "@/content/resume";
import type { DocEditorInit } from "./results";

// What the resume editor needs (Sprint 8 spec §4.1). Plain data, so a server
// page can hand it to the client editor.
export interface ResumeEditorData {
  init: DocEditorInit<Resume>;
  // The live Experience orgs, in order: one Roles card each.
  roles: { org: OrgId; name: string; role: string; span: string }[];
  // "Add from…": product pages and Lab entries with a link.
  sources: { kind: "Page" | "Lab"; title: string; href: string }[];
}

// The resume's roles follow Experience: one per org, in Experience order,
// keeping the bullets the resume already has. A role for an org no longer in
// Experience is dropped, so the editor only ever saves valid orgs.
export function alignRoles(roles: ResumeRole[], experience: ExperienceEntry[]): ResumeRole[] {
  const bullets = new Map(roles.map((role) => [role.org, role.bullets]));
  return experience.map((entry) => ({ org: entry.org, bullets: bullets.get(entry.org) ?? [] }));
}
```

Run: `npx vitest run tests/admin/resume.test.ts`
Expected: PASS.

- [ ] **Step 3: Add `loadResumeEditor` to `lib/admin/load.ts`**

Add imports: `import { formatSpan } from "@/content/experience";`, `import { ORGS } from "@/content/orgs";`, `import type { Resume } from "@/content/resume";`, `import { alignRoles, type ResumeEditorData } from "./resume";`. Append:

```ts
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// The resume editor: the document (roles aligned to the live Experience), the
// Experience orgs for the Roles cards, and the "Add from…" options.
export async function loadResumeEditor(): Promise<ResumeEditorData> {
  const loaded = await loadDoc<Resume>("resume");
  let values = new Map<string, unknown>();
  try {
    const store = getContentStore();
    if (store) values = publishedValues(await store.listDocs());
  } catch (e) {
    console.warn("[admin] loading the resume context failed:", e instanceof Error ? e.message : e);
  }
  const site = resolveSite(values);
  return {
    init: {
      docKey: loaded.docKey,
      value: { ...loaded.value, roles: alignRoles(loaded.value.roles, site.experience) },
      draftUpdatedAt: loaded.draftUpdatedAt,
      hasDraft: loaded.hasDraft,
      publishedAt: loaded.publishedAt,
      available: loaded.available,
    },
    roles: site.experience.map((entry) => ({
      org: entry.org,
      name: ORGS[entry.org].name,
      role: entry.role,
      span: MONTH.test(entry.start) && (entry.end === null || MONTH.test(entry.end)) ? formatSpan(entry.start, entry.end) : "",
    })),
    sources: [
      ...site.pages.map((page) => ({ kind: "Page" as const, title: page.title, href: `/work/${page.slug}/` })),
      ...site.lab.flatMap((entry) => (entry.href ? [{ kind: "Lab" as const, title: entry.title, href: entry.href }] : [])),
    ],
  };
}
```

- [ ] **Step 4: List the resume on the admin home (failing test first)**

In `tests/admin/overview.test.ts`, change the expected `home` list in `"lists every page in registry order as repo when nothing is stored"` to:

```ts
    expect(home.map((row) => [row.title, row.editHref])).toEqual([
      ["Bio", "/admin/bio/"],
      ["Lab", "/admin/lab/"],
      ["Experience", "/admin/experience/"],
      ["Resume", "/admin/resume/"],
    ]);
```

Run: `npx vitest run tests/admin/overview.test.ts` → FAIL. Then in `lib/admin/overview.ts` change the `home` line to:

```ts
  const home = [
    row("profile", "Bio", "/admin/bio/"),
    row("lab", "Lab", "/admin/lab/"),
    row("experience", "Experience", "/admin/experience/"),
    row("resume", "Resume", "/admin/resume/"),
  ];
```

Run again → PASS. If another overview test asserts the home list, add the Resume row there the same way.

- [ ] **Step 5: Create `components/admin/resume-editor.tsx`**

```tsx
"use client";

import { type ReactNode, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import type { Resume } from "@/content/resume";
import { optional } from "@/lib/admin/list";
import type { ResumeEditorData } from "@/lib/admin/resume";
import { type Issue, issuesAt } from "@/lib/content/issues";
import { EditorFrame } from "./editor-frame";
import { AddButton, CONTROL, Field, IssueText, RemoveButton, TextAreaField, TextField } from "./fields";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-2 type-body text-fg">{title}</legend>
      {note ? <p className="type-meta text-fg-muted">{note}</p> : null}
      {children}
    </fieldset>
  );
}

// One Experience org's bullets: add, edit, reorder, remove.
function Bullets({ name, meta, bullets, issues, onChange }: { name: string; meta: string; bullets: string[]; issues: Issue[]; onChange: (next: string[]) => void }) {
  const list = useKeyedList(bullets, onChange);
  return (
    <section data-testid="resume-role" className="flex flex-col gap-2 border border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="type-body text-fg">{name}</h3>
        <span className="truncate type-meta text-fg-muted">{meta}</span>
      </div>
      <SortableList keys={list.keys} onMove={list.move}>
        {(index, controls) => (
          <div className="flex items-start gap-1">
            {controls}
            <textarea aria-label={`${name} bullet ${index + 1}`} rows={2} value={bullets[index]} onChange={(event) => list.update(index, event.target.value)} className={CONTROL} />
            <RemoveButton label={`Remove ${name} bullet ${index + 1}`} onClick={() => list.remove(index)} />
          </div>
        )}
      </SortableList>
      <AddButton onClick={() => list.insert(bullets.length, "")}>Add bullet</AddButton>
      <IssueText issues={issues} named />
    </section>
  );
}

// The resume (Sprint 8 spec §4.1): contact, summary, bullets per Experience
// org, projects, skills, education. Orgs, roles and dates come from Experience.
export function ResumeEditor({ data }: { data: ResumeEditorData }) {
  const editor = useDocEditor(data.init);
  const resume = editor.value;
  const set = (patch: Partial<Resume>) => editor.setValue((previous) => ({ ...previous, ...patch }));
  // Field messages go away with the first edit; the banner keeps the list.
  const at = (path: string) => (editor.status === "invalid" ? issuesAt(editor.issues, "resume", path) : []);
  const projects = useKeyedList(resume.projects, (projects) => set({ projects }));
  const skills = useKeyedList(resume.skills, (skills) => set({ skills }));
  const education = useKeyedList(resume.education, (education) => set({ education }));
  const [source, setSource] = useState("");

  function addFromSource() {
    const item = data.sources.find((option) => option.href === source);
    if (!item) return;
    projects.insert(resume.projects.length, { title: item.title, line: "", href: item.href });
    setSource("");
  }

  return (
    <EditorFrame
      crumbs={["Resume"]}
      editor={editor}
      preview="/admin/preview/resume/"
      openHref="/resume/"
      extraActions={
        <a href="/admin/preview/resume.pdf" target="_blank" rel="noopener" className={buttonClass("ghost")}>
          Preview PDF ↗
        </a>
      }
    >
      <div className="flex flex-col gap-8">
        <Group title="Contact">
          <TextField label="Email" value={resume.contact.email} hint="Blank hides it." onChange={(email) => set({ contact: { ...resume.contact, email } })} issues={at("contact/email")} />
          <TextField
            label="LinkedIn handle"
            value={resume.contact.linkedin}
            placeholder="the part after linkedin.com/in/"
            onChange={(linkedin) => set({ contact: { ...resume.contact, linkedin } })}
            issues={at("contact/linkedin")}
          />
        </Group>

        <Group title="Summary">
          <TextAreaField label="Summary" rows={4} value={resume.summary} hint="2–3 sentences. Blank hides the row." onChange={(summary) => set({ summary })} />
        </Group>

        <Group title="Experience" note="Organisations, roles and dates come from Experience; add the bullets here.">
          {data.roles.map((role, index) => (
            <Bullets
              key={role.org}
              name={role.name}
              meta={[role.role, role.span].filter(Boolean).join(" · ")}
              bullets={resume.roles[index]?.bullets ?? []}
              issues={at(`roles/${index}`)}
              onChange={(bullets) => set({ roles: resume.roles.map((item, i) => (i === index ? { ...item, bullets } : item)) })}
            />
          ))}
        </Group>

        <Group title="Projects">
          <SortableList keys={projects.keys} onMove={projects.move}>
            {(index, controls) => {
              const project = resume.projects[index];
              return (
                <div data-testid="resume-project" className="flex flex-col gap-2 border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    {controls}
                    <RemoveButton label={`Remove ${project.title || "project"}`} onClick={() => projects.remove(index)} />
                  </div>
                  <TextField label="Title" value={project.title} onChange={(title) => projects.update(index, { ...project, title })} issues={at(`projects/${index}/title`)} />
                  <TextAreaField label="Line" rows={2} value={project.line} onChange={(line) => projects.update(index, { ...project, line })} issues={at(`projects/${index}/line`)} />
                  <TextField
                    label="Link"
                    value={project.href ?? ""}
                    placeholder="/work/<slug>/ or https://"
                    onChange={(href) => projects.update(index, { ...project, href: optional(href) })}
                    issues={at(`projects/${index}/href`)}
                  />
                </div>
              );
            }}
          </SortableList>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Add from">
              <select value={source} onChange={(event) => setSource(event.target.value)} className={CONTROL}>
                <option value="">Pick a page or Lab entry</option>
                {data.sources.map((option) => (
                  <option key={option.href} value={option.href}>
                    {option.kind} · {option.title}
                  </option>
                ))}
              </select>
            </Field>
            <AddButton onClick={addFromSource}>Add from list</AddButton>
            <AddButton onClick={() => projects.insert(resume.projects.length, { title: "", line: "" })}>Add blank</AddButton>
          </div>
        </Group>

        <Group title="Skills">
          <SortableList keys={skills.keys} onMove={skills.move}>
            {(index, controls) => {
              const skill = resume.skills[index];
              return (
                <div data-testid="resume-skill" className="flex flex-col gap-2 border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    {controls}
                    <RemoveButton label={`Remove ${skill.group || "group"}`} onClick={() => skills.remove(index)} />
                  </div>
                  <TextField label="Group" value={skill.group} onChange={(group) => skills.update(index, { ...skill, group })} issues={at(`skills/${index}/group`)} />
                  <TextField label="Items" value={skill.items} hint="One line, comma-separated." onChange={(items) => skills.update(index, { ...skill, items })} issues={at(`skills/${index}/items`)} />
                </div>
              );
            }}
          </SortableList>
          <AddButton onClick={() => skills.insert(resume.skills.length, { group: "", items: "" })}>Add group</AddButton>
        </Group>

        <Group title="Education">
          <SortableList keys={education.keys} onMove={education.move}>
            {(index, controls) => {
              const entry = resume.education[index];
              return (
                <div data-testid="resume-education" className="flex flex-col gap-2 border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    {controls}
                    <RemoveButton label={`Remove ${entry.degree || "entry"}`} onClick={() => education.remove(index)} />
                  </div>
                  <TextField label="Degree" value={entry.degree} onChange={(degree) => education.update(index, { ...entry, degree })} issues={at(`education/${index}/degree`)} />
                  <TextField label="School" value={entry.school} onChange={(school) => education.update(index, { ...entry, school })} issues={at(`education/${index}/school`)} />
                  <TextField label="Years" value={entry.years ?? ""} hint="e.g. 2005–2010" onChange={(years) => education.update(index, { ...entry, years: optional(years) })} />
                </div>
              );
            }}
          </SortableList>
          <AddButton onClick={() => education.insert(resume.education.length, { degree: "", school: "" })}>Add entry</AddButton>
        </Group>
      </div>
    </EditorFrame>
  );
}
```

- [ ] **Step 6: Create the routes**

`app/admin/(console)/resume/page.tsx`:

```tsx
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { ResumeEditor } from "@/components/admin/resume-editor";
import { loadResumeEditor } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/auth/admin";

export default function ResumeEditorPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/resume/");
  return <ResumeEditor data={await loadResumeEditor()} />;
}
```

`app/admin/preview/resume/page.tsx`:

```tsx
import { Suspense } from "react";
import { ResumeBody } from "@/components/resume/resume-body";
import { bookingEnabled } from "@/content/booking";
import { requireAdminPage } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { draftResumeView } from "@/lib/content/preview";

export default function PreviewResumePage() {
  return (
    <Suspense fallback={null}>
      <PreviewResume />
    </Suspense>
  );
}

async function PreviewResume() {
  await requireAdminPage("/admin/resume/");
  return <ResumeBody resume={await draftResumeView(getContentStore())} bookable={bookingEnabled()} />;
}
```

- [ ] **Step 7: Add the switches to the Bio editor**

In `components/admin/bio-editor.tsx`:
- add imports `import { bookingEnabled } from "@/content/booking";` and change the profile import to `import { type BioSegment, type ProfileCopy, homeSwitches } from "@/content/profile";`;
- in `BioEditor`, after `const paragraphs = …`, add `const switches = homeSwitches(copy);`;
- insert as the first child of the form's `<div className="flex flex-col gap-4">`:

```tsx
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 type-label text-fg-muted">On the home</legend>
          <label className="flex items-center gap-2 type-body">
            <input type="checkbox" checked={switches.available} onChange={(event) => set({ available: event.target.checked })} />
            Open to work
          </label>
          <label className="flex items-center gap-2 type-body">
            <input type="checkbox" checked={switches.bookOnHome} disabled={!bookingEnabled()} onChange={(event) => set({ bookOnHome: event.target.checked })} />
            Book a call on home
          </label>
          {bookingEnabled() ? null : <p className="type-meta text-fg-muted">Booking isn&apos;t set up (content/booking.ts).</p>}
        </fieldset>
```

- [ ] **Step 8: Write the admin e2e**

In `e2e-admin/editor.spec.ts` add `import { bookingEnabled } from "../content/booking";` and append:

```ts
test("Resume: add a bullet, publish, see it on /resume/ and in a new PDF", async ({ page, request }) => {
  const before = await (await request.get("/resume.pdf")).body();
  await signIn(page, "/admin/resume/");
  await expect(page.frameLocator('iframe[title="Preview"]').locator("#experience")).toBeVisible();
  const primetek = page.getByTestId("resume-role").filter({ hasText: "PrimeTek" });
  await primetek.getByRole("button", { name: "Add bullet" }).click();
  // A role name, not getByLabel: "Remove PrimeTek bullet N" buttons match that too.
  await primetek.getByRole("textbox", { name: /^PrimeTek bullet \d+$/ }).last().fill("Shipped an e2e bullet from the admin.");
  await publish(page);
  await page.goto("/resume/");
  await expect(page.locator("#experience")).toContainText("Shipped an e2e bullet from the admin.");
  await expect.poll(async () => (await (await request.get("/resume.pdf")).body()).equals(before), { timeout: 15_000 }).toBe(false);
  await expect(page.getByRole("link", { name: "Download PDF" })).toBeVisible();
});

test("Resume: the draft PDF preview opens for the signed-in admin", async ({ page }) => {
  await signIn(page, "/admin/resume/");
  const response = await page.request.get("/admin/preview/resume.pdf");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
});

test("Bio: Open to work and Book a call on home switch the home", async ({ page }) => {
  await signIn(page, "/admin/bio/");
  await page.getByLabel("Open to work").uncheck();
  if (bookingEnabled()) await page.getByLabel("Book a call on home").uncheck();
  await publish(page);
  await page.goto("/");
  await expect(page.locator("#identity")).not.toContainText("Open to work");
  await expect(page.locator("#identity").getByRole("link", { name: "Book a call" })).toHaveCount(0);
  if (bookingEnabled()) {
    await page.goto("/resume/");
    await expect(page.locator("#resume").getByRole("link", { name: "Book a call" })).toBeVisible();
  }
  // Back as they were, for the tests after this one.
  await signIn(page, "/admin/bio/");
  await page.getByLabel("Open to work").check();
  if (bookingEnabled()) await page.getByLabel("Book a call on home").check();
  await publish(page);
});
```

- [ ] **Step 9: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e && npm run e2e:admin`
Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add lib/admin/resume.ts lib/admin/load.ts lib/admin/overview.ts components/admin/resume-editor.tsx components/admin/bio-editor.tsx "app/admin/(console)/resume" app/admin/preview/resume tests/admin e2e-admin/editor.spec.ts
git commit -m "Add the resume editor and the home switches to the admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Docs, errata and the full CI run

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-04-sprint-8-resume-book-design.md` (append Errata)
- Create: `docs/superpowers/plans/2026-10-04-sprint-8-followups.md`

- [ ] **Step 1: Document Sprint 8 in `CLAUDE.md`**

Add the spec to the list at the top (`- Sprint 8 (Resume, Book a call): docs/superpowers/specs/2026-10-04-sprint-8-resume-book-design.md`). In the Design system bullet about the Work header, replace "Flip `ready` when Lab or Resume ships." with "`ready` lets section links render (Resume is ready: the home's Experience row links it); `inHeader` puts an item in the header (none does yet).". In the bullet about the Work home, after the Experience description, add: "The identity row reads its switches through `homeSwitches(content.profile)`: \"Open to work ●\" in the action column, and \"Book a call →\" (a `TextLink`, never a button) under the bio while `bookOnHome` is on and `bookingEnabled()`."

Append a new section after "## Admin (Sprint 7)":

```md
## Resume and Book a call (Sprint 8)

- Spec: `docs/superpowers/specs/2026-10-04-sprint-8-resume-book-design.md`.
- **No accent buttons on public pages.** Resume, Book a call, Download PDF and Choose are text links.
- **Resume data.** The `resume` document (`content/resume.ts` is the repo draft) holds contact, summary, bullets per org, projects, skills and education. Org names, roles, dates and products always come from Experience: `lib/resume/view.ts` (`resumeView`) joins them, and both `/resume/` (`components/resume/resume-body.tsx`) and the PDF render that one view. `validateSite` refuses a resume role whose org isn't in Experience (so an Experience publish that drops one is refused too), a bad email or LinkedIn URL instead of a handle, and a project link to a missing page or over http. The read fails soft per item.
- **Email.** Never one string in the static HTML: the server passes `encodeEmail()` (base64) to `EmailLink`, which renders pieces and becomes a `mailto:` link after hydration.
- **PDF.** `app/resume.pdf/route.ts` serves `publishedResumePdf()` (`lib/resume/pdf/published.ts`, `"use cache"`, tag `content`, base64), rendered by `@react-pdf/renderer` (pinned 4.9.0, on Next's default `serverExternalPackages`) in `lib/resume/pdf/document.tsx`. Fonts are vendored WOFFs in `lib/resume/pdf/fonts/` (OFL), read from disk and traced into the route by `outputFileTracingIncludes` in `next.config.ts`. A4, one page as the goal and two at most (e2e). `/admin/preview/resume.pdf` renders the draft for the signed-in admin.
- **Booking.** `content/booking.ts`: the cal.com username and three call types. An empty username turns booking off: `/book/` 404s and no Book a call link renders. `/book/` keeps the chosen type in the hash only (`replaceState`, so Back leaves the page); `components/book/cal.ts` is cal.com's embed loader, called only after the first choice, and the embed sits in the 480px content column. Without JavaScript, "Choose" links to cal.com.
- **Admin.** `/admin/resume/` (Roles cards follow the live Experience orgs via `alignRoles`; "Add from…" fills a project's title and link from a page or Lab entry) and two Bio switches (Open to work, Book a call on home; optional in the `profile` schema so older rows still parse).
```

- [ ] **Step 2: Append Errata to the spec**

Append to `docs/superpowers/specs/2026-10-04-sprint-8-resume-book-design.md`:

```md
## Errata (planning)

- §3.1: there is no sitemap in v2, so "in the sitemap" does not apply; the page is indexable.
- §3.2: the PDF route uses Next's own cache headers for a prerendered route (there is no proxy setting `Cache-Control` in v2). The fonts are WOFF (the IBM Plex npm packages ship no TTF), which `@react-pdf/renderer` reads fine.
- §1.3: a published resume that breaks the rules fails soft per item (a role for an org not in Experience is left out, a project link to a missing page renders without the link), the same as Experience, rather than falling back to the whole repo resume. Required fields are non-empty (`min(1)`), as everywhere else in the overlay.
- §3.1: the email is passed to the client base64-encoded and rendered in pieces; a plain prop would put the address into the RSC payload of the static HTML.
- §5: the "booking disabled" e2e runs only while `calUsername` is empty (`test.skip`), and the "booking enabled" e2e only while it is set; a unit test covers the picker's server HTML with an explicit config.
```

- [ ] **Step 3: Write the follow-ups file**

Create `docs/superpowers/plans/2026-10-04-sprint-8-followups.md`:

```md
# Sprint 8 follow-ups

Checks for Onur on the Vercel preview, before merging into `v2`:

- [ ] `/resume/` at desktop and phone width: copy, order, links.
- [ ] `/resume.pdf`: open it, print it in greyscale, check it fits one page.
- [ ] `/book/`: choose each type; the calendar shows your real slots in the content column; book a test slot and cancel it in cal.com.
- [ ] The home: "Book a call →" under the bio as a text link; "Resume →" on the Experience row; no header nav.
- [ ] `/admin/resume/`: rewrite the copy, Preview PDF, publish; `/resume.pdf` updates.
- [ ] `/admin/bio/`: Open to work and Book a call on home switch the home.

Later:

- [ ] If cal.com's month view stacks badly at 480px, consider `column_view` (spec §3.3).
- [ ] At launch (Sprint 12), `site.url` already points the PDF's links at onursenture.com; nothing to change.
```

- [ ] **Step 4: Run the whole CI sequence**

Run: `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e && npm run e2e:admin && SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures && npm run build`
Expected: all green; the last plain build leaves `.next` out of fixture mode.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md docs/superpowers
git commit -m "Document Sprint 8: resume, PDF and booking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Visual review, final review and the PR (controller)

- [ ] **Step 1: Screenshots**

Run: `npm run build && npm run screenshots -- .superpowers/sprint-8-shots / /resume/ /book/` (from the worktree; write the output under the main checkout's `.superpowers/` if the script needs a path outside the repo). Open every PNG. Check: the resume rows align with the home grid; no accent buttons anywhere; Book a call under the bio is a text link; the header has no nav.

- [ ] **Step 2: The real embed**

With booking set up, open `/book/#project` in the browser pane (dev or `next start`), wait for cal.com, and screenshot at 1440 and 390. Check the calendar stays inside the 480px column and reads well when it stacks. If it doesn't, note it for Onur (AskUserQuestion: keep month view, or `column_view`).

- [ ] **Step 3: The PDF on screen**

Fetch `/resume.pdf`, rasterize it (`sips -s format png resume.pdf --out resume.png`), and read the image: one page, the label | content rows, the name in Plex Sans, links in the accent, Turkish characters correct (İmparator).

- [ ] **Step 4: Final review**

Dispatch an opus reviewer over the whole branch (`git diff v2...sprint-8`) against the spec and this plan. Fix wave as needed; record decisions in the ledger.

- [ ] **Step 5: PR**

Ask Onur before pushing (AskUserQuestion). On yes: push `sprint-8`, open a PR into `v2` with a summary, the follow-ups checklist link and the trailer `🤖 Generated with [Claude Code](https://claude.com/claude-code)`, then bind it with the ccd_pr tools.
