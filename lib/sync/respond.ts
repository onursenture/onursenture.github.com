import { revalidateTag } from "next/cache";
import { sourceTag } from "../sources/tags";
import type { SyncResult } from "./run";

// 502 turns the hourly GitHub Actions run red, which emails. `"stale"` (the
// scheduled run) fails only when a source that errored is also late: one
// timed-out fetch, with the last good snapshot still served and the next run
// likely to succeed, isn't worth an email. `"any"` (a manual one-source sync)
// fails on every error. The body always lists every result.
export type FailOn = "any" | "stale";

export function syncStatusCode(results: SyncResult[], failOn: FailOn = "stale"): number {
  const failed = results.some((r) => r.status === "error" && (failOn === "any" || r.stale));
  return failed ? 502 : 200;
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
export function syncResponse(results: SyncResult[], failOn: FailOn = "stale"): Response {
  return Response.json({ results }, { status: syncStatusCode(results, failOn) });
}
