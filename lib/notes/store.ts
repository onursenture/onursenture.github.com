import type { Note, NoteContent, NoteStatus, PublishedNote } from "./types";

// Persistence for notes. DrizzleNoteStore backs production (Neon);
// FileNoteStore backs local dev and the admin e2e. Same semantics, pinned by
// tests/helpers/note-store-contract.ts.

export interface NoteFields extends NoteContent {
  status: NoteStatus;
  tid: string | null;
  publishAt: Date | null;
  publishedAt: Date | null;
}

export type NoteWrite = { ok: true; note: Note } | { ok: false; reason: "conflict" | "missing" | "duplicate-tid" };

export interface NoteStore {
  // Every note, any status, most recently updated first.
  list(): Promise<Note[]>;
  // Published notes, newest first (publishedAt desc, then tid desc).
  listPublished(): Promise<PublishedNote[]>;
  get(id: string): Promise<Note | null>;
  create(fields: NoteFields, now: Date): Promise<NoteWrite>;
  // Optimistic: `expected` is the updatedAt (ISO) the caller last saw.
  update(id: string, fields: NoteFields, expected: string, now: Date): Promise<NoteWrite>;
  remove(id: string, expected: string): Promise<NoteWrite>;
  // Scheduled notes whose publishAt <= now, oldest publishAt first.
  due(now: Date): Promise<Note[]>;
}

// Newest first by publishedAt, then by TID (both sort as strings).
export function byPublished(a: PublishedNote, b: PublishedNote): number {
  return b.publishedAt.localeCompare(a.publishedAt) || b.tid.localeCompare(a.tid);
}
