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
