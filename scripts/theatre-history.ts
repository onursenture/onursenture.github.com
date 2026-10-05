// One-off (Sprint 10): crawls the whole tiyatrolar.com.tr activity feed and
// writes content/theatre-history.ts with every watch and the year read from
// its relative time. Run: npx tsx scripts/theatre-history.ts
// Onur then checks the years by hand (spec §2.4). Relative imports only.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { yearFromAgo } from "../lib/life-log/relative-year";
import { fetchActivityPage, type TheatreWatch } from "../lib/sources/theatre";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const now = new Date();
  const watches: TheatreWatch[] = [];
  for (let offset = 0, page = 0; page < 200; page++) {
    const result = await fetchActivityPage(globalThis.fetch, offset);
    watches.push(...result.watches);
    if (!result.more) break;
    offset = result.next;
    await sleep(300);
  }
  const rows = watches.map((watch) => {
    const year = yearFromAgo(watch.ago, now);
    if (year === null) throw new Error(`unreadable time "${watch.ago}" on ${watch.id}`);
    return { ...watch, year };
  });
  const oldest = Math.min(...rows.map((row) => row.year));
  const body = rows
    .map((row) => {
      const fields = {
        id: row.id,
        title: row.title,
        slug: row.slug,
        company: row.company,
        poster: row.poster,
        link: row.link,
        year: row.year,
        ...(row.year === oldest ? { andEarlier: true as const } : {}),
      };
      return `  ${JSON.stringify(fields)}, // ${row.ago}`;
    })
    .join("\n");
  const path = join(process.cwd(), "content", "theatre-history.ts");
  const source = readFileSync(path, "utf8");
  const head = source.slice(0, source.indexOf("export const theatreHistory"));
  writeFileSync(path, `${head}export const theatreHistory: TheatreHistoryRow[] = [\n${body}\n];\n`);
  console.log(`[theatre] ${rows.length} watches, ${oldest}–${Math.max(...rows.map((r) => r.year))}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
