import { describe, expect, it } from "vitest";
import { ACTIVITY_LIMIT, buildActivity } from "@/lib/activity";
import type { Book } from "@/lib/sources/goodreads";
import type { Article } from "@/lib/sources/instapaper";
import type { Film } from "@/lib/sources/letterboxd";

const film = (title: string, date: string): Film => ({
  title,
  year: null,
  link: `https://letterboxd.com/${title}`,
  poster: "",
  ratingValue: null,
  watchedDate: "",
  date,
});
const book = (title: string, date: string): Book => ({
  title,
  author: "",
  cover: "",
  numRating: 0,
  review: "",
  link: `https://goodreads.com/${title}`,
  date,
});
const article = (title: string, date: string): Article => ({
  title,
  link: `https://example.com/${title}`,
  domain: "example.com",
  date,
  description: "",
  words: 0,
  minutes: null,
  image: null,
});

describe("buildActivity", () => {
  it("merges the three sources newest first with a verb each", () => {
    const items = buildActivity({
      films: [film("f1", "2026-09-26T10:00:00.000Z")],
      books: [book("b1", "2026-09-27T00:00:00.000Z")],
      articles: [article("a1", "2026-09-25T08:00:00.000Z")],
    });
    expect(items.map((i) => `${i.verb} ${i.title}`)).toEqual(["Finished b1", "Watched f1", "Saved a1"]);
    expect(items[0].href).toBe("https://goodreads.com/b1");
  });

  it("keeps only the newest eight", () => {
    const films = Array.from({ length: 6 }, (_, i) => film(`f${i}`, `2026-09-${10 + i}T00:00:00.000Z`));
    const articles = Array.from({ length: 6 }, (_, i) => article(`a${i}`, `2026-08-${10 + i}T00:00:00.000Z`));
    const items = buildActivity({ films, books: [], articles });
    expect(items).toHaveLength(ACTIVITY_LIMIT);
    expect(items[0].title).toBe("f5");
    expect(items.at(-1)!.title).toBe("a4");
  });

  it("drops items without a usable date", () => {
    const items = buildActivity({ films: [film("f", "")], books: [book("b", "nope")], articles: [] });
    expect(items).toEqual([]);
  });
});
