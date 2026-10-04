CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tid" text,
	"text" text NOT NULL,
	"side" text NOT NULL,
	"lang" text DEFAULT 'en' NOT NULL,
	"embed" jsonb,
	"status" text NOT NULL,
	"publish_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notes_tid_unique" UNIQUE("tid")
);
