// Optimizes source images into responsive AVIF + JPEG renditions.
//
//   npm run images
//
// Reads every .jpg/.jpeg/.png under images-src/, writes
// public/images/<path>-<width>.{avif,jpg}, and records sizes in
// lib/images/manifest.json (keyed by path without extension, e.g.
// "photos/stabilo"). Sources are detected as stale by content hash and
// encoder settings, so re-running with unchanged sources is cheap. Commit
// the outputs and the manifest.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";
import { IMAGE_SETTINGS, isUpToDate, type ImageManifest, widthsFor } from "../lib/images/plan";

// Run from the repo root (npm run images does this).
const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "images-src");
const OUT_DIR = join(ROOT, "public", "images");
const MANIFEST = join(ROOT, "lib", "images", "manifest.json");
const EXTENSIONS = /\.(jpe?g|png)$/i;
const PORTRAIT_OUT = join(OUT_DIR, "portrait-dither.png");
const PORTRAIT_JSON = join(ROOT, "lib", "images", "portrait.json");

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : EXTENSIONS.test(name) ? [path] : [];
  });
}

function computeSourceHash(source: string): string {
  const data = readFileSync(source);
  return createHash("sha256").update(data).digest("hex");
}

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

// Light-on-transparent 1-bit Bayer dither at 96×120 cells, scaled 2× with
// nearest-neighbour so each cell is a crisp 2px block on retina. The page
// shows it at 96×120 CSS px, so the scale is an exact 2 device pixels per cell.
async function ditherPortrait(source: string, out: string) {
  const W = 96;
  const H = 120;
  const { data } = await sharp(source)
    .rotate()
    .resize(W, H, { fit: "cover", position: "attention" })
    .greyscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const lit = data[y * W + x] / 255 > BAYER4[y & 3][x & 3];
      const i = (y * W + x) * 4;
      rgba[i] = rgba[i + 1] = rgba[i + 2] = 237;
      rgba[i + 3] = lit ? 255 : 0;
    }
  }
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .resize(W * 2, H * 2, { kernel: "nearest" })
    .png()
    .toFile(out);
}

async function main() {
  const previous: ImageManifest = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, "utf8"))
    : {};
  const manifest: ImageManifest = {};

  for (const source of walk(SRC_DIR).sort()) {
    const key = relative(SRC_DIR, source).replace(EXTENSIONS, "").split("\\").join("/");
    // The portrait gets its own 1-bit treatment below, not the rendition set.
    if (key === "portrait") continue;
    // rotate() applies EXIF orientation so width/height match what is shown.
    const meta = await sharp(source).rotate().metadata();
    const sourceWidth = meta.autoOrient?.width ?? meta.width;
    const sourceHeight = meta.autoOrient?.height ?? meta.height;
    if (!sourceWidth || !sourceHeight) throw new Error(`Cannot read size of ${source}`);

    const widths = widthsFor(sourceWidth);
    const outputs = widths.flatMap((w) =>
      (["avif", "jpg"] as const).map((f) => join(OUT_DIR, `${key}-${w}.${f}`)),
    );

    const sourceHash = computeSourceHash(source);
    const outputsExist = outputs.every((o) => existsSync(o));

    if (isUpToDate(previous[key], sourceHash, IMAGE_SETTINGS, outputsExist)) {
      manifest[key] = previous[key];
      console.log(`skip  ${key}`);
      continue;
    }

    mkdirSync(dirname(join(OUT_DIR, key)), { recursive: true });
    for (const w of widths) {
      const resized = sharp(source).rotate().resize({ width: w, withoutEnlargement: true });
      await resized
        .clone()
        .avif({ quality: 60, chromaSubsampling: "4:2:0" })
        .toFile(join(OUT_DIR, `${key}-${w}.avif`));
      await resized
        .clone()
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toFile(join(OUT_DIR, `${key}-${w}.jpg`));
    }

    const largest = widths[widths.length - 1];
    manifest[key] = {
      width: largest,
      height: Math.round((sourceHeight * largest) / sourceWidth),
      widths,
      sourceHash,
      settings: IMAGE_SETTINGS,
    };
    console.log(`wrote ${key} (${widths.join(", ")})`);
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  const portrait = ["jpg", "jpeg", "png"].map((ext) => join(SRC_DIR, `portrait.${ext}`)).find((p) => existsSync(p));
  if (portrait) {
    mkdirSync(OUT_DIR, { recursive: true });
    await ditherPortrait(portrait, PORTRAIT_OUT);
    writeFileSync(PORTRAIT_JSON, `${JSON.stringify({ src: "/images/portrait-dither.png", width: 192, height: 240 }, null, 2)}\n`);
    console.log("wrote portrait-dither.png");
  } else {
    writeFileSync(PORTRAIT_JSON, "null\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
