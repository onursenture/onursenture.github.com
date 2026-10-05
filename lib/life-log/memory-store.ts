import { collapseBatch } from "./collapse";
import type { Enrichment, EnrichmentStore, LifeLogRow, LifeLogSource, LifeLogStore, UpsertCounts } from "./types";

// In-memory stores for unit tests; same semantics as the Drizzle ones.
export class MemoryLifeLogStore implements LifeLogStore {
  private rows = new Map<string, LifeLogRow>();

  async list(source: LifeLogSource): Promise<LifeLogRow[]> {
    return [...this.rows.values()]
      .filter((r) => r.source === source)
      .map((r) => structuredClone(r))
      .sort((a, b) => {
        if (a.occurredOn !== b.occurredOn) {
          if (a.occurredOn === null) return 1;
          if (b.occurredOn === null) return -1;
          return a.occurredOn < b.occurredOn ? 1 : -1;
        }
        return a.key < b.key ? 1 : a.key > b.key ? -1 : 0;
      });
  }

  async keys(source: LifeLogSource): Promise<Set<string>> {
    return new Set((await this.list(source)).map((r) => r.key));
  }

  async upsert(rows: LifeLogRow[], { redate }: { redate: boolean; at: Date }): Promise<UpsertCounts> {
    const counts = { inserted: 0, updated: 0 };
    for (const row of collapseBatch(rows)) {
      const id = `${row.source}\u0000${row.key}`;
      const stored = this.rows.get(id);
      if (!stored) {
        this.rows.set(id, row);
        counts.inserted++;
        continue;
      }
      this.rows.set(id, {
        ...stored,
        data: { ...stored.data, ...row.data },
        ...(redate ? { occurredOn: row.occurredOn, precision: row.precision } : {}),
      });
      counts.updated++;
    }
    return counts;
  }
}

export class MemoryEnrichmentStore implements EnrichmentStore {
  private rows = new Map<string, Enrichment>();

  async all(): Promise<Enrichment[]> {
    return [...this.rows.values()].map((r) => ({ ...r }));
  }

  async put(enrichment: Enrichment): Promise<void> {
    this.rows.set(enrichment.url, { ...enrichment });
  }
}
