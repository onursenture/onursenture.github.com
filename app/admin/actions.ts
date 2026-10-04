"use server";

import { revalidateTag, updateTag } from "next/cache";
import { type NewPageInput, createPage, deletePage, discardDraft, publishDoc, resetDoc, saveDraft } from "@/lib/admin/operations";
import type { ActionResult } from "@/lib/admin/results";
import { isAdmin } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { type DocKey, isDocKey } from "@/lib/content/keys";
import { CONTENT_TAG } from "@/lib/content/read";
import type { ContentStore } from "@/lib/content/store";
import { getDb } from "@/lib/db/client";
import { hasImageWith, toMediaEntry } from "@/lib/images/lookup";
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

export async function publishAction(key: string): Promise<ActionResult<{ publishedAt: string }>> {
  if (!isDocKey(key)) return badKey(key);
  return run(async (store) => {
    const result = await publishDoc(store, key as DocKey, new Date(), await hasImageIn(store));
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
