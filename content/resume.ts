import type { OrgId } from "./orgs";

// The resume (Sprint 8 spec §1.1). Organisation, role and dates are not here:
// they come from the Experience document, so the home and the resume can't
// disagree. Only confirmed facts (LinkedIn, the research notes, the approved
// Sprint 6 numbers); Onur rewrites the copy in /admin/resume/.

export interface ResumeRole {
  org: OrgId;
  bullets: string[];
}

export interface ResumeProject {
  title: string;
  line: string;
  // /work/<slug>/ for a product page, else an https URL.
  href?: string;
}

export interface ResumeSkill {
  group: string;
  // One line: "Design systems, Figma, icons".
  items: string;
}

export interface ResumeEducation {
  degree: string;
  school: string;
  years?: string;
}

export interface Resume {
  contact: {
    // Blank hides it.
    email: string;
    // The handle; the URL is https://www.linkedin.com/in/<handle>/. Blank hides it.
    linkedin: string;
  };
  // Blank hides the row.
  summary: string;
  roles: ResumeRole[];
  projects: ResumeProject[];
  skills: ResumeSkill[];
  education: ResumeEducation[];
}

export function linkedinUrl(handle: string): string {
  return `https://www.linkedin.com/in/${handle}/`;
}

export const resume: Resume = {
  contact: { email: "", linkedin: "onursenture" },
  summary:
    "Designer who builds. Ten years leading design at PrimeTek, where I built the PrimeOne design system, PrimeBlocks, PrimeIcons and the templates behind PrimeVue, PrimeNG and PrimeReact. Since 2013 I've also run Orkestra Studios, making iOS games and apps end to end.",
  roles: [
    {
      org: "orkestra",
      bullets: [
        "Co-founded the studio in 2013, carrying on from the Gonna team.",
        "Designed iOS games and apps including Nebuu, Rebound Line, Hi Jump and İmparator.",
        "Nebuu reached #1 in Turkish word games (2014); count.do passed 300k users (Dec 2014).",
      ],
    },
    {
      org: "primetek",
      bullets: [
        "Built PrimeOne, the Figma design system behind PrimeVue, PrimeNG and PrimeReact.",
        "Designed PrimeBlocks, PrimeIcons and 25+ premium application templates.",
        "Designed PrimeStore and Theme Designer, a visual theme editor for the Prime libraries.",
      ],
    },
    {
      org: "etiya",
      bullets: ["Designed Telaura Suite, Ofisim.com and Somemto."],
    },
  ],
  projects: [
    { title: "PrimeOne", line: "The Figma design system behind PrimeVue, PrimeNG and PrimeReact.", href: "/work/primeone/" },
    { title: "Theme Designer", line: "A visual theme editor for the Prime libraries.", href: "/work/theme-designer/" },
    { title: "Nebuu", line: "A word-guessing party game, #1 in Turkish word games (2014).", href: "/work/nebuu/" },
    {
      title: "onursenture.com",
      line: "This site — designed in Figma, built in Next.js with an AI-agent workflow.",
      href: "https://github.com/onursenture/onursenture.github.com",
    },
  ],
  skills: [
    { group: "Design", items: "Design systems, Figma, UI kits, icons, product design" },
    { group: "Build", items: "Next.js, TypeScript, AI-agent workflows" },
    { group: "Platforms", items: "Web, iOS" },
  ],
  education: [{ degree: "BS Computer Science", school: "Bilkent University" }],
};
