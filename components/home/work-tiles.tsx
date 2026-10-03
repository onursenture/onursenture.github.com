import Link from "next/link";
import { MediaPlaceholder } from "@/components/ui/media-placeholder";
import type { WorkEntry } from "@/content/work-index";

// The home Work row: one tile per entry (first four), 2-up, with a caption.
// A tile links to its case study and shows the case study's hero image once
// there is one; until then the numbered placeholder.
export function WorkTiles({ entries }: { entries: (WorkEntry & { image?: string })[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {entries.slice(0, 4).map((entry, index) => {
        const tile = (
          <>
            <MediaPlaceholder label={entry.title} index={index + 1} tone={index % 2 ? "ink" : "accent"} image={entry.image} />
            <p className="mt-1.5 type-meta">
              <span className="group-hover:underline group-hover:underline-offset-[0.2em]">{entry.title}</span>
              {entry.meta ? <span className="text-fg-muted"> · {entry.meta}</span> : null}
            </p>
          </>
        );
        return (
          <li key={entry.title}>
            {entry.href ? (
              <Link href={entry.href} className="group block">
                {tile}
              </Link>
            ) : (
              tile
            )}
          </li>
        );
      })}
    </ul>
  );
}
