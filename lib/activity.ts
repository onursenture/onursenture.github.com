import type { Book } from "./sources/goodreads";
import type { Article } from "./sources/instapaper";
import type { Film } from "./sources/letterboxd";

export interface ActivityItem {
  verb: "Watched" | "Finished" | "Saved";
  title: string;
  href: string;
  // ISO timestamp.
  date: string;
}

export const ACTIVITY_LIMIT = 8;

// The dashboard's Activity panel: films watched, books finished (the read
// shelf) and articles saved, merged newest first. Items without a usable
// date can't be placed in time and are left out.
export function buildActivity(
  { films, books, articles }: { films: Film[]; books: Book[]; articles: Article[] },
  limit: number = ACTIVITY_LIMIT,
): ActivityItem[] {
  const items: ActivityItem[] = [
    ...films.map((film) => ({ verb: "Watched" as const, title: film.title, href: film.link, date: film.date })),
    ...books.map((book) => ({ verb: "Finished" as const, title: book.title, href: book.link, date: book.date })),
    ...articles.map((article) => ({
      verb: "Saved" as const,
      title: article.title,
      href: article.link,
      date: article.date,
    })),
  ];
  return items
    .filter((item) => !Number.isNaN(Date.parse(item.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, limit);
}
