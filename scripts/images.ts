// Optimizes source images into responsive AVIF + JPEG renditions.
//
//   npm run images
//
// Reads every .jpg/.jpeg/.png under images-src/, writes
// public/images/<path>-<width>.{avif,jpg}, and records sizes in
// lib/images/manifest.json (keyed by path without extension, e.g.
// "photos/stabilo"). Sources whose renditions are newer than the source are
// skipped, so re-running is cheap. Commit the outputs and the manifest.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";
import { type ImageManifest, widthsFor } from "../lib/images/plan";

// Run from the repo root (npm run images does this).
const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "images-src");
const OUT_DIR = join(ROOT, "public", "images");
const MANIFEST = join(ROOT, "lib", "images", "manifest.json");
const EXTENSIONS = /\.(jpe?g|png)$/i;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : EXTENSIONS.test(name) ? [path] : [];
  });
}

function isFresh(source: string, outputs: string[]): boolean {
  const sourceTime = statSync(source).mtimeMs;
  return outputs.every((o) => existsSync(o) && statSync(o).mtimeMs >= sourceTime);
}

async function main() {
  const previous: ImageManifest = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, "utf8"))
    : {};
  const manifest: ImageManifest = {};

  for (const source of walk(SRC_DIR).sort()) {
    const key = relative(SRC_DIR, source).replace(EXTENSIONS, "").split("\\").join("/");
    // rotate() applies EXIF orientation so width/height match what is shown.
    const meta = await sharp(source).rotate().metadata();
    const sourceWidth = meta.autoOrient?.width ?? meta.width;
    const sourceHeight = meta.autoOrient?.height ?? meta.height;
    if (!sourceWidth || !sourceHeight) throw new Error(`Cannot read size of ${source}`);

    const widths = widthsFor(sourceWidth);
    const outputs = widths.flatMap((w) =>
      (["avif", "jpg"] as const).map((f) => join(OUT_DIR, `${key}-${w}.${f}`)),
    );

    if (previous[key] && isFresh(source, outputs)) {
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
    };
    console.log(`wrote ${key} (${widths.join(", ")})`);
  }

  writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
