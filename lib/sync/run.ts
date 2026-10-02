import type {
  AnySourceDefinition,
  SourceContext,
  SourceDefinition,
  SourceId,
} from "../sources/types";
import type { Snapshot, SnapshotStore } from "./store";

// Cron fires on the hour but GitHub Actions can start a few minutes late or
// early; without slack an hourly source would skip every other run.
const SLACK_MINUTES = 5;

export type SyncResult =
  | { source: SourceId; status: "ok"; itemCount: number }
  | { source: SourceId; status: "error"; error: string }
  | { source: SourceId; status: "skipped" };

export function isDue(
  definition: Pick<AnySourceDefinition, "intervalMinutes">,
  snapshot: Snapshot | null,
  now: Date,
): boolean {
  if (!snapshot?.lastAttemptAt) return true;
  const elapsedMinutes =
    (now.getTime() - snapshot.lastAttemptAt.getTime()) / 60_000;
  return elapsedMinutes >= definition.intervalMinutes - SLACK_MINUTES;
}

export async function syncSource<T>(
  definition: SourceDefinition<T>,
  store: SnapshotStore,
  ctx: SourceContext,
  now: Date,
): Promise<SyncResult> {
  try {
    const data = definition.schema.parse(await definition.fetch(ctx));
    const itemCount = definition.count(data);
    await store.recordSuccess(definition.id, data, itemCount, now);
    return { source: definition.id, status: "ok", itemCount };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await store.recordFailure(definition.id, error, now);
    return { source: definition.id, status: "error", error };
  }
}

export async function syncAll(
  definitions: AnySourceDefinition[],
  store: SnapshotStore,
  ctx: SourceContext,
  now: Date,
  options: { force?: boolean } = {},
): Promise<SyncResult[]> {
  // Sequential on purpose: five small requests, and it keeps upstream
  // politeness and log ordering simple.
  const results: SyncResult[] = [];
  for (const definition of definitions) {
    const snapshot = await store.get(definition.id);
    if (!options.force && !isDue(definition, snapshot, now)) {
      results.push({ source: definition.id, status: "skipped" });
      continue;
    }
    results.push(await syncSource(definition, store, ctx, now));
  }
  return results;
}
