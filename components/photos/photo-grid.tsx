import Link from "next/link";
import { Picture } from "@/components/picture";
import type { Photo } from "@/lib/content/photos";

// `sizes` must describe the grid below: 3 columns (24px gutters) in the
// 1200px container from md, 2 columns (16px) under 16px margins on mobile.
export const PHOTO_GRID_SIZES =
  "(min-width: 1248px) 384px, (min-width: 768px) calc((100vw - 96px) / 3), calc((100vw - 48px) / 2)";

// Thumbnails linking to each photo page. The visible title names the link,
// so the image itself is decorative (alt="").
export function PhotoGrid({ photos }: { photos: Photo[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
      {photos.map((photo) => (
        <li key={photo.slug}>
          <Link href={`/life/photos/${photo.slug}/`} className="group flex flex-col gap-2">
            <Picture image={photo.image} alt="" sizes={PHOTO_GRID_SIZES} className="aspect-[3/2] w-full object-cover" />
            <span className="type-body group-hover:underline group-hover:underline-offset-[0.2em]">{photo.title}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
