import type { Post } from "../types";

// X posts about PrimeOne. Summaries are our own words, never the post's text
// (@w00f may quote Onur). Each id was checked against the scan in
// .superpowers/research/x-prime-posts.md and x-w00f-posts.md.
export const primeonePosts: Post[] = [
  {
    date: "2022-07-26",
    account: "w00f",
    id: "1551880003134128128",
    summary: "Onur shares the all-new Figma UI kit, built with variants and auto layout in light and dark modes.",
    entryId: "kit-2022",
  },
  {
    date: "2023-02-27",
    account: "primefaces",
    id: "1630205822981533696",
    summary: "PrimeOne 2.0 ships with optimized components and new boolean, instance swap and text properties.",
    entryId: "2-0",
  },
  {
    date: "2023-07-31",
    account: "primereact",
    id: "1685967643570741248",
    summary: "PrimeOne 2.1 adds support for Tokens Studio.",
    entryId: "2-1",
  },
  {
    date: "2023-12-11",
    account: "primevue",
    id: "1734150958567903417",
    summary: "PrimeOne 2.2 improves the existing tokens, adds typography tokens and links theme and component colors.",
    entryId: "2-2",
  },
  {
    date: "2024-11-07",
    account: "primereact",
    id: "1854528709304205531",
    summary: "PrimeOne 3.0 is announced: redesigned for the new theming engine, with synced design tokens and Figma variables.",
    entryId: "3-0",
  },
  {
    date: "2024-11-07",
    account: "w00f",
    id: "1854537901700186303",
    summary: "Onur celebrates the PrimeOne 3.0 launch with a quote of the announcement.",
    entryId: "3-0",
  },
  {
    date: "2026-01-07",
    account: "w00f",
    id: "2008855709681951191",
    summary: "Onur previews PrimeOne 4: tokens re-architected around native Figma variable collections.",
    entryId: "4-0",
  },
  {
    date: "2026-01-19",
    account: "primevue",
    id: "2013200903923245079",
    summary: "PrimeOne 4.0 is out: native Figma Variables, new variable collections and a plugin that generates theme code from Figma.",
    entryId: "4-0",
  },
];
