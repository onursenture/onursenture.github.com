import { asc, desc, eq, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { lifeLog, linkEnrichments } from "../db/schema";
import type {
  ArchiveStores,
  DatePrecision,
  Enrichment,
  EnrichmentStore,
  LifeLogRow,
  LifeLogSource,
  LifeLogStore,
  UpsertCounts,
} from "./types";

// Any Postgres Drizzle database: neon-http in production, PGlite in tests.
type AnyPgDatabase = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

// neon-http sends one statement per request; keep each under the parameter
// limit (7 columns per row).
const CHUNK = 500;

export class DrizzleLifeLogStore implements LifeLogStore {
  constructor(private db: AnyPgDatabase) {}

  async list(source: LifeLogSource): Promise<LifeLogRow[]> {
    const rows = await this.db
      .select()
      .from(lifeLog)
      .where(eq(lifeLog.source, source))
      .orderBy(sql`${lifeLog.occurredOn} DESC NULLS LAST`, desc(lifeLog.key));
    return rows.map((r) => ({
      source,
      key: r.key,
      occurredOn: r.occurredOn,
      precision: r.precision as DatePrecision,
      data: r.data,
    }));
  }

  async keys(source: LifeLogSource): Promise<Set<string>> {
    const rows = await this.db.select({ key: lifeLog.key }).from(lifeLog).where(eq(lifeLog.source, source)).orderBy(asc(lifeLog.key));
    return new Set(rows.map((r) => r.key));
  }

  async upsert(rows: LifeLogRow[], { redate, at }: { redate: boolean; at: Date }): Promise<UpsertCounts> {
    const counts = { inserted: 0, updated: 0 };
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const result = await this.db
        .insert(lifeLog)
        .values(
          chunk.map((r) => ({
            source: r.source,
            key: r.key,
            occurredOn: r.occurredOn,
            precision: r.precision,
            data: r.data,
            firstSeenAt: at,
            updatedAt: at,
          })),
        )
        .onConflictDoUpdate({
          target: [lifeLog.source, lifeLog.key],
          set: {
            data: sql`${lifeLog.data} || excluded.data`,
            updatedAt: at,
            ...(redate ? { occurredOn: sql`excluded.occurred_on`, precision: sql`excluded.precision` } : {}),
          },
        })
        // xmax is 0 on a freshly inserted row and non-zero on an updated one.
        .returning({ inserted: sql<boolean>`(xmax = 0)` });
      for (const r of result) {
        if (r.inserted) counts.inserted++;
        else counts.updated++;
      }
    }
    return counts;
  }
}

export class DrizzleEnrichmentStore implements EnrichmentStore {
  constructor(private db: AnyPgDatabase) {}

  async all(): Promise<Enrichment[]> {
    const rows = await this.db.select().from(linkEnrichments);
    return rows.map((r) => ({ ...r, fetchedAt: r.fetchedAt.toISOString() }));
  }

  async put(enrichment: Enrichment): Promise<void> {
    const values = { ...enrichment, fetchedAt: new Date(enrichment.fetchedAt) };
    await this.db
      .insert(linkEnrichments)
      .values(values)
      .onConflictDoUpdate({ target: linkEnrichments.url, set: values });
  }
}

export function archiveStores(db: AnyPgDatabase): ArchiveStores {
  return { lifeLog: new DrizzleLifeLogStore(db), enrichments: new DrizzleEnrichmentStore(db) };
}
