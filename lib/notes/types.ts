// Notes (Sprint 9 spec §1): short posts shaped like a Bluesky post
// (app.bsky.feed.post), so a later cross-post needs no reshaping.

export const NOTE_SIDES = ["work", "life", "both"] as const;
export type NoteSide = (typeof NOTE_SIDES)[number];

export const NOTE_LANGS = ["en", "tr"] as const;
export type NoteLang = (typeof NOTE_LANGS)[number];

export const NOTE_STATUSES = ["draft", "scheduled", "published"] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];

// Bluesky's limits: 300 graphemes of text, 4 images per post.
export const MAX_GRAPHEMES = 300;
export const MAX_IMAGES = 4;

// An uploaded image with its renditions, self-contained so a note renders
// without a media lookup (the same fields as ImageEntry, plus key and alt).
export interface NoteImage {
  key: string;
  alt: string;
  width: number;
  height: number;
  widths: number[];
  baseUrl?: string;
}

export interface NoteLinkCard {
  kind: "link";
  url: string;
  title: string;
  description: string;
  siteName: string;
}

// One attachment at most, like a Bluesky embed.
export type NoteEmbed = { kind: "images"; images: NoteImage[] } | NoteLinkCard | null;

// What the author edits.
export interface NoteContent {
  text: string;
  side: NoteSide;
  lang: NoteLang;
  embed: NoteEmbed;
}

// A stored note. Plain data with ISO strings, so server actions can hand it
// to client components unchanged.
export interface Note extends NoteContent {
  id: string;
  // The AT Protocol record key, set the first time the note is published.
  tid: string | null;
  status: NoteStatus;
  publishAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedNote extends Note {
  tid: string;
  status: "published";
  publishedAt: string;
}

export function isPublished(note: Note): note is PublishedNote {
  return note.status === "published" && note.tid !== null && note.publishedAt !== null;
}

// A reason a note can't be published or scheduled; `at` is a path into the
// content ("text", "embed/images/1/alt", "publishAt").
export interface NoteIssue {
  at: string;
  message: string;
}
