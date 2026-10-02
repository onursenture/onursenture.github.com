export const TARGET_WIDTHS = [640, 1280, 2560] as const;

// Encodes everything that affects image output. Bump when encoder options or
// widths change so that existing renditions are regenerated.
export const IMAGE_SETTINGS = `v1 avif:q60:4:2:0 jpg:q82:progressive:mozjpeg widths:${TARGET_WIDTHS.join(",")}`;

export interface ImageEntry {
  // Intrinsic size of the largest generated rendition.
  width: number;
  height: number;
  // Generated widths, ascending. Each exists as .avif and .jpg.
  widths: number[];
}

export interface ManifestEntry extends ImageEntry {
  // SHA256 hex of the source file's bytes.
  sourceHash: string;
  // IMAGE_SETTINGS at the time this entry was created.
  settings: string;
}

export type ImageManifest = Record<string, ManifestEntry>;

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

// Determine if a manifest entry is up to date: previous exists, hash and
// settings match, and all outputs exist on disk.
export function isUpToDate(
  previous: ManifestEntry | undefined,
  sourceHash: string,
  settings: string,
  outputsExist: boolean,
): boolean {
  return (
    previous !== undefined &&
    previous.sourceHash === sourceHash &&
    previous.settings === settings &&
    outputsExist
  );
}
