import "server-only";
import { getDb } from "../db/client";
import { DrizzleNoteStore } from "./drizzle-store";
import { FileNoteStore, notesFileFor } from "./file-store";
import type { NoteStore } from "./store";

// The store for notes, chosen like getContentStore: CONTENT_STORE_FILE (local
// dev, the admin e2e; refused on Vercel) wins, then Neon, else null (no notes
// render and the admin can't write).
export function getNoteStore(): NoteStore | null {
  const file = process.env.CONTENT_STORE_FILE;
  if (file) {
    if (process.env.VERCEL) throw new Error("CONTENT_STORE_FILE is for local development and e2e only");
    return new FileNoteStore(notesFileFor(file));
  }
  const db = getDb();
  return db ? new DrizzleNoteStore(db) : null;
}
