import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CONTENT_TAG, getPublishedContent } from "@/lib/content/read";
import { resumeView } from "@/lib/resume/view";
import { renderResumePdf } from "./document";

// The published resume as a PDF, base64 (a "use cache" value must be
// serialisable). Tagged with the content tag, so a publish regenerates it.
// This scope's cacheLife wins over the content read's, so it follows the
// read's fallback itself: after a database error the repo resume is kept for
// minutes, not days, and the PDF recovers with /resume/.
export async function publishedResumePdf(): Promise<string> {
  "use cache";
  cacheTag(CONTENT_TAG);
  const { site, fallback } = await getPublishedContent();
  if (fallback) cacheLife("minutes");
  else cacheLife("days");
  return (await renderResumePdf(resumeView(site))).toString("base64");
}
