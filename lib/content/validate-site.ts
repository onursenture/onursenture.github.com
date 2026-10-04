import type { z } from "zod";
import { validateWork } from "@/lib/work/validate";
import type { Issue } from "./issues";
import { type DocKey, KEBAB, workKey } from "./keys";
import type { SiteContent } from "./site";

// Publish-time checks over a whole would-be site (Sprint 7 spec §1.5):
// validateWork's per-page rules plus the rules that span documents.

const LINE = /^([a-z0-9-]+)(?:\/([^:]+))?: (.+)$/;

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

  site.experience.forEach((entry, i) => {
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

  return issues;
}
