import type { CaseStudy } from "./types";

// Draft (Sprint 5, Task 3): every line comes from Onur's posts; Task 11 adds
// the PrimeTek-account research and Onur confirms on the preview.
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
      // Draft: confirm this kit is PrimeOne's first release (Task 11).
      id: "kit-2022",
      date: "2022-07",
      title: "Figma UI kit",
      note: "An all-new Figma UI kit, rebuilt on variants and auto layout, in light and dark modes.",
      source: "https://x.com/w00f/status/1551880003134128128",
      media: [{ id: "kit-2022", caption: "Figma UI kit" }],
    },
    {
      id: "2-2",
      date: "2023-12",
      version: "2.2",
      note: "Tokens reworked and aligned with the code.",
      source: "https://x.com/w00f/status/1734153327552672006",
      media: [{ id: "tokens-2-2", caption: "Tokens", tags: ["tokens"] }],
    },
    {
      id: "3-0",
      date: "2024-11",
      version: "3.0",
      note: "Redesigned from the ground up for the new theming engine.",
      source: "https://x.com/w00f/status/1854537901700186303",
      media: [
        { id: "overview-3-0", caption: "Overview" },
        { id: "tokens-3-0", caption: "Tokens", tags: ["tokens"] },
      ],
    },
    {
      id: "4-0",
      date: "2026-01",
      version: "4.0",
      note: "Design tokens re-architected around native Figma Variable collections.",
      source: "https://x.com/w00f/status/2013248948748656769",
      media: [{ id: "variables-4-0", caption: "Variable collections", tags: ["tokens"] }],
    },
  ],
};
