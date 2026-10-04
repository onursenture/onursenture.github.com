"use client";

import { upload } from "@vercel/blob/client";
import { processUploadAction } from "@/app/admin/actions";
import type { ActionResult } from "@/lib/admin/results";
import type { MediaEntry } from "@/lib/images/lookup";
import { MAX_BYTES, checkDimensions, checkType } from "@/lib/media/rules";

type UploadResult = ActionResult<{ key: string; entry: MediaEntry }>;

function refused(message: string, slug: string, imageId: string): UploadResult {
  return { status: "invalid", issues: [{ doc: `work/${slug}`, at: `upload/${imageId}`, message }] };
}

async function signedOut(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/upload/", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    return response.status === 401;
  } catch {
    return false;
  }
}

// Checks the file in the browser first (type, size, 16:10), so a wrong file
// is never uploaded; then uploads the original (Blob, or the local route) and
// asks the server to render it. The server checks everything again.
export async function uploadImage(file: File, target: { slug: string; imageId: string }, mode: "blob" | "local"): Promise<UploadResult> {
  const typeProblem = checkType(file.type);
  if (typeProblem) return refused(typeProblem, target.slug, target.imageId);
  if (file.size > MAX_BYTES) return refused("The file is larger than 25 MB.", target.slug, target.imageId);
  const bitmap = await createImageBitmap(file);
  const sizeProblem = checkDimensions(bitmap.width, bitmap.height);
  bitmap.close();
  if (sizeProblem) return refused(sizeProblem, target.slug, target.imageId);

  let source: string;
  if (mode === "blob") {
    const extension = file.type === "image/png" ? "png" : "jpg";
    try {
      const blob = await upload(`uploads/${target.slug}/${target.imageId}.${extension}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/",
        contentType: file.type,
      });
      source = blob.url;
    } catch (e) {
      // The Blob client hides the token route's status in a generic error, so
      // ask the route again: 401 means the session is gone.
      if (await signedOut()) return { status: "unauthorized" };
      throw e;
    }
  } else {
    const response = await fetch("/api/admin/upload-dev/", { method: "POST", headers: { "content-type": file.type }, body: file });
    if (response.status === 401) return { status: "unauthorized" };
    const data = (await response.json()) as { source?: string; error?: string };
    if (!response.ok || !data.source) return refused(data.error ?? "The upload failed. Try again.", target.slug, target.imageId);
    source = data.source;
  }
  return processUploadAction({ source, ...target });
}
