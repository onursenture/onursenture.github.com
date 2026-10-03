import { primeiconsPosts } from "./posts/primeicons";
import type { CaseStudy } from "./types";

// Every entry is backed by the post in its `source`. The live icon grid comes from
// the primeicons package (7.0.0, MIT), not from this file.
export const primeicons: CaseStudy = {
  slug: "primeicons",
  org: "primetek",
  title: "PrimeIcons",
  kind: "icon set",
  years: "2018–2024",
  lead: {
    strong: "PrimeIcons.",
    rest: "The icon library of the Prime libraries, drawn to replace Font Awesome.",
  },
  intro: ["Started in 2018 to drop the Font Awesome dependency; past a million downloads by April 2019."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2018–2024" },
    { label: "Tools", value: "Figma, SVG, icon fonts" },
  ],
  links: [{ label: "GitHub", href: "https://github.com/primefaces/primeicons" }],
  hero: { id: "cover", caption: "PrimeIcons" },
  entries: [
    {
      id: "start",
      date: "2018-02",
      title: "Work starts",
      note: "Work started on PrimeIcons, our own free icon library to replace the Font Awesome dependency.",
      source: "https://x.com/primereact/status/963322417467789312",
      media: [],
    },
    {
      id: "alpha",
      date: "2018-05",
      title: "First alpha",
      note: "Drawing the set that would remove the Font Awesome dependency, three icons short of the first alpha.",
      source: "https://x.com/w00f/status/991654451231494144",
      media: [],
    },
    {
      id: "150k",
      date: "2018-09",
      title: "150,000 downloads",
      note: "The pre-release passed 150,000 downloads on the way to 1.0.",
      source: "https://x.com/w00f/status/1039612365258547200",
      media: [],
    },
    {
      id: "1-0",
      date: "2018-10",
      version: "1.0",
      note: "Version 1.0 released.",
      source: "https://x.com/w00f/status/1052113437382328320",
      media: [{ id: "set-1-0", caption: "The 1.0 set" }],
    },
    {
      id: "1m",
      date: "2019-04",
      title: "1M downloads",
      note: "Past one million downloads.",
      source: "https://x.com/w00f/status/1123275841079795712",
      media: [],
    },
    {
      id: "7-0",
      date: "2024-03",
      version: "7.0",
      note: "Version 7.0.0: 50+ new icons, with over 2 million monthly downloads at release.",
      source: "https://x.com/primefaces/status/1773661861151432797",
      media: [{ id: "set-7-0", caption: "The 7.0 set" }],
    },
  ],
  posts: primeiconsPosts,
};
