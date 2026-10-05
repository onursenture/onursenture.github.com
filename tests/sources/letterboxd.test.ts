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
      ratingValue: 3.5,
      watchedDate: "2026-09-26",
      date: "2026-09-26T14:18:59.000Z",
      rewatch: false,
    });
  });

  it("leaves the rating null for unrated watches", async () => {
    const films = await parseLetterboxd(fixture("letterboxd.xml"));
    expect(films[2]).toMatchObject({ title: "Pickled", ratingValue: null });
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

describe("parseLetterboxd rewatch and limit", () => {
  const entry = (n: number, rewatch: "Yes" | "No") => `
    <item>
      <title>Film ${n}, 2020</title>
      <link>https://letterboxd.com/onur/film/film-${n}/</link>
      <pubDate>Sat, 26 Sep 2026 10:00:00 +1200</pubDate>
      <letterboxd:watchedDate>2026-09-${String(n).padStart(2, "0")}</letterboxd:watchedDate>
      <letterboxd:rewatch>${rewatch}</letterboxd:rewatch>
      <letterboxd:filmTitle>Film ${n}</letterboxd:filmTitle>
      <letterboxd:filmYear>2020</letterboxd:filmYear>
      <description><![CDATA[<p><img src="https://a.ltrbxd.com/p-${n}-0-600-0-900-crop.jpg"/></p>]]></description>
    </item>`;
  const feed = (items: string) =>
    `<?xml version="1.0"?><rss version="2.0" xmlns:letterboxd="https://letterboxd.com"><channel><title>x</title>${items}</channel></rss>`;

  it("keeps every feed item and reads the rewatch flag", async () => {
    const items = Array.from({ length: 12 }, (_, i) => entry(i + 1, i === 0 ? "Yes" : "No")).join("");
    const films = await parseLetterboxd(feed(items));
    expect(films).toHaveLength(12);
    expect(films[0].rewatch).toBe(true);
    expect(films[1].rewatch).toBe(false);
  });
});
