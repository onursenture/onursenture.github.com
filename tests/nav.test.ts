import { describe, expect, it } from "vitest";
import { NAV_ITEMS, isActive, readyItems } from "@/lib/nav";

describe("nav config", () => {
  it("lists the Work-side items in IA order; Life is reached by the switch, not the nav", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Work", "Lab", "Resume"]);
  });

  it("renders only ready items; none is ready yet, so the header shows no nav", () => {
    expect(readyItems()).toEqual([]);
    expect(readyItems([{ label: "X", href: "/x/", ready: true }]).map((i) => i.label)).toEqual(["X"]);
  });

  it("matches an item by prefix", () => {
    const work = NAV_ITEMS[0];
    expect(isActive(work, "/work/")).toBe(true);
    expect(isActive(work, "/work/primeone/")).toBe(true);
    expect(isActive(work, "/")).toBe(false);
    expect(isActive(work, "/life/")).toBe(false);
  });
});
