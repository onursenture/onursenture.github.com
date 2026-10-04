import type { DocKey } from "@/lib/content/keys";
import { slugOfKey, workKey } from "@/lib/content/keys";
import { draftValues, indexSlugs, publishedValues, resolvePage } from "@/lib/content/site";
import type { ContentDoc } from "@/lib/content/store";

// The admin home's document list (spec §2.2): what exists and which documents
// have an unpublished draft.

export type DocState = "repo" | "published" | "draft" | "new";

export interface DocRow {
  key: DocKey;
  title: string;
  editHref: string;
  state: DocState;
  publishedAt: string | null;
}

function state(doc: ContentDoc | undefined): DocState {
  if (doc?.draft != null) return "draft";
  return doc?.published != null ? "published" : "repo";
}

export function docRows(docs: ContentDoc[]): { pages: DocRow[]; home: DocRow[] } {
  const byKey = new Map(docs.map((doc) => [doc.key as string, doc]));
  const live = indexSlugs(publishedValues(docs));
  const drafts = draftValues(docs);
  const row = (key: DocKey, title: string, editHref: string, override?: DocState): DocRow => {
    const doc = byKey.get(key);
    return { key, title, editHref, state: override ?? state(doc), publishedAt: doc?.publishedAt?.toISOString() ?? null };
  };

  const pages = live.map((slug) => row(workKey(slug), resolvePage(drafts, slug, { loose: true })?.title || slug, `/admin/work/${slug}/`));
  for (const doc of docs) {
    const slug = slugOfKey(doc.key);
    if (slug === null || live.includes(slug)) continue;
    pages.push(row(doc.key, resolvePage(drafts, slug, { loose: true })?.title || slug, `/admin/work/${slug}/`, "new"));
  }

  const home = [row("profile", "Bio", "/admin/bio/"), row("lab", "Lab", "/admin/lab/"), row("experience", "Experience", "/admin/experience/")];
  return { pages, home };
}
