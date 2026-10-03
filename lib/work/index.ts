import { experience } from "@/content/experience";
import { archive, caseStudies } from "@/content/work";
import { workSettings } from "@/content/work/settings";
import type { CaseStudy, Fact, WorkSlug } from "@/content/work/types";
import { findImage } from "@/lib/images/manifest";
import { type ArchiveView, type StudyView, buildArchiveView, buildStudyView } from "./derive";
import { type WorkIndexGroup, buildWorkIndex } from "./index-groups";

// The server-side read API for the work pages: content bound to the image
// manifest. Sprint 7's admin overlay will merge its edits here.

export function getCaseStudies(): CaseStudy[] {
  return caseStudies;
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}

export function getStudyView(study: CaseStudy): StudyView {
  return buildStudyView(study, findImage, { figmaLinks: workSettings.figmaLinks });
}

export function getArchiveView(): ArchiveView {
  return buildArchiveView(archive, findImage, { figmaLinks: workSettings.figmaLinks });
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// The header facts, plus computed ones. Templates counts its templates and
// remasters (entries marked `remaster`; entries marked `update` are in neither
// count) and pages (media tagged "page"), so the numbers are always true.
export function caseStudyFacts(study: CaseStudy, view: StudyView): Fact[] {
  if (study.slug !== "templates") return study.facts;
  const pages = view.media.filter((item) => item.tags.includes("page")).length;
  const remasters = study.entries.filter((entry) => entry.remaster).length;
  const updates = study.entries.filter((entry) => entry.update).length;
  const originals = study.entries.length - remasters - updates;
  const value = [
    plural(originals, "template"),
    remasters > 0 ? plural(remasters, "remaster") : null,
    pages > 0 ? plural(pages, "page") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return [...study.facts, { label: "Coverage", value }];
}

export function getWorkIndexGroups(): WorkIndexGroup[] {
  return buildWorkIndex(caseStudies, archive, experience);
}

// The home Work tiles show a case study's hero once it has an image.
export function heroImageKey(slug: WorkSlug): string | undefined {
  const study = getCaseStudy(slug);
  return study ? (getStudyView(study).hero.image?.key ?? undefined) : undefined;
}
