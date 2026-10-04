import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §9 (App Store text and version history).
export const imparator: ProductPage = {
  slug: "imparator",
  org: "orkestra",
  title: "İmparator",
  kind: "football card game",
  lead: {
    strong: "İmparator.",
    rest: "A Turkish football card game: build a squad from two decades of Turkish football.",
  },
  intro:
    "Collect players, legends included, set your tactics, and play friendlies and league matches to win more cards. Its 2018 update brought the 2018/19 Süper Lig season.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2017–2018" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "App Store", href: "https://apps.apple.com/tr/app/i-mparator-futbol-menajer-19/id1201188587" }],
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
        { id: "cards", caption: "Cards" },
        { id: "squad", caption: "Squad" },
        { id: "match", caption: "Match" },
      ],
    },
  ],
};
