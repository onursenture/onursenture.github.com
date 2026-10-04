import { graphemeCount } from "./graphemes";
import { MAX_GRAPHEMES, type NoteContent, type NoteIssue } from "./types";

// What a note needs to go live (publish, schedule, or saving a note that is
// already live). Drafts skip these, so a half-written note is never lost.
export function publishIssues(content: NoteContent): NoteIssue[] {
  const issues: NoteIssue[] = [];
  const count = graphemeCount(content.text);
  if (count > MAX_GRAPHEMES) issues.push({ at: "text", message: `The text is ${count} characters; the limit is ${MAX_GRAPHEMES}.` });
  const embed = content.embed;
  const hasImages = embed?.kind === "images" && embed.images.length > 0;
  if (content.text.trim() === "" && !hasImages) issues.push({ at: "text", message: "Write something or add an image." });
  if (embed?.kind === "images") {
    if (embed.images.length === 0) issues.push({ at: "embed", message: "Add an image or remove the attachment." });
    embed.images.forEach((image, index) => {
      if (image.alt.trim() === "") issues.push({ at: `embed/images/${index}/alt`, message: `Image ${index + 1} needs alt text.` });
    });
  }
  if (embed?.kind === "link" && !/^https?:\/\//i.test(embed.url)) issues.push({ at: "embed/url", message: "Use an http or https link." });
  return issues;
}
