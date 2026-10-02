import { sources } from "@/lib/sources/registry";
import { prepareSync } from "@/lib/sync/context";
import { syncResponse } from "@/lib/sync/respond";
import { syncAll } from "@/lib/sync/run";

// POST /api/sync/          → sync every source that is due
// POST /api/sync/?force=1  → sync every source now
// Called hourly by .github/workflows/sync.yml with Authorization: Bearer $SYNC_SECRET.
export async function POST(request: Request) {
  const prepared = prepareSync(request);
  if ("error" in prepared) return prepared.error;
  const force = new URL(request.url).searchParams.get("force") === "1";
  const results = await syncAll(Object.values(sources), prepared.store, prepared.ctx, new Date(), {
    force,
  });
  return syncResponse(results);
}
