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
