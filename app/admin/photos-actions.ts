"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { isAdmin } from "@/lib/auth/admin";
import { processImageWith } from "@/lib/media/process";
import { checkPhotoDimensions } from "@/lib/media/rules";
import { type MediaStorage, getMediaStorage } from "@/lib/media/storage";
import { getPhotoStore } from "@/lib/photos/get-store";
import {
  type PhotoActionResult,
  type PhotoInput,
  type PhotoOpResult,
  type PhotoRef,
  createPhotoDraft,
  deletePhoto,
  publishPhoto,
  savePhoto,
} from "@/lib/photos/operations";
import { photoExifSchema } from "@/lib/photos/schema";
import type { PhotoStore } from "@/lib/photos/store";
import { PHOTOS_TAG } from "@/lib/photos/tags";
import { NO_EXIF } from "@/lib/photos/types";

// Server actions for /admin/photos/ (Sprint 11 spec §3). Each checks the
// session, then the store; a store error reads as "unavailable". Every
// successful write updates the photos tag, so the next request renders it.

function photoStore(): PhotoStore | null {
  try {
    return getPhotoStore();
  } catch {
    return null;
  }
}

function mediaStorage(): MediaStorage | null {
  try {
    return getMediaStorage();
  } catch {
    return null;
  }
}

async function withStore(work: (store: PhotoStore) => Promise<PhotoOpResult>): Promise<PhotoActionResult> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const store = photoStore();
  if (!store) return { status: "unavailable" };
  try {
    const result = await work(store);
    if (result.status === "ok") updateTag(PHOTOS_TAG);
    return result;
  } catch (e) {
    console.warn("[photos]", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  }
}

export async function savePhotoAction(input: PhotoInput): Promise<PhotoActionResult> {
  return withStore((store) => savePhoto(store, input, new Date()));
}

export async function publishPhotoAction(input: PhotoInput): Promise<PhotoActionResult> {
  return withStore((store) => publishPhoto(store, input, new Date()));
}

export async function deletePhotoAction(ref: PhotoRef): Promise<PhotoActionResult> {
  return withStore((store) => deletePhoto(store, mediaStorage(), ref));
}

// After the browser uploaded an original (PNG or JPEG; the browser converts
// anything else): check it, render the renditions under a fresh key (so two
// uploads of one file never share files) and create the draft with the EXIF
// the browser read. The original is deleted either way.
export async function processPhotoUploadAction(input: { source: string; exif: unknown }): Promise<PhotoActionResult> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const invalid = (message: string) => ({ status: "invalid" as const, issues: [{ at: "image", message }] });
  const storage = mediaStorage();
  if (!storage) return { status: "unavailable" };
  try {
    const store = photoStore();
    if (!store) return { status: "unavailable" };
    let bytes: Buffer;
    try {
      bytes = await storage.readSource(input.source);
    } catch {
      return invalid("The upload could not be read. Try again.");
    }
    const now = new Date();
    const result = await processImageWith(bytes, { key: (hash) => `media/photos/${hash.slice(0, 16)}-${randomUUID().slice(0, 8)}`, check: checkPhotoDimensions }, storage, now);
    if (!result.ok) return invalid(result.reason);
    const { key, baseUrl, width, height, widths } = result.record;
    const exif = photoExifSchema.safeParse(input.exif);
    // A draft isn't on the site, so no tag update.
    return await createPhotoDraft(store, { image: { key, baseUrl, width, height, widths }, exif: exif.success ? exif.data : NO_EXIF }, now);
  } catch (e) {
    console.warn("[photos] upload failed:", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  } finally {
    await storage.deleteSource(input.source).catch(() => undefined);
  }
}
