import { revalidateTag } from "next/cache";
import { sourceTag } from "../sources/tags";
import type { SyncResult } from "./run";

// 502 when any source failed so the GitHub Actions run goes red and emails;
// the body still lists every result.
export function syncStatusCode(results: SyncResult[]): number {
  return results.some((r) => r.status === "error") ? 502 : 200;
}

// Stale-while-revalidate for every source that synced, plus the archive tags
// (life:<source>, enrichments) its archive step reported.
export function revalidateResults(results: SyncResult[]): void {
  for (const result of results) {
    if (result.status !== "ok") continue;
    revalidateTag(sourceTag(result.source), "max");
    for (const tag of result.archive?.tags ?? []) revalidateTag(tag, "max");
  }
}

// Only the JSON and its status: the routes revalidate each result as it
// comes in (revalidateResults), so a run killed later keeps what it did.
export function syncResponse(results: SyncResult[]): Response {
  return Response.json({ results }, { status: syncStatusCode(results) });
}
