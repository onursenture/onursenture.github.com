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

  it("for the real templates case study with getStudyView, the last fact is Coverage with 6 templates and 1 page", () => {
    const templates = getCaseStudy("templates")!;
    const view = getStudyView(templates);
    const facts = caseStudyFacts(templates, view);
    const lastFact = facts[facts.length - 1];
    expect(lastFact).toEqual({ label: "Coverage", value: "6 templates · 1 page" });
  });

  it("for a templates study with zero page-tagged media, value is just the template count", () => {
    const templates = getCaseStudy("templates")!;
    // Create a copy with all page tags removed
    const templatesNoPags: CaseStudy = {
      ...templates,
      entries: templates.entries.map((entry) => ({
        ...entry,
        media: entry.media.map((media) => ({
          ...media,
          tags: (media.tags || []).filter((tag) => tag !== "page"),
        })),
      })),
    };
    const view = getStudyView(templatesNoPags);
    const facts = caseStudyFacts(templatesNoPags, view);
    const lastFact = facts[facts.length - 1];
    expect(lastFact).toEqual({ label: "Coverage", value: "6 templates" });
  });

  it("with exactly 1 entry it says 1 template (singular)", () => {
    const templates = getCaseStudy("templates")!;
    // Create a copy with only one entry
    const templatesOneEntry: CaseStudy = {
      ...templates,
      entries: [templates.entries[0]],
    };
    const view = getStudyView(templatesOneEntry);
    const facts = caseStudyFacts(templatesOneEntry, view);
    const lastFact = facts[facts.length - 1];
    expect(lastFact.label).toBe("Coverage");
    expect(lastFact.value).toContain("1 template");
  });
});
