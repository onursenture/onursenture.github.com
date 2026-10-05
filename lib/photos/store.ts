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
