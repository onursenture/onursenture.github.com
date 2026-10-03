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
  // "design" (the default), "illustration"… Only designers are credited.
  role?: string;
  // Kept as provenance, NOT rendered. Onur 2026-10-03: no external links
  // except @w00f posts.
  href?: string;
}

// A link to a Figma frame, shown as "Open in Figma" and the click-to-load
// embed when workSettings.figmaLinks is on. No content sets it: Figma refs
// stay out of the public repo, and `npm run figma` reads its frames from the
// gitignored figma.local.json instead. The type remains for the day links are
// turned on with refs committed deliberately.
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
  // Kebab-case labels: "components", "tokens", "page"… Only "page" is read
  // (Templates counts pages); there is no tag filter any more.
  tags?: string[];
  // An image manifest key. Leave unset: lib/work/ finds work/<slug>/<id>
  // when `npm run figma` (or a hand-placed file) has produced it.
  image?: string;
  // Unused by the content (see FigmaRef).
  figma?: FigmaRef;
  // Defaults to "16/10".
  aspect?: MediaAspect;
}

export interface Link {
  label: string;
  href: string;
}

// Media-grid columns for one release (from md). The default is 1.
export type EntryColumns = 1 | 2 | 3;

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
  // Proof URL, usually an X post. Kept as provenance. Rendered only when it is
  // an x.com/w00f/status/... URL (twitter.com/w00f too); anything else is not
  // shown. Onur 2026-10-03: no external links except @w00f posts.
  source?: string;
  // Live demos and blog posts. Kept as provenance, NOT rendered.
  // Onur 2026-10-03: no external links except @w00f posts.
  links?: Link[];
  // Templates only: "Vue", "Angular", "React", "JSF".
  frameworks?: string[];
  remaster?: boolean; // a remastered or all-new edition of an earlier template (Templates Coverage counts these separately)
  update?: boolean; // a major update to an existing template, not a new one (Templates Coverage counts neither a template nor a remaster)
  credits?: Credit[];
  // How many columns the media grid has from md: 1 (default, one figure per
  // row at the full width of the media column), 2 or 3 (3 is 2 from md and 3
  // from lg). Always 1 below md. Onur sets it per release when he delivers
  // images.
  columns?: EntryColumns;
  media: Media[];
}

export const POST_ACCOUNTS = ["w00f", "primevue", "prime_ng", "primereact", "primefaces"] as const;
export type PostAccount = (typeof POST_ACCOUNTS)[number];

// A post about the project on X. The URL is derived (x.com/<account>/status/<id>);
// only @w00f posts are shown as links.
export interface Post {
  // "YYYY-MM-DD"
  date: string;
  account: PostAccount;
  // The status id (digits only).
  id: string;
  // Our own one-line summary, never the post's text (except @w00f, which may quote Onur).
  summary: string;
  // The entry (a release or a template) it is listed under in the Log.
  entryId: string;
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
  // Kept as provenance, NOT rendered. Onur 2026-10-03: no external links
  // except @w00f posts.
  links: Link[];
  hero: Media;
  // Any order; rendered newest first.
  entries: Entry[];
  // X posts about the project, any order; each is listed under its entry,
  // oldest first. Only @w00f posts are links.
  posts?: Post[];
}

export interface ArchiveEntry {
  // Stable, kebab-case, unique across the archive.
  id: string;
  org: OrgId;
  date: string;
  title: string;
  note: string;
  // Required: the archive is built from the posts that announced the work.
  // Kept as provenance. Rendered only when it is an x.com/w00f/status/... URL;
  // anything else is not shown. Onur 2026-10-03: no external links except
  // @w00f posts.
  source: string;
  credits?: Credit[];
  media?: Media;
}
