import { getImage } from "@/lib/images/manifest";
import { renditionUrl, srcSet } from "@/lib/images/plan";

// Responsive AVIF + JPEG <picture> for an image produced by `npm run images`.
// `image` is the manifest key, e.g. "photos/stabilo".
export function Picture({
  image,
  alt,
  sizes = "100vw",
  priority = false,
  className,
}: {
  image: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const entry = getImage(image);
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(image, entry, "avif")} sizes={sizes} />
      <img
        src={renditionUrl(image, entry.width, "jpg")}
        srcSet={srcSet(image, entry, "jpg")}
        sizes={sizes}
        width={entry.width}
        height={entry.height}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
