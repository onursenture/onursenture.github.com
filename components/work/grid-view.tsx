import { cx } from "@/lib/cx";
import type { MediaView } from "@/lib/work/derive";
import type { Density } from "@/lib/work/url-state";
import { MediaFigure } from "./media-figure";

// Columns per density (spec §3.4): 1× = 2, 2× = 4, ∞ = 8 from lg; 1, 2, 3
// on phones.
const COLUMNS: Record<Density, string> = {
  "1": "grid-cols-1 md:grid-cols-2",
  "2": "grid-cols-2 lg:grid-cols-4",
  inf: "grid-cols-3 lg:grid-cols-8",
};

const SIZES: Record<Density, string> = {
  "1": "(min-width: 768px) 50vw, 100vw",
  "2": "(min-width: 1024px) 25vw, 50vw",
  inf: "(min-width: 1024px) 13vw, 33vw",
};

// Every figure as a file-like card (after Base): caption and "group · tag ·
// credit" over the figure. Placeholder cards stay, so a page without images
// is still complete.
export function GridView({
  media,
  density,
  onOpen,
}: {
  media: MediaView[];
  density: Density;
  onOpen?: (id: string) => void;
}) {
  return (
    <ul data-view="grid" data-density={density} className={cx("grid gap-2.5 px-4 py-6 md:px-10", COLUMNS[density])}>
      {media.map((item) => {
        const meta = [item.group, item.tags[0], ...item.credits.map((c) => c.name)].filter(Boolean).join(" · ");
        return (
          <li key={item.id} className="min-w-0">
            <button
              type="button"
              data-media={item.id}
              onClick={() => onOpen?.(item.id)}
              aria-label={`Open ${item.label}: ${item.caption}`}
              className="flex w-full cursor-zoom-in flex-col border bg-bg text-left"
            >
              <span className="block border-b px-2 py-1 type-label">
                <span className="block truncate text-fg">{item.caption}</span>
                <span className="block truncate text-fg-muted">{meta}</span>
              </span>
              <MediaFigure media={item} sizes={SIZES[density]} bare={density === "inf"} className="border-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
