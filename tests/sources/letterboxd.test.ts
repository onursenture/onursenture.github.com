import { describe, expect, it } from "vitest";
import { letterboxd, parseLetterboxd } from "@/lib/sources/letterboxd";
import { fakeFetch, fixture } from "../helpers/fixtures";

describe("parseLetterboxd", () => {
  it("maps diary entries using the structured letterboxd fields", async () => {
    const films = await parseLetterboxd(fixture("letterboxd.xml"));
    expect(films).toHaveLength(3);
    expect(films[0]).toEqual({
      title: "Love & Other Drugs",
      year: 2010,
      link: "https://letterboxd.com/onur/film/love-other-drugs/",
      poster:
        "https://a.ltrbxd.com/resized/film-poster/2/1/8/0/1/21801-love-other-drugs-0-600-0-900-crop.jpg?v=08511b998f",
      rating: "★★★½",
      ratingValue: 3.5,
      watchedDate: "2026-09-26",
      date: "2026-09-26T14:18:59.000Z",
    });
  });

  it("leaves rating empty for unrated watches", async () => {
    const films = await parseLetterboxd(fixture("letterboxd.xml"));
    expect(films[2]).toMatchObject({ title: "Pickled", rating: "", ratingValue: null });
  });

  it("validates against its own schema", async () => {
    const films = await parseLetterboxd(fixture("letterboxd.xml"));
    expect(letterboxd.schema.parse(films)).toEqual(films);
  });
});

describe("letterboxd.fetch", () => {
  it("throws when upstream is not 2xx", async () => {
    const fetch = fakeFetch({
      "https://letterboxd.com/onur/rss/": { status: 503, body: "down" },
    });
    await expect(letterboxd.fetch({ fetch, env: {} })).rejects.toThrow("503");
  });
});
