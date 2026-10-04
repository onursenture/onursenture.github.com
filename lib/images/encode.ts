import sharp from "sharp";

// The one encoder behind `npm run images` and admin uploads. IMAGE_SETTINGS
// (plan.ts) names these options; change both together.
export async function encodeRendition(input: Buffer | string, width: number, format: "avif" | "jpg"): Promise<Buffer> {
  const resized = sharp(input).rotate().resize({ width, withoutEnlargement: true });
  return format === "avif"
    ? resized.avif({ quality: 60, chromaSubsampling: "4:2:0" }).toBuffer()
    : resized.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
}
