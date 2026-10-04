"use server";

import { updateTag } from "next/cache";
import { isAdmin } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { processImageWith } from "@/lib/media/process";
import { checkNoteDimensions } from "@/lib/media/rules";
import { type MediaStorage, getMediaStorage } from "@/lib/media/storage";
import { getNoteStore } from "@/lib/notes/get-store";
import { fetchLinkCard } from "@/lib/notes/link-card";
import {
  type NoteActionResult,
  type NoteInput,
  type NoteOpResult,
  type NoteRef,
  deleteNote,
  publishNote,
  saveNote,
  scheduleNote,
  unscheduleNote,
} from "@/lib/notes/operations";
import type { NoteStore } from "@/lib/notes/store";
import { NOTES_TAG } from "@/lib/notes/tags";
import type { NoteImage, NoteIssue, NoteLinkCard } from "@/lib/notes/types";

// Server actions for /admin/notes/ (spec §4.2). Each checks the session, then
// the store; a store error reads as "unavailable". Every successful write
// updates the notes tag, so the next request renders the change.

async function withStore(work: (store: NoteStore) => Promise<NoteOpResult>): Promise<NoteActionResult> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  let store: NoteStore | null;
  try {
    store = getNoteStore();
  } catch {
    store = null;
  }
  if (!store) return { status: "unavailable" };
  try {
    const result = await work(store);
    if (result.status === "ok") updateTag(NOTES_TAG);
    return result;
  } catch (e) {
    console.warn("[notes]", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  }
}

export async function saveNoteAction(input: NoteInput): Promise<NoteActionResult> {
  return withStore((store) => saveNote(store, input, new Date()));
}

export async function publishNoteAction(input: NoteInput): Promise<NoteActionResult> {
  return withStore((store) => publishNote(store, input, new Date()));
}

export async function scheduleNoteAction(input: NoteInput & { publishAt: string }): Promise<NoteActionResult> {
  return withStore((store) => scheduleNote(store, input, new Date()));
}

export async function unscheduleNoteAction(ref: NoteRef): Promise<NoteActionResult> {
  return withStore((store) => unscheduleNote(store, ref, new Date()));
}

export async function deleteNoteAction(ref: NoteRef): Promise<NoteActionResult> {
  return withStore((store) => deleteNote(store, ref));
}

export async function fetchLinkCardAction(
  url: string,
): Promise<{ status: "ok"; card: NoteLinkCard } | { status: "invalid"; issues: NoteIssue[] } | { status: "unauthorized" }> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const card = await fetchLinkCard(url.trim());
  return card ? { status: "ok", card } : { status: "invalid", issues: [{ at: "embed/url", message: "Use an http or https link." }] };
}

// After the browser uploaded an original (PNG or JPEG; the browser converts
// anything else): check it against the note rules, render the renditions and
// hand back a self-contained NoteImage. The original is deleted either way. A
// media row is recorded too, for the later media cleanup; notes never read it.
export async function processNoteUploadAction(input: {
  source: string;
}): Promise<{ status: "ok"; image: NoteImage } | { status: "invalid"; issues: NoteIssue[] } | { status: "unauthorized" } | { status: "unavailable" }> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  const invalid = (message: string) => ({ status: "invalid" as const, issues: [{ at: "embed/images", message }] });
  let storage: MediaStorage;
  try {
    storage = getMediaStorage();
  } catch {
    return { status: "unavailable" };
  }
  try {
    let bytes: Buffer;
    try {
      bytes = await storage.readSource(input.source);
    } catch {
      return invalid("The upload could not be read. Try again.");
    }
    const result = await processImageWith(bytes, { key: (hash) => `media/notes/${hash.slice(0, 16)}`, check: checkNoteDimensions }, storage, new Date());
    if (!result.ok) return invalid(result.reason);
    await getContentStore()?.putMedia(result.record);
    const { key, baseUrl, width, height, widths } = result.record;
    return { status: "ok", image: { key, baseUrl, width, height, widths, alt: "" } };
  } catch (e) {
    console.warn("[notes] upload failed:", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  } finally {
    await storage.deleteSource(input.source).catch(() => undefined);
  }
}
