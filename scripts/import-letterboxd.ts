// One-off: imports a Letterboxd export into life_log (Sprint 10).
//
//   DATABASE_URL=… npm run import:letterboxd -- ../letterboxd-export.zip [--posters]
//
// diary.csv rows become dated films, watched.csv-only films "undated". Safe
// to re-run: rows upsert by key, the date is rewritten from the CSV, and a
// poster already filled is kept. --posters then fills every missing poster
// (one film page per second). Relative imports only: tsx runs this outside
// Next.
import { execFileSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { DrizzleLifeLogStore } from "../lib/life-log/drizzle-store";
import { exportRows } from "../lib/life-log/letterboxd-csv";
import { fillPosters } from "../lib/life-log/posters";

function readFromZip(zip: string, name: string): string {
  return execFileSync("unzip", ["-p", zip, name], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

async function main() {
  const zip = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  const url = process.env.DATABASE_URL;
  if (!zip || !url) {
    console.error("usage: DATABASE_URL=… npm run import:letterboxd -- <export.zip> [--posters]");
    process.exit(1);
  }
  const rows = exportRows(readFromZip(zip, "diary.csv"), readFromZip(zip, "watched.csv"));
  const store = new DrizzleLifeLogStore(drizzle(neon(url)));
  const counts = await store.upsert(rows, { redate: true, at: new Date() });
  const dated = rows.filter((r) => r.occurredOn).length;
  console.log(`[letterboxd] ${rows.length} rows (${dated} dated, ${rows.length - dated} undated): +${counts.inserted} new, ${counts.updated} updated`);

  if (process.argv.includes("--posters")) {
    let total = 0;
    for (;;) {
      const batch = await fillPosters(store, globalThis.fetch, { limit: 50, delayMs: 1000, at: new Date() });
      total += batch.filled;
      console.log(`[letterboxd] posters: +${batch.filled} (${batch.failed} failed), ${total} so far`);
      if (batch.filled + batch.failed === 0) break; // no candidates left
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
