import { getSource } from "@/lib/sources/registry";
import { isSourceId } from "@/lib/sources/types";
import { prepareSync } from "@/lib/sync/context";
import { revalidateResults, syncResponse } from "@/lib/sync/respond";
import { SYNC_BUDGET_MS, syncSource } from "@/lib/sync/run";

// A slow upstream shouldn't be cut off by the platform's default limit.
export const maxDuration = 60;

// POST /api/sync/<source>/ → sync one source now, regardless of schedule.
export async function POST(request: Request, { params }: RouteContext<"/api/sync/[source]">) {
  const { source } = await params;
  if (!isSourceId(source)) {
    return Response.json({ error: `unknown source "${source}"` }, { status: 404 });
  }
  const prepared = prepareSync(request);
  if ("error" in prepared) return prepared.error;
  const previous = await prepared.store.get(source);
  const result = await syncSource(
    getSource(source),
    prepared.store,
    prepared.ctx,
    new Date(),
    previous,
    Date.now() + SYNC_BUDGET_MS,
  );
  revalidateResults([result]);
  return syncResponse([result]);
}
