export const TARGET_WIDTHS = [640, 1280, 2560] as const;

export interface ImageEntry {
  // Intrinsic size of the largest generated rendition.
  width: number;
  height: number;
  // Generated widths, ascending. Each exists as .avif and .jpg.
  widths: number[];
}

export type ImageManifest = Record<string, ImageEntry>;

// Widths to generate for a source of the given width: every target that
// fits, plus the source width itself when it is smaller than the largest
// target (so we never upscale and the full resolution is always available).
export function widthsFor(sourceWidth: number): number[] {
  const fitting = TARGET_WIDTHS.filter((w) => w <= sourceWidth);
  const largest = TARGET_WIDTHS[TARGET_WIDTHS.length - 1];
  if (sourceWidth < largest && !fitting.includes(sourceWidth as never)) {
    return [...fitting, sourceWidth];
  }
  return [...fitting];
}

// "photos/stabilo" + 640 + "avif" → "/images/photos/stabilo-640.avif"
export function renditionUrl(key: string, width: number, format: "avif" | "jpg"): string {
  return `/images/${key}-${width}.${format}`;
}

export function srcSet(key: string, entry: ImageEntry, format: "avif" | "jpg"): string {
  return entry.widths.map((w) => `${renditionUrl(key, w, format)} ${w}w`).join(", ");
}
