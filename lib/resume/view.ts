import { formatSpan } from "@/content/experience";
import { ORGS, type OrgId } from "@/content/orgs";
import { profile } from "@/content/profile";
import { type ResumeEducation, type ResumeSkill, linkedinUrl } from "@/content/resume";
import type { SiteContent } from "@/lib/content/site";
import { resolveExperience } from "@/lib/work/experience";

// One view of the resume for both the web page and the PDF (Sprint 8 spec
// §1.1): the resume document joined with Experience, which stays the only
// source of an org's name, role, dates and products. Published content fails
// soft like Experience: a part that breaks the rules (data changed underneath)
// warns and is left out; `loose` (the admin preview) does the same quietly.

export interface ResumeLink {
  title: string;
  href?: string;
}

export interface ResumeRoleView {
  org: OrgId;
  orgName: string;
  role: string;
  span: string;
  bullets: string[];
  products: ResumeLink[];
}

export interface ResumeProjectView {
  title: string;
  line: string;
  href?: string;
}

export interface ResumeView {
  name: string;
  role: string;
  place: string;
  email: string | null;
  linkedin: { handle: string; url: string } | null;
  summary: string;
  roles: ResumeRoleView[];
  projects: ResumeProjectView[];
  skills: ResumeSkill[];
  education: ResumeEducation[];
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// A half-filled draft has blank months; formatSpan would print "undefined".
function span(start: string, end: string | null): string {
  return MONTH.test(start) && (end === null || MONTH.test(end)) ? formatSpan(start, end) : "";
}

export function resumeView(site: SiteContent, { loose = false }: { loose?: boolean } = {}): ResumeView {
  const warn = (message: string) => {
    if (!loose) console.warn(`[resume] ${message}`);
  };
  const { resume } = site;
  const orgs = new Set(site.experience.map((entry) => entry.org));
  for (const role of resume.roles) {
    if (!orgs.has(role.org)) warn(`${ORGS[role.org].name} is not in Experience; leaving its bullets out`);
  }
  const bullets = new Map(resume.roles.map((role) => [role.org, role.bullets]));
  const pages = new Set(site.pages.map((page) => `/work/${page.slug}/`));
  const email = resume.contact.email.trim();
  const handle = resume.contact.linkedin.trim();

  return {
    name: profile.name,
    role: profile.role,
    place: profile.location.place,
    email: email || null,
    linkedin: handle ? { handle, url: linkedinUrl(handle) } : null,
    summary: resume.summary.trim(),
    roles: resolveExperience(site.experience, site.pages, { loose }).map((entry) => ({
      org: entry.org,
      orgName: ORGS[entry.org].name,
      role: entry.role,
      span: span(entry.start, entry.end),
      bullets: bullets.get(entry.org) ?? [],
      products: entry.children.map((child) => (child.href ? { title: child.title, href: child.href } : { title: child.title })),
    })),
    projects: resume.projects.map((project) => {
      if (project.href?.startsWith("/") && !pages.has(project.href)) {
        warn(`${project.title} links ${project.href}, which is not a product page; showing it without the link`);
        return { title: project.title, line: project.line };
      }
      return project.href ? { title: project.title, line: project.line, href: project.href } : { title: project.title, line: project.line };
    }),
    skills: resume.skills,
    education: resume.education,
  };
}

// The summary's first sentence: the page's meta description.
export function firstSentence(text: string): string {
  const trimmed = text.trim();
  return /^.*?[.!?](?=\s|$)/.exec(trimmed)?.[0] ?? trimmed;
}
