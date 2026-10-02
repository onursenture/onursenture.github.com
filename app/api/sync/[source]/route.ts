import { getSource } from "@/lib/sources/registry";
import { isSourceId } from "@/lib/sources/types";
import { prepareSync } from "@/lib/sync/context";
import { syncResponse } from "@/lib/sync/respond";
import { syncSource } from "@/lib/sync/run";

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
  );
  return syncResponse([result]);
}
