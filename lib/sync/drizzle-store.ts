import { eq } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { sourceSnapshots } from "../db/schema";
import type { SourceId } from "../sources/types";
import type { Snapshot, SnapshotStore } from "./store";

// Accepts any Postgres Drizzle database: neon-http in production, PGlite in
// tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

export class DrizzleSnapshotStore implements SnapshotStore {
  constructor(private db: AnyPgDatabase) {}

  async get(source: SourceId): Promise<Snapshot | null> {
    const rows = await this.db
      .select()
      .from(sourceSnapshots)
      .where(eq(sourceSnapshots.source, source))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      source,
      payload: row.payload,
      lastSuccessAt: row.lastSuccessAt,
      lastAttemptAt: row.lastAttemptAt,
      lastError: row.lastError,
      itemCount: row.itemCount,
    };
  }

  async recordSuccess(
    source: SourceId,
    payload: unknown,
    itemCount: number,
    at: Date,
  ): Promise<void> {
    const values = {
      payload,
      itemCount,
      lastSuccessAt: at,
      lastAttemptAt: at,
      lastError: null,
    };
    await this.db
      .insert(sourceSnapshots)
      .values({ source, ...values })
      .onConflictDoUpdate({ target: sourceSnapshots.source, set: values });
  }

  async recordFailure(source: SourceId, error: string, at: Date): Promise<void> {
    // On conflict only the attempt fields change; payload stays as it was.
    await this.db
      .insert(sourceSnapshots)
      .values({ source, payload: null, lastAttemptAt: at, lastError: error })
      .onConflictDoUpdate({
        target: sourceSnapshots.source,
        set: { lastAttemptAt: at, lastError: error },
      });
  }
}
