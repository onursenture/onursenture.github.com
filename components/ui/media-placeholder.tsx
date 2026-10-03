import { Picture } from "@/components/picture";
import { cx } from "@/lib/cx";
import { PlaceholderWash } from "./dither";

const ASPECT = { "4/3": "aspect-[4/3]", "16/9": "aspect-[16/9]", "3/2": "aspect-[3/2]" } as const;

// A media slot. Until an image exists it renders a labelled dither wash,
// designed to look intentional because it stays live for a while; Sprint 7's
// admin upload sets `image` per slot.
export function MediaPlaceholder({
  label,
  index,
  aspect = "4/3",
  tone = "accent",
  image,
  sizes = "(min-width: 1024px) 234px, 50vw",
}: {
  label: string;
  index: number;
  aspect?: keyof typeof ASPECT;
  tone?: "accent" | "ink";
  image?: string;
  sizes?: string;
}) {
  if (image) {
    return <Picture image={image} alt="" sizes={sizes} className={cx("w-full border object-cover", ASPECT[aspect])} />;
  }
  return (
    <div className={cx("relative w-full overflow-hidden border", ASPECT[aspect])}>
      <PlaceholderWash tone={tone} />
      <span aria-hidden="true" className="absolute bottom-2 left-2 bg-bg px-1.5 type-label text-fg">
        FIG. {String(index).padStart(2, "0")} · {label}
      </span>
    </div>
  );
}
