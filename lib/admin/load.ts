import "server-only";
import { formatSpan } from "@/content/experience";
import { ORGS } from "@/content/orgs";
import type { PinRef } from "@/content/pins";
import type { Resume } from "@/content/resume";
import type { ProductPage } from "@/content/work/types";
import { getContentStore } from "@/lib/content/get-store";
import type { DocKey } from "@/lib/content/keys";
import { draftValues, indexSlugs, publishedValues, repoValue, resolveSite } from "@/lib/content/site";
import type { ContentDoc } from "@/lib/content/store";
import { lookupWith, type MediaEntry, toMediaEntry } from "@/lib/images/lookup";
import type { ImageEntry } from "@/lib/images/plan";
import { buildPins, imageKey, pageImages } from "@/lib/work/derive";
import { pinItems, type PinItem } from "./pin-items";
import type { DocEditorInit } from "./results";
import { alignRoles, type ResumeEditorData } from "./resume";

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

// The live product pages, for Experience rows that link one.
export async function loadPageOptions(): Promise<{ href: string; title: string }[]> {
  let values = new Map<string, unknown>();
  try {
    const store = getContentStore();
    if (store) values = publishedValues(await store.listDocs());
  } catch (e) {
    console.warn("[admin] loading pages failed:", e instanceof Error ? e.message : e);
  }
  return resolveSite(values).pages.map((page) => ({ href: `/work/${page.slug}/`, title: page.title }));
}

// The pins order as it would publish: the stored order (draft, else
// published, else the repo's), with pinned images it misses appended. Drafted
// pages count, so a newly pinned image is in the list before its page is live.
export async function loadPinsEditor(): Promise<{ init: DocEditorInit<{ order: PinRef[] }>; items: PinItem[] }> {
  const loaded = await loadDoc<{ order: PinRef[] }>("pins");
  let values = new Map<string, unknown>();
  let media: MediaEntry[] = [];
  try {
    const store = getContentStore();
    if (store) {
      const [docs, records] = await Promise.all([store.listDocs(), store.listMedia()]);
      values = draftValues(docs);
      media = records.map(toMediaEntry);
    }
  } catch (e) {
    console.warn("[admin] loading pins failed:", e instanceof Error ? e.message : e);
  }
  const site = resolveSite(values, { loose: true });
  const items = pinItems(buildPins(site.pages, loaded.value.order, lookupWith(media)));
  const init: DocEditorInit<{ order: PinRef[] }> = {
    docKey: loaded.docKey,
    value: { order: items.map(({ slug, imageId }) => ({ slug, imageId })) },
    draftUpdatedAt: loaded.draftUpdatedAt,
    hasDraft: loaded.hasDraft,
    publishedAt: loaded.publishedAt,
    available: loaded.available,
  };
  return { init, items };
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// The resume editor: the document (roles aligned to the live Experience), the
// Experience orgs for the Roles cards, and the "Add from…" options.
export async function loadResumeEditor(): Promise<ResumeEditorData> {
  const loaded = await loadDoc<Resume>("resume");
  let values = new Map<string, unknown>();
  try {
    const store = getContentStore();
    if (store) values = publishedValues(await store.listDocs());
  } catch (e) {
    console.warn("[admin] loading the resume context failed:", e instanceof Error ? e.message : e);
  }
  const site = resolveSite(values);
  return {
    init: {
      docKey: loaded.docKey,
      value: { ...loaded.value, roles: alignRoles(loaded.value.roles, site.experience) },
      draftUpdatedAt: loaded.draftUpdatedAt,
      hasDraft: loaded.hasDraft,
      publishedAt: loaded.publishedAt,
      available: loaded.available,
    },
    roles: site.experience.map((entry) => ({
      org: entry.org,
      name: ORGS[entry.org].name,
      role: entry.role,
      span: MONTH.test(entry.start) && (entry.end === null || MONTH.test(entry.end)) ? formatSpan(entry.start, entry.end) : "",
    })),
    sources: [
      ...site.pages.map((page) => ({ kind: "Page" as const, title: page.title, href: `/work/${page.slug}/` })),
      ...site.lab.flatMap((entry) => (entry.href ? [{ kind: "Lab" as const, title: entry.title, href: entry.href }] : [])),
    ],
  };
}
