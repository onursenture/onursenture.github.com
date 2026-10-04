import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §3 and orkestra-answers.md. "300,000+ users" is
// orkestra.co, Dec 2014 (Onur chose it over the 100k figure). The 640 KB size
// is from Can Bülbül's page (Oct 2014).
export const countdo: ProductPage = {
  slug: "countdo",
  org: "orkestra",
  title: "count.do",
  kind: "countdown app",
  lead: {
    strong: "count.do.",
    rest: "A countdown app: set a date, watch it count down, get a nudge when it ends.",
  },
  intro:
    "Orkestra's third app and, in 2014, its most downloaded, with more than 300,000 users by December 2014. I remastered it for the web in 2026.",
  facts: [
    { label: "Role", value: "Product, design" },
    { label: "Years", value: "2013–2016" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "iOS" },
  ],
  links: [{ label: "count.do Remastered", href: "https://countdo.orkestra.co/" }],
  blocks: [
    {
      kind: "then",
      id: "then",
      year: "2013",
      body: [
        "count.do shipped on 23 June 2013, a 640 KB app for iOS 6. On iOS 7's release day that September it already worked on iOS 7, and in November it went free, with no ads.",
      ],
      sources: [
        { label: "Release tweet", href: "https://x.com/w00f/status/348832940899315713" },
        { label: "iOS 7 tweet", href: "https://x.com/w00f/status/380393852739137536" },
        { label: "Free, no ads", href: "https://x.com/w00f/status/404206994212814848" },
        { label: "640 KB", href: "https://web.archive.org/web/20141018090049/http://countdo.co/" },
      ],
    },
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: ["Product and design: the idea, the interface, the icon and the store art. Can Bülbül built it."],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "countdowns", caption: "Countdowns" },
        { id: "themes", caption: "Themes" },
        { id: "icon", caption: "App icon" },
      ],
    },
  ],
};
