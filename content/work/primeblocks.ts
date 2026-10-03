import type { ProductPage } from "./types";

// Copy reuses the Sprint 5 case study's lead, intro and facts; no new claims.
export const primeblocks: ProductPage = {
  slug: "primeblocks",
  org: "primetek",
  title: "PrimeBlocks",
  kind: "UI blocks",
  lead: {
    strong: "PrimeBlocks.",
    rest: "Ready-made UI blocks for the Prime libraries, designed in Figma and kept in sync with the code.",
  },
  intro: "Application and marketing blocks, relaunched in 2024 on Tailwind CSS and redesigned block by block.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2021–2025" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "I led the design of PrimeBlocks, ready-made application and marketing blocks for the Prime libraries, designed in Figma and kept in sync with the code. In 2024 they were relaunched on Tailwind CSS and redesigned block by block.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        {
          id: "application-blocks",
          caption: "Application blocks",
          pin: { order: 2, title: "Application blocks", note: "Relaunched in 2024 on Tailwind CSS" },
        },
        { id: "marketing-blocks", caption: "Marketing blocks" },
        { id: "design-file", caption: "Design file" },
      ],
    },
  ],
};
