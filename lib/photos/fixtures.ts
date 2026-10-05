import { findImage } from "@/lib/images/manifest";
import { type Photo, type PhotoImage, bySiteOrder } from "./types";

// Fixture mode (SOURCE_FIXTURES=1): three published photos so the photo pages
// build and test without a database. Their images are repo fixtures
// (images-src/fixtures/) at three ratios. Dev and CI only.

function image(key: string): PhotoImage {
  const entry = findImage(key);
  if (!entry) throw new Error(`fixture image ${key} is not in the manifest`);
  return { key, width: entry.width, height: entry.height, widths: entry.widths };
}

function photo(n: number, slug: string, title: string, takenAt: string, camera: string, key: string, alt = ""): Photo {
  const at = `${takenAt}.000Z`;
  return {
    id: `00000000-0000-4000-8000-00000000000${n}`,
    slug,
    title,
    alt,
    takenAt,
    camera,
    image: image(key),
    exif: { takenAt, camera },
    status: "published",
    publishedAt: at,
    createdAt: at,
    updatedAt: at,
  };
}

export function fixturePhotos(): Photo[] {
  return [
    photo(1, "stabilo", "Stabilo", "2026-04-11T12:00:00", "iPhone 17", "fixtures/photo-portrait"),
    photo(2, "kizilcikli", "Kızılcıklı", "2026-08-17T18:42:10", "Fujifilm X100VI", "fixtures/photo-landscape", "Evening light over a hillside village"),
    photo(3, "night-boulevard", "Night Boulevard", "2026-09-12T21:40:00", "iPhone 17 Pro", "fixtures/photo-wide"),
  ].sort(bySiteOrder);
}
