import type { WorkSlug } from "./work/types";

// The home page's selected work, in display order; the first four are tiles.
// Each tile links to its case study and shows the case study's hero once it
// has an image (lib/work heroImageKey). Only confirmed facts: no headline
// numbers here.
export interface WorkEntry {
  title: string;
  meta?: string;
  slug?: WorkSlug;
  href?: string;
}

export const workIndex: WorkEntry[] = [
  { title: "PrimeOne", meta: "design system", slug: "primeone", href: "/work/primeone/" },
  { title: "PrimeBlocks", meta: "UI blocks", slug: "primeblocks", href: "/work/primeblocks/" },
  { title: "PrimeIcons", meta: "icon set", slug: "primeicons", href: "/work/primeicons/" },
  { title: "Templates", meta: "app templates", slug: "templates", href: "/work/templates/" },
  { title: "Nebuu", meta: "ongoing, Orkestra" },
];
