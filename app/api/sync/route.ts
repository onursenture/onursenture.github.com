import { sources } from "@/lib/sources/registry";
import { prepareSync } from "@/lib/sync/context";
import { syncResponse } from "@/lib/sync/respond";
import { syncAll } from "@/lib/sync/run";

// Sources are fetched one after another, so a slow upstream could outlast the
// platform's default function limit and cut the sync off midway.
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
  });
  return syncResponse(results);
}
