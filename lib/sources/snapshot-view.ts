import type { Snapshot } from "../sync/store";
import type { SourceDefinition } from "./types";

// What pages receive for a source. Plain JSON (no Date) so it can cross the
// "use cache" boundary.
export interface SourceView<T> {
  data: T;
  // ISO timestamp of the last successful sync, null if never synced.
  lastSuccessAt: string | null;
}

// Turns a stored snapshot into page data, failing soft: a missing snapshot,
// an empty payload, or a payload that no longer matches the schema (e.g.
// after a schema change, before the next sync) all yield the empty shape.
export function toSourceView<T>(
  definition: SourceDefinition<T>,
  snapshot: Snapshot | null,
): SourceView<T> {
  const empty = { data: definition.empty, lastSuccessAt: null };
  if (!snapshot || snapshot.payload == null) return empty;
  const parsed = definition.schema.safeParse(snapshot.payload);
  if (!parsed.success) {
    console.warn(`[sources] ${definition.id} snapshot failed validation; showing empty`);
    return empty;
  }
  return {
    data: parsed.data,
    lastSuccessAt: snapshot.lastSuccessAt?.toISOString() ?? null,
  };
}
