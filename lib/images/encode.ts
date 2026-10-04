import sharp from "sharp";

// Decoding bombs: refuse originals past this many pixels (16384 x 10240).
export const MAX_INPUT_PIXELS = 16384 * 10240;

// An original already decoded to raw pixels (and rotated), so several
// renditions can be cut from it without decoding the file again.
export interface Decoded {
  data: Buffer;
  width: number;
  height: number;
  channels: 1 | 2 | 3 | 4;
}

// Decodes once, scaled down to at most `width` (never enlarged).
export async function decodeOnce(input: Buffer | string, width: number): Promise<Decoded> {
  const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

function open(input: Buffer | string | Decoded) {
  if (typeof input === "string" || Buffer.isBuffer(input)) return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  return sharp(input.data, { raw: { width: input.width, height: input.height, channels: input.channels } });
}

// The one encoder behind `npm run images` and admin uploads. IMAGE_SETTINGS
// (plan.ts) names these options; change both together.
export async function encodeRendition(input: Buffer | string | Decoded, width: number, format: "avif" | "jpg"): Promise<Buffer> {
  const resized = open(input).resize({ width, withoutEnlargement: true });
  return format === "avif"
    ? resized.avif({ quality: 60, chromaSubsampling: "4:2:0" }).toBuffer()
    : resized.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
}
