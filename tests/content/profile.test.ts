import { describe, expect, it } from "vitest";
import { profile, socialLinks } from "@/content/profile";

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

  it("ships without a booking link or career metrics until they are confirmed", () => {
    expect(profile.bookingUrl).toBeUndefined();
    expect(profile.metrics).toBeUndefined();
  });
});
