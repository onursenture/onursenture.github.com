import { date, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

// One row per external source. Written by the sync job, read by pages.
export const sourceSnapshots = pgTable("source_snapshots", {
  source: text("source").primaryKey(),
  payload: jsonb("payload"),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
  lastError: text("last_error"),
  itemCount: integer("item_count").notNull().default(0),
  // The last archive step's summary (Sprint 10), shown in the admin.
  archiveNote: text("archive_note"),
});

// Admin documents (Sprint 7): one row per editable unit (lib/content/keys.ts).
// `published` null means "use the repo content"; `draft` null means no
// unpublished edit. draft_updated_at guards a draft save against a stale tab.
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

// Notes (Sprint 9): one row per note, any status. tid is set the first time a
// note is published and never changes (its URL). Expand-only migration.
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey(),
  tid: text("tid").unique(),
  text: text("text").notNull(),
  side: text("side").notNull(),
  lang: text("lang").notNull().default("en"),
  embed: jsonb("embed"),
  status: text("status").notNull(),
  publishAt: timestamp("publish_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// Life archives that must outlive their upstream windows (Sprint 10): Films
// (Letterboxd CSV import + RSS) and Theatre (history file + activity feed).
// occurred_on is the watch date, or Jan 1 of the year when precision is
// "year"; null when undated. Expand-only migration.
export const lifeLog = pgTable(
  "life_log",
  {
    source: text("source").notNull(),
    key: text("key").notNull(),
    occurredOn: date("occurred_on", { mode: "string" }),
    precision: text("precision").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.source, table.key] })],
);

// og: metadata for Saved articles (Sprint 10), fetched once per URL.
export const linkEnrichments = pgTable("link_enrichments", {
  url: text("url").primaryKey(),
  title: text("title"),
  description: text("description"),
  imageUrl: text("image_url"),
  imageWidth: integer("image_width"),
  siteName: text("site_name"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  error: text("error"),
});
