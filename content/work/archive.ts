import type { ArchiveEntry } from "./types";

// Other PrimeTek work, from the posts that announced it (spec §4.3). Draft
// (Sprint 5, Task 3): Task 11 adds the PrimeTek-account research.
export const archiveEntries: ArchiveEntry[] = [
  {
    id: "theme-gallery",
    org: "primetek",
    date: "2023-09",
    title: "Theme Designer gallery",
    note: "A gallery for sharing designs made with the new Theme Designer.",
    source: "https://x.com/w00f/status/1699028097872371916",
  },
  {
    id: "visual-theme-editor",
    org: "primetek",
    date: "2024-11",
    title: "Visual Theme Editor",
    note: "A visual editor for custom PrimeVue themes, from idea to release in under a week.",
    source: "https://x.com/w00f/status/1857050715224494345",
  },
];
