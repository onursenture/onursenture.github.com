import type { ProductPage } from "./types";

// Facts: orkestra-projects.md §5 and orkestra-answers.md. Onur: Orkestra was
// founded in 2013 when the Gonnasphere team went on; Gonna is its first
// product. The lessons summarise his 2014 post-mortem "How we failed?".
export const gonna: ProductPage = {
  slug: "gonna",
  org: "orkestra",
  title: "Gonna",
  kind: "social agenda",
  lead: {
    strong: "Gonna.",
    rest: "A social agenda: write what you're going to do, and see what your friends, musicians and teams plan.",
  },
  intro:
    "It started in 2012 as Gonnasphere on the web and came to the iPhone as Gonna in March 2013, the first product of the team that became Orkestra.",
  facts: [
    { label: "Role", value: "Co-founder, CPO" },
    { label: "Years", value: "2012–2014" },
    { label: "At", value: "Orkestra Studios" },
    { label: "Platform", value: "Web, iOS" },
  ],
  blocks: [
    {
      kind: "then",
      id: "then",
      year: "2012",
      body: [
        "Three Bilkent computer science students put to-do lists on a social network, a year before the iPhone app. Blogs abroad called it the Twitter of to-do lists, and in September 2012 it had visitors from 100 countries.",
      ],
      sources: [
        { label: "How we failed?", href: "https://web.archive.org/web/2014/https://medium.com/p/facc7841ad86" },
        { label: "Press", href: "https://web.archive.org/web/2014/http://blog.getgonna.com/press" },
        { label: "100 countries", href: "https://x.com/w00f/status/252851507391766528" },
      ],
    },
    {
      kind: "text",
      id: "what-i-did",
      heading: "What I did",
      body: [
        "As co-founder and CPO I led the product and designed it: the Gonnasphere web app in 2012, then Gonna for iPhone and getgonna.com in 2013.",
      ],
    },
    {
      kind: "text",
      id: "recognition",
      heading: "Recognition",
      body: [
        "Second place among more than 2,800 projects in the MIT Enterprise Forum Turkey Business Plan Competition 2012, with a $15,000 prize and a 16-day US trip that December: Stanford, MIT, Harvard and The World Bank.",
        "The iPhone app reached #1 in New Social Networking on the Turkish App Store in March 2013.",
      ],
      links: [
        {
          label: "MIT EF Turkey result",
          href: "https://web.archive.org/web/2014/http://blog.gonnasphere.com/2012/05/mit-ef-turkey-business-plan-competition/",
        },
      ],
    },
    {
      kind: "text",
      id: "lessons",
      heading: "What I learned",
      body: [
        "In 2014 I wrote down why Gonna failed. The short version:",
        "No revenue model, and little marketing or sales experience.",
        "No viral loop, and a value most people didn't see: almost 90% of users didn't understand what to do.",
        "Web first. We went mobile too late.",
      ],
      links: [{ label: "How we failed?", href: "https://web.archive.org/web/2014/https://medium.com/p/facc7841ad86" }],
    },
    {
      kind: "images",
      id: "highlights",
      heading: "Highlights",
      columns: 3,
      images: [
        { id: "gonnasphere-web", caption: "Gonnasphere, web" },
        { id: "gonna-iphone", caption: "Gonna for iPhone" },
        { id: "getgonna", caption: "getgonna.com" },
      ],
    },
  ],
};
