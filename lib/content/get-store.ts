import "server-only";
import { getDb } from "../db/client";
import { DrizzleContentStore } from "./drizzle-store";
import { FileContentStore } from "./file-store";
import type { ContentStore } from "./store";

// The store the admin and the public reads use. CONTENT_STORE_FILE (local dev,
// the admin e2e) wins so local editing never touches the production database;
// it is refused on Vercel. Otherwise Neon, or null without DATABASE_URL (the
// site then renders the repo content and the admin can't write).
export function getContentStore(): ContentStore | null {
  const file = process.env.CONTENT_STORE_FILE;
  if (file) {
    if (process.env.VERCEL) throw new Error("CONTENT_STORE_FILE is for local development and e2e only");
    return new FileContentStore(file);
  }
  const db = getDb();
  return db ? new DrizzleContentStore(db) : null;
}
