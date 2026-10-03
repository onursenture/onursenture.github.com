import { type ExperienceEntry, formatSpan } from "@/content/experience";
import { ORGS, type OrgId } from "@/content/orgs";
import type { ArchiveEntry, CaseStudy } from "@/content/work/types";

export interface WorkIndexRow {
  years: string;
  title: string;
  kind: string;
  href: string;
}

export interface WorkIndexGroup {
  org: OrgId;
  role: string;
  span: string;
  site?: string;
  rows: WorkIndexRow[];
}

function yearSpan(dates: string[]): string {
  const years = dates.map((date) => date.slice(0, 4)).sort();
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? first : `${first}–${last}`;
}

// /work/ (spec §5): one group per org that has ready case studies, in the
// order those first appear. Its Archive line, if any, comes last.
export function buildWorkIndex(studies: CaseStudy[], archive: ArchiveEntry[], experience: ExperienceEntry[]): WorkIndexGroup[] {
  const orgs = [...new Set(studies.map((study) => study.org))];
  return orgs.map((org) => {
    const role = experience.find((entry) => entry.org === org);
    const rows: WorkIndexRow[] = studies
      .filter((study) => study.org === org)
      .map((study) => ({ years: study.years, title: study.title, kind: study.kind, href: `/work/${study.slug}/` }));
    const archived = archive.filter((entry) => entry.org === org);
    if (archived.length > 0) {
      rows.push({ years: yearSpan(archived.map((entry) => entry.date)), title: "Archive", kind: "everything else", href: "/work/archive/" });
    }
    return {
      org,
      role: role?.role ?? "",
      span: role ? formatSpan(role.start, role.end) : "",
      site: ORGS[org].site,
      rows,
    };
  });
}
