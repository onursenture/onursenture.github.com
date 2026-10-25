import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import sharp from "sharp";

// A fresh store and the upload fixtures per run, starting with a 16:10 PNG and a 4:3 one.
export default async function globalSetup() {
  rmSync(".e2e-admin", { recursive: true, force: true });
  mkdirSync(".e2e-admin/fixtures", { recursive: true });
  const solid = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#2F55F5" } }).png();
  await solid(1280, 800).toFile(".e2e-admin/fixtures/wide.png");
  await solid(1600, 1200).toFile(".e2e-admin/fixtures/four-three.png");
  // Photos (Sprint 11): a JPEG with EXIF (camera, date and GPS) and one too small.
  copyFileSync("tests/fixtures/photos/exif-gps.jpg", ".e2e-admin/fixtures/exif-gps.jpg");
  await solid(800, 600).toFile(".e2e-admin/fixtures/small.png");
  // HEIC (sharp can't write it): an iPhone-style rotated photo and a 16:10 one.
  copyFileSync("tests/fixtures/photos/rotated.heic", ".e2e-admin/fixtures/rotated.heic");
  copyFileSync("tests/fixtures/photos/wide.heic", ".e2e-admin/fixtures/wide.heic");
}
