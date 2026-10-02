import type { SourceId } from "./types";

// Cache tag shared by readSource (assigns it) and the sync route (revalidates it).
export function sourceTag(id: SourceId): string {
  return `source:${id}`;
}
