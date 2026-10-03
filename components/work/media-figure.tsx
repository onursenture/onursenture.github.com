import { PictureView } from "@/components/picture-view";
import { PlaceholderWash } from "@/components/ui/dither";
import { cx } from "@/lib/cx";
import type { MediaAspect } from "@/content/work/types";
import type { MediaView } from "@/lib/work/derive";

const RATIO: Record<MediaAspect, string> = {
  "16/9": "aspect-[16/9]",
  "16/10": "aspect-[16/10]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
};

export interface MediaFigureProps {
  media: MediaView;
  sizes: string;
  // A ratio class that overrides the media's aspect (the hero: 16/10, 21/9
  // from md; thumbnails: 4/3).
  ratio?: string;
  // No FIG label (thumbnails, the densest grid).
  bare?: boolean;
  // Fit inside the viewer stage instead of filling the width.
  fit?: boolean;
  priority?: boolean;
  className?: string;
}

// A work media slot. It renders the image when one exists. Otherwise it is
// the Sprint 4 labelled dither wash ("FIG. 03.2 · Tokens"): it stays live
// until `npm run figma` or Sprint 7's upload fills it, so it must look
// intentional. Server- and client-safe: no manifest import.
export function MediaFigure({ media, sizes, ratio, bare = false, fit = false, priority = false, className }: MediaFigureProps) {
  if (media.image) {
    return (
      <PictureView
        image={media.image.key}
        entry={media.image}
        alt={media.caption}
        sizes={sizes}
        priority={priority}
        className={cx(
          fit ? "mx-auto max-h-[62dvh] w-auto max-w-full border object-contain" : cx("w-full border object-cover", ratio ?? RATIO[media.aspect]),
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cx(
        "relative overflow-hidden border",
        fit ? "aspect-[16/10] max-h-[62dvh] w-full max-w-5xl" : cx("w-full", ratio ?? RATIO[media.aspect]),
        className,
      )}
    >
      <PlaceholderWash tone="accent" />
      {bare ? null : (
        <span aria-hidden="true" className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-bg px-1.5 type-label text-fg">
          {media.label} · {media.caption}
        </span>
      )}
    </div>
  );
}
