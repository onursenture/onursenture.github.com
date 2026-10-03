import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "@/components/picture";
import { PageHeader } from "@/components/shell/page-header";
import { MetaLabel } from "@/components/ui/meta-label";
import { TextLink } from "@/components/ui/text-link";
import { type Photo, adjacentPhotos, getPhoto, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { getImage } from "@/lib/images/manifest";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import { assertView } from "@/lib/view/params";
import type { View } from "@/lib/view/views";

// The picture spans the content column: the 1200px site container, or the
// dashboard column beside the 240px sidebar (24px padding each side).
const SIZES: Record<View, string> = {
  site: "(min-width: 1248px) 1200px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)",
  dashboard: "(min-width: 768px) calc(100vw - 288px), calc(100vw - 32px)",
};

export async function generateStaticParams() {
  return (await getPhotos()).map((photo) => ({ slug: photo.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[view]/photos/[slug]">): Promise<Metadata> {
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
      <TextLink href={`/photos/${photo.slug}/`} className="type-sans-14">
        {photo.title}
      </TextLink>
    </div>
  );
}

export default async function PhotoPage({ params }: PageProps<"/[view]/photos/[slug]">) {
  const { view: viewParam, slug } = await params;
  const view = assertView(viewParam);
  const photos = await getPhotos();
  const photo = photos.find((p) => p.slug === slug);
  if (!photo) notFound();
  const { previous, next } = adjacentPhotos(photos, slug);
  const details = [formatDate(photo.date), photo.camera].filter(Boolean).join(" · ");

  const picture = <Picture image={photo.image} alt={photo.title} sizes={SIZES[view]} priority />;
  const neighbours = (
    <nav aria-label="More photos" className="grid grid-cols-2 gap-6 border-t pt-4">
      <Neighbour label="Previous" photo={previous} align="left" />
      <Neighbour label="Next" photo={next} align="right" />
    </nav>
  );

  if (view === "dashboard") {
    return (
      <main>
        <PageHeader view="dashboard" title={photo.title} meta={details} />
        <div className="flex flex-col gap-6 p-4 md:p-6">
          {picture}
          {neighbours}
        </div>
      </main>
    );
  }
  return (
    <main className="flex flex-col gap-8 pt-8 pb-24 md:pt-12">
      {picture}
      <div className="flex flex-col gap-3">
        <h1 className="type-display-40">{photo.title}</h1>
        <p className="type-mono-12 text-fg-muted">
          <time dateTime={photo.date}>{formatDate(photo.date)}</time>
          {photo.camera ? ` · ${photo.camera}` : null}
        </p>
      </div>
      {neighbours}
    </main>
  );
}
