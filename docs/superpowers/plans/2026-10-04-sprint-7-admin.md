# Sprint 7: Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Onur signs in with GitHub at `/admin/` and edits the professional content himself: product pages (header, blocks, images, pins), new and removed pages, Lab, bio, Experience and the order of Selected work. He works on drafts with a live preview and publishes in seconds.

**Architecture:**
- **Content overlay.** Every editable unit is a row in `content_docs` with a `draft` and a `published` JSON. Public pages read the published value through one cached function (`getPublishedContent`, tag `content`) and fall back to the repo's typed content when there is no row or no database. Publish validates the would-be site and calls `updateTag("content")`.
- **Uploads.** Uploads go from the browser straight to Vercel Blob. A server action renders AVIF and JPEG renditions with sharp and records them in a `media` table, which is merged into the image manifest.
- **Auth.** A hand-written GitHub OAuth flow sets a signed httpOnly session cookie. Every server action, upload route and preview route checks it.

**Tech Stack:** Next.js 16 (App Router, `cacheComponents`, server actions, `updateTag`), React 19, Drizzle (Neon in production, PGlite in tests), zod 4, jose, @vercel/blob, sharp, @dnd-kit, Tailwind v4 tokens, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-04-sprint-7-admin-design.md`. Mockup: `docs/superpowers/specs/2026-10-04-sprint-7-mockups/editor-layout.html` (option A).

**Two deliberate simplifications of the spec, decided in planning:**
- **`work-index` never has a draft.** It changes in two cases only. Publishing a page that is not yet listed appends its slug. Deleting a page removes the slug and deletes the page's row in one validated step (the spec's "on publish").
- **The preview of a page** renders that page's draft directly. That is how a new, unlisted page can be previewed.
- **The toolbar shows "◐ Draft saved 4s ago"** without the mockup's "· N unpublished changes" count. Counting changes would need a diff of the draft against the published value, and the draft state already says what matters.

## Global Constraints

- **Branch.** Work in the worktree `/Users/w00f/Documents/GitHub/onursenture.github.com-sprint-7` on branch `sprint-7`. Never commit to `v2` or `master`.
- **Commits.** Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No "Task N" prefixes in subjects.
- **Cache Components is on.**
  - Public pages (`app/(work)/`, `app/life/`) never call `cookies()`, `headers()` or read `searchParams`.
  - Admin pages read the session only inside a `<Suspense>` boundary. The pattern is: the page component returns `<Suspense fallback={<AdminLoading />}><Gate … /></Suspense>`, and the async `Gate` awaits `params` / `searchParams` and the session.
  - Never call `new Date()`, `Date.now()` or `Math.random()` in a server render outside such a dynamic boundary.
- **Next.js 16 differs from older versions.** Before using an API you haven't seen in this repo, read its page under `node_modules/next/dist/docs/` (for example `01-app/01-getting-started/09-revalidating.md` for `updateTag`).
- **Trailing slashes.** Every internal link and fetch URL ends with `/`: `/admin/`, `/api/auth/signin/`, `/api/admin/upload/`. File URLs with an extension (`/api/media-dev/…-640.jpg`) don't.
- **Design system** (`CLAUDE.md` "Design system"):
  - Only the six type classes (`type-name`, `type-lead`, `type-body`, `type-meta`, `type-label`, `type-boot`); no Tailwind text sizes.
  - Token colours only (`bg-bg`, `text-fg`, `text-fg-muted`, `text-fg-soft`, `border-line`, `text-accent`, `text-danger`, `bg-danger-bg`). For white use `text-[#fff]`.
  - Square corners except form controls (`rounded-control`). No shadows. Fonts are IBM Plex Mono, IBM Plex Sans and Doto only.
  - Admin is light (no `data-side`).
- **Glyphs:** `●` ok, `○` empty, `◐` partial/draft (through `<StatusGlyph>`), `→` internal, `↗` external, `×` remove/close. Never `★`.
- **Ids.** Block and image ids are kebab-case and permanent once published.
- **No external links on PrimeTek pages** (`org: "primetek"`). The editor hides link fields there, and `validateWork` enforces it.
- **External fetchers and stores fail soft on public pages.** A database error renders the repo content, never an error page.
- **English only** in UI copy and content.
- **`primeicons` stays pinned to exactly `7.0.0`.** Never touch it.
- **Local development never writes to the production database.** The admin uses `CONTENT_STORE_FILE` (a JSON file) whenever it is set, and `.env.local` should set it.
- **Verification at the end of every task:** `npm run typecheck && npm run lint && npm test`. Tasks that touch e2e also run `npm run build`, then the named Playwright specs. If typecheck complains about removed routes, `rm -rf .next` first. Finish with a plain `npm run build` so `.next` isn't left in another mode.
- **Model guidance for the controller.** Haiku for Task 14. Sonnet for the rest. Opus for the final review and for hard debugging.

## File map

| Area | Files |
|---|---|
| Content model | `content/work/types.ts`, `content/work/*.ts` (pin order removed), `content/pins.ts` (new), `content/profile.ts` (`ProfileCopy`) |
| Documents | `lib/content/keys.ts`, `schemas.ts`, `issues.ts`, `site.ts`, `validate-site.ts`, `store.ts`, `drizzle-store.ts`, `file-store.ts`, `get-store.ts`, `read.ts`, `preview.ts`, `ids.ts`, `bio-tokens.ts` |
| Database | `lib/db/schema.ts`, `drizzle/0001_*.sql` |
| Images | `lib/images/plan.ts` (`baseUrl`), `lib/images/lookup.ts`, `lib/images/encode.ts`, `scripts/images.ts` |
| Media | `lib/media/rules.ts`, `lib/media/storage.ts`, `lib/media/process.ts`, `app/api/admin/upload/`, `app/api/admin/upload-dev/`, `app/api/media-dev/[...path]/` |
| Auth | `lib/auth/names.ts`, `session.ts`, `github.ts`, `cookies.ts`, `admin.ts`, `app/api/auth/{signin,callback,signout,test-signin}/route.ts` |
| Admin logic | `lib/admin/results.ts`, `operations.ts`, `list.ts`, `overview.ts`, `sources.ts`, `load.ts`, `app/admin/actions.ts` |
| Admin routes | `app/admin/layout.tsx`, `app/admin/(console)/{layout,page}.tsx`, `(console)/lab/`, `(console)/bio/`, `(console)/experience/`, `(console)/work/[slug]/`, `(console)/work/new/`, `app/admin/preview/{layout.tsx,work/[slug]/page.tsx,home/page.tsx}` |
| Admin UI | `components/admin/*` (shell, fields, sortable list, keyed list, doc editor hook, toolbar, frame, preview pane, editors) |
| Public reads | `lib/work/views.ts` (new, pure), `lib/work/index.ts` (async), `components/work/product-page-body.tsx`, `components/home/home-site.tsx`, `components/shell/edit-link.tsx`, `app/robots.ts` |
| Tests | `tests/content/*`, `tests/admin/*`, `tests/auth/*`, `tests/media/*`, `e2e/admin.spec.ts`, `e2e-admin/*`, `playwright.admin.config.ts` |

---

### Task 1: Accounts and secrets (controller, with Onur)

This task can run alongside the code tasks. It must be done before Task 16's production check. Ask Onur with AskUserQuestion when you are ready, and walk him through it step by step. Never handle the secret values yourself. Onur pastes them into Vercel and into `.env.local`.

- [ ] **Step 1: Production GitHub OAuth App.** Onur opens https://github.com/settings/developers → OAuth Apps → New OAuth App and fills in:
  - Application name: `onursenture.com admin`;
  - Homepage URL: `https://onursenture.vercel.app/`;
  - Authorization callback URL: `https://onursenture.vercel.app/api/auth/callback/`.

  He generates a client secret. After the launch (Sprint 8), the URLs change to `https://onursenture.com/…`.
- [ ] **Step 2: Local OAuth App.** Same as Step 1, named `onursenture.com admin (local)`, with homepage `http://localhost:3000/` and callback `http://localhost:3000/api/auth/callback/`.
- [ ] **Step 3: Blob store.** In Vercel → project `onursenture` → Storage → Create → Blob, name `onursenture-media`, **public** access. Connect it to Production and Preview. This sets `BLOB_READ_WRITE_TOKEN`.
- [ ] **Step 4: Vercel env (Production only).**
  - `AUTH_SECRET` (Onur runs `openssl rand -base64 48`);
  - `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` (from the production app);
  - `ADMIN_GITHUB_ID`, his numeric GitHub id from `curl -s https://api.github.com/users/onursenture | grep '"id"'`. You may run that curl yourself and tell him the number.
- [ ] **Step 5: `.env.local` in the sprint-7 worktree.** It is gitignored. Onur adds:
  ```
  AUTH_SECRET=<another openssl rand -base64 48>
  AUTH_GITHUB_ID=<local app id>
  AUTH_GITHUB_SECRET=<local app secret>
  ADMIN_GITHUB_ID=<his id>
  CONTENT_STORE_FILE=.content-dev.json
  ```
  `CONTENT_STORE_FILE` keeps local editing away from the production database.
- [ ] **Step 6:** Record in the ledger that the accounts exist. Never record the values.

---

### Task 2: Content model — pin order, open slugs, zod schemas

**Files:**
- Create: `content/pins.ts`, `lib/content/keys.ts`, `lib/content/schemas.ts`, `tests/content/schemas.test.ts`
- Modify: `content/work/types.ts`, `content/work/{primeone,primeblocks,templates,primestore,nebuu,beatografi}.ts`, `content/profile.ts`, `lib/work/derive.ts`, `lib/work/validate.ts`, `lib/work/index.ts`, `components/home/selected-work.tsx`
- Test: `tests/work/pins.test.ts`, `tests/work/validate.test.ts`, `tests/content/work.test.ts`, `tests/ui/home.test.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Produces:
  - `PinRef { slug: string; imageId: string }` and `pinOrder: PinRef[]` (`content/pins.ts`);
  - `Pin { title; note }` (no `order`);
  - `WorkSlug = string`;
  - `PinView` gains `order: number` (1-based);
  - `buildPins(pages: ProductPage[], order: PinRef[], lookup: ImageLookup): PinView[]`;
  - `ProfileCopy = Pick<Profile, "lead" | "bio">`;
  - from `lib/content/keys.ts`: `KEBAB`, `WorkKey`, `DocKey`, `workKey(slug)`, `slugOfKey(key): string | null`, `isDocKey(value): value is DocKey`, `SINGLETON_KEYS`;
  - from `lib/content/schemas.ts`: `orgIdSchema`, `productPageSchema`, `workIndexSchema`, `pinsSchema`, `labSchema`, `profileSchema`, `experienceSchema`, `schemaFor(key: DocKey): z.ZodType`.

- [ ] **Step 1: Write the failing schema tests.** Create `tests/content/schemas.test.ts`:

```ts
import { describe, expect, expectTypeOf, it } from "vitest";
import type { z } from "zod";
import { type ExperienceEntry, experience } from "@/content/experience";
import { type LabEntry, labIndex } from "@/content/lab-index";
import { ORGS } from "@/content/orgs";
import { type PinRef, pinOrder } from "@/content/pins";
import { type ProfileCopy, profile } from "@/content/profile";
import { productPages } from "@/content/work";
import type { ProductPage } from "@/content/work/types";
import { isDocKey, slugOfKey, workKey } from "@/lib/content/keys";
import {
  experienceSchema,
  labSchema,
  orgIdSchema,
  pinsSchema,
  productPageSchema,
  profileSchema,
  schemaFor,
  workIndexSchema,
} from "@/lib/content/schemas";

describe("document keys", () => {
  it("names a product page work/<slug> and recognises every key", () => {
    expect(workKey("nebuu")).toBe("work/nebuu");
    expect(slugOfKey("work/nebuu")).toBe("nebuu");
    expect(slugOfKey("lab")).toBeNull();
    for (const key of ["work/nebuu", "work-index", "pins", "lab", "profile", "experience"]) expect(isDocKey(key), key).toBe(true);
    for (const key of ["work/Nebuu", "work/", "settings", "work/a/b"]) expect(isDocKey(key), key).toBe(false);
  });
});

describe("schemas", () => {
  it("match the content types exactly", () => {
    expectTypeOf<z.infer<typeof productPageSchema>>().toEqualTypeOf<ProductPage>();
    expectTypeOf<z.infer<typeof labSchema>>().toEqualTypeOf<LabEntry[]>();
    expectTypeOf<z.infer<typeof profileSchema>>().toEqualTypeOf<ProfileCopy>();
    expectTypeOf<z.infer<typeof experienceSchema>>().toEqualTypeOf<ExperienceEntry[]>();
    expectTypeOf<z.infer<typeof pinsSchema>["order"]>().toEqualTypeOf<PinRef[]>();
  });

  it("list every organisation", () => {
    expect([...orgIdSchema.options].sort()).toEqual(Object.keys(ORGS).sort());
  });

  it("accept every repo document", () => {
    for (const page of productPages) expect(productPageSchema.safeParse(page).success, page.slug).toBe(true);
    expect(workIndexSchema.safeParse({ slugs: productPages.map((p) => p.slug) }).success).toBe(true);
    expect(pinsSchema.safeParse({ order: pinOrder }).success).toBe(true);
    expect(labSchema.safeParse(labIndex).success).toBe(true);
    expect(profileSchema.safeParse({ lead: profile.lead, bio: profile.bio }).success).toBe(true);
    expect(experienceSchema.safeParse(experience).success).toBe(true);
  });

  it("reject a malformed month, an unknown block kind and an empty title", () => {
    expect(experienceSchema.safeParse([{ ...experience[0], start: "2013-13" }]).success).toBe(false);
    const nebuu = productPages.find((p) => p.slug === "nebuu")!;
    expect(productPageSchema.safeParse({ ...nebuu, blocks: [{ kind: "video", id: "x" }] }).success).toBe(false);
    expect(productPageSchema.safeParse({ ...nebuu, title: "" }).success).toBe(false);
  });

  it("pick the schema for a key", () => {
    expect(schemaFor("work/nebuu")).toBe(productPageSchema);
    expect(schemaFor("lab")).toBe(labSchema);
    expect(schemaFor("experience")).toBe(experienceSchema);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails.** Run `npx vitest run tests/content/schemas.test.ts`. Expected: FAIL, because `@/content/pins` and `@/lib/content/*` don't exist.

- [ ] **Step 3: Open the slug type and move the pin order out.** In `content/work/types.ts`, replace the `WorkSlug` union and the `Pin` interface:

```ts
// Slugs are kebab-case and permanent once published. Since Sprint 7 the
// admin can create pages, so this is a plain string; validateSite checks it.
export type WorkSlug = string;
```

```ts
// Pinned to the home's Selected work. The order lives in the `pins` document
// (content/pins.ts in the repo), not on the image.
export interface Pin {
  title: string;
  // One line of context.
  note: string;
}
```

  In each of the six pinned pages, delete the `order: N, ` part of the `pin` object and leave title and note unchanged. For example, `content/work/nebuu.ts` becomes `pin: { title: "Nebuu", note: "A Turkish party word game, live since 2013" }`. The six files are `primeone.ts`, `primeblocks.ts`, `templates.ts`, `primestore.ts`, `nebuu.ts` and `beatografi.ts`.

- [ ] **Step 4: Create `content/pins.ts`.**

```ts
// The order of the home's Selected work (Sprint 6, Onur): one entry per pinned
// image, by page slug and image id. A pinned image missing here is appended at
// the end; an entry whose image is gone or no longer pinned is skipped
// (buildPins in lib/work/derive.ts). The admin's `pins` document overrides it.
export interface PinRef {
  slug: string;
  imageId: string;
}

export const pinOrder: PinRef[] = [
  { slug: "primeone", imageId: "components" },
  { slug: "primeblocks", imageId: "application-blocks" },
  { slug: "templates", imageId: "apollo" },
  { slug: "primestore", imageId: "store" },
  { slug: "nebuu", imageId: "game" },
  { slug: "beatografi", imageId: "marketplace" },
];
```

- [ ] **Step 5: Add `ProfileCopy`.** In `content/profile.ts`, after the `Profile` interface:

```ts
// The part of the profile the admin edits (Sprint 7): the home's lead and bio.
export type ProfileCopy = Pick<Profile, "lead" | "bio">;
```

- [ ] **Step 6: Create `lib/content/keys.ts`.**

```ts
// Document keys of the admin overlay (Sprint 7 spec §1.2). One key per
// editable unit: a product page is work/<slug>; the rest are singletons.
export const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SINGLETON_KEYS = ["work-index", "pins", "lab", "profile", "experience"] as const;

export type WorkKey = `work/${string}`;
export type DocKey = WorkKey | (typeof SINGLETON_KEYS)[number];

export function workKey(slug: string): WorkKey {
  return `work/${slug}`;
}

export function slugOfKey(key: string): string | null {
  return key.startsWith("work/") ? key.slice("work/".length) : null;
}

export function isDocKey(value: string): value is DocKey {
  const slug = slugOfKey(value);
  if (slug !== null) return KEBAB.test(slug);
  return (SINGLETON_KEYS as readonly string[]).includes(value);
}
```

- [ ] **Step 7: Create `lib/content/schemas.ts`.**

```ts
import { z } from "zod";
import { type DocKey, slugOfKey } from "./keys";

// zod schemas for every admin document (Sprint 7 spec §1.2). They mirror the
// TypeScript types in content/; tests/content/schemas.test.ts proves the two
// are identical, so the repo content and the database can't drift in shape.
// Shape only: the content rules (ids, links, the then block) live in
// validateWork / validateSite.

export const orgIdSchema = z.enum(["primetek", "orkestra", "etiya", "bilkent"]);

const linkSchema = z.object({ label: z.string().min(1), href: z.string().min(1) });
const creditSchema = z.object({ name: z.string().min(1), role: z.string().optional(), href: z.string().optional() });
const pinSchema = z.object({ title: z.string().min(1), note: z.string().min(1) });

const workImageSchema = z.object({
  id: z.string(),
  caption: z.string().optional(),
  credits: z.array(creditSchema).optional(),
  image: z.string().optional(),
  pin: pinSchema.optional(),
});

const blockSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), id: z.string(), heading: z.string().min(1), body: z.array(z.string()), links: z.array(linkSchema).optional() }),
  z.object({
    kind: z.literal("images"),
    id: z.string(),
    heading: z.string().optional(),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    images: z.array(workImageSchema),
  }),
  z.object({ kind: z.literal("icons"), id: z.string(), heading: z.string().optional() }),
  z.object({ kind: z.literal("then"), id: z.string(), year: z.string(), body: z.array(z.string()), sources: z.array(linkSchema).optional() }),
]);

export const productPageSchema = z.object({
  slug: z.string(),
  org: orgIdSchema,
  title: z.string().min(1),
  kind: z.string(),
  lead: z.object({ strong: z.string().min(1), rest: z.string() }),
  intro: z.string(),
  facts: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })),
  links: z.array(linkSchema).optional(),
  blocks: z.array(blockSchema),
});

export const workIndexSchema = z.object({ slugs: z.array(z.string()) });

export const pinsSchema = z.object({ order: z.array(z.object({ slug: z.string(), imageId: z.string() })) });

export const labSchema = z.array(
  z.object({ title: z.string().min(1), description: z.string().min(1), year: z.string().optional(), href: z.string().optional() }),
);

export const profileSchema = z.object({
  lead: z.object({ strong: z.string().min(1), rest: z.string() }),
  bio: z.array(z.array(z.union([z.string(), z.object({ org: orgIdSchema })]))),
});

// YYYY-MM
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "use YYYY-MM");

export const experienceSchema = z.array(
  z.object({
    org: orgIdSchema,
    role: z.string().min(1),
    start: monthSchema,
    end: monthSchema.nullable(),
    children: z.array(z.object({ title: z.string().min(1), note: z.string(), href: z.string().optional(), years: z.string().optional() })),
  }),
);

export function schemaFor(key: DocKey): z.ZodType {
  if (slugOfKey(key) !== null) return productPageSchema;
  switch (key) {
    case "work-index":
      return workIndexSchema;
    case "pins":
      return pinsSchema;
    case "lab":
      return labSchema;
    case "profile":
      return profileSchema;
    case "experience":
      return experienceSchema;
    default:
      throw new Error(`no schema for ${key}`);
  }
}
```

  If `expectTypeOf(...).toEqualTypeOf` fails in `npm run typecheck`, fix the **schema** until the inferred type equals the content type. Never change the content types to match the schema.

- [ ] **Step 8: Rebuild pins from the order list.** In `lib/work/derive.ts`:
  - add `import type { PinRef } from "@/content/pins";`;
  - add `order: number` to `PinView`;
  - replace `buildPins`:

```ts
export interface PinView {
  slug: WorkSlug;
  pageTitle: string;
  // The images block the pin sits in: Selected work links to /work/<slug>/#<blockId>.
  blockId: string;
  image: ImageView;
  pin: Pin;
  // 1-based position on the home.
  order: number;
}
```

```ts
// Every pinned image across pages, in `order` (the pins document). Pinned
// images it doesn't list follow in page order; refs to images that are gone or
// no longer pinned are skipped, and a ref listed twice counts once.
export function buildPins(pages: ProductPage[], order: PinRef[], lookup: ImageLookup): PinView[] {
  const found = new Map<string, Omit<PinView, "order">>();
  for (const page of pages) {
    const view = buildProductPage(page, lookup);
    for (const block of view.blocks) {
      if (block.kind !== "images") continue;
      for (const image of block.images) {
        if (image.pin) found.set(`${page.slug}/${image.id}`, { slug: page.slug, pageTitle: page.title, blockId: block.id, image, pin: image.pin });
      }
    }
  }
  const keys = [...new Set(order.map((ref) => `${ref.slug}/${ref.imageId}`))].filter((key) => found.has(key));
  for (const key of found.keys()) if (!keys.includes(key)) keys.push(key);
  return keys.map((key, index) => ({ ...found.get(key)!, order: index + 1 }));
}
```

- [ ] **Step 9: Drop the pin-order rule from `validateWork`.** In `lib/work/validate.ts`:
  - delete `const pinOrders = new Map<number, string>();`;
  - delete the `if (image.pin) { … }` block at the end of the image loop.

  Pin order now lives in the `pins` document, and validateSite (Task 3) checks it.

- [ ] **Step 10: Update callers.**
  - In `lib/work/index.ts`, import `pinOrder` from `@/content/pins`, and in `getPins` return `buildPins(productPages, pinOrder, findImage)`. Update its comment to "in the pins order".
  - In `components/home/selected-work.tsx`, the placeholder label becomes `` `FIG. ${pad2(pin.order)} · ${pin.pin.title}` ``.
  - In `e2e/home.spec.ts`:
    - add `import { pinOrder } from "../content/pins";`;
    - change the setup line to `const pins = buildPins(productPages, pinOrder, () => undefined);`;
    - in the Selected work test, use `pin.order` instead of `pin.pin.order`.

- [ ] **Step 11: Update the existing tests.**
  - `tests/work/validate.test.ts`:
    - in the `page()` helper, the pin becomes `pin: { title: "Components", note: "A kit." }`;
    - delete the test "rejects a duplicate pin order across pages".
  - `tests/ui/home.test.tsx`: the `pin` fixture becomes `pin: { title: "Components", note: "The Figma kit" }, order: 1,`.
  - `tests/content/work.test.ts`, in the pins test:
    - `pins.map((pin) => [pin.order, pin.slug, pin.blockId])`;
    - `pin.pin.title` stays as it is.
  - `tests/work/pins.test.ts`:
    - the fixtures drop `order` from their pins: `pin: { title: "B", note: "Second pin of one" }`, `pin: { title: "D", note: "First pin" }`, `pin: { title: "Sheet", note: "Icons" }`;
    - replace the whole `describe("buildPins", …)` block with:

```ts
describe("buildPins", () => {
  const order = [
    { slug: "primeone", imageId: "d" },
    { slug: "primeicons", imageId: "sheet" },
    { slug: "primeone", imageId: "b" },
  ];
  const pins = buildPins([one, icons], order, lookup);

  it("follows the order list across pages and numbers from 1", () => {
    expect(pins.map((pin) => pin.order)).toEqual([1, 2, 3]);
    expect(pins.map((pin) => pin.image.id)).toEqual(["d", "sheet", "b"]);
  });

  it("carries the page slug, title and the block id each pin links to", () => {
    expect(pins.map((pin) => [pin.slug, pin.pageTitle, pin.blockId])).toEqual([
      ["primeone", "PrimeOne", "second"],
      ["primeicons", "PrimeIcons", "highlights"],
      ["primeone", "PrimeOne", "first"],
    ]);
  });

  it("resolves the pinned image and keeps its FIG number on its page", () => {
    expect(pins[0].image.image?.key).toBe("work/primeone/d");
    expect(pins[0].image.fig).toBe(4);
    expect(pins[1].image.image).toBeNull();
  });

  it("appends pinned images the list misses, in page order", () => {
    expect(buildPins([one, icons], [{ slug: "primeicons", imageId: "sheet" }], lookup).map((pin) => pin.image.id)).toEqual(["sheet", "b", "d"]);
  });

  it("skips refs to missing or unpinned images and counts a duplicate once", () => {
    const stale = [
      { slug: "primeone", imageId: "a" },
      { slug: "gone", imageId: "x" },
      { slug: "primeone", imageId: "d" },
      { slug: "primeone", imageId: "d" },
    ];
    expect(buildPins([one, icons], stale, lookup).map((pin) => [pin.order, pin.image.id])).toEqual([
      [1, "d"],
      [2, "b"],
      [3, "sheet"],
    ]);
  });
});
```

- [ ] **Step 12: Run the tests.** Run `npx vitest run tests/content tests/work tests/ui`. Expected: PASS. Then run `npm run typecheck && npm run lint && npm test`. Expected: PASS.

- [ ] **Step 13: Commit.**

```bash
git add content lib/content lib/work components/home/selected-work.tsx tests e2e/home.spec.ts
git commit -m "Move pin order into its own list and add zod schemas for the admin documents

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Site resolution and cross-document validation

**Files:**
- Create: `lib/content/issues.ts`, `lib/content/site.ts`, `lib/content/validate-site.ts`, `tests/content/site.test.ts`, `tests/content/validate-site.test.ts`

**Interfaces:**
- Consumes: Task 2's schemas, keys, `pinOrder`, `ProfileCopy`.
- Produces:
  - `issues.ts`: `Issue { doc: DocKey; at: string; message: string }`, `formatIssue(issue): string`, `issuesAt(issues, doc, at): Issue[]`;
  - `site.ts`:
    - `SiteContent { pages: ProductPage[]; pins: PinRef[]; lab: LabEntry[]; profile: ProfileCopy; experience: ExperienceEntry[] }`;
    - `DocSnapshot { key: string; draft: unknown; published: unknown }`;
    - `DocValues = Map<string, unknown>`;
    - `repoSite()`, `repoValue(key)`;
    - `publishedValues(docs)`, `draftValues(docs)`;
    - `indexSlugs(values)`, `resolvePage(values, slug)`, `resolveSite(values)`;
  - `validate-site.ts`: `validateSite(site, hasImage): Issue[]`, `workIssue(line): Issue`, `zodIssues(doc, error): Issue[]`.

- [ ] **Step 1: Write the failing tests.** Create `tests/content/site.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { labIndex } from "@/content/lab-index";
import { pinOrder } from "@/content/pins";
import { productPages } from "@/content/work";
import { draftValues, indexSlugs, publishedValues, repoSite, repoValue, resolvePage, resolveSite } from "@/lib/content/site";

const nebuu = productPages.find((p) => p.slug === "nebuu")!;

describe("repoSite", () => {
  it("is the repo content", () => {
    const site = repoSite();
    expect(site.pages).toBe(productPages);
    expect(site.pins).toBe(pinOrder);
    expect(site.lab).toBe(labIndex);
  });
});

describe("document values", () => {
  const docs = [
    { key: "lab", draft: [{ title: "Draft", description: "D" }], published: [{ title: "Live", description: "L" }] },
    { key: "work/new-page", draft: { ...nebuu, slug: "new-page" }, published: null },
    { key: "pins", draft: null, published: { order: [] } },
  ];

  it("publishedValues keeps only published values", () => {
    const values = publishedValues(docs);
    expect([...values.keys()]).toEqual(["lab", "pins"]);
    expect(values.get("lab")).toEqual([{ title: "Live", description: "L" }]);
  });

  it("draftValues prefers the draft", () => {
    const values = draftValues(docs);
    expect(values.get("lab")).toEqual([{ title: "Draft", description: "D" }]);
    expect(values.get("pins")).toEqual({ order: [] });
    expect(values.has("work/new-page")).toBe(true);
  });
});

describe("resolveSite", () => {
  it("falls back to the repo for every missing document", () => {
    expect(resolveSite(new Map())).toEqual(repoSite());
  });

  it("uses a published page, the index order and singletons", () => {
    const edited = { ...nebuu, intro: "Edited intro." };
    const values = new Map<string, unknown>([
      ["work/nebuu", edited],
      ["work-index", { slugs: ["nebuu", "primeone"] }],
      ["lab", [{ title: "Only", description: "One" }]],
    ]);
    const site = resolveSite(values);
    expect(site.pages.map((p) => p.slug)).toEqual(["nebuu", "primeone"]);
    expect(site.pages[0].intro).toBe("Edited intro.");
    expect(site.lab).toEqual([{ title: "Only", description: "One" }]);
    expect(site.pins).toBe(pinOrder);
  });

  it("skips an indexed slug with no document and no repo page", () => {
    expect(resolveSite(new Map([["work-index", { slugs: ["nebuu", "ghost"] }]])).pages.map((p) => p.slug)).toEqual(["nebuu"]);
  });

  it("ignores a value that doesn't match its schema", () => {
    expect(resolveSite(new Map([["lab", [{ title: "" }]]])).lab).toBe(labIndex);
  });

  it("resolves one page and the index slugs", () => {
    const values = new Map<string, unknown>([["work/new-page", { ...nebuu, slug: "new-page" }]]);
    expect(resolvePage(values, "new-page")?.slug).toBe("new-page");
    expect(resolvePage(values, "primeone")?.slug).toBe("primeone");
    expect(resolvePage(values, "ghost")).toBeNull();
    expect(indexSlugs(values)).toEqual(productPages.map((p) => p.slug));
  });
});

describe("repoValue", () => {
  it("returns each document's repo value", () => {
    expect(repoValue("work/nebuu")).toBe(nebuu);
    expect(repoValue("work/ghost")).toBeNull();
    expect(repoValue("pins")).toEqual({ order: pinOrder });
    expect(repoValue("work-index")).toEqual({ slugs: productPages.map((p) => p.slug) });
    expect(repoValue("lab")).toBe(labIndex);
  });
});
```

  Create `tests/content/validate-site.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { productPages } from "@/content/work";
import type { ProductPage } from "@/content/work/types";
import { hasImage } from "@/lib/images/manifest";
import { formatIssue, issuesAt } from "@/lib/content/issues";
import { repoSite } from "@/lib/content/site";
import { validateSite, workIssue } from "@/lib/content/validate-site";

const repo = repoSite();
const withPage = (slug: string, change: (page: ProductPage) => ProductPage) => ({
  ...repo,
  pages: repo.pages.map((page) => (page.slug === slug ? change(page) : page)),
});

describe("validateSite", () => {
  it("accepts the repo content", () => {
    expect(validateSite(repo, hasImage)).toEqual([]);
  });

  it("reports validateWork problems per page document", () => {
    const issues = validateSite(withPage("nebuu", (page) => ({ ...page, intro: " " })), hasImage);
    expect(issues).toEqual([{ doc: "work/nebuu", at: "", message: "intro must not be empty" }]);
  });

  it("rejects a slug that isn't kebab-case", () => {
    const site = { ...repo, pages: [...repo.pages, { ...productPages[0], slug: "Bad Slug" }] };
    expect(validateSite(site, hasImage)).toContainEqual({ doc: "work/Bad Slug", at: "slug", message: 'slug "Bad Slug" is not kebab-case' });
  });

  it("rejects a pin listed twice", () => {
    const site = { ...repo, pins: [...repo.pins, repo.pins[0]] };
    expect(validateSite(site, hasImage)).toEqual([{ doc: "pins", at: "6", message: "primeone/components is listed twice" }]);
  });

  it("rejects an Experience link to a missing page", () => {
    const site = { ...repo, pages: repo.pages.filter((page) => page.slug !== "gonna") };
    expect(validateSite(site, hasImage)).toContainEqual({
      doc: "experience",
      at: "0/children/8",
      message: "Gonna links /work/gonna/, which is not a product page",
    });
  });

  it("asks a linked page for its Years fact", () => {
    const site = withPage("nebuu", (page) => ({ ...page, facts: page.facts.filter((fact) => fact.label !== "Years") }));
    expect(validateSite(site, hasImage)).toEqual([{ doc: "work/nebuu", at: "facts", message: "Experience links this page, so it needs a Years fact" }]);
  });

  it("asks an unlinked Experience row for its own years, and an end after the start", () => {
    const experience = [{ ...repo.experience[2], end: "2013-01", children: [{ title: "Portal", note: "web" }] }];
    expect(validateSite({ ...repo, experience }, hasImage)).toEqual([
      { doc: "experience", at: "0/end", message: "the end is before the start" },
      { doc: "experience", at: "0/children/0", message: "Portal needs a page or its own years" },
    ]);
  });

  it("asks Lab links for https", () => {
    const lab = [{ title: "X", description: "Y", href: "http://x.com" }];
    expect(validateSite({ ...repo, lab }, hasImage)).toEqual([{ doc: "lab", at: "0/href", message: 'link "http://x.com" must be https' }]);
  });

  it("rejects an unknown organisation token in the bio", () => {
    const profile = { ...repo.profile, bio: [["At {acme} since 2020."]] };
    expect(validateSite({ ...repo, profile }, hasImage)).toEqual([{ doc: "profile", at: "bio/0", message: 'unknown organisation "{acme}"' }]);
  });
});

describe("workIssue", () => {
  it("splits validateWork lines into document, place and message", () => {
    expect(workIssue("nebuu/highlights/game: credit \"x\" must be https")).toEqual({ doc: "work/nebuu", at: "highlights/game", message: 'credit "x" must be https' });
    expect(workIssue('duplicate slug "nebuu"')).toEqual({ doc: "work-index", at: "", message: 'duplicate slug "nebuu"' });
  });
});

describe("issues", () => {
  const issues = [
    { doc: "work/nebuu" as const, at: "highlights/game", message: "a" },
    { doc: "work/nebuu" as const, at: "highlights", message: "b" },
    { doc: "work/nebuu" as const, at: "facts", message: "c" },
  ];
  it("formats an issue for a list", () => {
    expect(formatIssue(issues[0])).toBe("work/nebuu highlights/game: a");
    expect(formatIssue({ doc: "lab", at: "", message: "x" })).toBe("lab: x");
  });
  it("selects the issues at a place and below it", () => {
    expect(issuesAt(issues, "work/nebuu", "highlights").map((i) => i.message)).toEqual(["a", "b"]);
  });
});
```

- [ ] **Step 2: Run them to make sure they fail.** Run `npx vitest run tests/content/site.test.ts tests/content/validate-site.test.ts`. Expected: FAIL, because the modules don't exist yet.

- [ ] **Step 3: Create `lib/content/issues.ts`.**

```ts
import type { DocKey } from "./keys";

// A publish problem, placed in its document: `at` is a slash path inside it
// ("highlights/game", "facts", "0/children/2", "" for the whole document), so
// the editor can show it next to the field it belongs to.
export interface Issue {
  doc: DocKey;
  at: string;
  message: string;
}

export function formatIssue(issue: Issue): string {
  return issue.at ? `${issue.doc} ${issue.at}: ${issue.message}` : `${issue.doc}: ${issue.message}`;
}

// The issues of one document at `at` or anywhere under it.
export function issuesAt(issues: Issue[], doc: DocKey, at: string): Issue[] {
  return issues.filter((issue) => issue.doc === doc && (issue.at === at || issue.at.startsWith(`${at}/`)));
}
```

- [ ] **Step 4: Create `lib/content/site.ts`.**

```ts
import type { z } from "zod";
import { type ExperienceEntry, experience } from "@/content/experience";
import { type LabEntry, labIndex } from "@/content/lab-index";
import { type PinRef, pinOrder } from "@/content/pins";
import { type ProfileCopy, profile } from "@/content/profile";
import { productPages } from "@/content/work";
import type { ProductPage } from "@/content/work/types";
import { type DocKey, slugOfKey, workKey } from "./keys";
import { experienceSchema, labSchema, pinsSchema, productPageSchema, profileSchema, workIndexSchema } from "./schemas";

// The whole editable site, resolved from document values over the repo
// content (Sprint 7 spec §1.3). Pure: no database, no cache. lib/content/read.ts
// feeds it published values, the preview feeds it drafts.

export interface SiteContent {
  // Registry order (the work-index document).
  pages: ProductPage[];
  pins: PinRef[];
  lab: LabEntry[];
  profile: ProfileCopy;
  experience: ExperienceEntry[];
}

// The part of a stored document resolution needs (ContentDoc extends it).
export interface DocSnapshot {
  key: string;
  draft: unknown;
  published: unknown;
}

// Document key → value. A missing key means "use the repo".
export type DocValues = Map<string, unknown>;

export function repoSite(): SiteContent {
  return { pages: productPages, pins: pinOrder, lab: labIndex, profile: { lead: profile.lead, bio: profile.bio }, experience };
}

// A document's repo value, the editor's starting point when nothing is stored.
// null for a page that only exists in the admin.
export function repoValue(key: DocKey): unknown {
  const slug = slugOfKey(key);
  if (slug !== null) return productPages.find((page) => page.slug === slug) ?? null;
  const repo = repoSite();
  switch (key) {
    case "work-index":
      return { slugs: repo.pages.map((page) => page.slug) };
    case "pins":
      return { order: repo.pins };
    case "lab":
      return repo.lab;
    case "profile":
      return repo.profile;
    case "experience":
      return repo.experience;
    default:
      return null;
  }
}

// What visitors see: each document's published value.
export function publishedValues(docs: DocSnapshot[]): DocValues {
  return new Map(docs.filter((doc) => doc.published != null).map((doc) => [doc.key, doc.published]));
}

// What the preview shows: each document's draft, else its published value.
export function draftValues(docs: DocSnapshot[]): DocValues {
  return new Map(docs.filter((doc) => (doc.draft ?? doc.published) != null).map((doc) => [doc.key, doc.draft ?? doc.published]));
}

// A stored value that no longer matches its schema is ignored with a warning,
// so one bad row can never take a page down.
function parsed<T>(values: DocValues, key: DocKey, schema: z.ZodType<T>): T | undefined {
  if (!values.has(key)) return undefined;
  const result = schema.safeParse(values.get(key));
  if (result.success) return result.data;
  console.warn(`[content] ${key} does not match its schema; using the repo version`);
  return undefined;
}

export function indexSlugs(values: DocValues): string[] {
  return parsed(values, "work-index", workIndexSchema)?.slugs ?? productPages.map((page) => page.slug);
}

export function resolvePage(values: DocValues, slug: string): ProductPage | null {
  return parsed(values, workKey(slug), productPageSchema) ?? productPages.find((page) => page.slug === slug) ?? null;
}

export function resolveSite(values: DocValues): SiteContent {
  const repo = repoSite();
  const pages = indexSlugs(values).flatMap((slug) => {
    const page = resolvePage(values, slug);
    if (!page) console.warn(`[content] work-index lists "${slug}", which has no page`);
    return page ? [page] : [];
  });
  return {
    pages,
    pins: parsed(values, "pins", pinsSchema)?.order ?? repo.pins,
    lab: parsed(values, "lab", labSchema) ?? repo.lab,
    profile: parsed(values, "profile", profileSchema) ?? repo.profile,
    experience: parsed(values, "experience", experienceSchema) ?? repo.experience,
  };
}
```

  If `resolveSite(new Map())` isn't `toEqual(repoSite())` because `profile` is a new object, that is fine: `toEqual` compares structurally.

- [ ] **Step 5: Create `lib/content/validate-site.ts`.**

```ts
import type { z } from "zod";
import { validateWork } from "@/lib/work/validate";
import type { Issue } from "./issues";
import { type DocKey, KEBAB, workKey } from "./keys";
import type { SiteContent } from "./site";

// Publish-time checks over a whole would-be site (Sprint 7 spec §1.5):
// validateWork's per-page rules plus the rules that span documents.

const LINE = /^([a-z0-9-]+)(?:\/([^:]+))?: (.+)$/;

// validateWork reports "slug/block/image: message"; place it in its document.
export function workIssue(line: string): Issue {
  const match = LINE.exec(line);
  if (!match) return { doc: "work-index", at: "", message: line };
  return { doc: workKey(match[1]), at: match[2] ?? "", message: match[3] };
}

export function zodIssues(doc: DocKey, error: z.ZodError): Issue[] {
  return error.issues.map((issue) => ({ doc, at: issue.path.map(String).join("/"), message: issue.message }));
}

export function validateSite(site: SiteContent, hasImage: (key: string) => boolean): Issue[] {
  const issues = validateWork(site.pages, hasImage).map(workIssue);

  for (const page of site.pages) {
    if (!KEBAB.test(page.slug)) issues.push({ doc: workKey(page.slug), at: "slug", message: `slug "${page.slug}" is not kebab-case` });
  }

  const pinned = new Set<string>();
  site.pins.forEach((ref, index) => {
    const id = `${ref.slug}/${ref.imageId}`;
    if (pinned.has(id)) issues.push({ doc: "pins", at: String(index), message: `${id} is listed twice` });
    pinned.add(id);
  });

  site.experience.forEach((entry, i) => {
    if (entry.end && entry.end < entry.start) issues.push({ doc: "experience", at: `${i}/end`, message: "the end is before the start" });
    entry.children.forEach((child, j) => {
      const at = `${i}/children/${j}`;
      if (child.href) {
        const page = site.pages.find((item) => `/work/${item.slug}/` === child.href);
        if (!page) {
          issues.push({ doc: "experience", at, message: `${child.title} links ${child.href}, which is not a product page` });
        } else if (!page.facts.some((fact) => fact.label === "Years" && fact.value.trim())) {
          issues.push({ doc: workKey(page.slug), at: "facts", message: "Experience links this page, so it needs a Years fact" });
        }
      } else if (!child.years?.trim()) {
        issues.push({ doc: "experience", at, message: `${child.title} needs a page or its own years` });
      }
    });
  });

  site.lab.forEach((entry, index) => {
    if (entry.href && !entry.href.startsWith("https://")) issues.push({ doc: "lab", at: `${index}/href`, message: `link "${entry.href}" must be https` });
  });

  site.profile.bio.forEach((paragraph, index) => {
    for (const segment of paragraph) {
      if (typeof segment !== "string") continue;
      for (const match of segment.matchAll(/\{([^}]*)\}/g)) {
        issues.push({ doc: "profile", at: `bio/${index}`, message: `unknown organisation "{${match[1]}}"` });
      }
    }
  });

  return issues;
}
```

- [ ] **Step 6: Run the tests.** Run `npx vitest run tests/content`. Expected: PASS. Watch the Experience-link test: Gonna must be the ninth Orkestra child (index 8) in `content/experience.ts`. If someone reordered Experience, adjust the expected `at`. Then run `npm run typecheck && npm run lint && npm test`. Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add lib/content tests/content
git commit -m "Resolve the site from document values and validate it across documents

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Content store — tables, Drizzle and file implementations

**Files:**
- Modify: `lib/db/schema.ts`, `.gitignore`
- Create: `drizzle/0001_content_docs_media.sql` (generated) with its `drizzle/meta/` updates, `lib/content/store.ts`, `lib/content/drizzle-store.ts`, `lib/content/file-store.ts`, `lib/content/get-store.ts`
- Test: `tests/helpers/content-store-contract.ts`, `tests/content/drizzle-store.test.ts`, `tests/content/file-store.test.ts`

**Interfaces:**
- Consumes: `DocKey`, `isDocKey` (Task 2); `DocSnapshot` (Task 3).
- Produces (`lib/content/store.ts`):

```ts
export interface ContentDoc extends DocSnapshot { key: DocKey; draftUpdatedAt: Date | null; publishedAt: Date | null }
export interface MediaRecord { key: string; baseUrl: string; width: number; height: number; widths: number[]; sourceHash: string; settings: string; createdAt: Date }
export type SaveResult = { ok: true; draftUpdatedAt: Date } | { ok: false };
export interface ContentStore {
  getDoc(key: DocKey): Promise<ContentDoc | null>;
  listDocs(): Promise<ContentDoc[]>;
  saveDraft(key: DocKey, draft: unknown, expected: Date | null, now: Date): Promise<SaveResult>;
  publish(key: DocKey, value: unknown, now: Date): Promise<void>;
  discardDraft(key: DocKey): Promise<void>;
  deleteDoc(key: DocKey): Promise<void>;
  listMedia(): Promise<MediaRecord[]>;
  putMedia(record: MediaRecord): Promise<void>;
}
```

  Also `DrizzleContentStore`, `FileContentStore` and `getContentStore(): ContentStore | null`.

- [ ] **Step 1: Write the shared contract and the two failing test files.** Create `tests/helpers/content-store-contract.ts`. Its name doesn't end in `.test.ts`, so Vitest only runs it through the two files below.

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { ContentStore, MediaRecord } from "@/lib/content/store";

const t0 = new Date("2026-10-04T10:00:00.000Z");
const t1 = new Date("2026-10-04T10:00:05.000Z");
const t2 = new Date("2026-10-04T10:00:09.000Z");

export const sampleMedia: MediaRecord = {
  key: "media/work/nebuu/game-ab12cd34",
  baseUrl: "https://x.public.blob.vercel-storage.com/media/work/nebuu/game-ab12cd34",
  width: 2560,
  height: 1600,
  widths: [640, 1280, 2560],
  sourceHash: "ab12cd34",
  settings: "v1",
  createdAt: t0,
};

// The behaviour both ContentStore implementations must share.
export function describeContentStore(name: string, make: () => Promise<ContentStore>) {
  describe(name, () => {
    let store: ContentStore;
    beforeEach(async () => {
      store = await make();
    });

    it("starts empty", async () => {
      expect(await store.getDoc("lab")).toBeNull();
      expect(await store.listDocs()).toEqual([]);
      expect(await store.listMedia()).toEqual([]);
    });

    it("saves a first draft only when no draft is expected", async () => {
      expect(await store.saveDraft("lab", [{ title: "A", description: "B" }], null, t0)).toEqual({ ok: true, draftUpdatedAt: t0 });
      expect(await store.getDoc("lab")).toEqual({ key: "lab", draft: [{ title: "A", description: "B" }], published: null, draftUpdatedAt: t0, publishedAt: null });
      expect(await store.saveDraft("lab", [], null, t1)).toEqual({ ok: false });
    });

    it("saves over a draft only when the caller saw the latest one", async () => {
      await store.saveDraft("lab", ["one"], null, t0);
      expect(await store.saveDraft("lab", ["two"], t0, t1)).toEqual({ ok: true, draftUpdatedAt: t1 });
      expect(await store.saveDraft("lab", ["stale"], t0, t2)).toEqual({ ok: false });
      expect((await store.getDoc("lab"))?.draft).toEqual(["two"]);
    });

    it("refuses an expected draft that doesn't exist", async () => {
      expect(await store.saveDraft("lab", ["x"], t0, t1)).toEqual({ ok: false });
    });

    it("publishes: the value goes live and the draft is cleared", async () => {
      await store.saveDraft("lab", ["draft"], null, t0);
      await store.publish("lab", ["live"], t1);
      expect(await store.getDoc("lab")).toEqual({ key: "lab", draft: null, published: ["live"], draftUpdatedAt: null, publishedAt: t1 });
      expect(await store.saveDraft("lab", ["next"], null, t2)).toEqual({ ok: true, draftUpdatedAt: t2 });
    });

    it("discards a draft, keeping the published value, and drops a draft-only row", async () => {
      await store.publish("lab", ["live"], t0);
      await store.saveDraft("lab", ["draft"], null, t1);
      await store.discardDraft("lab");
      expect(await store.getDoc("lab")).toMatchObject({ draft: null, published: ["live"], draftUpdatedAt: null });
      await store.saveDraft("work/new-page", { slug: "new-page" }, null, t1);
      await store.discardDraft("work/new-page");
      expect(await store.getDoc("work/new-page")).toBeNull();
    });

    it("deletes a document and lists the rest", async () => {
      await store.publish("lab", ["a"], t0);
      await store.publish("pins", { order: [] }, t0);
      await store.deleteDoc("lab");
      expect((await store.listDocs()).map((doc) => doc.key)).toEqual(["pins"]);
    });

    it("stores media and replaces a record with the same key", async () => {
      await store.putMedia(sampleMedia);
      await store.putMedia({ ...sampleMedia, height: 1599 });
      expect(await store.listMedia()).toEqual([{ ...sampleMedia, height: 1599 }]);
    });
  });
}
```

  Create `tests/content/drizzle-store.test.ts`:

```ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DrizzleContentStore } from "@/lib/content/drizzle-store";
import { describeContentStore } from "../helpers/content-store-contract";

describeContentStore("DrizzleContentStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return new DrizzleContentStore(db);
});
```

  Create `tests/content/file-store.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileContentStore } from "@/lib/content/file-store";
import { describeContentStore } from "../helpers/content-store-contract";

describeContentStore("FileContentStore", async () => new FileContentStore(join(mkdtempSync(join(tmpdir(), "content-")), "store.json")));

describe("FileContentStore persistence", () => {
  it("is readable by a second instance on the same file", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "content-")), "nested", "store.json");
    await new FileContentStore(path).publish("lab", ["live"], new Date("2026-10-04T10:00:00.000Z"));
    expect((await new FileContentStore(path).getDoc("lab"))?.published).toEqual(["live"]);
  });
});
```

- [ ] **Step 2: Run them to make sure they fail.** Run `npx vitest run tests/content/drizzle-store.test.ts tests/content/file-store.test.ts`. Expected: FAIL, because the modules don't exist yet.

- [ ] **Step 3: Add the tables.** Append to `lib/db/schema.ts`. The import line gains nothing new: `integer`, `jsonb`, `pgTable`, `text` and `timestamp` are already imported.

```ts
// Admin documents (Sprint 7): one row per editable unit (lib/content/keys.ts).
// `published` null means "use the repo content"; `draft` null means no
// unpublished edit. draft_updated_at guards autosave against a stale tab.
export const contentDocs = pgTable("content_docs", {
  key: text("key").primaryKey(),
  draft: jsonb("draft"),
  published: jsonb("published"),
  draftUpdatedAt: timestamp("draft_updated_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

// Uploaded images (Sprint 7): renditions live in Blob under base_url
// (`${baseUrl}-${width}.avif|jpg`); merged into the image manifest by key.
export const media = pgTable("media", {
  key: text("key").primaryKey(),
  baseUrl: text("base_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  widths: jsonb("widths").$type<number[]>().notNull(),
  sourceHash: text("source_hash").notNull(),
  settings: text("settings").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
```

  Run `npx drizzle-kit generate --name content_docs_media`. Expected: a new `drizzle/0001_content_docs_media.sql` with two `CREATE TABLE` statements and nothing else (expand only). Commit `drizzle/meta/` changes with it.

- [ ] **Step 4: Create `lib/content/store.ts`.** Put the interface block from **Interfaces** in it, with these imports and a header comment:

```ts
import type { DocKey } from "./keys";
import type { DocSnapshot } from "./site";

// Persistence for admin documents and uploaded images. DrizzleContentStore
// backs production (Neon); FileContentStore backs local dev and the admin e2e.
// saveDraft is an optimistic write: `expected` is the draftUpdatedAt the caller
// last saw (null when it saw no draft); a mismatch returns { ok: false }.
```

- [ ] **Step 5: Create `lib/content/drizzle-store.ts`.**

```ts
import { and, eq, isNull } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { contentDocs, media } from "../db/schema";
import { type DocKey, isDocKey } from "./keys";
import type { ContentDoc, ContentStore, MediaRecord, SaveResult } from "./store";

// Accepts any Postgres Drizzle database: neon-http in production, PGlite in tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

function toDoc(row: typeof contentDocs.$inferSelect): ContentDoc {
  return {
    key: row.key as DocKey,
    draft: row.draft ?? null,
    published: row.published ?? null,
    draftUpdatedAt: row.draftUpdatedAt,
    publishedAt: row.publishedAt,
  };
}

export class DrizzleContentStore implements ContentStore {
  constructor(private db: AnyPgDatabase) {}

  async getDoc(key: DocKey): Promise<ContentDoc | null> {
    const rows = await this.db.select().from(contentDocs).where(eq(contentDocs.key, key)).limit(1);
    return rows[0] ? toDoc(rows[0]) : null;
  }

  async listDocs(): Promise<ContentDoc[]> {
    const rows = await this.db.select().from(contentDocs).orderBy(contentDocs.key);
    return rows.filter((row) => isDocKey(row.key)).map(toDoc);
  }

  async saveDraft(key: DocKey, draft: unknown, expected: Date | null, now: Date): Promise<SaveResult> {
    const set = { draft, draftUpdatedAt: now };
    const rows =
      expected === null
        ? await this.db
            .insert(contentDocs)
            .values({ key, ...set })
            .onConflictDoUpdate({ target: contentDocs.key, set, setWhere: isNull(contentDocs.draftUpdatedAt) })
            .returning({ key: contentDocs.key })
        : await this.db
            .update(contentDocs)
            .set(set)
            .where(and(eq(contentDocs.key, key), eq(contentDocs.draftUpdatedAt, expected)))
            .returning({ key: contentDocs.key });
    return rows.length > 0 ? { ok: true, draftUpdatedAt: now } : { ok: false };
  }

  async publish(key: DocKey, value: unknown, now: Date): Promise<void> {
    const set = { published: value, draft: null, draftUpdatedAt: null, publishedAt: now };
    await this.db.insert(contentDocs).values({ key, ...set }).onConflictDoUpdate({ target: contentDocs.key, set });
  }

  async discardDraft(key: DocKey): Promise<void> {
    await this.db.update(contentDocs).set({ draft: null, draftUpdatedAt: null }).where(eq(contentDocs.key, key));
    // A page created in the admin and never published has nothing left.
    await this.db.delete(contentDocs).where(and(eq(contentDocs.key, key), isNull(contentDocs.published)));
  }

  async deleteDoc(key: DocKey): Promise<void> {
    await this.db.delete(contentDocs).where(eq(contentDocs.key, key));
  }

  async listMedia(): Promise<MediaRecord[]> {
    const rows = await this.db.select().from(media).orderBy(media.key);
    return rows.map((row) => ({ ...row }));
  }

  async putMedia(record: MediaRecord): Promise<void> {
    const { key, ...rest } = record;
    await this.db.insert(media).values(record).onConflictDoUpdate({ target: media.key, set: rest });
  }
}
```

  **Watch out for JSON null.** The contract's "drops a draft-only row" test checks that `draft: null` / `published: null` are stored as SQL `NULL`. If it fails, Drizzle is writing the JSON value `null` and `isNull` won't match it. Write `sql\`null\`` (from `drizzle-orm`) for those fields in `set`, and re-run the test.

- [ ] **Step 6: Create `lib/content/file-store.ts`.**

```ts
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { type DocKey, isDocKey } from "./keys";
import type { ContentDoc, ContentStore, MediaRecord, SaveResult } from "./store";

// A JSON-file ContentStore for local development and the admin e2e, so
// neither ever writes to the production database. getContentStore refuses it
// on Vercel. Same semantics as DrizzleContentStore (tests/helpers/content-store-contract.ts).

interface FileDoc {
  draft: unknown;
  published: unknown;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
}

interface FileMedia extends Omit<MediaRecord, "createdAt"> {
  createdAt: string;
}

interface FileData {
  docs: Record<string, FileDoc>;
  media: Record<string, FileMedia>;
}

export class FileContentStore implements ContentStore {
  constructor(private path: string) {}

  private read(): FileData {
    if (!existsSync(this.path)) return { docs: {}, media: {} };
    return JSON.parse(readFileSync(this.path, "utf8")) as FileData;
  }

  private write(data: FileData) {
    mkdirSync(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
    renameSync(temp, this.path);
  }

  private toDoc(key: string, doc: FileDoc): ContentDoc {
    return {
      key: key as DocKey,
      draft: doc.draft ?? null,
      published: doc.published ?? null,
      draftUpdatedAt: doc.draftUpdatedAt ? new Date(doc.draftUpdatedAt) : null,
      publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
    };
  }

  async getDoc(key: DocKey): Promise<ContentDoc | null> {
    const doc = this.read().docs[key];
    return doc ? this.toDoc(key, doc) : null;
  }

  async listDocs(): Promise<ContentDoc[]> {
    return Object.entries(this.read().docs)
      .filter(([key]) => isDocKey(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, doc]) => this.toDoc(key, doc));
  }

  async saveDraft(key: DocKey, draft: unknown, expected: Date | null, now: Date): Promise<SaveResult> {
    const data = this.read();
    const doc = data.docs[key];
    if ((expected?.toISOString() ?? null) !== (doc?.draftUpdatedAt ?? null)) return { ok: false };
    data.docs[key] = { published: doc?.published ?? null, publishedAt: doc?.publishedAt ?? null, draft, draftUpdatedAt: now.toISOString() };
    this.write(data);
    return { ok: true, draftUpdatedAt: now };
  }

  async publish(key: DocKey, value: unknown, now: Date): Promise<void> {
    const data = this.read();
    data.docs[key] = { draft: null, draftUpdatedAt: null, published: value, publishedAt: now.toISOString() };
    this.write(data);
  }

  async discardDraft(key: DocKey): Promise<void> {
    const data = this.read();
    const doc = data.docs[key];
    if (!doc) return;
    if (doc.published == null) delete data.docs[key];
    else data.docs[key] = { ...doc, draft: null, draftUpdatedAt: null };
    this.write(data);
  }

  async deleteDoc(key: DocKey): Promise<void> {
    const data = this.read();
    delete data.docs[key];
    this.write(data);
  }

  async listMedia(): Promise<MediaRecord[]> {
    return Object.values(this.read().media)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((record) => ({ ...record, createdAt: new Date(record.createdAt) }));
  }

  async putMedia(record: MediaRecord): Promise<void> {
    const data = this.read();
    data.media[record.key] = { ...record, createdAt: record.createdAt.toISOString() };
    this.write(data);
  }
}
```

- [ ] **Step 7: Create `lib/content/get-store.ts`.**

```ts
import "server-only";
import { getDb } from "../db/client";
import { DrizzleContentStore } from "./drizzle-store";
import { FileContentStore } from "./file-store";
import type { ContentStore } from "./store";

// The store the admin and the public reads use. CONTENT_STORE_FILE (local dev,
// the admin e2e) wins so local editing never touches the production database;
// it is refused on Vercel. Otherwise Neon, or null without DATABASE_URL (the
// site then renders the repo content and the admin can't write).
export function getContentStore(): ContentStore | null {
  const file = process.env.CONTENT_STORE_FILE;
  if (file) {
    if (process.env.VERCEL) throw new Error("CONTENT_STORE_FILE is for local development and e2e only");
    return new FileContentStore(file);
  }
  const db = getDb();
  return db ? new DrizzleContentStore(db) : null;
}
```

- [ ] **Step 8: Ignore local stores.** Append to `.gitignore`:

```
# Sprint 7 admin: local content store, local media and the admin e2e's data
/.content-dev.json
/.media-dev/
/.e2e-admin/
```

- [ ] **Step 9: Run the tests.** Run `npx vitest run tests/content`. Expected: PASS for both stores. Then run `npm run typecheck && npm run lint && npm test`. Expected: PASS.

- [ ] **Step 10: Commit.**

```bash
git add lib/db/schema.ts drizzle lib/content tests/helpers/content-store-contract.ts tests/content .gitignore
git commit -m "Add content_docs and media tables with Drizzle and file-backed stores

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Public reads go through the overlay

**Files:**
- Modify: `lib/images/plan.ts`, `components/picture-view.tsx`, `lib/work/derive.ts` (`resolveImage`), `lib/work/index.ts`, `app/(work)/work/[slug]/page.tsx`, `app/(work)/page.tsx`, `app/(work)/system/page.tsx`, `components/home/home-site.tsx`
- Create: `lib/images/lookup.ts`, `lib/content/read.ts`, `lib/work/views.ts`, `components/work/product-page-body.tsx`, `tests/content/views.test.tsx`
- Test: `tests/content/work.test.ts`, `tests/content/experience.test.ts`, `tests/images-plan.test.ts`

**Interfaces:**
- Consumes: `SiteContent`, `repoSite`, `resolveSite`, `publishedValues` (Task 3); `getContentStore`, `MediaRecord` (Task 4).
- Produces:
  - `ImageEntry.baseUrl?: string`;
  - `renditionUrl(key, width, format, baseUrl?)`;
  - `MediaEntry extends ImageEntry { key: string; baseUrl: string }`;
  - `toMediaEntry(record)`, `lookupWith(media): ImageLookup`, `hasImageWith(media)`;
  - `CONTENT_TAG = "content"`;
  - `getPublishedContent(): Promise<{ site: SiteContent; media: MediaEntry[] }>`;
  - from `lib/work/views.ts`: `productSlugs(site)`, `productPageView(site, slug, lookup)`, `pinViews(site, lookup)`, `experienceViews(site)`, `HomeContent`, `homeContent(site, lookup)`;
  - from `lib/work/index.ts` (async): `getProductSlugs()`, `getProductPage(slug)`, `getPins()`, `getHomeContent()`;
  - `HomeSite({ content }: { content: HomeContent })`;
  - `ProductPageBody({ page, icons })`.

- [ ] **Step 1: Write the failing tests.** Create `tests/content/views.test.tsx` (it renders JSX):

```ts
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PictureView } from "@/components/picture-view";
import { lookupWith, hasImageWith, toMediaEntry } from "@/lib/images/lookup";
import { renditionUrl } from "@/lib/images/plan";
import { repoSite } from "@/lib/content/site";
import { experienceViews, homeContent, pinViews, productPageView, productSlugs } from "@/lib/work/views";

const record = {
  key: "media/work/nebuu/game-ab12cd34",
  baseUrl: "https://x.public.blob.vercel-storage.com/media/work/nebuu/game-ab12cd34",
  width: 2560,
  height: 1600,
  widths: [640, 1280, 2560],
  sourceHash: "ab12cd34",
  settings: "v1",
  createdAt: new Date("2026-10-04T10:00:00.000Z"),
};

describe("uploaded images", () => {
  it("build rendition URLs from their base URL", () => {
    expect(renditionUrl("photos/stabilo", 640, "avif")).toBe("/images/photos/stabilo-640.avif");
    expect(renditionUrl(record.key, 640, "jpg", record.baseUrl)).toBe(`${record.baseUrl}-640.jpg`);
  });

  it("are found by key ahead of the manifest", () => {
    const media = [toMediaEntry(record)];
    expect(lookupWith(media)(record.key)).toEqual({ width: 2560, height: 1600, widths: [640, 1280, 2560], baseUrl: record.baseUrl });
    expect(lookupWith(media)("work/nebuu/nothing")).toBeUndefined();
    expect(hasImageWith(media)(record.key)).toBe(true);
  });

  it("render through PictureView with their base URL", () => {
    const markup = renderToStaticMarkup(<PictureView image={record.key} entry={lookupWith([toMediaEntry(record)])(record.key)!} alt="" />);
    expect(markup).toContain(`${record.baseUrl}-2560.jpg`);
    expect(markup).not.toContain("/images/media/");
  });
});

describe("site views", () => {
  const site = repoSite();
  const none = () => undefined;

  it("lists slugs in registry order and builds a page", () => {
    expect(productSlugs(site)[0]).toBe("primeone");
    expect(productPageView(site, "nebuu", none)?.title).toBe("Nebuu");
    expect(productPageView(site, "ghost", none)).toBeNull();
  });

  it("builds the home content from one site", () => {
    const content = homeContent(site, none);
    expect(content.pins.map((pin) => pin.slug)).toEqual(pinViews(site, none).map((pin) => pin.slug));
    expect(content.experience).toEqual(experienceViews(site));
    expect(content.lab).toBe(site.lab);
    expect(content.profile).toBe(site.profile);
  });
});
```


- [ ] **Step 2: Run it to make sure it fails.** Run `npx vitest run tests/content/views.test.tsx`. Expected: FAIL, because the modules don't exist yet.

- [ ] **Step 3: Add base URLs to image entries.** In `lib/images/plan.ts`:

```ts
export interface ImageEntry {
  // Intrinsic size of the largest generated rendition.
  width: number;
  height: number;
  // Generated widths, ascending. Each exists as .avif and .jpg.
  widths: number[];
  // Uploaded images (Sprint 7): the absolute Blob prefix (or /api/media-dev/
  // locally) the renditions share. Unset: the renditions are /images/<key>-*.
  baseUrl?: string;
}
```

```ts
// "photos/stabilo" + 640 + "avif" → "/images/photos/stabilo-640.avif";
// with a baseUrl → "<baseUrl>-640.avif".
export function renditionUrl(key: string, width: number, format: "avif" | "jpg", baseUrl?: string): string {
  return `${baseUrl ?? `/images/${key}`}-${width}.${format}`;
}

export function srcSet(key: string, entry: ImageEntry, format: "avif" | "jpg"): string {
  return entry.widths.map((w) => `${renditionUrl(key, w, format, entry.baseUrl)} ${w}w`).join(", ");
}
```

  Pass `baseUrl` along at the call sites:
  - in `components/picture-view.tsx`, use `src={renditionUrl(image, entry.width, "jpg", entry.baseUrl)}`;
  - in `lib/work/derive.ts` `resolveImage`, return `entry ? { key, width: entry.width, height: entry.height, widths: entry.widths, ...(entry.baseUrl ? { baseUrl: entry.baseUrl } : {}) } : null`, so the existing `toEqual` assertions without `baseUrl` still hold.

- [ ] **Step 4: Create `lib/images/lookup.ts`.**

```ts
import type { MediaRecord } from "@/lib/content/store";
import type { ImageLookup } from "@/lib/work/derive";
import { findImage } from "./manifest";
import type { ImageEntry } from "./plan";

// The image manifest plus uploaded media (Sprint 7 spec §1.3): an uploaded key
// wins, everything else comes from lib/images/manifest.json.
export interface MediaEntry extends ImageEntry {
  key: string;
  baseUrl: string;
}

export function toMediaEntry(record: Pick<MediaRecord, "key" | "baseUrl" | "width" | "height" | "widths">): MediaEntry {
  return { key: record.key, baseUrl: record.baseUrl, width: record.width, height: record.height, widths: record.widths };
}

export function lookupWith(media: MediaEntry[]): ImageLookup {
  const byKey = new Map(media.map((entry) => [entry.key, entry]));
  return (key) => {
    const entry = byKey.get(key);
    return entry ? { width: entry.width, height: entry.height, widths: entry.widths, baseUrl: entry.baseUrl } : findImage(key);
  };
}

export function hasImageWith(media: MediaEntry[]): (key: string) => boolean {
  const lookup = lookupWith(media);
  return (key) => lookup(key) !== undefined;
}
```

- [ ] **Step 5: Create `lib/content/read.ts`.**

```ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { type MediaEntry, toMediaEntry } from "@/lib/images/lookup";
import { getContentStore } from "./get-store";
import { type SiteContent, publishedValues, repoSite, resolveSite } from "./site";

// The one cache tag for admin-edited content: publish actions call
// updateTag(CONTENT_TAG) so the next request renders the new value.
export const CONTENT_TAG = "content";

export interface PublishedContent {
  site: SiteContent;
  media: MediaEntry[];
}

// The live site: published documents over the repo content, plus uploaded
// media. Cached and tagged, so public pages stay prerendered. Never throws:
// no store or a store error renders the repo content (a database error is
// cached for minutes only, since it is probably transient).
export async function getPublishedContent(): Promise<PublishedContent> {
  "use cache";
  cacheTag(CONTENT_TAG);

  let store;
  try {
    store = getContentStore();
  } catch (e) {
    console.warn("[content] no store:", e instanceof Error ? e.message : e);
    store = null;
  }
  if (!store) {
    cacheLife("days");
    return { site: repoSite(), media: [] };
  }
  try {
    const [docs, media] = await Promise.all([store.listDocs(), store.listMedia()]);
    cacheLife("days");
    return { site: resolveSite(publishedValues(docs)), media: media.map(toMediaEntry) };
  } catch (e) {
    console.warn("[content] reading published content failed:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return { site: repoSite(), media: [] };
  }
}
```

- [ ] **Step 6: Create `lib/work/views.ts`.** These are pure views and safe to import in tests and e2e.

```ts
import type { LabEntry } from "@/content/lab-index";
import type { ProfileCopy } from "@/content/profile";
import type { SiteContent } from "@/lib/content/site";
import { type ImageLookup, type PinView, type ProductPageView, buildPins, buildProductPage } from "./derive";
import { type ExperienceView, resolveExperience } from "./experience";

// Pure views over a resolved site. lib/work/index.ts applies them to the
// published site; the admin preview applies them to drafts.

export function productSlugs(site: SiteContent): string[] {
  return site.pages.map((page) => page.slug);
}

export function productPageView(site: SiteContent, slug: string, lookup: ImageLookup): ProductPageView | null {
  const page = site.pages.find((item) => item.slug === slug);
  return page ? buildProductPage(page, lookup) : null;
}

export function pinViews(site: SiteContent, lookup: ImageLookup): PinView[] {
  return buildPins(site.pages, site.pins, lookup);
}

export function experienceViews(site: SiteContent): ExperienceView[] {
  return resolveExperience(site.experience, site.pages);
}

// Everything the Work home renders that the admin edits.
export interface HomeContent {
  profile: ProfileCopy;
  lab: LabEntry[];
  pins: PinView[];
  experience: ExperienceView[];
}

export function homeContent(site: SiteContent, lookup: ImageLookup): HomeContent {
  return { profile: site.profile, lab: site.lab, pins: pinViews(site, lookup), experience: experienceViews(site) };
}
```

- [ ] **Step 7: Replace `lib/work/index.ts`.**

```ts
import { getPublishedContent } from "@/lib/content/read";
import { repoSite } from "@/lib/content/site";
import { formatIssue } from "@/lib/content/issues";
import { validateSite } from "@/lib/content/validate-site";
import { lookupWith } from "@/lib/images/lookup";
import { hasImage } from "@/lib/images/manifest";
import type { PinView, ProductPageView } from "./derive";
import { type HomeContent, homeContent, pinViews, productPageView, productSlugs } from "./views";

// The server-side read API for the product pages and the Work home: the
// published site (lib/content/read.ts: admin documents over the repo content)
// bound to the image manifest and uploaded media.

// The repo content is the seed and the fallback, so it must stay valid: a
// broken registry fails the build instead of shipping a broken page.
const issues = validateSite(repoSite(), hasImage);
if (issues.length > 0) throw new Error(`content is invalid:\n${issues.map(formatIssue).join("\n")}`);

export async function getProductSlugs(): Promise<string[]> {
  return productSlugs((await getPublishedContent()).site);
}

export async function getProductPage(slug: string): Promise<ProductPageView | null> {
  const { site, media } = await getPublishedContent();
  return productPageView(site, slug, lookupWith(media));
}

export async function getPins(): Promise<PinView[]> {
  const { site, media } = await getPublishedContent();
  return pinViews(site, lookupWith(media));
}

export async function getHomeContent(): Promise<HomeContent> {
  const { site, media } = await getPublishedContent();
  return homeContent(site, lookupWith(media));
}
```

- [ ] **Step 8: Extract the product page body and await the reads.** Create `components/work/product-page-body.tsx`:

```tsx
import type { IconSet } from "@/lib/work/primeicons";
import type { ProductPageView } from "@/lib/work/derive";
import { ProductBlocks } from "./blocks";
import { ProductBrowser } from "./product-browser";
import { ProductHeader } from "./product-header";

// A product page's content, shared by /work/<slug>/ and the admin preview.
export function ProductPageBody({ page, icons }: { page: ProductPageView; icons?: IconSet }) {
  return (
    <main className="pb-16">
      <ProductHeader page={page} />
      <ProductBrowser title={page.title} images={page.images}>
        <ProductBlocks page={page} icons={icons} />
      </ProductBrowser>
    </main>
  );
}
```

  Check the name `IconSet` with `grep -n "export" lib/work/primeicons.ts`. If that module names the icon set type differently, use that name. Then, in `app/(work)/work/[slug]/page.tsx`:
  - `generateStaticParams` becomes `export async function generateStaticParams() { return (await getProductSlugs()).map((slug) => ({ slug })); }`;
  - both `getProductPage(...)` calls get `await`;
  - the OG URL becomes `renditionUrl(first.key, first.width, "jpg", first.baseUrl)`;
  - the default export returns `<ProductPageBody page={page} icons={icons} />`, and the now-unused `ProductBlocks`, `ProductBrowser` and `ProductHeader` imports go.

  In `app/(work)/system/page.tsx`, the pin line becomes `const [pin] = await getPins();`.

- [ ] **Step 9: Feed the home from content.** In `components/home/home-site.tsx`:
  - import `type HomeContent` from `@/lib/work/views` and remove the `labIndex` and `getExperience` / `getPins` imports;
  - the signature becomes `export function HomeSite({ content }: { content: HomeContent })`;
  - replace `const pins = getPins();` with `const { pins } = content;`;
  - the h1 uses `content.profile.lead.strong` / `.rest`;
  - `<Bio paragraphs={content.profile.bio} />`;
  - Lab uses `content.lab` (both the length check and `entries`);
  - Experience uses `entries={content.experience}`;
  - `profile` (name, role, location, available, booking, social) stays imported for the rest.

  `app/(work)/page.tsx` becomes:

```tsx
import { HomeSite } from "@/components/home/home-site";
import { getHomeContent } from "@/lib/work";

export default async function HomePage() {
  return <HomeSite content={await getHomeContent()} />;
}
```

- [ ] **Step 10: Move tests off the async reads.**
  - In `tests/content/work.test.ts`:
    - replace the `getPins, getProductPage, getProductSlugs` import with `import { pinViews, productPageView, productSlugs } from "@/lib/work/views";`, `import { repoSite } from "@/lib/content/site";` and `import { findImage } from "@/lib/images/manifest";`;
    - rewrite each call: `getProductSlugs()` → `productSlugs(repoSite())`, `getProductPage(x)` → `productPageView(repoSite(), x, findImage)`, `getPins()` → `pinViews(repoSite(), findImage)`.
  - In `tests/content/experience.test.ts`, replace `getExperience` with `experienceViews(repoSite())` (imports from `@/lib/work/views` and `@/lib/content/site`).
  - Run `grep -rn "from \"@/lib/work\"" tests e2e e2e-fixtures`. Expected: nothing. Tests never import the async module.

- [ ] **Step 11: Run everything.**
  - Run `npm run typecheck && npm run lint && npm test`. Expected: PASS.
  - Then run `npm run build && npx playwright test e2e/home.spec.ts e2e/work-product.spec.ts e2e/work-viewer.spec.ts e2e/system.spec.ts`. Expected: PASS; the home and the product pages render exactly as before.
  - Confirm the build output still lists `/work/[slug]` with its 15 prerendered paths and `/` as prerendered (●/○ in the route table, not ƒ).

- [ ] **Step 12: Commit.**

```bash
git add lib components app tests
git commit -m "Read product pages and the home through the published content overlay

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: GitHub sign-in and the session

**Files:**
- Modify: `package.json` (add `jose`)
- Create: `lib/auth/names.ts`, `lib/auth/session.ts`, `lib/auth/github.ts`, `lib/auth/cookies.ts`, `lib/auth/admin.ts`, `app/api/auth/signin/route.ts`, `app/api/auth/callback/route.ts`, `app/api/auth/signout/route.ts`, `app/api/auth/test-signin/route.ts`
- Test: `tests/auth/session.test.ts`, `tests/auth/github.test.ts`

**Interfaces:**
- Produces:
  - `lib/auth/names.ts` (client-safe): `SESSION_COOKIE = "admin_session"`, `HINT_COOKIE = "admin_hint"`, `OAUTH_STATE_COOKIE`, `OAUTH_NEXT_COOKIE`;
  - `lib/auth/session.ts`: `SESSION_DAYS = 30`, `signSession(githubId, { secret?, now? }): Promise<string>`, `verifySession(token, { adminId?, secret?, now? }): Promise<boolean>`;
  - `lib/auth/github.ts`: `authorizeUrl(clientId, redirectUri, state)`, `exchangeCode(code, { clientId, clientSecret, redirectUri }, fetchImpl?)`, `fetchGithubUserId(token, fetchImpl?)`, `safeNext(next: string | null | undefined): string`;
  - `lib/auth/cookies.ts`: `setSessionCookies(response, githubId)`, `clearSessionCookies(response)`, `oauthCookieOptions()`;
  - `lib/auth/admin.ts` (server-only): `isAdmin(): Promise<boolean>`, `requireAdminPage(path: string): Promise<void>` (redirects to `/admin/?next=…`).

- [ ] **Step 1: Install jose.** Run `npm install jose@6.2.12 --save-exact`. Expected: `package.json` lists `"jose": "6.2.12"` under `dependencies`.

- [ ] **Step 2: Write the failing tests.** Create `tests/auth/session.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { signSession, verifySession } from "@/lib/auth/session";

const secret = "s".repeat(40);
const other = "o".repeat(40);
const now = new Date("2026-10-04T10:00:00.000Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

describe("session", () => {
  it("accepts a session signed for the admin", async () => {
    const token = await signSession("123", { secret, now });
    expect(await verifySession(token, { adminId: "123", secret, now: days(1) })).toBe(true);
  });

  it("rejects another GitHub user, another secret, an expired token and no token", async () => {
    const token = await signSession("123", { secret, now });
    expect(await verifySession(token, { adminId: "999", secret, now })).toBe(false);
    expect(await verifySession(token, { adminId: "123", secret: other, now })).toBe(false);
    expect(await verifySession(token, { adminId: "123", secret, now: days(31) })).toBe(false);
    expect(await verifySession(undefined, { adminId: "123", secret, now })).toBe(false);
    expect(await verifySession("not.a.jwt", { adminId: "123", secret, now })).toBe(false);
  });

  it("never accepts anything without an admin id or a long enough secret", async () => {
    const token = await signSession("123", { secret, now });
    expect(await verifySession(token, { adminId: "", secret, now })).toBe(false);
    await expect(signSession("123", { secret: "short", now })).rejects.toThrow("AUTH_SECRET");
    expect(await verifySession(token, { adminId: "123", secret: "short", now })).toBe(false);
  });
});
```

  Create `tests/auth/github.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { authorizeUrl, exchangeCode, fetchGithubUserId, safeNext } from "@/lib/auth/github";

describe("GitHub OAuth", () => {
  it("builds the authorize URL with no extra scopes", () => {
    const url = new URL(authorizeUrl("client", "https://onursenture.vercel.app/api/auth/callback/", "abc"));
    expect(url.origin + url.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: "client",
      redirect_uri: "https://onursenture.vercel.app/api/auth/callback/",
      state: "abc",
      scope: "",
      allow_signup: "false",
    });
  });

  it("exchanges the code for a token", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ access_token: "tok" }));
    const token = await exchangeCode("code", { clientId: "id", clientSecret: "secret", redirectUri: "https://x/cb/" }, fetchImpl);
    expect(token).toBe("tok");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://github.com/login/oauth/access_token");
    expect(JSON.parse(String(init.body))).toEqual({ client_id: "id", client_secret: "secret", code: "code", redirect_uri: "https://x/cb/" });
  });

  it("fails when GitHub returns no token", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ error: "bad_verification_code" }));
    await expect(exchangeCode("code", { clientId: "id", clientSecret: "s", redirectUri: "https://x/cb/" }, fetchImpl)).rejects.toThrow("bad_verification_code");
  });

  it("reads the numeric user id as a string", async () => {
    const fetchImpl = vi.fn(async () => Response.json({ id: 12345, login: "onursenture" }));
    expect(await fetchGithubUserId("tok", fetchImpl)).toBe("12345");
  });

  it("only returns to admin paths", () => {
    expect(safeNext("/admin/work/nebuu/")).toBe("/admin/work/nebuu/");
    for (const bad of [null, undefined, "", "/", "https://evil.com/admin/", "//evil.com/admin/", "/admin/\\evil"]) expect(safeNext(bad), String(bad)).toBe("/admin/");
  });
});
```

- [ ] **Step 3: Run them to make sure they fail.** Run `npx vitest run tests/auth`. Expected: FAIL, because the modules don't exist yet.

- [ ] **Step 4: Create the auth modules.** First `lib/auth/names.ts`:

```ts
// Cookie names, safe to import in client components.
export const SESSION_COOKIE = "admin_session";
// Not a credential: tells client code to show the Edit link. Never trusted on the server.
export const HINT_COOKIE = "admin_hint";
export const OAUTH_STATE_COOKIE = "admin_oauth_state";
export const OAUTH_NEXT_COOKIE = "admin_oauth_next";
```

`lib/auth/session.ts`:

```ts
import { SignJWT, jwtVerify } from "jose";

// The admin session (Sprint 7 spec §4.2): an HS256 JWT whose subject is the
// GitHub user id, valid 30 days, signed with AUTH_SECRET.
export const SESSION_DAYS = 30;
const MIN_SECRET = 32;

function key(secret: string | undefined): Uint8Array {
  if (!secret || secret.length < MIN_SECRET) throw new Error(`AUTH_SECRET must be set to at least ${MIN_SECRET} characters`);
  return new TextEncoder().encode(secret);
}

export async function signSession(githubId: string, options: { secret?: string; now?: Date } = {}): Promise<string> {
  const signingKey = key(options.secret ?? process.env.AUTH_SECRET);
  const issuedAt = Math.floor((options.now ?? new Date()).getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(githubId)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_DAYS * 86_400)
    .sign(signingKey);
}

// True only for an unexpired session signed with AUTH_SECRET for ADMIN_GITHUB_ID.
export async function verifySession(
  token: string | undefined,
  options: { adminId?: string; secret?: string; now?: Date } = {},
): Promise<boolean> {
  const adminId = options.adminId ?? process.env.ADMIN_GITHUB_ID;
  if (!token || !adminId) return false;
  try {
    const { payload } = await jwtVerify(token, key(options.secret ?? process.env.AUTH_SECRET), {
      algorithms: ["HS256"],
      currentDate: options.now,
    });
    return payload.sub === adminId;
  } catch {
    return false;
  }
}
```

`lib/auth/github.ts`:

```ts
// GitHub OAuth for a single user (Sprint 7 spec §4.1). No scopes: the public
// profile is enough to read the numeric user id.

type Fetch = typeof globalThis.fetch;

export function authorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, state, scope: "", allow_signup: "false" });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCode(
  code: string,
  app: { clientId: string; clientSecret: string; redirectUri: string },
  fetchImpl: Fetch = fetch,
): Promise<string> {
  const response = await fetchImpl("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: app.clientId, client_secret: app.clientSecret, code, redirect_uri: app.redirectUri }),
  });
  const data = (await response.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`GitHub token exchange failed: ${data.error ?? response.status}`);
  return data.access_token;
}

export async function fetchGithubUserId(token: string, fetchImpl: Fetch = fetch): Promise<string> {
  const response = await fetchImpl("https://api.github.com/user", {
    headers: { accept: "application/vnd.github+json", authorization: `Bearer ${token}`, "user-agent": "onursenture.com-admin" },
  });
  if (!response.ok) throw new Error(`GitHub user lookup failed: ${response.status}`);
  const data = (await response.json()) as { id?: number };
  if (typeof data.id !== "number") throw new Error("GitHub user lookup returned no id");
  return String(data.id);
}

// Where to land after sign-in: only paths under /admin/, never another origin.
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/admin/") && !next.includes("\\") ? next : "/admin/";
}
```

`lib/auth/cookies.ts`:

```ts
import type { NextResponse } from "next/server";
import { HINT_COOKIE, OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE, SESSION_COOKIE } from "./names";
import { SESSION_DAYS, signSession } from "./session";

// Secure everywhere but `next dev`; browsers accept Secure cookies on
// http://localhost, so the e2e's `next start` works too.
const secure = () => process.env.NODE_ENV === "production";

export function oauthCookieOptions() {
  return { httpOnly: true, secure: secure(), sameSite: "lax" as const, path: "/", maxAge: 600 };
}

export async function setSessionCookies(response: NextResponse, githubId: string): Promise<void> {
  const maxAge = SESSION_DAYS * 86_400;
  response.cookies.set(SESSION_COOKIE, await signSession(githubId), { httpOnly: true, secure: secure(), sameSite: "lax", path: "/", maxAge });
  response.cookies.set(HINT_COOKIE, "1", { httpOnly: false, secure: secure(), sameSite: "lax", path: "/", maxAge });
  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_NEXT_COOKIE);
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(HINT_COOKIE);
}
```

`lib/auth/admin.ts`:

```ts
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./names";
import { verifySession } from "./session";

// Every server action, upload route and admin page checks this on the server;
// hiding UI is never the protection. Call it inside a Suspense boundary on pages.
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireAdminPage(path: string): Promise<void> {
  if (!(await isAdmin())) redirect(`/admin/?next=${encodeURIComponent(path)}`);
}
```

- [ ] **Step 5: Create the routes.** First `app/api/auth/signin/route.ts`:

```ts
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { oauthCookieOptions } from "@/lib/auth/cookies";
import { authorizeUrl, safeNext } from "@/lib/auth/github";
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/auth/names";

// GET /api/auth/signin/?next=/admin/… → GitHub's consent screen.
export async function GET(request: Request) {
  const clientId = process.env.AUTH_GITHUB_ID;
  if (!clientId) return new Response("Sign-in is not configured (AUTH_GITHUB_ID).", { status: 503 });
  const url = new URL(request.url);
  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(authorizeUrl(clientId, `${url.origin}/api/auth/callback/`, state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, oauthCookieOptions());
  response.cookies.set(OAUTH_NEXT_COOKIE, safeNext(url.searchParams.get("next")), oauthCookieOptions());
  return response;
}
```

`app/api/auth/callback/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { setSessionCookies } from "@/lib/auth/cookies";
import { exchangeCode, fetchGithubUserId, safeNext } from "@/lib/auth/github";
import { OAUTH_NEXT_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/auth/names";

// GitHub redirects here. Only ADMIN_GITHUB_ID gets a session; anyone else
// sees "Not allowed" and gets no cookie.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected) {
    return new Response("Sign-in failed: the request expired or didn't match. Start again from /admin/.", { status: 400 });
  }
  const clientId = process.env.AUTH_GITHUB_ID;
  const clientSecret = process.env.AUTH_GITHUB_SECRET;
  const adminId = process.env.ADMIN_GITHUB_ID;
  if (!clientId || !clientSecret || !adminId) return new Response("Sign-in is not configured.", { status: 503 });

  let githubId: string;
  try {
    const token = await exchangeCode(code, { clientId, clientSecret, redirectUri: `${url.origin}/api/auth/callback/` });
    githubId = await fetchGithubUserId(token);
  } catch (e) {
    console.warn("[auth]", e instanceof Error ? e.message : e);
    return new Response("Sign-in failed: GitHub didn't answer as expected.", { status: 502 });
  }
  if (githubId !== adminId) return new Response("Not allowed.", { status: 403 });

  const response = NextResponse.redirect(new URL(safeNext(request.cookies.get(OAUTH_NEXT_COOKIE)?.value), url.origin));
  await setSessionCookies(response, githubId);
  return response;
}
```

`app/api/auth/signout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/auth/cookies";

// POST from the admin's Sign out button.
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  clearSessionCookies(response);
  return response;
}
```

`app/api/auth/test-signin/route.ts`:

```ts
import { NextResponse } from "next/server";
import { setSessionCookies } from "@/lib/auth/cookies";
import { safeNext } from "@/lib/auth/github";

// Signs in as ADMIN_GITHUB_ID without GitHub, for the admin e2e and local
// development only: it answers only when ADMIN_E2E=1 and the code is not
// running on Vercel. Everywhere else it is a 404.
export async function GET(request: Request) {
  if (process.env.ADMIN_E2E !== "1" || process.env.VERCEL) return new Response("Not found", { status: 404 });
  const adminId = process.env.ADMIN_GITHUB_ID;
  if (!adminId) return new Response("ADMIN_GITHUB_ID is not set.", { status: 503 });
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), url.origin));
  await setSessionCookies(response, adminId);
  return response;
}
```

- [ ] **Step 6: Run the tests.** Run `npx vitest run tests/auth`. Expected: PASS. Then run `npm run typecheck && npm run lint && npm test && npm run build`. Expected: PASS, and the four `/api/auth/*` routes appear as dynamic (ƒ) in the route table.

- [ ] **Step 7: Commit.**

```bash
git add package.json package-lock.json lib/auth app/api/auth tests/auth
git commit -m "Add GitHub sign-in for the admin with a signed session cookie

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Admin operations and server actions

**Files:**
- Create: `lib/admin/results.ts`, `lib/admin/operations.ts`, `app/admin/actions.ts`
- Test: `tests/admin/operations.test.ts`

**Interfaces:**
- Consumes: `ContentStore`, `FileContentStore` (Task 4); `schemaFor`, keys (Task 2); `publishedValues`, `indexSlugs`, `resolveSite`, `repoValue` (Task 3); `validateSite`, `zodIssues`, `Issue` (Task 3); `hasImageWith`, `CONTENT_TAG` (Task 5); `isAdmin` (Task 6).
- Produces:
  - `OpResult<T>` and `ActionResult<T>` (`lib/admin/results.ts`);
  - from `lib/admin/operations.ts`:
    - `saveDraft(store, key, draft, expected: string | null, now): Promise<OpResult<{ draftUpdatedAt: string }>>`;
    - `publishDoc(store, key, now, hasImage): Promise<OpResult<{ publishedAt: string }>>`;
    - `discardDraft(store, key)`, `resetDoc(store, key)`;
    - `NewPageInput { slug; org; title; kind }`, `newPage(input): ProductPage`, `createPage(store, input, now)`;
    - `deletePage(store, slug, now, hasImage)`;
  - from `app/admin/actions.ts`: `saveDraftAction`, `publishAction`, `discardDraftAction`, `resetDocAction`, `createPageAction`, `deletePageAction`. Every action returns `ActionResult`.

- [ ] **Step 1: Write the failing tests.** Create `tests/admin/operations.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { experience } from "@/content/experience";
import { productPages } from "@/content/work";
import type { ProductPage } from "@/content/work/types";
import { createPage, deletePage, discardDraft, newPage, publishDoc, resetDoc, saveDraft } from "@/lib/admin/operations";
import { FileContentStore } from "@/lib/content/file-store";
import { indexSlugs, publishedValues, resolveSite } from "@/lib/content/site";
import type { ContentStore } from "@/lib/content/store";

const t0 = new Date("2026-10-04T10:00:00.000Z");
const t1 = new Date("2026-10-04T10:01:00.000Z");
const any = () => true;
const nebuu = productPages.find((p) => p.slug === "nebuu")!;

let store: ContentStore;
beforeEach(() => {
  store = new FileContentStore(join(mkdtempSync(join(tmpdir(), "ops-")), "store.json"));
});

const live = async () => resolveSite(publishedValues(await store.listDocs()));

describe("saveDraft", () => {
  it("saves, then refuses a stale expected time", async () => {
    const first = await saveDraft(store, "lab", [], null, t0);
    expect(first).toEqual({ status: "ok", draftUpdatedAt: t0.toISOString() });
    expect(await saveDraft(store, "lab", [], null, t1)).toEqual({ status: "conflict" });
    expect(await saveDraft(store, "lab", [], t0.toISOString(), t1)).toEqual({ status: "ok", draftUpdatedAt: t1.toISOString() });
  });

  it("refuses a draft over 1 MB", async () => {
    const result = await saveDraft(store, "lab", "x".repeat(1_000_001), null, t0);
    expect(result).toMatchObject({ status: "invalid" });
  });
});

describe("publishDoc", () => {
  it("needs a draft", async () => {
    expect(await publishDoc(store, "lab", t0, any)).toEqual({ status: "invalid", issues: [{ doc: "lab", at: "", message: "there is no draft to publish" }] });
  });

  it("reports schema problems with their path", async () => {
    await saveDraft(store, "lab", [{ title: "", description: "x" }], null, t0);
    const result = await publishDoc(store, "lab", t1, any);
    expect(result.status).toBe("invalid");
    expect(result.status === "invalid" && result.issues[0]).toMatchObject({ doc: "lab", at: "0/title" });
  });

  it("publishes an edited page and clears its draft", async () => {
    await saveDraft(store, "work/nebuu", { ...nebuu, intro: "New intro." }, null, t0);
    expect(await publishDoc(store, "work/nebuu", t1, any)).toEqual({ status: "ok", publishedAt: t1.toISOString() });
    expect((await live()).pages.find((p) => p.slug === "nebuu")?.intro).toBe("New intro.");
    expect((await store.getDoc("work/nebuu"))?.draft).toBeNull();
  });

  it("refuses a page that breaks another document", async () => {
    const noYears: ProductPage = { ...nebuu, facts: nebuu.facts.filter((f) => f.label !== "Years") };
    await saveDraft(store, "work/nebuu", noYears, null, t0);
    expect(await publishDoc(store, "work/nebuu", t1, any)).toEqual({
      status: "invalid",
      issues: [{ doc: "work/nebuu", at: "facts", message: "Experience links this page, so it needs a Years fact" }],
    });
    expect((await store.getDoc("work/nebuu"))?.published).toBeNull();
  });

  it("refuses a page whose slug changed", async () => {
    await saveDraft(store, "work/nebuu", { ...nebuu, slug: "nebuu-2" }, null, t0);
    expect(await publishDoc(store, "work/nebuu", t1, any)).toMatchObject({ status: "invalid", issues: [{ at: "slug" }] });
  });
});

describe("createPage", () => {
  it("creates a draft-only page that goes live, last in the index, on its first valid publish", async () => {
    expect(await createPage(store, { slug: "new-thing", org: "orkestra", title: "New Thing", kind: "game" }, t0)).toEqual({ status: "ok", slug: "new-thing" });
    expect(indexSlugs(publishedValues(await store.listDocs()))).not.toContain("new-thing");
    expect((await publishDoc(store, "work/new-thing", t1, any)).status).toBe("invalid");

    const doc = await store.getDoc("work/new-thing");
    const draft = doc!.draft as ProductPage;
    const filled: ProductPage = {
      ...draft,
      intro: "A new thing.",
      facts: draft.facts.map((fact) => (fact.label === "Years" ? { ...fact, value: "2026" } : fact)),
      blocks: [{ kind: "text", id: "what-i-did", heading: "What I did", body: ["Made it."] }],
    };
    await saveDraft(store, "work/new-thing", filled, doc!.draftUpdatedAt!.toISOString(), t1);
    expect((await publishDoc(store, "work/new-thing", t1, any)).status).toBe("ok");
    expect((await live()).pages.at(-1)?.slug).toBe("new-thing");
  });

  it("refuses a taken or malformed slug and a missing title", async () => {
    const result = await createPage(store, { slug: "nebuu", org: "orkestra", title: " ", kind: "" }, t0);
    expect(result).toMatchObject({ status: "invalid" });
    expect(result.status === "invalid" && result.issues.map((i) => i.at)).toEqual(["title", "slug"]);
    expect((await createPage(store, { slug: "Bad Slug", org: "orkestra", title: "X", kind: "" }, t0)).status).toBe("invalid");
  });

  it("starts from the org's role and name and one What I did block", () => {
    const page = newPage({ slug: "x", org: "primetek", title: "X", kind: "kit" });
    expect(page.facts).toEqual([
      { label: "Role", value: experience.find((e) => e.org === "primetek")!.role },
      { label: "Years", value: "" },
      { label: "At", value: "PrimeTek" },
    ]);
    expect(page.lead).toEqual({ strong: "X.", rest: "" });
    expect(page.blocks).toEqual([{ kind: "text", id: "what-i-did", heading: "What I did", body: [""] }]);
  });
});

describe("deletePage", () => {
  it("is blocked while Experience links the page", async () => {
    const result = await deletePage(store, "nebuu", t0, any);
    expect(result).toMatchObject({ status: "invalid", issues: [{ doc: "experience" }] });
  });

  it("removes an unlinked page from the index and drops its row", async () => {
    const withoutNebuu = experience.map((entry) => ({ ...entry, children: entry.children.filter((c) => c.href !== "/work/nebuu/") }));
    await saveDraft(store, "experience", withoutNebuu, null, t0);
    await publishDoc(store, "experience", t0, any);
    await saveDraft(store, "work/nebuu", nebuu, null, t0);
    expect(await deletePage(store, "nebuu", t1, any)).toEqual({ status: "ok" });
    expect((await live()).pages.map((p) => p.slug)).not.toContain("nebuu");
    expect(await store.getDoc("work/nebuu")).toBeNull();
  });

  it("drops a page that was never published", async () => {
    await createPage(store, { slug: "draft-only", org: "orkestra", title: "Draft", kind: "" }, t0);
    expect(await deletePage(store, "draft-only", t1, any)).toEqual({ status: "ok" });
    expect(await store.getDoc("work/draft-only")).toBeNull();
  });
});

describe("discardDraft and resetDoc", () => {
  it("discards the draft and keeps the published value", async () => {
    await saveDraft(store, "lab", [{ title: "A", description: "B" }], null, t0);
    await publishDoc(store, "lab", t0, any);
    await saveDraft(store, "lab", [], null, t1);
    expect(await discardDraft(store, "lab")).toEqual({ status: "ok" });
    expect(await store.getDoc("lab")).toMatchObject({ draft: null, published: [{ title: "A", description: "B" }] });
  });

  it("resets a document to the repo, but not a page that only exists in the admin", async () => {
    await saveDraft(store, "work/nebuu", nebuu, null, t0);
    await publishDoc(store, "work/nebuu", t0, any);
    expect(await resetDoc(store, "work/nebuu")).toEqual({ status: "ok" });
    expect(await store.getDoc("work/nebuu")).toBeNull();
    await createPage(store, { slug: "admin-only", org: "orkestra", title: "A", kind: "" }, t0);
    expect((await resetDoc(store, "work/admin-only")).status).toBe("invalid");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails.** Run `npx vitest run tests/admin/operations.test.ts`. Expected: FAIL, because `@/lib/admin/operations` doesn't exist yet.

- [ ] **Step 3: Create `lib/admin/results.ts`.**

```ts
import type { Issue } from "@/lib/content/issues";

// What admin operations return. Plain data (ISO strings, no Dates), so server
// actions can hand it to client components unchanged.
export type OpResult<T extends object = object> = ({ status: "ok" } & T) | { status: "conflict" } | { status: "invalid"; issues: Issue[] };

// A server action adds the two outcomes that only exist at the request level.
export type ActionResult<T extends object = object> = OpResult<T> | { status: "unauthorized" } | { status: "unavailable" };
```

- [ ] **Step 4: Create `lib/admin/operations.ts`.**

```ts
import { experience as repoExperience } from "@/content/experience";
import { ORGS, type OrgId } from "@/content/orgs";
import type { ProductPage } from "@/content/work/types";
import type { Issue } from "@/lib/content/issues";
import { type DocKey, KEBAB, slugOfKey, workKey } from "@/lib/content/keys";
import { schemaFor } from "@/lib/content/schemas";
import { indexSlugs, publishedValues, repoValue, resolveSite } from "@/lib/content/site";
import type { ContentStore } from "@/lib/content/store";
import { validateSite, zodIssues } from "@/lib/content/validate-site";
import type { OpResult } from "./results";

// The admin's writes (Sprint 7 spec §1.4), independent of Next so they can be
// tested against FileContentStore. app/admin/actions.ts wraps them with the
// session check, the store and cache invalidation.

const MAX_DRAFT_CHARS = 1_000_000;

function invalid(issues: Issue[]) {
  return { status: "invalid" as const, issues };
}

// Autosave. No content validation: a half-finished edit is never lost.
export async function saveDraft(
  store: ContentStore,
  key: DocKey,
  draft: unknown,
  expected: string | null,
  now: Date,
): Promise<OpResult<{ draftUpdatedAt: string }>> {
  if (JSON.stringify(draft ?? null).length > MAX_DRAFT_CHARS) return invalid([{ doc: key, at: "", message: "the draft is larger than 1 MB" }]);
  const result = await store.saveDraft(key, draft, expected ? new Date(expected) : null, now);
  return result.ok ? { status: "ok", draftUpdatedAt: result.draftUpdatedAt.toISOString() } : { status: "conflict" };
}

// Validates the would-be site (this draft over every published document over
// the repo) and only then makes the draft live. A page that isn't listed yet
// is appended to work-index in the same step.
export async function publishDoc(
  store: ContentStore,
  key: DocKey,
  now: Date,
  hasImage: (key: string) => boolean,
): Promise<OpResult<{ publishedAt: string }>> {
  const docs = await store.listDocs();
  const doc = docs.find((item) => item.key === key);
  if (doc?.draft == null) return invalid([{ doc: key, at: "", message: "there is no draft to publish" }]);
  const parsed = schemaFor(key).safeParse(doc.draft);
  if (!parsed.success) return invalid(zodIssues(key, parsed.error));

  const values = publishedValues(docs);
  values.set(key, parsed.data);
  const slug = slugOfKey(key);
  let index: string[] | null = null;
  if (slug !== null) {
    if ((parsed.data as ProductPage).slug !== slug) return invalid([{ doc: key, at: "slug", message: `the page's slug must stay "${slug}"` }]);
    const current = indexSlugs(values);
    if (!current.includes(slug)) {
      index = [...current, slug];
      values.set("work-index", { slugs: index });
    }
  }

  const issues = validateSite(resolveSite(values), hasImage);
  if (issues.length > 0) return invalid(issues);
  await store.publish(key, parsed.data, now);
  if (index) await store.publish("work-index", { slugs: index }, now);
  return { status: "ok", publishedAt: now.toISOString() };
}

export async function discardDraft(store: ContentStore, key: DocKey): Promise<OpResult> {
  await store.discardDraft(key);
  return { status: "ok" };
}

// Back to the repo version: the row goes. A page created in the admin has no
// repo version, so it is deleted instead (deletePage).
export async function resetDoc(store: ContentStore, key: DocKey): Promise<OpResult> {
  if (slugOfKey(key) !== null && repoValue(key) === null) {
    return invalid([{ doc: key, at: "", message: "this page only exists in the admin; delete it instead" }]);
  }
  await store.deleteDoc(key);
  return { status: "ok" };
}

export interface NewPageInput {
  slug: string;
  org: OrgId;
  title: string;
  kind: string;
}

// The starting point of a new page: the header with Role and At from the org,
// an empty Years, and one empty What I did block.
export function newPage(input: NewPageInput): ProductPage {
  const title = input.title.trim();
  return {
    slug: input.slug,
    org: input.org,
    title,
    kind: input.kind.trim(),
    lead: { strong: `${title}.`, rest: "" },
    intro: "",
    facts: [
      { label: "Role", value: repoExperience.find((entry) => entry.org === input.org)?.role ?? "" },
      { label: "Years", value: "" },
      { label: "At", value: ORGS[input.org].name },
    ],
    blocks: [{ kind: "text", id: "what-i-did", heading: "What I did", body: [""] }],
  };
}

export async function createPage(store: ContentStore, input: NewPageInput, now: Date): Promise<OpResult<{ slug: string }>> {
  const key = workKey(input.slug);
  const issues: Issue[] = [];
  if (!(input.org in ORGS)) issues.push({ doc: key, at: "org", message: "pick an organisation" });
  if (!input.title.trim()) issues.push({ doc: key, at: "title", message: "a page needs a title" });
  if (!KEBAB.test(input.slug)) {
    issues.push({ doc: key, at: "slug", message: "use lowercase letters, digits and hyphens" });
  } else {
    const docs = await store.listDocs();
    const taken = new Set([
      ...indexSlugs(publishedValues(docs)),
      ...docs.map((doc) => slugOfKey(doc.key)).filter((slug): slug is string => slug !== null),
    ]);
    if (taken.has(input.slug) || repoValue(key) !== null) issues.push({ doc: key, at: "slug", message: `"${input.slug}" is taken` });
  }
  if (issues.length > 0) return invalid(issues);
  const result = await store.saveDraft(key, newPage(input), null, now);
  return result.ok ? { status: "ok", slug: input.slug } : { status: "conflict" };
}

// Removes a page from the live site in one validated step: work-index loses the
// slug and the page's row goes. Blocked while Experience links the page.
export async function deletePage(
  store: ContentStore,
  slug: string,
  now: Date,
  hasImage: (key: string) => boolean,
): Promise<OpResult> {
  const key = workKey(slug);
  const docs = await store.listDocs();
  const values = publishedValues(docs);
  const current = indexSlugs(values);
  if (!current.includes(slug)) {
    await store.deleteDoc(key);
    return { status: "ok" };
  }
  const index = current.filter((item) => item !== slug);
  values.set("work-index", { slugs: index });
  values.delete(key);
  const issues = validateSite(resolveSite(values), hasImage);
  if (issues.length > 0) return invalid(issues);
  await store.publish("work-index", { slugs: index }, now);
  await store.deleteDoc(key);
  return { status: "ok" };
}
```

  In `createPage`, the issue order (org, title, slug) matches the test's `["title", "slug"]` expectation because the org is valid there.

- [ ] **Step 5: Create `app/admin/actions.ts`.**

```ts
"use server";

import { updateTag } from "next/cache";
import { type NewPageInput, createPage, deletePage, discardDraft, publishDoc, resetDoc, saveDraft } from "@/lib/admin/operations";
import type { ActionResult } from "@/lib/admin/results";
import { isAdmin } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { type DocKey, isDocKey } from "@/lib/content/keys";
import { CONTENT_TAG } from "@/lib/content/read";
import type { ContentStore } from "@/lib/content/store";
import { hasImageWith, toMediaEntry } from "@/lib/images/lookup";

// Server actions for the admin UI. Each checks the session first, then the
// store; a store error reads as "unavailable" so the editor can say so.

type Context = { store: ContentStore } | { error: ActionResult<never> };

async function context(): Promise<Context> {
  if (!(await isAdmin())) return { error: { status: "unauthorized" } };
  try {
    const store = getContentStore();
    return store ? { store } : { error: { status: "unavailable" } };
  } catch {
    return { error: { status: "unavailable" } };
  }
}

function badKey(key: string): ActionResult<never> {
  return { status: "invalid", issues: [{ doc: "work-index", at: "", message: `unknown document "${key}"` }] };
}

async function run<T extends object>(work: (store: ContentStore) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const ctx = await context();
  if ("error" in ctx) return ctx.error;
  try {
    return await work(ctx.store);
  } catch (e) {
    console.warn("[admin]", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  }
}

async function hasImageIn(store: ContentStore) {
  return hasImageWith((await store.listMedia()).map(toMediaEntry));
}

export async function saveDraftAction(key: string, draft: unknown, expected: string | null): Promise<ActionResult<{ draftUpdatedAt: string }>> {
  if (!isDocKey(key)) return badKey(key);
  return run((store) => saveDraft(store, key, draft, expected, new Date()));
}

export async function publishAction(key: string): Promise<ActionResult<{ publishedAt: string }>> {
  if (!isDocKey(key)) return badKey(key);
  return run(async (store) => {
    const result = await publishDoc(store, key as DocKey, new Date(), await hasImageIn(store));
    if (result.status === "ok") updateTag(CONTENT_TAG);
    return result;
  });
}

export async function discardDraftAction(key: string): Promise<ActionResult> {
  if (!isDocKey(key)) return badKey(key);
  return run((store) => discardDraft(store, key));
}

export async function resetDocAction(key: string): Promise<ActionResult> {
  if (!isDocKey(key)) return badKey(key);
  return run(async (store) => {
    const result = await resetDoc(store, key);
    if (result.status === "ok") updateTag(CONTENT_TAG);
    return result;
  });
}

export async function createPageAction(input: NewPageInput): Promise<ActionResult<{ slug: string }>> {
  return run((store) => createPage(store, input, new Date()));
}

export async function deletePageAction(slug: string): Promise<ActionResult> {
  return run(async (store) => {
    const result = await deletePage(store, slug, new Date(), await hasImageIn(store));
    if (result.status === "ok") updateTag(CONTENT_TAG);
    return result;
  });
}
```

  `ActionResult<never>` must be assignable to every `ActionResult<T>` for the shared `error` branch to type-check. If TypeScript disagrees, widen `context()` to return `{ error: { status: "unauthorized" } | { status: "unavailable" } }`, and return that directly.

- [ ] **Step 6: Run the tests.** Run `npx vitest run tests/admin`. Expected: PASS. Then run `npm run typecheck && npm run lint && npm test`. Expected: PASS.

- [ ] **Step 7: Commit.**

```bash
git add lib/admin app/admin/actions.ts tests/admin
git commit -m "Add draft, publish, create and delete operations behind admin server actions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Admin shell, sign-in and admin home

**Files:**
- Create:
  - `app/admin/layout.tsx`, `app/admin/(console)/layout.tsx`, `app/admin/(console)/page.tsx`;
  - `components/admin/admin-shell.tsx`, `components/admin/admin-loading.tsx`, `components/admin/sign-in.tsx`, `components/admin/admin-home.tsx`, `components/admin/doc-state.tsx`, `components/admin/sources-panel.tsx`;
  - `lib/admin/overview.ts`, `lib/admin/sources.ts`;
  - `app/robots.ts`, `e2e/admin.spec.ts`, `tests/admin/overview.test.ts`
- Modify: `app/admin/actions.ts` (add `syncNowAction`)

**Interfaces:**
- Consumes: `isAdmin` (Task 6); `getContentStore`, `ContentDoc` (Task 4); `resolvePage`, `draftValues`, `publishedValues`, `indexSlugs` (Task 3); `syncAll`, `DrizzleSnapshotStore`, `sources`, `sourceTag` (existing).
- Produces:
  - `DocState = "repo" | "published" | "draft" | "new"`;
  - `DocRow { key: DocKey; title: string; editHref: string; state: DocState; publishedAt: string | null }`;
  - `docRows(docs: ContentDoc[]): { pages: DocRow[]; home: DocRow[] }`;
  - `SourceRow`, `readSourceRows(): Promise<SourceRow[] | null>`;
  - `syncNowAction()`;
  - `AdminLoading`, `AdminShell`.

- [ ] **Step 1: Write the failing tests.** Create `tests/admin/overview.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { productPages } from "@/content/work";
import { docRows } from "@/lib/admin/overview";
import type { ContentDoc } from "@/lib/content/store";

const at = new Date("2026-10-04T10:00:00.000Z");
const doc = (key: string, draft: unknown, published: unknown): ContentDoc =>
  ({ key, draft, published, draftUpdatedAt: draft ? at : null, publishedAt: published ? at : null }) as ContentDoc;
const nebuu = productPages.find((p) => p.slug === "nebuu")!;

describe("docRows", () => {
  it("lists every page in registry order as repo when nothing is stored", () => {
    const { pages, home } = docRows([]);
    expect(pages.map((row) => row.title)).toEqual(productPages.map((p) => p.title));
    expect(pages.every((row) => row.state === "repo")).toBe(true);
    expect(pages[0]).toEqual({ key: "work/primeone", title: "PrimeOne", editHref: "/admin/work/primeone/", state: "repo", publishedAt: null });
    expect(home.map((row) => [row.title, row.editHref])).toEqual([
      ["Bio", "/admin/bio/"],
      ["Lab", "/admin/lab/"],
      ["Experience", "/admin/experience/"],
    ]);
  });

  it("marks drafts, published documents and new pages, titled from the draft", () => {
    const { pages, home } = docRows([
      doc("work/nebuu", { ...nebuu, title: "Nebuu 2" }, null),
      doc("work/gonna", null, productPages.find((p) => p.slug === "gonna")),
      doc("work/brand-new", { ...nebuu, slug: "brand-new", title: "Brand New" }, null),
      doc("lab", [], null),
    ]);
    expect(pages.find((row) => row.key === "work/nebuu")).toMatchObject({ title: "Nebuu 2", state: "draft" });
    expect(pages.find((row) => row.key === "work/gonna")).toMatchObject({ state: "published", publishedAt: at.toISOString() });
    expect(pages.at(-1)).toMatchObject({ key: "work/brand-new", title: "Brand New", state: "new" });
    expect(home.find((row) => row.key === "lab")?.state).toBe("draft");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails.** Run `npx vitest run tests/admin/overview.test.ts`. Expected: FAIL, because `@/lib/admin/overview` doesn't exist yet.

- [ ] **Step 3: Create `lib/admin/overview.ts`.**

```ts
import type { DocKey } from "@/lib/content/keys";
import { slugOfKey, workKey } from "@/lib/content/keys";
import { draftValues, indexSlugs, publishedValues, resolvePage } from "@/lib/content/site";
import type { ContentDoc } from "@/lib/content/store";

// The admin home's document list (spec §2.2): what exists and which documents
// have an unpublished draft.

export type DocState = "repo" | "published" | "draft" | "new";

export interface DocRow {
  key: DocKey;
  title: string;
  editHref: string;
  state: DocState;
  publishedAt: string | null;
}

function state(doc: ContentDoc | undefined): DocState {
  if (doc?.draft != null) return "draft";
  return doc?.published != null ? "published" : "repo";
}

export function docRows(docs: ContentDoc[]): { pages: DocRow[]; home: DocRow[] } {
  const byKey = new Map(docs.map((doc) => [doc.key as string, doc]));
  const live = indexSlugs(publishedValues(docs));
  const drafts = draftValues(docs);
  const row = (key: DocKey, title: string, editHref: string, override?: DocState): DocRow => {
    const doc = byKey.get(key);
    return { key, title, editHref, state: override ?? state(doc), publishedAt: doc?.publishedAt?.toISOString() ?? null };
  };

  const pages = live.map((slug) => row(workKey(slug), resolvePage(drafts, slug)?.title ?? slug, `/admin/work/${slug}/`));
  for (const doc of docs) {
    const slug = slugOfKey(doc.key);
    if (slug === null || live.includes(slug)) continue;
    pages.push(row(doc.key, resolvePage(drafts, slug)?.title ?? slug, `/admin/work/${slug}/`, "new"));
  }

  const home = [row("profile", "Bio", "/admin/bio/"), row("lab", "Lab", "/admin/lab/"), row("experience", "Experience", "/admin/experience/")];
  return { pages, home };
}
```


- [ ] **Step 4: Create `lib/admin/sources.ts`.**

```ts
import "server-only";
import { getDb } from "@/lib/db/client";
import { SOURCE_IDS, SOURCE_LABELS, type SourceId } from "@/lib/sources/types";
import { DrizzleSnapshotStore } from "@/lib/sync/drizzle-store";

// Source health for the admin home (spec §2.2), read uncached so it is always
// current. null when there is no database or it can't be read.
export interface SourceRow {
  id: SourceId;
  label: string;
  lastSuccessAt: string | null;
  lastError: string | null;
  itemCount: number;
}

export async function readSourceRows(): Promise<SourceRow[] | null> {
  const db = getDb();
  if (!db) return null;
  const store = new DrizzleSnapshotStore(db);
  try {
    return await Promise.all(
      SOURCE_IDS.map(async (id) => {
        const snapshot = await store.get(id);
        return {
          id,
          label: SOURCE_LABELS[id],
          lastSuccessAt: snapshot?.lastSuccessAt?.toISOString() ?? null,
          lastError: snapshot?.lastError ?? null,
          itemCount: snapshot?.itemCount ?? 0,
        };
      }),
    );
  } catch (e) {
    console.warn("[admin] reading sources failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
```

- [ ] **Step 5: Add `syncNowAction`.** Append to `app/admin/actions.ts`, with these imports added at the top:
  - `import { revalidateTag } from "next/cache";` (merge it into the existing `next/cache` import);
  - `import { getDb } from "@/lib/db/client";`;
  - `import { sources } from "@/lib/sources/registry";`;
  - `import { sourceTag } from "@/lib/sources/tags";`;
  - `import { DrizzleSnapshotStore } from "@/lib/sync/drizzle-store";`;
  - `import { type SyncResult, syncAll } from "@/lib/sync/run";`.

```ts
// "Sync now" on the admin home: every source, regardless of schedule, then the
// same stale-while-revalidate as the sync route.
export async function syncNowAction(): Promise<ActionResult<{ results: SyncResult[] }>> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const db = getDb();
  if (!db) return { status: "unavailable" };
  const results = await syncAll(Object.values(sources), new DrizzleSnapshotStore(db), { fetch: globalThis.fetch, env: process.env }, new Date(), {
    force: true,
  });
  for (const result of results) if (result.status === "ok") revalidateTag(sourceTag(result.source), "max");
  return { status: "ok", results };
}
```

- [ ] **Step 6: Create the layouts, the shell and the small components.** First `app/admin/layout.tsx`:

```tsx
import type { Metadata } from "next";

// Everything under /admin/ is private: never indexed (also disallowed in robots).
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
```

`app/admin/(console)/layout.tsx`:

```tsx
import { AdminShell } from "@/components/admin/admin-shell";

export default function ConsoleLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
```

`components/admin/admin-shell.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

// The admin chrome: one hairline bar with the way home and Sign out. Light,
// on the site tokens; editors fill the rest of the viewport.
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-line px-4 type-meta">
        <Link href="/admin/" className="type-body text-fg">
          Admin
        </Link>
        <div className="flex items-center gap-4">
          <a href="/" className="text-fg-muted hover:text-fg">
            Site →
          </a>
          <form action="/api/auth/signout/" method="post">
            <button type="submit" className="text-fg-muted hover:text-fg">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
```

`components/admin/admin-loading.tsx`:

```tsx
export function AdminLoading() {
  return <p className="px-4 py-8 type-meta text-fg-muted">Loading…</p>;
}
```

`components/admin/sign-in.tsx`:

```tsx
import { buttonClass } from "@/components/ui/button";

// Shown at /admin/ when signed out. A plain <a>: the sign-in route redirects
// to GitHub, so it must not be prefetched.
export function SignIn({ next }: { next: string }) {
  return (
    <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 py-16">
      <h1 className="type-lead">Admin</h1>
      <p className="type-body text-fg-soft">Sign in with the site owner&apos;s GitHub account.</p>
      <p>
        <a href={`/api/auth/signin/?next=${encodeURIComponent(next)}`} className={buttonClass("primary")}>
          Sign in with GitHub
        </a>
      </p>
    </main>
  );
}
```

`components/admin/doc-state.tsx`:

```tsx
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import type { DocRow } from "@/lib/admin/overview";

// ○ repo · ● published 2h ago · ◐ draft · ◐ new · not live
export function DocState({ row }: { row: Pick<DocRow, "state" | "publishedAt"> }) {
  switch (row.state) {
    case "draft":
      return (
        <span>
          <StatusGlyph status="late" /> draft
        </span>
      );
    case "new":
      return (
        <span>
          <StatusGlyph status="late" /> new · not live
        </span>
      );
    case "published":
      return (
        <span>
          <StatusGlyph status="ok" /> published{row.publishedAt ? <> <RelativeTime iso={row.publishedAt} /></> : null}
        </span>
      );
    default:
      return (
        <span>
          <StatusGlyph status="empty" /> repo
        </span>
      );
  }
}
```

`components/admin/sources-panel.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncNowAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import type { SourceRow } from "@/lib/admin/sources";

export function SourcesPanel({ rows }: { rows: SourceRow[] | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!rows) return <p className="type-meta text-fg-muted">Database unavailable.</p>;

  function sync() {
    setMessage(null);
    start(async () => {
      const result = await syncNowAction();
      if (result.status === "ok") {
        const failed = result.results.filter((r) => r.status === "error").length;
        setMessage(failed ? `${failed} source${failed > 1 ? "s" : ""} failed` : "All sources synced");
        router.refresh();
      } else setMessage(result.status === "unauthorized" ? "Signed out — sign in again" : "Database unavailable");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="type-meta">
        {rows.map((row) => (
          <li key={row.id} className="grid grid-cols-[120px_1fr_auto] gap-x-4 border-t border-line py-1.5">
            <span className="text-fg">{row.label}</span>
            <span className="truncate text-fg-muted">
              {row.lastError ? (
                <span className="text-danger">
                  <StatusGlyph status="error" /> {row.lastError}
                </span>
              ) : row.lastSuccessAt ? (
                <>
                  <StatusGlyph status="ok" /> <RelativeTime iso={row.lastSuccessAt} />
                </>
              ) : (
                <>
                  <StatusGlyph status="empty" /> never synced
                </>
              )}
            </span>
            <span className="text-right tabular-nums text-fg-muted">{row.itemCount}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <Button onClick={sync} disabled={pending}>
          {pending ? "Syncing…" : "Sync now"}
        </Button>
        {message ? (
          <p role="status" className="type-meta text-fg-muted">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
```

`components/admin/admin-home.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import { docRows } from "@/lib/admin/overview";
import { readSourceRows } from "@/lib/admin/sources";
import { getContentStore } from "@/lib/content/get-store";
import type { ContentDoc } from "@/lib/content/store";
import { DocState } from "./doc-state";
import { SourcesPanel } from "./sources-panel";

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="type-body text-fg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

async function loadDocs(): Promise<ContentDoc[] | null> {
  try {
    const store = getContentStore();
    return store ? await store.listDocs() : null;
  } catch {
    return null;
  }
}

// The admin home (spec §2.2). Selected work is added in Task 14.
export async function AdminHome() {
  const [docs, sources] = await Promise.all([loadDocs(), readSourceRows()]);
  const { pages, home } = docRows(docs ?? []);
  const list = (rows: typeof pages) => (
    <ul className="type-body">
      {rows.map((row) => (
        <li key={row.key} className="flex items-baseline justify-between gap-4 border-t border-line py-1.5">
          <Link href={row.editHref} className="text-accent hover:underline">
            {row.title}
          </Link>
          <span className="type-meta text-fg-muted">
            <DocState row={row} />
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 py-8">
      {docs === null ? (
        <p role="alert" className="bg-danger-bg px-3 py-2 type-meta text-danger">
          Database unavailable: editing is off. Public pages show the repo content.
        </p>
      ) : null}
      <Section
        title="Pages"
        action={
          <Link href="/admin/work/new/" className={buttonClass("ghost")}>
            New page
          </Link>
        }
      >
        {list(pages)}
      </Section>
      <Section title="Home">{list(home)}</Section>
      <Section title="Sources">
        <SourcesPanel rows={sources} />
      </Section>
    </main>
  );
}
```

`app/admin/(console)/page.tsx`:

```tsx
import { Suspense } from "react";
import { AdminHome } from "@/components/admin/admin-home";
import { AdminLoading } from "@/components/admin/admin-loading";
import { SignIn } from "@/components/admin/sign-in";
import { isAdmin } from "@/lib/auth/admin";
import { safeNext } from "@/lib/auth/github";

// "Sync now" runs every source in one server action.
export const maxDuration = 60;

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Gate({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  if (!(await isAdmin())) {
    const { next } = await searchParams;
    return <SignIn next={safeNext(typeof next === "string" ? next : null)} />;
  }
  return <AdminHome />;
}
```

`app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: ["/admin/", "/api/"] } };
}
```

- [ ] **Step 7: Write the signed-out e2e.** Create `e2e/admin.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("/admin/ asks a signed-out visitor to sign in with GitHub and is never indexed", async ({ page }) => {
  await page.goto("/admin/");
  const signIn = page.getByRole("link", { name: "Sign in with GitHub" });
  await expect(signIn).toHaveAttribute("href", "/api/auth/signin/?next=%2Fadmin%2F");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { name: "Pages" })).toHaveCount(0);
});

test("robots.txt keeps crawlers out of the admin and the API", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("Disallow: /admin/");
  expect(body).toContain("Disallow: /api/");
});

test("the test sign-in route doesn't exist outside the admin e2e", async ({ request }) => {
  expect((await request.get("/api/auth/test-signin/", { maxRedirects: 0 })).status()).toBe(404);
});

test("sign-in goes to GitHub, or says it isn't configured", async ({ request }) => {
  const response = await request.get("/api/auth/signin/", { maxRedirects: 0 });
  expect([307, 503]).toContain(response.status());
  if (response.status() === 307) expect(response.headers().location).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
});
```

  Server actions can't be called directly from Playwright; Task 7's unit tests and Task 15's flow cover their session check.

- [ ] **Step 8: Run everything.** Run `npm run typecheck && npm run lint && npm test && npm run build && npx playwright test e2e/admin.spec.ts`. Expected: PASS. In the build's route table, `/admin` must show as partially prerendered or dynamic, never failing with a "blocking route" error. If it fails, the session read is outside `<Suspense>`.

- [ ] **Step 9: Visual check.** Run `npm run screenshots -- .shots/admin /admin/`.
  - Look at the 1440 and 390 shots: Admin bar, centred title, the primary "Sign in with GitHub" button, no horizontal scroll.
  - Then, signed in locally (`ADMIN_E2E=1 ADMIN_GITHUB_ID=1 AUTH_SECRET=<32+ chars> CONTENT_STORE_FILE=.content-dev.json npm run dev`, visit `/api/auth/test-signin/`), look at `/admin/`: Pages list with `○ repo` states, Home list, Sources ("Database unavailable." without a DB), New page button.
  - Delete `.shots/` afterwards.

- [ ] **Step 10: Commit.**

```bash
git add app/admin app/robots.ts components/admin lib/admin e2e/admin.spec.ts tests/admin
git commit -m "Add the admin shell, GitHub sign-in page and the admin home with source health

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Draft previews and the Edit link

**Files:**
- Create:
  - `lib/content/preview.ts`;
  - `app/admin/preview/layout.tsx`, `app/admin/preview/work/[slug]/page.tsx`, `app/admin/preview/home/page.tsx`;
  - `components/admin/preview-focus.tsx`;
  - `components/shell/edit-link.tsx`;
  - `tests/ui/edit-link.test.ts`
- Modify: `components/shell/site-footer.tsx`, `app/globals.css`, `e2e/admin.spec.ts`

**Interfaces:**
- Consumes: `draftValues`, `resolvePage`, `resolveSite` (Task 3); `ContentStore` (Task 4); `lookupWith`, `toMediaEntry`, `homeContent`, `ProductPageBody`, `HomeSite` (Task 5); `requireAdminPage` (Task 6); `HINT_COOKIE` (Task 6).
- Produces:
  - `draftPageView(store: ContentStore | null, slug): Promise<ProductPageView | null>`;
  - `draftHomeContent(store): Promise<HomeContent>`;
  - the preview routes `/admin/preview/work/<slug>/` and `/admin/preview/home/`;
  - `PreviewFocus`. Its message protocol is `{ type: "preview-focus", id: string | null }` from the parent and `{ type: "preview-ready" }` from the iframe;
  - `editHref(pathname): string`, `EditLink`.

- [ ] **Step 1: Write the failing test.** Create `tests/ui/edit-link.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { editHref } from "@/components/shell/edit-link";

describe("editHref", () => {
  it("opens a product page's editor, and the admin home from anywhere else", () => {
    expect(editHref("/work/nebuu/")).toBe("/admin/work/nebuu/");
    expect(editHref("/")).toBe("/admin/");
    expect(editHref("/life/")).toBe("/admin/");
    expect(editHref("/work/nebuu/extra/")).toBe("/admin/");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails.** Run `npx vitest run tests/ui/edit-link.test.ts`. Expected: FAIL, because the module doesn't exist yet.

- [ ] **Step 3: Create `components/shell/edit-link.tsx`.**

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { HINT_COOKIE } from "@/lib/auth/names";

// The editor for the page you're on: a product page's editor, else the admin home.
export function editHref(pathname: string): string {
  const match = /^\/work\/([a-z0-9-]+)\/$/.exec(pathname);
  return match ? `/admin/work/${match[1]}/` : "/admin/";
}

const subscribe = () => () => {};
const hinted = () => document.cookie.split("; ").includes(`${HINT_COOKIE}=1`);

// A small footer link shown only after sign-in (the admin_hint cookie). It
// grants nothing: the editor checks the real session. The server render and a
// signed-out visitor get nothing, so public pages stay static.
export function EditLink() {
  const pathname = usePathname();
  const signedIn = useSyncExternalStore(subscribe, hinted, () => false);
  if (!signedIn || pathname.startsWith("/admin/")) return null;
  return (
    <span className="flex gap-2 whitespace-nowrap">
      <a href={editHref(pathname)} className="hover:text-fg hover:underline">
        Edit
      </a>
      <span aria-hidden="true">·</span>
    </span>
  );
}
```

  In `components/shell/site-footer.tsx`, import `EditLink` and render `<EditLink />` as the first child of the second `<p>`, before the `© {year}` span.

- [ ] **Step 4: Create `lib/content/preview.ts`.**

```ts
import "server-only";
import { type MediaEntry, lookupWith, toMediaEntry } from "@/lib/images/lookup";
import { buildProductPage, type ProductPageView } from "@/lib/work/derive";
import { type HomeContent, homeContent } from "@/lib/work/views";
import { type DocValues, draftValues, resolvePage, resolveSite } from "./site";
import type { ContentStore } from "./store";

// What the admin preview renders: every document's draft over its published
// value over the repo. Uncached; only signed-in requests reach it.

async function drafts(store: ContentStore | null): Promise<{ values: DocValues; media: MediaEntry[] }> {
  if (!store) return { values: new Map(), media: [] };
  const [docs, media] = await Promise.all([store.listDocs(), store.listMedia()]);
  return { values: draftValues(docs), media: media.map(toMediaEntry) };
}

// One page's draft, also when it isn't listed yet (a new page).
export async function draftPageView(store: ContentStore | null, slug: string): Promise<ProductPageView | null> {
  const { values, media } = await drafts(store);
  const page = resolvePage(values, slug);
  return page ? buildProductPage(page, lookupWith(media)) : null;
}

export async function draftHomeContent(store: ContentStore | null): Promise<HomeContent> {
  const { values, media } = await drafts(store);
  return homeContent(resolveSite(values), lookupWith(media));
}
```

- [ ] **Step 5: Create the preview focus listener.** First `components/admin/preview-focus.tsx`:

```tsx
"use client";

import { useEffect } from "react";

// Runs inside the preview iframe. The editor posts { type: "preview-focus", id }
// (same origin only); the matching row (every block row's id is its block id)
// scrolls to the top and gets an accent outline.
export function PreviewFocus() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; id?: string | null };
      if (data?.type !== "preview-focus") return;
      current?.removeAttribute("data-preview-focus");
      current = data.id ? document.getElementById(data.id) : null;
      if (!current) return;
      current.setAttribute("data-preview-focus", "");
      current.scrollIntoView({ block: "start", behavior: "instant" });
    }
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return null;
}
```

  Append to `app/globals.css`:

```css
/* The admin preview outlines the block being edited (components/admin/preview-focus.tsx). */
[data-preview-focus] {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}
```

- [ ] **Step 6: Create the preview routes.** First `app/admin/preview/layout.tsx`:

```tsx
import { PreviewFocus } from "@/components/admin/preview-focus";
import { WorkShell } from "@/components/shell/work-shell";

// Previews render inside the real Work shell, so they look exactly like the site.
export default function PreviewLayout({ children }: LayoutProps<"/admin/preview">) {
  return (
    <WorkShell>
      <PreviewFocus />
      {children}
    </WorkShell>
  );
}
```

`app/admin/preview/work/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductPageBody } from "@/components/work/product-page-body";
import { requireAdminPage } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { draftPageView } from "@/lib/content/preview";
import { getPrimeIcons } from "@/lib/work/primeicons";

export default function PreviewWorkPage(props: PageProps<"/admin/preview/work/[slug]">) {
  return (
    <Suspense fallback={null}>
      <PreviewWork params={props.params} />
    </Suspense>
  );
}

async function PreviewWork({ params }: Pick<PageProps<"/admin/preview/work/[slug]">, "params">) {
  const { slug } = await params;
  await requireAdminPage(`/admin/work/${slug}/`);
  const page = await draftPageView(getContentStore(), slug);
  if (!page) notFound();
  const icons = page.blocks.some((block) => block.kind === "icons") ? await getPrimeIcons() : undefined;
  return <ProductPageBody page={page} icons={icons} />;
}
```

`app/admin/preview/home/page.tsx`:

```tsx
import { Suspense } from "react";
import { HomeSite } from "@/components/home/home-site";
import { requireAdminPage } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { draftHomeContent } from "@/lib/content/preview";

export default function PreviewHomePage() {
  return (
    <Suspense fallback={null}>
      <PreviewHome />
    </Suspense>
  );
}

async function PreviewHome() {
  await requireAdminPage("/admin/");
  return <HomeSite content={await draftHomeContent(getContentStore())} />;
}
```

- [ ] **Step 7: Extend the signed-out e2e.** Append to `e2e/admin.spec.ts`:

```ts
test("previews redirect a signed-out visitor to sign-in", async ({ page }) => {
  await page.goto("/admin/preview/work/nebuu/");
  await expect(page).toHaveURL(/\/admin\/\?next=%2Fadmin%2Fwork%2Fnebuu%2F$/);
  await expect(page.getByRole("link", { name: "Sign in with GitHub" })).toBeVisible();
});

test("public pages show no Edit link to a signed-out visitor", async ({ page }) => {
  for (const path of ["/", "/work/nebuu/"]) {
    await page.goto(path);
    await expect(page.locator("footer").getByRole("link", { name: "Edit" })).toHaveCount(0);
  }
});
```

- [ ] **Step 8: Run everything.**
  - Run `npm run typecheck && npm run lint && npm test && npm run build && npx playwright test e2e/admin.spec.ts e2e/home.spec.ts e2e/work-product.spec.ts`. Expected: PASS.
  - In the route table, `/` and `/work/[slug]` must still be prerendered: EditLink must not have made them dynamic.
  - Signed in locally (as in Task 8 Step 9), open `/admin/preview/work/nebuu/` and `/admin/preview/home/`: both look exactly like the public pages.

- [ ] **Step 9: Commit.**

```bash
git add lib/content/preview.ts app/admin/preview components/admin/preview-focus.tsx components/shell app/globals.css e2e/admin.spec.ts tests/ui/edit-link.test.ts
git commit -m "Render draft previews in the Work shell and show an Edit link after sign-in

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 10: Editor framework, proven on the Lab editor

**Files:**
- Modify: `package.json` (add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`), `lib/admin/results.ts` (add `DocEditorInit`)
- Create:
  - `lib/admin/list.ts`, `lib/admin/load.ts`;
  - `components/admin/fields.tsx`, `use-keyed-list.ts`, `sortable-list.tsx`, `use-doc-editor.ts`, `doc-toolbar.tsx`, `issues-list.tsx`, `preview-pane.tsx`, `editor-frame.tsx`, `lab-editor.tsx`;
  - `app/admin/(console)/lab/page.tsx`
- Test: `tests/admin/list.test.ts`

**Interfaces:**
- Consumes: the actions (Task 7), `Issue`, `issuesAt`, `formatIssue` (Task 3), `repoValue` (Task 3), `getContentStore` (Task 4), `requireAdminPage` (Task 6), `AdminLoading` (Task 8), the preview routes and `PreviewFocus` protocol (Task 9).
- Produces (later editors use exactly these):
  - from `lib/admin/list.ts`: `move`, `insertAt`, `removeAt`, `replaceAt`, `optional(text): string | undefined`;
  - `DocEditorInit<T> { docKey; value: T; draftUpdatedAt: string | null; hasDraft: boolean; publishedAt: string | null; available: boolean }` (in `lib/admin/results.ts`);
  - `loadDoc<T>(key): Promise<LoadedDoc<T>>`, where `LoadedDoc<T> = DocEditorInit<T> & { baseline: T | null }`;
  - `useKeyedList<T>(items, onChange) → { keys, move, insert(at, item): string, remove, update }`;
  - `SortableList({ keys, onMove, canMove?, children: (index, controls) => ReactNode })`;
  - from `fields.tsx`: `CONTROL`, `Field`, `TextField`, `TextAreaField`, `SelectField`, `ParagraphsField`, `PairsField`, `AddButton`, `RemoveButton`, `IssueText`;
  - `useDocEditor<T>(init) → DocEditor<T>` (`DocEditorState` plus `value`, `setValue`);
  - `DocToolbar({ editor, extra? })`, `IssuesList({ issues })`, `PreviewPane({ src, version, focusId, className })`;
  - `EditorFrame({ crumbs, editor, preview?, focusId?, openHref?, extraActions?, children })`.

- [ ] **Step 1: Install dnd-kit.** Run `npm install @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2 --save-exact`.

- [ ] **Step 2: Write the failing list test.** Create `tests/admin/list.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { insertAt, move, optional, removeAt, replaceAt } from "@/lib/admin/list";

describe("list helpers", () => {
  const list = ["a", "b", "c"];
  it("move an item, leaving the input untouched and ignoring out-of-range moves", () => {
    expect(move(list, 0, 2)).toEqual(["b", "c", "a"]);
    expect(move(list, 2, 0)).toEqual(["c", "a", "b"]);
    expect(move(list, 0, 3)).toEqual(list);
    expect(list).toEqual(["a", "b", "c"]);
  });
  it("insert, remove and replace by index", () => {
    expect(insertAt(list, 1, "x")).toEqual(["a", "x", "b", "c"]);
    expect(removeAt(list, 1)).toEqual(["a", "c"]);
    expect(replaceAt(list, 2, "z")).toEqual(["a", "b", "z"]);
  });
  it("turns blank text into undefined", () => {
    expect(optional("  ")).toBeUndefined();
    expect(optional("2026")).toBe("2026");
  });
});
```

- [ ] **Step 3: Run it to make sure it fails, then create `lib/admin/list.ts`.** Run `npx vitest run tests/admin/list.test.ts`. Expected: FAIL. Then create the module:

```ts
// Immutable list edits for the admin editors.

export function move<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function insertAt<T>(list: readonly T[], index: number, item: T): T[] {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function replaceAt<T>(list: readonly T[], index: number, item: T): T[] {
  return list.map((current, i) => (i === index ? item : current));
}

// Optional text fields store undefined, never "".
export function optional(text: string): string | undefined {
  return text.trim() ? text : undefined;
}
```

  Run the test again. Expected: PASS.

- [ ] **Step 4: Add `DocEditorInit` and `loadDoc`.** Append to `lib/admin/results.ts`:

```ts
import type { DocKey } from "@/lib/content/keys";

// What an editor page hands its client editor.
export interface DocEditorInit<T> {
  docKey: DocKey;
  // The draft, else the published value, else the repo value.
  value: T;
  draftUpdatedAt: string | null;
  hasDraft: boolean;
  publishedAt: string | null;
  // False without a database: the editor shows the content but can't save.
  available: boolean;
}
```

  Move that `import` to the top of the file. Then create `lib/admin/load.ts`:

```ts
import "server-only";
import { getContentStore } from "@/lib/content/get-store";
import type { DocKey } from "@/lib/content/keys";
import { repoValue } from "@/lib/content/site";
import type { ContentDoc } from "@/lib/content/store";
import type { DocEditorInit } from "./results";

export interface LoadedDoc<T> extends DocEditorInit<T> {
  // The live value (published, else repo): ids in it are locked.
  baseline: T | null;
}

export async function loadDoc<T>(key: DocKey): Promise<LoadedDoc<T>> {
  let doc: ContentDoc | null = null;
  let available = true;
  try {
    const store = getContentStore();
    if (store) doc = await store.getDoc(key);
    else available = false;
  } catch (e) {
    console.warn("[admin] loading", key, "failed:", e instanceof Error ? e.message : e);
    available = false;
  }
  const baseline = (doc?.published ?? repoValue(key)) as T | null;
  return {
    docKey: key,
    value: (doc?.draft ?? baseline) as T,
    baseline,
    draftUpdatedAt: doc?.draftUpdatedAt?.toISOString() ?? null,
    hasDraft: doc?.draft != null,
    publishedAt: doc?.publishedAt?.toISOString() ?? null,
    available,
  };
}
```

- [ ] **Step 5: Create the list primitives.** First `components/admin/use-keyed-list.ts`:

```ts
"use client";

import { useState } from "react";
import { insertAt, move, removeAt, replaceAt } from "@/lib/admin/list";

// Stable React keys for an editable list. Items have no stable identity (Lab
// rows, paragraphs) or one that is being edited (block and image ids), so the
// keys live here and move with their items. Keys are only created in event
// handlers; the render stays pure.
export function useKeyedList<T>(items: T[], onChange: (next: T[]) => void) {
  const [keys, setKeys] = useState<string[]>(() => items.map((_, index) => `initial-${index}`));
  // Defensive: if the list changed length behind our back, pad or trim.
  const current = keys.length === items.length ? keys : items.map((_, index) => keys[index] ?? `extra-${index}`);
  return {
    keys: current,
    move(from: number, to: number) {
      setKeys(move(current, from, to));
      onChange(move(items, from, to));
    },
    // Returns the new item's key, so a caller can open it.
    insert(at: number, item: T): string {
      const key = crypto.randomUUID();
      setKeys(insertAt(current, at, key));
      onChange(insertAt(items, at, item));
      return key;
    },
    remove(at: number) {
      setKeys(removeAt(current, at));
      onChange(removeAt(items, at));
    },
    update(at: number, item: T) {
      onChange(replaceAt(items, at, item));
    },
  };
}
```

`components/admin/sortable-list.tsx`:

```tsx
"use client";

import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ReactNode, useId } from "react";
import { cx } from "@/lib/cx";

// A vertical list reordered by dragging a grip or with ↑/↓ buttons (the
// keyboard and screen-reader path). Each row renders its own controls where it
// wants them. `canMove` vetoes a move (the then block stays first).
export function SortableList({
  keys,
  onMove,
  canMove,
  className,
  children,
}: {
  keys: string[];
  onMove: (from: number, to: number) => void;
  canMove?: (from: number, to: number) => boolean;
  className?: string;
  children: (index: number, controls: ReactNode) => ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const allowed = (from: number, to: number) => from !== to && to >= 0 && to < keys.length && (canMove?.(from, to) ?? true);

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;
    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));
    if (allowed(from, to)) onMove(from, to);
  }

  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={keys} strategy={verticalListSortingStrategy}>
        <ul className={cx("flex flex-col gap-2", className)}>
          {keys.map((key, index) => (
            <SortableRow
              key={key}
              id={key}
              canUp={allowed(index, index - 1)}
              canDown={allowed(index, index + 1)}
              onUp={() => onMove(index, index - 1)}
              onDown={() => onMove(index, index + 1)}
            >
              {(controls) => children(index, controls)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  canUp,
  canDown,
  onUp,
  onDown,
  children,
}: {
  id: string;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
  children: (controls: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const controls = (
    <span className="flex shrink-0 items-center type-meta text-fg-muted">
      <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Drag to reorder" className="cursor-grab px-1 hover:text-fg">
        ⋮⋮
      </button>
      <button type="button" aria-label="Move up" disabled={!canUp} onClick={onUp} className="px-1 hover:text-fg disabled:opacity-30">
        ↑
      </button>
      <button type="button" aria-label="Move down" disabled={!canDown} onClick={onDown} className="px-1 hover:text-fg disabled:opacity-30">
        ↓
      </button>
    </span>
  );
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cx("min-w-0", isDragging && "relative z-10 opacity-80")}>
      {children(controls)}
    </li>
  );
}
```

- [ ] **Step 6: Create `components/admin/fields.tsx`.**

```tsx
"use client";

import type { ReactNode } from "react";
import { optional } from "@/lib/admin/list";
import type { Issue } from "@/lib/content/issues";
import { cx } from "@/lib/cx";
import { useKeyedList } from "./use-keyed-list";

// Form controls for the admin editors, on the site tokens. Every control sits
// in a <label>, so its visible label is its accessible name.

export const CONTROL =
  "w-full min-w-0 rounded-control border border-line bg-bg px-2 py-1.5 type-body text-fg focus:border-accent focus:outline-none disabled:text-fg-muted";

export function IssueText({ issues }: { issues?: Issue[] }) {
  if (!issues?.length) return null;
  return <p className="type-meta text-danger">{issues.map((issue) => issue.message).join("; ")}</p>;
}

export function Field({ label, hint, issues, children }: { label: string; hint?: ReactNode; issues?: Issue[]; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="type-label text-fg-muted">{label}</span>
      {children}
      {issues?.length ? <IssueText issues={issues} /> : hint ? <span className="type-meta text-fg-muted">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  issues,
  placeholder,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  issues?: Issue[];
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "month";
}) {
  return (
    <Field label={label} hint={hint} issues={issues}>
      <input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={CONTROL} />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  issues,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: ReactNode;
  issues?: Issue[];
}) {
  return (
    <Field label={label} hint={hint} issues={issues}>
      <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className={CONTROL} />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} className={CONTROL}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="self-start type-meta text-accent hover:underline">
      + {children}
    </button>
  );
}

export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="shrink-0 px-1 type-meta text-fg-muted hover:text-danger">
      ×
    </button>
  );
}

// Body paragraphs: one textarea each, added and removed in place.
export function ParagraphsField({ label, value, onChange, issues }: { label: string; value: string[]; onChange: (next: string[]) => void; issues?: Issue[] }) {
  const list = useKeyedList(value, onChange);
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1 type-label text-fg-muted">{label}</legend>
      {value.map((text, index) => (
        <div key={list.keys[index]} className="flex items-start gap-1">
          <textarea aria-label={`${label} ${index + 1}`} value={text} rows={3} onChange={(event) => list.update(index, event.target.value)} className={CONTROL} />
          <RemoveButton label={`Remove ${label.toLowerCase()} ${index + 1}`} onClick={() => list.remove(index)} />
        </div>
      ))}
      <AddButton onClick={() => list.insert(value.length, "")}>Add paragraph</AddButton>
      <IssueText issues={issues} />
    </fieldset>
  );
}

export interface PairColumn<T> {
  key: keyof T & string;
  label: string;
  // Blank becomes undefined (optional fields such as a credit's role).
  optional?: boolean;
  className?: string;
}

// Rows of short text pairs: links, sources, credits, facts.
export function PairsField<T extends Record<string, string | undefined>>({
  legend,
  value,
  onChange,
  columns,
  create,
  addLabel,
  removable,
  issues,
}: {
  legend: string;
  value: T[];
  onChange: (next: T[]) => void;
  columns: PairColumn<T>[];
  create: () => T;
  addLabel: string;
  removable?: (item: T) => boolean;
  issues?: Issue[];
}) {
  const list = useKeyedList(value, onChange);
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1 type-label text-fg-muted">{legend}</legend>
      {value.map((item, index) => (
        <div key={list.keys[index]} className="flex items-center gap-1">
          {columns.map((column) => (
            <input
              key={column.key}
              aria-label={`${legend} ${index + 1} ${column.label}`}
              placeholder={column.label}
              value={item[column.key] ?? ""}
              onChange={(event) => {
                const text = event.target.value;
                list.update(index, { ...item, [column.key]: column.optional ? optional(text) : text } as T);
              }}
              className={cx(CONTROL, column.className)}
            />
          ))}
          {removable?.(item) === false ? (
            <span className="w-5 shrink-0" />
          ) : (
            <RemoveButton label={`Remove ${legend.toLowerCase()} ${index + 1}`} onClick={() => list.remove(index)} />
          )}
        </div>
      ))}
      <AddButton onClick={() => list.insert(value.length, create())}>{addLabel}</AddButton>
      <IssueText issues={issues} />
    </fieldset>
  );
}
```

- [ ] **Step 7: Create `components/admin/use-doc-editor.ts`.**

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { discardDraftAction, publishAction, resetDocAction, saveDraftAction } from "@/app/admin/actions";
import type { ActionResult, DocEditorInit } from "@/lib/admin/results";
import type { Issue } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";

// One document's editing session (spec §2.3): local state, autosave ~1s after
// the last change (one save in flight at a time, the latest value wins),
// optimistic concurrency through draftUpdatedAt, publish/discard/reset, and a
// preview version that bumps after each save so the preview reloads.

export const AUTOSAVE_MS = 1000;

export type EditorStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "publishing"
  | "published"
  | "conflict"
  | "signed-out"
  | "unavailable"
  | "invalid";

export interface DocEditorState {
  docKey: DocKey;
  status: EditorStatus;
  hasDraft: boolean;
  savedAt: string | null;
  publishedAt: string | null;
  issues: Issue[];
  previewVersion: number;
  canPublish: boolean;
  flush: () => Promise<void>;
  publish: () => Promise<void>;
  discard: () => Promise<void>;
  reset: () => Promise<void>;
  // Show issues that came from another action (delete page, upload).
  report: (issues: Issue[]) => void;
}

export interface DocEditor<T> extends DocEditorState {
  value: T;
  setValue: (update: (previous: T) => T) => void;
}

const BLOCKING: EditorStatus[] = ["conflict", "signed-out", "unavailable"];

export function useDocEditor<T>(init: DocEditorInit<T>): DocEditor<T> {
  const { docKey } = init;
  const [value, setValueState] = useState<T>(init.value);
  const [status, setStatus] = useState<EditorStatus>(init.available ? "idle" : "unavailable");
  const [hasDraft, setHasDraft] = useState(init.hasDraft);
  const [savedAt, setSavedAt] = useState(init.draftUpdatedAt);
  const [publishedAt, setPublishedAt] = useState(init.publishedAt);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [previewVersion, setPreviewVersion] = useState(0);

  const valueRef = useRef(init.value);
  const expected = useRef(init.draftUpdatedAt);
  const pending = useRef(false);
  const blocked = useRef(!init.available);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const fail = useCallback((result: ActionResult) => {
    if (result.status === "invalid") {
      setIssues(result.issues);
      setStatus("invalid");
      return;
    }
    const next: EditorStatus = result.status === "conflict" ? "conflict" : result.status === "unauthorized" ? "signed-out" : "unavailable";
    blocked.current = BLOCKING.includes(next);
    setStatus(next);
  }, []);

  const flush = useCallback((): Promise<void> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    chain.current = chain.current.then(async () => {
      if (!pending.current || blocked.current) return;
      pending.current = false;
      setStatus("saving");
      const result = await saveDraftAction(docKey, valueRef.current, expected.current).catch((): ActionResult => ({ status: "unavailable" }));
      if (result.status !== "ok") return fail(result);
      expected.current = result.draftUpdatedAt;
      setSavedAt(result.draftUpdatedAt);
      setHasDraft(true);
      setStatus(pending.current ? "dirty" : "saved");
      setPreviewVersion((version) => version + 1);
    });
    return chain.current;
  }, [docKey, fail]);

  const setValue = useCallback(
    (update: (previous: T) => T) => {
      const next = update(valueRef.current);
      valueRef.current = next;
      pending.current = true;
      setValueState(next);
      if (!blocked.current) setStatus("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
    },
    [flush],
  );

  const publish = useCallback(async () => {
    await flush();
    if (blocked.current) return;
    setStatus("publishing");
    const result = await publishAction(docKey).catch((): ActionResult => ({ status: "unavailable" }));
    if (result.status !== "ok") return fail(result);
    expected.current = null;
    setIssues([]);
    setHasDraft(false);
    setSavedAt(null);
    setPublishedAt(result.publishedAt);
    setStatus("published");
    setPreviewVersion((version) => version + 1);
  }, [docKey, flush, fail]);

  const runAndReload = useCallback(
    async (question: string, action: (key: string) => Promise<ActionResult>) => {
      if (!window.confirm(question)) return;
      if (timer.current) clearTimeout(timer.current);
      pending.current = false;
      await chain.current;
      const result = await action(docKey).catch((): ActionResult => ({ status: "unavailable" }));
      if (result.status === "ok") window.location.reload();
      else fail(result);
    },
    [docKey, fail],
  );

  const discard = useCallback(() => runAndReload("Discard the draft and go back to the published version?", discardDraftAction), [runAndReload]);
  const reset = useCallback(() => runAndReload("Reset to the repo version? The published edits are removed from the site.", resetDocAction), [runAndReload]);
  const report = useCallback((next: Issue[]) => {
    setIssues(next);
    if (next.length) setStatus("invalid");
  }, []);

  // Leaving with an unsaved change: save it and let the browser ask.
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!pending.current) return;
      void flush();
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [flush]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const busy = status === "saving" || status === "publishing" || status === "invalid" || BLOCKING.includes(status);
  return {
    docKey,
    value,
    setValue,
    status,
    hasDraft,
    savedAt,
    publishedAt,
    issues,
    previewVersion,
    canPublish: !busy && (hasDraft || status === "dirty"),
    flush,
    publish,
    discard,
    reset,
    report,
  };
}
```

  **If lint objects.** The repo's React Hooks rules may flag the ref reads in the unmount cleanup or the callbacks. Keep the behaviour and silence a rule only with a one-line `// eslint-disable-next-line <rule> -- <reason>`.

- [ ] **Step 8: Create the frame pieces.** First `components/admin/issues-list.tsx`:

```tsx
import { type Issue, formatIssue } from "@/lib/content/issues";

// Every publish problem in one list under the toolbar; fields repeat their own.
export function IssuesList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;
  return (
    <div role="alert" className="border-b border-line bg-danger-bg px-4 py-2 type-meta text-danger">
      <p>Publishing is blocked:</p>
      <ul className="list-disc pl-5">
        {issues.map((issue, index) => (
          <li key={index}>{formatIssue(issue)}</li>
        ))}
      </ul>
    </div>
  );
}
```

`components/admin/doc-toolbar.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import type { DocEditorState } from "./use-doc-editor";

function StatusText({ editor }: { editor: DocEditorState }) {
  const pathname = usePathname();
  switch (editor.status) {
    case "dirty":
      return <>Editing…</>;
    case "saving":
      return <>Saving…</>;
    case "publishing":
      return <>Publishing…</>;
    case "conflict":
      return (
        <span className="text-danger">
          A newer draft exists —{" "}
          <button type="button" className="underline" onClick={() => window.location.reload()}>
            reload
          </button>
        </span>
      );
    case "signed-out":
      return (
        <span className="text-danger">
          Signed out —{" "}
          <a className="underline" href={`/api/auth/signin/?next=${encodeURIComponent(pathname)}`}>
            sign in again
          </a>
        </span>
      );
    case "unavailable":
      return <span className="text-danger">Database unavailable</span>;
    case "invalid":
      return <span className="text-danger">Fix the issues to publish</span>;
    case "published":
      return (
        <>
          <StatusGlyph status="ok" /> Published
        </>
      );
    default:
      if (editor.hasDraft) {
        return (
          <>
            <StatusGlyph status="late" /> Draft saved{editor.savedAt ? <> <RelativeTime iso={editor.savedAt} /></> : null}
          </>
        );
      }
      return editor.publishedAt ? (
        <>
          <StatusGlyph status="ok" /> Published <RelativeTime iso={editor.publishedAt} />
        </>
      ) : (
        <>
          <StatusGlyph status="empty" /> Repo version
        </>
      );
  }
}

// Save status, Discard draft and Publish: the same controls on every editor.
export function DocToolbar({ editor, extra }: { editor: DocEditorState; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      <p role="status" aria-live="polite" className="type-meta text-fg-muted">
        <StatusText editor={editor} />
      </p>
      {extra}
      <Button variant="text" onClick={() => void editor.discard()} disabled={!editor.hasDraft}>
        Discard draft
      </Button>
      <Button variant="primary" onClick={() => void editor.publish()} disabled={!editor.canPublish}>
        Publish
      </Button>
    </div>
  );
}
```

`components/admin/preview-pane.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import { cx } from "@/lib/cx";

// The draft preview: the real page in an iframe, reloaded after each save
// (`version`), scrolled to and outlining the block being edited (PreviewFocus).
export function PreviewPane({ src, version, focusId, className }: { src: string; version: number; focusId: string | null; className?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "preview-focus", id: focusId }, window.location.origin);
  }, [focusId]);

  useEffect(() => {
    send();
    function onMessage(event: MessageEvent) {
      if (event.origin === window.location.origin && (event.data as { type?: string })?.type === "preview-ready") send();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  return (
    <div className={cx("relative bg-bg", className)}>
      <span className="absolute top-2 right-3 z-10 border border-line bg-bg px-1.5 type-label text-fg-muted">Preview · draft</span>
      <iframe ref={frame} title="Preview" src={`${src}?v=${version}`} onLoad={send} className="h-full w-full border-0" />
    </div>
  );
}
```

`components/admin/editor-frame.tsx`:

```tsx
"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { cx } from "@/lib/cx";
import { DocToolbar } from "./doc-toolbar";
import { IssuesList } from "./issues-list";
import { PreviewPane } from "./preview-pane";
import type { DocEditorState } from "./use-doc-editor";

// Mockup option A: a toolbar, then the form (440px) beside the live draft
// preview. Below lg (1024px) the two become Form / Preview tabs.
export function EditorFrame({
  crumbs,
  editor,
  preview,
  focusId = null,
  openHref,
  extraActions,
  children,
}: {
  crumbs: string[];
  editor: DocEditorState;
  preview?: string;
  focusId?: string | null;
  openHref?: string;
  extraActions?: ReactNode;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<"form" | "preview">("form");
  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-2">
        <nav aria-label="Breadcrumb" className="type-meta text-fg-muted">
          <Link href="/admin/" className="hover:text-fg">
            Admin
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb}>
              {" / "}
              <span className="text-fg">{crumb}</span>
            </span>
          ))}
        </nav>
        <div className="ml-auto">
          <DocToolbar
            editor={editor}
            extra={
              <>
                {extraActions}
                {openHref ? (
                  <a href={openHref} target="_blank" rel="noopener" className={buttonClass("ghost")}>
                    Open page ↗
                  </a>
                ) : null}
              </>
            }
          />
        </div>
      </div>
      <IssuesList issues={editor.issues} />
      {preview ? (
        <div role="tablist" aria-label="Editor view" className="flex gap-4 border-b border-line px-4 py-1.5 type-meta lg:hidden">
          {(["form", "preview"] as const).map((name) => (
            <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)} className={tab === name ? "text-fg underline" : "text-fg-muted"}>
              {name === "form" ? "Form" : "Preview"}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <div
          className={cx(
            "w-full overflow-y-auto p-4",
            preview ? "lg:w-[440px] lg:shrink-0 lg:border-r lg:border-line" : "mx-auto max-w-[720px]",
            preview && tab === "preview" && "hidden lg:block",
          )}
        >
          {children}
        </div>
        {preview ? (
          <PreviewPane src={preview} version={editor.previewVersion} focusId={focusId} className={cx("min-w-0 flex-1", tab === "form" && "hidden lg:block")} />
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Create the Lab editor and its route.** First `components/admin/lab-editor.tsx`:

```tsx
"use client";

import type { LabEntry } from "@/content/lab-index";
import { optional } from "@/lib/admin/list";
import type { DocEditorInit } from "@/lib/admin/results";
import { issuesAt } from "@/lib/content/issues";
import { EditorFrame } from "./editor-frame";
import { AddButton, RemoveButton, TextAreaField, TextField } from "./fields";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

// The home's Lab rows: add, edit, reorder, remove (spec §2.4).
export function LabEditor({ init }: { init: DocEditorInit<LabEntry[]> }) {
  const editor = useDocEditor(init);
  const entries = editor.value;
  const list = useKeyedList(entries, (next) => editor.setValue(() => next));
  const at = (path: string) => issuesAt(editor.issues, "lab", path);

  return (
    <EditorFrame crumbs={["Lab"]} editor={editor} preview="/admin/preview/home/" focusId="lab" openHref="/#lab">
      <div className="flex flex-col gap-4">
        <p className="type-meta text-fg-muted">Things you build, in display order. The Lab row hides while the list is empty.</p>
        <SortableList keys={list.keys} onMove={list.move}>
          {(index, controls) => {
            const entry = entries[index];
            return (
              <div data-testid="lab-row" className="flex flex-col gap-2 border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  {controls}
                  <RemoveButton label={`Remove ${entry.title || "entry"}`} onClick={() => list.remove(index)} />
                </div>
                <TextField label="Title" value={entry.title} onChange={(title) => list.update(index, { ...entry, title })} issues={at(`${index}/title`)} />
                <TextAreaField
                  label="Description"
                  value={entry.description}
                  rows={2}
                  onChange={(description) => list.update(index, { ...entry, description })}
                  issues={at(`${index}/description`)}
                />
                <div className="grid grid-cols-[96px_1fr] gap-2">
                  <TextField label="Year" value={entry.year ?? ""} onChange={(year) => list.update(index, { ...entry, year: optional(year) })} />
                  <TextField
                    label="Link"
                    value={entry.href ?? ""}
                    placeholder="https://"
                    onChange={(href) => list.update(index, { ...entry, href: optional(href) })}
                    issues={at(`${index}/href`)}
                  />
                </div>
              </div>
            );
          }}
        </SortableList>
        <AddButton onClick={() => list.insert(entries.length, { title: "", description: "" })}>Add entry</AddButton>
      </div>
    </EditorFrame>
  );
}
```

`app/admin/(console)/lab/page.tsx`:

```tsx
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { LabEditor } from "@/components/admin/lab-editor";
import type { LabEntry } from "@/content/lab-index";
import { loadDoc } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/auth/admin";

export default function LabEditorPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/lab/");
  return <LabEditor init={await loadDoc<LabEntry[]>("lab")} />;
}
```

- [ ] **Step 10: Run everything and check it by hand.**
  - Run `npm run typecheck && npm run lint && npm test && npm run build`. Expected: PASS.
  - Then start `ADMIN_E2E=1 ADMIN_GITHUB_ID=1 AUTH_SECRET=<32+ chars> CONTENT_STORE_FILE=.content-dev.json npm run dev` and visit `/api/auth/test-signin/?next=/admin/lab/`. Check:
    1. The form shows the seven entries and the preview shows the home, scrolled to Lab.
    2. Change a title: the status goes "Editing…" → "Saving…" → "◐ Draft saved", and the preview shows the new title.
    3. Drag a row by its grip, and freeze-frame it mid-drag (take a screenshot while the mouse is down). The row lifts at 80% opacity and the others make room.
    4. Use ↑/↓: the first row's ↑ and the last row's ↓ are disabled.
    5. Clear a title and Publish: the issues list says `lab 0/title: …` and the field shows the message. Fix it and Publish: the status reads "● Published" and `/` shows the change.
    6. Discard draft after another edit: it asks, reloads, and the published value is back.
    7. At 390px: Form / Preview tabs, no horizontal scroll.
  - Afterwards, delete `.content-dev.json` (or keep it locally; it's gitignored).

- [ ] **Step 11: Commit.**

```bash
git add package.json package-lock.json lib/admin components/admin app/admin tests/admin
git commit -m "Add the two-pane editor framework with autosave, preview and publish, and the Lab editor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Product page editor, new pages and page removal

**Files:**
- Create:
  - `lib/content/ids.ts`, `tests/content/ids.test.ts`;
  - `components/admin/page-editor/{page-editor,header-fields,block-card,image-card,add-block}.tsx`;
  - `components/admin/new-page-form.tsx`;
  - `app/admin/(console)/work/[slug]/page.tsx`, `app/admin/(console)/work/new/page.tsx`
- Modify: `lib/admin/load.ts` (add `loadPageContext`), `lib/admin/operations.ts` (reserve the slug `new`), `tests/admin/operations.test.ts`

**Interfaces:**
- Consumes: everything from Task 10; `deletePageAction`, `createPageAction` (Task 7); `pageImages`, `imageKey` (`lib/work/derive.ts`); `lookupWith`, `toMediaEntry` (Task 5); `renditionUrl` (Task 5).
- Produces:
  - `kebab(text)`, `uniqueId(base, taken, fallback)`, `lockedIds(page) → { blocks: string[]; images: string[] }`, `followId(current, oldText, newText, taken, fallback, locked)`;
  - `loadPageContext(page) → Promise<{ entries: Record<string, ImageEntry>; live: boolean }>`;
  - `PageEditor` props: `{ init: DocEditorInit<ProductPage>; locked: { blocks: string[]; images: string[] }; entries: Record<string, ImageEntry>; live: boolean; hasRepo: boolean }`. Task 12 adds `uploadMode`;
  - `ImageCard` props include `onChange(image: WorkImage)`, `entry?: ImageEntry`, `imageKey: string`. Task 12 adds an upload slot.

- [ ] **Step 1: Write the failing id tests.** Create `tests/content/ids.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { productPages } from "@/content/work";
import { followId, kebab, lockedIds, uniqueId } from "@/lib/content/ids";

describe("ids", () => {
  it("kebab-cases text, folding Turkish letters", () => {
    expect(kebab("What I did")).toBe("what-i-did");
    expect(kebab("İmparator Kartları")).toBe("imparator-kartlari");
    expect(kebab("nebuu.com")).toBe("nebuu-com");
    expect(kebab("  ")).toBe("");
  });

  it("makes an id unique, with a fallback for blank text", () => {
    expect(uniqueId("highlights", ["highlights"], "block")).toBe("highlights-2");
    expect(uniqueId("", [], "block")).toBe("block");
    expect(uniqueId("", ["block", "block-2"], "block")).toBe("block-3");
  });

  it("lets an unlocked id follow its heading while it still matches it", () => {
    expect(followId("block", "", "Decks", ["then", "block"], "block", false)).toBe("decks");
    expect(followId("decks", "Decks", "Deck list", ["decks"], "block", false)).toBe("deck-list");
    expect(followId("decks-2", "Decks", "Cards", ["decks", "decks-2"], "block", false)).toBe("cards");
    expect(followId("custom", "Decks", "Cards", ["custom"], "block", false)).toBe("custom");
    expect(followId("decks", "Decks", "Cards", ["decks"], "block", true)).toBe("decks");
  });

  it("locks every id the live page already has", () => {
    const nebuu = productPages.find((p) => p.slug === "nebuu")!;
    expect(lockedIds(nebuu)).toEqual({ blocks: ["then", "what-i-did", "decks", "editions", "highlights"], images: ["game", "cards", "site"] });
    expect(lockedIds(null)).toEqual({ blocks: [], images: [] });
  });
});
```

  In `tests/admin/operations.test.ts`, add to the `createPage` describe:

```ts
  it("reserves the slug of the new-page form", async () => {
    expect((await createPage(store, { slug: "new", org: "orkestra", title: "New", kind: "" }, t0)).status).toBe("invalid");
  });
```

- [ ] **Step 2: Run them to make sure they fail.** Run `npx vitest run tests/content/ids.test.ts tests/admin/operations.test.ts`. Expected: FAIL.

- [ ] **Step 3: Create `lib/content/ids.ts`.**

```ts
import type { ProductPage } from "@/content/work/types";
import { KEBAB } from "./keys";

// Block and image ids (spec §1.6): generated from the heading or caption,
// editable until published, permanent after.

const FOLD: Record<string, string> = { ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g", ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c" };

export function kebab(text: string): string {
  return text
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (letter) => FOLD[letter])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export function uniqueId(base: string, taken: Iterable<string>, fallback: string): string {
  const used = new Set(taken);
  const root = KEBAB.test(base) ? base : fallback;
  if (!used.has(root)) return root;
  for (let n = 2; ; n++) if (!used.has(`${root}-${n}`)) return `${root}-${n}`;
}

// Ids already live: the published page's, else the repo page's. null (a page
// that was never published) locks nothing.
export function lockedIds(page: ProductPage | null): { blocks: string[]; images: string[] } {
  if (!page) return { blocks: [], images: [] };
  return {
    blocks: page.blocks.map((block) => block.id),
    images: page.blocks.flatMap((block) => (block.kind === "images" ? block.images.map((image) => image.id) : [])),
  };
}

// After a heading or caption edit: an unlocked id that still follows the old
// text (or is the fallback, possibly numbered) follows the new text. An id the
// author typed by hand stays.
export function followId(current: string, oldText: string, newText: string, taken: Iterable<string>, fallback: string, locked: boolean): string {
  if (locked) return current;
  const old = kebab(oldText);
  const automatic = new RegExp(`^(${old ? `${old}|` : ""}${fallback})(-\\d+)?$`).test(current);
  if (!automatic) return current;
  return uniqueId(kebab(newText), [...taken].filter((id) => id !== current), fallback);
}
```

  In `lib/admin/operations.ts` `createPage`, change the taken check to `if (taken.has(input.slug) || input.slug === "new" || repoValue(key) !== null)`, with a comment: `// "new" is the new-page form's route (/admin/work/new/).`

- [ ] **Step 4: Add `loadPageContext`.** Append to `lib/admin/load.ts`, adding the imports `ProductPage`, `ImageEntry`, `lookupWith`, `toMediaEntry`, `type MediaEntry`, `indexSlugs`, `publishedValues`, `imageKey` and `pageImages`:

```ts
// The image entries an editor needs for thumbnails (manifest + uploads), and
// whether the page is live (listed in the published work-index).
export async function loadPageContext(page: ProductPage): Promise<{ entries: Record<string, ImageEntry>; live: boolean }> {
  let media: MediaEntry[] = [];
  let live = indexSlugs(new Map()).includes(page.slug);
  try {
    const store = getContentStore();
    if (store) {
      const [docs, records] = await Promise.all([store.listDocs(), store.listMedia()]);
      media = records.map(toMediaEntry);
      live = indexSlugs(publishedValues(docs)).includes(page.slug);
    }
  } catch (e) {
    console.warn("[admin] loading page context failed:", e instanceof Error ? e.message : e);
  }
  const lookup = lookupWith(media);
  const entries: Record<string, ImageEntry> = {};
  for (const image of pageImages(page)) {
    const key = image.image ?? imageKey(page.slug, image.id);
    const entry = lookup(key);
    if (entry) entries[key] = entry;
  }
  return { entries, live };
}
```

- [ ] **Step 5: Create the header fields.** `components/admin/page-editor/header-fields.tsx`:

```tsx
"use client";

import type { ProductPage } from "@/content/work/types";
import { type Issue, issuesAt } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";
import { PairsField, TextAreaField, TextField } from "../fields";

const REQUIRED_FACTS = ["Role", "Years", "At"];

// The page header: title and kind (the Experience note), the lead, the intro,
// the facts and, on Orkestra pages, the Live links.
export function HeaderFields({
  page,
  docKey,
  issues,
  onChange,
}: {
  page: ProductPage;
  docKey: DocKey;
  issues: Issue[];
  onChange: (patch: Partial<ProductPage>) => void;
}) {
  const at = (path: string) => issuesAt(issues, docKey, path);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="type-label text-fg-muted">Header</h2>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Title" value={page.title} onChange={(title) => onChange({ title })} issues={at("title")} />
        <TextField label="Kind" value={page.kind} hint="e.g. word game" onChange={(kind) => onChange({ kind })} />
      </div>
      <TextField label="Lead" value={page.lead.strong} onChange={(strong) => onChange({ lead: { ...page.lead, strong } })} issues={at("lead")} />
      <TextAreaField label="Lead, continued" rows={2} value={page.lead.rest} onChange={(rest) => onChange({ lead: { ...page.lead, rest } })} />
      <TextAreaField label="Intro" rows={4} value={page.intro} onChange={(intro) => onChange({ intro })} issues={at("intro")} />
      <PairsField
        legend="Facts"
        value={page.facts}
        onChange={(facts) => onChange({ facts })}
        columns={[
          { key: "label", label: "Label", className: "w-28 shrink-0" },
          { key: "value", label: "Value" },
        ]}
        create={() => ({ label: "", value: "" })}
        addLabel="Add fact"
        removable={(fact) => !REQUIRED_FACTS.includes(fact.label)}
        issues={at("facts")}
      />
      {page.org === "primetek" ? (
        <p className="type-meta text-fg-muted">PrimeTek pages carry no external links.</p>
      ) : (
        <PairsField
          legend="Live links"
          value={page.links ?? []}
          onChange={(links) => onChange({ links: links.length ? links : undefined })}
          columns={[
            { key: "label", label: "Label", className: "w-32 shrink-0" },
            { key: "href", label: "https://" },
          ]}
          create={() => ({ label: "", href: "" })}
          addLabel="Add link"
          issues={at("links")}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 6: Create the image card.** `components/admin/page-editor/image-card.tsx`:

```tsx
"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import type { WorkImage } from "@/content/work/types";
import { optional } from "@/lib/admin/list";
import { followId } from "@/lib/content/ids";
import type { Issue } from "@/lib/content/issues";
import { type ImageEntry, renditionUrl } from "@/lib/images/plan";
import { IssueText, PairsField, RemoveButton, TextField } from "../fields";

function Thumb({ entry, imageKey }: { entry?: ImageEntry; imageKey: string }) {
  if (!entry) {
    return (
      <span aria-hidden="true" className="flex aspect-[16/10] w-16 shrink-0 items-center justify-center border border-dashed border-line type-label text-fg-muted">
        16:10
      </span>
    );
  }
  // A plain thumbnail of the smallest rendition; not a page image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={renditionUrl(imageKey, entry.widths[0], "jpg", entry.baseUrl)} alt="" className="aspect-[16/10] w-16 shrink-0 border border-line object-cover" />;
}

// One image slot: thumbnail or placeholder, upload (Task 12's slot), caption,
// id, credits and the Selected work pin.
export function ImageCard({
  image,
  imageKey,
  entry,
  controls,
  locked,
  takenIds,
  issues,
  uploadSlot,
  onChange,
  onRemove,
}: {
  image: WorkImage;
  imageKey: string;
  entry?: ImageEntry;
  controls: ReactNode;
  locked: boolean;
  takenIds: string[];
  issues: Issue[];
  uploadSlot?: ReactNode;
  onChange: (image: WorkImage) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const name = image.caption || image.id;
  return (
    <div data-image={image.id} className="border border-line">
      <div className="flex items-center gap-2 p-1.5">
        {controls}
        <Thumb entry={entry} imageKey={imageKey} />
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="min-w-0 flex-1 truncate text-left type-body">
          {name}
        </button>
        {image.pin ? <span className="bg-accent px-1 type-label text-[#fff]">Pinned</span> : null}
        <RemoveButton label={`Remove image ${name}`} onClick={onRemove} />
      </div>
      {issues.length > 0 && !open ? <p className="px-2 pb-1.5 type-meta text-danger">Needs attention</p> : null}
      {open ? (
        <div className="flex flex-col gap-3 border-t border-line p-2">
          {uploadSlot}
          {image.image ? (
            <Button
              variant="text"
              className="self-start"
              onClick={() => {
                const next = { ...image };
                delete next.image;
                onChange(next);
              }}
            >
              Use the placeholder
            </Button>
          ) : null}
          <TextField
            label="Caption"
            value={image.caption ?? ""}
            onChange={(caption) =>
              onChange({ ...image, caption: optional(caption), id: followId(image.id, image.caption ?? "", caption, takenIds, "image", locked) })
            }
          />
          <TextField
            label="Id"
            value={image.id}
            disabled={locked}
            hint={locked ? "Published: permanent" : "Names the file and ?fig= links; permanent once published"}
            onChange={(id) => onChange({ ...image, id })}
          />
          <PairsField
            legend="Credits"
            value={image.credits ?? []}
            onChange={(credits) => onChange({ ...image, credits: credits.length ? credits : undefined })}
            columns={[
              { key: "name", label: "Name" },
              { key: "role", label: "Role", optional: true, className: "w-28 shrink-0" },
            ]}
            create={() => ({ name: "" })}
            addLabel="Add credit"
          />
          <label className="flex items-center gap-2 type-body">
            <input
              type="checkbox"
              checked={Boolean(image.pin)}
              onChange={(event) => onChange({ ...image, pin: event.target.checked ? { title: image.caption ?? "", note: "" } : undefined })}
            />
            Pin to Selected work
          </label>
          {image.pin ? (
            <>
              <TextField label="Pin title" hint="2–4 words" value={image.pin.title} onChange={(title) => onChange({ ...image, pin: { ...image.pin!, title } })} />
              <TextField label="Pin note" hint="One line" value={image.pin.note} onChange={(note) => onChange({ ...image, pin: { ...image.pin!, note } })} />
            </>
          ) : null}
          <IssueText issues={issues} />
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 7: Create the block card and the add menu.** First `components/admin/page-editor/block-card.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import type { Block, WorkImage } from "@/content/work/types";
import { followId, uniqueId } from "@/lib/content/ids";
import { type Issue, issuesAt } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";
import type { ImageEntry } from "@/lib/images/plan";
import { imageKey } from "@/lib/work/derive";
import { AddButton, IssueText, PairsField, ParagraphsField, RemoveButton, TextField } from "../fields";
import { SortableList } from "../sortable-list";
import { useKeyedList } from "../use-keyed-list";
import { ImageCard } from "./image-card";

export function blockLabel(block: Block): string {
  switch (block.kind) {
    case "then":
      return `Then · ${block.year || "year"}`;
    case "icons":
      return block.heading || "Icon set";
    case "images":
      return block.heading || "Images";
    default:
      return block.heading || "Untitled";
  }
}

const FALLBACK: Record<Block["kind"], string> = { text: "block", images: "images", then: "then", icons: "icon-set" };

export interface BlockCardProps {
  block: Block;
  index: number;
  docKey: DocKey;
  slug: string;
  primetek: boolean;
  controls: ReactNode;
  open: boolean;
  locked: boolean;
  takenBlockIds: string[];
  lockedImages: Set<string>;
  pageImageIds: string[];
  entries: Record<string, ImageEntry>;
  issues: Issue[];
  // Task 12: renders the upload area for one image.
  renderUpload?: (image: WorkImage, update: (image: WorkImage) => void) => ReactNode;
  onToggle: () => void;
  onChange: (block: Block) => void;
  onRemove: () => void;
}

export function BlockCard(props: BlockCardProps) {
  const { block, index, docKey, controls, open, locked, issues, onToggle, onChange, onRemove } = props;
  const label = blockLabel(block);
  // validateWork places issues at the block id, zod at blocks/<index>.
  const mine = [...issuesAt(issues, docKey, block.id), ...issuesAt(issues, docKey, `blocks/${index}`)];
  const heading = "heading" in block ? (block.heading ?? "") : "";
  const setHeading = (next: string) =>
    onChange({ ...block, heading: next, id: followId(block.id, heading, next, props.takenBlockIds, FALLBACK[block.kind], locked) } as Block);

  return (
    <div data-block={block.id} className="border border-line bg-bg">
      <div className="flex items-center gap-2 px-2 py-1.5">
        {controls}
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-w-0 flex-1 items-baseline gap-2 text-left">
          <span className="border border-line px-1 type-label text-fg-muted">{block.kind}</span>
          <span className="truncate type-body">{label}</span>
        </button>
        <span className="type-label text-fg-muted">
          {block.id}
          {locked ? " · locked" : ""}
        </span>
        <RemoveButton label={`Delete block ${label}`} onClick={onRemove} />
      </div>
      {mine.length > 0 && !open ? <p className="px-2 pb-1.5 type-meta text-danger">Needs attention</p> : null}
      {open ? (
        <div className="flex flex-col gap-3 border-t border-line p-3">
          {block.kind === "then" ? (
            <TextField label="Year" value={block.year} onChange={(year) => onChange({ ...block, year })} />
          ) : (
            <TextField label={block.kind === "text" ? "Heading" : "Heading (optional)"} value={heading} onChange={setHeading} />
          )}
          <TextField
            label="Id"
            value={block.id}
            disabled={locked}
            hint={locked ? "Published: permanent" : "The #anchor Selected work links to; permanent once published"}
            onChange={(id) => onChange({ ...block, id })}
          />
          {block.kind === "text" ? (
            <>
              <ParagraphsField label="Body" value={block.body} onChange={(body) => onChange({ ...block, body })} />
              {props.primetek ? null : (
                <PairsField
                  legend="Links"
                  value={block.links ?? []}
                  onChange={(links) => onChange({ ...block, links: links.length ? links : undefined })}
                  columns={[
                    { key: "label", label: "Label", className: "w-32 shrink-0" },
                    { key: "href", label: "https://" },
                  ]}
                  create={() => ({ label: "", href: "" })}
                  addLabel="Add link"
                />
              )}
            </>
          ) : null}
          {block.kind === "then" ? (
            <>
              <ParagraphsField label="Body" value={block.body} onChange={(body) => onChange({ ...block, body })} />
              {props.primetek ? null : (
                <PairsField
                  legend="Sources"
                  value={block.sources ?? []}
                  onChange={(sources) => onChange({ ...block, sources: sources.length ? sources : undefined })}
                  columns={[
                    { key: "label", label: "Label", className: "w-32 shrink-0" },
                    { key: "href", label: "https://" },
                  ]}
                  create={() => ({ label: "", href: "" })}
                  addLabel="Add source"
                />
              )}
            </>
          ) : null}
          {block.kind === "icons" ? <p className="type-meta text-fg-muted">The live PrimeIcons 7.0.0 set, rendered from the pinned package.</p> : null}
          {block.kind === "images" ? <ImagesField {...props} block={block} /> : null}
          <IssueText issues={mine} />
        </div>
      ) : null}
    </div>
  );
}

function ImagesField(props: BlockCardProps & { block: Extract<Block, { kind: "images" }> }) {
  const { block, onChange, slug, lockedImages, pageImageIds, entries, issues, docKey } = props;
  const list = useKeyedList(block.images, (images) => onChange({ ...block, images }));
  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex items-center gap-2">
        <legend className="mb-1 type-label text-fg-muted">Columns</legend>
        {([1, 2, 3] as const).map((columns) => (
          <label key={columns} className="flex items-center gap-1 type-body">
            <input type="radio" name={`columns-${block.id}`} checked={(block.columns ?? 1) === columns} onChange={() => onChange({ ...block, columns })} />
            {columns}
          </label>
        ))}
      </fieldset>
      <span className="type-label text-fg-muted">Images</span>
      <SortableList keys={list.keys} onMove={list.move}>
        {(index, controls) => {
          const image = block.images[index];
          const key = image.image ?? imageKey(slug, image.id);
          const update = (next: WorkImage) => list.update(index, next);
          return (
            <ImageCard
              image={image}
              imageKey={key}
              entry={entries[key]}
              controls={controls}
              locked={lockedImages.has(image.id)}
              takenIds={pageImageIds.filter((id) => id !== image.id)}
              issues={issuesAt(issues, docKey, `${block.id}/${image.id}`)}
              uploadSlot={props.renderUpload?.(image, update)}
              onChange={update}
              onRemove={() => {
                const question = image.pin ? `Remove ${image.caption || image.id}? It leaves Selected work.` : `Remove ${image.caption || image.id}?`;
                if (window.confirm(question)) list.remove(index);
              }}
            />
          );
        }}
      </SortableList>
      <AddButton onClick={() => list.insert(block.images.length, { id: uniqueId("", pageImageIds, "image") })}>Add image</AddButton>
    </div>
  );
}
```

`components/admin/page-editor/add-block.tsx`:

```tsx
"use client";

import type { Block, ProductPage } from "@/content/work/types";
import { AddButton } from "../fields";

// "+ Add block": text, images, then (only while the page has none; it goes
// first) and icons (PrimeIcons only, at most one).
export function AddBlock({ page, onAdd }: { page: ProductPage; onAdd: (kind: Block["kind"]) => void }) {
  const hasThen = page.blocks.some((block) => block.kind === "then");
  const hasIcons = page.blocks.some((block) => block.kind === "icons");
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      <AddButton onClick={() => onAdd("text")}>Text</AddButton>
      <AddButton onClick={() => onAdd("images")}>Images</AddButton>
      {hasThen ? null : <AddButton onClick={() => onAdd("then")}>Then</AddButton>}
      {page.slug === "primeicons" && !hasIcons ? <AddButton onClick={() => onAdd("icons")}>Icon set</AddButton> : null}
    </div>
  );
}
```

- [ ] **Step 8: Create the page editor.** `components/admin/page-editor/page-editor.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePageAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { Block, ProductPage } from "@/content/work/types";
import type { DocEditorInit } from "@/lib/admin/results";
import { uniqueId } from "@/lib/content/ids";
import type { ImageEntry } from "@/lib/images/plan";
import { pageImages } from "@/lib/work/derive";
import { EditorFrame } from "../editor-frame";
import { SortableList } from "../sortable-list";
import { useDocEditor } from "../use-doc-editor";
import { useKeyedList } from "../use-keyed-list";
import { AddBlock } from "./add-block";
import { BlockCard, blockLabel } from "./block-card";
import { HeaderFields } from "./header-fields";

export interface PageEditorProps {
  init: DocEditorInit<ProductPage>;
  locked: { blocks: string[]; images: string[] };
  entries: Record<string, ImageEntry>;
  live: boolean;
  hasRepo: boolean;
}

// A product page's editor (spec §2.3): header fields, then the blocks as
// collapsible, reorderable cards; the open card is the one the preview outlines.
export function PageEditor({ init, locked, entries: initialEntries, live, hasRepo }: PageEditorProps) {
  const router = useRouter();
  const editor = useDocEditor(init);
  const page = editor.value;
  // Task 12 turns this into state so uploads can add entries.
  const entries = initialEntries;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const set = (patch: Partial<ProductPage>) => editor.setValue((previous) => ({ ...previous, ...patch }));
  const blocks = useKeyedList(page.blocks, (next) => set({ blocks: next }));
  const lockedBlocks = new Set(locked.blocks);
  const lockedImages = new Set(locked.images);
  const pageImageIds = pageImages(page).map((image) => image.id);
  const openIndex = openKey ? blocks.keys.indexOf(openKey) : -1;
  const focusId = openIndex >= 0 ? page.blocks[openIndex].id : null;

  function addBlock(kind: Block["kind"]) {
    const taken = page.blocks.map((block) => block.id);
    const block: Block =
      kind === "text"
        ? { kind, id: uniqueId("", taken, "block"), heading: "", body: [""] }
        : kind === "images"
          ? { kind, id: uniqueId("", taken, "images"), columns: 3, images: [] }
          : kind === "then"
            ? { kind, id: uniqueId("then", taken, "then"), year: "", body: [""] }
            : { kind, id: uniqueId("icon-set", taken, "icon-set") };
    setOpenKey(blocks.insert(kind === "then" ? 0 : page.blocks.length, block));
  }

  function removeBlock(index: number) {
    const block = page.blocks[index];
    const pinned = block.kind === "images" && block.images.some((image) => image.pin);
    const question = pinned ? `Delete "${blockLabel(block)}"? Its pinned image leaves Selected work.` : `Delete "${blockLabel(block)}"?`;
    if (window.confirm(question)) blocks.remove(index);
  }

  async function deletePage() {
    if (!window.confirm(`Delete ${page.title}? It leaves the site at once.`)) return;
    await editor.flush();
    const result = await deletePageAction(page.slug);
    if (result.status === "ok") router.push("/admin/");
    else if (result.status === "invalid") editor.report(result.issues);
    else editor.report([{ doc: init.docKey, at: "", message: result.status === "unauthorized" ? "signed out" : "the database is unavailable" }]);
  }

  const extra = (
    <>
      {hasRepo && editor.publishedAt ? (
        <Button variant="text" onClick={() => void editor.reset()}>
          Reset to repo version
        </Button>
      ) : null}
      <Button variant="text" onClick={() => void deletePage()}>
        Delete page
      </Button>
    </>
  );

  return (
    <EditorFrame
      crumbs={["Work", page.title || page.slug]}
      editor={editor}
      preview={`/admin/preview/work/${page.slug}/`}
      focusId={focusId}
      openHref={live ? `/work/${page.slug}/` : undefined}
      extraActions={extra}
    >
      <div className="flex flex-col gap-6">
        {live ? null : <p className="border border-line px-3 py-2 type-meta text-fg-muted">New page: not on the site until you publish it.</p>}
        <HeaderFields page={page} docKey={init.docKey} issues={editor.issues} onChange={set} />
        <section className="flex flex-col gap-2">
          <h2 className="type-label text-fg-muted">Blocks</h2>
          <SortableList
            keys={blocks.keys}
            onMove={blocks.move}
            // The then block stays first.
            canMove={(from, to) => page.blocks[from].kind !== "then" && !(page.blocks[0]?.kind === "then" && to === 0)}
          >
            {(index, controls) => {
              const block = page.blocks[index];
              return (
                <BlockCard
                  block={block}
                  index={index}
                  docKey={init.docKey}
                  slug={page.slug}
                  primetek={page.org === "primetek"}
                  controls={controls}
                  open={openKey === blocks.keys[index]}
                  locked={lockedBlocks.has(block.id)}
                  takenBlockIds={page.blocks.filter((_, i) => i !== index).map((item) => item.id)}
                  lockedImages={lockedImages}
                  pageImageIds={pageImageIds}
                  entries={entries}
                  issues={editor.issues}
                  onToggle={() => setOpenKey(openKey === blocks.keys[index] ? null : blocks.keys[index])}
                  onChange={(next) => blocks.update(index, next)}
                  onRemove={() => removeBlock(index)}
                />
              );
            }}
          </SortableList>
          <AddBlock page={page} onAdd={addBlock} />
        </section>
      </div>
    </EditorFrame>
  );
}
```


- [ ] **Step 9: Create the routes and the new-page form.** First `app/admin/(console)/work/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { PageEditor } from "@/components/admin/page-editor/page-editor";
import type { ProductPage } from "@/content/work/types";
import { loadDoc, loadPageContext } from "@/lib/admin/load";
import type { DocEditorInit } from "@/lib/admin/results";
import { requireAdminPage } from "@/lib/auth/admin";
import { lockedIds } from "@/lib/content/ids";
import { workKey } from "@/lib/content/keys";
import { repoValue } from "@/lib/content/site";

// Uploads render renditions in a server action of this page.
export const maxDuration = 60;

export default function WorkEditorPage(props: PageProps<"/admin/work/[slug]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate params={props.params} />
    </Suspense>
  );
}

async function Gate({ params }: Pick<PageProps<"/admin/work/[slug]">, "params">) {
  const { slug } = await params;
  await requireAdminPage(`/admin/work/${slug}/`);
  const loaded = await loadDoc<ProductPage | null>(workKey(slug));
  if (!loaded.value) notFound();
  const { entries, live } = await loadPageContext(loaded.value);
  return (
    <PageEditor
      init={loaded as DocEditorInit<ProductPage>}
      locked={lockedIds(loaded.baseline)}
      entries={entries}
      live={live}
      hasRepo={repoValue(workKey(slug)) !== null}
    />
  );
}
```

`components/admin/new-page-form.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { createPageAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { OrgId } from "@/content/orgs";
import { kebab } from "@/lib/content/ids";
import type { Issue } from "@/lib/content/issues";
import { IssueText, SelectField, TextField } from "./fields";

// /admin/work/new/: slug (permanent), org, title and kind; creates a draft and
// opens its editor. Nothing is live until the first Publish.
export function NewPageForm({ orgs }: { orgs: { id: OrgId; name: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [typedSlug, setTypedSlug] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgId>("orkestra");
  const [kind, setKind] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pending, start] = useTransition();
  const slug = typedSlug ?? kebab(title);
  const at = (path: string) => issues.filter((issue) => issue.at === path);

  function submit(event: FormEvent) {
    event.preventDefault();
    start(async () => {
      const result = await createPageAction({ slug, org, title, kind });
      if (result.status === "ok") router.push(`/admin/work/${result.slug}/`);
      else if (result.status === "invalid") setIssues(result.issues);
      else setIssues([{ doc: "work-index", at: "", message: result.status === "unauthorized" ? "Signed out — sign in again." : "The database is unavailable." }]);
    });
  }

  return (
    <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 py-8">
      <h1 className="type-lead">New page</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextField label="Title" value={title} onChange={setTitle} issues={at("title")} />
        <TextField label="Slug" value={slug} onChange={setTypedSlug} hint={`/work/${slug || "…"}/ · permanent`} issues={at("slug")} />
        <SelectField label="Organisation" value={org} options={orgs.map((item) => ({ value: item.id, label: item.name }))} onChange={setOrg} />
        <TextField label="Kind" value={kind} onChange={setKind} hint="A few words, e.g. word game" />
        <IssueText issues={issues.filter((issue) => !["title", "slug"].includes(issue.at))} />
        <div>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Creating…" : "Create draft"}
          </Button>
        </div>
      </form>
    </main>
  );
}
```

`app/admin/(console)/work/new/page.tsx`:

```tsx
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { NewPageForm } from "@/components/admin/new-page-form";
import { ORGS, type OrgId } from "@/content/orgs";
import { requireAdminPage } from "@/lib/auth/admin";

export default function NewPagePage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/work/new/");
  return <NewPageForm orgs={Object.entries(ORGS).map(([id, org]) => ({ id: id as OrgId, name: org.name }))} />;
}
```

- [ ] **Step 10: Run everything and check it by hand.**
  - Run `npm run typecheck && npm run lint && npm test && npm run build`. Expected: PASS.
  - Signed in on the dev server (as in Task 10), open `/admin/work/nebuu/` and check:
    1. The header fields are filled.
    2. Opening "Highlights" outlines it in the preview and scrolls there.
    3. The ids of existing blocks show "· locked" and their Id field is disabled.
    4. "+ Text" adds an open "Untitled" card at the end whose id is `block`. Typing the heading "Press" changes the id to `press`.
    5. The then block's ↑ is disabled, and the "What I did" block's ↑ is disabled because the then block is first.
    6. Delete "Editions" (confirm), then Publish: `/work/nebuu/` loses Editions and gains Press.
    7. On a PrimeTek page (`/admin/work/primeone/`) there are no link fields.
  - Then `/admin/work/new/`: create "Test Page" (slug `test-page`, Orkestra). The editor says "New page: not on the site…", and Publish lists the intro and Years issues. Fill them, publish, and `/work/test-page/` renders. Delete the page: it leaves the admin home and `/work/test-page/` 404s.
  - Freeze-frame a block drag mid-move.
  - Check 390px tabs.

- [ ] **Step 11: Commit.**

```bash
git add lib/content/ids.ts lib/admin components/admin app/admin tests
git commit -m "Add the product page editor with block cards, new pages and page removal

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Image uploads into the slots

**Files:**
- Modify: `package.json` (add `@vercel/blob`, move `sharp` to `dependencies`), `scripts/images.ts`, `app/admin/actions.ts`, `components/admin/page-editor/page-editor.tsx`, `app/admin/(console)/work/[slug]/page.tsx`
- Create:
  - `lib/images/encode.ts`, `lib/media/rules.ts`, `lib/media/storage.ts`, `lib/media/process.ts`;
  - `app/api/admin/upload/route.ts`, `app/api/admin/upload-dev/route.ts`, `app/api/media-dev/[...path]/route.ts`;
  - `components/admin/page-editor/upload-slot.tsx`, `components/admin/page-editor/upload.ts`
- Test: `tests/media/rules.test.ts`, `tests/media/process.test.ts`, `tests/media/storage.test.ts`

**Interfaces:**
- Consumes: `MediaRecord`, `ContentStore.putMedia` (Task 4); `toMediaEntry`, `MediaEntry` (Task 5); `isAdmin` (Task 6); `ImageCard`'s `uploadSlot` and `BlockCard`'s `renderUpload` (Task 11).
- Produces:
  - `encodeRendition(input, width, format): Promise<Buffer>`;
  - from `lib/media/rules.ts`: `MIN_WIDTH = 1280`, `MAX_BYTES = 25 MB`, `UPLOAD_TYPES`, `checkDimensions(width, height): string | null`, `checkType(type): string | null`;
  - `MediaStorage { mode; saveSource; readSource; deleteSource; putFile; resolveLocal }`, `LocalMediaStorage`, `BlobMediaStorage`, `getMediaStorage()`, `uploadMode(): "blob" | "local" | null`;
  - `processImage(input, target, storage, now): Promise<{ ok: true; record: MediaRecord } | { ok: false; reason: string }>`;
  - `processUploadAction({ source, slug, imageId }): Promise<ActionResult<{ key: string; entry: MediaEntry }>>`;
  - `uploadImage(file, target, mode)`, `UploadSlot`.

- [ ] **Step 1: Dependencies.** Run `npm install @vercel/blob@2.8.0 --save-exact`. Then move `"sharp": "0.35.5"` from `devDependencies` to `dependencies` in `package.json`, because the server now renders uploads at runtime. Run `npm install` to refresh the lockfile.

- [ ] **Step 2: Write the failing tests.** Create `tests/media/rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { checkDimensions, checkType } from "@/lib/media/rules";

describe("upload rules", () => {
  it("accept 16:10 within 1% from 1280px wide", () => {
    expect(checkDimensions(2560, 1600)).toBeNull();
    expect(checkDimensions(1280, 800)).toBeNull();
    expect(checkDimensions(2560, 1590)).toBeNull();
  });
  it("reject other ratios and small images with the reason", () => {
    expect(checkDimensions(1600, 1200)).toBe("The image is 1600×1200; it must be 16:10, for example 2560×1600.");
    expect(checkDimensions(1000, 625)).toBe("The image is 1000px wide; it needs at least 1280px.");
  });
  it("accept PNG and JPEG only", () => {
    expect(checkType("image/png")).toBeNull();
    expect(checkType("image/jpeg")).toBeNull();
    expect(checkType("image/gif")).toBe("Use a PNG or JPEG.");
  });
});
```

  Create `tests/media/process.test.ts`:

```ts
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { IMAGE_SETTINGS } from "@/lib/images/plan";
import { processImage } from "@/lib/media/process";
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

describe("processImage", () => {
  it("renders AVIF and JPEG renditions and describes them", async () => {
    const storage = memory();
    const result = await processImage(await png(1280, 800), { slug: "nebuu", imageId: "cards" }, storage, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { record } = result;
    expect(record.key).toMatch(/^media\/work\/nebuu\/cards-[0-9a-f]{8}$/);
    expect(record).toMatchObject({ width: 1280, height: 800, widths: [640, 1280], settings: IMAGE_SETTINGS, createdAt: now });
    expect(record.baseUrl).toBe(`https://cdn.test/${record.key}`);
    expect([...storage.files.keys()].sort()).toEqual(
      [640, 1280].flatMap((w) => [`${record.key}-${w}.avif`, `${record.key}-${w}.jpg`]).sort(),
    );
    expect((await sharp(storage.files.get(`${record.key}-640.jpg`)!).metadata()).width).toBe(640);
  });

  it("rejects a 4:3 image and an unreadable file, writing nothing", async () => {
    const storage = memory();
    expect(await processImage(await png(1600, 1200), { slug: "nebuu", imageId: "cards" }, storage, now)).toEqual({
      ok: false,
      reason: "The image is 1600×1200; it must be 16:10, for example 2560×1600.",
    });
    expect(await processImage(Buffer.from("not an image"), { slug: "nebuu", imageId: "cards" }, storage, now)).toEqual({
      ok: false,
      reason: "The file is not a readable image.",
    });
    expect(storage.files.size).toBe(0);
  });
});
```

  Create `tests/media/storage.test.ts`:

```ts
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BlobMediaStorage, LocalMediaStorage } from "@/lib/media/storage";

describe("LocalMediaStorage", () => {
  const dir = mkdtempSync(join(tmpdir(), "media-"));
  const storage = new LocalMediaStorage(dir);

  it("keeps uploads and renditions inside its folder and serves them from /api/media-dev/", async () => {
    const source = await storage.saveSource(Buffer.from("png"), "image/png");
    expect(source).toMatch(/^local:uploads\/[0-9a-f-]+\.png$/);
    expect((await storage.readSource(source)).toString()).toBe("png");
    expect(await storage.putFile("media/work/nebuu/a-1-640.jpg", Buffer.from("jpg"), "image/jpeg")).toBe("/api/media-dev/media/work/nebuu/a-1-640.jpg");
    expect(readFileSync(join(dir, "media/work/nebuu/a-1-640.jpg"), "utf8")).toBe("jpg");
    await storage.deleteSource(source);
    await expect(storage.readSource(source)).rejects.toThrow();
  });

  it("refuses paths that leave its folder", async () => {
    expect(storage.resolveLocal("../etc/passwd")).toBeNull();
    await expect(storage.readSource("local:../secret")).rejects.toThrow();
    await expect(storage.readSource("https://evil.test/x.png")).rejects.toThrow();
  });
});

describe("BlobMediaStorage", () => {
  it("only reads public Blob URLs", async () => {
    await expect(new BlobMediaStorage().readSource("https://evil.test/x.png")).rejects.toThrow("not a Blob URL");
  });
});
```

- [ ] **Step 3: Run them to make sure they fail.** Run `npx vitest run tests/media`. Expected: FAIL, because the modules don't exist yet.

- [ ] **Step 4: Share the encoder.** Create `lib/images/encode.ts`:

```ts
import sharp from "sharp";

// The one encoder behind `npm run images` and admin uploads. IMAGE_SETTINGS
// (plan.ts) names these options; change both together.
export async function encodeRendition(input: Buffer | string, width: number, format: "avif" | "jpg"): Promise<Buffer> {
  const resized = sharp(input).rotate().resize({ width, withoutEnlargement: true });
  return format === "avif"
    ? resized.avif({ quality: 60, chromaSubsampling: "4:2:0" }).toBuffer()
    : resized.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
}
```

  In `scripts/images.ts`:
  - import `encodeRendition` from `"../lib/images/encode"`;
  - add `writeFileSync` to the existing `node:fs` import if it isn't there yet;
  - replace the body of the `for (const w of widths)` loop with:

```ts
    for (const w of widths) {
      writeFileSync(join(OUT_DIR, `${key}-${w}.avif`), await encodeRendition(source, w, "avif"));
      writeFileSync(join(OUT_DIR, `${key}-${w}.jpg`), await encodeRendition(source, w, "jpg"));
    }
```

  Run `npm run images`. Expected: every line reads `skip …` (hashes and settings are unchanged) and `git status` shows no image changes.

- [ ] **Step 5: Create the media modules.** First `lib/media/rules.ts`:

```ts
// Upload rules (spec §3.1), shared by the browser pre-check and the server.
export const MIN_WIDTH = 1280;
export const MAX_BYTES = 25 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/png", "image/jpeg"] as const;
const RATIO = 16 / 10;
const TOLERANCE = 0.01;

export function checkType(type: string): string | null {
  return (UPLOAD_TYPES as readonly string[]).includes(type) ? null : "Use a PNG or JPEG.";
}

export function checkDimensions(width: number, height: number): string | null {
  if (Math.abs(width / height - RATIO) / RATIO > TOLERANCE) return `The image is ${width}×${height}; it must be 16:10, for example 2560×1600.`;
  if (width < MIN_WIDTH) return `The image is ${width}px wide; it needs at least ${MIN_WIDTH}px.`;
  return null;
}
```

`lib/media/storage.ts`:

```ts
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { del, put } from "@vercel/blob";

// Where uploads and renditions live (spec §3.3): Vercel Blob in production,
// a local folder served by /api/media-dev/ in development and the admin e2e.
export interface MediaStorage {
  mode: "blob" | "local";
  // Local only: keep an uploaded original and return its source reference.
  saveSource(bytes: Buffer, type: string): Promise<string>;
  readSource(source: string): Promise<Buffer>;
  deleteSource(source: string): Promise<void>;
  // Stores a rendition and returns its public URL.
  putFile(pathname: string, body: Buffer, contentType: string): Promise<string>;
  // Local only: the absolute file for a path inside the folder, else null.
  resolveLocal(pathname: string): string | null;
}

export class LocalMediaStorage implements MediaStorage {
  readonly mode = "local" as const;
  constructor(private dir: string) {}

  resolveLocal(pathname: string): string | null {
    const root = resolve(this.dir);
    const file = resolve(root, pathname);
    return file.startsWith(root + sep) ? file : null;
  }

  async saveSource(bytes: Buffer, type: string): Promise<string> {
    const name = `uploads/${randomUUID()}.${type === "image/png" ? "png" : "jpg"}`;
    const file = this.resolveLocal(name)!;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, bytes);
    return `local:${name}`;
  }

  private sourceFile(source: string): string {
    const file = source.startsWith("local:uploads/") ? this.resolveLocal(source.slice("local:".length)) : null;
    if (!file) throw new Error("not a local upload");
    return file;
  }

  async readSource(source: string): Promise<Buffer> {
    return readFileSync(this.sourceFile(source));
  }

  async deleteSource(source: string): Promise<void> {
    const file = this.sourceFile(source);
    if (existsSync(file)) rmSync(file);
  }

  async putFile(pathname: string, body: Buffer): Promise<string> {
    const file = this.resolveLocal(pathname);
    if (!file) throw new Error(`bad path ${pathname}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, body);
    return `/api/media-dev/${pathname}`;
  }
}

export class BlobMediaStorage implements MediaStorage {
  readonly mode = "blob" as const;

  async saveSource(): Promise<string> {
    throw new Error("Blob uploads go straight from the browser");
  }

  private url(source: string): URL {
    const url = new URL(source);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com")) throw new Error("not a Blob URL");
    return url;
  }

  async readSource(source: string): Promise<Buffer> {
    const response = await fetch(this.url(source));
    if (!response.ok) throw new Error(`reading the upload failed: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  async deleteSource(source: string): Promise<void> {
    await del(this.url(source).toString());
  }

  async putFile(pathname: string, body: Buffer, contentType: string): Promise<string> {
    const blob = await put(pathname, body, { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType, cacheControlMaxAge: 31_536_000 });
    return blob.url;
  }

  resolveLocal(): string | null {
    return null;
  }
}

// Blob when its token is set; the local folder off Vercel; on Vercel without
// a token there is no storage and uploads are off.
export function uploadMode(): "blob" | "local" | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return process.env.VERCEL ? null : "local";
}

export function getMediaStorage(): MediaStorage {
  const mode = uploadMode();
  if (mode === "blob") return new BlobMediaStorage();
  if (mode === "local") return new LocalMediaStorage(process.env.MEDIA_DEV_DIR ?? ".media-dev");
  throw new Error("BLOB_READ_WRITE_TOKEN is not set");
}
```

`lib/media/process.ts`:

```ts
import { createHash } from "node:crypto";
import sharp from "sharp";
import type { MediaRecord } from "@/lib/content/store";
import { encodeRendition } from "@/lib/images/encode";
import { IMAGE_SETTINGS, widthsFor } from "@/lib/images/plan";
import { checkDimensions } from "./rules";
import type { MediaStorage } from "./storage";

export interface UploadTarget {
  slug: string;
  imageId: string;
}

// Checks an uploaded original and renders its renditions (the same widths and
// encoder as `npm run images`) into storage. Nothing is written for a
// rejected file; the caller records the returned MediaRecord.
export async function processImage(
  input: Buffer,
  target: UploadTarget,
  storage: MediaStorage,
  now: Date,
): Promise<{ ok: true; record: MediaRecord } | { ok: false; reason: string }> {
  let width: number | undefined;
  let height: number | undefined;
  let format: string | undefined;
  try {
    const meta = await sharp(input).rotate().metadata();
    width = meta.autoOrient?.width ?? meta.width;
    height = meta.autoOrient?.height ?? meta.height;
    format = meta.format;
  } catch {
    return { ok: false, reason: "The file is not a readable image." };
  }
  if (!width || !height) return { ok: false, reason: "The file is not a readable image." };
  if (format !== "png" && format !== "jpeg") return { ok: false, reason: "Use a PNG or JPEG." };
  const problem = checkDimensions(width, height);
  if (problem) return { ok: false, reason: problem };

  const sourceHash = createHash("sha256").update(input).digest("hex");
  const key = `media/work/${target.slug}/${target.imageId}-${sourceHash.slice(0, 8)}`;
  const widths = widthsFor(width);
  let baseUrl = "";
  for (const w of widths) {
    for (const ext of ["avif", "jpg"] as const) {
      const suffix = `-${w}.${ext}`;
      const url = await storage.putFile(`${key}${suffix}`, await encodeRendition(input, w, ext), ext === "avif" ? "image/avif" : "image/jpeg");
      baseUrl = url.slice(0, -suffix.length);
    }
  }
  const largest = widths[widths.length - 1];
  return {
    ok: true,
    record: { key, baseUrl, width: largest, height: Math.round((height * largest) / width), widths, sourceHash, settings: IMAGE_SETTINGS, createdAt: now },
  };
}
```

- [ ] **Step 6: Run the media tests.** Run `npx vitest run tests/media`. Expected: PASS.

- [ ] **Step 7: Create the upload routes.** First `app/api/admin/upload/route.ts`:

```ts
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { isAdmin } from "@/lib/auth/admin";
import { MAX_BYTES, UPLOAD_TYPES } from "@/lib/media/rules";

// Issues the browser a short-lived token to upload one original straight to
// Blob (spec §3.1): the file never passes through a function, so the 4.5 MB
// body limit doesn't apply. Signed-in admins only, uploads/ only.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAdmin())) throw new Error("unauthorized");
        if (!pathname.startsWith("uploads/")) throw new Error("uploads go under uploads/");
        return { allowedContentTypes: [...UPLOAD_TYPES], maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
      },
    });
    return Response.json(json);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "upload refused" }, { status: 400 });
  }
}
```

`app/api/admin/upload-dev/route.ts`:

```ts
import { isAdmin } from "@/lib/auth/admin";
import { checkType, MAX_BYTES } from "@/lib/media/rules";
import { getMediaStorage, uploadMode } from "@/lib/media/storage";

// The local stand-in for Blob client uploads (dev and the admin e2e). 404 on
// Vercel and whenever Blob is configured.
export async function POST(request: Request) {
  if (uploadMode() !== "local") return new Response("Not found", { status: 404 });
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const type = request.headers.get("content-type") ?? "";
  const typeProblem = checkType(type);
  if (typeProblem) return Response.json({ error: typeProblem }, { status: 415 });
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length > MAX_BYTES) return Response.json({ error: "The file is larger than 25 MB." }, { status: 413 });
  return Response.json({ source: await getMediaStorage().saveSource(bytes, type) });
}
```

`app/api/media-dev/[...path]/route.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { getMediaStorage, uploadMode } from "@/lib/media/storage";

const TYPES: Record<string, string> = { avif: "image/avif", jpg: "image/jpeg" };

// Serves local renditions (next start only serves public/ files that existed
// at build time). 404 on Vercel and whenever Blob is configured.
export async function GET(_request: Request, { params }: RouteContext<"/api/media-dev/[...path]">) {
  if (uploadMode() !== "local") return new Response("Not found", { status: 404 });
  const { path } = await params;
  const file = getMediaStorage().resolveLocal(path.join("/"));
  const type = TYPES[path.at(-1)?.split(".").pop() ?? ""];
  if (!file || !type || !existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(file), { headers: { "content-type": type, "cache-control": "no-store" } });
}
```

- [ ] **Step 8: Add the processing action.** Append to `app/admin/actions.ts`, with these imports:
  - `import { getMediaStorage } from "@/lib/media/storage";`;
  - `import { processImage } from "@/lib/media/process";`;
  - `import { type MediaEntry } from "@/lib/images/lookup";` (merge it with the existing lookup import);
  - `import { KEBAB, workKey } from "@/lib/content/keys";` (merge it with the existing keys import).

```ts
// After the browser uploaded an original: check it, render the renditions,
// record them. The original is deleted either way; the draft then points the
// image at the returned key (the client does that).
export async function processUploadAction(input: { source: string; slug: string; imageId: string }): Promise<ActionResult<{ key: string; entry: MediaEntry }>> {
  const where = { doc: workKey(input.slug), at: `upload/${input.imageId}` };
  if (!KEBAB.test(input.slug) || !KEBAB.test(input.imageId)) return { status: "invalid", issues: [{ ...where, message: "the image needs a kebab-case id first" }] };
  return run(async (store) => {
    const storage = getMediaStorage();
    let bytes: Buffer;
    try {
      bytes = await storage.readSource(input.source);
    } catch {
      return { status: "invalid", issues: [{ ...where, message: "The upload could not be read. Try again." }] };
    }
    const result = await processImage(bytes, input, storage, new Date());
    await storage.deleteSource(input.source).catch(() => undefined);
    if (!result.ok) return { status: "invalid", issues: [{ ...where, message: result.reason }] };
    await store.putMedia(result.record);
    return { status: "ok", key: result.record.key, entry: toMediaEntry(result.record) };
  });
}
```

- [ ] **Step 9: Create the client upload.** First `components/admin/page-editor/upload.ts`:

```ts
"use client";

import { upload } from "@vercel/blob/client";
import { processUploadAction } from "@/app/admin/actions";
import type { ActionResult } from "@/lib/admin/results";
import type { MediaEntry } from "@/lib/images/lookup";
import { MAX_BYTES, checkDimensions, checkType } from "@/lib/media/rules";

type UploadResult = ActionResult<{ key: string; entry: MediaEntry }>;

function refused(message: string, slug: string, imageId: string): UploadResult {
  return { status: "invalid", issues: [{ doc: `work/${slug}`, at: `upload/${imageId}`, message }] };
}

// Checks the file in the browser first (type, size, 16:10), so a wrong file
// is never uploaded; then uploads the original (Blob, or the local route) and
// asks the server to render it. The server checks everything again.
export async function uploadImage(file: File, target: { slug: string; imageId: string }, mode: "blob" | "local"): Promise<UploadResult> {
  const typeProblem = checkType(file.type);
  if (typeProblem) return refused(typeProblem, target.slug, target.imageId);
  if (file.size > MAX_BYTES) return refused("The file is larger than 25 MB.", target.slug, target.imageId);
  const bitmap = await createImageBitmap(file);
  const sizeProblem = checkDimensions(bitmap.width, bitmap.height);
  bitmap.close();
  if (sizeProblem) return refused(sizeProblem, target.slug, target.imageId);

  let source: string;
  if (mode === "blob") {
    const extension = file.type === "image/png" ? "png" : "jpg";
    const blob = await upload(`uploads/${target.slug}/${target.imageId}.${extension}`, file, {
      access: "public",
      handleUploadUrl: "/api/admin/upload/",
      contentType: file.type,
    });
    source = blob.url;
  } else {
    const response = await fetch("/api/admin/upload-dev/", { method: "POST", headers: { "content-type": file.type }, body: file });
    if (response.status === 401) return { status: "unauthorized" };
    const data = (await response.json()) as { source?: string; error?: string };
    if (!response.ok || !data.source) return refused(data.error ?? "The upload failed. Try again.", target.slug, target.imageId);
    source = data.source;
  }
  return processUploadAction({ source, ...target });
}
```

`components/admin/page-editor/upload-slot.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { MediaEntry } from "@/lib/images/lookup";
import { cx } from "@/lib/cx";
import { uploadImage } from "./upload";

// Drop a file on the 16:10 area or pick one. On success the image points at
// the new upload; the error reason stays under the slot until the next try.
export function UploadSlot({
  slug,
  imageId,
  mode,
  hasImage,
  onUploaded,
}: {
  slug: string;
  imageId: string;
  mode: "blob" | "local" | null;
  hasImage: boolean;
  onUploaded: (key: string, entry: MediaEntry) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!mode) return <p className="type-meta text-fg-muted">Uploads are off: no media store is configured.</p>;

  async function handle(file: File | undefined) {
    if (!file || !mode) return;
    setBusy(true);
    setError(null);
    try {
      const result = await uploadImage(file, { slug, imageId }, mode);
      if (result.status === "ok") onUploaded(result.key, result.entry);
      else if (result.status === "invalid") setError(result.issues.map((issue) => issue.message).join(" "));
      else setError(result.status === "unauthorized" ? "Signed out — sign in again." : "The upload failed. Try again.");
    } catch {
      setError("The upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void handle(event.dataTransfer.files[0]);
        }}
        className={cx(
          "flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-line p-3 text-center type-meta text-fg-muted",
          over && "border-accent text-accent",
        )}
      >
        <span>{busy ? "Uploading…" : hasImage ? "Drop a new image to replace it, or pick one" : "Drop a 16:10 PNG or JPEG, or pick one"}</span>
        <span className="type-label">2560×1600 recommended · at least 1280px wide</span>
        <input type="file" accept="image/png,image/jpeg" aria-label="Upload image" disabled={busy} className="sr-only" onChange={(event) => void handle(event.target.files?.[0])} />
      </label>
      {error ? (
        <p role="alert" className="mt-1 type-meta text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 10: Wire uploads into the page editor.**
  - In `components/admin/page-editor/page-editor.tsx`:
    - add `uploadMode: "blob" | "local" | null` to `PageEditorProps` and destructure it;
    - import `UploadSlot`, and add `WorkImage` to the `@/content/work/types` import;
    - replace `const entries = initialEntries;` (and its comment) with `const [entries, setEntries] = useState(initialEntries);`;
    - pass this to every `BlockCard`:

```tsx
renderUpload={(image: WorkImage, update: (image: WorkImage) => void) => (
  <UploadSlot
    slug={page.slug}
    imageId={image.id}
    mode={uploadMode}
    hasImage={Boolean(image.image)}
    onUploaded={(key, entry) => {
      setEntries((current) => ({ ...current, [key]: entry }));
      update({ ...image, image: key });
    }}
  />
)}
```

  - In `app/admin/(console)/work/[slug]/page.tsx`, import `uploadMode` from `@/lib/media/storage` and pass `uploadMode={uploadMode()}` to `PageEditor`.

- [ ] **Step 11: Run everything and check it by hand.**
  - Run `npm run typecheck && npm run lint && npm test && npm run build`. Expected: PASS.
  - On the signed-in dev server, open `/admin/work/nebuu/` → Highlights → "cards" and check:
    1. Upload a 2560×1600 PNG (make one with `npx tsx -e "require('sharp')({create:{width:2560,height:1600,channels:3,background:'#888'}}).png().toFile('/tmp/wide.png')"`): "Uploading…", then the thumbnail appears, and the preview shows the image in the slot instead of the dither.
    2. A 1600×1200 file shows "The image is 1600×1200; it must be 16:10…" under the slot and uploads nothing.
    3. Publish: `/work/nebuu/` shows the image, its `<img>` src points at `/api/media-dev/media/work/nebuu/cards-…-2560.jpg`, and the AVIF source lists 640/1280/2560.
    4. "Use the placeholder" + Publish brings the dither back.

- [ ] **Step 12: Commit.**

```bash
git add package.json package-lock.json lib/images lib/media scripts/images.ts app/api/admin app/api/media-dev app/admin components/admin tests/media
git commit -m "Upload 16:10 images into product page slots with Blob and server-side renditions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 13: Bio and Experience editors

**Files:**
- Create:
  - `lib/content/bio-tokens.ts`, `tests/content/bio-tokens.test.ts`;
  - `components/admin/bio-editor.tsx`, `components/admin/experience-editor.tsx`;
  - `app/admin/(console)/bio/page.tsx`, `app/admin/(console)/experience/page.tsx`
- Modify: `lib/admin/load.ts` (add `loadPageOptions`)

**Interfaces:**
- Consumes: the editor framework (Task 10); `ProfileCopy` (Task 2); `ExperienceEntry`, `formatSpan` (existing).
- Produces:
  - `bioToText(segments: BioSegment[]): string` and `textToBio(text: string): BioSegment[]`. An organisation is the token `{orgId}`, and unknown tokens stay as text;
  - `loadPageOptions(): Promise<{ href: string; title: string }[]>`, which lists the published pages.

- [ ] **Step 1: Write the failing test.** Create `tests/content/bio-tokens.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { profile } from "@/content/profile";
import { bioToText, textToBio } from "@/lib/content/bio-tokens";

describe("bio tokens", () => {
  it("writes organisations as {org} tokens and reads them back", () => {
    expect(bioToText(["At ", { org: "primetek" }, " for ten years."])).toBe("At {primetek} for ten years.");
    expect(textToBio("At {primetek} for ten years.")).toEqual(["At ", { org: "primetek" }, " for ten years."]);
    expect(textToBio("{orkestra}{bilkent}")).toEqual([{ org: "orkestra" }, { org: "bilkent" }]);
  });

  it("keeps unknown tokens as text so validation can name them", () => {
    expect(textToBio("At {acme}.")).toEqual(["At {acme}."]);
  });

  it("round-trips the repo bio", () => {
    for (const paragraph of profile.bio) expect(textToBio(bioToText(paragraph))).toEqual(paragraph);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails, then create `lib/content/bio-tokens.ts`.** Run `npx vitest run tests/content/bio-tokens.test.ts`. Expected: FAIL. Then create the module:

```ts
import { ORGS, type OrgId } from "@/content/orgs";
import type { BioSegment } from "@/content/profile";

// The bio editor's text form (spec §2.4): an organisation mark is {orgId}.
// Unknown tokens stay as plain text; validateSite reports them on publish.

export function bioToText(segments: BioSegment[]): string {
  return segments.map((segment) => (typeof segment === "string" ? segment : `{${segment.org}}`)).join("");
}

export function textToBio(text: string): BioSegment[] {
  const segments: BioSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(/\{([a-z]+)\}/g)) {
    if (!(match[1] in ORGS)) continue;
    if (match.index > last) segments.push(text.slice(last, match.index));
    segments.push({ org: match[1] as OrgId });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push(text.slice(last));
  return segments;
}
```

  Unknown tokens are skipped by `continue`, so they stay inside the surrounding text slice. `"At {acme}."` therefore yields one string. Run the test again. Expected: PASS.

- [ ] **Step 3: Add `loadPageOptions`.** Append to `lib/admin/load.ts` (import `resolveSite` too):

```ts
// The live product pages, for Experience rows that link one.
export async function loadPageOptions(): Promise<{ href: string; title: string }[]> {
  let values = new Map<string, unknown>();
  try {
    const store = getContentStore();
    if (store) values = publishedValues(await store.listDocs());
  } catch (e) {
    console.warn("[admin] loading pages failed:", e instanceof Error ? e.message : e);
  }
  return resolveSite(values).pages.map((page) => ({ href: `/work/${page.slug}/`, title: page.title }));
}
```

- [ ] **Step 4: Create the Bio editor.** `components/admin/bio-editor.tsx`:

```tsx
"use client";

import { type ReactNode, useRef } from "react";
import { ORGS, type OrgId } from "@/content/orgs";
import type { BioSegment, ProfileCopy } from "@/content/profile";
import type { DocEditorInit } from "@/lib/admin/results";
import { bioToText, textToBio } from "@/lib/content/bio-tokens";
import { type Issue, issuesAt } from "@/lib/content/issues";
import { EditorFrame } from "./editor-frame";
import { AddButton, CONTROL, IssueText, RemoveButton, TextAreaField, TextField } from "./fields";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

const ORG_IDS = Object.keys(ORGS) as OrgId[];

function Paragraph({
  index,
  segments,
  controls,
  issues,
  onChange,
  onRemove,
}: {
  index: number;
  segments: BioSegment[];
  controls: ReactNode;
  issues: Issue[];
  onChange: (segments: BioSegment[]) => void;
  onRemove: () => void;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const text = bioToText(segments);
  function insert(org: OrgId) {
    const start = area.current?.selectionStart ?? text.length;
    const end = area.current?.selectionEnd ?? start;
    onChange(textToBio(`${text.slice(0, start)}{${org}}${text.slice(end)}`));
  }
  return (
    <div className="flex flex-col gap-2 border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        {controls}
        <RemoveButton label={`Remove paragraph ${index + 1}`} onClick={onRemove} />
      </div>
      <textarea ref={area} aria-label={`Paragraph ${index + 1}`} rows={4} value={text} onChange={(event) => onChange(textToBio(event.target.value))} className={CONTROL} />
      <div className="flex flex-wrap gap-x-3 gap-y-1 type-meta">
        <span className="text-fg-muted">Insert</span>
        {ORG_IDS.map((org) => (
          <button key={org} type="button" onClick={() => insert(org)} className="text-accent hover:underline">
            {`{${org}}`}
          </button>
        ))}
      </div>
      <IssueText issues={issues} />
    </div>
  );
}

// The home's lead and bio (spec §2.4). Organisation marks are {org} tokens.
export function BioEditor({ init }: { init: DocEditorInit<ProfileCopy> }) {
  const editor = useDocEditor(init);
  const copy = editor.value;
  const set = (patch: Partial<ProfileCopy>) => editor.setValue((previous) => ({ ...previous, ...patch }));
  const paragraphs = useKeyedList(copy.bio, (bio) => set({ bio }));
  const at = (path: string) => issuesAt(editor.issues, "profile", path);
  return (
    <EditorFrame crumbs={["Bio"]} editor={editor} preview="/admin/preview/home/" focusId="identity" openHref="/">
      <div className="flex flex-col gap-4">
        <TextField label="Lead" value={copy.lead.strong} onChange={(strong) => set({ lead: { ...copy.lead, strong } })} issues={at("lead/strong")} />
        <TextAreaField label="Lead, continued" rows={2} value={copy.lead.rest} onChange={(rest) => set({ lead: { ...copy.lead, rest } })} />
        <span className="type-label text-fg-muted">Bio</span>
        <SortableList keys={paragraphs.keys} onMove={paragraphs.move}>
          {(index, controls) => (
            <Paragraph
              index={index}
              segments={copy.bio[index]}
              controls={controls}
              issues={at(`bio/${index}`)}
              onChange={(segments) => paragraphs.update(index, segments)}
              onRemove={() => paragraphs.remove(index)}
            />
          )}
        </SortableList>
        <AddButton onClick={() => paragraphs.insert(copy.bio.length, [""])}>Add paragraph</AddButton>
      </div>
    </EditorFrame>
  );
}
```


- [ ] **Step 5: Create the Experience editor.** `components/admin/experience-editor.tsx`:

```tsx
"use client";

import { type ExperienceChild, type ExperienceEntry, formatSpan } from "@/content/experience";
import { ORGS, type OrgId } from "@/content/orgs";
import { optional } from "@/lib/admin/list";
import type { DocEditorInit } from "@/lib/admin/results";
import { issuesAt } from "@/lib/content/issues";
import { EditorFrame } from "./editor-frame";
import { AddButton, CONTROL, Field, IssueText, RemoveButton, SelectField, TextField } from "./fields";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

type PageOption = { href: string; title: string };
const ORG_OPTIONS = (Object.keys(ORGS) as OrgId[]).map((id) => ({ value: id, label: ORGS[id].name }));

function Products({
  role,
  roleIndex,
  pages,
  issues,
  onChange,
}: {
  role: ExperienceEntry;
  roleIndex: number;
  pages: PageOption[];
  issues: ReturnType<typeof issuesAt>;
  onChange: (children: ExperienceChild[]) => void;
}) {
  const list = useKeyedList(role.children, onChange);
  return (
    <div className="flex flex-col gap-2">
      <span className="type-label text-fg-muted">Products</span>
      <SortableList keys={list.keys} onMove={list.move}>
        {(index, controls) => {
          const child = role.children[index];
          const mine = issues.filter((issue) => issue.at === `${roleIndex}/children/${index}` || issue.at.startsWith(`${roleIndex}/children/${index}/`));
          return (
            <div data-testid="experience-product" className="flex flex-col gap-2 border border-line p-2">
              <div className="flex items-center justify-between gap-2">
                {controls}
                <RemoveButton label={`Remove ${child.title || "product"}`} onClick={() => list.remove(index)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Title" value={child.title} onChange={(title) => list.update(index, { ...child, title })} />
                <TextField label="Note" value={child.note} onChange={(note) => list.update(index, { ...child, note })} />
              </div>
              <Field label="Page">
                <select
                  value={child.href ?? ""}
                  onChange={(event) => {
                    const href = event.target.value || undefined;
                    const page = pages.find((item) => item.href === href);
                    list.update(index, { ...child, href, title: child.title || page?.title || "", years: href ? undefined : child.years });
                  }}
                  className={CONTROL}
                >
                  <option value="">No page (give its years)</option>
                  {pages.map((page) => (
                    <option key={page.href} value={page.href}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </Field>
              {child.href ? null : <TextField label="Years" value={child.years ?? ""} hint="e.g. 2014–2016" onChange={(years) => list.update(index, { ...child, years: optional(years) })} />}
              <IssueText issues={mine} />
            </div>
          );
        }}
      </SortableList>
      <AddButton onClick={() => list.insert(role.children.length, { title: "", note: "" })}>Add product</AddButton>
    </div>
  );
}

// The home's Experience (spec §2.4): roles and their product rows, both reorderable.
export function ExperienceEditor({ init, pages }: { init: DocEditorInit<ExperienceEntry[]>; pages: PageOption[] }) {
  const editor = useDocEditor(init);
  const roles = editor.value;
  const list = useKeyedList(roles, (next) => editor.setValue(() => next));
  const issues = editor.issues.filter((issue) => issue.doc === "experience");
  return (
    <EditorFrame crumbs={["Experience"]} editor={editor} preview="/admin/preview/home/" focusId="experience" openHref="/#experience">
      <div className="flex flex-col gap-4">
        <SortableList keys={list.keys} onMove={list.move}>
          {(index, controls) => {
            const role = roles[index];
            const update = (patch: Partial<ExperienceEntry>) => list.update(index, { ...role, ...patch });
            return (
              <div data-testid="experience-role" className="flex flex-col gap-3 border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  {controls}
                  <span className="truncate type-meta text-fg-muted">
                    {ORGS[role.org].name} · {/^\d{4}-\d{2}$/.test(role.start) ? formatSpan(role.start, role.end) : "dates"}
                  </span>
                  <RemoveButton
                    label={`Remove ${ORGS[role.org].name}`}
                    onClick={() => {
                      if (window.confirm(`Remove the ${ORGS[role.org].name} role and its products?`)) list.remove(index);
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SelectField label="Organisation" value={role.org} options={ORG_OPTIONS} onChange={(org) => update({ org })} />
                  <TextField label="Role" value={role.role} onChange={(value) => update({ role: value })} issues={issuesAt(issues, "experience", `${index}/role`)} />
                  <TextField label="Start" type="month" value={role.start} onChange={(start) => update({ start })} issues={issuesAt(issues, "experience", `${index}/start`)} />
                  <div className="flex flex-col gap-1">
                    <TextField label="End" type="month" value={role.end ?? ""} disabled={role.end === null} onChange={(end) => update({ end })} issues={issuesAt(issues, "experience", `${index}/end`)} />
                    <label className="flex items-center gap-2 type-meta">
                      <input type="checkbox" checked={role.end === null} onChange={(event) => update({ end: event.target.checked ? null : role.start })} />
                      Ongoing
                    </label>
                  </div>
                </div>
                <Products role={role} roleIndex={index} pages={pages} issues={issues} onChange={(children) => update({ children })} />
              </div>
            );
          }}
        </SortableList>
        <AddButton onClick={() => list.insert(roles.length, { org: "orkestra", role: "", start: "", end: null, children: [] })}>Add role</AddButton>
      </div>
    </EditorFrame>
  );
}
```

  Check that `ExperienceChild` is exported from `content/experience.ts` (it is, as an `interface`).

- [ ] **Step 6: Create the routes.** First `app/admin/(console)/bio/page.tsx`:

```tsx
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { BioEditor } from "@/components/admin/bio-editor";
import type { ProfileCopy } from "@/content/profile";
import { loadDoc } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/auth/admin";

export default function BioEditorPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/bio/");
  return <BioEditor init={await loadDoc<ProfileCopy>("profile")} />;
}
```

`app/admin/(console)/experience/page.tsx`:

```tsx
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { ExperienceEditor } from "@/components/admin/experience-editor";
import type { ExperienceEntry } from "@/content/experience";
import { loadDoc, loadPageOptions } from "@/lib/admin/load";
import { requireAdminPage } from "@/lib/auth/admin";

export default function ExperienceEditorPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/experience/");
  const [init, pages] = await Promise.all([loadDoc<ExperienceEntry[]>("experience"), loadPageOptions()]);
  return <ExperienceEditor init={init} pages={pages} />;
}
```

- [ ] **Step 7: Run everything and check it by hand.**
  - Run `npm run typecheck && npm run lint && npm test && npm run build`. Expected: PASS.
  - Signed in on the dev server, check `/admin/bio/`:
    1. Each paragraph shows `{primetek}`-style tokens.
    2. Clicking `{bilkent}` inserts at the cursor.
    3. The preview's identity row shows the logo marks.
    4. Typing `{acme}` and publishing lists `profile bio/0: unknown organisation "{acme}"`.
  - Check `/admin/experience/`:
    1. Roles show their span.
    2. Ticking Ongoing clears and disables End.
    3. Unlinking Nebuu's page shows a Years field.
    4. Publishing without years lists `Nebuu needs a page or its own years`.
    5. Discard restores it.

- [ ] **Step 8: Commit.**

```bash
git add lib/content/bio-tokens.ts lib/admin/load.ts components/admin app/admin tests/content/bio-tokens.test.ts
git commit -m "Add the Bio and Experience editors

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Selected work order on the admin home

**Files:**
- Create: `lib/admin/pin-items.ts`, `components/admin/pins-editor.tsx`, `tests/admin/pin-items.test.ts`
- Modify: `lib/admin/load.ts` (add `loadPinsEditor`), `components/admin/admin-home.tsx`

**Interfaces:**
- Consumes: `buildPins` (Task 2), `resolveSite`, `draftValues` (Task 3), `loadDoc` (Task 10), `DocToolbar`, `SortableList`, `useKeyedList`, `useDocEditor` (Task 10).
- Produces:
  - `PinItem { slug; imageId; title; pageTitle; imageKey; entry: ImageEntry | null }`;
  - `pinItems(views: PinView[]): PinItem[]`;
  - `loadPinsEditor(): Promise<{ init: DocEditorInit<{ order: PinRef[] }>; items: PinItem[] }>`;
  - `PinsEditor`.

- [ ] **Step 1: Write the failing test.** Create `tests/admin/pin-items.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { pinItems } from "@/lib/admin/pin-items";
import { repoSite } from "@/lib/content/site";
import { buildPins } from "@/lib/work/derive";

describe("pinItems", () => {
  it("describes each pin for the order list", () => {
    const site = repoSite();
    const items = pinItems(buildPins(site.pages, site.pins, () => undefined));
    expect(items.map((item) => `${item.slug}/${item.imageId}`)).toEqual(site.pins.map((ref) => `${ref.slug}/${ref.imageId}`));
    expect(items[0]).toEqual({ slug: "primeone", imageId: "components", title: "Components", pageTitle: "PrimeOne", imageKey: "work/primeone/components", entry: null });
  });
});
```

- [ ] **Step 2: Run it to make sure it fails, then create `lib/admin/pin-items.ts`.** Run `npx vitest run tests/admin/pin-items.test.ts`. Expected: FAIL. Then create the module:

```ts
import type { ImageEntry } from "@/lib/images/plan";
import type { PinView } from "@/lib/work/derive";

// One row of the Selected work order list.
export interface PinItem {
  slug: string;
  imageId: string;
  title: string;
  pageTitle: string;
  imageKey: string;
  entry: ImageEntry | null;
}

export function pinItems(views: PinView[]): PinItem[] {
  return views.map((view) => ({
    slug: view.slug,
    imageId: view.image.id,
    title: view.pin.title,
    pageTitle: view.pageTitle,
    imageKey: view.image.image?.key ?? `work/${view.slug}/${view.image.id}`,
    entry: view.image.image ? { width: view.image.image.width, height: view.image.image.height, widths: view.image.image.widths, ...(view.image.image.baseUrl ? { baseUrl: view.image.image.baseUrl } : {}) } : null,
  }));
}
```

  Run the test again. Expected: PASS.

- [ ] **Step 3: Add `loadPinsEditor`.** Append to `lib/admin/load.ts`, adding the imports `PinRef`, `buildPins`, `draftValues`, `pinItems` and `type PinItem`:

```ts
// The pins order as it would publish: the stored order (draft, else
// published, else the repo's), with pinned images it misses appended. Drafted
// pages count, so a newly pinned image is in the list before its page is live.
export async function loadPinsEditor(): Promise<{ init: DocEditorInit<{ order: PinRef[] }>; items: PinItem[] }> {
  const loaded = await loadDoc<{ order: PinRef[] }>("pins");
  let values = new Map<string, unknown>();
  let media: MediaEntry[] = [];
  try {
    const store = getContentStore();
    if (store) {
      const [docs, records] = await Promise.all([store.listDocs(), store.listMedia()]);
      values = draftValues(docs);
      media = records.map(toMediaEntry);
    }
  } catch (e) {
    console.warn("[admin] loading pins failed:", e instanceof Error ? e.message : e);
  }
  const site = resolveSite(values);
  const items = pinItems(buildPins(site.pages, loaded.value.order, lookupWith(media)));
  const init: DocEditorInit<{ order: PinRef[] }> = {
    docKey: loaded.docKey,
    value: { order: items.map(({ slug, imageId }) => ({ slug, imageId })) },
    draftUpdatedAt: loaded.draftUpdatedAt,
    hasDraft: loaded.hasDraft,
    publishedAt: loaded.publishedAt,
    available: loaded.available,
  };
  return { init, items };
}
```


- [ ] **Step 4: Create the editor and add it to the admin home.** `components/admin/pins-editor.tsx`:

```tsx
"use client";

import type { PinRef } from "@/content/pins";
import type { PinItem } from "@/lib/admin/pin-items";
import type { DocEditorInit } from "@/lib/admin/results";
import { renditionUrl } from "@/lib/images/plan";
import { pad2 } from "@/lib/work/derive";
import { DocToolbar } from "./doc-toolbar";
import { IssuesList } from "./issues-list";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

// The home's Selected work order (spec §2.2): drag or ↑/↓, then Publish. Pin
// and unpin happen on the image card in each page's editor.
export function PinsEditor({ init, items }: { init: DocEditorInit<{ order: PinRef[] }>; items: PinItem[] }) {
  const editor = useDocEditor(init);
  const order = editor.value.order;
  const list = useKeyedList(order, (next) => editor.setValue(() => ({ order: next })));
  const byRef = new Map(items.map((item) => [`${item.slug}/${item.imageId}`, item]));
  if (order.length === 0) return <p className="type-meta text-fg-muted">Nothing is pinned. Pin an image from its page's editor.</p>;
  return (
    <div className="flex flex-col gap-3">
      <DocToolbar editor={editor} />
      <IssuesList issues={editor.issues} />
      <SortableList keys={list.keys} onMove={list.move}>
        {(index, controls) => {
          const ref = order[index];
          const item = byRef.get(`${ref.slug}/${ref.imageId}`);
          return (
            <div data-pin={`${ref.slug}/${ref.imageId}`} className="flex items-center gap-3 border-t border-line py-1.5">
              {controls}
              {item?.entry ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={renditionUrl(item.imageKey, item.entry.widths[0], "jpg", item.entry.baseUrl)} alt="" className="aspect-[16/10] w-16 border border-line object-cover" />
              ) : (
                <span aria-hidden="true" className="aspect-[16/10] w-16 border border-dashed border-line" />
              )}
              <span className="type-meta text-fg-muted tabular-nums">FIG. {pad2(index + 1)}</span>
              <span className="min-w-0 flex-1 truncate type-body">{item?.title ?? ref.imageId}</span>
              <span className="type-meta text-fg-muted">{item?.pageTitle ?? ref.slug}</span>
            </div>
          );
        }}
      </SortableList>
    </div>
  );
}
```

  In `components/admin/admin-home.tsx`:
  - import `PinsEditor` and `loadPinsEditor`;
  - load it alongside the docs: `const [docs, sources, pins] = await Promise.all([loadDocs(), readSourceRows(), loadPinsEditor()]);`;
  - render `<Section title="Selected work"><PinsEditor init={pins.init} items={pins.items} /></Section>` between Home and Sources;
  - update the component comment to drop "Selected work is added in Task 14".

- [ ] **Step 5: Run everything and check it by hand.**
  - Run `npm run typecheck && npm run lint && npm test && npm run build`. Expected: PASS.
  - On `/admin/`, the six pins are listed FIG. 01–06 in the curated order. Move Nebuu up, wait for "◐ Draft saved", then Publish: the home's Selected work shows Nebuu fourth with `FIG. 04 · Nebuu`.
  - Discard after another move restores the order.

- [ ] **Step 6: Commit.**

```bash
git add lib/admin components/admin tests/admin/pin-items.test.ts
git commit -m "Reorder Selected work from the admin home

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: The admin flow end to end, CI and docs

**Files:**
- Create: `playwright.admin.config.ts`, `e2e-admin/global-setup.ts`, `e2e-admin/editor.spec.ts`, `docs/superpowers/plans/2026-10-04-sprint-7-followups.md`
- Modify: `package.json` (script `e2e:admin`), `.github/workflows/ci.yml`, `CLAUDE.md`, `docs/superpowers/specs/2026-10-02-site-v2-foundation-design.md` (roadmap note)

**Interfaces:**
- Consumes: everything above. The e2e signs in through `/api/auth/test-signin/` (Task 6), stores content in `CONTENT_STORE_FILE` (Task 4) and media in `MEDIA_DEV_DIR` (Task 12).

- [ ] **Step 1: Create the config and the setup.** First `playwright.admin.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 3221;

// The admin end to end (Sprint 7): a production build (`npm run build` first)
// served with a JSON-file content store, local media and the test sign-in, so
// it never needs GitHub, Neon or Blob. Serial: the tests share one store.
export default defineConfig({
  testDir: "./e2e-admin",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e-admin/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure", viewport: { width: 1440, height: 900 } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      CONTENT_STORE_FILE: ".e2e-admin/content.json",
      MEDIA_DEV_DIR: ".e2e-admin/media",
      ADMIN_E2E: "1",
      ADMIN_GITHUB_ID: "1",
      AUTH_SECRET: "e2e-only-secret-e2e-only-secret-000000",
    },
  },
});
```

`e2e-admin/global-setup.ts`:

```ts
import { mkdirSync, rmSync } from "node:fs";
import sharp from "sharp";

// A fresh store and two upload fixtures per run: a 16:10 PNG and a 4:3 one.
export default async function globalSetup() {
  rmSync(".e2e-admin", { recursive: true, force: true });
  mkdirSync(".e2e-admin/fixtures", { recursive: true });
  const solid = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#2F55F5" } }).png();
  await solid(1280, 800).toFile(".e2e-admin/fixtures/wide.png");
  await solid(1600, 1200).toFile(".e2e-admin/fixtures/four-three.png");
}
```

  In `package.json` scripts, add `"e2e:admin": "playwright test --config playwright.admin.config.ts",` after `e2e:fixtures`.

- [ ] **Step 2: Write the end-to-end spec.** `e2e-admin/editor.spec.ts`:

```ts
import { type Page, expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

const status = (page: Page) => page.locator('p[role="status"]').first();

async function saved(page: Page) {
  await expect(status(page)).toContainText("Draft saved", { timeout: 10_000 });
}

async function publish(page: Page) {
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(status(page)).toContainText("Published", { timeout: 15_000 });
}

test("the admin home lists pages, home documents, Selected work and sources", async ({ page }) => {
  await signIn(page, "/admin/");
  for (const name of ["Pages", "Home", "Selected work", "Sources"]) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const nebuu = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "Nebuu", exact: true }) });
  await expect(nebuu).toContainText("repo");
  await expect(page.getByText("Database unavailable.")).toBeVisible();
});

test("Lab: add an entry, see it in the preview, publish it to the home", async ({ page }) => {
  await signIn(page, "/admin/lab/");
  await page.getByRole("button", { name: "Add entry" }).click();
  const row = page.getByTestId("lab-row").last();
  await row.getByLabel("Title").fill("E2E Lab");
  await row.getByLabel("Description").fill("Added by the admin e2e.");
  await row.getByLabel("Year").fill("2026");
  await saved(page);
  await expect(page.frameLocator('iframe[title="Preview"]').locator("#lab")).toContainText("E2E Lab");
  await publish(page);
  await page.goto("/");
  await expect(page.locator("#lab")).toContainText("E2E Lab");
});

test("Nebuu: add, move and delete blocks, upload an image, publish", async ({ page }) => {
  page.on("dialog", (dialog) => void dialog.accept());
  await signIn(page, "/admin/work/nebuu/");

  await page.getByRole("button", { name: "+ Text" }).click();
  await page.getByLabel("Heading", { exact: true }).fill("E2E notes");
  await page.getByLabel("Body 1").fill("Written by the admin e2e.");
  const notes = page.locator("li", { has: page.locator('[data-block="e2e-notes"]') });
  await notes.getByRole("button", { name: "Move up" }).first().click();
  await page.getByRole("button", { name: "Delete block Editions" }).click();

  // Each card's toggle is its only button with aria-expanded (the remove
  // buttons also carry the card's name).
  await page.locator('[data-block="highlights"] button[aria-expanded]').first().click();
  const cards = page.locator('[data-image="cards"]');
  await cards.locator("button[aria-expanded]").click();
  await cards.getByLabel("Upload image").setInputFiles(".e2e-admin/fixtures/four-three.png");
  await expect(cards.getByRole("alert")).toContainText("must be 16:10");
  await cards.getByLabel("Upload image").setInputFiles(".e2e-admin/fixtures/wide.png");
  await expect(cards.locator("img")).toBeVisible({ timeout: 20_000 });
  await saved(page);
  await publish(page);

  await page.goto("/work/nebuu/");
  await expect(page.getByRole("heading", { name: "E2E notes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Editions" })).toHaveCount(0);
  const ids = await page.locator("main section[id]").evaluateAll((sections) => sections.map((section) => section.id));
  expect(ids.indexOf("e2e-notes")).toBeLessThan(ids.indexOf("highlights"));
  await expect(page.locator('#highlights img[src*="/api/media-dev/media/work/nebuu/cards-"]')).toHaveCount(1);
});

test("Bio: edit the lead and publish it to the home", async ({ page }) => {
  await signIn(page, "/admin/bio/");
  await page.getByLabel("Lead, continued").fill("Edited by the admin e2e.");
  await saved(page);
  await publish(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Edited by the admin e2e.");
});

test("Selected work: move Nebuu up one place", async ({ page }) => {
  await signIn(page, "/admin/");
  await page.locator('[data-pin="nebuu/game"]').locator("..").getByRole("button", { name: "Move up" }).click();
  await saved(page);
  await publish(page);
  await page.goto("/");
  await expect(page.locator("#selected-work li").nth(3)).toContainText("Nebuu");
});

test("New page: create, publish, see it live, then delete it", async ({ page }) => {
  page.on("dialog", (dialog) => void dialog.accept());
  await signIn(page, "/admin/work/new/");
  await page.getByLabel("Title").fill("E2E Page");
  await page.getByLabel("Kind").fill("test page");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/work\/e2e-page\/$/);
  await expect(page.getByText("New page: not on the site until you publish it.")).toBeVisible();

  await page.getByLabel("Intro").fill("A page made by the admin e2e.");
  await page.getByLabel("Facts 2 Value").fill("2026");
  await page.locator('[data-block="what-i-did"] button[aria-expanded]').click();
  await page.getByLabel("Body 1").fill("Built it.");
  await saved(page);
  await publish(page);

  await page.goto("/work/e2e-page/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("E2E Page.");

  await signIn(page, "/admin/work/e2e-page/");
  await page.getByRole("button", { name: "Delete page" }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
  expect((await page.request.get("/work/e2e-page/")).status()).toBe(404);
});

test("the footer offers Edit after sign-in", async ({ page }) => {
  await signIn(page, "/admin/");
  await page.goto("/work/nebuu/");
  await expect(page.locator("footer").getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/admin/work/nebuu/");
});
```

  `[data-pin]` sits on the row's inner `div`, and its parent is the sortable `li` that holds the ↑/↓ buttons. If the structure differs, use `page.locator("li", { has: page.locator('[data-pin="nebuu/game"]') })`.

- [ ] **Step 3: Run it.** Run `npm run build && npm run e2e:admin`. Expected: all seven tests PASS.
  - **If the deleted page still renders 200**, the on-demand route kept a full-page cache entry that `updateTag("content")` didn't reach. Debug with the opus model. First confirm that `getPublishedContent` is the only data read on that route, then read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/updateTag.md`. Never paper over it by making the page dynamic.
  - **If an upload times out**, check that `sharp` is in `dependencies` and that `.e2e-admin/media` is being written.

- [ ] **Step 4: CI.** In `.github/workflows/ci.yml`, after `- run: npm run e2e`, add:

```yaml
      # The admin flow against the same build: JSON-file store, local media,
      # test sign-in (playwright.admin.config.ts). Before the fixture build.
      - run: npm run e2e:admin
```

  Also add `.e2e-admin/` to the `upload-artifact` paths:

```yaml
          path: |
            test-results/
            .e2e-admin/content.json
```

- [ ] **Step 5: Docs.** In `CLAUDE.md`, make these updates:
  - **Commands:** add `npm run e2e:admin       # the admin flow on port 3221; run \`npm run build\` first` after `e2e:fixtures`.
  - **Environment:** add these lines:
    - `AUTH_SECRET` (32+ chars), `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: the GitHub OAuth app (one per host: production, localhost).
    - `ADMIN_GITHUB_ID`: the only GitHub user id that may sign in.
    - `BLOB_READ_WRITE_TOKEN`: the Vercel Blob store (public) for uploads.
    - `CONTENT_STORE_FILE`: dev/e2e only. Admin content goes to this JSON file instead of Neon. Set it in `.env.local` so local editing never touches production. It is refused on Vercel.
    - `MEDIA_DEV_DIR`: dev/e2e only; the local uploads folder (default `.media-dev`).
    - `ADMIN_E2E=1`: dev/e2e only; enables `/api/auth/test-signin/`. It is refused on Vercel.
  - **A new section `## Admin (Sprint 7)`** after "Work (product pages)", one bullet each:
    - spec path `docs/superpowers/specs/2026-10-04-sprint-7-admin-design.md`;
    - **documents**: `content_docs`, one row per key (`work/<slug>`, `work-index`, `pins`, `lab`, `profile`, `experience`), with draft and published JSON. A published row wins over the repo; no row or no database means the repo content. `work-index` never has a draft: publishing an unlisted page appends it, and Delete page removes it in one validated step;
    - **reads**: public pages read only `getPublishedContent()` (`lib/content/read.ts`, `"use cache"`, tag `content`) through `lib/work/` (`getProductPage`, `getHomeContent`, …). The pure views are in `lib/work/views.ts` (tests and e2e use those with `repoSite()`). Publish calls `updateTag("content")`;
    - **validation**: zod shapes (`lib/content/schemas.ts`, pinned to the content types by `tests/content/schemas.test.ts`), then `validateSite` over the would-be site;
    - **editors**: `/admin/` (home: pages, Bio/Lab/Experience, Selected work order, sources + Sync now), `/admin/work/<slug>/`, `/admin/work/new/`, `/admin/lab/`, `/admin/bio/`, `/admin/experience/`. They are two-pane (form + iframe preview at `/admin/preview/…`), autosave about 1s after the last change, and guard against stale tabs with `draft_updated_at`;
    - **auth**: hand-written GitHub OAuth (`app/api/auth/*`) and a jose session cookie. Every action, upload route and preview checks `isAdmin()`. Admin pages read the session only inside `<Suspense>`. Public pages never read cookies: the footer's Edit link reads the non-httpOnly `admin_hint` cookie on the client;
    - **media**: the browser uploads originals to Blob (`/api/admin/upload/` issues the token; locally `/api/admin/upload-dev/`). `processUploadAction` checks for 16:10 within ±1% and ≥1280px, renders with `lib/images/encode.ts` (the same encoder as `npm run images`) and records a `media` row. An image's `image` key is then `media/work/<slug>/<id>-<hash8>`. `ImageEntry.baseUrl` points renditions at Blob; `lookupWith()` merges uploads into the manifest. Unreferenced Blob files are never cleaned up;
    - **ids** lock once published (`lib/content/ids.ts`);
    - **pins order**: lives in `content/pins.ts` and the `pins` document; `Pin` has no `order`;
    - **preview deployments** have no admin sign-in (one OAuth callback host) but show published content (shared database).
  - **Work (product pages):** in "Content and reads", replace "Sprint 7's admin overlay merges in there" with "the admin overlay resolves there (see Admin)". Note that `WorkSlug` is a plain string now. Change the pin bullet to say the order comes from `content/pins.ts` / the `pins` document.
  - **Database:** add "`content_docs` and `media` (Sprint 7) hold admin content; their migration was expand-only."

  In the foundation spec's roadmap table, append to the Sprint 7 row: `— done: see 2026-10-04-sprint-7-admin-design.md`.

  Create `docs/superpowers/plans/2026-10-04-sprint-7-followups.md`:

```markdown
# Sprint 7 follow-ups

## Pre-merge checks for Onur (on the Vercel preview, then production)

1. Preview: the public pages look exactly as before (home, a product page, Life). The admin is not reachable for sign-in on previews (one OAuth callback host); that is expected.
2. After merging (production): sign in at https://onursenture.vercel.app/admin/ with GitHub. Another GitHub account must get "Not allowed".
3. Upload one real 2560×1600 image into a slot, publish, and check the page and its `og:image` (a Blob JPEG URL).
4. Run a CDN check on a published page: `curl -sI https://onursenture.vercel.app/work/nebuu/ | grep -i x-vercel-cache` twice → HIT on the second.
5. Edit a Lab row, publish, and confirm the home updates within a few seconds.

## Deferred

- Version history of publishes, and rollback.
- Cleaning up unreferenced Blob files (replaced or removed images).
- Exporting published content back into the repo (`content/`), for git history.
- After launch (Sprint 8): update the production OAuth app's URLs to onursenture.com.
```

- [ ] **Step 6: Run the whole suite.** Run `npm run typecheck && npm run lint && npm test && npm run build && npm run e2e && npm run e2e:admin && SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures && npm run build`. Expected: all PASS.

- [ ] **Step 7: Commit.**

```bash
git add playwright.admin.config.ts e2e-admin package.json .github/workflows/ci.yml CLAUDE.md docs
git commit -m "Test the admin flow end to end in CI and document the admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Final review, verification and the PR (controller)

- [ ] **Step 1: Whole-branch review.** Dispatch the final reviewer (opus) on `git diff v2...sprint-7`, with the spec and this plan. Ask it to look at:
  - the session check on every action and route (`grep -n "isAdmin\|requireAdminPage" app lib`);
  - public pages staying prerendered (no `cookies()` outside `app/admin/` and `app/api/`);
  - `updateTag` after every publish, reset and delete;
  - the PrimeTek link rule in the editor and the validator;
  - id locking;
  - upload checks on both sides;
  - the stale-tab guard.

  Fix what it finds. Record decisions in the ledger.
- [ ] **Step 2: Visual checks.** Never skip these. Signed in on a local production build (`ADMIN_E2E=1 … npm run start`), take 1440 and 390 shots of:
  - `/admin/` (signed out and signed in);
  - `/admin/lab/`, `/admin/work/nebuu/` (a block open, an image card open with an upload error), `/admin/work/new/`, `/admin/bio/`, `/admin/experience/`;
  - the Preview tab at 390.

  Freeze-frame a block drag and a pin drag mid-move. Compare the editor against mockup A. Look for: no horizontal scroll, the toolbar wraps cleanly, the danger colour only for errors, and no shadows or rounded cards.
- [ ] **Step 3: Full verification.** Run Task 15 Step 6's command chain and read the output. Confirm the route table shows `/`, `/work/[slug]` and `/life/*` as prerendered.
- [ ] **Step 4: Ask Onur (AskUserQuestion) to push and open the PR into `v2`.** On yes:
  - push `sprint-7`;
  - open the PR with a summary, the followups file link and the test plan. The body ends with the Claude Code line;
  - bind it with the ccd_pr tools;
  - remind Onur that Task 1 must be done before the production checks.
- [ ] **Step 5: Memory.** Update `site-v2-redesign.md` with the Sprint 7 status (PR link, what's pending from Onur).
