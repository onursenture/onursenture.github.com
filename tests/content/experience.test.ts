import { describe, expect, it } from "vitest";
import { experience, formatSpan, safeSpan } from "@/content/experience";
import { ORGS } from "@/content/orgs";
import { productPages } from "@/content/work";
import { repoSite } from "@/lib/content/site";
import { experienceViews } from "@/lib/work/views";

describe("formatSpan", () => {
  it("formats month spans, with an open end as now", () => {
    expect(formatSpan("2016-05", "2026-04")).toBe("May 2016–Apr 2026");
    expect(formatSpan("2013-06", null)).toBe("Jun 2013–now");
  });
});

describe("safeSpan", () => {
  it("formats real months and gives a half-filled draft an empty span instead of 'undefined'", () => {
    expect(safeSpan("2016-05", "2026-04")).toBe("May 2016–Apr 2026");
    expect(safeSpan("2013-06", null)).toBe("Jun 2013–now");
    expect(safeSpan("", null)).toBe("");
    expect(safeSpan("2016-05", "")).toBe("");
    expect(safeSpan("2016-13", null)).toBe("");
  });
});

describe("experience", () => {
  it("lists the confirmed roles, ongoing first, then by end date, newest first, each with a known org", () => {
    expect(experience.map((e) => e.org)).toEqual(["orkestra", "primetek", "etiya"]);
    for (const entry of experience) expect(ORGS[entry.org]).toBeDefined();
  });

  it("nests PrimeTek's products under it, each linked to its page with the page's title and kind", () => {
    const primetek = experience.find((e) => e.org === "primetek")!;
    expect(primetek.children.map((c) => c.title)).toEqual(["PrimeOne", "PrimeBlocks", "PrimeIcons", "Templates", "PrimeStore", "Theme Designer"]);
    for (const child of primetek.children) {
      const page = productPages.find((p) => `/work/${p.slug}/` === child.href);
      expect(page, child.title).toBeDefined();
      expect(child.title).toBe(page!.title);
      expect(child.note).toBe(page!.kind);
    }
  });

  it("nests the nine Orkestra products, newest first, each linked to its page with the page's title and kind", () => {
    const orkestra = experience.find((e) => e.org === "orkestra")!;
    expect(orkestra.children.map((c) => c.title)).toEqual([
      "Nebuu",
      "Rebound Line",
      "Hi Jump",
      "İmparator",
      "Harf Marf",
      "Beatografi",
      "count.do",
      "Maç Kaçta",
      "Gonna",
    ]);
    for (const child of orkestra.children) {
      const page = productPages.find((p) => `/work/${p.slug}/` === child.href);
      expect(page, child.title).toBeDefined();
      expect(child.title).toBe(page!.title);
      expect(child.note).toBe(page!.kind);
      expect(child.years, child.title).toBeUndefined();
    }
  });

  it("resolves every row's year for the home", () => {
    for (const entry of experienceViews(repoSite())) for (const child of entry.children) expect(child.years, child.title).toMatch(/^\d{4}(–(\d{4}|now))?$/);
  });
});
