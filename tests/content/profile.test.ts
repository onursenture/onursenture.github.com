import { describe, expect, it } from "vitest";
import { homeSwitches, profile, socialLinks } from "@/content/profile";

describe("profile", () => {
  it("builds the footer links from the handles, in footer order", () => {
    expect(socialLinks()).toEqual([
      { label: "GitHub", href: "https://github.com/onursenture" },
      { label: "Letterboxd", href: "https://letterboxd.com/onur/" },
      { label: "Goodreads", href: "https://www.goodreads.com/onur" },
      { label: "X", href: "https://x.com/w00f" },
      { label: "Dribbble", href: "https://dribbble.com/onursenture" },
    ]);
  });

  it("turns both home switches on in the repo, and reads a missing stored switch from the repo", () => {
    expect(profile.available).toBe(true);
    expect(profile.bookOnHome).toBe(true);
    expect(homeSwitches({ lead: profile.lead, bio: profile.bio })).toEqual({ available: true, bookOnHome: true });
    expect(homeSwitches({ lead: profile.lead, bio: profile.bio, available: false })).toEqual({ available: false, bookOnHome: true });
    expect(homeSwitches({ lead: profile.lead, bio: profile.bio, bookOnHome: false })).toEqual({ available: true, bookOnHome: false });
  });
});
