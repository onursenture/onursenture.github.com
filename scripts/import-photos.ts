// One-off (Sprint 11): moves the repo photos into the photos table and media
// storage, keeping their slugs, dates and cameras.
//
//   DATABASE_URL=… BLOB_READ_WRITE_TOKEN=… npm run import:photos -- <checkout> [--dry-run]
//
// <checkout> still has content/photos/*.mdx and images-src/photos/ (the v2
// worktree before Sprint 11 merges; this branch deletes them). Re-runnable: a
// slug already in the table is skipped. Without a Blob token it refuses,
// unless --local says the renditions may go to MEDIA_DEV_DIR (refused unless
// DATABASE_URL is on localhost). Relative imports: tsx runs this outside Next.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { BlobMediaStorage, LocalMediaStorage } from "../lib/media/storage";
import { DrizzlePhotoStore } from "../lib/photos/drizzle-store";
import { databaseHost, importPhotos, localImportAllowed, parseRepoPhoto } from "../lib/photos/import";

const USAGE = "usage: DATABASE_URL=… BLOB_READ_WRITE_TOKEN=… npm run import:photos -- <checkout> [--dry-run] [--local]";

function sourceFor(checkout: string, image: string): Buffer {
  for (const extension of [".jpeg", ".jpg", ".png"]) {
    const file = join(checkout, "images-src", `${image}${extension}`);
    if (existsSync(file)) return readFileSync(file);
  }
  throw new Error(`no source for ${image} under ${checkout}/images-src/`);
}

async function main() {
  const args = process.argv.slice(2);
  const checkout = args.find((arg) => !arg.startsWith("--"));
  const url = process.env.DATABASE_URL;
  const dryRun = args.includes("--dry-run");
  const local = args.includes("--local");
  if (!checkout || !url) {
    console.error(USAGE);
    process.exit(1);
  }
  if (local && !localImportAllowed(url)) {
    console.error("--local is only allowed with a DATABASE_URL on localhost, 127.0.0.1 or ::1.");
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN && !local && !dryRun) {
    console.error(`BLOB_READ_WRITE_TOKEN is not set; pass --local to write renditions to MEDIA_DEV_DIR.\n${USAGE}`);
    process.exit(1);
  }
  const dir = join(checkout, "content", "photos");
  const items = readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .sort()
    .map((file) => {
      const photo = parseRepoPhoto(file.replace(/\.mdx$/, ""), readFileSync(join(dir, file), "utf8"));
      return { photo, bytes: sourceFor(checkout, photo.image) };
    });
  const storage = process.env.BLOB_READ_WRITE_TOKEN ? new BlobMediaStorage() : new LocalMediaStorage(process.env.MEDIA_DEV_DIR ?? ".media-dev");
  console.log(`[photos] database ${databaseHost(url) ?? "unknown"} · storage ${storage.mode}${dryRun ? " · dry run" : ""}`);
  const result = await importPhotos(new DrizzlePhotoStore(drizzle(neon(url))), storage, items, new Date(), { dryRun });
  const list = (slugs: string[]) => (slugs.length > 0 ? slugs.join(", ") : "none");
  console.log(`[photos] ${dryRun ? "dry run, would import" : "imported"} ${result.imported.length}: ${list(result.imported)}; skipped ${result.skipped.length}: ${list(result.skipped)} [${storage.mode}]`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
