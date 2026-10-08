import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { PHOTO_GRID_COMPACT_SIZES, PhotoGrid } from "@/components/photos/photo-grid";
import { books } from "@/components/sections/books";
import { films } from "@/components/sections/films";
import { COVER_GRID } from "@/components/ui/cover";
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
  rewatch: false,
};
const book: Book = {
  title: "Bozkır",
  author: "Author Name",
  link: "https://goodreads.com/book/show/1",
  cover: "",
  numRating: 3,
  review: "",
  date: "2026-01-01T00:00:00.000Z",
  readAt: "2026-01-01T00:00:00.000Z",
  addedAt: "2025-12-01T00:00:00.000Z",
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

describe("Life covers and photos are compact", () => {
  it("shares one dense grid: 4 columns on mobile, 10 from md", () => {
    expect(COVER_GRID).toBe("grid grid-cols-4 gap-x-3 gap-y-4 md:grid-cols-10 md:gap-x-4");
  });

  it("films load the first four posters eagerly, at the archive's poster size", () => {
    const Render = films.Render;
    const poster = "https://a.ltrbxd.com/resized/film-poster/2/1/8/0/1/21801-x-0-600-0-900-crop.jpg?v=1";
    const data = [1, 2, 3, 4, 5, 6].map((n) => ({ ...film, link: `https://letterboxd.com/onur/film/f${n}/`, poster }));
    const html = renderToStaticMarkup(<Render data={data} />);
    expect(html.match(/loading="eager"/g)).toHaveLength(4);
    expect(html.match(/loading="lazy"/g)).toHaveLength(2);
    expect(html).toContain("-0-230-0-345-crop");
    expect(html).not.toContain("-0-600-0-900-crop");
  });

  it("films use the cover grid and one truncated caption line each", () => {
    const Render = films.Render;
    const html = renderToStaticMarkup(<Render data={[{ ...film, poster: "https://example.com/p.jpg" }]} />);
    expect(html).toContain("md:grid-cols-10");
    expect(html).toContain('width="96"');
    expect(html.match(/<span class="type-label[^"]*truncate/g)).toHaveLength(2);
    expect(html).not.toContain("type-body");
  });

  it("books Reading lists every book being read in the cover grid", () => {
    const Render = books.Render;
    const reading = [1, 2, 3, 4, 5].map((n) => ({ ...book, title: `Reading ${n}`, link: `https://goodreads.com/book/show/${n}` }));
    const html = renderToStaticMarkup(<Render data={{ currentlyReading: reading, read: [] }} />);
    for (const b of reading) expect(html).toContain(b.title);
    expect(html.match(/<li>/g)).toHaveLength(5);
    expect(html).toContain("md:grid-cols-10");
    expect(html.match(/<span class="type-label[^"]*truncate/g)).toHaveLength(10);
  });

  it("the compact photo grid is 4 / 10 columns with a truncated title", () => {
    const photos = [{ slug: "bold-vakif-building", title: "Bold Vakif Building", image: { key: "photos/bold-vakif-building", width: 2560, height: 1440, widths: [640, 1280, 2560] } }];
    const html = renderToStaticMarkup(<PhotoGrid photos={photos} density="compact" sizes={PHOTO_GRID_COMPACT_SIZES} />);
    expect(html).toContain("grid grid-cols-4 gap-x-3 gap-y-4 md:grid-cols-10 md:gap-x-4");
    expect(html).toMatch(/<span class="type-label[^"]*truncate/);
    expect(html).toContain("308px - 9 * 16px) / 10");
  });

  it("the default photo grid keeps its density", () => {
    const photos = [{ slug: "bold-vakif-building", title: "Bold Vakif Building", image: { key: "photos/bold-vakif-building", width: 2560, height: 1440, widths: [640, 1280, 2560] } }];
    const html = renderToStaticMarkup(<PhotoGrid photos={photos} />);
    expect(html).toContain("grid-cols-2");
    expect(html).toContain("md:grid-cols-3");
    expect(html).not.toContain("md:grid-cols-10");
  });
});
