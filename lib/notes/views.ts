import { truncateGraphemes } from "./graphemes";
import type { PublishedNote } from "./types";

// Pure views over the published list (getPublishedNotes): which side a note
// shows on, paths, pages, year groups and neighbours. Tests and pages share
// them.

export type NotesSide = "work" | "life";

export const NOTES_PAGE_SIZE = 30;

// generateStaticParams must return one param under cacheComponents; this TID
// (time zero) is never a real note's, so its page is a 404.
export const PLACEHOLDER_TID = "2222222222222";

export function onSide(notes: PublishedNote[], side: NotesSide): PublishedNote[] {
  return notes.filter((note) => note.side === side || note.side === "both");
}

export function notesBase(side: NotesSide): string {
  return side === "work" ? "/notes/" : "/life/notes/";
}

// The note's page on the side being browsed (Life links stay on Life).
export function notePathOn(note: PublishedNote, side: NotesSide): string {
  return `${notesBase(side)}${note.tid}/`;
}

// A both-side note's canonical page is the Work one.
export function canonicalPath(note: PublishedNote): string {
  return notePathOn(note, note.side === "life" ? "life" : "work");
}

export function pagePath(side: NotesSide, page: number): string {
  return page === 1 ? notesBase(side) : `${notesBase(side)}page/${page}/`;
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / NOTES_PAGE_SIZE));
}

export interface NotesPage {
  items: PublishedNote[];
  page: number;
  pages: number;
}

export function pageOf(notes: PublishedNote[], page: number): NotesPage | null {
  const pages = pageCount(notes.length);
  if (!Number.isInteger(page) || page < 1 || page > pages) return null;
  return { items: notes.slice((page - 1) * NOTES_PAGE_SIZE, page * NOTES_PAGE_SIZE), page, pages };
}

// "2" → 2; "02", "0", "x" → null (one URL per page).
export function parsePage(param: string): number | null {
  return /^[1-9]\d*$/.test(param) ? Number(param) : null;
}

const yearFormat = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Istanbul" });

export function noteYear(iso: string): string {
  return yearFormat.format(new Date(iso));
}

// Consecutive runs by Istanbul year; the list is newest first, so are the groups.
export function groupByYear(notes: PublishedNote[]): { year: string; notes: PublishedNote[] }[] {
  const groups: { year: string; notes: PublishedNote[] }[] = [];
  for (const note of notes) {
    const year = noteYear(note.publishedAt);
    const last = groups.at(-1);
    if (last && last.year === year) last.notes.push(note);
    else groups.push({ year, notes: [note] });
  }
  return groups;
}

export function adjacentNotes(notes: PublishedNote[], tid: string): { newer: PublishedNote | null; older: PublishedNote | null } {
  const index = notes.findIndex((note) => note.tid === tid);
  if (index === -1) return { newer: null, older: null };
  return { newer: notes[index - 1] ?? null, older: notes[index + 1] ?? null };
}

// The page title and the neighbour links: the first 60 graphemes on one line.
export function noteTitle(note: Pick<PublishedNote, "text">): string {
  const line = note.text.replace(/\s+/g, " ").trim();
  return line ? truncateGraphemes(line, 60) : "Note";
}

// List frames keep the image's ratio between 4:5 (portrait) and 2:1.
export function frameRatio(width: number, height: number): number {
  return Math.min(2, Math.max(0.8, width / height));
}
