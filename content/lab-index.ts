// Things Onur builds, in display order. While the list is empty the Lab band
// and panel don't render.
export interface LabEntry {
  title: string;
  description: string;
  year?: string;
  href?: string;
  // ● live, ◐ wip.
  status?: "live" | "wip";
  // Data only, not rendered: marks an approved placeholder to replace with a
  // real project.
  placeholder?: boolean;
}

export const labIndex: LabEntry[] = [
  {
    title: "onursenture.com",
    description: "This site — designed in Figma, built in Next.js with an AI-agent workflow.",
    year: "2026",
    href: "https://github.com/onursenture/onursenture.github.com",
    status: "wip",
  },
  { title: "Project 02", description: "Details coming soon.", status: "wip", placeholder: true },
  { title: "Project 03", description: "Details coming soon.", status: "wip", placeholder: true },
];
