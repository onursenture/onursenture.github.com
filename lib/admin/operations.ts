import { experience as repoExperience } from "@/content/experience";
import { ORGS, type OrgId } from "@/content/orgs";
import type { ProductPage } from "@/content/work/types";
import type { Issue } from "@/lib/content/issues";
import { type DocKey, KEBAB, slugOfKey, workKey } from "@/lib/content/keys";
import { schemaFor } from "@/lib/content/schemas";
import { indexSlugs, publishedValues, repoValue, resolveSite } from "@/lib/content/site";
import type { ContentStore } from "@/lib/content/store";
import { validateSite, zodIssues } from "@/lib/content/validate-site";
import type { OpResult } from "./results";

// The admin's writes (Sprint 7 spec §1.4), independent of Next so they can be
// tested against FileContentStore. app/admin/actions.ts wraps them with the
// session check, the store and cache invalidation.

const MAX_DRAFT_CHARS = 1_000_000;

function invalid(issues: Issue[]) {
  return { status: "invalid" as const, issues };
}

// Save draft. No content validation: a half-finished edit is never lost.
export async function saveDraft(
  store: ContentStore,
  key: DocKey,
  draft: unknown,
  expected: string | null,
  now: Date,
): Promise<OpResult<{ draftUpdatedAt: string }>> {
  if (JSON.stringify(draft ?? null).length > MAX_DRAFT_CHARS) return invalid([{ doc: key, at: "", message: "the draft is larger than 1 MB" }]);
  const result = await store.saveDraft(key, draft, expected ? new Date(expected) : null, now);
  return result.ok ? { status: "ok", draftUpdatedAt: result.draftUpdatedAt.toISOString() } : { status: "conflict" };
}

// Validates the would-be site (this draft over every published document over
// the repo) and only then makes the draft live. A page that isn't listed yet
// is appended to work-index in the same step.
export async function publishDoc(
  store: ContentStore,
  key: DocKey,
  now: Date,
  hasImage: (key: string) => boolean,
  // The draft time the caller last saw. When given and the stored draft is a
  // different one (another tab saved since), nothing is published.
  expected?: string | null,
): Promise<OpResult<{ publishedAt: string }>> {
  const docs = await store.listDocs();
  const doc = docs.find((item) => item.key === key);
  if (expected !== undefined && (doc?.draftUpdatedAt?.toISOString() ?? null) !== expected) return { status: "conflict" };
  if (doc?.draft == null) return invalid([{ doc: key, at: "", message: "there is no draft to publish" }]);
  const parsed = schemaFor(key).safeParse(doc.draft);
  if (!parsed.success) return invalid(zodIssues(key, parsed.error));

  const values = publishedValues(docs);
  values.set(key, parsed.data);
  const slug = slugOfKey(key);
  let index: string[] | null = null;
  if (slug !== null) {
    if ((parsed.data as ProductPage).slug !== slug) return invalid([{ doc: key, at: "slug", message: `the page's slug must stay "${slug}"` }]);
    const current = indexSlugs(values);
    if (!current.includes(slug)) {
      index = [...current, slug];
      values.set("work-index", { slugs: index });
    }
  }

  const issues = validateSite(resolveSite(values), hasImage);
  if (issues.length > 0) return invalid(issues);
  await store.publish(key, parsed.data, now);
  if (index) await store.publish("work-index", { slugs: index }, now);
  return { status: "ok", publishedAt: now.toISOString() };
}

export async function discardDraft(store: ContentStore, key: DocKey): Promise<OpResult> {
  await store.discardDraft(key);
  return { status: "ok" };
}

// Back to the repo version: the row goes. A page created in the admin has no
// repo version, so it is deleted instead (deletePage). Like a publish, it is
// refused when the site it leaves would be invalid (say the repo Experience
// links a page that was deleted since).
export async function resetDoc(store: ContentStore, key: DocKey, hasImage: (key: string) => boolean): Promise<OpResult> {
  if (slugOfKey(key) !== null && repoValue(key) === null) {
    return invalid([{ doc: key, at: "", message: "this page only exists in the admin; delete it instead" }]);
  }
  const values = publishedValues(await store.listDocs());
  values.delete(key);
  const issues = validateSite(resolveSite(values), hasImage);
  if (issues.length > 0) return invalid(issues);
  await store.deleteDoc(key);
  return { status: "ok" };
}

export interface NewPageInput {
  slug: string;
  org: OrgId;
  title: string;
  kind: string;
}

// The starting point of a new page: the header with Role and At from the org,
// an empty Years, and one empty What I did block.
export function newPage(input: NewPageInput): ProductPage {
  const title = input.title.trim();
  return {
    slug: input.slug,
    org: input.org,
    title,
    kind: input.kind.trim(),
    lead: { strong: `${title}.`, rest: "" },
    intro: "",
    facts: [
      { label: "Role", value: repoExperience.find((entry) => entry.org === input.org)?.role ?? "" },
      { label: "Years", value: "" },
      { label: "At", value: ORGS[input.org].name },
    ],
    blocks: [{ kind: "text", id: "what-i-did", heading: "What I did", body: [""] }],
  };
}

export async function createPage(store: ContentStore, input: NewPageInput, now: Date): Promise<OpResult<{ slug: string }>> {
  const key = workKey(input.slug);
  const issues: Issue[] = [];
  if (!Object.hasOwn(ORGS, input.org)) issues.push({ doc: key, at: "org", message: "pick an organisation" });
  if (!input.title.trim()) issues.push({ doc: key, at: "title", message: "a page needs a title" });
  if (!KEBAB.test(input.slug)) {
    issues.push({ doc: key, at: "slug", message: "use lowercase letters, digits and hyphens" });
  } else {
    const docs = await store.listDocs();
    const taken = new Set([
      ...indexSlugs(publishedValues(docs)),
      ...docs.map((doc) => slugOfKey(doc.key)).filter((slug): slug is string => slug !== null),
    ]);
    // "new" is the new-page form's route (/admin/work/new/).
    if (taken.has(input.slug) || input.slug === "new" || repoValue(key) !== null) issues.push({ doc: key, at: "slug", message: `"${input.slug}" is taken` });
  }
  if (issues.length > 0) return invalid(issues);
  const result = await store.saveDraft(key, newPage(input), null, now);
  return result.ok ? { status: "ok", slug: input.slug } : { status: "conflict" };
}

// Removes a page from the live site in one validated step: work-index loses the
// slug and the page's row goes. Blocked while Experience links the page.
export async function deletePage(
  store: ContentStore,
  slug: string,
  now: Date,
  hasImage: (key: string) => boolean,
): Promise<OpResult> {
  const key = workKey(slug);
  if (!KEBAB.test(slug)) return invalid([{ doc: key, at: "slug", message: `"${slug}" is not a page` }]);
  const docs = await store.listDocs();
  const values = publishedValues(docs);
  const current = indexSlugs(values);
  if (!current.includes(slug)) {
    await store.deleteDoc(key);
    return { status: "ok" };
  }
  const index = current.filter((item) => item !== slug);
  values.set("work-index", { slugs: index });
  values.delete(key);
  const issues = validateSite(resolveSite(values), hasImage);
  if (issues.length > 0) return invalid(issues);
  await store.publish("work-index", { slugs: index }, now);
  await store.deleteDoc(key);
  return { status: "ok" };
}
