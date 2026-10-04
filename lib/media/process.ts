import { createHash } from "node:crypto";
import sharp from "sharp";
import type { MediaRecord } from "@/lib/content/store";
import { MAX_INPUT_PIXELS, decodeOnce, encodeRendition } from "@/lib/images/encode";
import { IMAGE_SETTINGS, widthsFor } from "@/lib/images/plan";
import { checkDimensions } from "./rules";
import type { MediaStorage } from "./storage";

export interface UploadTarget {
  slug: string;
  imageId: string;
}

// Where the renditions go and which sizes are accepted: product pages use
// 16:10 under media/work/ (processImage), notes any ratio under media/notes/.
export interface ProcessOptions {
  key: (sourceHash: string) => string;
  check: (width: number, height: number) => string | null;
}

// Checks an uploaded original and renders its renditions (the same widths and
// encoder as `npm run images`) into storage. Nothing is written for a
// rejected file; the caller records the returned MediaRecord.
export async function processImageWith(
  input: Buffer,
  options: ProcessOptions,
  storage: MediaStorage,
  now: Date,
): Promise<{ ok: true; record: MediaRecord } | { ok: false; reason: string }> {
  let width: number | undefined;
  let height: number | undefined;
  let format: string | undefined;
  try {
    const meta = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate().metadata();
    width = meta.autoOrient?.width ?? meta.width;
    height = meta.autoOrient?.height ?? meta.height;
    format = meta.format;
  } catch {
    return { ok: false, reason: "The file is not a readable image." };
  }
  if (!width || !height) return { ok: false, reason: "The file is not a readable image." };
  if (format !== "png" && format !== "jpeg") return { ok: false, reason: "Use a PNG or JPEG." };
  const problem = options.check(width, height);
  if (problem) return { ok: false, reason: problem };

  const sourceHash = createHash("sha256").update(input).digest("hex");
  const key = options.key(sourceHash);
  const widths = widthsFor(width);
  const largest = widths[widths.length - 1];
  // One decode, scaled to the largest rendition; every rendition is cut from it.
  let decoded;
  try {
    decoded = await decodeOnce(input, largest);
  } catch {
    return { ok: false, reason: "The file is not a readable image." };
  }
  let baseUrl = "";
  for (const w of widths) {
    for (const ext of ["avif", "jpg"] as const) {
      const suffix = `-${w}.${ext}`;
      const url = await storage.putFile(`${key}${suffix}`, await encodeRendition(decoded, w, ext), ext === "avif" ? "image/avif" : "image/jpeg");
      baseUrl = url.slice(0, -suffix.length);
    }
  }
  return {
    ok: true,
    record: { key, baseUrl, width: largest, height: Math.round((height * largest) / width), widths, sourceHash, settings: IMAGE_SETTINGS, createdAt: now },
  };
}

export function processImage(input: Buffer, target: UploadTarget, storage: MediaStorage, now: Date) {
  return processImageWith(input, { key: (hash) => `media/work/${target.slug}/${target.imageId}-${hash.slice(0, 8)}`, check: checkDimensions }, storage, now);
}
