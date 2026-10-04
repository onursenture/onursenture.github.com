import { describe, expect, it } from "vitest";
import { FEED_LIMIT, buildFeed, escapeXml, noteHtml } from "@/lib/feed/rss";
import type { PublishedNote } from "@/lib/notes/types";

const SITE = "https://onursenture.com";

function note(patch: Partial<PublishedNote> = {}): PublishedNote {
  return {
    id: "a",
    tid: "3m2k7xq4ab2c2",
    text: "Fish & chips <3 at onursenture.com/resume/ with @w00f.org #tag",
    side: "work",
    lang: "en",
    embed: null,
    status: "published",
    publishAt: null,
    publishedAt: "2026-10-04T11:00:00.000Z",
    createdAt: "2026-10-04T11:00:00.000Z",
    updatedAt: "2026-10-04T11:00:00.000Z",
    ...patch,
  };
}

const photo = {
  photo: { slug: "stabilo", title: "Stabilo & co", date: "2026-02-10", image: "photos/stabilo" },
  entry: { width: 2560, height: 1707, widths: [640, 1280, 2560] },
};

describe("escapeXml", () => {
  it("escapes the five XML characters", () => {
    expect(escapeXml(`<a href="x">Tom & Jerry's</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;");
  });
});

describe("noteHtml", () => {
  it("links URLs and handles, escapes text and keeps tags as text", () => {
    expect(noteHtml(note(), SITE)).toBe(
      '<p>Fish &amp; chips &lt;3 at <a href="https://onursenture.com/resume/">onursenture.com/resume/</a> with <a href="https://bsky.app/profile/w00f.org">@w00f.org</a> #tag</p>',
    );
  });

  it("adds absolute 1280px JPEGs with alt text, and link cards", () => {
    const withImages = note({ text: "", embed: { kind: "images", images: [{ key: "media/notes/abc", alt: "A \"cat\"", width: 2560, height: 1600, widths: [640, 1280, 2560], baseUrl: "https://b.public.blob.vercel-storage.com/media/notes/abc" }] } });
    expect(noteHtml(withImages, SITE)).toBe('<p><img src="https://b.public.blob.vercel-storage.com/media/notes/abc-1280.jpg" alt="A &quot;cat&quot;"></p>');
    const local = note({ text: "", embed: { kind: "images", images: [{ key: "photos/x", alt: "x", width: 900, height: 600, widths: [640, 900] }] } });
    expect(noteHtml(local, SITE)).toBe('<p><img src="https://onursenture.com/images/photos/x-900.jpg" alt="x"></p>');
    const card = note({ text: "Read", embed: { kind: "link", url: "https://w00f.org/a", title: "", description: "", siteName: "" } });
    expect(noteHtml(card, SITE)).toBe('<p>Read</p><p><a href="https://w00f.org/a">https://w00f.org/a</a></p>');
  });
});

describe("buildFeed", () => {
  it("is RSS 2.0 with notes and photos newest first; notes have no title", () => {
    const xml = buildFeed({ siteUrl: SITE, title: "Onur Senture", notes: [note()], photos: [photo] });
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">')).toBe(true);
    expect(xml).toContain('<atom:link href="https://onursenture.com/feed.xml" rel="self" type="application/rss+xml"/>');
    expect(xml).toContain("<lastBuildDate>Sun, 04 Oct 2026 11:00:00 GMT</lastBuildDate>");
    const items = xml.split("<item>").slice(1);
    expect(items).toHaveLength(2);
    expect(items[0]).not.toContain("<title>");
    expect(items[0]).toContain("<link>https://onursenture.com/notes/3m2k7xq4ab2c2/</link>");
    expect(items[0]).toContain('<guid isPermaLink="false">tag:onursenture.com,2026:note/3m2k7xq4ab2c2</guid>');
    expect(items[0]).toContain("<pubDate>Sun, 04 Oct 2026 11:00:00 GMT</pubDate>");
    expect(items[0]).toContain("<description>&lt;p&gt;Fish &amp;amp; chips");
    expect(items[1]).toContain("<title>Stabilo &amp; co</title>");
    expect(items[1]).toContain("<link>https://onursenture.com/life/photos/stabilo/</link>");
    expect(items[1]).toContain('<guid isPermaLink="true">https://onursenture.com/life/photos/stabilo/</guid>');
    expect(items[1]).toContain("https://onursenture.com/images/photos/stabilo-1280.jpg");
  });

  it("keeps a note's guid when its side changes", () => {
    const guid = (side: PublishedNote["side"]) => buildFeed({ siteUrl: SITE, title: "T", notes: [note({ side })], photos: [] }).match(/<guid[^>]*>[^<]*<\/guid>/)?.[0];
    expect(guid("life")).toBe(guid("both"));
    expect(guid("life")).toBe('<guid isPermaLink="false">tag:onursenture.com,2026:note/3m2k7xq4ab2c2</guid>');
  });

  it("drops characters XML 1.0 forbids", () => {
    const xml = buildFeed({ siteUrl: SITE, title: "T", notes: [note({ text: "Ding\u0007 dong\u000B\uFFFE ok\tfine\nnext" })], photos: [] });
    expect(xml).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/);
    expect(xml).toContain("Ding dong ok");
  });

  it("links a Life note to its Life page and keeps the newest 50 items", () => {
    const life = note({ side: "life" });
    expect(buildFeed({ siteUrl: SITE, title: "T", notes: [life], photos: [] })).toContain("<link>https://onursenture.com/life/notes/3m2k7xq4ab2c2/</link>");
    const many = Array.from({ length: 60 }, (_, i) => note({ id: String(i), tid: `3m2k7xq4ab${String(i).padStart(3, "2")}`, publishedAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString() }));
    const xml = buildFeed({ siteUrl: SITE, title: "T", notes: many, photos: [] });
    expect(xml.split("<item>").length - 1).toBe(FEED_LIMIT);
  });

  it("has no lastBuildDate when there are no items", () => {
    expect(buildFeed({ siteUrl: SITE, title: "T", notes: [], photos: [] })).not.toContain("lastBuildDate");
  });
});
