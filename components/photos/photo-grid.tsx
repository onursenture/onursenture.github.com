import Link from "next/link";
import { Picture } from "@/components/picture";
import type { Photo } from "@/lib/content/photos";
import { cx } from "@/lib/cx";
import type { View } from "@/lib/view/views";

// `sizes` must describe the grid below. Site: 3 columns (24px gutters) in
// the 1200px container from md, 2 columns (16px) under 16px margins on
// mobile. Dashboard: 4 columns (16px gutters) in the content column beside
// the 240px sidebar, with 24px padding.
export const PHOTO_GRID_SIZES: Record<View, string> = {
  site: "(min-width: 1248px) 384px, (min-width: 768px) calc((100vw - 96px) / 3), calc((100vw - 48px) / 2)",
  dashboard: "(min-width: 768px) calc((100vw - 336px) / 4), calc((100vw - 48px) / 2)",
};

// Thumbnails linking to each photo page. The visible title names the link,
// so the image itself is decorative (alt="").
export function PhotoGrid({ photos, view }: { photos: Photo[]; view: View }) {
  return (
    <ul
      className={cx(
        "grid grid-cols-2 gap-x-4 gap-y-8",
        view === "dashboard" ? "md:grid-cols-4" : "md:grid-cols-3 md:gap-x-6",
      )}
    >
      {photos.map((photo) => (
        <li key={photo.slug}>
          <Link href={`/photos/${photo.slug}/`} className="group flex flex-col gap-2">
            <Picture
              image={photo.image}
              alt=""
              sizes={PHOTO_GRID_SIZES[view]}
              className="aspect-[3/2] w-full object-cover"
            />
            <span className="type-sans-14 group-hover:underline group-hover:underline-offset-[0.2em]">
              {photo.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
