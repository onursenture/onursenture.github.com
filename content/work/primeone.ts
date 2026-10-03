import { primeonePosts } from "./posts/primeone";
import type { CaseStudy } from "./types";

// Every line is backed by the post in its `source`: Onur's own, or the
// PrimeTek accounts' announcements.
export const primeone: CaseStudy = {
  slug: "primeone",
  org: "primetek",
  title: "PrimeOne",
  kind: "design system",
  years: "2022–2026",
  lead: {
    strong: "PrimeOne.",
    rest: "The Figma design system behind PrimeVue, PrimeNG and PrimeReact.",
  },
  intro: ["A token-driven Figma kit that mirrors the components and themes of the Prime libraries, release for release."],
  facts: [
    { label: "Role", value: "Design lead" },
    { label: "Years", value: "2022–2026" },
    { label: "Tools", value: "Figma, Figma Variables, design tokens" },
  ],
  links: [],
  hero: { id: "cover", caption: "PrimeOne" },
  entries: [
    {
      id: "kit-2022",
      date: "2022-07",
      title: "PrimeOne for Figma",
      note: "The first PrimeOne kit, with light and dark modes from the start, designed on the Lara Blue themes.",
      source: "https://x.com/w00f/status/1551880003134128128",
      links: [{ label: "PrimeTek blog post", href: "https://www.primefaces.org/blog/introducing-primeone-design-system-for-figma/" }],
      media: [{ id: "kit-2022", caption: "Figma UI kit" }],
    },
    {
      id: "2-0",
      date: "2023-02",
      version: "2.0",
      note: "Components tidied up, with boolean, text and instance swap properties added.",
      source: "https://x.com/primefaces/status/1630205822981533696",
      media: [],
    },
    {
      id: "2-1",
      date: "2023-07",
      version: "2.1",
      note: "Support for Tokens Studio, plus nested instances.",
      source: "https://x.com/primereact/status/1685967643570741248",
      links: [{ label: "PrimeTek blog post", href: "https://www.primefaces.org/blog/presenting-primeone-2-1" }],
      media: [],
    },
    {
      id: "2-2",
      date: "2023-12",
      version: "2.2",
      note: "Tokens reworked and aligned with the code, with new typography tokens.",
      source: "https://x.com/w00f/status/1734153327552672006",
      links: [{ label: "PrimeTek blog post", href: "https://www.primefaces.org/blog/unveiling-primeone-2-2" }],
      media: [{ id: "tokens-2-2", caption: "Tokens", tags: ["tokens"] }],
    },
    {
      id: "3-0",
      date: "2024-11",
      version: "3.0",
      note: "A full rebuild around the new theming engine.",
      source: "https://x.com/primereact/status/1854528709304205531",
      media: [
        { id: "overview-3-0", caption: "Overview" },
        { id: "tokens-3-0", caption: "Tokens", tags: ["tokens"] },
      ],
    },
    {
      id: "3-2",
      date: "2026-01",
      version: "3.2",
      note: "The last 3.x release and the last to support Tokens Studio. It shipped the same day as 4.0, with component fixes and tidier naming.",
      source: "https://www.primefaces.org/blog/primeone-4-0-is-here-native-figma-variables/",
      media: [
        { id: "overview-3-2", caption: "Overview" },
        { id: "tokens-3-2", caption: "Tokens", tags: ["tokens"] },
      ],
    },
    {
      id: "4-0",
      date: "2026-01",
      version: "4.0",
      note: "Tokens moved to native Figma variables, sorted into new collections, and a Figma plugin now writes the theme code.",
      source: "https://x.com/primevue/status/2013200903923245079",
      media: [{ id: "variables-4-0", caption: "Variable collections", tags: ["tokens"] }],
    },
  ],
  posts: primeonePosts,
};
