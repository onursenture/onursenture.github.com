import { getPublishedContent } from "@/lib/content/read";
import { repoSite } from "@/lib/content/site";
import { formatIssue } from "@/lib/content/issues";
import { validateSite } from "@/lib/content/validate-site";
import { lookupWith } from "@/lib/images/lookup";
import { hasImage } from "@/lib/images/manifest";
import type { PinView, ProductPageView } from "./derive";
import { type HomeContent, homeContent, pinViews, productPageView, productSlugs } from "./views";

// The server-side read API for the product pages and the Work home: the
// published site (lib/content/read.ts: admin documents over the repo content)
// bound to the image manifest and uploaded media.

// The repo content is the seed and the fallback, so it must stay valid: a
// broken registry fails the build instead of shipping a broken page.
const issues = validateSite(repoSite(), hasImage);
if (issues.length > 0) throw new Error(`content is invalid:\n${issues.map(formatIssue).join("\n")}`);

export async function getProductSlugs(): Promise<string[]> {
  return productSlugs((await getPublishedContent()).site);
}

export async function getProductPage(slug: string): Promise<ProductPageView | null> {
  const { site, media } = await getPublishedContent();
  return productPageView(site, slug, lookupWith(media));
}

export async function getPins(): Promise<PinView[]> {
  const { site, media } = await getPublishedContent();
  return pinViews(site, lookupWith(media));
}

export async function getHomeContent(): Promise<HomeContent> {
  const { site, media } = await getPublishedContent();
  return homeContent(site, lookupWith(media));
}
