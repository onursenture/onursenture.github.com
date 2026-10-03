import { describe, expect, it } from "vitest";
import { archive, caseStudies } from "@/content/work";
import { experience } from "@/content/experience";
import { buildWorkIndex } from "@/lib/work/index-groups";

describe("buildWorkIndex", () => {
  const groups = buildWorkIndex(caseStudies, archive, experience);

  it("groups case studies by org, only orgs with ready work", () => {
    expect(groups.map((g) => g.org)).toEqual(["primetek"]);
  });

  it("takes the role and span from the experience list, and the org's site", () => {
    expect(groups[0]).toMatchObject({ role: "Design lead", span: "May 2016–Apr 2026", site: "https://primefaces.org" });
  });

  it("lists the case studies in registry order, then the Archive with its year span", () => {
    expect(groups[0].rows.map((r) => [r.title, r.href])).toEqual([
      ["PrimeOne", "/work/primeone/"],
      ["PrimeBlocks", "/work/primeblocks/"],
      ["PrimeIcons", "/work/primeicons/"],
      ["Templates", "/work/templates/"],
      ["Archive", "/work/archive/"],
    ]);
    expect(groups[0].rows[4]).toMatchObject({ years: "2018–2025", kind: "everything else" });
  });
});
