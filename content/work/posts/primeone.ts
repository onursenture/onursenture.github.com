import type { Post } from "../types";

// X posts about PrimeOne, newest first. Summaries are our own words, never the post's text
// (@w00f may quote Onur). Each account, id and date was checked against the scan in
// .superpowers/research/x-prime-posts.md and x-w00f-posts.md.
export const primeonePosts: Post[] = [
  {
    date: "2026-01-19",
    account: "w00f",
    id: "2013248948748656769",
    summary: "Onur on the release day: \"4.0 (and 3.2) shipped. Onward.\"",
    entryId: "4-0",
  },
  {
    date: "2026-01-19",
    account: "primevue",
    id: "2013200903923245079",
    summary: "PrimeOne 4.0 shipped on Figma's native variables, with a new plugin that turns the file into theme code.",
    entryId: "4-0",
  },
  {
    date: "2026-01-07",
    account: "w00f",
    id: "2008855709681951191",
    summary: "Onur previews PrimeOne 4: tokens re-architected around native Figma variable collections.",
    entryId: "4-0",
  },
  {
    date: "2024-11-07",
    account: "w00f",
    id: "1854537901700186303",
    summary: "Onur quote-posts the PrimeOne 3.0 announcement with \"Achievement unlocked.\"",
    entryId: "3-0",
  },
  {
    date: "2024-11-07",
    account: "primereact",
    id: "1854528709304205531",
    summary: "PrimeOne 3.0 announced as a full rebuild around the new theming engine.",
    entryId: "3-0",
  },
  {
    date: "2024-07-26",
    account: "primevue",
    id: "1816796495674266046",
    summary: "Status update: the Figma UI kit for the PrimeVue v4 release had advanced considerably.",
    entryId: "3-0",
  },
  {
    date: "2023-12-11",
    account: "w00f",
    id: "1734153327552672006",
    summary: "Onur on PrimeOne 2.2: tokens \"significantly improved\" and aligned with the code.",
    entryId: "2-2",
  },
  {
    date: "2023-12-11",
    account: "primevue",
    id: "1734150958567903417",
    summary: "PrimeOne 2.2 for Figma linked theme and component colors, so one palette change carries through.",
    entryId: "2-2",
  },
  {
    date: "2023-07-31",
    account: "primereact",
    id: "1685967643570741248",
    summary: "PrimeOne 2.1 for Figma brought in Tokens Studio support.",
    entryId: "2-1",
  },
  {
    date: "2023-02-27",
    account: "primefaces",
    id: "1630205822981533696",
    summary: "PrimeOne 2.0 for Figma arrived with leaner components and extra component property types.",
    entryId: "2-0",
  },
  {
    date: "2022-07-26",
    account: "w00f",
    id: "1551880003134128128",
    summary: "Onur shares the all-new Figma UI kit, built with variants and auto layout in light and dark modes.",
    entryId: "kit-2022",
  },
  {
    date: "2022-03-24",
    account: "primefaces",
    id: "1506959178350436352",
    summary: "Teaser for PrimeOne Design 2022 for Figma, due soon, with interactive components.",
    entryId: "kit-2022",
  },
];
