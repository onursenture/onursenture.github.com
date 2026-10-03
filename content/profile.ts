// Who the site is about. Only facts Onur has confirmed go here.

// One segment of the home page's mono meta line, joined by " · ".
export type MetaSegment =
  | { text: string }
  // The label plus a live HH:mm clock in that IANA time zone.
  | { clock: string; label: string }
  // "OPEN TO ROLES", shown only while `available` is true.
  | { availability: true };

export interface Profile {
  name: string;
  // The home page headline.
  identity?: string;
  meta?: MetaSegment[];
  available: boolean;
  // "Book a call →" renders only when this is set (S6).
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
  // Career metrics for the dashboard Stat row, shown only when present (S4).
  metrics?: { label: string; value: string }[];
}

export const profile: Profile = {
  name: "Onur Senture",
  identity: "From components to complete apps, designed and built end to end.",
  meta: [
    { text: "DESIGNER + BUILDER" },
    { clock: "Europe/Istanbul", label: "ANKARA" },
    { availability: true },
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
