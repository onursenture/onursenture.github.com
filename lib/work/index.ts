import { archive, caseStudies } from "@/content/work";
import type { CaseStudy, Fact } from "@/content/work/types";
import { findImage } from "@/lib/images/manifest";
import { type ArchiveView, type StudyView, buildArchiveView, buildStudyView } from "./derive";

// The server-side read API for the work pages: content bound to the image
// manifest. Sprint 7's admin overlay will merge its edits here.

export function getCaseStudies(): CaseStudy[] {
  return caseStudies;
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}

export function getStudyView(study: CaseStudy): StudyView {
  return buildStudyView(study, findImage);
}

export function getArchiveView(): ArchiveView {
  return buildArchiveView(archive, findImage);
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// The header facts, plus computed ones. Templates counts its templates and
// their pages (media tagged "page"), so the numbers are always true.
export function caseStudyFacts(study: CaseStudy, view: StudyView): Fact[] {
  if (study.slug !== "templates") return study.facts;
  const pages = view.media.filter((item) => item.tags.includes("page")).length;
  const templates = plural(study.entries.length, "template");
  return [...study.facts, { label: "Coverage", value: pages > 0 ? `${templates} · ${plural(pages, "page")}` : templates }];
}
