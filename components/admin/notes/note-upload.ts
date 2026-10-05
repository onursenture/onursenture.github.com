"use client";

import { processNoteUploadAction } from "@/app/admin/notes-actions";
import { checkNoteDimensions } from "@/lib/media/rules";
import type { NoteImage } from "@/lib/notes/types";
import { uploadOriginal } from "../media-upload";

type UploadResult = Awaited<ReturnType<typeof processNoteUploadAction>>;

export async function uploadNoteImage(original: File, mode: "blob" | "local"): Promise<{ status: "ok"; image: NoteImage } | Exclude<UploadResult, { status: "ok" }>> {
  const sent = await uploadOriginal(original, mode, { folder: "notes", keepPng: true, check: checkNoteDimensions });
  if (sent.status === "invalid") return { status: "invalid", issues: [{ at: "embed/images", message: sent.message }] };
  if (sent.status === "unauthorized") return sent;
  return processNoteUploadAction({ source: sent.source });
}
