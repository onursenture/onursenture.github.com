import type { LifeLogSource } from "./types";

// Cache tags: readLifeLog / readEnrichments assign them, and the sync route
// revalidates them when an archive step wrote rows.
export function lifeLogTag(source: LifeLogSource): string {
  return `life:${source}`;
}

export const ENRICHMENTS_TAG = "enrichments";
