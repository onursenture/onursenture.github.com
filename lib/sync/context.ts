import "server-only";
import { getDb } from "../db/client";
import type { SourceContext } from "../sources/types";
import { isAuthorized } from "./auth";
import { DrizzleSnapshotStore } from "./drizzle-store";

// Shared preamble for the sync route handlers: checks the bearer token and
// the database, returning either a ready store/context or an error response.
export function prepareSync(
  request: Request,
): { error: Response } | { store: DrizzleSnapshotStore; ctx: SourceContext } {
  if (!isAuthorized(request.headers.get("authorization"), process.env.SYNC_SECRET)) {
    return { error: Response.json({ error: "unauthorized" }, { status: 401 }) };
  }
  const db = getDb();
  if (!db) {
    return { error: Response.json({ error: "DATABASE_URL is not set" }, { status: 503 }) };
  }
  return {
    store: new DrizzleSnapshotStore(db),
    ctx: { fetch: globalThis.fetch, env: process.env },
  };
}
