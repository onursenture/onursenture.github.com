import { sources } from "@/lib/sources/registry";
import { prepareSync } from "@/lib/sync/context";
import { revalidateResults, syncResponse } from "@/lib/sync/respond";
import { SYNC_BUDGET_MS, syncAll } from "@/lib/sync/run";

// Sources are fetched one after another, so a slow upstream could outlast the
// platform's default function limit and cut the sync off midway. The run
// itself stops starting work after SYNC_BUDGET_MS (45 s), and each source is
// revalidated as soon as it finishes.
export const maxDuration = 60;

// POST /api/sync/          → sync every source that is due
// POST /api/sync/?force=1  → sync every source now
// Called hourly by .github/workflows/sync.yml with Authorization: Bearer $SYNC_SECRET.
export async function POST(request: Request) {
  const prepared = prepareSync(request);
  if ("error" in prepared) return prepared.error;
  const force = new URL(request.url).searchParams.get("force") === "1";
  const results = await syncAll(Object.values(sources), prepared.store, prepared.ctx, new Date(), {
    force,
    deadline: Date.now() + SYNC_BUDGET_MS,
    onResult: (result) => revalidateResults([result]),
  });
  return syncResponse(results);
}
