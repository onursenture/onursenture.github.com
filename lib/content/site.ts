import type { z } from "zod";
import { type ExperienceEntry, experience } from "@/content/experience";
import { type LabEntry, labIndex } from "@/content/lab-index";
import { type PinRef, pinOrder } from "@/content/pins";
import { type ProfileCopy, profile } from "@/content/profile";
import { type Resume, resume } from "@/content/resume";
import { productPages } from "@/content/work";
import type { ProductPage } from "@/content/work/types";
import { type DocKey, slugOfKey, workKey } from "./keys";
import {
  experienceSchema,
  labSchema,
  looseExperienceSchema,
  looseLabSchema,
  looseResumeSchema,
  loosePinsSchema,
  looseProductPageSchema,
  looseProfileSchema,
  looseWorkIndexSchema,
  pinsSchema,
  productPageSchema,
  profileSchema,
  resumeSchema,
  workIndexSchema,
} from "./schemas";

// The whole editable site, resolved from document values over the repo
// content (Sprint 7 spec §1.3). Pure: no database, no cache. lib/content/read.ts
// feeds it published values, the preview feeds it drafts.

export interface SiteContent {
  // Registry order (the work-index document).
  pages: ProductPage[];
  pins: PinRef[];
  lab: LabEntry[];
  profile: ProfileCopy;
  experience: ExperienceEntry[];
  resume: Resume;
}

// The part of a stored document resolution needs (ContentDoc extends it).
export interface DocSnapshot {
  key: string;
  draft: unknown;
  published: unknown;
}

// Document key → value. A missing key means "use the repo".
export type DocValues = Map<string, unknown>;

export function repoSite(): SiteContent {
  return { pages: productPages, pins: pinOrder, lab: labIndex, profile: { lead: profile.lead, bio: profile.bio, available: profile.available, bookOnHome: profile.bookOnHome }, experience, resume };
}

// A document's repo value, the editor's starting point when nothing is stored.
// null for a page that only exists in the admin.
export function repoValue(key: DocKey): unknown {
  const slug = slugOfKey(key);
  if (slug !== null) return productPages.find((page) => page.slug === slug) ?? null;
  const repo = repoSite();
  switch (key) {
    case "work-index":
      return { slugs: repo.pages.map((page) => page.slug) };
    case "pins":
      return { order: repo.pins };
    case "lab":
      return repo.lab;
    case "profile":
      return repo.profile;
    case "experience":
      return repo.experience;
    case "resume":
      return repo.resume;
    default:
      return null;
  }
}

// What visitors see: each document's published value.
export function publishedValues(docs: DocSnapshot[]): DocValues {
  return new Map(docs.filter((doc) => doc.published != null).map((doc) => [doc.key, doc.published]));
}

// What the preview shows: each document's draft, else its published value.
export function draftValues(docs: DocSnapshot[]): DocValues {
  return new Map(docs.filter((doc) => (doc.draft ?? doc.published) != null).map((doc) => [doc.key, doc.draft ?? doc.published]));
}

// A stored value that no longer matches its schema is ignored with a warning,
// so one bad row can never take a page down.
function parsed<T>(values: DocValues, key: DocKey, schema: z.ZodType<T>): T | undefined {
  if (!values.has(key)) return undefined;
  const result = schema.safeParse(values.get(key));
  if (result.success) return result.data;
  console.warn(`[content] ${key} does not match its schema; using the repo version`);
  return undefined;
}

// `loose` (the admin preview only) accepts a draft that is the right shape but
// not publishable yet; everything else reads strictly.
export interface ResolveOptions {
  loose?: boolean;
}

export function indexSlugs(values: DocValues, { loose = false }: ResolveOptions = {}): string[] {
  return parsed(values, "work-index", loose ? looseWorkIndexSchema : workIndexSchema)?.slugs ?? productPages.map((page) => page.slug);
}

export function resolvePage(values: DocValues, slug: string, { loose = false }: ResolveOptions = {}): ProductPage | null {
  return parsed(values, workKey(slug), loose ? looseProductPageSchema : productPageSchema) ?? productPages.find((page) => page.slug === slug) ?? null;
}

export function resolveSite(values: DocValues, options: ResolveOptions = {}): SiteContent {
  const loose = options.loose ?? false;
  const repo = repoSite();
  const pages = indexSlugs(values, options).flatMap((slug) => {
    const page = resolvePage(values, slug, options);
    if (!page) console.warn(`[content] work-index lists "${slug}", which has no page`);
    return page ? [page] : [];
  });
  return {
    pages,
    pins: parsed(values, "pins", loose ? loosePinsSchema : pinsSchema)?.order ?? repo.pins,
    lab: parsed(values, "lab", loose ? looseLabSchema : labSchema) ?? repo.lab,
    profile: parsed(values, "profile", loose ? looseProfileSchema : profileSchema) ?? repo.profile,
    experience: parsed(values, "experience", loose ? looseExperienceSchema : experienceSchema) ?? repo.experience,
    resume: parsed(values, "resume", loose ? looseResumeSchema : resumeSchema) ?? repo.resume,
  };
}
