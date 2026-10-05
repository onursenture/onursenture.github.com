import { github } from "./github";
import { goodreads } from "./goodreads";
import { instapaper } from "./instapaper";
import { letterboxd } from "./letterboxd";
import { theatre } from "./theatre";
import type { SourceDefinition, SourceId, SourceRegistry } from "./types";
import { writing } from "./writing";

// Every key must be its definition's own id: a copy-paste slip like
// `writing: letterboxd` fails to compile.
export const sources = {
  letterboxd,
  goodreads,
  instapaper,
  writing,
  github,
  theatre,
} satisfies SourceRegistry;

export type SourceData<K extends SourceId> =
  (typeof sources)[K] extends SourceDefinition<infer T> ? T : never;

// Typed lookup. Indexing `sources` with a generic key yields a union of
// definitions TypeScript can't narrow; this restores the per-source type.
export function getSource<K extends SourceId>(id: K): SourceDefinition<SourceData<K>> {
  return sources[id] as unknown as SourceDefinition<SourceData<K>>;
}
