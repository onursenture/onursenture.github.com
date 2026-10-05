import type { PhotoContent, PhotoIssue } from "./types";

// What a photo needs to go live (publish, or a save on a live photo). Drafts
// skip this, so an untitled upload is never lost.
export function publishIssues(content: PhotoContent): PhotoIssue[] {
  return content.title.trim() === "" ? [{ at: "title", message: "Add a title." }] : [];
}
