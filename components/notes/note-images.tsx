import { PictureView } from "@/components/picture-view";
import { cx } from "@/lib/cx";
import type { NoteImage } from "@/lib/notes/types";
import { frameRatio } from "@/lib/notes/views";

// One image spans the column; two to four sit two across. In lists each frame
// keeps the image's ratio clamped to 4:5–2:1 and crops to fill; `full` (the
// note's page) shows every image whole at its own ratio.
export function NoteImages({ images, full = false }: { images: NoteImage[]; full?: boolean }) {
  const single = images.length === 1;
  const sizes = single ? "(min-width: 1024px) 480px, calc(100vw - 32px)" : "(min-width: 1024px) 240px, calc(50vw - 20px)";
  return (
    <div className={cx("grid gap-1", !single && "grid-cols-2")}>
      {images.map((image, index) => (
        <div
          key={`${index}-${image.key}`}
          className="overflow-hidden border"
          style={full ? undefined : { aspectRatio: String(frameRatio(image.width, image.height)) }}
        >
          <PictureView image={image.key} entry={image} alt={image.alt} sizes={sizes} className={full ? "block h-auto w-full" : "block h-full w-full object-cover"} />
        </div>
      ))}
    </div>
  );
}
