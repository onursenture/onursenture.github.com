import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §8 (App Store record only).
export const reboundLine: ProductPage = {
  slug: "rebound-line",
  org: "orkestra",
  title: "Rebound Line",
  kind: "arcade game",
  lead: {
    strong: "Rebound Line.",
    rest: "Draw lines to bounce the ball: the bigger the line, the higher the jump.",
  },
  intro: "An iOS arcade game with obstacles, online play and a leaderboard, and scores to share on Instagram Stories.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2019" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "App Store", href: "https://apps.apple.com/tr/app/rebound-line/id1446630383" }],
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
        { id: "draw", caption: "Draw a line" },
        { id: "obstacles", caption: "Obstacles" },
        { id: "leaderboard", caption: "Leaderboard" },
      ],
    },
  ],
};
