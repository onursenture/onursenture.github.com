import { type CSSProperties, Fragment } from "react";
import { cx } from "@/lib/cx";
import { noteSegments } from "@/lib/notes/facets";

const LINK = "underline decoration-line underline-offset-[0.2em] hover:decoration-fg";

// A note's text with Bluesky's facets: links and dotted @handles link out
// (handles to their Bluesky profile), #tags are muted text (no tag pages).
// Line breaks are kept. Server only (facets.ts).
export function NoteText({ text, className, style }: { text: string; className?: string; style?: CSSProperties }) {
  if (text.trim() === "") return null;
  return (
    <p className={cx("break-words whitespace-pre-line", className)} style={style}>
      {noteSegments(text).map((segment, index) => {
        if (segment.kind === "link") {
          return (
            <a key={index} href={segment.href} rel="noopener noreferrer" className={LINK}>
              {segment.text}
            </a>
          );
        }
        if (segment.kind === "mention") {
          return (
            <a key={index} href={`https://bsky.app/profile/${segment.handle}`} rel="noopener noreferrer" className={LINK}>
              {segment.text}
            </a>
          );
        }
        if (segment.kind === "tag") {
          return (
            <span key={index} className="text-fg-muted">
              {segment.text}
            </span>
          );
        }
        return <Fragment key={index}>{segment.text}</Fragment>;
      })}
    </p>
  );
}
