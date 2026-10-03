import { describe, expect, it } from "vitest";
import { buildReadout } from "@/lib/life/readout";

describe("buildReadout", () => {
  it("builds one line per source that has data, in readout order", () => {
    const lines = buildReadout({
      film: { title: "Love & Other Drugs", link: "https://letterboxd.com/x", ratingValue: 3.5 },
      book: { title: "Educated", author: "Tara Westover", link: "https://goodreads.com/x" },
      article: { title: "Taste for Makers", link: "https://paulgraham.com/x", domain: "paulgraham.com", minutes: 18 },
      photo: { title: "Night Boulevard", slug: "night-boulevard" },
      post: { title: "Hello", link: "https://w00f.org/hello" },
      contributions: { total: 2133, weeks: [{ days: [{ count: 1, date: "2026-01-04", level: 1 }] }] },
    });
    expect(lines.map((l) => `${l.label}: ${l.value}${l.detail ? ` ${l.detail}` : ""}`)).toEqual([
      "last watched: Love & Other Drugs 3.5",
      "reading: Educated Tara Westover",
      "saved: Taste for Makers paulgraham.com · 18 min",
      "last photo: Night Boulevard",
      "writing: Hello",
      "contributions, last 12 months: 2,133",
    ]);
    expect(lines.find((l) => l.key === "photo")!.href).toBe("/life/photos/night-boulevard/");
  });

  it("omits a source with no data instead of faking a line", () => {
    const lines = buildReadout({ film: undefined, contributions: { total: 0, weeks: [] } });
    expect(lines).toEqual([]);
  });

  it("never prints a star; an unrated film has no detail", () => {
    const [line] = buildReadout({ film: { title: "X", link: "https://l/x", ratingValue: null } });
    expect(line.detail).toBeUndefined();
    expect(JSON.stringify(line)).not.toContain("★");
  });
});
