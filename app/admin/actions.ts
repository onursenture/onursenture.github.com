"use server";

import { revalidateTag, updateTag } from "next/cache";
import { type NewPageInput, createPage, deletePage, discardDraft, publishDoc, resetDoc, saveDraft } from "@/lib/admin/operations";
import type { ActionResult } from "@/lib/admin/results";
import { isAdmin } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { type DocKey, KEBAB, isDocKey, workKey } from "@/lib/content/keys";
import { CONTENT_TAG } from "@/lib/content/read";
import type { ContentStore } from "@/lib/content/store";
import { getDb } from "@/lib/db/client";
import { type MediaEntry, hasImageWith, toMediaEntry } from "@/lib/images/lookup";
import { processImage } from "@/lib/media/process";
import { getMediaStorage } from "@/lib/media/storage";
import { sources } from "@/lib/sources/registry";
import { sourceTag } from "@/lib/sources/tags";
import { DrizzleSnapshotStore } from "@/lib/sync/drizzle-store";
import { type SyncResult, syncAll } from "@/lib/sync/run";

// Server actions for the admin UI. Each checks the session first, then the
// store; a store error reads as "unavailable" so the editor can say so.

type Context = { store: ContentStore } | { error: ActionResult<never> };

async function context(): Promise<Context> {
  if (!(await isAdmin())) return { error: { status: "unauthorized" } };
  try {
    const store = getContentStore();
    return store ? { store } : { error: { status: "unavailable" } };
  } catch {
    return { error: { status: "unavailable" } };
  }
}

function badKey(key: string): ActionResult<never> {
  return { status: "invalid", issues: [{ doc: "work-index", at: "", message: `unknown document "${key}"` }] };
}

async function run<T extends object>(work: (store: ContentStore) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const ctx = await context();
  if ("error" in ctx) return ctx.error;
  try {
    return await work(ctx.store);
  } catch (e) {
    console.warn("[admin]", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  }
}

async function hasImageIn(store: ContentStore) {
  return hasImageWith((await store.listMedia()).map(toMediaEntry));
}

export async function saveDraftAction(key: string, draft: unknown, expected: string | null): Promise<ActionResult<{ draftUpdatedAt: string }>> {
  if (!isDocKey(key)) return badKey(key);
  return run((store) => saveDraft(store, key, draft, expected, new Date()));
}

export async function publishAction(key: string, expected: string | null): Promise<ActionResult<{ publishedAt: string }>> {
  if (!isDocKey(key)) return badKey(key);
  return run(async (store) => {
    const result = await publishDoc(store, key as DocKey, new Date(), await hasImageIn(store), expected);
    if (result.status === "ok") updateTag(CONTENT_TAG);
    return result;
  });
}

export async function discardDraftAction(key: string): Promise<ActionResult> {
  if (!isDocKey(key)) return badKey(key);
  return run((store) => discardDraft(store, key));
}

export async function resetDocAction(key: string): Promise<ActionResult> {
  if (!isDocKey(key)) return badKey(key);
  return run(async (store) => {
    const result = await resetDoc(store, key);
    if (result.status === "ok") updateTag(CONTENT_TAG);
    return result;
  });
}

export async function createPageAction(input: NewPageInput): Promise<ActionResult<{ slug: string }>> {
  return run((store) => createPage(store, input, new Date()));
}

export async function deletePageAction(slug: string): Promise<ActionResult> {
  return run(async (store) => {
    const result = await deletePage(store, slug, new Date(), await hasImageIn(store));
    if (result.status === "ok") updateTag(CONTENT_TAG);
    return result;
  });
}

// After the browser uploaded an original: check it, render the renditions,
// record them. The original is deleted either way; the draft then points the
// image at the returned key (the client does that).
export async function processUploadAction(input: { source: string; slug: string; imageId: string }): Promise<ActionResult<{ key: string; entry: MediaEntry }>> {
  const where = { doc: workKey(input.slug), at: `upload/${input.imageId}` };
  if (!KEBAB.test(input.slug) || !KEBAB.test(input.imageId)) return { status: "invalid", issues: [{ ...where, message: "the image needs a kebab-case id first" }] };
  return run<{ key: string; entry: MediaEntry }>(async (store) => {
    const storage = getMediaStorage();
    let bytes: Buffer;
    try {
      bytes = await storage.readSource(input.source);
    } catch {
      return { status: "invalid", issues: [{ ...where, message: "The upload could not be read. Try again." }] };
    }
    const result = await processImage(bytes, input, storage, new Date());
    await storage.deleteSource(input.source).catch(() => undefined);
    if (!result.ok) return { status: "invalid", issues: [{ ...where, message: result.reason }] };
    await store.putMedia(result.record);
    return { status: "ok", key: result.record.key, entry: toMediaEntry(result.record) };
  });
}

// "Sync now" on the admin home: every source, regardless of schedule, then the
// same stale-while-revalidate as the sync route.
export async function syncNowAction(): Promise<ActionResult<{ results: SyncResult[] }>> {
  if (!(await isAdmin())) return { status: "unauthorized" };
  try {
    const db = getDb();
    if (!db) return { status: "unavailable" };
    const results = await syncAll(Object.values(sources), new DrizzleSnapshotStore(db), { fetch: globalThis.fetch, env: process.env }, new Date(), {
      force: true,
    });
    for (const result of results) if (result.status === "ok") revalidateTag(sourceTag(result.source), "max");
    return { status: "ok", results };
  } catch (e) {
    console.warn("[admin] sync now failed:", e instanceof Error ? e.message : e);
    return { status: "unavailable" };
  }
}
