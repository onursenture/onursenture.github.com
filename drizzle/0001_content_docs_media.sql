CREATE TABLE "content_docs" (
	"key" text PRIMARY KEY NOT NULL,
	"draft" jsonb,
	"published" jsonb,
	"draft_updated_at" timestamp with time zone,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "media" (
	"key" text PRIMARY KEY NOT NULL,
	"base_url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"widths" jsonb NOT NULL,
	"source_hash" text NOT NULL,
	"settings" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
