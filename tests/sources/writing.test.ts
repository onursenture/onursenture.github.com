import { describe, expect, it } from "vitest";
import { writing, parseWriting } from "@/lib/sources/writing";
import { fixture, fakeFetch } from "../helpers/fixtures";

describe("parseWriting", () => {
  it("parses Bear Blog Atom entries", async () => {
    expect(await parseWriting(fixture("writing.xml"))).toEqual([
      { title: "Second post", link: "https://w00f.org/second-post/", date: "2026-09-20T10:00:00.000Z" },
      { title: "First post", link: "https://w00f.org/first-post/", date: "2026-08-01T08:30:00.000Z" },
    ]);
  });
});

describe("writing.fetch", () => {
  it("treats a 404 feed as no posts yet (w00f.org has none)", async () => {
    const fetch = fakeFetch({});
    expect(await writing.fetch({ fetch, env: {} })).toEqual([]);
  });

  it("still throws on other failures", async () => {
    const fetch = fakeFetch({ "https://w00f.org/feed/": { status: 500, body: "oops" } });
    await expect(writing.fetch({ fetch, env: {} })).rejects.toThrow("returned 500");
  });

  it("drops entries whose link is not http(s)", async () => {
    const xml = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Bad</title><link href="javascript:alert(1)"/><updated>2026-09-20T10:00:00Z</updated></entry></feed>`;
    const fetch = fakeFetch({ "https://w00f.org/feed/": { body: xml } });
    expect(await writing.fetch({ fetch, env: {} })).toEqual([]);
  });
});
