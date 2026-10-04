import type { LabEntry } from "@/content/lab-index";
import type { ProfileCopy } from "@/content/profile";
import type { SiteContent } from "@/lib/content/site";
import { type ImageLookup, type PinView, type ProductPageView, buildPins, buildProductPage } from "./derive";
import { type ExperienceView, resolveExperience } from "./experience";

// Pure views over a resolved site. lib/work/index.ts applies them to the
// published site; the admin preview applies them to drafts.

export function productSlugs(site: SiteContent): string[] {
  return site.pages.map((page) => page.slug);
}

export function productPageView(site: SiteContent, slug: string, lookup: ImageLookup): ProductPageView | null {
  const page = site.pages.find((item) => item.slug === slug);
  return page ? buildProductPage(page, lookup) : null;
}

export function pinViews(site: SiteContent, lookup: ImageLookup): PinView[] {
  return buildPins(site.pages, site.pins, lookup);
}

export function experienceViews(site: SiteContent, options: { loose?: boolean } = {}): ExperienceView[] {
  return resolveExperience(site.experience, site.pages, options);
}

// Everything the Work home renders that the admin edits.
export interface HomeContent {
  profile: ProfileCopy;
  lab: LabEntry[];
  pins: PinView[];
  experience: ExperienceView[];
}

export function homeContent(site: SiteContent, lookup: ImageLookup, options: { loose?: boolean } = {}): HomeContent {
  return { profile: site.profile, lab: site.lab, pins: pinViews(site, lookup), experience: experienceViews(site, options) };
}
