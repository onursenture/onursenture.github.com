import { describe, expect, it } from "vitest";
import { archive, caseStudies } from "@/content/work";
import { hasImage } from "@/lib/images/manifest";
import { validateWork } from "@/lib/work/validate";

describe("content/work", () => {
  it("passes every registry check", () => {
    expect(validateWork(caseStudies, archive, hasImage)).toEqual([]);
  });

  it("lists the four PrimeTek case studies in display order", () => {
    expect(caseStudies.map((s) => s.slug)).toEqual(["primeone", "primeblocks", "primeicons", "templates"]);
    for (const study of caseStudies) expect(study.org).toBe("primetek");
  });

  it("gives every entry a source, so each note can be checked", () => {
    for (const study of caseStudies) {
      expect(study.entries.length).toBeGreaterThan(0);
      for (const entry of study.entries) expect(entry.source, `${study.slug}/${entry.id}`).toMatch(/^https:\/\//);
    }
  });

  it("states Onur's role on every case study", () => {
    for (const study of caseStudies) expect(study.facts.find((f) => f.label === "Role")?.value).toBe("Design lead");
  });

  it("credits Genesis to the colleagues who designed and built it", () => {
    const genesis = caseStudies.find((s) => s.slug === "templates")!.entries.find((e) => e.id === "genesis")!;
    expect(genesis.credits).toEqual([
      { name: "Ümit Çelik", href: "https://x.com/umitceliks" },
      { name: "Taner Ergin", role: "implementation", href: "https://x.com/tanerengiin" },
    ]);
  });

  it("never states an unconfirmed headline number", () => {
    const text = JSON.stringify({ caseStudies, archive });
    for (const claim of ["80+", "500 blocks", "25+"]) expect(text).not.toContain(claim);
  });
});
