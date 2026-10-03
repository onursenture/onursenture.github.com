import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { cacheLife } from "next/cache";
import { z } from "zod";

const PHOTOS_DIR = join(process.cwd(), "content", "photos");

// YAML turns `date: 2026-02-10` into a Date; normalize to YYYY-MM-DD.
const dateString = z
  .union([z.date(), z.string()])
  .transform((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value))
  .pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const photoFrontmatterSchema = z.object({
  title: z.string().min(1),
  date: dateString,
  // Image manifest key, e.g. "photos/stabilo".
  image: z.string().min(1),
  camera: z.string().optional(),
});

export type Photo = z.infer<typeof photoFrontmatterSchema> & { slug: string };

export function parsePhoto(slug: string, source: string): Photo {
  const { data } = matter(source);
  const result = photoFrontmatterSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`content/photos/${slug}.mdx: ${result.error.message}`);
  }
  return { slug, ...result.data };
}

export async function loadPhotos(dir: string = PHOTOS_DIR): Promise<Photo[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".mdx"));
  const photos = await Promise.all(
    files.map(async (file) =>
      parsePhoto(file.replace(/\.mdx$/, ""), await readFile(join(dir, file), "utf8")),
    ),
  );
  return photos.sort((a, b) => b.date.localeCompare(a.date));
}

// Cached for prerendering; content only changes with a deploy.
export async function getPhotos(): Promise<Photo[]> {
  "use cache";
  cacheLife("max");
  return loadPhotos();
}

export async function getPhoto(slug: string): Promise<Photo | undefined> {
  return (await getPhotos()).find((p) => p.slug === slug);
}

// The neighbours of a photo in index order (newest first): previous is the
// newer one, next the older one.
export function adjacentPhotos(
  photos: Photo[],
  slug: string,
): { previous: Photo | null; next: Photo | null } {
  const index = photos.findIndex((p) => p.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return { previous: photos[index - 1] ?? null, next: photos[index + 1] ?? null };
}
