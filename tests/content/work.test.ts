import { describe, expect, it } from "vitest";
import { archive, caseStudies } from "@/content/work";
import { hasImage } from "@/lib/images/manifest";
import { validateWork } from "@/lib/work/validate";

describe("content/work", () => {
  it("passes every registry check", () => {
    expect(validateWork(caseStudies, archive, hasImage)).toEqual([]);
  });
});
