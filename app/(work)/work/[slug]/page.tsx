import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPageBody } from "@/components/work/product-page-body";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import { getProductPage, getProductSlugs } from "@/lib/work";
import { getPrimeIcons } from "@/lib/work/primeicons";

// One page per product, built from blocks (work rethink spec §4). Unknown
// slugs 404 inside the Work shell, like unknown photos.
export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const page = await getProductPage((await params).slug);
  if (!page) return {};
  const description = `${page.lead.strong} ${page.lead.rest}`;
  // The first block image that has a real image; none while all are placeholders.
  const first = page.images.find((image) => image.image)?.image;
  if (!first) return pageMetadata(page.title, { description, openGraph: { description } });
  // Social crawlers don't reliably render AVIF: always the largest JPEG.
  const ogImage = { url: renditionUrl(first.key, first.width, "jpg", first.baseUrl), width: first.width, height: first.height, alt: page.title };
  return pageMetadata(page.title, {
    description,
    openGraph: { type: "article", description, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  });
}

export default async function ProductPage({ params }: PageProps<"/work/[slug]">) {
  const page = await getProductPage((await params).slug);
  if (!page) notFound();
  // The icons block renders PrimeIcons' real set, read from the pinned package.
  const icons = page.blocks.some((block) => block.kind === "icons") ? await getPrimeIcons() : undefined;
  return <ProductPageBody page={page} icons={icons} />;
}
