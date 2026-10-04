import { RichText } from "@atproto/api";

// Links, @handles and #tags, detected with Bluesky's own rules (RichText,
// without handle resolution), so the site links exactly what a cross-post
// would. Server only: @atproto/api is large and must stay out of client
// bundles.

export type NoteSegment =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; href: string }
  | { kind: "mention"; text: string; handle: string }
  | { kind: "tag"; text: string; tag: string };

export function noteSegments(text: string): NoteSegment[] {
  if (text === "") return [];
  const rich = new RichText({ text });
  rich.detectFacetsWithoutResolution();
  const segments: NoteSegment[] = [];
  for (const segment of rich.segments()) {
    const link = segment.link;
    const mention = segment.mention;
    const tag = segment.tag;
    if (link) segments.push({ kind: "link", text: segment.text, href: link.uri });
    // Without resolution the mention's "did" is the handle itself.
    else if (mention) segments.push({ kind: "mention", text: segment.text, handle: mention.did });
    else if (tag) segments.push({ kind: "tag", text: segment.text, tag: tag.tag });
    else segments.push({ kind: "text", text: segment.text });
  }
  return segments;
}
