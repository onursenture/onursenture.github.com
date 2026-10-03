import Link from "next/link";
import { Picture } from "@/components/picture";
import type { Photo } from "@/lib/content/photos";

// `sizes` must describe the grid below: 3 columns (24px gutters) from md, 2
// columns (16px) on mobile. The shells are full width with 40px side padding
// from md and 16px below, so the default is the /life/photos/ page, where the
// grid fills the padded width: (100vw - 80 - 2 * 24) / 3 from md.
export const PHOTO_GRID_SIZES = "(min-width: 768px) calc((100vw - 128px) / 3), calc((100vw - 48px) / 2)";

// On /life/, the grid is the content of a wide SectionRow. From lg that row
// puts the grid right of a 200px label column and a 28px gap, so the grid
// is 228px narrower: (100vw - 80 - 228 - 2 * 24) / 3.
export const PHOTO_GRID_ROW_SIZES =
  "(min-width: 1024px) calc((100vw - 356px) / 3), (min-width: 768px) calc((100vw - 128px) / 3), calc((100vw - 48px) / 2)";

// Thumbnails linking to each photo page. The visible title names the link,
// so the image itself is decorative (alt="").
export function PhotoGrid({ photos, sizes = PHOTO_GRID_SIZES }: { photos: Photo[]; sizes?: string }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
      {photos.map((photo) => (
        <li key={photo.slug}>
          <Link href={`/life/photos/${photo.slug}/`} className="group flex flex-col gap-2">
            <Picture image={photo.image} alt="" sizes={sizes} className="aspect-[3/2] w-full object-cover" />
            <span className="type-body group-hover:underline group-hover:underline-offset-[0.2em]">{photo.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
