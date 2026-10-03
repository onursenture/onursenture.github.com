import type { CaseStudy } from "./types";

// Draft (Sprint 5, Task 3); see primeone.ts. Onur led design on every
// template; `credits` names colleagues where they designed a template or a
// page (spec §4.2).
export const templates: CaseStudy = {
  slug: "templates",
  org: "primetek",
  title: "Templates",
  kind: "app templates",
  years: "2017–2024",
  lead: {
    strong: "Templates.",
    rest: "Premium application templates for PrimeFaces, PrimeNG, PrimeVue and PrimeReact.",
  },
  intro: ["Each one a complete app: dashboards, apps, landing and auth pages, themed for the Prime component libraries."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2017–2024" },
  ],
  links: [],
  hero: { id: "cover", caption: "Templates" },
  entries: [
    {
      id: "verona",
      date: "2017-01",
      title: "Verona",
      frameworks: ["JSF"],
      note: "A premium application template for PrimeFaces.",
      source: "https://x.com/w00f/status/821000764709539840",
      media: [
        { id: "verona-cover", caption: "Verona" },
        { id: "verona-landing", caption: "Landing", tags: ["page"] },
      ],
    },
    {
      id: "paradise",
      date: "2017-04",
      title: "Paradise",
      frameworks: ["JSF", "Angular"],
      note: "A minimalist application template for PrimeFaces, followed by a PrimeNG version a month later.",
      source: "https://x.com/w00f/status/856854851145408512",
      links: [{ label: "PrimeNG launch", href: "https://x.com/w00f/status/867305687549980672" }],
      media: [{ id: "paradise-cover", caption: "Paradise" }],
    },
    {
      id: "manhattan",
      date: "2017-07",
      title: "Manhattan",
      frameworks: ["JSF"],
      note: "A premium application template for PrimeFaces.",
      source: "https://x.com/w00f/status/881829683440099330",
      media: [{ id: "manhattan-cover", caption: "Manhattan" }],
    },
    {
      id: "avalon",
      date: "2017-08",
      title: "Avalon",
      frameworks: ["JSF"],
      note: "Bootstrap meets PrimeFaces: an application template for PrimeFaces.",
      source: "https://x.com/w00f/status/894495436509261824",
      media: [{ id: "avalon-cover", caption: "Avalon" }],
    },
    {
      id: "babylon",
      date: "2018-10",
      title: "Babylon",
      frameworks: ["JSF"],
      note: "A premium application template for PrimeFaces.",
      source: "https://x.com/w00f/status/1047438960329408512",
      media: [{ id: "babylon-cover", caption: "Babylon" }],
    },
    {
      id: "genesis",
      date: "2024-12",
      title: "Genesis",
      frameworks: ["React"],
      note: "Prime's first multipurpose premium template, built with React and Next.js.",
      source: "https://x.com/w00f/status/1867143128396058914",
      credits: [
        { name: "@umitceliks", href: "https://x.com/umitceliks" },
        { name: "@tanerengiin", role: "implementation", href: "https://x.com/tanerengiin" },
      ],
      media: [{ id: "genesis-cover", caption: "Genesis" }],
    },
  ],
};
