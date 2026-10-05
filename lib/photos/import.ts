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

// Guards for scripts/import-photos.ts: which database it is about to write to.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

// The host of a database URL, never its credentials, path or query. Null when
// the URL does not parse.
export function databaseHost(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    // WHATWG URL keeps the brackets on IPv6 hosts.
    return host.replace(/^\[|\]$/g, "") || null;
  } catch {
    return null;
  }
}

// --local writes renditions to disk, so it only makes sense against a local
// database; a production URL with --local is refused.
export function localImportAllowed(url: string): boolean {
  const host = databaseHost(url);
  return host !== null && LOCAL_HOSTS.includes(host);
}
