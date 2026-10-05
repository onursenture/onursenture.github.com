CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" text,
	"title" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"taken_at" text NOT NULL,
	"camera" text DEFAULT '' NOT NULL,
	"image" jsonb NOT NULL,
	"exif" jsonb NOT NULL,
	"status" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "photos_slug_unique" UNIQUE("slug")
);
