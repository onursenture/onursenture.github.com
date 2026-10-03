import type { OrgId } from "../orgs";

// Sprint 5 case studies. Content is typed data, read only through lib/work/
// so Sprint 7's admin can overlay edits in one place. Ids are permanent once
// published: they key image files (work/<slug>/<media id>) and ?fig= URLs.

export type WorkSlug = "primeone" | "primeblocks" | "primeicons" | "templates";

export type MediaAspect = "16/9" | "16/10" | "4/3" | "1/1";

// A collaborator credited on an entry or a single media item. Onur led all
// PrimeTek design, so his role is stated once per case study (facts); credits
// name the others where they designed a piece.
export interface Credit {
  name: string;
  // "design" (the default), "illustration", "implementation"…
  role?: string;
  href?: string;
}

export interface FigmaRef {
  // From figma.com/design/<fileKey>/…
  fileKey: string;
  // "12:345" (a URL's node-id=12-345, normalised).
  nodeId: string;
  // Offer the click-to-load embed in the viewer (the file must be shared as
  // "anyone with the link can view").
  embed?: boolean;
}

export interface Media {
  // Stable, kebab-case, unique within its case study.
  id: string;
  caption: string;
  credits?: Credit[];
  // Grid filter tags, kebab-case: "components", "tokens", "page"…
  tags?: string[];
  // An image manifest key. Leave unset: lib/work/ finds work/<slug>/<id>
  // when `npm run figma` (or a hand-placed file) has produced it.
  image?: string;
  figma?: FigmaRef;
  // Defaults to "16/10".
  aspect?: MediaAspect;
}

export interface Link {
  label: string;
  href: string;
}

export interface Fact {
  label: string;
  value: string;
}

export interface Entry {
  // Stable, kebab-case, unique within its case study, e.g. "3-0".
  id: string;
  // "YYYY-MM"
  date: string;
  version?: string;
  // Used when there is no version, e.g. a template's name.
  title?: string;
  // One or two sentences; must be supported by `source`.
  note: string;
  // Proof URL, usually an X post.
  source?: string;
  links?: Link[];
  // Templates only: "Vue", "Angular", "React", "JSF".
  frameworks?: string[];
  remaster?: boolean; // a remastered or all-new edition of an earlier template (Templates Coverage counts these separately)
  credits?: Credit[];
  media: Media[];
}

export interface CaseStudy {
  slug: WorkSlug;
  org: OrgId;
  title: string;
  // "design system", "UI blocks", "icon set", "app templates"
  kind: string;
  // "2022–2026"
  years: string;
  lead: { strong: string; rest: string };
  intro: string[];
  facts: Fact[];
  // Action column; external links get ↗.
  links: Link[];
  hero: Media;
  // Any order; rendered newest first.
  entries: Entry[];
}

export interface ArchiveEntry {
  // Stable, kebab-case, unique across the archive.
  id: string;
  org: OrgId;
  date: string;
  title: string;
  note: string;
  // Required: the archive is built from the posts that announced the work.
  source: string;
  credits?: Credit[];
  media?: Media;
}
