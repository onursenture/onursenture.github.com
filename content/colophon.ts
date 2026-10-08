import type { StackEntry } from "@/lib/colophon";
import { type Booking, booking, bookingEnabled } from "./booking";
import { type Profile, profile, socialLinks } from "./profile";
import { THEATRE_PROFILE_URL } from "./theatre-profile";

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

// The rows after Stack, in order. The source links come from the profile, the
// theatre constant and the booking config, so they follow a change there; the
// cal.com sentence appears only while booking is on.
export function buildSections(p: Profile = profile, config: Booking = booking): ColophonSection[] {
  const social = (label: string) => {
    const link = socialLinks(p).find((l) => l.label === label);
    if (!link) throw new Error(`No social link labelled ${label}`);
    return { text: label, href: link.href };
  };
  const calUsername = config.calUsername.trim();
  return [
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
          social("Letterboxd"),
          ", ",
          social("Goodreads"),
          ", ",
          { text: "Instapaper", href: `https://www.instapaper.com/p/${p.social.instapaper}` },
          ", ",
          { text: "tiyatrolar.com.tr", href: THEATRE_PROFILE_URL },
          " and ",
          { text: "w00f.org", href: "https://w00f.org" },
          "; the home reads ",
          social("GitHub"),
          ". A GitHub Actions job checks the sources every hour.",
        ],
        bookingEnabled(config)
          ? ["Calls are booked through ", { text: "cal.com", href: `https://cal.com/${calUsername}` }, ". Notes follow Bluesky's format: 300 characters, with links and mentions."]
          : ["Notes follow Bluesky's format: 300 characters, with links and mentions."],
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
}

export const sections: ColophonSection[] = buildSections();
