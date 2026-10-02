import type { z } from "zod";

export const SOURCE_IDS = [
  "letterboxd",
  "goodreads",
  "instapaper",
  "writing",
  "github",
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export function isSourceId(value: string): value is SourceId {
  return (SOURCE_IDS as readonly string[]).includes(value);
}

// What a source's fetch receives. Injected so tests can pass a fake fetch
// and env instead of hitting the network.
export interface SourceContext {
  fetch: typeof globalThis.fetch;
  env: Record<string, string | undefined>;
}

export interface SourceDefinition<T> {
  id: SourceId;
  // How often the scheduled sync should refresh this source.
  intervalMinutes: number;
  // Returned to pages when no snapshot exists yet.
  empty: T;
  // Validates both fresh fetches and snapshots read back from the database.
  schema: z.ZodType<T>;
  // Fetch upstream and return parsed data. Must THROW on any failure, so the
  // sync layer keeps the previous snapshot instead of saving an empty one.
  fetch: (ctx: SourceContext) => Promise<T>;
  // Number of items, recorded for the source-health panel.
  count: (data: T) => number;
}

// Heterogeneous collections of sources (the registry, syncAll) need to
// accept definitions of any payload type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySourceDefinition = SourceDefinition<any>;
