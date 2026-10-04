import type { OrgId } from "../orgs";

// Product pages (work rethink, part 2). Content is typed data, read only
// through lib/work/ so Sprint 7's admin can overlay edits in one place. Ids
// are permanent once published: block ids are the anchors Selected work links
// to, and image ids key image files (work/<slug>/<id>) and ?fig= URLs.

// Slugs are kebab-case and permanent once published. Since Sprint 7 the
// admin can create pages, so this is a plain string; validateSite checks it.
export type WorkSlug = string;

// Only designers are credited. href is kept as provenance and NOT rendered
// (PrimeTek pages carry no external links; credits never link anywhere).
export interface Credit { name: string; role?: string; href?: string }

// An external link (https). Orkestra pages only: validateWork rejects links on
// PrimeTek pages.
export interface Link { label: string; href: string }

// Pinned to the home's Selected work. The order lives in the `pins` document
// (content/pins.ts in the repo), not on the image.
export interface Pin {
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
  | { kind: "text"; id: string; heading: string; body: string[]; links?: Link[] }
  | { kind: "images"; id: string; heading?: string; columns?: 1 | 2 | 3; images: WorkImage[] }
  // PrimeIcons only: the live icon set.
  | { kind: "icons"; id: string; heading?: string }
  // Places an old project in its moment: "Then" and the year in the label
  // column, sourced sentences in the 480px column. Always the first block.
  | { kind: "then"; id: string; year: string; body: string[]; sources?: Link[] };

export interface Fact { label: string; value: string }

export interface ProductPage {
  slug: WorkSlug;
  org: OrgId;
  title: string;
  kind: string;
  lead: { strong: string; rest: string };
  intro: string;
  facts: Fact[];
  // Rendered as a "Live" row after the facts while the product still runs.
  links?: Link[];
  blocks: Block[];
}
