import type { ExperienceEntry } from "@/content/experience";
import type { OrgId } from "@/content/orgs";
import type { Resume, ResumeRole } from "@/content/resume";
import type { DocEditorInit } from "./results";

// What the resume editor needs (Sprint 8 spec §4.1). Plain data, so a server
// page can hand it to the client editor.
export interface ResumeEditorData {
  init: DocEditorInit<Resume>;
  // The live Experience orgs, in order: one Roles card each.
  roles: { org: OrgId; name: string; role: string; span: string }[];
  // "Add from…": product pages and Lab entries with a link.
  sources: { kind: "Page" | "Lab"; title: string; href: string }[];
}

// The resume's roles follow Experience: one per org, in Experience order,
// keeping the bullets the resume already has. A role for an org no longer in
// Experience is dropped, so the editor only ever saves valid orgs.
export function alignRoles(roles: ResumeRole[], experience: ExperienceEntry[]): ResumeRole[] {
  const bullets = new Map(roles.map((role) => [role.org, role.bullets]));
  return experience.map((entry) => ({ org: entry.org, bullets: bullets.get(entry.org) ?? [] }));
}
