import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { booking } from "@/content/booking";
import { STACK, buildSections, sections } from "@/content/colophon";
import { shortVersion, stackItems } from "@/lib/colophon";

const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe("shortVersion", () => {
  it("keeps the major from 1.0 up, and major.minor below it", () => {
    expect(shortVersion("16.3.8")).toBe("16");
    expect(shortVersion("^4.3.3")).toBe("4");
    expect(shortVersion("~0.45.3")).toBe("0.45");
    expect(shortVersion("latest")).toBeNull();
  });
});

describe("stackItems", () => {
  it("adds versions from package.json and leaves out a package that isn't there", () => {
    const items = stackItems(
      [
        { name: "Next.js", href: "https://nextjs.org", pkg: "next" },
        { name: "Gone", href: "https://example.com", pkg: "not-installed" },
        { name: "Vercel", href: "https://vercel.com", note: "hosting" },
      ],
      { next: "16.3.8" },
    );
    expect(items).toEqual([
      { name: "Next.js", href: "https://nextjs.org", version: "16" },
      { name: "Vercel", href: "https://vercel.com", note: "hosting" },
    ]);
  });

  it("finds every package the real stack names", () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(stackItems(STACK, deps)).toHaveLength(STACK.length);
  });
});

describe("the colophon copy", () => {
  it("runs Built, Type, Texture, Data, Source, Agent, History after the Stack row", () => {
    expect(sections.map((s) => s.label)).toEqual(["Built", "Type", "Texture", "Data", "Source", "Agent", "History"]);
  });

  it("links only https, or a path inside the site", () => {
    for (const section of sections) {
      for (const part of section.paragraphs.flat()) {
        if (typeof part !== "string") expect(part.href).toMatch(/^(https:\/\/|\/)/);
      }
    }
  });

  it("credits Dither Kit and claims no Bluesky cross-posting", () => {
    const text = JSON.stringify(sections);
    expect(text).toContain("Dither Kit");
    expect(text).not.toMatch(/cross-?post/i);
  });

  it("names the cal.com call booking only while booking is on", () => {
    const data = (all: typeof sections) => JSON.stringify(all.find((s) => s.id === "data"));
    expect(data(sections)).toContain(`https://cal.com/${booking.calUsername}`);
    const off = data(buildSections(undefined, { ...booking, calUsername: "" }));
    expect(off).not.toContain("cal.com");
    expect(off).toContain("Bluesky");
  });
});
