import type { ProductPage } from "./types";

// Copy reuses the Sprint 5 case study's lead, intro and facts; no new claims.
// Onur led design on every template; `credits` names the colleagues who
// designed a template, never those who built it.
export const templates: ProductPage = {
  slug: "templates",
  org: "primetek",
  title: "Templates",
  kind: "app templates",
  lead: {
    strong: "Templates.",
    rest: "Premium application templates for PrimeFaces, PrimeNG, PrimeVue and PrimeReact.",
  },
  intro: "Each one a complete app: dashboards, apps, landing and auth pages, themed for the Prime component libraries.",
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2016–2025" },
    { label: "At", value: "PrimeTek" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "I led the design of premium application templates for PrimeFaces, PrimeNG, PrimeVue and PrimeReact. Each one is a complete app, with dashboards, apps, landing and auth pages, themed for the Prime component libraries.",
      ],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        {
          id: "apollo",
          caption: "Apollo",
          pin: { order: 4, title: "Apollo", note: "A dark-concept template with a horizontal menu bar" },
        },
        { id: "diamond", caption: "Diamond" },
        { id: "ultima", caption: "Ultima" },
        { id: "verona", caption: "Verona" },
        { id: "atlantis", caption: "Atlantis" },
        { id: "genesis", caption: "Genesis", credits: [{ name: "Ümit Çelik" }] },
      ],
    },
  ],
};
