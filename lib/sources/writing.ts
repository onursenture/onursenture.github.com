import Parser from "rss-parser";
import { z } from "zod";
import { HttpError, fetchText, httpUrl, toIso } from "./http";
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
  return feed.items
    .slice(0, LIMIT)
    .map((item) => ({
      title: (item.title ?? "").trim(),
      link: httpUrl(item.link || item.id),
      date: toIso(item.isoDate ?? item.pubDate),
    }))
    .filter((post) => post.link);
}

// w00f.org has no posts yet, and Bear Blog answers 404 for an empty blog's
// feed. That is "no posts", not an error: the Life section hides until the
// first post. Any other failure still throws (the snapshot is kept).
async function fetchWriting(fetchImpl: typeof globalThis.fetch): Promise<Post[]> {
  try {
    return await parseWriting(await fetchText(fetchImpl, FEED_URL));
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return [];
    throw e;
  }
}

export const writing: SourceDefinition<Post[], "writing"> = {
  id: "writing",
  intervalMinutes: 180,
  empty: [],
  schema: postsSchema,
  fetch: ({ fetch }) => fetchWriting(fetch),
  count: (posts) => posts.length,
};
