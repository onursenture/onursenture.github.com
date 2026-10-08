import Link from "next/link";
import { PictureView } from "@/components/picture-view";
import { COVER_GRID } from "@/components/ui/cover";
import type { Photo } from "@/lib/photos/types";

// `sizes` must describe the grid below: 3 columns (24px gutters) from md, 2
// columns (16px) on mobile. The shells are full width with 40px side padding
// from md and 16px below, so the default is the /life/photos/ page, where the
// grid fills the padded width: (100vw - 80 - 2 * 24) / 3 from md.
export const PHOTO_GRID_SIZES = "(min-width: 768px) calc((100vw - 128px) / 3), calc((100vw - 48px) / 2)";

// On /life/, the grid is the content of a wide SectionRow in the compact
// density: 10 columns (16px gutters) from md, 4 (12px) on mobile. From lg the
// row puts the grid right of a 200px label column and a 28px gap, so it is
// 80 + 228 = 308px narrower than the viewport; from md it is 80px narrower,
// and 32px below.
export const PHOTO_GRID_COMPACT_SIZES =
  "(min-width: 1024px) calc((100vw - 308px - 9 * 16px) / 10), (min-width: 768px) calc((100vw - 80px - 9 * 16px) / 10), calc((100vw - 32px - 3 * 12px) / 4)";

// Thumbnails linking to each photo page. The visible title names the link,
// so the image itself is decorative (alt=""). `compact` is the /life/ row:
// the same dense grid as the covers and a one-line title.
export function PhotoGrid({
  photos,
  sizes = PHOTO_GRID_SIZES,
  density = "default",
  eager = 0,
}: {
  photos: Pick<Photo, "slug" | "title" | "image">[];
  sizes?: string;
  density?: "default" | "compact";
  // How many leading photos load eagerly (the page's first row).
  eager?: number;
}) {
  const compact = density === "compact";
  return (
    <ul className={compact ? COVER_GRID : "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6"}>
      {photos.map((photo, index) => (
        <li key={photo.slug}>
          <Link href={`/life/photos/${photo.slug}/`} className={compact ? "group flex flex-col gap-1" : "group flex flex-col gap-2"}>
            <PictureView
              image={photo.image.key}
              entry={photo.image}
              alt=""
              sizes={sizes}
              priority={index < eager}
              className={compact ? "mb-1 aspect-[3/2] w-full object-cover" : "aspect-[3/2] w-full object-cover"}
            />
            <span
              className={
                compact
                  ? "type-label truncate text-fg group-hover:underline group-hover:underline-offset-[0.2em]"
                  : "type-body group-hover:underline group-hover:underline-offset-[0.2em]"
              }
            >
              {photo.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
