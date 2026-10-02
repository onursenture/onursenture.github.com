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
