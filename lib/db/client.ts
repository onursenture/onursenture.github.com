import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb(url: string) {
  return drizzle(neon(url), { schema });
}

export type Database = ReturnType<typeof createDb>;

let cached: Database | null | undefined;

// Returns null when DATABASE_URL is unset (local dev without a database,
// CI builds). Callers must treat null as "no data yet" and fail soft.
export function getDb(): Database | null {
  if (cached === undefined) {
    const url = process.env.DATABASE_URL;
    cached = url ? createDb(url) : null;
  }
  return cached;
}
