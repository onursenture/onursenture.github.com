import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import type { WorkEntry } from "@/content/work-index";

// The home Work row: one placeholder tile per entry (first four), 2-up, with
// a caption. Tiles link once Sprint 5 adds case studies (`href`).
export function WorkTiles({ entries }: { entries: WorkEntry[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {entries.slice(0, 4).map((entry, index) => (
        <li key={entry.title}>
          <MediaPlaceholder label={entry.title} index={index + 1} tone={index % 2 ? "ink" : "accent"} />
          <p className="mt-1.5 type-meta">
            {entry.title}
            {entry.meta ? <span className="text-fg-muted"> · {entry.meta}</span> : null}
          </p>
        </li>
      ))}
    </ul>
  );
}
