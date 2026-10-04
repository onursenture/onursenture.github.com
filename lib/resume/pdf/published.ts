import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CONTENT_TAG, getPublishedContent } from "@/lib/content/read";
import { resumeView } from "@/lib/resume/view";
import { renderResumePdf } from "./document";

// The published resume as a PDF, base64 (a "use cache" value must be
// serialisable). Tagged with the content tag, so a publish regenerates it.
export async function publishedResumePdf(): Promise<string> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("days");
  const { site } = await getPublishedContent();
  return (await renderResumePdf(resumeView(site))).toString("base64");
}
