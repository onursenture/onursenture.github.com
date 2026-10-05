import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PictureView } from "@/components/picture-view";
import { ItemLink } from "@/components/sections/item-link";
import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";
import { type Photo, adjacentPhotos, getPhoto, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import { PLACEHOLDER_PHOTO_SLUG } from "@/lib/photos/slug";
import { photoAlt, photoDay } from "@/lib/photos/types";

// The picture spans the full-width shell: 40px side padding from md, 16px below.
const SIZES = "(min-width: 768px) calc(100vw - 80px), calc(100vw - 32px)";

// generateStaticParams must return one param under cacheComponents. "_" is
// never a slug, so with no photos its page is a 404. A photo published after
// the build renders on demand and is cached under PHOTOS_TAG, like a new note.
export async function generateStaticParams() {
  const slugs = (await getPhotos()).map((photo) => ({ slug: photo.slug }));
  return slugs.length > 0 ? slugs : [{ slug: PLACEHOLDER_PHOTO_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/life/photos/[slug]">): Promise<Metadata> {
  const photo = await getPhoto((await params).slug);
  if (!photo) return {};
  // Social crawlers don't reliably render AVIF: always the largest JPEG.
  const ogImage = {
    url: renditionUrl(photo.image.key, photo.image.width, "jpg", photo.image.baseUrl),
    width: photo.image.width,
    height: photo.image.height,
    alt: photoAlt(photo),
  };
  return pageMetadata(photo.title, {
    description: photo.title,
    openGraph: { type: "article", description: photo.title, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  });
}

function Neighbour({ label, photo, align }: { label: string; photo: Photo | null; align: "left" | "right" }) {
  if (!photo) return <div />;
  return (
    <div className={align === "right" ? "flex flex-col items-end gap-1 text-right" : "flex flex-col gap-1"}>
      <MetaLabel>{label}</MetaLabel>
      <ItemLink href={`/life/photos/${photo.slug}/`} className="type-body">
        {photo.title}
      </ItemLink>
    </div>
  );
}

export default async function PhotoPage({ params }: PageProps<"/life/photos/[slug]">) {
  const { slug } = await params;
  const photos = await getPhotos();
  const photo = photos.find((p) => p.slug === slug);
  if (!photo) notFound();
  const { previous, next } = adjacentPhotos(photos, slug);

  return (
    <main className="flex flex-col gap-8 px-4 pt-8 pb-16 md:px-10 md:pt-12">
      <PictureView image={photo.image.key} entry={photo.image} alt={photoAlt(photo)} sizes={SIZES} priority />
      <div className="flex flex-col gap-3">
        <h1 className="type-name uppercase">{photo.title}</h1>
        <p className="type-meta text-fg-muted">
          <time dateTime={photoDay(photo)}>{formatDate(photoDay(photo))}</time>
          {photo.camera ? ` · ${photo.camera}` : null}
        </p>
        <p className="type-meta">
          <TextLink href="/life/photos/">All photos</TextLink>
        </p>
      </div>
      <nav aria-label="More photos" className="grid grid-cols-2 gap-6 border-t pt-4">
        <Neighbour label="← Previous" photo={previous} align="left" />
        <Neighbour label="Next →" photo={next} align="right" />
      </nav>
    </main>
  );
}
