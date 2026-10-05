import type { SourceId } from "../sources/types";

export interface Snapshot {
  source: SourceId;
  payload: unknown;
  lastSuccessAt: Date | null;
  lastAttemptAt: Date | null;
  lastError: string | null;
  itemCount: number;
  archiveNote: string | null;
}

// Persistence for source snapshots. The Drizzle implementation backs
// production; the in-memory one backs unit tests.
export interface SnapshotStore {
  get(source: SourceId): Promise<Snapshot | null>;
  recordSuccess(
    source: SourceId,
    payload: unknown,
    itemCount: number,
    at: Date,
  ): Promise<void>;
  // Must leave payload, lastSuccessAt and itemCount untouched.
  recordFailure(source: SourceId, error: string, at: Date): Promise<void>;
  // Records the last archive step's summary; touches nothing else.
  recordArchive(source: SourceId, note: string, at: Date): Promise<void>;
}
