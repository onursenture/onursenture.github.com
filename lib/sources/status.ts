import "server-only";
import type { SourceStatus } from "./health";
import { readSource } from "./read";
import { getSource } from "./registry";
import { SOURCE_IDS, SOURCE_LABELS } from "./types";

// Freshness of every source, for the sidebar sync line and the Sources
// panel. Reads the same cached snapshots as the sections.
export async function readSourceStatuses(): Promise<SourceStatus[]> {
  const views = await Promise.all(SOURCE_IDS.map((id) => readSource(id)));
  return SOURCE_IDS.map((id, i) => ({
    id,
    label: SOURCE_LABELS[id],
    intervalMinutes: getSource(id).intervalMinutes,
    lastSuccessAt: views[i].lastSuccessAt,
  }));
}
