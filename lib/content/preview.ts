import "server-only";
import { type MediaEntry, lookupWith, toMediaEntry } from "@/lib/images/lookup";
import { buildProductPage, type ProductPageView } from "@/lib/work/derive";
import { type HomeContent, homeContent } from "@/lib/work/views";
import { type DocValues, draftValues, resolvePage, resolveSite } from "./site";
import type { ContentStore } from "./store";

// What the admin preview renders: every document's draft over its published
// value over the repo. Uncached; only signed-in requests reach it.

async function drafts(store: ContentStore | null): Promise<{ values: DocValues; media: MediaEntry[] }> {
  if (!store) return { values: new Map(), media: [] };
  const [docs, media] = await Promise.all([store.listDocs(), store.listMedia()]);
  return { values: draftValues(docs), media: media.map(toMediaEntry) };
}

// One page's draft, also when it isn't listed yet (a new page).
export async function draftPageView(store: ContentStore | null, slug: string): Promise<ProductPageView | null> {
  const { values, media } = await drafts(store);
  const page = resolvePage(values, slug, { loose: true });
  return page ? buildProductPage(page, lookupWith(media)) : null;
}

export async function draftHomeContent(store: ContentStore | null): Promise<HomeContent> {
  const { values, media } = await drafts(store);
  return homeContent(resolveSite(values, { loose: true }), lookupWith(media));
}
