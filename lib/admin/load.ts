import "server-only";
import { getContentStore } from "@/lib/content/get-store";
import type { DocKey } from "@/lib/content/keys";
import { repoValue } from "@/lib/content/site";
import type { ContentDoc } from "@/lib/content/store";
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
