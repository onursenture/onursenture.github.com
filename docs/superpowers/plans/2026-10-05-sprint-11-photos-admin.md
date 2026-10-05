# Sprint 11: Photos in the admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move photos from repo files into a `photos` table edited at `/admin/photos/`: phone upload with EXIF date and camera, draft and publish, edit, delete. Migrate the 5 repo photos.

**Architecture:** A `photos` table with a `PhotoStore` (file store for dev and e2e, Drizzle for Neon), modelled on Notes (`lib/notes/`). Write rules live in `lib/photos/operations.ts`, which server actions wrap with the session check and `updateTag(PHOTOS_TAG)`. The browser reads EXIF with `exifr` before the existing HEIC→JPEG redraw. The existing Blob upload and `processImageWith` pipeline then renders the renditions. Public pages read published photos through a cached, tagged `getPublishedPhotos()`, which serves fixtures in `SOURCE_FIXTURES=1` mode.

**Tech Stack:** Next.js 16 (cacheComponents, `"use cache"`, `cacheTag`/`updateTag`), Drizzle 0.45 (neon-http, PGlite in tests), Vercel Blob, sharp 0.35, `exifr` 7.1.3 (new), zod, vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-05-sprint-11-photos-admin-design.md`

## Global Constraints

- Worktree: `/Users/w00f/Documents/GitHub/onursenture.github.com-sprint-11`, branch `sprint-11`, from `v2` 179266e. Run `npm ci` once before Task 1 (the controller does this).
- Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Subjects are plain sentences, never "Task N: …".
- Modules in `lib/photos/` import each other and other `lib/` modules with **relative paths** (`../media/process`), except `lib/photos/fixtures.ts`, `read.ts` and `get-store.ts`, which only run inside Next. `scripts/import-photos.ts` runs under tsx outside Next.
- EXIF: only `DateTimeOriginal`, `Make` and `Model` are ever parsed (`exifr` `pick`). **Never GPS.** Renditions carry no metadata (sharp's default).
- `takenAt` is wall-clock text `YYYY-MM-DDTHH:mm:ss`. Display and feed dates use `photoDay(photo)` (the first 10 characters). Never pass `takenAt` itself to `formatDate` or `new Date()`, because a zone-less string would be read as server-local time.
- Photos render with `PictureView image={photo.image.key} entry={photo.image}`, never with `Picture`, which only knows the repo manifest.
- Alt text: `photoAlt(photo)` (`alt`, else `title`) on the photo page `<img>`, `og:image:alt` and the feed. Grid thumbnails stay `alt=""`.
- The slug comes from the title (Turkish transliterated), is assigned at first publish and **never changes**. The placeholder slug for `generateStaticParams` is `_`.
- External reads fail soft: no store or a store error renders no photos, with a `console.warn`.
- Copy (exact): "+ Add photo", "Title", "Alt text", "optional", "Falls back to the title", "Date", "Camera", "EXIF", "Save draft", "Publish", "Save", "Delete", "Close", "Draft", "Live", "Untitled", "No photos yet.", "Draft saved", "Saved", "Published", "Deleted", "Unsaved changes", "Uploading…", "Saving…", "Can't publish yet:", "Can't upload:", "Delete this photo? This can't be undone.".
- Test commands: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run e2e`, `npm run e2e:fixtures` (needs a `SOURCE_FIXTURES=1 npm run build`), `npm run e2e:admin`. Kill stale `next start` servers on 3217/3219/3221 before an e2e run (`lsof -ti:3217,3219,3221 | xargs kill`).

## File map

| File | Responsibility |
|---|---|
| `lib/photos/types.ts` | Photo types, `NO_EXIF`, `isPublishedPhoto`, `photoDay`, `photoAlt`, `bySiteOrder` |
| `lib/photos/taken-at.ts` | `TAKEN_AT_PATTERN`, `isTakenAt`, `wallClock`, `withDay` |
| `lib/photos/schema.ts` | zod: content, image, exif |
| `lib/photos/rules.ts` | `publishIssues` |
| `lib/photos/slug.ts` | `slugify`, `freeSlug`, `PLACEHOLDER_PHOTO_SLUG` |
| `lib/photos/store.ts`, `file-store.ts`, `drizzle-store.ts`, `get-store.ts`, `tags.ts` | Persistence and the cache tag |
| `lib/photos/operations.ts` | Create draft from upload, save, publish, delete |
| `lib/photos/exif.ts` | Browser EXIF reader (`exifr`) and the pure tag mapping |
| `lib/photos/read.ts`, `fixtures.ts` | Cached public read and fixture photos |
| `lib/photos/import.ts`, `scripts/import-photos.ts` | One-off migration of the repo photos |
| `lib/content/photos.ts` | Public API kept for consumers: `getPhotos`, `getPhoto`, `adjacentPhotos`, `Photo` |
| `lib/media/rules.ts`, `lib/media/storage.ts` | `checkPhotoDimensions`; `deleteRenditions` |
| `lib/db/schema.ts`, `drizzle/0004_photos.sql` | The `photos` table |
| `app/admin/photos-actions.ts`, `lib/admin/photos.ts` | Server actions; console loader and counts |
| `lib/admin/photo-editor.ts` | `PhotoEditorState` (plain class) and `statusText` |
| `components/admin/media-upload.ts` | Shared browser upload (moved out of `note-upload.ts`) |
| `components/admin/photos/*` | Console, form, list, `uploadPhoto` |
| `app/admin/(console)/photos/page.tsx` | The admin route |

---

### Task 1: Photo model, slug, rules and the `photos` table

**Files:**
- Create: `lib/photos/types.ts`, `lib/photos/taken-at.ts`, `lib/photos/schema.ts`, `lib/photos/rules.ts`, `lib/photos/slug.ts`
- Modify: `lib/media/rules.ts` (append), `lib/db/schema.ts` (append)
- Create (generated): `drizzle/0004_photos.sql`, `drizzle/meta/*`
- Test: `tests/photos/slug.test.ts`, `tests/photos/taken-at.test.ts`, `tests/photos/schema.test.ts`, `tests/media/photo-rules.test.ts`

**Interfaces:**
- Produces:
  - `PhotoImage { key; width; height; widths; baseUrl? }`
  - `PhotoExif { takenAt: string|null; camera: string|null }`
  - `PhotoContent { title; alt; takenAt; camera }`
  - `StoredPhoto`; `Photo` (published)
  - `PhotoStatus`; `PhotoIssue { at; message }`
  - `NO_EXIF`, `isPublishedPhoto`, `photoDay`, `photoAlt`, `bySiteOrder`
  - `isTakenAt(s)`, `wallClock(now)`, `withDay(takenAt, day)`, `TAKEN_AT_PATTERN`
  - `photoContentSchema`, `photoImageSchema`, `photoExifSchema`
  - `publishIssues(content)`
  - `slugify(title)`, `freeSlug(title, taken)`, `PLACEHOLDER_PHOTO_SLUG`
  - `checkPhotoDimensions(w, h)`, `PHOTO_MIN_LONG_SIDE`
  - the Drizzle table `photos`

- [ ] **Step 1: Write the failing tests**

`tests/photos/slug.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PLACEHOLDER_PHOTO_SLUG, freeSlug, slugify } from "@/lib/photos/slug";

describe("slugify", () => {
  it("keeps the slugs the repo photos already have", () => {
    expect(slugify("Bold, Vakıf Building")).toBe("bold-vakif-building");
    expect(slugify("Kızılcıklı")).toBe("kizilcikli");
    expect(slugify("Bazı kötü alışkanlıkların politik tarihi")).toBe("bazi-kotu-aliskanliklarin-politik-tarihi");
    expect(slugify("Night Boulevard")).toBe("night-boulevard");
  });

  it("transliterates every Turkish letter, upper case included", () => {
    expect(slugify("Çğıİöşü ÇĞIÖŞÜ")).toBe("cgiiosu-cgiosu");
  });

  it("drops other accents and collapses everything else to single dashes", () => {
    expect(slugify("  Café — Crème brûlée!! ")).toBe("cafe-creme-brulee");
    expect(slugify("a/b\\c")).toBe("a-b-c");
  });

  it("falls back to photo when nothing is left", () => {
    expect(slugify("🌅🌅")).toBe("photo");
    expect(slugify("---")).toBe("photo");
  });

  it("caps the slug at 80 characters without a trailing dash", () => {
    const slug = slugify(`${"a".repeat(79)} b`);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("never makes the placeholder", () => {
    expect(slugify("_")).not.toBe(PLACEHOLDER_PHOTO_SLUG);
  });
});

describe("freeSlug", () => {
  it("adds -2, -3 … on a collision", () => {
    expect(freeSlug("Stabilo", [])).toBe("stabilo");
    expect(freeSlug("Stabilo", ["stabilo"])).toBe("stabilo-2");
    expect(freeSlug("Stabilo", ["stabilo", "stabilo-2"])).toBe("stabilo-3");
  });
});
```

`tests/photos/taken-at.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isTakenAt, wallClock, withDay } from "@/lib/photos/taken-at";

describe("isTakenAt", () => {
  it("accepts real wall-clock times only", () => {
    expect(isTakenAt("2026-08-17T18:42:10")).toBe(true);
    expect(isTakenAt("2026-02-30T00:00:00")).toBe(false);
    expect(isTakenAt("0000-00-00T00:00:00")).toBe(false);
    expect(isTakenAt("2026-08-17 18:42:10")).toBe(false);
    expect(isTakenAt("2026-08-17T18:42:10Z")).toBe(false);
    expect(isTakenAt("2026-08-17")).toBe(false);
  });
});

describe("wallClock", () => {
  it("is the Istanbul clock (UTC+3), to the second", () => {
    expect(wallClock(new Date("2026-10-05T21:30:07.900Z"))).toBe("2026-10-06T00:30:07");
  });
});

describe("withDay", () => {
  it("changes the day and keeps the time of day", () => {
    expect(withDay("2026-08-17T18:42:10", "2026-08-20")).toBe("2026-08-20T18:42:10");
  });

  it("refuses an invalid day", () => {
    expect(withDay("2026-08-17T18:42:10", "")).toBeNull();
    expect(withDay("2026-08-17T18:42:10", "2026-02-30")).toBeNull();
  });
});
```

`tests/photos/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { publishIssues } from "@/lib/photos/rules";
import { photoContentSchema, photoExifSchema, photoImageSchema } from "@/lib/photos/schema";
import { bySiteOrder, isPublishedPhoto, photoAlt, photoDay } from "@/lib/photos/types";

const content = { title: "Stabilo", alt: "", takenAt: "2026-04-11T12:00:00", camera: "iPhone 17" };

describe("photoContentSchema", () => {
  it("accepts a valid content and strips unknown keys", () => {
    expect(photoContentSchema.parse({ ...content, slug: "x" })).toEqual(content);
  });

  it("refuses an invalid date with a readable message", () => {
    const result = photoContentSchema.safeParse({ ...content, takenAt: "2026-02-30T00:00:00" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe("Use a valid date.");
  });
});

describe("photoImageSchema and photoExifSchema", () => {
  it("parse what an upload stores", () => {
    const image = { key: "media/photos/abc", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "https://b.public.blob.vercel-storage.com/media/photos/abc" };
    expect(photoImageSchema.parse(image)).toEqual(image);
    expect(photoExifSchema.parse({ takenAt: null, camera: null })).toEqual({ takenAt: null, camera: null });
    expect(photoExifSchema.safeParse({ takenAt: "yesterday", camera: null }).success).toBe(false);
  });
});

describe("publishIssues", () => {
  it("needs a title", () => {
    expect(publishIssues(content)).toEqual([]);
    expect(publishIssues({ ...content, title: "  " })).toEqual([{ at: "title", message: "Add a title." }]);
  });
});

describe("photo helpers", () => {
  it("photoDay is the date part; photoAlt falls back to the title", () => {
    expect(photoDay(content)).toBe("2026-04-11");
    expect(photoAlt(content)).toBe("Stabilo");
    expect(photoAlt({ ...content, alt: " A pen " })).toBe("A pen");
  });

  it("bySiteOrder is newest taken first, then id descending", () => {
    const a = { id: "a", takenAt: "2026-04-11T12:00:00" };
    const b = { id: "b", takenAt: "2026-04-11T12:00:00" };
    const c = { id: "c", takenAt: "2026-08-17T18:42:10" };
    expect([a, b, c].sort(bySiteOrder).map((p) => p.id)).toEqual(["c", "b", "a"]);
  });

  it("isPublishedPhoto needs a slug and a publish time", () => {
    const base = { ...content, id: "1", image: { key: "k", width: 1, height: 1, widths: [1] }, exif: { takenAt: null, camera: null }, createdAt: "x", updatedAt: "x" };
    expect(isPublishedPhoto({ ...base, slug: "s", status: "published", publishedAt: "2026-01-01T00:00:00.000Z" })).toBe(true);
    expect(isPublishedPhoto({ ...base, slug: null, status: "draft", publishedAt: null })).toBe(false);
  });
});
```

`tests/media/photo-rules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { checkPhotoDimensions } from "@/lib/media/rules";

describe("checkPhotoDimensions", () => {
  it("takes any ratio with at least 1280px on the long side", () => {
    expect(checkPhotoDimensions(1280, 300)).toBeNull();
    expect(checkPhotoDimensions(960, 1280)).toBeNull();
    expect(checkPhotoDimensions(4032, 3024)).toBeNull();
  });

  it("names the size and the rule when it is too small", () => {
    expect(checkPhotoDimensions(800, 600)).toBe("The image is 800×600; photos need at least 1280px on the long side.");
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/photos tests/media/photo-rules.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`lib/photos/types.ts`:

```ts
// Photos (Sprint 11 spec §1): one row per photo, any status. Plain data with
// ISO strings, so server actions can hand photos to client components as is.

export const PHOTO_STATUSES = ["draft", "published"] as const;
export type PhotoStatus = (typeof PHOTO_STATUSES)[number];

// The renditions of an uploaded photo, self-contained like a NoteImage so a
// photo renders without a media lookup (ImageEntry plus its key).
export interface PhotoImage {
  key: string;
  width: number;
  height: number;
  widths: number[];
  baseUrl?: string;
}

// What EXIF gave at upload (null: no such tag), kept so the form can mark a
// field "EXIF" while its value still matches.
export interface PhotoExif {
  takenAt: string | null;
  camera: string | null;
}

export const NO_EXIF: PhotoExif = { takenAt: null, camera: null };

// What the author edits. takenAt is wall-clock "YYYY-MM-DDTHH:mm:ss" with no
// zone (EXIF DateTimeOriginal is local time); only its date is shown.
export interface PhotoContent {
  title: string;
  // Empty: the title is the alt text.
  alt: string;
  takenAt: string;
  camera: string;
}

export interface StoredPhoto extends PhotoContent {
  id: string;
  // Set at first publish, never changed: the URL.
  slug: string | null;
  image: PhotoImage;
  exif: PhotoExif;
  status: PhotoStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// A published photo: what the site renders.
export interface Photo extends StoredPhoto {
  slug: string;
  status: "published";
  publishedAt: string;
}

// A reason a photo can't be saved or published; `at` names the field.
export interface PhotoIssue {
  at: string;
  message: string;
}

export function isPublishedPhoto(photo: StoredPhoto): photo is Photo {
  return photo.status === "published" && photo.slug !== null && photo.publishedAt !== null;
}

// "YYYY-MM-DD": what pages and the feed show. Never parse takenAt itself as a
// Date: without a zone it would read as the server's local time.
export function photoDay(photo: Pick<PhotoContent, "takenAt">): string {
  return photo.takenAt.slice(0, 10);
}

export function photoAlt(photo: Pick<PhotoContent, "title" | "alt">): string {
  return photo.alt.trim() || photo.title;
}

// Site order: newest taken first; the id keeps same-time photos stable.
export function bySiteOrder(a: Pick<StoredPhoto, "takenAt" | "id">, b: Pick<StoredPhoto, "takenAt" | "id">): number {
  return b.takenAt.localeCompare(a.takenAt) || b.id.localeCompare(a.id);
}
```

`lib/photos/taken-at.ts`:

```ts
import { utcToZoned } from "../notes/schedule";

// A photo's time taken (spec §1.1): wall-clock "YYYY-MM-DDTHH:mm:ss" with no
// zone, as EXIF DateTimeOriginal is. Fixed width, so it sorts as a string.
export const TAKEN_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

// The pattern lets 2026-02-30 or 0000-00-00 through; a round trip doesn't.
export function isTakenAt(value: string): boolean {
  if (!TAKEN_AT_PATTERN.test(value)) return false;
  const time = Date.parse(`${value}Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 19) === value;
}

// The Istanbul wall clock at `now`: the date of a photo without EXIF.
export function wallClock(now: Date): string {
  const { date, time } = utcToZoned(now.toISOString());
  return `${date}T${time}:${String(now.getUTCSeconds()).padStart(2, "0")}`;
}

// The date input gives a day; the time of day stays, since it orders
// same-day photos. Null for an invalid day.
export function withDay(takenAt: string, day: string): string | null {
  const next = `${day}${takenAt.slice(10)}`;
  return isTakenAt(next) ? next : null;
}
```

`lib/photos/schema.ts`:

```ts
import { z } from "zod";
import { isTakenAt } from "./taken-at";

// Validation for what the admin sends and what the database holds.

const takenAt = z.string().refine(isTakenAt, "Use a valid date.");

export const photoContentSchema = z.object({
  title: z.string().max(200, "Keep the title under 200 characters."),
  alt: z.string().max(1000, "Keep the alt text under 1,000 characters."),
  takenAt,
  camera: z.string().max(100, "Keep the camera under 100 characters."),
});

export const photoImageSchema = z.object({
  key: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  widths: z.array(z.number().int().positive()).min(1),
  baseUrl: z.string().optional(),
});

export const photoExifSchema = z.object({
  takenAt: takenAt.nullable(),
  camera: z.string().max(100).nullable(),
});
```

`lib/photos/rules.ts`:

```ts
import type { PhotoContent, PhotoIssue } from "./types";

// What a photo needs to go live (publish, or a save on a live photo). Drafts
// skip this, so an untitled upload is never lost.
export function publishIssues(content: PhotoContent): PhotoIssue[] {
  return content.title.trim() === "" ? [{ at: "title", message: "Add a title." }] : [];
}
```

`lib/photos/slug.ts`:

```ts
// A photo's URL slug (spec §1.2): from the title, set at first publish and
// never changed. Only [a-z0-9-], so "_" can stand in for "no photos" in
// generateStaticParams.

export const PLACEHOLDER_PHOTO_SLUG = "_";
const MAX_LENGTH = 80;

// Before lower-casing: "İ".toLowerCase() is "i" plus a combining dot.
const TURKISH: Record<string, string> = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };

export function slugify(title: string): string {
  const slug = title
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (letter) => TURKISH[letter])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/, "");
  return slug || "photo";
}

export function freeSlug(title: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const base = slugify(title);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
```

Append to `lib/media/rules.ts`:

```ts
// Photos (Sprint 11 spec §2): any ratio, at least 1280px on the long side.
export const PHOTO_MIN_LONG_SIDE = 1280;

export function checkPhotoDimensions(width: number, height: number): string | null {
  if (Math.max(width, height) >= PHOTO_MIN_LONG_SIDE) return null;
  return `The image is ${width}×${height}; photos need at least ${PHOTO_MIN_LONG_SIDE}px on the long side.`;
}
```

Append to `lib/db/schema.ts`, and add `import type { PhotoExif, PhotoImage } from "../photos/types";` at the top:

```ts
// Photos (Sprint 11): one row per photo, any status. slug is set at first
// publish and never changes (its URL). taken_at is wall-clock text
// "YYYY-MM-DDTHH:mm:ss". Expand-only migration.
export const photos = pgTable("photos", {
  id: uuid("id").primaryKey(),
  slug: text("slug").unique(),
  title: text("title").notNull(),
  alt: text("alt").notNull().default(""),
  takenAt: text("taken_at").notNull(),
  camera: text("camera").notNull().default(""),
  image: jsonb("image").$type<PhotoImage>().notNull(),
  exif: jsonb("exif").$type<PhotoExif>().notNull(),
  status: text("status").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
```

- [ ] **Step 4: Generate the migration**

Run: `npm run db:generate -- --name photos`
Expected: `drizzle/0004_photos.sql` with one `CREATE TABLE "photos"` and a unique constraint on `slug`, plus updated `drizzle/meta/`. Read the SQL: it must not touch any other table.

- [ ] **Step 5: Run the tests and the type check**

Run: `npx vitest run tests/photos tests/media/photo-rules.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/photos lib/media/rules.ts lib/db/schema.ts drizzle tests/photos tests/media/photo-rules.test.ts
git commit -m "Add the photo model, slugs and the photos table

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Photo stores and the cache tag

**Files:**
- Create: `lib/photos/store.ts`, `lib/photos/file-store.ts`, `lib/photos/drizzle-store.ts`, `lib/photos/get-store.ts`, `lib/photos/tags.ts`
- Test: `tests/helpers/photo-store-contract.ts`, `tests/photos/file-store.test.ts`, `tests/photos/drizzle-store.test.ts`

**Interfaces:**
- Consumes: Task 1 types and schemas; `photos` table.
- Produces:
  - `PhotoFields` (PhotoContent + `slug`, `image`, `exif`, `status`, `publishedAt: Date|null`)
  - `PhotoWrite = {ok:true; photo} | {ok:false; reason:"conflict"|"missing"|"duplicate-slug"}`
  - `PhotoStore { list(); listPublished(); get(id); slugs(); create(fields, now); update(id, fields, expected, now); remove(id, expected) }`
  - `FilePhotoStore(path)`, `photosFileFor(contentFile)`, `DrizzlePhotoStore(db)`
  - `getPhotoStore(): PhotoStore | null`
  - `PHOTOS_TAG = "photos"`

- [ ] **Step 1: Write the shared contract and the two runners**

`tests/helpers/photo-store-contract.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import type { PhotoFields, PhotoStore } from "@/lib/photos/store";

const t0 = new Date("2026-10-05T10:00:00.000Z");
const t1 = new Date("2026-10-05T10:00:05.000Z");

const image = { key: "media/photos/abc", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "https://b.public.blob.vercel-storage.com/media/photos/abc" };

export const draftFields = (patch: Partial<PhotoFields> = {}): PhotoFields => ({
  title: "",
  alt: "",
  takenAt: "2026-08-17T18:42:10",
  camera: "Fujifilm X100VI",
  slug: null,
  image,
  exif: { takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" },
  status: "draft",
  publishedAt: null,
  ...patch,
});

const published = (slug: string, takenAt: string) => draftFields({ title: slug, slug, takenAt, status: "published", publishedAt: t0 });

// The behaviour both PhotoStore implementations must share.
export function describePhotoStore(name: string, make: () => Promise<PhotoStore>) {
  describe(name, () => {
    let store: PhotoStore;
    beforeEach(async () => {
      store = await make();
    });

    it("starts empty", async () => {
      expect(await store.list()).toEqual([]);
      expect(await store.listPublished()).toEqual([]);
      expect(await store.slugs()).toEqual([]);
      expect(await store.get("00000000-0000-4000-8000-000000000000")).toBeNull();
    });

    it("creates a draft with a uuid and ISO times, and reads it back whole", async () => {
      const result = await store.create(draftFields(), t0);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.photo).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        title: "",
        alt: "",
        takenAt: "2026-08-17T18:42:10",
        camera: "Fujifilm X100VI",
        slug: null,
        image,
        exif: { takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" },
        status: "draft",
        publishedAt: null,
        createdAt: t0.toISOString(),
        updatedAt: t0.toISOString(),
      });
      expect(await store.get(result.photo.id)).toEqual(result.photo);
    });

    it("lists every photo in site order and only published ones as published", async () => {
      await store.create(published("old", "2026-01-01T09:00:00"), t0);
      await store.create(published("new", "2026-09-01T09:00:00"), t0);
      await store.create(draftFields({ takenAt: "2026-05-01T09:00:00" }), t0);
      expect((await store.list()).map((p) => p.takenAt)).toEqual(["2026-09-01T09:00:00", "2026-05-01T09:00:00", "2026-01-01T09:00:00"]);
      expect((await store.listPublished()).map((p) => p.slug)).toEqual(["new", "old"]);
      expect((await store.slugs()).sort()).toEqual(["new", "old"]);
    });

    it("breaks a takenAt tie by id, descending", async () => {
      const a = await store.create(published("a", "2026-01-01T00:00:00"), t0);
      const b = await store.create(published("b", "2026-01-01T00:00:00"), t0);
      if (!a.ok || !b.ok) throw new Error("create failed");
      const ids = [a.photo.id, b.photo.id].sort().reverse();
      expect((await store.listPublished()).map((p) => p.id)).toEqual(ids);
    });

    it("refuses a slug that is taken, on create and on update", async () => {
      await store.create(published("stabilo", "2026-01-01T00:00:00"), t0);
      expect(await store.create(published("stabilo", "2026-02-01T00:00:00"), t0)).toEqual({ ok: false, reason: "duplicate-slug" });
      const draft = await store.create(draftFields(), t0);
      if (!draft.ok) throw new Error("create failed");
      expect(await store.update(draft.photo.id, published("stabilo", "2026-03-01T00:00:00"), draft.photo.updatedAt, t1)).toEqual({ ok: false, reason: "duplicate-slug" });
    });

    it("updates only from the updatedAt it last saw", async () => {
      const created = await store.create(draftFields(), t0);
      if (!created.ok) throw new Error("create failed");
      const { id, updatedAt } = created.photo;
      const updated = await store.update(id, draftFields({ title: "Moda" }), updatedAt, t1);
      expect(updated.ok && updated.photo.title).toBe("Moda");
      expect(updated.ok && updated.photo.updatedAt).toBe(t1.toISOString());
      expect(updated.ok && updated.photo.createdAt).toBe(t0.toISOString());
      expect(await store.update(id, draftFields({ title: "Stale" }), updatedAt, t1)).toEqual({ ok: false, reason: "conflict" });
      expect(await store.update("00000000-0000-4000-8000-000000000000", draftFields(), updatedAt, t1)).toEqual({ ok: false, reason: "missing" });
    });

    it("removes only from the updatedAt it last saw, and returns the photo", async () => {
      const created = await store.create(draftFields(), t0);
      if (!created.ok) throw new Error("create failed");
      expect(await store.remove(created.photo.id, t1.toISOString())).toEqual({ ok: false, reason: "conflict" });
      expect(await store.remove(created.photo.id, created.photo.updatedAt)).toEqual({ ok: true, photo: created.photo });
      expect(await store.get(created.photo.id)).toBeNull();
      expect(await store.remove(created.photo.id, created.photo.updatedAt)).toEqual({ ok: false, reason: "missing" });
    });
  });
}
```

`tests/photos/file-store.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FilePhotoStore, photosFileFor } from "@/lib/photos/file-store";
import { describePhotoStore } from "../helpers/photo-store-contract";

describePhotoStore("FilePhotoStore", async () => new FilePhotoStore(join(mkdtempSync(join(tmpdir(), "photos-")), "content.photos.json")));

describe("photosFileFor", () => {
  it("puts the photos next to the content store file", () => {
    expect(photosFileFor(".e2e-admin/content.json")).toBe(".e2e-admin/content.photos.json");
    expect(photosFileFor("store")).toBe("store.photos.json");
  });
});
```

`tests/photos/drizzle-store.test.ts`:

```ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { DrizzlePhotoStore } from "@/lib/photos/drizzle-store";
import { describePhotoStore } from "../helpers/photo-store-contract";

describePhotoStore("DrizzlePhotoStore", async () => {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" });
  return new DrizzlePhotoStore(db);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/photos/file-store.test.ts tests/photos/drizzle-store.test.ts`
Expected: FAIL (modules not found).

- [ ] **Step 3: Implement**

`lib/photos/store.ts`:

```ts
import type { Photo, PhotoContent, PhotoExif, PhotoImage, PhotoStatus, StoredPhoto } from "./types";

// Persistence for photos. DrizzlePhotoStore backs production (Neon);
// FilePhotoStore backs local dev and the admin e2e. Same semantics, pinned by
// tests/helpers/photo-store-contract.ts.

export interface PhotoFields extends PhotoContent {
  slug: string | null;
  image: PhotoImage;
  exif: PhotoExif;
  status: PhotoStatus;
  publishedAt: Date | null;
}

export type PhotoWrite = { ok: true; photo: StoredPhoto } | { ok: false; reason: "conflict" | "missing" | "duplicate-slug" };

export interface PhotoStore {
  // Every photo, any status, in site order (takenAt desc, then id desc).
  list(): Promise<StoredPhoto[]>;
  // Published photos, in site order.
  listPublished(): Promise<Photo[]>;
  get(id: string): Promise<StoredPhoto | null>;
  // Every slug in use.
  slugs(): Promise<string[]>;
  create(fields: PhotoFields, now: Date): Promise<PhotoWrite>;
  // Optimistic: `expected` is the updatedAt (ISO) the caller last saw.
  update(id: string, fields: PhotoFields, expected: string, now: Date): Promise<PhotoWrite>;
  remove(id: string, expected: string): Promise<PhotoWrite>;
}
```

`lib/photos/file-store.ts`:

```ts
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { PhotoFields, PhotoStore, PhotoWrite } from "./store";
import { type Photo, type StoredPhoto, bySiteOrder, isPublishedPhoto } from "./types";

// A JSON-file PhotoStore for local development and the admin e2e, next to the
// content store file (CONTENT_STORE_FILE). Same semantics as DrizzlePhotoStore.

export function photosFileFor(contentFile: string): string {
  return `${contentFile.replace(/\.json$/, "")}.photos.json`;
}

interface FileData {
  photos: Record<string, StoredPhoto>;
}

function toStored(id: string, fields: PhotoFields, createdAt: string, updatedAt: string): StoredPhoto {
  return {
    id,
    title: fields.title,
    alt: fields.alt,
    takenAt: fields.takenAt,
    camera: fields.camera,
    slug: fields.slug,
    image: fields.image,
    exif: fields.exif,
    status: fields.status,
    publishedAt: fields.publishedAt?.toISOString() ?? null,
    createdAt,
    updatedAt,
  };
}

export class FilePhotoStore implements PhotoStore {
  constructor(private path: string) {}

  private read(): FileData {
    if (!existsSync(this.path)) return { photos: {} };
    return JSON.parse(readFileSync(this.path, "utf8")) as FileData;
  }

  private write(data: FileData) {
    mkdirSync(dirname(this.path), { recursive: true });
    const temp = `${this.path}.tmp`;
    writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`);
    renameSync(temp, this.path);
  }

  private slugTaken(data: FileData, slug: string | null, except: string | null): boolean {
    return slug !== null && Object.values(data.photos).some((photo) => photo.slug === slug && photo.id !== except);
  }

  async list(): Promise<StoredPhoto[]> {
    return Object.values(this.read().photos).sort(bySiteOrder);
  }

  async listPublished(): Promise<Photo[]> {
    return Object.values(this.read().photos).filter(isPublishedPhoto).sort(bySiteOrder);
  }

  async get(id: string): Promise<StoredPhoto | null> {
    return this.read().photos[id] ?? null;
  }

  async slugs(): Promise<string[]> {
    return Object.values(this.read().photos).flatMap((photo) => (photo.slug ? [photo.slug] : []));
  }

  async create(fields: PhotoFields, now: Date): Promise<PhotoWrite> {
    const data = this.read();
    if (this.slugTaken(data, fields.slug, null)) return { ok: false, reason: "duplicate-slug" };
    const id = randomUUID();
    const photo = toStored(id, fields, now.toISOString(), now.toISOString());
    data.photos[id] = photo;
    this.write(data);
    return { ok: true, photo };
  }

  async update(id: string, fields: PhotoFields, expected: string, now: Date): Promise<PhotoWrite> {
    const data = this.read();
    const current = data.photos[id];
    if (!current) return { ok: false, reason: "missing" };
    if (current.updatedAt !== expected) return { ok: false, reason: "conflict" };
    if (this.slugTaken(data, fields.slug, id)) return { ok: false, reason: "duplicate-slug" };
    const photo = toStored(id, fields, current.createdAt, now.toISOString());
    data.photos[id] = photo;
    this.write(data);
    return { ok: true, photo };
  }

  async remove(id: string, expected: string): Promise<PhotoWrite> {
    const data = this.read();
    const current = data.photos[id];
    if (!current) return { ok: false, reason: "missing" };
    if (current.updatedAt !== expected) return { ok: false, reason: "conflict" };
    delete data.photos[id];
    this.write(data);
    return { ok: true, photo: current };
  }
}
```

`lib/photos/drizzle-store.ts`:

```ts
import { randomUUID } from "node:crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { photos } from "../db/schema";
import { photoExifSchema, photoImageSchema } from "./schema";
import type { PhotoFields, PhotoStore, PhotoWrite } from "./store";
import { NO_EXIF, type Photo, type PhotoStatus, type StoredPhoto, bySiteOrder, isPublishedPhoto } from "./types";

// Accepts any Postgres Drizzle database: neon-http in production, PGlite in tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;
type Row = typeof photos.$inferSelect;

// A row whose image no longer parses can't render: it is left out, with a
// warning, rather than breaking every photo page. An unreadable exif is dropped.
function toPhoto(row: Row): StoredPhoto | null {
  const image = photoImageSchema.safeParse(row.image);
  if (!image.success) {
    console.warn(`[photos] photo ${row.id} has an unreadable image; leaving it out`);
    return null;
  }
  const exif = photoExifSchema.safeParse(row.exif);
  return {
    id: row.id,
    title: row.title,
    alt: row.alt,
    takenAt: row.takenAt,
    camera: row.camera,
    slug: row.slug,
    image: image.data,
    exif: exif.success ? exif.data : NO_EXIF,
    status: row.status as PhotoStatus,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function readable(rows: Row[]): StoredPhoto[] {
  return rows.map(toPhoto).filter((photo): photo is StoredPhoto => photo !== null);
}

// Postgres unique_violation, raised by the slug constraint. Drizzle may wrap
// the driver error, so look at the cause too.
function isUniqueViolation(error: unknown): boolean {
  const code = (e: unknown) => (typeof e === "object" && e !== null && "code" in e ? (e as { code: unknown }).code : undefined);
  return code(error) === "23505" || code((error as { cause?: unknown })?.cause) === "23505";
}

export class DrizzlePhotoStore implements PhotoStore {
  constructor(private db: AnyPgDatabase) {}

  async list(): Promise<StoredPhoto[]> {
    return readable(await this.db.select().from(photos)).sort(bySiteOrder);
  }

  async listPublished(): Promise<Photo[]> {
    const rows = await this.db.select().from(photos).where(eq(photos.status, "published"));
    return readable(rows).filter(isPublishedPhoto).sort(bySiteOrder);
  }

  async get(id: string): Promise<StoredPhoto | null> {
    const rows = await this.db.select().from(photos).where(eq(photos.id, id)).limit(1);
    return rows[0] ? toPhoto(rows[0]) : null;
  }

  async slugs(): Promise<string[]> {
    const rows = await this.db.select({ slug: photos.slug }).from(photos).where(isNotNull(photos.slug));
    return rows.flatMap((row) => (row.slug ? [row.slug] : []));
  }

  async create(fields: PhotoFields, now: Date): Promise<PhotoWrite> {
    try {
      const rows = await this.db
        .insert(photos)
        .values({ id: randomUUID(), ...fields, createdAt: now, updatedAt: now })
        .returning();
      const photo = toPhoto(rows[0]);
      if (photo) return { ok: true, photo };
      throw new Error("the created photo is unreadable");
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, reason: "duplicate-slug" };
      throw e;
    }
  }

  async update(id: string, fields: PhotoFields, expected: string, now: Date): Promise<PhotoWrite> {
    try {
      const rows = await this.db
        .update(photos)
        .set({ ...fields, updatedAt: now })
        .where(and(eq(photos.id, id), eq(photos.updatedAt, new Date(expected))))
        .returning();
      const photo = rows[0] ? toPhoto(rows[0]) : null;
      if (photo) return { ok: true, photo };
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, reason: "duplicate-slug" };
      throw e;
    }
    return { ok: false, reason: (await this.exists(id)) ? "conflict" : "missing" };
  }

  async remove(id: string, expected: string): Promise<PhotoWrite> {
    const rows = await this.db
      .delete(photos)
      .where(and(eq(photos.id, id), eq(photos.updatedAt, new Date(expected))))
      .returning();
    const photo = rows[0] ? toPhoto(rows[0]) : null;
    if (photo) return { ok: true, photo };
    return { ok: false, reason: (await this.exists(id)) ? "conflict" : "missing" };
  }

  private async exists(id: string): Promise<boolean> {
    const rows = await this.db.select({ id: photos.id }).from(photos).where(eq(photos.id, id)).limit(1);
    return rows.length > 0;
  }
}
```

`lib/photos/get-store.ts`:

```ts
import "server-only";
import { getDb } from "../db/client";
import { DrizzlePhotoStore } from "./drizzle-store";
import { FilePhotoStore, photosFileFor } from "./file-store";
import type { PhotoStore } from "./store";

// The store for photos, chosen like getNoteStore: CONTENT_STORE_FILE (local
// dev, the admin e2e; refused on Vercel) wins, then Neon, else null (no
// photos render and the admin can't write).
export function getPhotoStore(): PhotoStore | null {
  const file = process.env.CONTENT_STORE_FILE;
  if (file) {
    if (process.env.VERCEL) throw new Error("CONTENT_STORE_FILE is for local development and e2e only");
    return new FilePhotoStore(photosFileFor(file));
  }
  const db = getDb();
  return db ? new DrizzlePhotoStore(db) : null;
}
```

`lib/photos/tags.ts`:

```ts
// The one cache tag for photos: every admin photo write calls updateTag(PHOTOS_TAG).
export const PHOTOS_TAG = "photos";
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/photos && npm run typecheck`
Expected: PASS (both stores run the contract).

- [ ] **Step 5: Commit**

```bash
git add lib/photos tests/helpers/photo-store-contract.ts tests/photos
git commit -m "Add the file and Drizzle photo stores

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Photo operations and deleting renditions

**Files:**
- Create: `lib/photos/operations.ts`
- Modify: `lib/media/storage.ts` (interface method, both implementations, `renditionNames`)
- Test: `tests/photos/operations.test.ts`, `tests/media/delete-renditions.test.ts`

**Interfaces:**
- Consumes: `PhotoStore`, `PhotoFields` (Task 2); `publishIssues`, `freeSlug`, `wallClock`, `photoContentSchema` (Task 1).
- Produces:
  - `PhotoOpResult = {status:"ok"; photo: StoredPhoto} | {status:"conflict"} | {status:"missing"} | {status:"invalid"; issues: PhotoIssue[]}`
  - `PhotoActionResult = PhotoOpResult | {status:"unauthorized"} | {status:"unavailable"}`
  - `PhotoInput {id; expected; content: unknown}`, `PhotoRef {id; expected}`
  - `createPhotoDraft(store, {image, exif}, now)`
  - `savePhoto(store, input, now)`, `publishPhoto(store, input, now)`
  - `deletePhoto(store, storage|null, ref)`
  - `MediaStorage.deleteRenditions(image: {key; widths; baseUrl?}): Promise<void>`
  - `renditionNames(key, widths): string[]`

- [ ] **Step 1: Write the failing tests**

`tests/photos/operations.test.ts`:

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FilePhotoStore } from "@/lib/photos/file-store";
import { createPhotoDraft, deletePhoto, publishPhoto, savePhoto } from "@/lib/photos/operations";
import type { StoredPhoto } from "@/lib/photos/types";

const t0 = new Date("2026-10-05T10:00:00.000Z");
const t1 = new Date("2026-10-05T10:05:00.000Z");
const image = { key: "media/photos/abc-12345678", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "https://b.public.blob.vercel-storage.com/media/photos/abc-12345678" };
const exif = { takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" };

let store: FilePhotoStore;
beforeEach(() => {
  store = new FilePhotoStore(join(mkdtempSync(join(tmpdir(), "photo-ops-")), "c.photos.json"));
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

async function draft(): Promise<StoredPhoto> {
  const result = await createPhotoDraft(store, { image, exif }, t0);
  if (result.status !== "ok") throw new Error(result.status);
  return result.photo;
}

const content = (photo: StoredPhoto, patch: Record<string, string> = {}) => ({ title: photo.title, alt: photo.alt, takenAt: photo.takenAt, camera: photo.camera, ...patch });

describe("createPhotoDraft", () => {
  it("fills the date and camera from EXIF", async () => {
    const photo = await draft();
    expect(photo).toMatchObject({ status: "draft", slug: null, title: "", alt: "", takenAt: exif.takenAt, camera: exif.camera, exif, image });
  });

  it("dates a photo without EXIF now, on the Istanbul clock, with no camera", async () => {
    const result = await createPhotoDraft(store, { image, exif: { takenAt: null, camera: null } }, t0);
    expect(result.status === "ok" && result.photo).toMatchObject({ takenAt: "2026-10-05T13:00:00", camera: "" });
  });
});

describe("savePhoto", () => {
  it("saves a draft without a title", async () => {
    const photo = await draft();
    const result = await savePhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { alt: "A hill" }) }, t1);
    expect(result.status === "ok" && result.photo).toMatchObject({ alt: "A hill", status: "draft" });
  });

  it("refuses bad content with field issues", async () => {
    const photo = await draft();
    const result = await savePhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { takenAt: "2026-02-30T00:00:00" }) }, t1);
    expect(result).toEqual({ status: "invalid", issues: [{ at: "takenAt", message: "Use a valid date." }] });
  });

  it("keeps a live photo publishable", async () => {
    const photo = await draft();
    const live = await publishPhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { title: "Kızılcıklı" }) }, t1);
    if (live.status !== "ok") throw new Error(live.status);
    const result = await savePhoto(store, { id: live.photo.id, expected: live.photo.updatedAt, content: content(live.photo, { title: "" }) }, t1);
    expect(result).toEqual({ status: "invalid", issues: [{ at: "title", message: "Add a title." }] });
  });

  it("reports a stale tab and a deleted photo", async () => {
    const photo = await draft();
    expect(await savePhoto(store, { id: photo.id, expected: "2000-01-01T00:00:00.000Z", content: content(photo) }, t1)).toEqual({ status: "conflict" });
    expect(await savePhoto(store, { id: "00000000-0000-4000-8000-000000000000", expected: photo.updatedAt, content: content(photo) }, t1)).toEqual({ status: "missing" });
  });
});

describe("publishPhoto", () => {
  it("needs a title", async () => {
    const photo = await draft();
    expect(await publishPhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo) }, t1)).toEqual({
      status: "invalid",
      issues: [{ at: "title", message: "Add a title." }],
    });
  });

  it("assigns a slug from the title at first publish, and never changes it", async () => {
    const photo = await draft();
    const first = await publishPhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { title: "Kızılcıklı akşam" }) }, t1);
    if (first.status !== "ok") throw new Error(first.status);
    expect(first.photo).toMatchObject({ slug: "kizilcikli-aksam", status: "published", publishedAt: t1.toISOString() });
    const again = await publishPhoto(store, { id: photo.id, expected: first.photo.updatedAt, content: content(first.photo, { title: "Renamed" }) }, t1);
    expect(again.status === "ok" && again.photo).toMatchObject({ slug: "kizilcikli-aksam", title: "Renamed", publishedAt: t1.toISOString() });
  });

  it("adds -2 when the slug is taken", async () => {
    for (const expectedSlug of ["stabilo", "stabilo-2"]) {
      const photo = await draft();
      const result = await publishPhoto(store, { id: photo.id, expected: photo.updatedAt, content: content(photo, { title: "Stabilo" }) }, t1);
      expect(result.status === "ok" && result.photo.slug).toBe(expectedSlug);
    }
  });
});

describe("deletePhoto", () => {
  it("removes the row, then its renditions", async () => {
    const photo = await draft();
    const storage = { deleteRenditions: vi.fn(async () => {}) };
    expect(await deletePhoto(store, storage, { id: photo.id, expected: photo.updatedAt })).toEqual({ status: "ok", photo });
    expect(storage.deleteRenditions).toHaveBeenCalledWith(image);
    expect(await store.get(photo.id)).toBeNull();
  });

  it("still deletes when the storage fails, and touches no files on a conflict", async () => {
    const photo = await draft();
    const failing = { deleteRenditions: vi.fn(async () => Promise.reject(new Error("blob down"))) };
    expect(await deletePhoto(store, failing, { id: photo.id, expected: "2000-01-01T00:00:00.000Z" })).toEqual({ status: "conflict" });
    expect(failing.deleteRenditions).not.toHaveBeenCalled();
    expect((await deletePhoto(store, failing, { id: photo.id, expected: photo.updatedAt })).status).toBe("ok");
    expect(console.warn).toHaveBeenCalled();
  });
});
```

`tests/media/delete-renditions.test.ts`:

```ts
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const del = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@vercel/blob", () => ({ del, put: vi.fn() }));

import { BlobMediaStorage, LocalMediaStorage, renditionNames } from "@/lib/media/storage";

beforeEach(() => del.mockClear());

describe("renditionNames", () => {
  it("lists every width as AVIF and JPEG", () => {
    expect(renditionNames("media/photos/a", [640, 1280])).toEqual(["media/photos/a-640.avif", "media/photos/a-640.jpg", "media/photos/a-1280.avif", "media/photos/a-1280.jpg"]);
  });
});

describe("LocalMediaStorage.deleteRenditions", () => {
  it("removes the files and ignores ones already gone", async () => {
    const storage = new LocalMediaStorage(mkdtempSync(join(tmpdir(), "media-")));
    const baseUrl = (await storage.putFile("media/photos/a-640.jpg", Buffer.from("x"), "image/jpeg")).slice(0, -"-640.jpg".length);
    await storage.deleteRenditions({ key: "media/photos/a", widths: [640], baseUrl });
    expect(existsSync(storage.resolveLocal("media/photos/a-640.jpg")!)).toBe(false);
  });

  it("never touches a repo image (no baseUrl) or a key outside media/", async () => {
    const storage = new LocalMediaStorage(mkdtempSync(join(tmpdir(), "media-")));
    await storage.putFile("photos/x-640.jpg", Buffer.from("x"), "image/jpeg");
    await storage.deleteRenditions({ key: "photos/x", widths: [640] });
    await storage.deleteRenditions({ key: "photos/x", widths: [640], baseUrl: "/api/media-dev/photos/x" });
    expect(existsSync(storage.resolveLocal("photos/x-640.jpg")!)).toBe(true);
  });
});

describe("BlobMediaStorage.deleteRenditions", () => {
  it("deletes every rendition URL in one call", async () => {
    const baseUrl = "https://b.public.blob.vercel-storage.com/media/photos/a";
    await new BlobMediaStorage().deleteRenditions({ key: "media/photos/a", widths: [640, 1280], baseUrl });
    expect(del).toHaveBeenCalledWith([`${baseUrl}-640.avif`, `${baseUrl}-640.jpg`, `${baseUrl}-1280.avif`, `${baseUrl}-1280.jpg`]);
  });

  it("skips images that are not in Blob", async () => {
    await new BlobMediaStorage().deleteRenditions({ key: "photos/x", widths: [640] });
    await new BlobMediaStorage().deleteRenditions({ key: "media/photos/a", widths: [640], baseUrl: "https://evil.test/media/photos/a" });
    expect(del).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/photos/operations.test.ts tests/media/delete-renditions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

In `lib/media/storage.ts`:
- Add to the `MediaStorage` interface, after `putFile`:

```ts
  // Removes an uploaded image's renditions (every width, AVIF and JPEG).
  // Repo images (no baseUrl) and keys outside media/ are never touched.
  deleteRenditions(image: { key: string; widths: number[]; baseUrl?: string }): Promise<void>;
```

- Add the exported helper below the imports:

```ts
export function renditionNames(key: string, widths: number[]): string[] {
  return widths.flatMap((width) => [`${key}-${width}.avif`, `${key}-${width}.jpg`]);
}
```

- In `LocalMediaStorage`:

```ts
  async deleteRenditions(image: { key: string; widths: number[]; baseUrl?: string }): Promise<void> {
    if (!image.baseUrl || !image.key.startsWith("media/")) return;
    for (const name of renditionNames(image.key, image.widths)) {
      const file = this.resolveLocal(name);
      if (file && existsSync(file)) rmSync(file);
    }
  }
```

- In `BlobMediaStorage`:

```ts
  async deleteRenditions(image: { key: string; widths: number[]; baseUrl?: string }): Promise<void> {
    if (!image.baseUrl || !image.key.startsWith("media/")) return;
    const base = new URL(image.baseUrl);
    if (base.protocol !== "https:" || !base.hostname.endsWith(".public.blob.vercel-storage.com")) return;
    await del(image.widths.flatMap((width) => [`${image.baseUrl}-${width}.avif`, `${image.baseUrl}-${width}.jpg`]));
  }
```

If any test file or module builds its own `MediaStorage` object (`grep -rn "MediaStorage" tests lib app`), add a `deleteRenditions: async () => {}` to it so `npm run typecheck` passes.

`lib/photos/operations.ts`:

```ts
import type { MediaStorage } from "../media/storage";
import { publishIssues } from "./rules";
import { photoContentSchema } from "./schema";
import { freeSlug } from "./slug";
import type { PhotoFields, PhotoStore, PhotoWrite } from "./store";
import { wallClock } from "./taken-at";
import type { PhotoContent, PhotoExif, PhotoImage, PhotoIssue, StoredPhoto } from "./types";

// The admin's photo writes (Sprint 11 spec §1–§2), independent of Next so they
// can be tested against FilePhotoStore. app/admin/photos-actions.ts wraps them
// with the session check, the store and updateTag(PHOTOS_TAG).

export type PhotoOpResult =
  | { status: "ok"; photo: StoredPhoto }
  | { status: "conflict" }
  | { status: "missing" }
  | { status: "invalid"; issues: PhotoIssue[] };

// What a server action returns: the operation's result, or the two outcomes
// that only exist at the request level.
export type PhotoActionResult = PhotoOpResult | { status: "unauthorized" } | { status: "unavailable" };

// A photo exists from its upload on, so every write names one; `expected` is
// the updatedAt the author last saw.
export interface PhotoInput {
  id: string;
  expected: string;
  content: unknown;
}

export interface PhotoRef {
  id: string;
  expected: string;
}

export type RenditionRemover = Pick<MediaStorage, "deleteRenditions">;

// Two publishes can race for a slug; a fresh look at the slugs settles it.
const SLUG_ATTEMPTS = 3;

function invalid(issues: PhotoIssue[]): PhotoOpResult {
  return { status: "invalid", issues };
}

function parse(content: unknown): { ok: true; value: PhotoContent } | { ok: false; issues: PhotoIssue[] } {
  const parsed = photoContentSchema.safeParse(content);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, issues: parsed.error.issues.map((issue) => ({ at: issue.path.join("/"), message: issue.message })) };
}

function fieldsOf(photo: StoredPhoto): PhotoFields {
  return {
    title: photo.title,
    alt: photo.alt,
    takenAt: photo.takenAt,
    camera: photo.camera,
    slug: photo.slug,
    image: photo.image,
    exif: photo.exif,
    status: photo.status,
    publishedAt: photo.publishedAt ? new Date(photo.publishedAt) : null,
  };
}

function fromWrite(write: PhotoWrite): PhotoOpResult {
  if (write.ok) return { status: "ok", photo: write.photo };
  return write.reason === "missing" ? { status: "missing" } : { status: "conflict" };
}

// A new draft from an upload: EXIF fills the date and camera. Without an EXIF
// date the photo is dated now, on the Istanbul clock.
export async function createPhotoDraft(store: PhotoStore, upload: { image: PhotoImage; exif: PhotoExif }, now: Date): Promise<PhotoOpResult> {
  return fromWrite(
    await store.create(
      {
        title: "",
        alt: "",
        takenAt: upload.exif.takenAt ?? wallClock(now),
        camera: upload.exif.camera ?? "",
        slug: null,
        image: upload.image,
        exif: upload.exif,
        status: "draft",
        publishedAt: null,
      },
      now,
    ),
  );
}

export async function savePhoto(store: PhotoStore, input: PhotoInput, now: Date): Promise<PhotoOpResult> {
  const parsed = parse(input.content);
  if (!parsed.ok) return invalid(parsed.issues);
  const current = await store.get(input.id);
  if (!current) return { status: "missing" };
  // A published photo is live: it must stay publishable.
  if (current.status === "published") {
    const issues = publishIssues(parsed.value);
    if (issues.length > 0) return invalid(issues);
  }
  return fromWrite(await store.update(current.id, { ...fieldsOf(current), ...parsed.value }, input.expected, now));
}

// First publish assigns the slug and the publish time; publishing a live photo
// again is a save. Neither ever changes afterwards.
export async function publishPhoto(store: PhotoStore, input: PhotoInput, now: Date): Promise<PhotoOpResult> {
  const parsed = parse(input.content);
  if (!parsed.ok) return invalid(parsed.issues);
  const issues = publishIssues(parsed.value);
  if (issues.length > 0) return invalid(issues);
  const current = await store.get(input.id);
  if (!current) return { status: "missing" };
  if (current.status === "published") return fromWrite(await store.update(current.id, { ...fieldsOf(current), ...parsed.value }, input.expected, now));
  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = freeSlug(parsed.value.title, await store.slugs());
    const result = await store.update(current.id, { ...fieldsOf(current), ...parsed.value, slug, status: "published", publishedAt: now }, input.expected, now);
    if (!result.ok && result.reason === "duplicate-slug") continue;
    return fromWrite(result);
  }
  return { status: "conflict" };
}

// The row goes first, then the files. A storage failure is logged, not
// returned: the photo is off the site either way.
export async function deletePhoto(store: PhotoStore, storage: RenditionRemover | null, ref: PhotoRef): Promise<PhotoOpResult> {
  const result = await store.remove(ref.id, ref.expected);
  if (result.ok && storage) {
    try {
      await storage.deleteRenditions(result.photo.image);
    } catch (e) {
      console.warn(`[photos] deleting the renditions of ${result.photo.id} failed:`, e instanceof Error ? e.message : e);
    }
  }
  return fromWrite(result);
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/photos tests/media && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/photos/operations.ts lib/media/storage.ts tests/photos/operations.test.ts tests/media/delete-renditions.test.ts
git commit -m "Add photo writes, with slugs at first publish and rendition cleanup on delete

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(Add any test fakes you had to touch for `deleteRenditions` to the same commit.)

---

### Task 4: EXIF reader

**Files:**
- Modify: `package.json`, `package-lock.json` (add `exifr`)
- Create: `lib/photos/exif.ts`
- Test: `tests/photos/exif.test.ts` (uses the committed `tests/fixtures/photos/exif.heic` and `exif-gps.jpg`, both carrying GPS)

**Interfaces:**
- Consumes: `PhotoExif`, `NO_EXIF` (Task 1); `isTakenAt` (Task 1).
- Produces:
  - `EXIF_TAGS`
  - `takenAtFrom(value)`, `cameraFrom(make, model)`, `exifFromTags(tags)`
  - `readExif(file: Blob | ArrayBuffer | Uint8Array): Promise<PhotoExif>` (never throws)

- [ ] **Step 1: Add the dependency**

Run: `npm install exifr@7.1.3 --save-exact`
Expected: `"exifr": "7.1.3"` in `dependencies`.

- [ ] **Step 2: Write the failing test**

`tests/photos/exif.test.ts`:

```ts
import { readFileSync } from "node:fs";
import exifr from "exifr";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { EXIF_TAGS, cameraFrom, readExif, takenAtFrom } from "@/lib/photos/exif";

const heic = readFileSync("tests/fixtures/photos/exif.heic");
const jpeg = readFileSync("tests/fixtures/photos/exif-gps.jpg");

describe("takenAtFrom", () => {
  it("turns EXIF's date shape into wall-clock text", () => {
    expect(takenAtFrom("2026:08:17 18:42:10")).toBe("2026-08-17T18:42:10");
    expect(takenAtFrom("2026-08-17T18:42:10")).toBe("2026-08-17T18:42:10");
  });

  it("refuses blanks, zeros and other types", () => {
    expect(takenAtFrom("0000:00:00 00:00:00")).toBeNull();
    expect(takenAtFrom("    :  :     :  :  ")).toBeNull();
    expect(takenAtFrom(new Date())).toBeNull();
    expect(takenAtFrom(undefined)).toBeNull();
  });
});

describe("cameraFrom", () => {
  it("names cameras the way people say them", () => {
    expect(cameraFrom("Apple", "iPhone 17 Pro")).toBe("iPhone 17 Pro");
    expect(cameraFrom("FUJIFILM", "X100VI")).toBe("Fujifilm X100VI");
    expect(cameraFrom("Canon", "Canon EOS R5")).toBe("Canon EOS R5");
    expect(cameraFrom("NIKON CORPORATION", "NIKON Z 6")).toBe("NIKON Z 6");
    expect(cameraFrom("SONY", "ILCE-7M4")).toBe("Sony ILCE-7M4");
    expect(cameraFrom(undefined, "Pixel 9")).toBe("Pixel 9");
  });

  it("has no camera without a model", () => {
    expect(cameraFrom("Apple", undefined)).toBeNull();
    expect(cameraFrom(undefined, "  ")).toBeNull();
  });
});

describe("readExif", () => {
  it("reads an iPhone HEIC", async () => {
    expect(await readExif(heic)).toEqual({ takenAt: "2026-10-04T18:22:05", camera: "iPhone 17 Pro" });
  });

  it("reads a JPEG", async () => {
    expect(await readExif(jpeg)).toEqual({ takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" });
  });

  it("never parses GPS, although both fixtures carry it", async () => {
    expect((await exifr.gps(jpeg))?.latitude).toBe(41);
    const tags = await exifr.parse(jpeg, { pick: EXIF_TAGS, reviveValues: false });
    expect(Object.keys(tags).sort()).toEqual(["DateTimeOriginal", "Make", "Model"]);
  });

  it("gives no EXIF for a file without it or a file it can't read", async () => {
    const plain = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#ffffff" } }).jpeg().toBuffer();
    expect(await readExif(plain)).toEqual({ takenAt: null, camera: null });
    expect(await readExif(Buffer.from("not an image"))).toEqual({ takenAt: null, camera: null });
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run tests/photos/exif.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement**

`lib/photos/exif.ts`:

```ts
import exifr from "exifr";
import { isTakenAt } from "./taken-at";
import { NO_EXIF, type PhotoExif } from "./types";

// EXIF for a photo upload (Sprint 11 spec §2), read in the browser before the
// HEIC→JPEG redraw drops it. Only these three tags are ever parsed, never GPS.
export const EXIF_TAGS = ["DateTimeOriginal", "Make", "Model"];

// "2026:08:17 18:42:10", EXIF's own shape, becomes "2026-08-17T18:42:10".
export function takenAtFrom(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const takenAt = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  return isTakenAt(takenAt) ? takenAt : null;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\0/g, "").trim() : "";
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// The brand is Make's first word ("NIKON CORPORATION" → Nikon). Apple models
// stand alone ("iPhone 17 Pro"), as do models that already name the brand.
export function cameraFrom(make: unknown, model: unknown): string | null {
  const name = clean(model);
  if (!name) return null;
  const brand = clean(make).split(/\s+/)[0] ?? "";
  if (!brand || brand.toLowerCase() === "apple" || name.toLowerCase().startsWith(brand.toLowerCase())) return name;
  return `${titleCase(brand)} ${name}`;
}

export function exifFromTags(tags: Record<string, unknown> | null | undefined): PhotoExif {
  return { takenAt: takenAtFrom(tags?.DateTimeOriginal), camera: cameraFrom(tags?.Make, tags?.Model) };
}

// Never throws: a file exifr can't read simply has no EXIF.
export async function readExif(file: Blob | ArrayBuffer | Uint8Array): Promise<PhotoExif> {
  try {
    const tags = (await exifr.parse(file, { pick: EXIF_TAGS, reviveValues: false })) as Record<string, unknown> | undefined;
    return exifFromTags(tags);
  } catch {
    return NO_EXIF;
  }
}
```

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/photos/exif.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/photos/exif.ts tests/photos/exif.test.ts tests/fixtures/photos
git commit -m "Read a photo's date and camera from EXIF, never its location

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Public read path, fixtures and every site consumer

This task changes the `Photo` type that every consumer reads, so the read path and the consumers move together.

**Files:**
- Create: `lib/photos/read.ts`, `lib/photos/fixtures.ts`
- Create: `images-src/fixtures/photo-landscape.jpeg`, `photo-wide.jpeg`, `photo-portrait.jpeg`, plus their outputs from `npm run images` (`public/images/fixtures/*`, `lib/images/manifest.json`)
- Rewrite: `lib/content/photos.ts`
- Modify:
  - `lib/notes/fixtures.ts` (image keys)
  - `components/photos/photo-grid.tsx`
  - `app/life/photos/[slug]/page.tsx`
  - `app/(work)/system/page.tsx`
  - `app/feed.xml/route.ts`
  - `lib/feed/rss.ts`
- Tests:
  - Rewrite: `tests/content/photos.test.ts`
  - Create: `tests/photos/read.test.ts`, `tests/photos/fixtures.test.ts`
  - Modify: `tests/feed/rss.test.ts`, `tests/ui/life-sections.test.tsx`, any notes fixture test that names the old keys
- e2e:
  - Move most of `e2e/photos.spec.ts` to `e2e-fixtures/photos.spec.ts`.
  - Move the photos-row test from `e2e/life.spec.ts` to `e2e-fixtures/life.spec.ts`.
  - Change `e2e/feed.spec.ts`; add to `e2e-fixtures/feed.spec.ts`.

**Interfaces:**
- Consumes: `PhotoStore`/`getPhotoStore`, `PHOTOS_TAG` (Task 2); types and helpers (Task 1).
- Produces:
  - `getPublishedPhotos(): Promise<Photo[]>` (cached, tagged, fail-soft, fixtures when `SOURCE_FIXTURES=1`)
  - `fixturePhotos(): Photo[]`, in site order. The three fixtures:

    | slug | title | taken | camera | image | alt |
    |---|---|---|---|---|---|
    | `night-boulevard` | Night Boulevard | 2026-09-12T21:40:00 | iPhone 17 Pro | `fixtures/photo-wide` 2560×1440 | (empty) |
    | `kizilcikli` | Kızılcıklı | 2026-08-17T18:42:10 | Fujifilm X100VI | `fixtures/photo-landscape` 2560×1707 | "Evening light over a hillside village" |
    | `stabilo` | Stabilo | 2026-04-11T12:00:00 | iPhone 17 | `fixtures/photo-portrait` 1600×2000 | (empty) |

  - `lib/content/photos.ts` exports `Photo` (re-exported from `lib/photos/types`), `getPhotos()`, `getPhoto(slug)` and the generic `adjacentPhotos<T extends {slug: string}>(photos, slug)`.
  - `FeedInput.photos` becomes `Pick<Photo, "slug" | "title" | "alt" | "takenAt" | "image">[]`.

- [ ] **Step 1: Make the fixture images**

```bash
mkdir -p images-src/fixtures
node --input-type=module -e '
import sharp from "sharp";
const make = (w, h, top, bottom, name) => sharp({ create: { width: w, height: h, channels: 3, background: top } })
  .composite([{ input: { create: { width: w, height: Math.round(h / 3), channels: 3, background: bottom } }, gravity: "south" }])
  .jpeg({ quality: 90 })
  .toFile(`images-src/fixtures/${name}.jpeg`);
await Promise.all([
  make(2560, 1707, "#2F55F5", "#1F1F22", "photo-landscape"),
  make(2560, 1440, "#C27C0E", "#1F1F22", "photo-wide"),
  make(1600, 2000, "#6E6E73", "#FAFAF8", "photo-portrait"),
]);'
npm run images
```

Expected: `lib/images/manifest.json` gains `fixtures/photo-landscape` (2560×1707, widths [640,1280,2560]), `fixtures/photo-wide` (2560×1440) and `fixtures/photo-portrait` (1600×2000, widths [640,1280,1600]). Renditions appear in `public/images/fixtures/`. The `photos/*` entries stay for now; Task 9 removes them.

- [ ] **Step 2: Write the failing unit tests**

`tests/photos/read.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cacheLife: vi.fn(), cacheTag: vi.fn(), getPhotoStore: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: mocks.cacheLife, cacheTag: mocks.cacheTag }));
vi.mock("@/lib/photos/get-store", () => ({ getPhotoStore: mocks.getPhotoStore }));

import { getPublishedPhotos } from "@/lib/photos/read";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("getPublishedPhotos", () => {
  it("tags the read and returns the store's published photos for days", async () => {
    mocks.getPhotoStore.mockReturnValue({ listPublished: async () => ["p"] });
    expect(await getPublishedPhotos()).toEqual(["p"]);
    expect(mocks.cacheTag).toHaveBeenCalledWith("photos");
    expect(mocks.cacheLife).toHaveBeenCalledWith("days");
  });

  it("returns nothing without a store", async () => {
    mocks.getPhotoStore.mockReturnValue(null);
    expect(await getPublishedPhotos()).toEqual([]);
    expect(mocks.cacheLife).toHaveBeenCalledWith("hours");
  });

  it("fails soft for minutes on a store error", async () => {
    mocks.getPhotoStore.mockReturnValue({ listPublished: async () => Promise.reject(new Error("down")) });
    expect(await getPublishedPhotos()).toEqual([]);
    expect(mocks.cacheLife).toHaveBeenCalledWith("minutes");
  });

  it("serves the fixture photos in fixture mode", async () => {
    vi.stubEnv("SOURCE_FIXTURES", "1");
    expect((await getPublishedPhotos()).map((p) => p.slug)).toEqual(["night-boulevard", "kizilcikli", "stabilo"]);
    expect(mocks.getPhotoStore).not.toHaveBeenCalled();
  });
});
```

`tests/photos/fixtures.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fixturePhotos } from "@/lib/photos/fixtures";
import { isPublishedPhoto, photoAlt } from "@/lib/photos/types";

describe("fixturePhotos", () => {
  it("are three published photos, newest taken first, at three ratios", () => {
    const photos = fixturePhotos();
    expect(photos.map((p) => p.slug)).toEqual(["night-boulevard", "kizilcikli", "stabilo"]);
    expect(photos.every(isPublishedPhoto)).toBe(true);
    expect(photos.map((p) => [p.image.width, p.image.height])).toEqual([
      [2560, 1440],
      [2560, 1707],
      [1600, 2000],
    ]);
  });

  it("only Kızılcıklı has its own alt text", () => {
    expect(fixturePhotos().map(photoAlt)).toEqual(["Night Boulevard", "Evening light over a hillside village", "Stabilo"]);
  });
});
```

Replace `tests/content/photos.test.ts` with:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));

const { adjacentPhotos } = await import("@/lib/content/photos");

describe("adjacentPhotos", () => {
  const photo = (slug: string) => ({ slug });
  const photos = [photo("newest"), photo("middle"), photo("oldest")];

  it("returns the newer photo as previous and the older one as next", () => {
    expect(adjacentPhotos(photos, "middle")).toEqual({ previous: photos[0], next: photos[2] });
  });

  it("has no previous at the start, no next at the end, nothing for unknown slugs", () => {
    expect(adjacentPhotos(photos, "newest")).toEqual({ previous: null, next: photos[1] });
    expect(adjacentPhotos(photos, "oldest")).toEqual({ previous: photos[1], next: null });
    expect(adjacentPhotos(photos, "nope")).toEqual({ previous: null, next: null });
  });
});
```

In `tests/feed/rss.test.ts`, replace the `photo` constant and the `photos: [photo]` uses:

```ts
const photo = {
  slug: "stabilo",
  title: "Stabilo & co",
  alt: "",
  takenAt: "2026-02-10T09:30:00",
  image: { key: "photos/stabilo", width: 2560, height: 1707, widths: [640, 1280, 2560] },
};
```

The existing assertions on `items[1]` stay the same. Add this test inside `describe("buildFeed")`:

```ts
  it("gives a photo its alt text and its Blob rendition", () => {
    const blob = { ...photo, alt: "A pen", image: { ...photo.image, key: "media/photos/a", baseUrl: "https://b.public.blob.vercel-storage.com/media/photos/a" } };
    const xml = buildFeed({ siteUrl: SITE, title: "T", notes: [], photos: [blob] });
    expect(xml).toContain("https://b.public.blob.vercel-storage.com/media/photos/a-1280.jpg");
    expect(xml).toContain("alt=&quot;A pen&quot;");
    expect(xml).toContain("<pubDate>Tue, 10 Feb 2026 00:00:00 GMT</pubDate>");
  });
```

In `tests/ui/life-sections.test.tsx`, change both photo literals to:

```ts
const photos = [{ slug: "bold-vakif-building", title: "Bold Vakif Building", image: { key: "photos/bold-vakif-building", width: 2560, height: 1440, widths: [640, 1280, 2560] } }];
```

- [ ] **Step 3: Run them to see them fail**

Run: `npx vitest run tests/photos tests/content/photos.test.ts tests/feed tests/ui/life-sections.test.tsx`
Expected: FAIL.

- [ ] **Step 4: Implement the read path**

`lib/photos/fixtures.ts`:

```ts
import { findImage } from "@/lib/images/manifest";
import { type Photo, type PhotoImage, bySiteOrder } from "./types";

// Fixture mode (SOURCE_FIXTURES=1): three published photos so the photo pages
// build and test without a database. Their images are repo fixtures
// (images-src/fixtures/) at three ratios. Dev and CI only.

function image(key: string): PhotoImage {
  const entry = findImage(key);
  if (!entry) throw new Error(`fixture image ${key} is not in the manifest`);
  return { key, width: entry.width, height: entry.height, widths: entry.widths };
}

function photo(n: number, slug: string, title: string, takenAt: string, camera: string, key: string, alt = ""): Photo {
  const at = `${takenAt}.000Z`;
  return {
    id: `00000000-0000-4000-8000-00000000000${n}`,
    slug,
    title,
    alt,
    takenAt,
    camera,
    image: image(key),
    exif: { takenAt, camera },
    status: "published",
    publishedAt: at,
    createdAt: at,
    updatedAt: at,
  };
}

export function fixturePhotos(): Photo[] {
  return [
    photo(1, "stabilo", "Stabilo", "2026-04-11T12:00:00", "iPhone 17", "fixtures/photo-portrait"),
    photo(2, "kizilcikli", "Kızılcıklı", "2026-08-17T18:42:10", "Fujifilm X100VI", "fixtures/photo-landscape", "Evening light over a hillside village"),
    photo(3, "night-boulevard", "Night Boulevard", "2026-09-12T21:40:00", "iPhone 17 Pro", "fixtures/photo-wide"),
  ].sort(bySiteOrder);
}
```

`lib/photos/read.ts`:

```ts
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fixturePhotos } from "./fixtures";
import { getPhotoStore } from "./get-store";
import type { PhotoStore } from "./store";
import { PHOTOS_TAG } from "./tags";
import type { Photo } from "./types";

// The one public read of photos: every published photo in site order, cached
// and tagged so pages stay prerendered until an admin write updates
// PHOTOS_TAG. Never throws: no store or a store error renders no photos (an
// error is cached for minutes only, since it is probably transient).
export async function getPublishedPhotos(): Promise<Photo[]> {
  "use cache";
  cacheTag(PHOTOS_TAG);

  if (process.env.SOURCE_FIXTURES === "1") {
    cacheLife("hours");
    return fixturePhotos();
  }
  let store: PhotoStore | null;
  try {
    store = getPhotoStore();
  } catch (e) {
    console.warn("[photos] no store:", e instanceof Error ? e.message : e);
    store = null;
  }
  if (!store) {
    cacheLife("hours");
    return [];
  }
  try {
    const photos = await store.listPublished();
    cacheLife("days");
    return photos;
  } catch (e) {
    console.warn("[photos] reading photos failed:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return [];
  }
}
```

Replace `lib/content/photos.ts`:

```ts
import { getPublishedPhotos } from "@/lib/photos/read";
import type { Photo } from "@/lib/photos/types";

export type { Photo } from "@/lib/photos/types";

// Photos live in the database since Sprint 11 (lib/photos/); this module keeps
// the API the pages already use. Published photos, newest taken first.
export async function getPhotos(): Promise<Photo[]> {
  return getPublishedPhotos();
}

export async function getPhoto(slug: string): Promise<Photo | undefined> {
  return (await getPhotos()).find((photo) => photo.slug === slug);
}

// The neighbours of a photo in index order (newest first): previous is the
// newer one, next the older one.
export function adjacentPhotos<T extends { slug: string }>(photos: T[], slug: string): { previous: T | null; next: T | null } {
  const index = photos.findIndex((photo) => photo.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return { previous: photos[index - 1] ?? null, next: photos[index + 1] ?? null };
}
```

In `lib/notes/fixtures.ts`, replace `photos/kizilcikli` with `fixtures/photo-landscape` and `photos/bold-vakif-building` with `fixtures/photo-wide` (three places). Update any notes test that asserts those keys or their sizes.

- [ ] **Step 5: Change the consumers**

`components/photos/photo-grid.tsx`:
- Import `PictureView` from `@/components/picture-view` instead of `Picture`.
- Type the prop `photos: Pick<Photo, "slug" | "title" | "image">[]`.
- Render:

```tsx
            <PictureView
              image={photo.image.key}
              entry={photo.image}
              alt=""
              sizes={sizes}
              className={compact ? "mb-1 aspect-[3/2] w-full object-cover" : "aspect-[3/2] w-full object-cover"}
            />
```

`app/life/photos/[slug]/page.tsx`. Replace the imports, `generateStaticParams`, `generateMetadata` and the page body's picture and meta lines:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PictureView } from "@/components/picture-view";
import { ItemLink } from "@/components/sections/item-link";
import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";
import { type Photo, adjacentPhotos, getPhoto, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import { PLACEHOLDER_PHOTO_SLUG } from "@/lib/photos/slug";
import { photoAlt, photoDay } from "@/lib/photos/types";

// The picture spans the full-width shell: 40px side padding from md, 16px below.
const SIZES = "(min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)";

// generateStaticParams must return one param under cacheComponents. "_" is
// never a slug, so with no photos its page is a 404. A photo published after
// the build renders on demand and is cached under PHOTOS_TAG, like a new note.
export async function generateStaticParams() {
  const slugs = (await getPhotos()).map((photo) => ({ slug: photo.slug }));
  return slugs.length > 0 ? slugs : [{ slug: PLACEHOLDER_PHOTO_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/life/photos/[slug]">): Promise<Metadata> {
  const photo = await getPhoto((await params).slug);
  if (!photo) return {};
  // Social crawlers don't reliably render AVIF: always the largest JPEG.
  const ogImage = {
    url: renditionUrl(photo.image.key, photo.image.width, "jpg", photo.image.baseUrl),
    width: photo.image.width,
    height: photo.image.height,
    alt: photoAlt(photo),
  };
  return pageMetadata(photo.title, {
    description: photo.title,
    openGraph: { type: "article", description: photo.title, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  });
}
```

`Neighbour` is unchanged. In `PhotoPage`, the picture and date lines become:

```tsx
      <PictureView image={photo.image.key} entry={photo.image} alt={photoAlt(photo)} sizes={SIZES} priority />
```

```tsx
          <time dateTime={photoDay(photo)}>{formatDate(photoDay(photo))}</time>
```

`app/(work)/system/page.tsx`:
- The photo columns become:

```ts
const photoColumns = [
  { header: "Title", cell: (photo: Photo) => photo.title },
  { header: "Camera", cell: (photo: Photo) => photo.camera, mono: true },
  { header: "Date", cell: (photo: Photo) => formatDate(photoDay(photo)), mono: true, align: "right" as const },
];
```

- The `RelativeTime` specimen becomes `<RelativeTime iso={`${photoDay(photo)}T00:00:00.000Z`} />`.
- The `Picture` specimen becomes:

```tsx
              <PictureView image={photo.image.key} entry={photo.image} alt={photoAlt(photo)} sizes="384px" />
```

- Import `photoAlt` and `photoDay` from `@/lib/photos/types`, and `PictureView` from `@/components/picture-view`.
- Drop the `Picture` import if nothing else on the page uses it.

`lib/feed/rss.ts`:
- Import `type Photo, photoAlt, photoDay` from `@/lib/photos/types` instead of the `Photo` type from `@/lib/content/photos`.
- Drop the `ImageEntry` import only if nothing else uses it.
- Change `FeedInput.photos`:

```ts
  photos: Pick<Photo, "slug" | "title" | "alt" | "takenAt" | "image">[];
```

The photo items become:

```ts
    ...photos.map((photo) => ({
      title: photo.title,
      link: `${siteUrl}/life/photos/${photo.slug}/`,
      guid: `${siteUrl}/life/photos/${photo.slug}/`,
      guidIsPermaLink: true,
      description: `<p><img src="${escapeXml(feedImage(siteUrl, photo.image.key, photo.image))}" alt="${escapeXml(photoAlt(photo))}"></p>`,
      date: `${photoDay(photo)}T00:00:00.000Z`,
    })),
```

`app/feed.xml/route.ts`:

```ts
import { cacheLife, cacheTag } from "next/cache";
import { getPhotos } from "@/lib/content/photos";
import { buildFeed } from "@/lib/feed/rss";
import { getPublishedNotes } from "@/lib/notes/read";
import { NOTES_TAG } from "@/lib/notes/tags";
import { PHOTOS_TAG } from "@/lib/photos/tags";
import { site } from "@/lib/site";

// Prerendered at build and regenerated when the notes or photos tag is
// revalidated (an admin write, the notes cron). "hours" caps how long a
// database error's empty list could stick.
async function feedXml(): Promise<string> {
  "use cache";
  cacheTag(NOTES_TAG, PHOTOS_TAG);
  cacheLife("hours");
  const [notes, photos] = await Promise.all([getPublishedNotes(), getPhotos()]);
  return buildFeed({ siteUrl: site.url, title: site.title, notes, photos });
}

export async function GET() {
  return new Response(await feedXml(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
```

Find any other consumer of `photo.image` as a string, `photo.date` or `Picture` with a photo: `grep -rn "photo\.date\|photo\.image\b\|getImage(photo" app components lib`. Change each to `photoDay(photo)` or `photo.image.key` with `PictureView`.

- [ ] **Step 6: Run the unit tests and the type check**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 7: Move the e2e expectations**

Without a database, the default e2e build has no photos. Tests that need photos move to the fixture pass.

Replace `e2e/photos.spec.ts` with the two data-free tests. Keep "pages without a photo share the defaults…" and "/photos/ URLs redirect permanently to /life/photos/" exactly as they are, and add:

```ts
test("without a database the photos index renders empty", async ({ page }) => {
  const response = await page.goto("/life/photos/");
  expect(response?.status()).toBe(200);
  await expect(page.locator('main a[href^="/life/photos/"]')).toHaveCount(0);
});
```

Create `e2e-fixtures/photos.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("old /photos/ URLs redirect, and photo pages serve AVIF with a JPEG fallback", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page).toHaveURL(/\/life\/photos\/stabilo\/$/);
  await expect(page.getByRole("heading", { name: "Stabilo" })).toBeVisible();
  await expect(page.locator('main picture source[type="image/avif"]')).toHaveAttribute("srcset", /\/images\/fixtures\/photo-portrait-640\.avif 640w/);
  const img = page.locator("main picture img");
  await expect(img).toHaveAttribute("width", "1600");
  await expect(img).toHaveAttribute("height", "2000");
  await expect(img).toHaveAttribute("alt", "Stabilo");
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator("main time")).toHaveAttribute("datetime", "2026-04-11");
});

test("a photo page uses its alt text, its camera and a JPEG og:image", async ({ page }) => {
  await page.goto("/life/photos/kizilcikli/");
  await expect(page.locator("main picture img")).toHaveAttribute("alt", "Evening light over a hillside village");
  await expect(page.locator("main")).toContainText("Fujifilm X100VI");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://onursenture.com/images/fixtures/photo-landscape-2560.jpg");
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", "Evening light over a hillside village");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Onur Senture");
});

test("photo pages link to the newer and the older photo", async ({ page }) => {
  await page.goto("/life/photos/kizilcikli/");
  const more = page.getByRole("navigation", { name: "More photos" });
  await expect(more.getByRole("link")).toHaveText(["Night Boulevard", "Stabilo"]);
  await expect(more).toContainText("← Previous");
  await expect(more).toContainText("Next →");
  await more.getByRole("link", { name: "Stabilo" }).click();
  await expect(page).toHaveURL(/\/life\/photos\/stabilo\/$/);
  // The oldest photo has no next.
  await expect(page.getByRole("navigation", { name: "More photos" }).getByRole("link")).toHaveCount(1);
});

test("the photos index links every photo with decorative thumbnails", async ({ page }) => {
  await page.goto("/life/photos/");
  await expect(page.locator('main a[href^="/life/photos/"]')).toHaveCount(3);
  await expect(page.locator('main img[alt=""]')).toHaveCount(3);
  await expect(page.locator("main picture source").first()).toHaveAttribute("sizes", "(min-width: 768px) calc((100vw - 128px) / 3), calc((100vw - 48px) / 2)");
});

test("an unknown slug and the placeholder are 404s", async ({ page }) => {
  expect((await page.goto("/life/photos/nope/"))?.status()).toBe(404);
  expect((await page.goto("/life/photos/_/"))?.status()).toBe(404);
});
```

In `e2e/life.spec.ts`, delete the test "the photos row links every photo and its All link goes to /life/photos/". Add it to `e2e-fixtures/life.spec.ts` with 3 instead of 5:

```ts
test("the photos row links every photo and its All link goes to /life/photos/", async ({ page }) => {
  await page.goto("/life/");
  const photos = page.locator('[data-section="photos"]');
  await expect(photos.locator("li a")).toHaveCount(3);
  await expect(photos.locator('li img[alt=""]')).toHaveCount(3);
  await expect(photos.getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", "/life/photos/");
});
```

In `e2e/feed.spec.ts`, the first test becomes:

```ts
test("/feed.xml is valid RSS with no items when there are no notes or photos", async ({ request }) => {
  const response = await request.get("/feed.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/rss+xml; charset=utf-8");
  const xml = await response.text();
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).not.toContain("<item>");
});
```

Append to `e2e-fixtures/feed.spec.ts`:

```ts
test("/feed.xml carries the fixture photos with their JPEG renditions", async ({ request }) => {
  const xml = await (await request.get("/feed.xml")).text();
  expect(xml).toContain("<link>https://onursenture.com/life/photos/night-boulevard/</link>");
  expect(xml).toContain("https://onursenture.com/images/fixtures/photo-wide-1280.jpg");
});
```

If another e2e test (default or fixture) breaks because it counted repo photos or read the readout's "last photo", update it to the fixture data. Night Boulevard is the newest fixture photo.

- [ ] **Step 8: Run every suite**

```bash
lsof -ti:3217,3219,3221 | xargs kill 2>/dev/null
npm run build && npm run e2e
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
```

Expected: PASS for both.

- [ ] **Step 9: Commit**

```bash
git add -A lib app components tests e2e e2e-fixtures images-src/fixtures public/images/fixtures
git commit -m "Read photos from the photo store, with fixture photos for the fixture build

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Admin server side and the shared browser upload

**Files:**
- Create: `components/admin/media-upload.ts`, `components/admin/photos/photo-upload.ts`, `app/admin/photos-actions.ts`, `lib/admin/photos.ts`
- Modify: `components/admin/notes/note-upload.ts`
- Test: `tests/admin/photos-load.test.ts`

**Interfaces:**
- Consumes: operations (Task 3), `readExif` (Task 4), `getPhotoStore`/`PHOTOS_TAG` (Task 2), `photoExifSchema`/`NO_EXIF` (Task 1), `processImageWith`/`getMediaStorage`/`uploadMode`.
- Produces:
  - `uploadOriginal(file, mode, {folder, check}): Promise<{status:"ok"; source} | {status:"invalid"; message} | {status:"unauthorized"}>`
  - `uploadPhoto(file, mode): Promise<PhotoActionResult>`
  - server actions `savePhotoAction(input)`, `publishPhotoAction(input)`, `deletePhotoAction(ref)`, `processPhotoUploadAction({source, exif})`, all returning `PhotoActionResult`
  - `PhotosConsoleInit {photos: StoredPhoto[]; available; uploadMode}`, `loadPhotosConsole()`
  - `photoCounts(): Promise<{published; drafts} | null>`

- [ ] **Step 1: Write the failing loader test**

`tests/admin/photos-load.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPhotoStore: vi.fn(), uploadMode: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/photos/get-store", () => ({ getPhotoStore: mocks.getPhotoStore }));
vi.mock("@/lib/media/storage", () => ({ uploadMode: mocks.uploadMode }));

import { loadPhotosConsole, photoCounts } from "@/lib/admin/photos";

const photo = (status: "draft" | "published") => ({ id: status, status });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.uploadMode.mockReturnValue("local");
});

describe("loadPhotosConsole", () => {
  it("loads every photo and where uploads go", async () => {
    mocks.getPhotoStore.mockReturnValue({ list: async () => [photo("draft")] });
    expect(await loadPhotosConsole()).toEqual({ photos: [photo("draft")], available: true, uploadMode: "local" });
  });

  it("is unavailable without a store or when the store fails", async () => {
    mocks.getPhotoStore.mockReturnValue(null);
    expect(await loadPhotosConsole()).toEqual({ photos: [], available: false, uploadMode: "local" });
    mocks.getPhotoStore.mockReturnValue({ list: async () => Promise.reject(new Error("down")) });
    expect((await loadPhotosConsole()).available).toBe(false);
  });
});

describe("photoCounts", () => {
  it("counts published photos and drafts, or null when the store can't be read", async () => {
    mocks.getPhotoStore.mockReturnValue({ list: async () => [photo("draft"), photo("published"), photo("published")] });
    expect(await photoCounts()).toEqual({ published: 2, drafts: 1 });
    mocks.getPhotoStore.mockReturnValue(null);
    expect(await photoCounts()).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/admin/photos-load.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the loader**

`lib/admin/photos.ts`:

```ts
import "server-only";
import { uploadMode } from "@/lib/media/storage";
import { getPhotoStore } from "@/lib/photos/get-store";
import type { PhotoStore } from "@/lib/photos/store";
import type { StoredPhoto } from "@/lib/photos/types";

// What /admin/photos/ starts from: every photo, whether the store can be
// written, and where uploads go.
export interface PhotosConsoleInit {
  photos: StoredPhoto[];
  available: boolean;
  uploadMode: "blob" | "local" | null;
}

function store(): PhotoStore | null {
  try {
    return getPhotoStore();
  } catch {
    return null;
  }
}

export async function loadPhotosConsole(): Promise<PhotosConsoleInit> {
  const photos = store();
  const mode = uploadMode();
  if (!photos) return { photos: [], available: false, uploadMode: mode };
  try {
    return { photos: await photos.list(), available: true, uploadMode: mode };
  } catch (e) {
    console.warn("[photos] loading the console failed:", e instanceof Error ? e.message : e);
    return { photos: [], available: false, uploadMode: mode };
  }
}

// The admin home's Photos line; null when the store can't be read.
export async function photoCounts(): Promise<{ published: number; drafts: number } | null> {
  const photos = store();
  if (!photos) return null;
  try {
    const all = await photos.list();
    return { published: all.filter((photo) => photo.status === "published").length, drafts: all.filter((photo) => photo.status === "draft").length };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Move the browser upload into a shared module**

Create `components/admin/media-upload.ts`:

```ts
"use client";

import { upload } from "@vercel/blob/client";
import { MAX_BYTES } from "@/lib/media/rules";

// The browser half of every admin image upload (notes, photos): check the
// file, redraw what the server can't read as a JPEG, and put the original
// under uploads/<folder>/ in Blob (or through /api/admin/upload-dev/ locally).
// The caller hands the returned source to its own server action.

export type SourceResult = { status: "ok"; source: string } | { status: "invalid"; message: string } | { status: "unauthorized" };

// Big phone photos (48 MP) would pass iOS Safari's canvas limit; 4096px on the
// long side is still more than the largest rendition (2560).
const MAX_CONVERT_SIDE = 4096;

// PNG and JPEG upload as they are. Anything the browser can decode (HEIC on
// an iPhone, WebP) is redrawn as a JPEG first, because the server's sharp
// can't read HEIC. The redraw drops EXIF: read it before calling this.
async function prepare(file: File, check: (width: number, height: number) => string | null): Promise<File | string> {
  if (file.size > MAX_BYTES) return "The file is larger than 25 MB.";
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return "This browser can't read the image. Use a PNG or JPEG.";
  }
  const problem = check(bitmap.width, bitmap.height);
  if (problem) {
    bitmap.close();
    return problem;
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
  return blob ? new File([blob], "upload.jpg", { type: "image/jpeg" }) : "The image could not be converted. Use a PNG or JPEG.";
}

async function signedOut(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/upload/", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    return response.status === 401;
  } catch {
    return false;
  }
}

export async function uploadOriginal(
  original: File,
  mode: "blob" | "local",
  options: { folder: string; check: (width: number, height: number) => string | null },
): Promise<SourceResult> {
  const prepared = await prepare(original, options.check);
  if (typeof prepared === "string") return { status: "invalid", message: prepared };
  if (mode === "blob") {
    const extension = prepared.type === "image/png" ? "png" : "jpg";
    try {
      const blob = await upload(`uploads/${options.folder}/${crypto.randomUUID()}.${extension}`, prepared, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/",
        contentType: prepared.type,
      });
      return { status: "ok", source: blob.url };
    } catch (e) {
      if (await signedOut()) return { status: "unauthorized" };
      throw e;
    }
  }
  const response = await fetch("/api/admin/upload-dev/", { method: "POST", headers: { "content-type": prepared.type }, body: prepared });
  if (response.status === 401) return { status: "unauthorized" };
  const data = (await response.json()) as { source?: string; error?: string };
  if (!response.ok || !data.source) return { status: "invalid", message: data.error ?? "The upload failed. Try again." };
  return { status: "ok", source: data.source };
}
```

Replace `components/admin/notes/note-upload.ts`:

```ts
"use client";

import { processNoteUploadAction } from "@/app/admin/notes-actions";
import { checkNoteDimensions } from "@/lib/media/rules";
import type { NoteImage } from "@/lib/notes/types";
import { uploadOriginal } from "../media-upload";

type UploadResult = Awaited<ReturnType<typeof processNoteUploadAction>>;

export async function uploadNoteImage(original: File, mode: "blob" | "local"): Promise<{ status: "ok"; image: NoteImage } | Exclude<UploadResult, { status: "ok" }>> {
  const sent = await uploadOriginal(original, mode, { folder: "notes", check: checkNoteDimensions });
  if (sent.status === "invalid") return { status: "invalid", issues: [{ at: "embed/images", message: sent.message }] };
  if (sent.status === "unauthorized") return sent;
  return processNoteUploadAction({ source: sent.source });
}
```

- [ ] **Step 5: Add the photo server actions and the photo upload**

`app/admin/photos-actions.ts`:

```ts
"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { isAdmin } from "@/lib/auth/admin";
import { processImageWith } from "@/lib/media/process";
import { checkPhotoDimensions } from "@/lib/media/rules";
import { type MediaStorage, getMediaStorage } from "@/lib/media/storage";
import { getPhotoStore } from "@/lib/photos/get-store";
import {
  type PhotoActionResult,
  type PhotoInput,
  type PhotoOpResult,
  type PhotoRef,
  createPhotoDraft,
  deletePhoto,
  publishPhoto,
  savePhoto,
} from "@/lib/photos/operations";
import { photoExifSchema } from "@/lib/photos/schema";
import type { PhotoStore } from "@/lib/photos/store";
import { PHOTOS_TAG } from "@/lib/photos/tags";
import { NO_EXIF } from "@/lib/photos/types";

// Server actions for /admin/photos/ (Sprint 11 spec §3). Each checks the
// session, then the store; a store error reads as "unavailable". Every
// successful write updates the photos tag, so the next request renders it.

function photoStore(): PhotoStore | null {
  try {
    return getPhotoStore();
  } catch {
    return null;
  }
}

function mediaStorage(): MediaStorage | null {
  try {
    return getMediaStorage();
  } catch {
    return null;
  }
}

async function withStore(work: (store: PhotoStore) => Promise<PhotoOpResult>): Promise<PhotoActionResult> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const store = photoStore();
  if (!store) return { status: "unavailable" };
  try {
    const result = await work(store);
    if (result.status === "ok") updateTag(PHOTOS_TAG);
    return result;
  } catch (e) {
    console.warn("[photos]", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  }
}

export async function savePhotoAction(input: PhotoInput): Promise<PhotoActionResult> {
  return withStore((store) => savePhoto(store, input, new Date()));
}

export async function publishPhotoAction(input: PhotoInput): Promise<PhotoActionResult> {
  return withStore((store) => publishPhoto(store, input, new Date()));
}

export async function deletePhotoAction(ref: PhotoRef): Promise<PhotoActionResult> {
  return withStore((store) => deletePhoto(store, mediaStorage(), ref));
}

// After the browser uploaded an original (PNG or JPEG; the browser converts
// anything else): check it, render the renditions under a fresh key (so two
// uploads of one file never share files) and create the draft with the EXIF
// the browser read. The original is deleted either way.
export async function processPhotoUploadAction(input: { source: string; exif: unknown }): Promise<PhotoActionResult> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const invalid = (message: string) => ({ status: "invalid" as const, issues: [{ at: "image", message }] });
  const storage = mediaStorage();
  if (!storage) return { status: "unavailable" };
  try {
    const store = photoStore();
    if (!store) return { status: "unavailable" };
    let bytes: Buffer;
    try {
      bytes = await storage.readSource(input.source);
    } catch {
      return invalid("The upload could not be read. Try again.");
    }
    const now = new Date();
    const result = await processImageWith(bytes, { key: (hash) => `media/photos/${hash.slice(0, 16)}-${randomUUID().slice(0, 8)}`, check: checkPhotoDimensions }, storage, now);
    if (!result.ok) return invalid(result.reason);
    const { key, baseUrl, width, height, widths } = result.record;
    const exif = photoExifSchema.safeParse(input.exif);
    // A draft isn't on the site, so no tag update.
    return await createPhotoDraft(store, { image: { key, baseUrl, width, height, widths }, exif: exif.success ? exif.data : NO_EXIF }, now);
  } catch (e) {
    console.warn("[photos] upload failed:", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  } finally {
    await storage.deleteSource(input.source).catch(() => undefined);
  }
}
```

`components/admin/photos/photo-upload.ts`:

```ts
"use client";

import { processPhotoUploadAction } from "@/app/admin/photos-actions";
import { checkPhotoDimensions } from "@/lib/media/rules";
import { readExif } from "@/lib/photos/exif";
import type { PhotoActionResult } from "@/lib/photos/operations";
import { uploadOriginal } from "../media-upload";

// EXIF first: uploadOriginal's HEIC→JPEG redraw drops it (spec §2).
export async function uploadPhoto(original: File, mode: "blob" | "local"): Promise<PhotoActionResult> {
  const exif = await readExif(original);
  const sent = await uploadOriginal(original, mode, { folder: "photos", check: checkPhotoDimensions });
  if (sent.status === "invalid") return { status: "invalid", issues: [{ at: "image", message: sent.message }] };
  if (sent.status === "unauthorized") return sent;
  return processPhotoUploadAction({ source: sent.source, exif });
}
```

- [ ] **Step 6: Run the tests, the type check, the lint and the notes admin e2e**

```bash
npm test && npm run typecheck && npm run lint
lsof -ti:3217,3219,3221 | xargs kill 2>/dev/null
npm run build && npm run e2e:admin
```

Expected: PASS. The notes upload still works through the shared module.

- [ ] **Step 7: Commit**

```bash
git add components/admin/media-upload.ts components/admin/notes/note-upload.ts components/admin/photos/photo-upload.ts app/admin/photos-actions.ts lib/admin/photos.ts tests/admin/photos-load.test.ts
git commit -m "Add the photo server actions and share the browser upload with notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `PhotoEditorState`

Use an **opus** reviewer for this task. In Sprint 9 the plan's own state-machine code had three race bugs that only an opus review caught.

**Files:**
- Create: `lib/admin/photo-editor.ts`
- Test: `tests/admin/photo-editor.test.ts`

**Interfaces:**
- Consumes: `PhotoActionResult`, `PhotoInput`, `PhotoRef` (Task 3); `withDay` (Task 1); `StoredPhoto`, `PhotoContent`, `PhotoIssue`, `bySiteOrder` (Task 1).
- Produces:
  - `PhotoActions {save; publish; remove}`
  - `EditorStatus`, `EditorSnapshot`
  - `PhotoEditorState`:
    - constructor `({photos, available}, actions)`
    - `subscribe`, `getSnapshot`, `hasUnsaved`
    - `edit(patch)`, `setDay(day)`
    - `open(id)`, `close()`
    - `uploadStarted(): boolean`, `uploadFinished(result)`
    - `save()`, `primaryAction()`, `remove()`
  - `statusText(snap): string`

- [ ] **Step 1: Write the failing tests**

`tests/admin/photo-editor.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { type PhotoActions, PhotoEditorState, statusText } from "@/lib/admin/photo-editor";
import type { PhotoActionResult } from "@/lib/photos/operations";
import type { StoredPhoto } from "@/lib/photos/types";

const image = { key: "media/photos/a", width: 2560, height: 1920, widths: [640, 1280, 2560], baseUrl: "/api/media-dev/media/photos/a" };

function stored(patch: Partial<StoredPhoto> = {}): StoredPhoto {
  return {
    id: "p1",
    slug: null,
    title: "",
    alt: "",
    takenAt: "2026-08-17T18:42:10",
    camera: "Fujifilm X100VI",
    image,
    exif: { takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" },
    status: "draft",
    publishedAt: null,
    createdAt: "2026-10-05T10:00:00.000Z",
    updatedAt: "2026-10-05T10:00:00.000Z",
    ...patch,
  };
}

const live = (patch: Partial<StoredPhoto> = {}) =>
  stored({ id: "p2", slug: "stabilo", title: "Stabilo", status: "published", publishedAt: "2026-04-11T12:00:00.000Z", takenAt: "2026-04-11T12:00:00", ...patch });

function deferred() {
  let resolve!: (value: PhotoActionResult) => void;
  const promise = new Promise<PhotoActionResult>((r) => (resolve = r));
  return { promise, resolve };
}

function actions(patch: Partial<PhotoActions> = {}): PhotoActions {
  return {
    save: vi.fn(async (input) => ({ status: "ok" as const, photo: stored({ ...(input.content as object), id: input.id, updatedAt: "2026-10-05T10:01:00.000Z" }) })),
    publish: vi.fn(async (input) => ({ status: "ok" as const, photo: stored({ ...(input.content as object), id: input.id, slug: "x", status: "published", publishedAt: "2026-10-05T10:01:00.000Z" }) })),
    remove: vi.fn(async (ref) => ({ status: "ok" as const, photo: stored({ id: ref.id }) })),
    ...patch,
  };
}

const make = (photos: StoredPhoto[] = [], a = actions(), available = true) => new PhotoEditorState({ photos, available }, a);

describe("PhotoEditorState: list and opening", () => {
  it("lists drafts first, newest edited on top, then published photos in site order", () => {
    const older = stored({ id: "d1", updatedAt: "2026-10-01T00:00:00.000Z" });
    const newer = stored({ id: "d2", updatedAt: "2026-10-04T00:00:00.000Z" });
    const april = live({ id: "l1", takenAt: "2026-04-11T12:00:00" });
    const sept = live({ id: "l2", slug: "night", takenAt: "2026-09-12T21:40:00" });
    expect(make([april, older, sept, newer]).getSnapshot().photos.map((p) => p.id)).toEqual(["d2", "d1", "l2", "l1"]);
  });

  it("opens a photo into the form, clean, with the EXIF hints on", () => {
    const editor = make([stored()]);
    editor.open("p1");
    const snap = editor.getSnapshot();
    expect(snap.editing?.id).toBe("p1");
    expect(snap.value).toEqual({ title: "", alt: "", takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" });
    expect(snap.dirty).toBe(false);
    expect([snap.exifDate, snap.exifCamera]).toEqual([true, true]);
  });

  it("drops a hint once its field no longer matches EXIF", () => {
    const editor = make([stored()]);
    editor.open("p1");
    editor.edit({ camera: "X100VI" });
    editor.setDay("2026-08-20");
    expect(editor.getSnapshot().value.takenAt).toBe("2026-08-20T18:42:10");
    expect([editor.getSnapshot().exifDate, editor.getSnapshot().exifCamera]).toEqual([false, false]);
  });

  it("ignores an invalid day", () => {
    const editor = make([stored()]);
    editor.open("p1");
    editor.setDay("");
    expect(editor.getSnapshot().value.takenAt).toBe("2026-08-17T18:42:10");
    expect(editor.getSnapshot().dirty).toBe(false);
  });

  it("does nothing with no photo open", () => {
    const editor = make([stored()]);
    editor.edit({ title: "x" });
    expect(editor.getSnapshot().dirty).toBe(false);
    expect(editor.getSnapshot().canPrimary).toBe(false);
  });
});

describe("PhotoEditorState: buttons", () => {
  it("a draft offers Save draft and Publish; Publish needs a title", () => {
    const editor = make([stored()]);
    editor.open("p1");
    let snap = editor.getSnapshot();
    expect([snap.saveLabel, snap.primaryLabel, snap.canSave, snap.canPrimary]).toEqual(["Save draft", "Publish", false, false]);
    editor.edit({ title: "Kızılcıklı" });
    snap = editor.getSnapshot();
    expect([snap.dirty, snap.canSave, snap.canPrimary]).toEqual([true, true, true]);
  });

  it("a live photo offers only Save, once something changed", () => {
    const editor = make([live()]);
    editor.open("p2");
    expect([editor.getSnapshot().saveLabel, editor.getSnapshot().primaryLabel, editor.getSnapshot().canPrimary]).toEqual([null, "Save", false]);
    editor.edit({ alt: "A pen" });
    expect(editor.getSnapshot().canPrimary).toBe(true);
    editor.edit({ title: "" });
    expect(editor.getSnapshot().canPrimary).toBe(false);
  });

  it("is off everywhere when the store is unavailable", () => {
    const editor = make([stored()], actions(), false);
    editor.open("p1");
    editor.edit({ title: "x" });
    expect([editor.getSnapshot().canSave, editor.getSnapshot().canPrimary, editor.uploadStarted()]).toEqual([false, false, false]);
    expect(statusText(editor.getSnapshot())).toBe("Unsaved changes");
  });
});

describe("PhotoEditorState: writes", () => {
  it("Save draft keeps the photo open and clean", async () => {
    const a = actions();
    const editor = make([stored()], a);
    editor.open("p1");
    editor.edit({ title: "Kızılcıklı" });
    await editor.save();
    expect(a.save).toHaveBeenCalledWith({ id: "p1", expected: "2026-10-05T10:00:00.000Z", content: { title: "Kızılcıklı", alt: "", takenAt: "2026-08-17T18:42:10", camera: "Fujifilm X100VI" } });
    const snap = editor.getSnapshot();
    expect([snap.editing?.updatedAt, snap.dirty, statusText(snap)]).toEqual(["2026-10-05T10:01:00.000Z", false, "Draft saved"]);
  });

  it("Publish closes the form and marks the photo live in the list", async () => {
    const editor = make([stored()]);
    editor.open("p1");
    editor.edit({ title: "Kızılcıklı" });
    await editor.primaryAction();
    const snap = editor.getSnapshot();
    expect([snap.editing, statusText(snap), snap.photos[0].status]).toEqual([null, "Published", "published"]);
  });

  it("Save on a live photo stays open", async () => {
    const a = actions({ save: vi.fn(async () => ({ status: "ok" as const, photo: live({ alt: "A pen", updatedAt: "2026-10-05T10:02:00.000Z" }) })) });
    const editor = make([live()], a);
    editor.open("p2");
    editor.edit({ alt: "A pen" });
    await editor.primaryAction();
    expect(a.save).toHaveBeenCalled();
    expect([editor.getSnapshot().editing?.id, statusText(editor.getSnapshot())]).toEqual(["p2", "Saved"]);
  });

  it("Delete removes the photo and closes the form", async () => {
    const editor = make([stored(), live()]);
    editor.open("p1");
    await editor.remove();
    const snap = editor.getSnapshot();
    expect([snap.editing, snap.photos.map((p) => p.id), statusText(snap)]).toEqual([null, ["p2"], "Deleted"]);
  });

  it("an invalid result keeps the edit and shows the issues", async () => {
    const editor = make([stored()], actions({ publish: vi.fn(async () => ({ status: "invalid" as const, issues: [{ at: "title", message: "Add a title." }] })) }));
    editor.open("p1");
    editor.edit({ title: "x" });
    await editor.primaryAction();
    const snap = editor.getSnapshot();
    expect([snap.editing?.id, snap.dirty, statusText(snap), snap.issues]).toEqual(["p1", true, "Can't publish yet:", [{ at: "title", message: "Add a title." }]]);
    editor.edit({ title: "y" });
    expect(editor.getSnapshot().issues).toEqual([]);
  });

  it("a conflict blocks further writes until a reload", async () => {
    const editor = make([stored()], actions({ save: vi.fn(async () => ({ status: "conflict" as const })) }));
    editor.open("p1");
    editor.edit({ title: "x" });
    await editor.save();
    editor.edit({ title: "y" });
    const snap = editor.getSnapshot();
    expect([snap.blocked, snap.canSave, statusText(snap)]).toEqual([true, false, "This photo changed in another tab. Reload to continue."]);
  });

  it("a thrown action reads as unavailable", async () => {
    const editor = make([stored()], actions({ save: vi.fn(async () => Promise.reject(new Error("network"))) }));
    editor.open("p1");
    editor.edit({ title: "x" });
    await editor.save();
    expect(statusText(editor.getSnapshot())).toBe("Database unavailable — try again.");
  });
});

describe("PhotoEditorState: one thing at a time", () => {
  it("runs one write at a time and ignores switching while it runs", async () => {
    const pending = deferred();
    const a = actions({ save: vi.fn(() => pending.promise) });
    const editor = make([stored(), stored({ id: "p3" })], a);
    editor.open("p1");
    editor.edit({ title: "x" });
    const saving = editor.save();
    expect([editor.getSnapshot().busy, editor.hasUnsaved, statusText(editor.getSnapshot())]).toEqual([true, true, "Saving…"]);
    await editor.save();
    await editor.primaryAction();
    editor.open("p3");
    editor.close();
    expect(a.save).toHaveBeenCalledTimes(1);
    expect(editor.getSnapshot().editing?.id).toBe("p1");
    pending.resolve({ status: "ok", photo: stored({ title: "x", updatedAt: "2026-10-05T10:09:00.000Z" }) });
    await saving;
    expect(editor.getSnapshot().busy).toBe(false);
  });

  it("an upload blocks writes and switching, then opens the new draft", async () => {
    const editor = make([live()]);
    editor.open("p2");
    expect(editor.uploadStarted()).toBe(true);
    expect(editor.uploadStarted()).toBe(false);
    expect([editor.getSnapshot().uploading, editor.hasUnsaved, statusText(editor.getSnapshot())]).toEqual([true, true, "Uploading…"]);
    editor.close();
    expect(editor.getSnapshot().editing?.id).toBe("p2");
    editor.uploadFinished({ status: "ok", photo: stored({ id: "new" }) });
    const snap = editor.getSnapshot();
    expect([snap.editing?.id, snap.photos[0].id, statusText(snap), snap.dirty]).toEqual(["new", "new", "Draft saved", false]);
  });

  it("a refused upload shows why and opens nothing", () => {
    const editor = make([]);
    editor.uploadStarted();
    editor.uploadFinished({ status: "invalid", issues: [{ at: "image", message: "The image is 800×600; photos need at least 1280px on the long side." }] });
    const snap = editor.getSnapshot();
    expect([snap.editing, statusText(snap), snap.issues.length]).toEqual([null, "Can't upload:", 1]);
  });

  it("a write can't start during an upload", async () => {
    const a = actions();
    const editor = make([stored()], a);
    editor.open("p1");
    editor.edit({ title: "x" });
    editor.uploadStarted();
    await editor.save();
    await editor.remove();
    expect(a.save).not.toHaveBeenCalled();
    expect(a.remove).not.toHaveBeenCalled();
  });

  it("notifies subscribers with a new snapshot on every change", () => {
    const editor = make([stored()]);
    const listener = vi.fn();
    editor.subscribe(listener);
    const before = editor.getSnapshot();
    editor.open("p1");
    expect(listener).toHaveBeenCalled();
    expect(editor.getSnapshot()).not.toBe(before);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run tests/admin/photo-editor.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/admin/photo-editor.ts`:

```ts
import type { PhotoActionResult, PhotoInput, PhotoRef } from "@/lib/photos/operations";
import { withDay } from "@/lib/photos/taken-at";
import { type PhotoContent, type PhotoIssue, type StoredPhoto, bySiteOrder } from "@/lib/photos/types";

// The /admin/photos/ editor (Sprint 11 spec §3.2) as plain TypeScript, so it
// is tested without a DOM. components/admin/photos/photos-console.tsx binds it
// to React (useSyncExternalStore) and adds the window listeners. No autosave:
// a write happens only when the author asks for one, one at a time. An upload
// creates the draft on the server, so the form always edits a stored photo.

export interface PhotoActions {
  save(input: PhotoInput): Promise<PhotoActionResult>;
  publish(input: PhotoInput): Promise<PhotoActionResult>;
  remove(ref: PhotoRef): Promise<PhotoActionResult>;
}

export type EditorStatus = "idle" | "uploaded" | "saved" | "published" | "deleted" | "invalid" | "conflict" | "missing" | "unauthorized" | "unavailable";

export interface EditorSnapshot {
  photos: StoredPhoto[];
  editing: StoredPhoto | null;
  value: PhotoContent;
  dirty: boolean;
  busy: boolean;
  uploading: boolean;
  // Counts every photo loaded into the form, so the UI can key local state on it.
  generation: number;
  status: EditorStatus;
  issues: PhotoIssue[];
  // Writes are off until a reload: another tab won, the session ended, the
  // photo is gone, or there was never a database.
  blocked: boolean;
  // The date and camera still match what EXIF gave at upload.
  exifDate: boolean;
  exifCamera: boolean;
  primaryLabel: "Publish" | "Save";
  saveLabel: "Save draft" | null;
  canSave: boolean;
  canPrimary: boolean;
}

const EMPTY: PhotoContent = { title: "", alt: "", takenAt: "", camera: "" };
// Outcomes that end the tab's writes until a reload.
const BLOCKING: EditorStatus[] = ["conflict", "missing", "unauthorized"];

function contentOf(photo: StoredPhoto): PhotoContent {
  return { title: photo.title, alt: photo.alt, takenAt: photo.takenAt, camera: photo.camera };
}

// Field by field, so the comparison never depends on key order.
function comparable(value: PhotoContent): string {
  return JSON.stringify([value.title, value.alt, value.takenAt, value.camera]);
}

// Drafts first (most recently edited on top), then published photos in site order.
function adminOrder(a: StoredPhoto, b: StoredPhoto): number {
  if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
  if (a.status === "draft") return b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id);
  return bySiteOrder(a, b);
}

export class PhotoEditorState {
  private photos: StoredPhoto[];
  private editing: StoredPhoto | null = null;
  private value: PhotoContent = EMPTY;
  private baseline = comparable(EMPTY);
  private busy = false;
  private uploading = false;
  private generation = 0;
  private status: EditorStatus = "idle";
  private issues: PhotoIssue[] = [];
  private blocked: boolean;
  private listeners = new Set<() => void>();
  private snapshot: EditorSnapshot;

  constructor(
    init: { photos: StoredPhoto[]; available: boolean },
    private actions: PhotoActions,
  ) {
    this.photos = [...init.photos].sort(adminOrder);
    this.blocked = !init.available;
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
    return this.busy || this.uploading || this.snapshot.dirty;
  }

  private build(): EditorSnapshot {
    const editing = this.editing;
    const dirty = editing !== null && comparable(this.value) !== this.baseline;
    const live = editing?.status === "published";
    const free = editing !== null && !this.blocked && !this.busy && !this.uploading;
    return {
      photos: this.photos,
      editing,
      value: this.value,
      dirty,
      busy: this.busy,
      uploading: this.uploading,
      generation: this.generation,
      status: this.status,
      issues: this.issues,
      blocked: this.blocked,
      exifDate: editing !== null && editing.exif.takenAt !== null && editing.exif.takenAt === this.value.takenAt,
      exifCamera: editing !== null && editing.exif.camera !== null && editing.exif.camera === this.value.camera,
      primaryLabel: live ? "Save" : "Publish",
      saveLabel: live ? null : "Save draft",
      canSave: free && dirty && !live,
      canPrimary: free && this.value.title.trim() !== "" && (!live || dirty),
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

  private load(photo: StoredPhoto | null) {
    this.generation++;
    this.editing = photo;
    this.value = photo ? contentOf(photo) : EMPTY;
    this.baseline = comparable(this.value);
  }

  private remember(photo: StoredPhoto) {
    this.photos = [photo, ...this.photos.filter((item) => item.id !== photo.id)].sort(adminOrder);
  }

  private get switching(): boolean {
    return this.busy || this.uploading;
  }

  edit(patch: Partial<PhotoContent>) {
    if (!this.editing) return;
    this.value = { ...this.value, ...patch };
    this.changed();
  }

  // The date input gives a day; the time of day stays.
  setDay(day: string) {
    const takenAt = withDay(this.value.takenAt, day);
    if (takenAt) this.edit({ takenAt });
  }

  // The caller asks before dropping unsaved edits (LEAVE_QUESTION).
  open(id: string) {
    if (this.switching) return;
    const photo = this.photos.find((item) => item.id === id);
    if (!photo) return;
    this.load(photo);
    this.changed();
  }

  close() {
    if (this.switching) return;
    this.load(null);
    this.changed();
  }

  // False when an upload can't start now; the caller then doesn't upload.
  uploadStarted(): boolean {
    if (this.switching || this.blocked) return false;
    this.uploading = true;
    this.status = "idle";
    this.issues = [];
    this.emit();
    return true;
  }

  // The result of uploadPhoto: the new draft opens in the form.
  uploadFinished(result: PhotoActionResult) {
    this.uploading = false;
    if (result.status === "ok") {
      this.remember(result.photo);
      this.load(result.photo);
      this.status = "uploaded";
      this.issues = [];
    } else {
      this.fail(result);
    }
    this.emit();
  }

  private fail(result: Exclude<PhotoActionResult, { status: "ok" }>) {
    if (result.status === "invalid") {
      this.status = "invalid";
      this.issues = result.issues;
      return;
    }
    this.status = result.status;
    this.issues = [];
    if (BLOCKING.includes(result.status)) this.blocked = true;
  }

  private input(): PhotoInput | null {
    return this.editing ? { id: this.editing.id, expected: this.editing.updatedAt, content: this.value } : null;
  }

  // One action at a time; an outcome other than ok keeps the edit.
  private async run(call: () => Promise<PhotoActionResult>, onOk: (photo: StoredPhoto) => void) {
    if (this.switching || this.blocked) return;
    this.busy = true;
    this.emit();
    let result: PhotoActionResult;
    try {
      result = await call();
    } catch {
      result = { status: "unavailable" };
    }
    this.busy = false;
    if (result.status === "ok") {
      this.issues = [];
      onOk(result.photo);
    } else {
      this.fail(result);
    }
    this.emit();
  }

  private keep(photo: StoredPhoto) {
    this.remember(photo);
    this.editing = photo;
    this.baseline = comparable(contentOf(photo));
    this.status = "saved";
  }

  async save() {
    const input = this.input();
    if (!input || !this.snapshot.canSave) return;
    await this.run(() => this.actions.save(input), (photo) => this.keep(photo));
  }

  async primaryAction() {
    const input = this.input();
    if (!input || !this.snapshot.canPrimary) return;
    if (this.editing?.status === "published") {
      await this.run(() => this.actions.save(input), (photo) => this.keep(photo));
      return;
    }
    await this.run(
      () => this.actions.publish(input),
      (photo) => {
        this.remember(photo);
        this.load(null);
        this.status = "published";
      },
    );
  }

  // The caller confirms first.
  async remove() {
    const editing = this.editing;
    if (!editing) return;
    await this.run(
      () => this.actions.remove({ id: editing.id, expected: editing.updatedAt }),
      (photo) => {
        this.photos = this.photos.filter((item) => item.id !== photo.id);
        this.load(null);
        this.status = "deleted";
      },
    );
  }
}

export function statusText(snap: EditorSnapshot): string {
  if (snap.uploading) return "Uploading…";
  if (snap.busy) return "Saving…";
  switch (snap.status) {
    case "conflict":
      return "This photo changed in another tab. Reload to continue.";
    case "missing":
      return "This photo was deleted elsewhere. Reload to continue.";
    case "unauthorized":
      return "Signed out — sign in again.";
    case "unavailable":
      return "Database unavailable — try again.";
  }
  if (snap.status === "invalid") return snap.editing ? "Can't publish yet:" : "Can't upload:";
  if (snap.dirty) return "Unsaved changes";
  if (snap.blocked) return "Database unavailable: photos can't be saved.";
  switch (snap.status) {
    case "uploaded":
      return "Draft saved";
    case "saved":
      return snap.editing?.status === "draft" ? "Draft saved" : "Saved";
    case "published":
      return "Published";
    case "deleted":
      return "Deleted";
    default:
      return "";
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tests/admin/photo-editor.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/photo-editor.ts tests/admin/photo-editor.test.ts
git commit -m "Add the photo editor state for /admin/photos/

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `/admin/photos/` UI, the admin home section and the admin e2e

**Files:**
- Create: `app/admin/(console)/photos/page.tsx`, `components/admin/photos/photos-console.tsx`, `components/admin/photos/photo-form.tsx`, `components/admin/photos/photo-list.tsx`
- Modify: `components/admin/admin-home.tsx`, `e2e-admin/global-setup.ts`
- Test: `e2e-admin/photos.spec.ts`

**Interfaces:**
- Consumes: `PhotoEditorState`, `statusText`, `PhotoActions` (Task 7); actions and `uploadPhoto`, `loadPhotosConsole`, `photoCounts` (Task 6); `LEAVE_QUESTION`, `isSaveShortcut`, `leavesPage` (`lib/admin/leave-guard.ts`); `Button`, `buttonClass` (`components/ui/button.tsx`); `CONTROL` (`components/admin/fields.tsx`); `PictureView`.
- Produces: the route `/admin/photos/`. Testable hooks:
  - `input[aria-label="Add photo"]`
  - fields labelled "Title", "Alt text", "Date" and "Camera"
  - `p[role="status"]`
  - rows with `data-testid="photo-row"`
  - buttons "Save draft", "Publish", "Save", "Delete" and "Close"

- [ ] **Step 1: Write the failing e2e**

Add to `e2e-admin/global-setup.ts`, after the existing fixtures:

```ts
  // Photos (Sprint 11): a JPEG with EXIF (camera, date and GPS) and one too small.
  copyFileSync("tests/fixtures/photos/exif-gps.jpg", ".e2e-admin/fixtures/exif-gps.jpg");
  await solid(800, 600).toFile(".e2e-admin/fixtures/small.png");
```

Also add `copyFileSync` to its `node:fs` import.

`e2e-admin/photos.spec.ts`:

```ts
import { existsSync, readdirSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import sharp from "sharp";

test.describe.configure({ mode: "serial" });

const MEDIA = ".e2e-admin/media/media/photos";
const files = () => (existsSync(MEDIA) ? readdirSync(MEDIA) : []);

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

// Next keeps a route it left mounted but hidden, hence :visible.
const status = (page: Page) => page.locator('p[role="status"]:visible').first();
const row = (page: Page, text: string) => page.getByTestId("photo-row").filter({ hasText: text });

test("an upload becomes a draft with the EXIF date and camera, and renditions without metadata", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await page.getByLabel("Add photo").setInputFiles(".e2e-admin/fixtures/exif-gps.jpg");
  await expect(status(page)).toHaveText("Draft saved");
  await expect(page.getByLabel("Date")).toHaveValue("2026-08-17");
  await expect(page.getByLabel("Camera")).toHaveValue("Fujifilm X100VI");
  await expect(page.getByText("EXIF", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeDisabled();

  const jpgs = files().filter((file) => file.endsWith(".jpg"));
  expect(jpgs.length).toBeGreaterThan(0);
  for (const file of jpgs) expect((await sharp(`${MEDIA}/${file}`).metadata()).exif, file).toBeUndefined();

  await page.getByLabel("Title").fill("E2E Kızılcıklı akşam");
  await expect(status(page)).toHaveText("Unsaved changes");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(status(page)).toHaveText("Draft saved");
  await page.reload();
  await expect(row(page, "E2E Kızılcıklı akşam")).toContainText("Draft");
});

test("publishing puts the photo on /life/photos/ and in the feed, at a slug from its title", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await row(page, "E2E Kızılcıklı akşam").click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(status(page)).toHaveText("Published");
  await expect(row(page, "E2E Kızılcıklı akşam")).toContainText("Live");

  await page.goto("/life/photos/");
  await expect(page.getByRole("link", { name: "E2E Kızılcıklı akşam" })).toHaveAttribute("href", "/life/photos/e2e-kizilcikli-aksam/");
  await page.goto("/life/photos/e2e-kizilcikli-aksam/");
  await expect(page.getByRole("heading", { name: "E2E Kızılcıklı akşam" })).toBeVisible();
  await expect(page.locator("main")).toContainText("Fujifilm X100VI");
  await expect(page.locator("main time")).toHaveAttribute("datetime", "2026-08-17");
  expect(await (await page.request.get("/feed.xml")).text()).toContain("/life/photos/e2e-kizilcikli-aksam/");
});

test("renaming keeps the URL; deleting makes it a 404 and removes the renditions", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await row(page, "E2E Kızılcıklı akşam").click();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await page.getByLabel("Title").fill("E2E renamed");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(status(page)).toHaveText("Saved");
  await page.goto("/life/photos/e2e-kizilcikli-aksam/");
  await expect(page.getByRole("heading", { name: "E2E renamed" })).toBeVisible();

  await signIn(page, "/admin/photos/");
  await row(page, "E2E renamed").click();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(status(page)).toHaveText("Deleted");
  expect(files()).toEqual([]);
  expect((await page.goto("/life/photos/e2e-kizilcikli-aksam/"))?.status()).toBe(404);
});

test("an image under 1280px on the long side is refused", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await page.getByLabel("Add photo").setInputFiles(".e2e-admin/fixtures/small.png");
  await expect(status(page)).toHaveText("Can't upload:");
  await expect(page.getByText("The image is 800×600; photos need at least 1280px on the long side.")).toBeVisible();
  await expect(page.getByTestId("photo-row")).toHaveCount(0);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the whole flow fits a 390px screen", async ({ page }) => {
    await signIn(page, "/admin/photos/");
    await page.getByLabel("Add photo").setInputFiles(".e2e-admin/fixtures/exif-gps.jpg");
    await expect(status(page)).toHaveText("Draft saved");
    await page.getByLabel("Title").fill("E2E phone photo");
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(status(page)).toHaveText("Published");
    await expect(row(page, "E2E phone photo")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
```

- [ ] **Step 2: Build the UI**

`app/admin/(console)/photos/page.tsx`:

```tsx
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/admin-loading";
import { PhotosConsole } from "@/components/admin/photos/photos-console";
import { loadPhotosConsole } from "@/lib/admin/photos";
import { requireAdminPage } from "@/lib/auth/admin";

// Uploads render their renditions inside this page's server actions.
export const maxDuration = 60;

export default function PhotosAdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  await requireAdminPage("/admin/photos/");
  return <PhotosConsole init={await loadPhotosConsole()} />;
}
```

`components/admin/photos/photo-list.tsx`:

```tsx
"use client";

import { PictureView } from "@/components/picture-view";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { type StoredPhoto, photoDay } from "@/lib/photos/types";

// Mockup A's list: every photo, drafts first. A row loads its photo into the
// form; rows are off while a write or an upload runs.
export function PhotoList({
  photos,
  activeId,
  onOpen,
  disabled,
}: {
  photos: StoredPhoto[];
  activeId: string | null;
  onOpen: (id: string) => void;
  disabled: boolean;
}) {
  if (photos.length === 0) return <p className="type-meta text-fg-muted">No photos yet.</p>;
  return (
    <section aria-label="Photos">
      <ul className="flex flex-col">
        {photos.map((photo) => (
          <li key={photo.id} className="border-t">
            <button
              type="button"
              data-testid="photo-row"
              aria-current={photo.id === activeId ? "true" : undefined}
              disabled={disabled}
              onClick={() => onOpen(photo.id)}
              className={cx(
                "grid min-h-14 w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 py-2 text-left disabled:pointer-events-none disabled:opacity-40",
                photo.id === activeId && "text-accent",
              )}
            >
              <span className="block size-11 overflow-hidden bg-line">
                <PictureView image={photo.image.key} entry={photo.image} alt="" sizes="44px" className="size-11 object-cover" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate type-body">{photo.title || "Untitled"}</span>
                <span className="type-meta text-fg-muted">{formatDate(photoDay(photo))}</span>
              </span>
              <span className={cx("shrink-0 border px-1.5 type-label", photo.status === "draft" ? "border-accent text-accent" : "text-fg-muted")}>
                {photo.status === "draft" ? "Draft" : "Live"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`components/admin/photos/photo-form.tsx`:

```tsx
"use client";

import { type ReactNode, useId } from "react";
import { PictureView } from "@/components/picture-view";
import { Button } from "@/components/ui/button";
import type { EditorSnapshot, PhotoEditorState } from "@/lib/admin/photo-editor";
import { CONTROL } from "../fields";

// The preview fills the 720px column (688px inside its padding) or the phone width.
const PREVIEW_SIZES = "(min-width: 752px) 688px, calc(100vw - 32px)";

function Field({ id, label, aside, children }: { id: string; label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="type-label text-fg-muted">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

const Exif = ({ on }: { on: boolean }) => (on ? <span className="type-label text-accent">EXIF</span> : null);

// Mockup A's form: the open photo, its four fields and the actions.
export function PhotoForm({ editor, snap, onClose }: { editor: PhotoEditorState; snap: EditorSnapshot; onClose: () => void }) {
  const ids = { title: useId(), alt: useId(), date: useId(), camera: useId() };
  const editing = snap.editing;
  if (!editing) return null;
  const disabled = snap.busy || snap.uploading || snap.blocked;
  return (
    <section aria-label="Photo" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 type-meta text-fg-muted">
        <span>Editing · {editing.status === "draft" ? "Draft" : "Live"}</span>
        <button type="button" onClick={onClose} disabled={snap.busy || snap.uploading} className="hover:text-fg disabled:pointer-events-none disabled:opacity-40">
          Close
        </button>
      </div>
      <PictureView image={editing.image.key} entry={editing.image} alt="" sizes={PREVIEW_SIZES} className="max-h-[60vh] w-full object-contain" />
      <Field id={ids.title} label="Title">
        <input id={ids.title} value={snap.value.title} disabled={disabled} onChange={(event) => editor.edit({ title: event.target.value })} className={CONTROL} />
      </Field>
      <Field id={ids.alt} label="Alt text" aside={<span className="type-label text-fg-muted">optional</span>}>
        <input
          id={ids.alt}
          value={snap.value.alt}
          disabled={disabled}
          placeholder="Falls back to the title"
          onChange={(event) => editor.edit({ alt: event.target.value })}
          className={CONTROL}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id={ids.date} label="Date" aside={<Exif on={snap.exifDate} />}>
          <input
            id={ids.date}
            type="date"
            value={snap.value.takenAt.slice(0, 10)}
            disabled={disabled}
            onChange={(event) => editor.setDay(event.target.value)}
            className={CONTROL}
          />
        </Field>
        <Field id={ids.camera} label="Camera" aside={<Exif on={snap.exifCamera} />}>
          <input id={ids.camera} value={snap.value.camera} disabled={disabled} onChange={(event) => editor.edit({ camera: event.target.value })} className={CONTROL} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="text"
          disabled={disabled}
          onClick={() => {
            if (window.confirm("Delete this photo? This can't be undone.")) void editor.remove();
          }}
          className="mr-auto"
        >
          Delete
        </Button>
        {snap.saveLabel ? (
          <Button variant="ghost" disabled={!snap.canSave} onClick={() => void editor.save()}>
            {snap.saveLabel}
          </Button>
        ) : null}
        <Button variant="primary" disabled={!snap.canPrimary} onClick={() => void editor.primaryAction()}>
          {snap.primaryLabel}
        </Button>
      </div>
    </section>
  );
}
```

If `Button` doesn't accept `className`, wrap Delete in `<span className="mr-auto">…</span>` instead.

`components/admin/photos/photos-console.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { deletePhotoAction, publishPhotoAction, savePhotoAction } from "@/app/admin/photos-actions";
import { LEAVE_QUESTION, isSaveShortcut, leavesPage } from "@/lib/admin/leave-guard";
import { type PhotoActions, PhotoEditorState, statusText } from "@/lib/admin/photo-editor";
import type { PhotosConsoleInit } from "@/lib/admin/photos";
import { cx } from "@/lib/cx";
import type { PhotoActionResult } from "@/lib/photos/operations";
import { PhotoForm } from "./photo-form";
import { PhotoList } from "./photo-list";
import { uploadPhoto } from "./photo-upload";

const ACTIONS: PhotoActions = { save: savePhotoAction, publish: publishPhotoAction, remove: deletePhotoAction };

// /admin/photos/ (mockup A, phone-first): "+ Add photo" on top, the open
// photo's form under it, every photo below. Leaving with unsaved changes asks
// first and never saves (Sprint 7 rule); Cmd/Ctrl+S saves; closing the tab
// asks too.
export function PhotosConsole({ init }: { init: PhotosConsoleInit }) {
  const [editor] = useState(() => new PhotoEditorState({ photos: init.photos, available: init.available }, ACTIONS));
  const snap = useSyncExternalStore(editor.subscribe, editor.getSnapshot, editor.getSnapshot);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (editor.hasUnsaved) event.preventDefault();
    }
    function onClick(event: MouseEvent) {
      if (!editor.hasUnsaved || !(event.target instanceof Element)) return;
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
      // On a live photo, Save is the primary action.
      void (editor.getSnapshot().editing?.status === "published" ? editor.primaryAction() : editor.save());
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editor]);

  function leaveCurrent(): boolean {
    return !editor.hasUnsaved || window.confirm(LEAVE_QUESTION);
  }

  async function pick(file: File | undefined) {
    if (!file || !init.uploadMode || !leaveCurrent()) return;
    if (!editor.uploadStarted()) return;
    let result: PhotoActionResult;
    try {
      result = await uploadPhoto(file, init.uploadMode);
    } catch {
      result = { status: "unavailable" };
    }
    editor.uploadFinished(result);
    window.scrollTo({ top: 0 });
  }

  const adding = snap.busy || snap.uploading || snap.blocked;
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <nav aria-label="Breadcrumb" className="type-meta text-fg-muted">
          <Link href="/admin/" className="hover:text-fg">
            Admin
          </Link>{" "}
          / <span className="text-fg">Photos</span>
        </nav>
        <p role="status" className="type-meta text-fg-muted">
          {statusText(snap)}
        </p>
      </div>
      {init.uploadMode ? (
        <label
          className={cx(
            "relative flex min-h-16 cursor-pointer items-center justify-center rounded-control border border-dashed type-body text-accent",
            adding && "pointer-events-none opacity-40",
          )}
        >
          {snap.uploading ? "Uploading…" : "+ Add photo"}
          <input
            type="file"
            accept="image/*"
            aria-label="Add photo"
            disabled={adding}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void pick(file);
            }}
          />
        </label>
      ) : (
        <p className="type-meta text-fg-muted">Uploads are off: no media storage is configured.</p>
      )}
      {snap.issues.length > 0 ? (
        <ul className="flex flex-col gap-0.5 type-meta text-danger">
          {snap.issues.map((issue) => (
            <li key={`${issue.at}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
      <PhotoForm
        key={snap.generation}
        editor={editor}
        snap={snap}
        onClose={() => {
          if (leaveCurrent()) editor.close();
        }}
      />
      <PhotoList
        photos={snap.photos}
        activeId={snap.editing?.id ?? null}
        disabled={snap.busy || snap.uploading}
        onOpen={(id) => {
          if (!leaveCurrent()) return;
          editor.open(id);
          window.scrollTo({ top: 0 });
        }}
      />
    </main>
  );
}
```

In `components/admin/admin-home.tsx`:
- Import `photoCounts` from `@/lib/admin/photos`.
- Add it to the `Promise.all`: `const [docs, sources, pins, counts, photos] = await Promise.all([…, noteCounts(), photoCounts()]);`
- Add this section right after Notes:

```tsx
      <Section
        title="Photos"
        action={
          <Link href="/admin/photos/" className={buttonClass("ghost")}>
            Add photo
          </Link>
        }
      >
        <p className="type-body">
          <Link href="/admin/photos/" className="text-accent hover:underline">
            All photos
          </Link>{" "}
          <span className="type-meta text-fg-muted">
            {photos ? `· ${photos.published} ${photos.published === 1 ? "photo" : "photos"} · ${photos.drafts} ${photos.drafts === 1 ? "draft" : "drafts"}` : "· database unavailable"}
          </span>
        </p>
      </Section>
```

- [ ] **Step 3: Run the admin e2e and the rest**

```bash
npm run typecheck && npm run lint && npm test
lsof -ti:3217,3219,3221 | xargs kill 2>/dev/null
npm run build && npm run e2e:admin && npm run e2e
```

Expected: PASS. Fix the UI until `e2e-admin/photos.spec.ts` passes; never weaken an assertion. If `getByLabel("Date")` or `getByLabel("Title")` matches more than one element, give the duplicate a different label rather than adding `exact`.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(console)/photos" components/admin/photos components/admin/admin-home.tsx e2e-admin
git commit -m "Add /admin/photos/: upload from the phone, edit, publish and delete

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Import script, repo cleanup and docs

**Files:**
- Create: `lib/photos/import.ts`, `scripts/import-photos.ts`
- Modify: `package.json` (script), `CLAUDE.md`
- Delete: `content/photos/`, `images-src/photos/`, `public/images/photos/`; the `photos/*` entries in `lib/images/manifest.json` (via `npm run images`)
- Test: `tests/photos/import.test.ts`

**Interfaces:**
- Consumes: `PhotoStore` (Task 2), `processImageWith`, `checkPhotoDimensions`, `MediaStorage`, `NO_EXIF`.
- Produces:
  - `RepoPhoto {slug; title; date; camera; image}`
  - `parseRepoPhoto(slug, source)`
  - `importPhotos(store, storage, items, now, {dryRun}): Promise<{imported: string[]; skipped: string[]}>`
  - `npm run import:photos -- <checkout> [--dry-run] [--local]`

- [ ] **Step 1: Write the failing test**

`tests/photos/import.test.ts`:

```ts
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { LocalMediaStorage } from "@/lib/media/storage";
import { FilePhotoStore } from "@/lib/photos/file-store";
import { importPhotos, parseRepoPhoto } from "@/lib/photos/import";

const now = new Date("2026-10-06T09:00:00.000Z");

describe("parseRepoPhoto", () => {
  it("reads the frontmatter, with YAML dates and an optional camera", () => {
    expect(parseRepoPhoto("stabilo", "---\ntitle: Stabilo\ndate: 2026-04-11\nimage: photos/stabilo\ncamera: iPhone 17\n---\n")).toEqual({
      slug: "stabilo",
      title: "Stabilo",
      date: "2026-04-11",
      image: "photos/stabilo",
      camera: "iPhone 17",
    });
    expect(parseRepoPhoto("x", "---\ntitle: X\ndate: 2026-01-01\nimage: photos/x\n---\n").camera).toBe("");
  });

  it("names the file when the frontmatter is invalid", () => {
    expect(() => parseRepoPhoto("bad", "---\ntitle: Bad\n---\n")).toThrow("content/photos/bad.mdx");
  });
});

describe("importPhotos", () => {
  async function setup() {
    const dir = mkdtempSync(join(tmpdir(), "import-"));
    const store = new FilePhotoStore(join(dir, "c.photos.json"));
    const storage = new LocalMediaStorage(join(dir, "media"));
    const bytes = await sharp({ create: { width: 2560, height: 1440, channels: 3, background: "#2F55F5" } }).jpeg().toBuffer();
    const items = [{ photo: { slug: "stabilo", title: "Stabilo", date: "2026-04-11", image: "photos/stabilo", camera: "iPhone 17" }, bytes }];
    return { dir, store, storage, items };
  }

  it("imports a published photo under its old slug, dated at midnight", async () => {
    const { store, storage, items } = await setup();
    expect(await importPhotos(store, storage, items, now, { dryRun: false })).toEqual({ imported: ["stabilo"], skipped: [] });
    const [photo] = await store.listPublished();
    expect(photo).toMatchObject({ slug: "stabilo", title: "Stabilo", alt: "", takenAt: "2026-04-11T00:00:00", camera: "iPhone 17", exif: { takenAt: null, camera: null }, publishedAt: now.toISOString() });
    expect(photo.image.key).toMatch(/^media\/photos\/[0-9a-f]{16}-[0-9a-f]{8}$/);
    expect(photo.image.widths).toEqual([640, 1280, 2560]);
  });

  it("skips a slug that is already there, so it can run again", async () => {
    const { store, storage, items } = await setup();
    await importPhotos(store, storage, items, now, { dryRun: false });
    expect(await importPhotos(store, storage, items, now, { dryRun: false })).toEqual({ imported: [], skipped: ["stabilo"] });
    expect(await store.list()).toHaveLength(1);
  });

  it("writes nothing on a dry run", async () => {
    const { dir, store, storage, items } = await setup();
    expect(await importPhotos(store, storage, items, now, { dryRun: true })).toEqual({ imported: ["stabilo"], skipped: [] });
    expect(await store.list()).toEqual([]);
    expect(readdirSync(dir)).not.toContain("media");
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run tests/photos/import.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/photos/import.ts`:

```ts
import { randomUUID } from "node:crypto";
import matter from "gray-matter";
import { z } from "zod";
import { processImageWith } from "../media/process";
import { checkPhotoDimensions } from "../media/rules";
import type { MediaStorage } from "../media/storage";
import type { PhotoStore } from "./store";
import { NO_EXIF } from "./types";

// The one-off move of the repo photos into the photos table (Sprint 11 spec
// §5). scripts/import-photos.ts reads the files and calls importPhotos.

// YAML turns `date: 2026-02-10` into a Date; normalise to YYYY-MM-DD.
const dateString = z
  .union([z.date(), z.string()])
  .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

const frontmatter = z.object({ title: z.string().min(1), date: dateString, image: z.string().min(1), camera: z.string().optional() });

export interface RepoPhoto {
  slug: string;
  title: string;
  date: string;
  // The images-src/ key, e.g. "photos/stabilo".
  image: string;
  camera: string;
}

export function parseRepoPhoto(slug: string, source: string): RepoPhoto {
  const parsed = frontmatter.safeParse(matter(source).data);
  if (!parsed.success) throw new Error(`content/photos/${slug}.mdx: ${parsed.error.message}`);
  return { slug, title: parsed.data.title, date: parsed.data.date, image: parsed.data.image, camera: parsed.data.camera ?? "" };
}

export interface ImportResult {
  imported: string[];
  skipped: string[];
}

// Each photo keeps its slug, date and camera and goes live at once. Safe to
// re-run: a slug already in the store is skipped. A dry run writes nothing.
export async function importPhotos(
  store: PhotoStore,
  storage: MediaStorage,
  items: { photo: RepoPhoto; bytes: Buffer }[],
  now: Date,
  options: { dryRun: boolean },
): Promise<ImportResult> {
  const taken = new Set(await store.slugs());
  const result: ImportResult = { imported: [], skipped: [] };
  for (const { photo, bytes } of items) {
    if (taken.has(photo.slug)) {
      result.skipped.push(photo.slug);
      continue;
    }
    if (options.dryRun) {
      result.imported.push(photo.slug);
      continue;
    }
    const processed = await processImageWith(bytes, { key: (hash) => `media/photos/${hash.slice(0, 16)}-${randomUUID().slice(0, 8)}`, check: checkPhotoDimensions }, storage, now);
    if (!processed.ok) throw new Error(`${photo.slug}: ${processed.reason}`);
    const { key, baseUrl, width, height, widths } = processed.record;
    const write = await store.create(
      {
        title: photo.title,
        alt: "",
        takenAt: `${photo.date}T00:00:00`,
        camera: photo.camera,
        slug: photo.slug,
        image: { key, baseUrl, width, height, widths },
        exif: NO_EXIF,
        status: "published",
        publishedAt: now,
      },
      now,
    );
    if (!write.ok) throw new Error(`${photo.slug}: ${write.reason}`);
    taken.add(photo.slug);
    result.imported.push(photo.slug);
  }
  return result;
}
```

`scripts/import-photos.ts`:

```ts
// One-off (Sprint 11): moves the repo photos into the photos table and media
// storage, keeping their slugs, dates and cameras.
//
//   DATABASE_URL=… BLOB_READ_WRITE_TOKEN=… npm run import:photos -- <checkout> [--dry-run]
//
// <checkout> still has content/photos/*.mdx and images-src/photos/ (the v2
// worktree before Sprint 11 merges; this branch deletes them). Re-runnable: a
// slug already in the table is skipped. Without a Blob token it refuses,
// unless --local says the renditions may go to MEDIA_DEV_DIR (local runs
// only). Relative imports: tsx runs this outside Next.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { BlobMediaStorage, LocalMediaStorage } from "../lib/media/storage";
import { DrizzlePhotoStore } from "../lib/photos/drizzle-store";
import { importPhotos, parseRepoPhoto } from "../lib/photos/import";

const USAGE = "usage: DATABASE_URL=… BLOB_READ_WRITE_TOKEN=… npm run import:photos -- <checkout> [--dry-run] [--local]";

function sourceFor(checkout: string, image: string): Buffer {
  for (const extension of [".jpeg", ".jpg", ".png"]) {
    const file = join(checkout, "images-src", `${image}${extension}`);
    if (existsSync(file)) return readFileSync(file);
  }
  throw new Error(`no source for ${image} under ${checkout}/images-src/`);
}

async function main() {
  const args = process.argv.slice(2);
  const checkout = args.find((arg) => !arg.startsWith("--"));
  const url = process.env.DATABASE_URL;
  const dryRun = args.includes("--dry-run");
  const local = args.includes("--local");
  if (!checkout || !url) {
    console.error(USAGE);
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN && !local && !dryRun) {
    console.error(`BLOB_READ_WRITE_TOKEN is not set; pass --local to write renditions to MEDIA_DEV_DIR.\n${USAGE}`);
    process.exit(1);
  }
  const dir = join(checkout, "content", "photos");
  const items = readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .sort()
    .map((file) => {
      const photo = parseRepoPhoto(file.replace(/\.mdx$/, ""), readFileSync(join(dir, file), "utf8"));
      return { photo, bytes: sourceFor(checkout, photo.image) };
    });
  const storage = process.env.BLOB_READ_WRITE_TOKEN ? new BlobMediaStorage() : new LocalMediaStorage(process.env.MEDIA_DEV_DIR ?? ".media-dev");
  const result = await importPhotos(new DrizzlePhotoStore(drizzle(neon(url))), storage, items, new Date(), { dryRun });
  const list = (slugs: string[]) => (slugs.length > 0 ? slugs.join(", ") : "none");
  console.log(`[photos] ${dryRun ? "dry run, would import" : "imported"} ${result.imported.length}: ${list(result.imported)}; skipped ${result.skipped.length}: ${list(result.skipped)} [${storage.mode}]`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Add to `package.json` `scripts`, after `import:letterboxd`: `"import:photos": "tsx scripts/import-photos.ts"`.

- [ ] **Step 4: Run the test and a dry run against the v2 worktree**

```bash
npx vitest run tests/photos/import.test.ts
npx tsx -e 'import("./lib/photos/import.ts").then(async ({ parseRepoPhoto }) => { const fs = await import("node:fs"); for (const f of fs.readdirSync("../onursenture.github.com-v2/content/photos")) console.log(parseRepoPhoto(f.replace(".mdx",""), fs.readFileSync("../onursenture.github.com-v2/content/photos/" + f, "utf8"))); })'
```

Expected: the test passes, and the second command prints the 5 repo photos with their slugs, dates and cameras. That proves the parser reads the real files under tsx. The real dry run needs a database and is the controller's rollout step.

- [ ] **Step 5: Delete the repo photos**

```bash
git rm -r -q content/photos images-src/photos public/images/photos
npm run images
grep -c '"photos/' lib/images/manifest.json
```

Expected: the grep prints `0`, and the manifest still holds the `fixtures/*` and every other entry. If `npm run images` keeps stale `photos/*` entries, remove them from `lib/images/manifest.json` by hand.

Then `grep -rn "content/photos\|images-src/photos\|/images/photos/" --include=*.ts --include=*.tsx --include=*.md . | grep -v node_modules | grep -v docs/superpowers`. Only `lib/photos/import.ts`, `scripts/import-photos.ts`, comments about the old layout and `tests/content/views.test.tsx` (a pure URL-builder test) may remain.

- [ ] **Step 6: Update `CLAUDE.md`**

- Replace the "Deleting a photo: …" bullet (line ~221) with:

```markdown
- Photos (Sprint 11) live in the `photos` table, not the repo. Add, edit and delete them at `/admin/photos/`: the browser reads EXIF `DateTimeOriginal`, `Make` and `Model` with `exifr` (never GPS) before the HEIC→JPEG redraw, then the Notes upload pipeline renders `media/photos/<hash16>-<rand8>-<w>.{avif,jpg}`. A photo's slug comes from its title at first publish and never changes. Delete removes the row and its renditions. Reads go through `lib/photos/read.ts` (`PHOTOS_TAG`); fixture mode serves `lib/photos/fixtures.ts` (images in `images-src/fixtures/`). `npm run import:photos` was the one-off move of the 5 repo photos.
```

- In the Admin section, next to the Notes bullet, add:

```markdown
- **Photos.** `/admin/photos/` (mockup A in `docs/superpowers/specs/2026-10-05-sprint-11-mockups/`): "+ Add photo" on top, the open photo's form (Title, optional Alt text, Date and Camera with an "EXIF" hint while they match the upload), and every photo below, drafts first. `PhotoEditorState` (`lib/admin/photo-editor.ts`) holds the logic; writes are `lib/photos/operations.ts` behind `app/admin/photos-actions.ts`.
```

- [ ] **Step 7: Run everything**

```bash
npm test && npm run typecheck && npm run lint
lsof -ti:3217,3219,3221 | xargs kill 2>/dev/null
npm run build && npm run e2e && npm run e2e:admin
SOURCE_FIXTURES=1 npm run build && npm run e2e:fixtures
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A lib/photos/import.ts scripts/import-photos.ts package.json CLAUDE.md tests/photos/import.test.ts content images-src public/images lib/images/manifest.json
git commit -m "Add the one-off photo import and remove the repo photos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10 (controller): visual check, final review, PR and rollout

- [ ] **Visual check** (never skipped). Take screenshots with `SOURCE_FIXTURES=1 npm run build && npm start` and the admin e2e server, or `npm run dev` with `CONTENT_STORE_FILE`:
  - `/admin/photos/` at 1440 and 390: empty, with a draft open, with a live photo open, and with an upload error.
  - `/admin/` with its Photos section.
  - `/life/photos/`, `/life/photos/kizilcikli/` (alt text, camera) and the `/life/` photo row.
  - Check the mockup A match: dashed "+ Add photo", the form under it, 44px thumbnails, Draft/Live pills, nothing wider than 390.
- [ ] **Final review:** an opus whole-branch review against the spec. Then one fix wave if needed. Record controller-decided technical fixes in the follow-ups file.
- [ ] **Follow-ups file:** `docs/superpowers/plans/2026-10-05-sprint-11-followups.md`, containing the rollout steps below, Onur's checks and "Later" items.
- [ ] **PR** into `v2`, after Onur's OK, with the attribution line.
- [ ] **Rollout** (each production step needs Onur's OK; secrets never go through chat, so use `vercel env pull` into a git-ignored file in Onur's terminal or the controller's shell, never echoed):
  1. Migrate production (expand-only): `npm run db:migrate` with the production `DATABASE_URL`.
  2. `npm run import:photos -- ../onursenture.github.com-v2 --dry-run`, then without `--dry-run`, with the production `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN`. Expect 5 imported.
  3. Merge the PR (deploys production).
  4. Checks on production:
     - the 5 photo URLs return 200 with CDN HIT, plus `/life/photos/`;
     - `/feed.xml` lists them;
     - `/life/` shows "last photo";
     - `og:image` is the Blob JPEG.
  5. Onur posts a real HEIC from his iPhone and publishes it. This also closes the Sprint 9 phone-upload check. Confirm its date and camera came from EXIF, and that a new slug renders, is cached and updates after an edit.
- [ ] Remove the sprint-11 worktree and branch after the merge, locally and on origin.
