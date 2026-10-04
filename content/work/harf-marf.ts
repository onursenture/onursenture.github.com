import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §6. "15,000 players" is from the v1.3 release
// notes (2017-06-29).
export const harfMarf: ProductPage = {
  slug: "harf-marf",
  org: "orkestra",
  title: "Harf Marf",
  kind: "word puzzle",
  lead: {
    strong: "Harf Marf.",
    rest: "A word puzzle where most letters are wrong: you solve it by reading words as a whole.",
  },
  intro: "A calm iOS puzzle with relaxing music. It had 15,000 players by June 2017.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2016–2017" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "App Store", href: "https://apps.apple.com/tr/app/harf-marf/id1073072194" }],
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
        { id: "puzzle", caption: "Puzzle" },
        { id: "levels", caption: "Levels" },
        { id: "icon", caption: "App icon" },
      ],
    },
  ],
};
