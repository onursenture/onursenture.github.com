import { Fragment } from "react";
import { LiveClock } from "@/components/ui/live-clock";
import type { MetaSegment } from "@/content/profile";

// The availability segment shows only while `available` is true.
export function visibleSegments(segments: MetaSegment[], available: boolean): MetaSegment[] {
  return segments.filter((segment) => !("availability" in segment) || available);
}

// "ANKARA" → "Ankara", for the clock's accessible label.
function placeName(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
}

function Segment({ segment }: { segment: MetaSegment }) {
  if ("text" in segment) return <span className="whitespace-nowrap">{segment.text}</span>;
  if ("clock" in segment) {
    return (
      <span className="whitespace-nowrap">
        {segment.label} <LiveClock timeZone={segment.clock} place={placeName(segment.label)} />
      </span>
    );
  }
  return <span className="whitespace-nowrap">OPEN TO ROLES</span>;
}

// DESIGNER + BUILDER · ANKARA 14:32 · OPEN TO ROLES. The line wraps between
// segments, never inside one.
export function MetaLine({ segments, available }: { segments: MetaSegment[]; available: boolean }) {
  const visible = visibleSegments(segments, available);
  if (visible.length === 0) return null;
  return (
    <p data-testid="meta-line" className="type-mono-12 tracking-[0.02em] text-fg-muted uppercase">
      {visible.map((segment, index) => (
        <Fragment key={index}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          <Segment segment={segment} />
        </Fragment>
      ))}
    </p>
  );
}
