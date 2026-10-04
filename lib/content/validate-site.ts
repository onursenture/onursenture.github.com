import type { z } from "zod";
import { ORGS } from "@/content/orgs";
import { validateWork } from "@/lib/work/validate";
import type { Issue } from "./issues";
import { type DocKey, KEBAB, workKey } from "./keys";
import type { SiteContent } from "./site";

// Publish-time checks over a whole would-be site (Sprint 7 spec §1.5):
// validateWork's per-page rules plus the rules that span documents.

const LINE = /^([a-z0-9-]+)(?:\/([^:]+))?: (.+)$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A LinkedIn public profile handle: letters, digits and hyphens.
const LINKEDIN_HANDLE = /^[A-Za-z0-9-]{3,100}$/;

// validateWork reports "slug/block/image: message"; place it in its document.
export function workIssue(line: string): Issue {
  const match = LINE.exec(line);
  if (!match) return { doc: "work-index", at: "", message: line };
  return { doc: workKey(match[1]), at: match[2] ?? "", message: match[3] };
}

// A blank required string is the common mistake: say so instead of zod's
// "Too small: expected string to have >=1 characters". Custom messages stay.
function zodMessage(issue: z.ZodError["issues"][number]): string {
  if (issue.code === "too_small" && issue.origin === "string" && issue.minimum === 1) return "is required";
  return issue.message;
}

export function zodIssues(doc: DocKey, error: z.ZodError): Issue[] {
  return error.issues.map((issue) => ({ doc, at: issue.path.map(String).join("/"), message: zodMessage(issue) }));
}

export function validateSite(site: SiteContent, hasImage: (key: string) => boolean): Issue[] {
  const issues = validateWork(site.pages, hasImage).map(workIssue);

  for (const page of site.pages) {
    if (!KEBAB.test(page.slug)) issues.push({ doc: workKey(page.slug), at: "slug", message: `slug "${page.slug}" is not kebab-case` });
  }

  const pinned = new Set<string>();
  site.pins.forEach((ref, index) => {
    const id = `${ref.slug}/${ref.imageId}`;
    if (pinned.has(id)) issues.push({ doc: "pins", at: String(index), message: `${id} is listed twice` });
    pinned.add(id);
  });

  // One entry per org: the resume's roles, the editors and React keys are
  // keyed by it, so a second entry for an org is refused.
  const experienceListed = new Set<string>();
  site.experience.forEach((entry, i) => {
    if (experienceListed.has(entry.org)) issues.push({ doc: "experience", at: `${i}/org`, message: `${ORGS[entry.org].name} is listed twice` });
    experienceListed.add(entry.org);
    if (entry.end && entry.end < entry.start) issues.push({ doc: "experience", at: `${i}/end`, message: "the end is before the start" });
    entry.children.forEach((child, j) => {
      const at = `${i}/children/${j}`;
      if (child.href) {
        const page = site.pages.find((item) => `/work/${item.slug}/` === child.href);
        if (!page) {
          issues.push({ doc: "experience", at, message: `${child.title} links ${child.href}, which is not a product page` });
        } else if (!page.facts.some((fact) => fact.label === "Years" && fact.value.trim())) {
          issues.push({ doc: workKey(page.slug), at: "facts", message: "Experience links this page, so it needs a Years fact" });
        }
      } else if (!child.years?.trim()) {
        issues.push({ doc: "experience", at, message: `${child.title} needs a page or its own years` });
      }
    });
  });

  site.lab.forEach((entry, index) => {
    if (entry.href && !entry.href.startsWith("https://")) issues.push({ doc: "lab", at: `${index}/href`, message: `link "${entry.href}" must be https` });
  });

  site.profile.bio.forEach((paragraph, index) => {
    for (const segment of paragraph) {
      if (typeof segment !== "string") continue;
      for (const match of segment.matchAll(/\{([^}]*)\}/g)) {
        issues.push({ doc: "profile", at: `bio/${index}`, message: `unknown organisation "{${match[1]}}"` });
      }
    }
  });

  // The resume (Sprint 8 spec §1.3). Checked on every publish, so publishing
  // Experience without an org the resume uses is refused too. A role uses its
  // org only when it has bullets: to drop an org from Experience, clear its
  // bullets on the resume and publish that first. The messages say where to
  // act, since an Experience publish or a page delete shows them too.
  const { resume } = site;
  const experienceOrgs = new Set(site.experience.map((entry) => entry.org));
  const listed = new Set<string>();
  resume.roles.forEach((role, index) => {
    const name = ORGS[role.org].name;
    if (role.bullets.length > 0 && !experienceOrgs.has(role.org)) issues.push({ doc: "resume", at: `roles/${index}`, message: `${name} has bullets on the resume but is not in Experience; clear them on the resume first` });
    if (listed.has(role.org)) issues.push({ doc: "resume", at: `roles/${index}`, message: `${name} is listed twice` });
    listed.add(role.org);
  });
  if (resume.contact.email && !EMAIL.test(resume.contact.email)) {
    issues.push({ doc: "resume", at: "contact/email", message: "is not an email address" });
  }
  if (resume.contact.linkedin && !LINKEDIN_HANDLE.test(resume.contact.linkedin)) {
    issues.push({ doc: "resume", at: "contact/linkedin", message: "use the handle (linkedin.com/in/<handle>), not the URL" });
  }
  resume.projects.forEach((project, index) => {
    if (!project.href) return;
    const at = `projects/${index}/href`;
    if (project.href.startsWith("/")) {
      if (!site.pages.some((page) => `/work/${page.slug}/` === project.href)) issues.push({ doc: "resume", at, message: `${project.href} is not a product page; change it on the resume first` });
    } else if (!project.href.startsWith("https://")) {
      issues.push({ doc: "resume", at, message: `link "${project.href}" must be https` });
    }
  });

  return issues;
}
