import { experience } from "@/content/experience";
import { pinOrder } from "@/content/pins";
import { productPages } from "@/content/work";
import type { WorkSlug } from "@/content/work/types";
import { findImage, hasImage } from "@/lib/images/manifest";
import { type PinView, type ProductPageView, buildPins, buildProductPage } from "./derive";
import { type ExperienceView, resolveExperience } from "./experience";
import { validateWork } from "./validate";

// The server-side read API for the product pages and the home's Selected
// work: content bound to the image manifest. Sprint 7's admin overlay will
// merge its edits here.

// A broken registry fails the build instead of shipping a broken page.
const errors = validateWork(productPages, hasImage);
if (errors.length > 0) throw new Error(`content/work is invalid:\n${errors.join("\n")}`);

export function getProductSlugs(): WorkSlug[] {
  return productPages.map((page) => page.slug);
}

export function getProductPage(slug: string): ProductPageView | null {
  const page = productPages.find((item) => item.slug === slug);
  return page ? buildProductPage(page, findImage) : null;
}

// Every pinned image across the pages, in the pins order.
export function getPins(): PinView[] {
  return buildPins(productPages, pinOrder, findImage);
}

// The home's Experience rows, each product with its year (resolveExperience).
export function getExperience(): ExperienceView[] {
  return resolveExperience(experience, productPages);
}
