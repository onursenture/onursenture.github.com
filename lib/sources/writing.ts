import Parser from "rss-parser";
import { z } from "zod";
import { fetchText, toIso } from "./http";
import type { SourceDefinition } from "./types";

// Bear Blog Atom feed for w00f.org.
const FEED_URL = "https://w00f.org/feed/";
const LIMIT = 10;

export const postSchema = z.object({
  title: z.string(),
  link: z.string(),
  date: z.string(),
});
export const postsSchema = z.array(postSchema);
export type Post = z.infer<typeof postSchema>;

export async function parseWriting(xml: string): Promise<Post[]> {
  const feed = await new Parser().parseString(xml);
  return feed.items.slice(0, LIMIT).map((item) => ({
    title: (item.title ?? "").trim(),
    link: item.link || item.id || "",
    date: toIso(item.isoDate ?? item.pubDate),
  }));
}

export const writing: SourceDefinition<Post[]> = {
  id: "writing",
  intervalMinutes: 180,
  empty: [],
  schema: postsSchema,
  fetch: async ({ fetch }) => parseWriting(await fetchText(fetch, FEED_URL)),
  count: (posts) => posts.length,
};
