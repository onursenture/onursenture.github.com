import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §4. No sourced context for a then block.
export const macKacta: ProductPage = {
  slug: "mac-kacta",
  org: "orkestra",
  title: "Maç Kaçta",
  kind: "football fixtures",
  lead: {
    strong: "Maç Kaçta.",
    rest: "The easiest way to follow your team: where, when and against whom it plays next.",
  },
  intro: "An iPhone app for football fans, with standings, past matches and a theme in your team's colours.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2013–2014" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  blocks: [
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["Product and design: the idea, the interface, the icon and the store art."],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "next-match", caption: "Next match" },
        { id: "standings", caption: "Standings" },
        { id: "team-theme", caption: "Team theme" },
      ],
    },
  ],
};
