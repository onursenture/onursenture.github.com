import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "../db/client";
import { DrizzleSnapshotStore } from "../sync/drizzle-store";
import { type SourceData, getSource } from "./registry";
import { type SourceView, toSourceView } from "./snapshot-view";
import { sourceTag } from "./tags";
import type { SourceId } from "./types";

// Page-side read of a source snapshot. Cached and tagged so pages are
// prerendered and only regenerate when the sync route revalidates the tag
// (or after an hour as a safety net). Never throws: no database, no row, or
// a database error all render the empty shape.
export async function readSource<K extends SourceId>(id: K): Promise<SourceView<SourceData<K>>> {
  "use cache";
  cacheTag(sourceTag(id));
  cacheLife("hours");

  const definition = getSource(id);
  const db = getDb();
  if (!db) return toSourceView(definition, null);
  try {
    return toSourceView(definition, await new DrizzleSnapshotStore(db).get(id));
  } catch (e) {
    console.warn(`[sources] reading ${id} failed:`, e instanceof Error ? e.message : e);
    return toSourceView(definition, null);
  }
}
