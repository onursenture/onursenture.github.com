import { cacheLife, cacheTag } from "next/cache";
import { getPhotos } from "@/lib/content/photos";
import { buildFeed } from "@/lib/feed/rss";
import { getPublishedNotes } from "@/lib/notes/read";
import { NOTES_TAG } from "@/lib/notes/tags";
import { PHOTOS_TAG } from "@/lib/photos/tags";
import { site } from "@/lib/site";

// Prerendered at build and regenerated when the notes or photos tag is
// revalidated (an admin write, the notes cron). "hours" caps how long a
// database error's empty list could stick.
async function feedXml(): Promise<string> {
  "use cache";
  cacheTag(NOTES_TAG, PHOTOS_TAG);
  cacheLife("hours");
  const [notes, photos] = await Promise.all([getPublishedNotes(), getPhotos()]);
  return buildFeed({ siteUrl: site.url, title: site.title, notes, photos });
}

export async function GET() {
  return new Response(await feedXml(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
