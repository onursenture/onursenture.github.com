import { revalidateTag } from "next/cache";
import { sourceTag } from "../sources/tags";
import type { SyncResult } from "./run";

// 502 when any source failed so the GitHub Actions run goes red and emails;
// the body still lists every result.
export function syncStatusCode(results: SyncResult[]): number {
  return results.some((r) => r.status === "error") ? 502 : 200;
}

export function syncResponse(results: SyncResult[]): Response {
  for (const result of results) {
    // Stale-while-revalidate: the next visitor gets the old page while the
    // new one renders in the background.
    if (result.status === "ok") revalidateTag(sourceTag(result.source), "max");
  }
  return Response.json({ results }, { status: syncStatusCode(results) });
}
