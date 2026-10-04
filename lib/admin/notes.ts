import "server-only";
import { uploadMode } from "@/lib/media/storage";
import { getNoteStore } from "@/lib/notes/get-store";
import type { NoteStore } from "@/lib/notes/store";
import type { Note } from "@/lib/notes/types";

// What /admin/notes/ starts from: every note, whether the store can be
// written, and where uploads go.
export interface NotesConsoleInit {
  notes: Note[];
  available: boolean;
  uploadMode: "blob" | "local" | null;
}

function store(): NoteStore | null {
  try {
    return getNoteStore();
  } catch {
    return null;
  }
}

export async function loadNotesConsole(): Promise<NotesConsoleInit> {
  const notes = store();
  const mode = uploadMode();
  if (!notes) return { notes: [], available: false, uploadMode: mode };
  try {
    return { notes: await notes.list(), available: true, uploadMode: mode };
  } catch (e) {
    console.warn("[notes] loading the console failed:", e instanceof Error ? e.message : e);
    return { notes: [], available: false, uploadMode: mode };
  }
}

// The admin home's Notes line; null when the store can't be read.
export async function noteCounts(): Promise<{ drafts: number; scheduled: number; published: number } | null> {
  const notes = store();
  if (!notes) return null;
  try {
    const all = await notes.list();
    const count = (status: Note["status"]) => all.filter((note) => note.status === status).length;
    return { drafts: count("draft"), scheduled: count("scheduled"), published: count("published") };
  } catch {
    return null;
  }
}
