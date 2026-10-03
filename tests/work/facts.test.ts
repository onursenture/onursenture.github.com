import { describe, expect, it } from "vitest";
import { getCaseStudy, getStudyView, caseStudyFacts } from "@/lib/work";
import type { CaseStudy } from "@/content/work/types";

describe("caseStudyFacts", () => {
  it("for a non-templates study returns study.facts unchanged", () => {
    const primeone = getCaseStudy("primeone")!;
    const view = getStudyView(primeone);
    const facts = caseStudyFacts(primeone, view);
    expect(facts).toEqual(primeone.facts);
  });

  it("for the real templates case study with getStudyView, the last fact is Coverage with 26 templates, 8 remasters and 33 pages", () => {
    const templates = getCaseStudy("templates")!;
    const view = getStudyView(templates);
    const facts = caseStudyFacts(templates, view);
    const lastFact = facts[facts.length - 1];
    expect(lastFact).toEqual({ label: "Coverage", value: "26 templates · 8 remasters · 33 pages" });
  });

  it("for a templates study with zero page-tagged media, value is the templates and remasters", () => {
    const templates = getCaseStudy("templates")!;
    // Create a copy with all page tags removed
    const templatesNoPages: CaseStudy = {
      ...templates,
      entries: templates.entries.map((entry) => ({
        ...entry,
        media: entry.media.map((media) => ({
          ...media,
          tags: (media.tags || []).filter((tag) => tag !== "page"),
        })),
      })),
    };
    const view = getStudyView(templatesNoPages);
    const facts = caseStudyFacts(templatesNoPages, view);
    const lastFact = facts[facts.length - 1];
    expect(lastFact).toEqual({ label: "Coverage", value: "26 templates · 8 remasters" });
  });

  it("with exactly 1 entry and a page, the Coverage says 1 template · 1 page (singular)", () => {
    const templates = getCaseStudy("templates")!;
    // Create a copy with only one entry (Verona, which has page-tagged media)
    const verona = templates.entries.find((entry) => entry.id === "verona")!;
    const templatesOneEntry: CaseStudy = {
      ...templates,
      entries: [verona],
    };
    const view = getStudyView(templatesOneEntry);
    const facts = caseStudyFacts(templatesOneEntry, view);
    const lastFact = facts[facts.length - 1];
    expect(lastFact).toEqual({ label: "Coverage", value: "1 template · 1 page" });
  });

  it("with exactly 1 entry and no pages, the Coverage says 1 template (singular)", () => {
    const templates = getCaseStudy("templates")!;
    // Create a copy with only one entry (Verona) and no page tags
    const verona = templates.entries.find((entry) => entry.id === "verona")!;
    const templatesOneEntry: CaseStudy = {
      ...templates,
      entries: [
        {
          ...verona,
          media: verona.media.map((media) => ({
            ...media,
            tags: (media.tags || []).filter((tag) => tag !== "page"),
          })),
        },
      ],
    };
    const view = getStudyView(templatesOneEntry);
    const facts = caseStudyFacts(templatesOneEntry, view);
    const lastFact = facts[facts.length - 1];
    expect(lastFact).toEqual({ label: "Coverage", value: "1 template" });
  });

  it("with 1 original and 1 remaster and no pages, the Coverage says 1 template · 1 remaster", () => {
    const templates = getCaseStudy("templates")!;
    const original = templates.entries.find((entry) => entry.id === "morpheus")!;
    const remaster = templates.entries.find((entry) => entry.id === "poseidon-remastered-2020")!;
    const study: CaseStudy = { ...templates, entries: [original, remaster] };
    const facts = caseStudyFacts(study, getStudyView(study));
    expect(facts[facts.length - 1]).toEqual({ label: "Coverage", value: "1 template · 1 remaster" });
  });

  it("with only remasters, the templates part reads 0 templates", () => {
    const templates = getCaseStudy("templates")!;
    const remaster = templates.entries.find((entry) => entry.id === "poseidon-remastered-2020")!;
    const study: CaseStudy = { ...templates, entries: [remaster] };
    const facts = caseStudyFacts(study, getStudyView(study));
    expect(facts[facts.length - 1]).toEqual({ label: "Coverage", value: "0 templates · 1 remaster" });
  });
});
