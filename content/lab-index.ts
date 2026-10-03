// Things Onur builds, in display order (add new ones at the end). While the list is empty the Lab row
// doesn't render.
export interface LabEntry {
  title: string;
  description: string;
  year?: string;
  href?: string;
}

export const labIndex: LabEntry[] = [
  {
    title: "onursenture.com",
    description: "This site — designed in Figma, built in Next.js with an AI-agent workflow.",
    year: "2026",
    href: "https://github.com/onursenture/onursenture.github.com",
  },
];
