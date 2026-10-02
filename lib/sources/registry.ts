import { github } from "./github";
import { goodreads } from "./goodreads";
import { instapaper } from "./instapaper";
import { letterboxd } from "./letterboxd";
import type { AnySourceDefinition, SourceDefinition, SourceId } from "./types";
import { writing } from "./writing";

export const sources = {
  letterboxd,
  goodreads,
  instapaper,
  writing,
  github,
} satisfies { [K in SourceId]: AnySourceDefinition };

export type SourceData<K extends SourceId> =
  (typeof sources)[K] extends SourceDefinition<infer T> ? T : never;

// Typed lookup. Indexing `sources` with a generic key yields a union of
// definitions TypeScript can't narrow; this restores the per-source type.
export function getSource<K extends SourceId>(id: K): SourceDefinition<SourceData<K>> {
  return sources[id] as unknown as SourceDefinition<SourceData<K>>;
}
