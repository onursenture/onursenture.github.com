import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "@/components/picture";
import { getPhoto, getPhotos } from "@/lib/content/photos";
import { formatDate } from "@/lib/format";
import { getImage } from "@/lib/images/manifest";
import { renditionUrl } from "@/lib/images/plan";

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
  return {
    title: photo.title,
    description: photo.title,
    openGraph: { title: photo.title, description: photo.title, type: "article", images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  };
}

export default async function PhotoPage({ params }: PageProps<"/[view]/photos/[slug]">) {
  const photo = await getPhoto((await params).slug);
  if (!photo) notFound();
  return (
    <main className="py-8">
      <Picture image={photo.image} alt={photo.title} priority />
      <h1 className="text-xl font-bold">{photo.title}</h1>
      <p>
        <time dateTime={photo.date}>{formatDate(photo.date)}</time>
        {photo.camera ? ` · ${photo.camera}` : null}
      </p>
    </main>
  );
}
