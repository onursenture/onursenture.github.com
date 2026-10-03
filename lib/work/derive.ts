import { ORGS } from "@/content/orgs";
import type { ArchiveEntry, CaseStudy, Credit, Entry, FigmaRef, Link, Media, MediaAspect, Post } from "@/content/work/types";
import type { ImageEntry } from "@/lib/images/plan";

// Pure builders from content (content/work/) to the serialisable views the
// work pages render. No manifest import: the caller passes `lookup`, so client
// code can import these types and helpers.

export type ImageLookup = (key: string) => ImageEntry | undefined;

export interface ViewOptions {
  // Keep `figma` refs on media views. Default true; the site passes
  // workSettings.figmaLinks, and false nulls every ref so no file key or node
  // id reaches the client.
  figmaLinks?: boolean;
}

export interface ResolvedImage extends ImageEntry {
  key: string;
}

export interface MediaView {
  id: string;
  // "FIG. 01" (hero), "FIG. 03.2" (entry figures), "FIG. 04" (archive).
  label: string;
  caption: string;
  aspect: MediaAspect;
  tags: string[];
  credits: Credit[];
  image: ResolvedImage | null;
  figma: FigmaRef | null;
  // The entry (or archive row) it belongs to; null for a case study's hero.
  entryId: string | null;
  // Short owner name for cards: "3.0", "Verona", "Cover".
  group: string;
  // Viewer top line: "3.0 · Nov 2024", or "Cover".
  context: string;
}

export interface EntryView {
  id: string;
  date: string;
  year: string;
  // "Nov"
  month: string;
  // Version, else title, else "Nov 2024".
  heading: string;
  note: string;
  source: string | null;
  links: Link[];
  frameworks: string[];
  credits: Credit[];
  media: MediaView[];
}

export interface YearGroup<T> {
  year: string;
  items: T[];
}

export interface ChipView {
  // "all", an entry id, or a tag.
  key: string;
  label: string;
  count: number;
}

export interface PostView {
  id: string;
  date: string;
  year: string;
  // "7 Nov"
  day: string;
  // "@primevue"
  account: string;
  summary: string;
  url: string;
  entryId: string | null;
}

export interface StudyView {
  slug: string;
  title: string;
  hero: MediaView;
  groups: YearGroup<EntryView>[];
  // The hero, then every entry's media, newest entry first.
  media: MediaView[];
  chips: ChipView[];
  // Related X posts, newest first; the chips filter them by entry.
  posts: YearGroup<PostView>[];
  postCount: number;
  postChips: ChipView[];
}

export interface ArchiveRowView {
  id: string;
  date: string;
  // "Nov 2024"
  monthYear: string;
  title: string;
  note: string;
  source: string;
  credits: Credit[];
  orgName: string;
  media: MediaView | null;
}

export interface ArchiveView {
  groups: YearGroup<ArchiveRowView>[];
  media: MediaView[];
}

export interface CreditGroup {
  role: string;
  people: Credit[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthOf(ym: string): string {
  return MONTHS[Number(ym.slice(5, 7)) - 1];
}

// The accessible-name prefix for a proof link, by where it points: X posts,
// archived blog pages (web.archive.org) or live blog pages (any other host).
export function sourceLabel(href: string): string {
  let host = "";
  try {
    host = new URL(href).hostname.toLowerCase();
  } catch {
    return "Blog post";
  }
  const is = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (is("x.com") || is("twitter.com")) return "Post on X";
  if (is("archive.org")) return "Archived blog post";
  return "Blog post";
}

// "2024-11" → "Nov 2024"
export function formatYearMonth(ym: string): string {
  return `${monthOf(ym)} ${ym.slice(0, 4)}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The manifest key a media slot uses when it has no explicit `image`:
// npm run figma writes images-src/work/<scope>/<id>.png.
export function imageKey(scope: string, mediaId: string): string {
  return `work/${scope}/${mediaId}`;
}

export function resolveImage(scope: string, media: Media, lookup: ImageLookup): ResolvedImage | null {
  const key = media.image ?? imageKey(scope, media.id);
  const entry = lookup(key);
  return entry ? { key, width: entry.width, height: entry.height, widths: entry.widths } : null;
}

function mediaView(
  scope: string,
  media: Media,
  label: string,
  group: string,
  context: string,
  entryId: string | null,
  lookup: ImageLookup,
  figmaLinks: boolean,
): MediaView {
  return {
    id: media.id,
    label,
    caption: media.caption,
    aspect: media.aspect ?? "16/10",
    tags: media.tags ?? [],
    credits: media.credits ?? [],
    image: resolveImage(scope, media, lookup),
    figma: figmaLinks ? (media.figma ?? null) : null,
    entryId,
    group,
    context,
  };
}

export function entryHeading(entry: Entry): string {
  return entry.version ?? entry.title ?? formatYearMonth(entry.date);
}

// FIG ordinals count from the oldest item, so adding a newer entry on top
// never renumbers the existing figures.
export function oldestFirst<T extends { date: string; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function groupByYear<T extends { date: string }>(newestFirst: T[]): YearGroup<T>[] {
  const groups: YearGroup<T>[] = [];
  for (const item of newestFirst) {
    const year = item.date.slice(0, 4);
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.items.push(item);
    else groups.push({ year, items: [item] });
  }
  return groups;
}

// All, then each entry that has media (newest first), then each tag in
// first-seen order. Counts are always computed, never written by hand.
export function chipsFor(media: MediaView[], entries: EntryView[]): ChipView[] {
  const chips: ChipView[] = [{ key: "all", label: "All", count: media.length }];
  for (const entry of entries) {
    if (entry.media.length > 0) chips.push({ key: entry.id, label: entry.heading, count: entry.media.length });
  }
  const tags = new Map<string, number>();
  for (const item of media) for (const tag of item.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
  for (const [tag, count] of tags) chips.push({ key: tag, label: capitalise(tag), count });
  return chips;
}

export function postUrl(post: Post): string {
  return `https://x.com/${post.account}/status/${post.id}`;
}

export function filterPosts(groups: YearGroup<PostView>[], key: string): YearGroup<PostView>[] {
  if (key === "all") return groups;
  return groups
    .map((group) => ({ year: group.year, items: group.items.filter((post) => post.entryId === key) }))
    .filter((group) => group.items.length > 0);
}

export function filterMedia(media: MediaView[], key: string): MediaView[] {
  if (key === "all") return media;
  return media.filter((item) => item.entryId === key || item.tags.includes(key));
}

// The set the viewer steps through: everything from the Log (hero and Log
// figures open the full set), the filtered set from Grid and Index. A fig
// outside the filter (a hand-edited URL) falls back to the full set.
export function viewerItems(media: MediaView[], view: string, tag: string, fig: string | null): MediaView[] {
  if (view === "log" || view === "posts") return media;
  const filtered = filterMedia(media, tag);
  return fig && !filtered.some((item) => item.id === fig) ? media : filtered;
}

export function buildStudyView(study: CaseStudy, lookup: ImageLookup, options: ViewOptions = {}): StudyView {
  const figmaLinks = options.figmaLinks ?? true;
  const ordered = oldestFirst(study.entries);
  const ordinal = new Map(ordered.map((entry, index) => [entry.id, pad2(index + 2)]));
  const entries: EntryView[] = [...ordered].reverse().map((entry) => {
    const heading = entryHeading(entry);
    const context = `${heading} · ${formatYearMonth(entry.date)}`;
    return {
      id: entry.id,
      date: entry.date,
      year: entry.date.slice(0, 4),
      month: monthOf(entry.date),
      heading,
      note: entry.note,
      source: entry.source ?? null,
      links: entry.links ?? [],
      frameworks: entry.frameworks ?? [],
      credits: entry.credits ?? [],
      media: entry.media.map((item, index) =>
        mediaView(study.slug, item, `FIG. ${ordinal.get(entry.id)}.${index + 1}`, heading, context, entry.id, lookup, figmaLinks),
      ),
    };
  });
  const hero = mediaView(study.slug, study.hero, "FIG. 01", "Cover", "Cover", null, lookup, figmaLinks);
  const media = [hero, ...entries.flatMap((entry) => entry.media)];
  const posts: PostView[] = [...(study.posts ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id, "en", { numeric: true }))
    .map((post) => ({
      id: post.id,
      date: post.date,
      year: post.date.slice(0, 4),
      day: `${Number(post.date.slice(8, 10))} ${monthOf(post.date)}`,
      account: `@${post.account}`,
      summary: post.summary,
      url: postUrl(post),
      entryId: post.entryId ?? null,
    }));
  const postChips: ChipView[] = posts.length > 0 ? [{ key: "all", label: "All", count: posts.length }] : [];
  for (const entry of entries) {
    const count = posts.filter((post) => post.entryId === entry.id).length;
    if (count > 0) postChips.push({ key: entry.id, label: entry.heading, count });
  }
  return {
    slug: study.slug,
    title: study.title,
    hero,
    groups: groupByYear(entries),
    media,
    chips: chipsFor(media, entries),
    posts: groupByYear(posts),
    postCount: posts.length,
    postChips,
  };
}

export function buildArchiveView(entries: ArchiveEntry[], lookup: ImageLookup, options: ViewOptions = {}): ArchiveView {
  const figmaLinks = options.figmaLinks ?? true;
  const ordered = oldestFirst(entries);
  const ordinal = new Map(ordered.map((entry, index) => [entry.id, pad2(index + 1)]));
  const rows: ArchiveRowView[] = [...ordered].reverse().map((entry) => {
    const monthYear = formatYearMonth(entry.date);
    return {
      id: entry.id,
      date: entry.date,
      monthYear,
      title: entry.title,
      note: entry.note,
      source: entry.source,
      credits: entry.credits ?? [],
      orgName: ORGS[entry.org].name,
      media: entry.media
        ? mediaView("archive", entry.media, `FIG. ${ordinal.get(entry.id)}`, entry.title, `${entry.title} · ${monthYear}`, entry.id, lookup, figmaLinks)
        : null,
    };
  });
  return { groups: groupByYear(rows), media: rows.flatMap((row) => (row.media ? [row.media] : [])) };
}

// Credits by role, in first-seen order; a missing role means design.
export function groupCredits(credits: Credit[]): CreditGroup[] {
  const groups: CreditGroup[] = [];
  for (const credit of credits) {
    const role = credit.role ? capitalise(credit.role) : "Design";
    const group = groups.find((g) => g.role === role);
    if (group) group.people.push(credit);
    else groups.push({ role, people: [credit] });
  }
  return groups;
}
