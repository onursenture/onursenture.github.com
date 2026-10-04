import type { ProductPage } from "./types";

// Copy reuses the Sprint 5 case study's lead, intro and facts; no new claims.
export const primeone: ProductPage = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  lead: {
    strong: "PrimeOne.",
    rest: "The Figma design system behind PrimeVue, PrimeNG and PrimeReact.",
  },
  intro: "A token-driven Figma kit that mirrors the components and themes of the Prime libraries, release for release.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2022–2026" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "I led the design of PrimeOne, a token-driven Figma kit for PrimeVue, PrimeNG and PrimeReact. It mirrors the components and themes of the Prime libraries, release for release.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        {
          id: "components",
          caption: "Components",
          pin: { title: "Components", note: "The Figma kit behind the Prime libraries" },
        },
        { id: "tokens", caption: "Tokens" },
        { id: "themes", caption: "Themes" },
      ],
    },
  ],
};
