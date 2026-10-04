import type { ProductPage } from "./types";

// Onur, 2026-10-04: designed in 2023 as PrimeDesigner, a standalone app; after
// a pivot it shipped in 2025 as Theme Designer. Not "unreleased". The screen
// list comes from the PrimeDesigner Figma survey.
export const themeDesigner: ProductPage = {
  slug: "theme-designer",
  org: "primetek",
  title: "Theme Designer",
  kind: "theme editor",
  lead: {
    strong: "Theme Designer.",
    rest: "A visual theme editor for the Prime libraries.",
  },
  intro: "It began in 2023 as PrimeDesigner, a standalone app, and shipped in 2025 as Theme Designer.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2023–2025" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["I led the design from the first PrimeDesigner screens to the Theme Designer that shipped."],
    },
    {
      kind: "text",
      id: "pivot",
      heading: "From PrimeDesigner to Theme Designer",
      body: [
        "PrimeDesigner was designed as a standalone app: themes and components to edit, sign-in, plans and billing, payment history and add-ons.",
        "The product changed course, and the design shipped in 2025 as Theme Designer.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "create-theme", caption: "Create a theme" },
        { id: "components", caption: "Components" },
        { id: "billing", caption: "Billing" },
      ],
    },
  ],
};
