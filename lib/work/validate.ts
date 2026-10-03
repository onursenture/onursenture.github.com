import { type ArchiveEntry, type CaseStudy, type Credit, type Media, POST_ACCOUNTS } from "@/content/work/types";

// Registry checks, run by tests/content/work.test.ts in CI. Returns every
// problem as a readable line instead of throwing at the first one.

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DIGITS = /^\d+$/;
const NODE_ID = /^\d+:\d+$/;

function isDay(value: string): boolean {
  const match = DAY.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateWork(
  studies: CaseStudy[],
  archive: ArchiveEntry[],
  hasImage: (key: string) => boolean,
): string[] {
  const errors: string[] = [];

  const url = (where: string, href: string) => {
    if (!href.startsWith("https://")) errors.push(`${where}: "${href}" must be https`);
  };
  const date = (where: string, value: string) => {
    if (!YEAR_MONTH.test(value)) errors.push(`${where}: date "${value}" must be YYYY-MM`);
  };
  const credits = (where: string, list: Credit[] = []) => {
    for (const credit of list) if (credit.href) url(where, credit.href);
  };
  const media = (where: string, item: Media, seen: Set<string>, chipKeys: Set<string>) => {
    if (!KEBAB.test(item.id)) errors.push(`${where}: media id "${item.id}" is not kebab-case`);
    if (seen.has(item.id)) errors.push(`${where}: duplicate media id "${item.id}"`);
    seen.add(item.id);
    if (item.image && !hasImage(item.image)) errors.push(`${where}: image "${item.image}" is not in the manifest`);
    if (item.figma && !NODE_ID.test(item.figma.nodeId)) {
      errors.push(`${where}: figma nodeId "${item.figma.nodeId}" must look like 12:345`);
    }
    for (const tag of item.tags ?? []) {
      if (!KEBAB.test(tag)) errors.push(`${where}: tag "${tag}" is not kebab-case`);
      else if (chipKeys.has(tag)) errors.push(`${where}: tag "${tag}" collides with a chip key`);
    }
    credits(where, item.credits);
  };

  const slugs = new Set<string>();
  for (const study of studies) {
    if (slugs.has(study.slug)) errors.push(`duplicate slug "${study.slug}"`);
    slugs.add(study.slug);
    for (const link of study.links) url(`${study.slug} link`, link.href);

    const entryIds = new Set<string>();
    for (const entry of study.entries) {
      const where = `${study.slug}/${entry.id}`;
      if (!KEBAB.test(entry.id)) errors.push(`${where}: entry id "${entry.id}" is not kebab-case`);
      if (entryIds.has(entry.id)) errors.push(`${where}: duplicate entry id "${entry.id}"`);
      entryIds.add(entry.id);
    }
    // Tags share the ?tag= namespace with "all" and the entry ids.
    const chipKeys = new Set(["all", ...entryIds]);
    const mediaIds = new Set<string>();
    media(`${study.slug} hero`, study.hero, mediaIds, chipKeys);
    for (const entry of study.entries) {
      const where = `${study.slug}/${entry.id}`;
      date(where, entry.date);
      if (entry.source) url(where, entry.source);
      for (const link of entry.links ?? []) url(where, link.href);
      credits(where, entry.credits);
      for (const item of entry.media) media(where, item, mediaIds, chipKeys);
    }

    const postIds = new Set<string>();
    for (const post of study.posts ?? []) {
      const where = `${study.slug}/post ${post.id}`;
      if (!isDay(post.date)) errors.push(`${where}: post date "${post.date}" must be YYYY-MM-DD`);
      if (!DIGITS.test(post.id)) errors.push(`${where}: post id "${post.id}" must be digits`);
      if (!(POST_ACCOUNTS as readonly string[]).includes(post.account)) {
        errors.push(`${where}: post account "${post.account}" is not one of ${POST_ACCOUNTS.join(", ")}`);
      }
      if (postIds.has(post.id)) errors.push(`${where}: duplicate post id "${post.id}"`);
      postIds.add(post.id);
      if (post.entryId && !entryIds.has(post.entryId)) errors.push(`${where}: entryId "${post.entryId}" is not an entry of ${study.slug}`);
    }
  }

  const archiveIds = new Set<string>();
  const archiveMedia = new Set<string>();
  for (const row of archive) {
    const where = `archive/${row.id}`;
    if (!KEBAB.test(row.id)) errors.push(`${where}: archive id "${row.id}" is not kebab-case`);
    if (archiveIds.has(row.id)) errors.push(`${where}: duplicate archive id "${row.id}"`);
    archiveIds.add(row.id);
    date(where, row.date);
    url(where, row.source);
    credits(where, row.credits);
    if (row.media) media(where, row.media, archiveMedia, new Set(["all"]));
  }

  return errors;
}
