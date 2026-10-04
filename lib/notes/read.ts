import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fixtureNotes } from "./fixtures";
import { getNoteStore } from "./get-store";
import type { NoteStore } from "./store";
import { NOTES_TAG } from "./tags";
import type { PublishedNote } from "./types";

// The one public read of notes: every published note, newest first, cached
// and tagged so pages stay prerendered until an admin write or the cron
// revalidates NOTES_TAG. Never throws: no store or a store error renders no
// notes (an error is cached for minutes only, since it is probably transient).
export async function getPublishedNotes(): Promise<PublishedNote[]> {
  "use cache";
  cacheTag(NOTES_TAG);

  if (process.env.SOURCE_FIXTURES === "1") {
    cacheLife("hours");
    return fixtureNotes();
  }
  let store: NoteStore | null;
  try {
    store = getNoteStore();
  } catch (e) {
    console.warn("[notes] no store:", e instanceof Error ? e.message : e);
    store = null;
  }
  if (!store) {
    cacheLife("hours");
    return [];
  }
  try {
    const notes = await store.listPublished();
    cacheLife("days");
    return notes;
  } catch (e) {
    console.warn("[notes] reading notes failed:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return [];
  }
}
