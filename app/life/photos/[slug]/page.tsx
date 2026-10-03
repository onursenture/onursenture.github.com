import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "@/components/picture";
import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";
import { type Photo, adjacentPhotos, getPhoto, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { getImage } from "@/lib/images/manifest";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";

// The picture spans the content column: the 1200px site container.
const SIZES = "(min-width: 1248px) 1200px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)";

export async function generateStaticParams() {
  return (await getPhotos()).map((photo) => ({ slug: photo.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/life/photos/[slug]">): Promise<Metadata> {
  const photo = await getPhoto((await params).slug);
  if (!photo) return {};
  const image = getImage(photo.image);
  // Social crawlers don't reliably render AVIF: always the largest JPEG.
  const ogImage = {
    url: renditionUrl(photo.image, image.width, "jpg"),
    width: image.width,
    height: image.height,
    alt: photo.title,
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
      <TextLink href={`/life/photos/${photo.slug}/`} className="type-body">
        {photo.title}
      </TextLink>
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
    <main className="flex flex-col gap-8 px-4 pt-8 pb-24 md:px-10 md:pt-12">
      <Picture image={photo.image} alt={photo.title} sizes={SIZES} priority />
      <div className="flex flex-col gap-3">
        <h1 className="type-lead">{photo.title}</h1>
        <p className="type-meta text-fg-muted">
          <time dateTime={photo.date}>{formatDate(photo.date)}</time>
          {photo.camera ? ` · ${photo.camera}` : null}
        </p>
      </div>
      <nav aria-label="More photos" className="grid grid-cols-2 gap-6 border-t pt-4">
        <Neighbour label="Previous" photo={previous} align="left" />
        <Neighbour label="Next" photo={next} align="right" />
      </nav>
    </main>
  );
}
