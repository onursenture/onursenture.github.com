import { ORGS } from "@/content/orgs";
import type { ArchiveEntry, CaseStudy, Credit, Entry, EntryColumns, FigmaRef, Media, MediaAspect, Post } from "@/content/work/types";
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
  // The proof URL, only when it is an @w00f post (see w00fPostUrl); else null.
  source: string | null;
  frameworks: string[];
  credits: Credit[];
  // Media-grid columns from md; 1 unless the entry says otherwise.
  columns: EntryColumns;
  media: MediaView[];
  // The entry's posts, oldest first.
  posts: PostView[];
}

export interface YearGroup<T> {
  year: string;
  items: T[];
}

export interface PostView {
  id: string;
  // "Nov 7, 2024"
  display: string;
  // "@primevue"
  account: string;
  summary: string;
  // x.com/w00f/status/<id> for an @w00f post; null for any other account
  // (shown as plain text, with no link).
  url: string | null;
}

export interface StudyView {
  slug: string;
  title: string;
  hero: MediaView;
  groups: YearGroup<EntryView>[];
  // The hero, then every entry's media, newest entry first.
  media: MediaView[];
}

export interface ArchiveRowView {
  id: string;
  date: string;
  // "Nov 2024"
  monthYear: string;
  title: string;
  note: string;
  // Only an @w00f post URL (see w00fPostUrl); else null.
  source: string | null;
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

const W00F_POST = /^https:\/\/(?:x|twitter)\.com\/w00f\/status\/\d+(?:[/?#]|$)/i;

// Onur 2026-10-03: no external links on the work pages except his own @w00f
// posts. A proof URL is shown only when it is one of those.
export function w00fPostUrl(href: string | undefined): string | null {
  return href && W00F_POST.test(href) ? href : null;
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
  context: string,
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

export function postUrl(post: Post): string {
  return `https://x.com/${post.account}/status/${post.id}`;
}

// "2024-11-07" → "Nov 7, 2024"
function formatDay(day: string): string {
  return `${monthOf(day)} ${Number(day.slice(8, 10))}, ${day.slice(0, 4)}`;
}

// Oldest first; the same day orders by status id ascending.
function postsOldestFirst(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id, "en", { numeric: true }));
}

export function buildStudyView(study: CaseStudy, lookup: ImageLookup, options: ViewOptions = {}): StudyView {
  const figmaLinks = options.figmaLinks ?? true;
  const ordered = oldestFirst(study.entries);
  const ordinal = new Map(ordered.map((entry, index) => [entry.id, pad2(index + 2)]));
  const posts = postsOldestFirst(study.posts ?? []);
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
      source: w00fPostUrl(entry.source),
      frameworks: entry.frameworks ?? [],
      credits: entry.credits ?? [],
      columns: entry.columns ?? 1,
      media: entry.media.map((item, index) =>
        mediaView(study.slug, item, `FIG. ${ordinal.get(entry.id)}.${index + 1}`, context, lookup, figmaLinks),
      ),
      posts: posts
        .filter((post) => post.entryId === entry.id)
        .map((post) => ({
          id: post.id,
          display: formatDay(post.date),
          account: `@${post.account}`,
          summary: post.summary,
          url: post.account === "w00f" ? postUrl(post) : null,
        })),
    };
  });
  const hero = mediaView(study.slug, study.hero, "FIG. 01", "Cover", lookup, figmaLinks);
  return {
    slug: study.slug,
    title: study.title,
    hero,
    groups: groupByYear(entries),
    media: [hero, ...entries.flatMap((entry) => entry.media)],
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
      source: w00fPostUrl(entry.source),
      credits: entry.credits ?? [],
      orgName: ORGS[entry.org].name,
      media: entry.media
        ? mediaView("archive", entry.media, `FIG. ${ordinal.get(entry.id)}`, `${entry.title} · ${monthYear}`, lookup, figmaLinks)
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
