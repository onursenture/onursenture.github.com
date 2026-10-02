import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "../db/client";
import { DrizzleSnapshotStore } from "../sync/drizzle-store";
import type { Snapshot } from "../sync/store";
import { type SourceData, getSource } from "./registry";
import { type SourceView, toSourceView } from "./snapshot-view";
import { sourceTag } from "./tags";
import type { SourceId } from "./types";

// Page-side read of a source snapshot. Cached and tagged so pages are
// prerendered and only regenerate when the sync route revalidates the tag
// (or after an hour as a safety net). Never throws: no database, no row, or
// a database error all render the empty shape.
//
// The cache lifetime depends on the outcome (Next allows one cacheLife call
// per invocation): a missing database is a stable condition and a read
// snapshot is good for an hour, but a database error is probably transient,
// so its empty result must not stick for an hour.
export async function readSource<K extends SourceId>(id: K): Promise<SourceView<SourceData<K>>> {
  "use cache";
  cacheTag(sourceTag(id));

  const definition = getSource(id);

  const db = getDb();
  if (!db) {
    cacheLife("hours");
    return toSourceView(definition, null);
  }

  let snapshot: Snapshot | null;
  try {
    snapshot = await new DrizzleSnapshotStore(db).get(id);
  } catch (e) {
    console.warn(`[sources] reading ${id} failed:`, e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return toSourceView(definition, null);
  }
  cacheLife("hours");
  return toSourceView(definition, snapshot);
}
