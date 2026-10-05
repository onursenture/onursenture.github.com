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
