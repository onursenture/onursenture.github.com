import "server-only";
import { getDb } from "@/lib/db/client";
import { SOURCE_IDS, SOURCE_LABELS, type SourceId } from "@/lib/sources/types";
import { DrizzleSnapshotStore } from "@/lib/sync/drizzle-store";

// Source health for the admin home (spec §2.2), read uncached so it is always
// current. null when there is no database or it can't be read.
export interface SourceRow {
  id: SourceId;
  label: string;
  lastSuccessAt: string | null;
  lastError: string | null;
  itemCount: number;
  archiveNote: string | null;
}

export async function readSourceRows(): Promise<SourceRow[] | null> {
  const db = getDb();
  if (!db) return null;
  const store = new DrizzleSnapshotStore(db);
  try {
    return await Promise.all(
      SOURCE_IDS.map(async (id) => {
        const snapshot = await store.get(id);
        return {
          id,
          label: SOURCE_LABELS[id],
          lastSuccessAt: snapshot?.lastSuccessAt?.toISOString() ?? null,
          lastError: snapshot?.lastError ?? null,
          itemCount: snapshot?.itemCount ?? 0,
          archiveNote: snapshot?.archiveNote ?? null,
        };
      }),
    );
  } catch (e) {
    console.warn("[admin] reading sources failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
