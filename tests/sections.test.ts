import { describe, expect, it, vi } from "vitest";
import { SectionBlock } from "@/components/sections/section-block";
import { isVisible, visibleSections } from "@/components/sections/types";
import type { AnySectionDefinition } from "@/components/sections/types";

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

describe("isVisible", () => {
  it("shows dashboard-only sections only in the dashboard view", () => {
    expect(isVisible({ visibility: "dashboard" }, "site")).toBe(false);
    expect(isVisible({ visibility: "dashboard" }, "dashboard")).toBe(true);
  });

  it("shows sections for both views everywhere", () => {
    expect(isVisible({ visibility: "both" }, "site")).toBe(true);
    expect(isVisible({ visibility: "both" }, "dashboard")).toBe(true);
  });
});

describe("SectionBlock", () => {
  function section(visibility: "both" | "dashboard") {
    const load = vi.fn(async () => ({ data: null, lastSuccessAt: null }));
    const definition: AnySectionDefinition = {
      id: "test",
      title: "Test",
      visibility,
      load,
      Site: () => null,
      Dashboard: () => null,
    };
    return { definition, load };
  }

  it("renders nothing, and loads nothing, for a dashboard-only section in site view", async () => {
    const { definition, load } = section("dashboard");
    expect(await SectionBlock({ section: definition, view: "site" })).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it("renders a dashboard-only section in the dashboard view", async () => {
    const { definition, load } = section("dashboard");
    expect(await SectionBlock({ section: definition, view: "dashboard" })).not.toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("renders a section for both views in site view", async () => {
    const { definition } = section("both");
    expect(await SectionBlock({ section: definition, view: "site" })).not.toBeNull();
  });
});
