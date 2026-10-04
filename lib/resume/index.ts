import { getPublishedContent } from "@/lib/content/read";
import { type ResumeView, resumeView } from "./view";

// The live resume: the published documents over the repo content.
export async function getResume(): Promise<ResumeView> {
  return resumeView((await getPublishedContent()).site);
}
