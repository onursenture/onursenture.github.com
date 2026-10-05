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
