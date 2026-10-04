import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §7 (App Store record only).
export const hiJump: ProductPage = {
  slug: "hi-jump",
  org: "orkestra",
  title: "Hi Jump",
  kind: "arcade game",
  lead: {
    strong: "Hi Jump.",
    rest: "An arcade climber: drag the ball and help Hi climb as many floors as you can.",
  },
  intro: "A small iOS game in English, German and Turkish, with scores to share on Instagram.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2018" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "App Store", href: "https://apps.apple.com/us/app/hi-jump-rescue-him/id1361521201" }],
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
        { id: "climb", caption: "Climb" },
        { id: "hi", caption: "Hi" },
        { id: "score", caption: "Score" },
      ],
    },
  ],
};
