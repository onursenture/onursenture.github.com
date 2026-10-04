import type { ProductPage } from "./types";

// Onur, 2026-10-04: the 2025 redesign shipped; he led it. The screen list
// comes from the PrimeStore Figma survey (.superpowers/research/figma-survey.md).
export const primestore: ProductPage = {
  slug: "primestore",
  org: "primetek",
  title: "PrimeStore",
  kind: "template store",
  lead: {
    strong: "PrimeStore.",
    rest: "The store for PrimeTek's templates, themes and tools.",
  },
  intro: "The 2025 redesign: browsing, template pages, licensing, and a dashboard for everything a customer owns.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2025" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "I led the 2025 redesign of PrimeStore end to end: the store and template pages, the licence flow, sign-in and sign-up, PayLink, a Command K search for templates, and a dashboard for versions, server files, payment history and subscriptions.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        {
          id: "store",
          caption: "Store",
          pin: { order: 4, title: "PrimeStore 2025", note: "The template store, redesigned end to end" },
        },
        { id: "template-detail", caption: "Template detail" },
        { id: "dashboard", caption: "Dashboard" },
      ],
    },
  ],
};
