import manifestJson from "./manifest.json";
import type { ImageEntry, ImageManifest } from "./plan";

const manifest: ImageManifest = manifestJson;

// Throws for an unknown key so a missing `npm run images` fails the build
// instead of shipping a broken <img>.
export function getImage(key: string): ImageEntry {
  const entry = manifest[key];
  if (!entry) throw new Error(`Unknown image "${key}". Add it under images-src/ and run npm run images.`);
  return entry;
}

export function hasImage(key: string): boolean {
  return key in manifest;
}
