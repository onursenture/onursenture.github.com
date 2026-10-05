CREATE TABLE "life_log" (
	"source" text NOT NULL,
	"key" text NOT NULL,
	"occurred_on" date,
	"precision" text NOT NULL,
	"data" jsonb NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "life_log_source_key_pk" PRIMARY KEY("source","key")
);
--> statement-breakpoint
CREATE TABLE "link_enrichments" (
	"url" text PRIMARY KEY NOT NULL,
	"title" text,
	"description" text,
	"image_url" text,
	"image_width" integer,
	"site_name" text,
	"fetched_at" timestamp with time zone NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "source_snapshots" ADD COLUMN "archive_note" text;