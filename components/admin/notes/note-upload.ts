"use client";

import { upload } from "@vercel/blob/client";
import { processNoteUploadAction } from "@/app/admin/notes-actions";
import { MAX_BYTES, checkNoteDimensions } from "@/lib/media/rules";
import type { NoteImage } from "@/lib/notes/types";

type UploadResult = Awaited<ReturnType<typeof processNoteUploadAction>>;

// Big phone photos (48 MP) would pass iOS Safari's canvas limit; 4096px on the
// long side is still more than the largest rendition (2560).
const MAX_CONVERT_SIDE = 4096;

function refused(message: string): UploadResult {
  return { status: "invalid", issues: [{ at: "embed/images", message }] };
}

// PNG and JPEG upload as they are. Anything the browser can decode (HEIC on
// an iPhone, WebP) is redrawn as a JPEG first, because the server's sharp
// can't read HEIC (spec §6).
async function prepare(file: File): Promise<File | UploadResult> {
  if (file.size > MAX_BYTES) return refused("The file is larger than 25 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return refused("This browser can't read the image. Use a PNG or JPEG.");
  }
  const problem = checkNoteDimensions(bitmap.width, bitmap.height);
  if (problem) {
    bitmap.close();
    return refused(problem);
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
  return blob ? new File([blob], "note.jpg", { type: "image/jpeg" }) : refused("The image could not be converted. Use a PNG or JPEG.");
}

async function signedOut(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/upload/", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    return response.status === 401;
  } catch {
    return false;
  }
}

export async function uploadNoteImage(original: File, mode: "blob" | "local"): Promise<{ status: "ok"; image: NoteImage } | Exclude<UploadResult, { status: "ok" }>> {
  const prepared = await prepare(original);
  if (!(prepared instanceof File)) return prepared as Exclude<UploadResult, { status: "ok" }>;
  let source: string;
  if (mode === "blob") {
    const extension = prepared.type === "image/png" ? "png" : "jpg";
    try {
      const blob = await upload(`uploads/notes/${crypto.randomUUID()}.${extension}`, prepared, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/",
        contentType: prepared.type,
      });
      source = blob.url;
    } catch (e) {
      if (await signedOut()) return { status: "unauthorized" };
      throw e;
    }
  } else {
    const response = await fetch("/api/admin/upload-dev/", { method: "POST", headers: { "content-type": prepared.type }, body: prepared });
    if (response.status === 401) return { status: "unauthorized" };
    const data = (await response.json()) as { source?: string; error?: string };
    if (!response.ok || !data.source) return refused(data.error ?? "The upload failed. Try again.");
    source = data.source;
  }
  return processNoteUploadAction({ source });
}
