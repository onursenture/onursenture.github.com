import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { type MediaEntry, toMediaEntry } from "@/lib/images/lookup";
import { getContentStore } from "./get-store";
import { type SiteContent, publishedValues, repoSite, resolveSite } from "./site";

// The one cache tag for admin-edited content: publish actions call
// updateTag(CONTENT_TAG) so the next request renders the new value.
export const CONTENT_TAG = "content";

export interface PublishedContent {
  site: SiteContent;
  media: MediaEntry[];
  // The repo content stands in because the store couldn't be read (none, or
  // an error). A "use cache" scope that sets its own cacheLife over this read
  // (the resume PDF) follows it, since an explicit outer cacheLife wins.
  fallback: boolean;
}

// The live site: published documents over the repo content, plus uploaded
// media. Cached and tagged, so public pages stay prerendered. Never throws:
// no store or a store error renders the repo content (a database error is
// cached for minutes only, since it is probably transient).
export async function getPublishedContent(): Promise<PublishedContent> {
  "use cache";
  cacheTag(CONTENT_TAG);

  let store;
  try {
    store = getContentStore();
  } catch (e) {
    console.warn("[content] no store:", e instanceof Error ? e.message : e);
    store = null;
  }
  if (!store) {
    cacheLife("days");
    return { site: repoSite(), media: [], fallback: true };
  }
  try {
    const [docs, media] = await Promise.all([store.listDocs(), store.listMedia()]);
    cacheLife("days");
    return { site: resolveSite(publishedValues(docs)), media: media.map(toMediaEntry), fallback: false };
  } catch (e) {
    console.warn("[content] reading published content failed:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return { site: repoSite(), media: [], fallback: true };
  }
}
