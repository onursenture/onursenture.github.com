import { type ImageEntry, renditionUrl, srcSet } from "@/lib/images/plan";

// Responsive AVIF + JPEG <picture> from a manifest entry the caller already
// has. It doesn't import the manifest, so client components can use it with
// entries resolved on the server (lib/work/).
export function PictureView({
  image,
  entry,
  alt,
  sizes = "100vw",
  priority = false,
  className,
}: {
  image: string;
  entry: ImageEntry;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
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
