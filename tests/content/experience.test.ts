import { describe, expect, it } from "vitest";
import { experience, formatSpan } from "@/content/experience";
import { ORGS } from "@/content/orgs";

describe("formatSpan", () => {
  it("formats month spans, with an open end as now", () => {
    expect(formatSpan("2016-05", "2026-04")).toBe("May 2016–Apr 2026");
    expect(formatSpan("2013-06", null)).toBe("Jun 2013–now");
  });
});

describe("experience", () => {
  it("lists the confirmed roles, ongoing first, then by end date, newest first, each with a known org", () => {
    expect(experience.map((e) => e.org)).toEqual(["orkestra", "primetek", "etiya"]);
    for (const entry of experience) expect(ORGS[entry.org]).toBeDefined();
  });

  it("nests PrimeTek's products under it", () => {
    const primetek = experience.find((e) => e.org === "primetek")!;
    expect(primetek.children.map((c) => c.title)).toEqual(["PrimeOne", "PrimeBlocks", "PrimeIcons", "Templates"]);
    expect(primetek.children.every((c) => c.href?.startsWith("/work/"))).toBe(true);
  });
});
