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
  // "Open to work ●" on the home (the admin switches it, Sprint 8).
  available: boolean;
  // "Book a call →" under the home bio, while booking is set up (content/booking.ts).
  bookOnHome: boolean;
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

// The part of the profile the admin edits: the home's lead and bio (Sprint 7)
// and its two switches (Sprint 8). The switches are optional so a profile
// document published before Sprint 8 still parses; homeSwitches() reads a
// missing one from the repo.
export interface ProfileCopy {
  lead: { strong: string; rest: string };
  bio: BioSegment[][];
  available?: boolean;
  bookOnHome?: boolean;
}

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
  bookOnHome: true,
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

// The home's switches, with a missing stored value read from the repo.
export function homeSwitches(copy: ProfileCopy, repo: Profile = profile): { available: boolean; bookOnHome: boolean } {
  return { available: copy.available ?? repo.available, bookOnHome: copy.bookOnHome ?? repo.bookOnHome };
}
