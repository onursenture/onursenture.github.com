import type { LifeLogRow } from "./types";

// Postgres stores data as JSON, which drops undefined values; apply the same
// rule to incoming data so the memory store and the database agree.
export function jsonData(data: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

// One row per (source, key) within a batch: data merged in batch order (later
// fields win, left-out fields survive), date and precision from the last
// occurrence. Postgres refuses a single INSERT ... ON CONFLICT DO UPDATE that
// touches a row twice, so both stores collapse first; counts then reflect
// distinct keys.
export function collapseBatch(rows: LifeLogRow[]): LifeLogRow[] {
  const byKey = new Map<string, LifeLogRow>();
  for (const row of rows) {
    const id = `${row.source}\u0000${row.key}`;
    const earlier = byKey.get(id);
    byKey.set(id, {
      ...row,
      data: { ...(earlier?.data ?? {}), ...jsonData(row.data) },
    });
  }
  return [...byKey.values()];
}
