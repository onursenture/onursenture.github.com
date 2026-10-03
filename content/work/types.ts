import type { OrgId } from "../orgs";

// Product pages (work rethink, part 2). Content is typed data, read only
// through lib/work/ so Sprint 7's admin can overlay edits in one place. Ids
// are permanent once published: block ids are the anchors Selected work links
// to, and image ids key image files (work/<slug>/<id>) and ?fig= URLs.

export type WorkSlug = "primeone" | "primeblocks" | "primeicons" | "templates";

// Only designers are credited. href is kept as provenance and NOT rendered
// (no external links on /work/**).
export interface Credit { name: string; role?: string; href?: string }

// Pinned to the home's Selected work.
export interface Pin {
  // Display order on the home, unique across all pins.
  order: number;
  title: string;
  // One line of context.
  note: string;
}

export interface WorkImage {
  // Stable, kebab-case, unique within its page; keys the image file
  // (work/<slug>/<id>) and ?fig= URLs.
  id: string;
  caption?: string;
  credits?: Credit[];
  // Manifest key. Unset: lib/work finds work/<slug>/<id>, else a placeholder.
  image?: string;
  pin?: Pin;
}

export type Block =
  | { kind: "text"; id: string; heading: string; body: string[] }
  | { kind: "images"; id: string; heading?: string; columns?: 1 | 2 | 3; images: WorkImage[] }
  // PrimeIcons only: the live icon set.
  | { kind: "icons"; id: string; heading?: string };

export interface Fact { label: string; value: string }

export interface ProductPage {
  slug: WorkSlug;
  org: OrgId;
  title: string;
  kind: string;
  lead: { strong: string; rest: string };
  intro: string;
  facts: Fact[];
  blocks: Block[];
}
