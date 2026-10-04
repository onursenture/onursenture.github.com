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
  {
    title: "Cehennem Rebirth",
    description:
      "An unofficial revival of Cehennem Online, the Turkish internet community started in December 1998, rebuilt as a modern forum with editor-reviewed news and docs.",
    year: "2026",
    href: "https://cehennem-rebirth.vercel.app/",
  },
  {
    title: "count.do Remastered",
    description: "Orkestra's 2013 countdown app, remastered.",
    year: "2026",
    href: "https://countdo.orkestra.co/",
  },
  {
    title: "Motif",
    description: "A carpet-pattern generator for Tanerman's stage visuals.",
    year: "2026",
    href: "https://motif.tanerman.com/",
  },
  {
    title: "tanerman.com",
    description: "Homepage for the producer and DJ Tanerman: dates, bio, booking.",
    year: "2026",
    href: "https://tanerman.com/",
  },
  {
    title: "Dönerverse",
    description: "A clicker game, inspired by Clicking Bad, that grows one knife and one skewer into a global, then orbital, döner empire.",
    year: "2026",
    href: "https://donerverse.vercel.app/",
  },
  {
    title: "Nebuu Deck Studio",
    description: "An internal tool for improving Nebuu's word-card decks.",
    year: "2026",
    href: "https://studio.nebuu.com/",
  },
];
