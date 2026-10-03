import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { books } from "@/components/sections/books";
import { films } from "@/components/sections/films";
import type { Book } from "@/lib/sources/goodreads";
import type { Film } from "@/lib/sources/letterboxd";

const film: Film = {
  title: "Pickled",
  year: 2010,
  link: "https://letterboxd.com/film/pickled/",
  poster: "",
  ratingValue: 3.5,
  watchedDate: "2026-01-01",
  date: "2026-01-01T00:00:00.000Z",
};
const book: Book = {
  title: "Bozkır",
  author: "Author Name",
  link: "https://goodreads.com/book/show/1",
  cover: "",
  numRating: 3,
  review: "",
  date: "2026-01-01T00:00:00.000Z",
};

describe("Life sections render no ratings", () => {
  it("films show the year only", () => {
    const Render = films.Render;
    const html = renderToStaticMarkup(<Render data={[film]} />);
    expect(html).toContain("2010");
    expect(html).not.toContain("3.5");
  });

  it("books show title and author, with no rating column", () => {
    const Render = books.Render;
    const html = renderToStaticMarkup(<Render data={{ currentlyReading: [], read: [{ ...book, numRating: 4.5 }] }} />);
    expect(html).toContain("Bozkır");
    expect(html).toContain("Author Name");
    expect(html).not.toContain("4.5");
    expect(html).not.toContain("col-span-2");
  });
});
