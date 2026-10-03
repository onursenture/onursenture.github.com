import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActive, readyItems } from "@/lib/nav";

describe("nav config", () => {
  it("lists the Work-side items in IA order; Life is reached by the switch, not the nav", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Lab", "Resume"]);
  });

  it("renders only ready items; none is ready yet, so the header shows no nav", () => {
    expect(readyItems()).toEqual([]);
    expect(readyItems([{ label: "X", href: "/x/", ready: true }]).map((i) => i.label)).toEqual(["X"]);
  });

  it("has no Work item: /work/ redirects home", () => {
    expect(NAV_ITEMS.some((i) => i.href === "/work/")).toBe(false);
  });

  it("matches an item by prefix", () => {
    const lab = NAV_ITEMS[0];
    expect(isActive(lab, "/lab/")).toBe(true);
    expect(isActive(lab, "/lab/some-project/")).toBe(true);
    expect(isActive(lab, "/")).toBe(false);
    expect(isActive(lab, "/life/")).toBe(false);
  });
});
