// Who the site is about. Only facts Onur has confirmed go here.
import type { OrgId } from "./orgs";

// A bio paragraph is text with inline organisation marks.
export type BioSegment = string | { org: OrgId };

export interface Profile {
  name: string;
  // The label column under the name.
  role: string;
  location: { place: string; timeZone: string };
  // The home h1: a strong opening and a muted continuation.
  lead: { strong: string; rest: string };
  bio: BioSegment[][];
  available: boolean;
  // "Book a call" renders only when this is set (Sprint 8).
  bookingUrl?: string;
  // Handles, not URLs; socialLinks() builds the URLs.
  social: {
    x: string;
    dribbble: string;
    github: string;
    goodreads: string;
    letterboxd: string;
    instapaper: string;
  };
}

// The part of the profile the admin edits (Sprint 7): the home's lead and bio.
export type ProfileCopy = Pick<Profile, "lead" | "bio">;

export const profile: Profile = {
  name: "Onur Senture",
  role: "Designer who builds",
  location: { place: "Ankara", timeZone: "Europe/Istanbul" },
  // Draft copy (Sprint 4): facts from LinkedIn and the approved S3 identity
  // line; Onur confirms on the preview.
  lead: {
    strong: "Designer who builds.",
    rest: "From components to complete apps, designed and built end to end.",
  },
  bio: [
    [
      "For ten years I led design at ",
      { org: "primetek" },
      ", where I built the PrimeOne design system, PrimeBlocks, PrimeIcons and the templates behind PrimeVue, PrimeNG and PrimeReact.",
    ],
    [
      "Since 2013 I've also run ",
      { org: "orkestra" },
      ", where we made Nebuu, Rebound Line, Hi Jump and other iOS games and apps. Computer Science at ",
      { org: "bilkent" },
      ".",
    ],
  ],
  available: true,
  social: {
    x: "w00f",
    dribbble: "onursenture",
    github: "onursenture",
    goodreads: "onur",
    letterboxd: "onur",
    instapaper: "w00f",
  },
};

export interface SocialLink {
  label: string;
  href: string;
}

// The footer's links, in footer order.
export function socialLinks(p: Profile = profile): SocialLink[] {
  return [
    { label: "GitHub", href: `https://github.com/${p.social.github}` },
    { label: "Letterboxd", href: `https://letterboxd.com/${p.social.letterboxd}/` },
    { label: "Goodreads", href: `https://www.goodreads.com/${p.social.goodreads}` },
    { label: "X", href: `https://x.com/${p.social.x}` },
    { label: "Dribbble", href: `https://dribbble.com/${p.social.dribbble}` },
  ];
}
