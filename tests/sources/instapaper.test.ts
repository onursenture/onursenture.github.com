import { describe, expect, it } from "vitest";
import { instapaper, parseInstapaper } from "@/lib/sources/instapaper";
import { fakeFetch, fixture } from "../helpers/fixtures";

describe("parseInstapaper", () => {
  const articles = parseInstapaper(JSON.parse(fixture("instapaper.json")));

  it("drops bookmarks without a title", () => {
    expect(articles).toHaveLength(2);
  });

  it("maps card fields", () => {
    expect(articles[1]).toEqual({
      title: "Leaving Mozilla",
      link: "https://blog.unitedheroes.net/5751",
      domain: "blog.unitedheroes.net",
      date: "2026-06-20T16:41:25.000Z",
      description: expect.stringMatching(/^After more than 15 years/),
      words: 4297,
      minutes: 18,
      image: "https://blog.unitedheroes.net/JRS_128x128.jpg",
    });
    expect(articles[0].image).toBeNull();
  });

  it("rejects a response without a bookmarks array", () => {
    expect(() => parseInstapaper({ error: "nope" })).toThrow();
  });
});

const bookmark = (n: number, extra: Record<string, unknown> = {}) => ({
  url: `https://site${n}.test/a`,
  title: `Article ${n}`,
  site_name: `site${n}.test`,
  words: 100,
  time: 1784190218,
  estimated_total_time: 3,
  ...extra,
});

describe("parseInstapaper resilience", () => {
  it("skips a bookmark with a bad field instead of failing the page", () => {
    const articles = parseInstapaper({ bookmarks: [bookmark(1), bookmark(2, { words: "lots" }), bookmark(3)] });
    expect(articles.map((a) => a.title)).toEqual(["Article 1", "Article 3"]);
  });

  it("drops non-http links and images", () => {
    const [a] = parseInstapaper({ bookmarks: [bookmark(1, { og_image: "data:image/png;base64,AA" })] });
    expect(a.image).toBeNull();
    expect(parseInstapaper({ bookmarks: [bookmark(2, { url: "javascript:x" })] })).toEqual([]);
  });
});

describe("instapaper.fetch", () => {
  it("follows has_next across pages", async () => {
    const page = (n: number) => `https://www.instapaper.com/data/profile/w00f?page=${n}`;
    const fetch = fakeFetch({
      [page(1)]: { body: JSON.stringify({ bookmarks: [bookmark(1), bookmark(2)], has_next: true }) },
      [page(2)]: { body: JSON.stringify({ bookmarks: [bookmark(3)], has_next: false }) },
    });
    const articles = await instapaper.fetch({ fetch, env: {} });
    expect(articles.map((a) => a.title)).toEqual(["Article 1", "Article 2", "Article 3"]);
  });
});
