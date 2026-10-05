import type { Photo } from "@/lib/content/photos";
import type { Contributions } from "@/lib/sources/github";
import type { Book } from "@/lib/sources/goodreads";
import type { Article } from "@/lib/sources/instapaper";
import type { Film } from "@/lib/sources/letterboxd";
import type { Post } from "@/lib/sources/writing";

export interface ReadoutLine {
  key: string;
  label: string;
  value: string;
  detail?: string;
  // What sits between value and detail (default " "): " · " after an article title.
  separator?: string;
  href?: string;
}

// The line as one string: `label: value<separator>detail`.
export function readoutText(line: ReadoutLine): string {
  return `${line.label}: ${line.value}${line.detail ? `${line.separator ?? " "}${line.detail}` : ""}`;
}

export interface ReadoutInput {
  film?: Pick<Film, "title" | "link">;
  // The newest play from the theatre archive.
  play?: { title: string; link: string };
  // Every book on the currently-reading shelf.
  books?: Pick<Book, "title" | "link">[];
  article?: Pick<Article, "title" | "link" | "domain" | "minutes">;
  photo?: Pick<Photo, "title" | "slug">;
  // The latest Life (or both-side) note.
  note?: { text: string; href: string };
  post?: Pick<Post, "title" | "link">;
  contributions?: Contributions;
}

// The Life boot readout: the newest item from each source, and every book
// being read on one line. No ratings. A source with no data drops its line
// (Sprint 4 spec §5); nothing is faked.
export function buildReadout(input: ReadoutInput): ReadoutLine[] {
  const lines: ReadoutLine[] = [];
  const { film, play, books, article, photo, note, post, contributions } = input;
  if (film) lines.push({ key: "film", label: "last watched", value: film.title, href: film.link });
  if (play) lines.push({ key: "play", label: "last play", value: play.title, href: play.link });
  if (books && books.length > 0) {
    lines.push({ key: "books", label: "reading", value: books.map((b) => b.title).join(", ") });
  }
  if (article) {
    const detail = [article.domain, article.minutes ? `${article.minutes} min` : ""].filter(Boolean).join(" · ");
    lines.push({
      key: "article",
      label: "saved",
      value: article.title,
      detail: detail || undefined,
      separator: " · ",
      href: article.link,
    });
  }
  if (photo) lines.push({ key: "photo", label: "last photo", value: photo.title, href: `/life/photos/${photo.slug}/` });
  if (note) lines.push({ key: "note", label: "note", value: note.text.replace(/\s+/g, " ").trim(), href: note.href });
  if (post) lines.push({ key: "post", label: "writing", value: post.title, href: post.link });
  if (contributions && contributions.weeks.length > 0) {
    lines.push({
      key: "contributions",
      label: "contributions, last 12 months",
      value: contributions.total.toLocaleString("en-US"),
    });
  }
  return lines;
}
