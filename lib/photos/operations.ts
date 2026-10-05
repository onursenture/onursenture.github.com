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
