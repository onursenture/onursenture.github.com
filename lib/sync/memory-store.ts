import type { SourceId } from "../sources/types";
import type { Snapshot, SnapshotStore } from "./store";

export class MemorySnapshotStore implements SnapshotStore {
  private rows = new Map<SourceId, Snapshot>();

  async get(source: SourceId): Promise<Snapshot | null> {
    return this.rows.get(source) ?? null;
  }

  async recordSuccess(
    source: SourceId,
    payload: unknown,
    itemCount: number,
    at: Date,
  ): Promise<void> {
    this.rows.set(source, {
      source,
      payload,
      itemCount,
      lastSuccessAt: at,
      lastAttemptAt: at,
      lastError: null,
      archiveNote: this.rows.get(source)?.archiveNote ?? null,
    });
  }

  async recordFailure(source: SourceId, error: string, at: Date): Promise<void> {
    const existing = this.rows.get(source);
    this.rows.set(source, {
      source,
      payload: existing?.payload ?? null,
      itemCount: existing?.itemCount ?? 0,
      lastSuccessAt: existing?.lastSuccessAt ?? null,
      lastAttemptAt: at,
      lastError: error,
      archiveNote: existing?.archiveNote ?? null,
    });
  }

  async recordArchive(source: SourceId, note: string): Promise<void> {
    const existing = this.rows.get(source);
    if (existing) this.rows.set(source, { ...existing, archiveNote: note });
  }
}
