export const LIFE_LOG_SOURCES = ["letterboxd", "theatre"] as const;
export type LifeLogSource = (typeof LIFE_LOG_SOURCES)[number];
export type DatePrecision = "day" | "year" | "none";

// One archived item. occurredOn is YYYY-MM-DD (Jan 1 for a "year" row), null when undated.
export interface LifeLogRow {
  source: LifeLogSource;
  key: string;
  occurredOn: string | null;
  precision: DatePrecision;
  data: Record<string, unknown>;
}

export interface UpsertCounts {
  inserted: number;
  updated: number;
}

export interface LifeLogStore {
  list(source: LifeLogSource): Promise<LifeLogRow[]>;
  keys(source: LifeLogSource): Promise<Set<string>>;
  // Insert by (source, key). On an existing key data is merged (stored || incoming: fields the incoming row leaves out survive) and the date is replaced only when redate is true.
  upsert(rows: LifeLogRow[], options: { redate: boolean; at: Date }): Promise<UpsertCounts>;
}

export interface Enrichment {
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  imageWidth: number | null;
  siteName: string | null;
  fetchedAt: string;
  error: string | null;
}

export interface EnrichmentStore {
  all(): Promise<Enrichment[]>;
  put(enrichment: Enrichment): Promise<void>;
}

export interface ArchiveStores {
  lifeLog: LifeLogStore;
  enrichments: EnrichmentStore;
}
