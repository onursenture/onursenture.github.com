import type {
  AnySourceDefinition,
  ArchiveOutcome,
  SourceContext,
  SourceDefinition,
  SourceId,
} from "../sources/types";
import type { Snapshot, SnapshotStore } from "./store";

// Cron fires on the hour but GitHub Actions can start a few minutes late or
// early; without slack an hourly source would skip every other run.
const SLACK_MINUTES = 5;

// A due source isn't started with less than this left before the deadline:
// it stays due and runs on the next call.
const MIN_START_MS = 10_000;

// What the routes give a run: 45 s of the 60 s function limit, leaving room
// to answer and revalidate.
export const SYNC_BUDGET_MS = 45_000;

export type SyncResult =
  | { source: SourceId; status: "ok"; itemCount: number; archive?: ArchiveOutcome }
  | { source: SourceId; status: "error"; error: string }
  // `reason: "deadline"`: due, but the run's time budget ran out first.
  | { source: SourceId; status: "skipped"; reason?: "deadline" };

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

// The optional archive step (Sprint 10). It runs only with database stores
// and after the snapshot is saved; its own failure never fails the sync,
// because the snapshot is already good. Its note is kept for the admin.
async function runArchive<T>(
  definition: SourceDefinition<T>,
  data: T,
  store: SnapshotStore,
  ctx: SourceContext,
  now: Date,
  deadline: number,
): Promise<ArchiveOutcome | undefined> {
  if (!definition.archive || !ctx.stores) return undefined;
  let outcome: ArchiveOutcome;
  try {
    outcome = await definition.archive(data, { stores: ctx.stores, fetch: ctx.fetch, now, deadline });
  } catch (e) {
    outcome = { note: `archive failed: ${e instanceof Error ? e.message : String(e)}`, tags: [] };
  }
  // The note is for the admin only: failing to write it mustn't turn a good
  // sync into an error.
  try {
    await store.recordArchive(definition.id, outcome.note, now);
  } catch (e) {
    console.warn(`[sync] ${definition.id}: archive note not saved:`, e instanceof Error ? e.message : e);
  }
  return outcome;
}

// `previous` is the stored snapshot (null if none). A fetch that parses fine
// but comes back empty while a good snapshot exists is treated as a failure,
// so a degraded upstream (a markup change, a rate-limit page that still
// parses) can't wipe the page; the old snapshot stays and the error is
// recorded.
export async function syncSource<T>(
  definition: SourceDefinition<T>,
  store: SnapshotStore,
  ctx: SourceContext,
  now: Date,
  previous: Snapshot | null,
  deadline: number,
): Promise<SyncResult> {
  try {
    const data = definition.schema.parse(await definition.fetch(ctx));
    const itemCount = definition.count(data);
    if (itemCount === 0 && previous && previous.itemCount > 0) {
      throw new Error(`upstream returned 0 items; kept previous ${previous.itemCount}`);
    }
    await store.recordSuccess(definition.id, data, itemCount, now);
    const archive = await runArchive(definition, data, store, ctx, now, deadline);
    return { source: definition.id, status: "ok", itemCount, ...(archive ? { archive } : {}) };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await store.recordFailure(definition.id, error, now);
    return { source: definition.id, status: "error", error };
  }
}

// `deadline` is epoch ms (Date.now() + SYNC_BUDGET_MS in the routes).
// `onResult` sees each result as soon as it is known, so the routes can
// revalidate per source: a run the platform kills later still keeps the
// revalidations of the sources it finished.
export async function syncAll(
  definitions: AnySourceDefinition[],
  store: SnapshotStore,
  ctx: SourceContext,
  now: Date,
  options: { force?: boolean; deadline: number; onResult?: (result: SyncResult) => void },
): Promise<SyncResult[]> {
  // Sequential on purpose: a few small requests, and it keeps upstream
  // politeness and log ordering simple.
  const results: SyncResult[] = [];
  const report = (result: SyncResult) => {
    results.push(result);
    options.onResult?.(result);
  };
  for (const definition of definitions) {
    const snapshot = await store.get(definition.id);
    if (!options.force && !isDue(definition, snapshot, now)) {
      report({ source: definition.id, status: "skipped" });
      continue;
    }
    if (options.deadline - Date.now() < MIN_START_MS) {
      report({ source: definition.id, status: "skipped", reason: "deadline" });
      continue;
    }
    report(await syncSource(definition, store, ctx, now, snapshot, options.deadline));
  }
  return results;
}
