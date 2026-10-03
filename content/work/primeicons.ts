import type { ProductPage } from "./types";

// Copy reuses the Sprint 5 case study's lead, intro and facts; no new claims.
// The live icon set (the icons block) comes from the primeicons package
// (pinned at 7.0.0, MIT), not from this file.
export const primeicons: ProductPage = {
  slug: "primeicons",
  org: "primetek",
  title: "PrimeIcons",
  kind: "icon set",
  lead: {
    strong: "PrimeIcons.",
    rest: "The icon library of the Prime libraries, drawn to replace Font Awesome.",
  },
  intro: "Started in 2018 to drop the Font Awesome dependency; past a million downloads by April 2019.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2018–2024" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "I led the design of PrimeIcons, the icon library of the Prime libraries. It started in 2018 to drop the Font Awesome dependency, and the set was past a million downloads by April 2019.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        {
          id: "icon-sheet",
          caption: "Icon sheet",
          pin: { order: 3, title: "Icon sheet", note: "Drawn to replace Font Awesome" },
        },
        { id: "details", caption: "Details" },
        { id: "in-use", caption: "In use" },
      ],
    },
    { kind: "icons", id: "icon-set", heading: "Icon set" },
  ],
};
