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
