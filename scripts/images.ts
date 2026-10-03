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
const AVATAR_SRC = join(SRC_DIR, "avatar.webp");
const AVATAR_JSON = join(ROOT, "lib", "images", "avatar.json");
// The avatar shows at 96 CSS px; 192px is its 2x rendition.
const AVATAR_SIZE = 96;
const AVATAR_PX = AVATAR_SIZE * 2;

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

// The illustrated avatar (images-src/avatar.webp, full colour) as a fixed
// 192x192 WebP + AVIF pair, written next to a small JSON the Avatar component
// imports. `null` when there is no source.
async function writeAvatar() {
  if (!existsSync(AVATAR_SRC)) {
    writeFileSync(AVATAR_JSON, "null\n");
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  const resized = sharp(AVATAR_SRC).rotate().resize(AVATAR_PX, AVATAR_PX, { fit: "cover" });
  await resized.clone().webp({ quality: 80 }).toFile(join(OUT_DIR, `avatar-${AVATAR_PX}.webp`));
  await resized.clone().avif({ quality: 80 }).toFile(join(OUT_DIR, `avatar-${AVATAR_PX}.avif`));
  const data = { webp: `/images/avatar-${AVATAR_PX}.webp`, avif: `/images/avatar-${AVATAR_PX}.avif`, size: AVATAR_SIZE };
  writeFileSync(AVATAR_JSON, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`wrote avatar-${AVATAR_PX}.{webp,avif}`);
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

  await writeAvatar();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
