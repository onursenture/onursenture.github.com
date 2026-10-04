import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// One row per external source. Written by the sync job, read by pages.
export const sourceSnapshots = pgTable("source_snapshots", {
  source: text("source").primaryKey(),
  payload: jsonb("payload"),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  lastError: text("last_error"),
  itemCount: integer("item_count").notNull().default(0),
});

// Admin documents (Sprint 7): one row per editable unit (lib/content/keys.ts).
// `published` null means "use the repo content"; `draft` null means no
// unpublished edit. draft_updated_at guards autosave against a stale tab.
export const contentDocs = pgTable("content_docs", {
  key: text("key").primaryKey(),
  draft: jsonb("draft"),
  published: jsonb("published"),
  draftUpdatedAt: timestamp("draft_updated_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

// Uploaded images (Sprint 7): renditions live in Blob under base_url
// (`${baseUrl}-${width}.avif|jpg`); merged into the image manifest by key.
export const media = pgTable("media", {
  key: text("key").primaryKey(),
  baseUrl: text("base_url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  widths: jsonb("widths").$type<number[]>().notNull(),
  sourceHash: text("source_hash").notNull(),
  settings: text("settings").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
