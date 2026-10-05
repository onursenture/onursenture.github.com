"use client";

import { upload } from "@vercel/blob/client";
import { MAX_BYTES } from "@/lib/media/rules";

// The browser half of every admin image upload (notes, photos): check the
// file, redraw what the server can't read as a JPEG, and put the original
// under uploads/<folder>/ in Blob (or through /api/admin/upload-dev/ locally).
// The caller hands the returned source to its own server action.

export type SourceResult = { status: "ok"; source: string } | { status: "invalid"; message: string } | { status: "unauthorized" };

// Big phone photos (48 MP) would pass iOS Safari's canvas limit; 4096px on the
// long side is still more than the largest rendition (2560).
const MAX_CONVERT_SIDE = 4096;

// PNG and JPEG upload as they are. Anything the browser can decode (HEIC on
// an iPhone, WebP) is redrawn as a JPEG first, because the server's sharp
// can't read HEIC. The redraw drops EXIF: read it before calling this.
async function prepare(file: File, check: (width: number, height: number) => string | null): Promise<File | string> {
  if (file.size > MAX_BYTES) return "The file is larger than 25 MB.";
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return "This browser can't read the image. Use a PNG or JPEG.";
  }
  const problem = check(bitmap.width, bitmap.height);
  if (problem) {
    bitmap.close();
    return problem;
  }
  if (file.type === "image/png" || file.type === "image/jpeg") {
    bitmap.close();
    return file;
  }
  const scale = Math.min(1, MAX_CONVERT_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  return blob ? new File([blob], "upload.jpg", { type: "image/jpeg" }) : "The image could not be converted. Use a PNG or JPEG.";
}

async function signedOut(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/upload/", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    return response.status === 401;
  } catch {
    return false;
  }
}

export async function uploadOriginal(
  original: File,
  mode: "blob" | "local",
  options: { folder: string; check: (width: number, height: number) => string | null },
): Promise<SourceResult> {
  const prepared = await prepare(original, options.check);
  if (typeof prepared === "string") return { status: "invalid", message: prepared };
  if (mode === "blob") {
    const extension = prepared.type === "image/png" ? "png" : "jpg";
    try {
      const blob = await upload(`uploads/${options.folder}/${crypto.randomUUID()}.${extension}`, prepared, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/",
        contentType: prepared.type,
      });
      return { status: "ok", source: blob.url };
    } catch (e) {
      if (await signedOut()) return { status: "unauthorized" };
      throw e;
    }
  }
  const response = await fetch("/api/admin/upload-dev/", { method: "POST", headers: { "content-type": prepared.type }, body: prepared });
  if (response.status === 401) return { status: "unauthorized" };
  const data = (await response.json()) as { source?: string; error?: string };
  if (!response.ok || !data.source) return { status: "invalid", message: data.error ?? "The upload failed. Try again." };
  return { status: "ok", source: data.source };
}
