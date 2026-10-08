// The site's changelog (Sprint 11b), newest first. Hand-written: every v2
// release is a merge into `v2` (a sprint is a minor, a follow-up fix a patch).
// package.json's version must equal the newest release (tests/changelog.test.ts),
// so a sprint ships with its entry. Draft copy: Onur approves it on production.

export interface Release {
  // major.minor.patch
  version: string;
  // YYYY-MM-DD: the merge date into v2.
  date: string;
  title: string;
  // 1–5 plain sentences about what changed on the site, for a visitor.
  items: string[];
}

export interface Era {
  major: number;
  name: string;
  // YYYY-MM-DD, from git.
  from: string;
  // null for the current era.
  to: string | null;
  summary: string;
}

export const releases: Release[] = [
  {
    version: "2.9.0",
    date: "2026-10-08",
    title: "Changelog, colophon and onur.md; an accessibility pass",
    items: [
      "This changelog, and a colophon that says how the site is built.",
      "onur.md and llms.txt: the site in Markdown, for AI agents.",
      "A skip link, stronger focus rings and underlined links in running text.",
      "Life pages load their first images sooner, and smaller covers.",
    ],
  },
  {
    version: "2.8.1",
    date: "2026-10-07",
    title: "In-page admin confirmations",
    items: ["The admin asks before deleting or leaving in its own dialog, so it works in browsers that block pop-up confirms."],
  },
  {
    version: "2.8.0",
    date: "2026-10-05",
    title: "Photos in the admin",
    items: [
      "Photos are posted from the admin, from a phone.",
      "The date and camera come from the photo's EXIF data; location data is never read or kept.",
    ],
  },
  {
    version: "2.7.0",
    date: "2026-10-05",
    title: "Life archives",
    items: [
      "Archive pages for films, books, theatre and saved articles.",
      "Films and books are grouped by year and month; plays by year.",
    ],
  },
  {
    version: "2.6.0",
    date: "2026-10-05",
    title: "Notes",
    items: [
      "Notes: short posts on the Work side, the Life side or both, with images or a link card.",
      "The feed at /feed.xml carries the latest notes and photos.",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-10-04",
    title: "Resume and Book a call",
    items: [
      "A resume page and a PDF, built from the same data as the home.",
      "Book a call: three kinds of call, booked through cal.com.",
    ],
  },
  {
    version: "2.4.1",
    date: "2026-10-04",
    title: "Admin follow-ups",
    items: ["The admin explains why a publish was refused, pins take an optional note, and drafts are saved by hand."],
  },
  {
    version: "2.4.0",
    date: "2026-10-04",
    title: "Admin",
    items: [
      "An admin, signed in with GitHub, for the product pages, the bio, Lab and Experience.",
      "Images are uploaded straight into a product page's slots.",
    ],
  },
  {
    version: "2.3.0",
    date: "2026-10-04",
    title: "Orkestra and two PrimeTek pages",
    items: [
      "Nine Orkestra product pages, from Nebuu to Beatografi.",
      "PrimeStore and Theme Designer join the PrimeTek pages.",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-10-03",
    title: "Product pages",
    items: [
      "Product pages for PrimeOne, PrimeBlocks, PrimeIcons and the templates.",
      "Selected work on the home, pinned from those pages.",
      "An image viewer with arrows, swipe and Esc.",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-10-03",
    title: "New visual direction and the Work/Life split",
    items: [
      "IBM Plex Mono and Sans, Doto for the name, one ultramarine accent and dithered textures.",
      "The site splits into Work and Life, with a switch in the header; Life is always dark.",
      "Life opens with a readout of what I'm watching, reading and saving.",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-10-03",
    title: "Next.js platform and design system",
    items: [
      "The rebuild begins: Next.js on Vercel, with a database.",
      "Films, books, saved articles and GitHub activity sync on a schedule instead of at build time.",
      "A design system of colour tokens, type and one page grid.",
    ],
  },
];

export const eras: Era[] = [
  { major: 2, name: "Next.js", from: "2026-10-02", to: null, summary: "Next.js on Vercel, with a database, an admin and synced feeds." },
  { major: 1, name: "Eleventy", from: "2026-02-18", to: "2026-10-02", summary: "Eleventy on GitHub Pages, with live data widgets rebuilt every six hours." },
  { major: 0, name: "Jekyll", from: "2011-12-30", to: "2026-02-18", summary: "Jekyll on GitHub Pages, started from Jekyll Bootstrap with a commit called “version 0.0.1”." },
];
