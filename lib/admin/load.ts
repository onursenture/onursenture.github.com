import "server-only";
import type { ProductPage } from "@/content/work/types";
import { getContentStore } from "@/lib/content/get-store";
import type { DocKey } from "@/lib/content/keys";
import { indexSlugs, publishedValues, repoValue } from "@/lib/content/site";
import type { ContentDoc } from "@/lib/content/store";
import { lookupWith, type MediaEntry, toMediaEntry } from "@/lib/images/lookup";
import type { ImageEntry } from "@/lib/images/plan";
import { imageKey, pageImages } from "@/lib/work/derive";
import type { DocEditorInit } from "./results";

export interface LoadedDoc<T> extends DocEditorInit<T> {
  // The live value (published, else repo): ids in it are locked.
  baseline: T | null;
}

export async function loadDoc<T>(key: DocKey): Promise<LoadedDoc<T>> {
  let doc: ContentDoc | null = null;
  let available = true;
  try {
    const store = getContentStore();
    if (store) doc = await store.getDoc(key);
    else available = false;
  } catch (e) {
    console.warn("[admin] loading", key, "failed:", e instanceof Error ? e.message : e);
    available = false;
  }
  const baseline = (doc?.published ?? repoValue(key)) as T | null;
  return {
    docKey: key,
    value: (doc?.draft ?? baseline) as T,
    baseline,
    draftUpdatedAt: doc?.draftUpdatedAt?.toISOString() ?? null,
    hasDraft: doc?.draft != null,
    publishedAt: doc?.publishedAt?.toISOString() ?? null,
    available,
  };
}

// The image entries an editor needs for thumbnails (manifest + uploads), and
// whether the page is live (listed in the published work-index).
export async function loadPageContext(page: ProductPage): Promise<{ entries: Record<string, ImageEntry>; live: boolean }> {
  let media: MediaEntry[] = [];
  let live = indexSlugs(new Map()).includes(page.slug);
  try {
    const store = getContentStore();
    if (store) {
      const [docs, records] = await Promise.all([store.listDocs(), store.listMedia()]);
      media = records.map(toMediaEntry);
      live = indexSlugs(publishedValues(docs)).includes(page.slug);
    }
  } catch (e) {
    console.warn("[admin] loading page context failed:", e instanceof Error ? e.message : e);
  }
  const lookup = lookupWith(media);
  const entries: Record<string, ImageEntry> = {};
  for (const image of pageImages(page)) {
    const key = image.image ?? imageKey(page.slug, image.id);
    const entry = lookup(key);
    if (entry) entries[key] = entry;
  }
  return { entries, live };
}
