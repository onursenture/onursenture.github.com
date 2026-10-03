import type { Photo } from "@/lib/content/photos";
import type { Contributions } from "@/lib/sources/github";
import type { Book } from "@/lib/sources/goodreads";
import type { Article } from "@/lib/sources/instapaper";
import type { Film } from "@/lib/sources/letterboxd";
import { formatRating } from "@/lib/sources/rating";
import type { Post } from "@/lib/sources/writing";

export interface ReadoutLine {
  key: string;
  label: string;
  value: string;
  detail?: string;
  href?: string;
}

export interface ReadoutInput {
  film?: Pick<Film, "title" | "link" | "ratingValue">;
  book?: Pick<Book, "title" | "author" | "link">;
  article?: Pick<Article, "title" | "link" | "domain" | "minutes">;
  photo?: Pick<Photo, "title" | "slug">;
  post?: Pick<Post, "title" | "link">;
  contributions?: Contributions;
}

// The Life boot readout: the newest item from each source. A source with no
// data drops its line (Sprint 4 spec §5); nothing is faked.
export function buildReadout(input: ReadoutInput): ReadoutLine[] {
  const lines: ReadoutLine[] = [];
  const { film, book, article, photo, post, contributions } = input;
  if (film) {
    const rating = formatRating(film.ratingValue);
    lines.push({ key: "film", label: "last watched", value: film.title, detail: rating || undefined, href: film.link });
  }
  if (book) lines.push({ key: "book", label: "reading", value: book.title, detail: book.author || undefined, href: book.link });
  if (article) {
    const detail = [article.domain, article.minutes ? `${article.minutes} min` : ""].filter(Boolean).join(" · ");
    lines.push({ key: "article", label: "saved", value: article.title, detail: detail || undefined, href: article.link });
  }
  if (photo) lines.push({ key: "photo", label: "last photo", value: photo.title, href: `/life/photos/${photo.slug}/` });
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
