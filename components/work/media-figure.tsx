import { PictureView } from "@/components/picture-view";
import { PlaceholderWash } from "@/components/ui/dither";
import { cx } from "@/lib/cx";
import type { ImageView } from "@/lib/work/derive";

export interface MediaFigureProps {
  media: ImageView;
  sizes: string;
  // A ratio class that overrides 16:10 (the viewer's thumbnails: 4/3).
  ratio?: string;
  // The placeholder's caption; defaults to "FIG. 01 · Caption".
  label?: string;
  // No FIG label (thumbnails).
  bare?: boolean;
  // Fit inside the viewer stage instead of filling the width.
  fit?: boolean;
  priority?: boolean;
  className?: string;
}

export function figureLabel(media: ImageView): string {
  return media.caption ? `${media.label} · ${media.caption}` : media.label;
}

// A work image slot, always 16:10. It renders the image when one exists.
// Otherwise it is the labelled dither wash ("FIG. 01 · Tokens"): it stays live
// until Onur's image lands in images-src/work/<slug>/, so it must look
// intentional. Server- and client-safe: no manifest import.
export function MediaFigure({ media, sizes, ratio, label, bare = false, fit = false, priority = false, className }: MediaFigureProps) {
  if (media.image) {
    return (
      <PictureView
        image={media.image.key}
        entry={media.image}
        alt={media.caption ?? ""}
        sizes={sizes}
        priority={priority}
        className={cx(
          fit ? "mx-auto max-h-[62dvh] w-auto max-w-full border object-contain" : cx("w-full border object-cover object-top", ratio ?? "aspect-[16/10]"),
          className,
        )}
      />
    );
  }
  return (
    <span
      className={cx(
        "relative block overflow-hidden border",
        fit ? "aspect-[16/10] max-h-[62dvh] w-full max-w-5xl" : cx("w-full", ratio ?? "aspect-[16/10]"),
        className,
      )}
    >
      <PlaceholderWash />
      {bare ? null : (
        <span aria-hidden="true" className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-bg px-1.5 type-label text-fg">
          {label ?? figureLabel(media)}
        </span>
      )}
    </span>
  );
}
