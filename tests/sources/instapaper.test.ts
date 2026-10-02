import { describe, expect, it } from "vitest";
import { parseInstapaper } from "@/lib/sources/instapaper";
import { fixture } from "../helpers/fixtures";

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
