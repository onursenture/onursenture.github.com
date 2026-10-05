import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "../db/client";
import { DrizzleEnrichmentStore, DrizzleLifeLogStore } from "./drizzle-store";
import { ENRICHMENTS_TAG, lifeLogTag } from "./tags";
import type { Enrichment, LifeLogRow, LifeLogSource } from "./types";

// Page-side reads of the archive tables, cached and tagged like readSource:
// pages are prerendered and regenerate when a sync's archive step
// revalidates the tag. Never throws: no database or an error renders empty
// (an error only for minutes, since it is probably transient).

async function fixtureJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(join(process.cwd(), "tests", "fixtures", name), "utf8")) as T;
}

export async function readLifeLog(source: LifeLogSource): Promise<LifeLogRow[]> {
  "use cache";
  cacheTag(lifeLogTag(source));
  if (process.env.SOURCE_FIXTURES === "1") {
    cacheLife("hours");
    return (await fixtureJson<LifeLogRow[]>("life-log.json")).filter((row) => row.source === source);
  }
  const db = getDb();
  if (!db) {
    cacheLife("hours");
    return [];
  }
  try {
    const rows = await new DrizzleLifeLogStore(db).list(source);
    cacheLife("hours");
    return rows;
  } catch (e) {
    console.warn(`[life-log] reading ${source} failed:`, e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return [];
  }
}

export async function readEnrichments(): Promise<Enrichment[]> {
  "use cache";
  cacheTag(ENRICHMENTS_TAG);
  if (process.env.SOURCE_FIXTURES === "1") {
    cacheLife("hours");
    return fixtureJson<Enrichment[]>("enrichments.json");
  }
  const db = getDb();
  if (!db) {
    cacheLife("hours");
    return [];
  }
  try {
    const rows = await new DrizzleEnrichmentStore(db).all();
    cacheLife("hours");
    return rows;
  } catch (e) {
    console.warn("[life-log] reading enrichments failed:", e instanceof Error ? e.message : e);
    cacheLife("minutes");
    return [];
  }
}
