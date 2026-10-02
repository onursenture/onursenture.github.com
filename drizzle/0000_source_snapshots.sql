CREATE TABLE "source_snapshots" (
	"source" text PRIMARY KEY NOT NULL,
	"payload" jsonb,
	"last_success_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"item_count" integer DEFAULT 0 NOT NULL
);
