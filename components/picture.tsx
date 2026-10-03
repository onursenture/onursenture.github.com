import { getImage } from "@/lib/images/manifest";
import { PictureView } from "./picture-view";

// Responsive AVIF + JPEG <picture> for an image produced by `npm run images`.
// `image` is the manifest key, e.g. "photos/stabilo". Throws for an unknown
// key (getImage), so a missing `npm run images` fails the build.
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
  return (
    <PictureView image={image} entry={getImage(image)} alt={alt} sizes={sizes} priority={priority} className={className} />
  );
}
