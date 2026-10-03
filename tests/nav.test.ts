import { describe, expect, it } from "vitest";
import { NAV_ITEMS, OVERVIEW, cleanPath, isActive, readyItems } from "@/lib/nav";

describe("nav config", () => {
  it("keeps the foundation IA order and renders only ready items", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Work", "Lab", "Resume", "Notes", "Life"]);
    expect(readyItems().map((i) => i.label)).toEqual(["Life"]);
  });

  it("strips the internal view prefix that prerendering sees", () => {
    expect(cleanPath("/site/")).toBe("/");
    expect(cleanPath("/dashboard/life/")).toBe("/life/");
    expect(cleanPath("/life/")).toBe("/life/");
    expect(cleanPath("/sitemap/")).toBe("/sitemap/");
  });

  it("matches Overview exactly and Life by prefix, including photos", () => {
    const life = NAV_ITEMS.find((i) => i.label === "Life")!;
    expect(isActive(OVERVIEW, "/")).toBe(true);
    expect(isActive(OVERVIEW, "/site/")).toBe(true);
    expect(isActive(OVERVIEW, "/life/")).toBe(false);
    expect(isActive(life, "/life/")).toBe(true);
    expect(isActive(life, "/site/life/")).toBe(true);
    expect(isActive(life, "/photos/stabilo/")).toBe(true);
    expect(isActive(life, "/system/")).toBe(false);
  });
});
