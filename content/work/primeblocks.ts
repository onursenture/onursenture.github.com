import type { CaseStudy } from "./types";

// Draft (Sprint 5, Task 3); see primeone.ts.
export const primeblocks: CaseStudy = {
  slug: "primeblocks",
  org: "primetek",
  title: "PrimeBlocks",
  kind: "UI blocks",
  years: "2022–2025",
  lead: {
    strong: "PrimeBlocks.",
    rest: "Ready-made UI blocks for the Prime libraries, designed in Figma and kept in sync with the code.",
  },
  intro: ["Application and marketing blocks, relaunched in 2024 on Tailwind CSS and redesigned block by block."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2022–2025" },
    { label: "Tools", value: "Figma, Tailwind CSS" },
  ],
  links: [{ label: "primeblocks.org", href: "https://primeblocks.org" }],
  hero: { id: "cover", caption: "PrimeBlocks" },
  entries: [
    {
      id: "3-1-1",
      date: "2022-12",
      version: "3.1.1",
      note: "The Figma file fully synced with the code.",
      source: "https://x.com/w00f/status/1602656029464006658",
      media: [{ id: "figma-sync", caption: "Figma file" }],
    },
    {
      id: "next-gen",
      date: "2024-09",
      title: "Next-gen PrimeBlocks",
      note: "Relaunched on Tailwind CSS, starting with Vue: PrimeTek's first SaaS product.",
      source: "https://x.com/w00f/status/1834178438665576753",
      media: [{ id: "next-gen", caption: "Next-gen launch" }],
    },
    {
      id: "redesign",
      date: "2025-07",
      title: "Full redesign",
      note: "The e-commerce update completed the redesign of every block.",
      source: "https://x.com/w00f/status/1948024774577287515",
      media: [{ id: "ecommerce", caption: "E-commerce blocks" }],
    },
  ],
};
