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
