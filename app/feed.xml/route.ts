import { cacheLife, cacheTag } from "next/cache";
import { getPhotos } from "@/lib/content/photos";
import { buildFeed } from "@/lib/feed/rss";
import { getImage } from "@/lib/images/manifest";
import { getPublishedNotes } from "@/lib/notes/read";
import { NOTES_TAG } from "@/lib/notes/tags";
import { site } from "@/lib/site";

// Prerendered at build and regenerated when the notes tag is revalidated (a
// publish, an edit, the cron). Photos are repo content: a deploy refreshes
// them. "hours" caps how long a database error's empty list could stick.
async function feedXml(): Promise<string> {
  "use cache";
  cacheTag(NOTES_TAG);
  cacheLife("hours");
  const [notes, photos] = await Promise.all([getPublishedNotes(), getPhotos()]);
  return buildFeed({ siteUrl: site.url, title: site.title, notes, photos: photos.map((photo) => ({ photo, entry: getImage(photo.image) })) });
}

export async function GET() {
  return new Response(await feedXml(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
