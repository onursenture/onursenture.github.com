"use client";

import { isHeic } from "@/lib/media/rules";

// HEIC in the browser. Only Safari decodes it natively, and the server's sharp
// can't decode it at all, so a HEIC is decoded here with heic-to (libheif):
// about 3 MB, loaded only when someone picks a HEIC. libheif applies the
// file's rotation, so the pixels come out upright and the EXIF orientation
// (dropped by the redraw anyway) no longer matters.

export const HEIC_FAILED = "The HEIC image could not be converted. Export it as a JPEG and try again.";

// A bitmap of any picked image: heic-to for HEIC, the browser for the rest
// (createImageBitmap applies EXIF orientation). Throws if neither can read it.
export async function decodeImage(file: File): Promise<ImageBitmap> {
  if (!isHeic(file)) return createImageBitmap(file);
  const { heicTo } = await import("heic-to");
  return heicTo({ blob: file, type: "bitmap" });
}

// The file as the server can take it: a HEIC becomes a JPEG, anything else
// stays as it is. A string is the reason it couldn't be converted.
export async function heicToJpeg(file: File): Promise<File | string> {
  if (!isHeic(file)) return file;
  try {
    const { heicTo } = await import("heic-to");
    const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.92 });
    return new File([jpeg], file.name.replace(/\.hei[cf]$/i, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return HEIC_FAILED;
  }
}
