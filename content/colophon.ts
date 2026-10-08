import type { StackEntry } from "@/lib/colophon";

// The /colophon/ copy (Sprint 11b spec §2). Draft copy: Onur approves it on
// production. Only true statements: check a claim against the code before
// adding it.

export type ColophonPart = string | { text: string; href: string };

export interface ColophonSection {
  id: string;
  label: string;
  // Paragraphs of text and links.
  paragraphs: ColophonPart[][];
}

// The Stack row, after Built. Versions come from package.json (lib/colophon.ts).
export const STACK: StackEntry[] = [
  { name: "Next.js", href: "https://nextjs.org", pkg: "next" },
  { name: "React", href: "https://react.dev", pkg: "react" },
  { name: "Tailwind CSS", href: "https://tailwindcss.com", pkg: "tailwindcss" },
  { name: "Drizzle", href: "https://orm.drizzle.team", pkg: "drizzle-orm" },
  { name: "Neon Postgres", href: "https://neon.com" },
  { name: "Vercel", href: "https://vercel.com", note: "hosting and Blob storage" },
  { name: "react-pdf", href: "https://react-pdf.org", pkg: "@react-pdf/renderer", note: "the resume PDF" },
  { name: "GitHub OAuth", href: "https://docs.github.com/en/apps/oauth-apps", note: "the admin sign-in" },
];

// The rows after Stack, in order.
export const sections: ColophonSection[] = [
  {
    id: "built",
    label: "Built",
    paragraphs: [["Designed and built by Onur, with ", { text: "Claude Code", href: "https://claude.com/claude-code" }, "."]],
  },
  {
    id: "type",
    label: "Type",
    paragraphs: [
      [
        { text: "IBM Plex Mono", href: "https://fonts.google.com/specimen/IBM+Plex+Mono" },
        ", ",
        { text: "IBM Plex Sans", href: "https://fonts.google.com/specimen/IBM+Plex+Sans" },
        " and ",
        { text: "Doto", href: "https://fonts.google.com/specimen/Doto" },
        ", self-hosted.",
      ],
    ],
  },
  {
    id: "texture",
    label: "Texture",
    paragraphs: [["The dithered strips and washes are ", { text: "Dither Kit", href: "https://www.tripwire.sh/dither-kit" }, " by Tripwire (MIT), vendored with small changes."]],
  },
  {
    id: "data",
    label: "Data",
    paragraphs: [
      [
        "Life reads ",
        { text: "Letterboxd", href: "https://letterboxd.com/onur/" },
        ", ",
        { text: "Goodreads", href: "https://www.goodreads.com/onur" },
        ", ",
        { text: "Instapaper", href: "https://www.instapaper.com/p/w00f" },
        ", ",
        { text: "tiyatrolar.com.tr", href: "https://tiyatrolar.com.tr/u/onursenture" },
        " and ",
        { text: "w00f.org", href: "https://w00f.org" },
        "; the home reads ",
        { text: "GitHub", href: "https://github.com/onursenture" },
        ". A GitHub Actions job checks the sources every hour.",
      ],
      ["Calls are booked through ", { text: "cal.com", href: "https://cal.com/onursenture" }, ". Notes follow Bluesky's format: 300 characters, with links and mentions."],
    ],
  },
  {
    id: "source",
    label: "Source",
    paragraphs: [["The code is public on ", { text: "GitHub", href: "https://github.com/onursenture/onursenture.github.com" }, "."]],
  },
  {
    id: "agent",
    label: "Agent",
    paragraphs: [["For AI agents: ", { text: "onur.md", href: "/onur.md" }, ", the site as one Markdown profile, and ", { text: "llms.txt", href: "/llms.txt" }, "."]],
  },
  {
    id: "history",
    label: "History",
    paragraphs: [["Online since 2011: Jekyll, then Eleventy, now Next.js. Every release is in the ", { text: "changelog", href: "/changelog/" }, "."]],
  },
];
