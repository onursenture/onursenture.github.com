import { describe, expect, it } from "vitest";
import { visibleSections } from "@/components/sections/types";

describe("visibleSections", () => {
  const sections = [
    { id: "a", visibility: "both" as const },
    { id: "b", visibility: "dashboard" as const },
  ];

  it("hides dashboard-only sections in site view", () => {
    expect(visibleSections(sections, "site").map((s) => s.id)).toEqual(["a"]);
  });

  it("shows everything in dashboard view", () => {
    expect(visibleSections(sections, "dashboard").map((s) => s.id)).toEqual(["a", "b"]);
  });
});
