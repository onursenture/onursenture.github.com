"use client";

import { processPhotoUploadAction } from "@/app/admin/photos-actions";
import { checkPhotoDimensions } from "@/lib/media/rules";
import { readExif } from "@/lib/photos/exif";
import type { PhotoActionResult } from "@/lib/photos/operations";
import { uploadOriginal } from "../media-upload";

// EXIF first: uploadOriginal's HEIC→JPEG redraw drops it (spec §2).
export async function uploadPhoto(original: File, mode: "blob" | "local"): Promise<PhotoActionResult> {
  const exif = await readExif(original);
  const sent = await uploadOriginal(original, mode, { folder: "photos", check: checkPhotoDimensions });
  if (sent.status === "invalid") return { status: "invalid", issues: [{ at: "image", message: sent.message }] };
  if (sent.status === "unauthorized") return sent;
  return processPhotoUploadAction({ source: sent.source, exif });
}
