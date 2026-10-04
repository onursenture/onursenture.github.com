import { describe, expect, it } from "vitest";
import { NAV_ITEMS, headerItems, isActive, readyItems } from "@/lib/nav";

describe("nav config", () => {
  it("lists the Work-side items in IA order; Life is reached by the switch, not the nav", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Lab", "Resume"]);
  });

  it("marks Resume ready for the home's section link but keeps it out of the header, which has no nav", () => {
    expect(readyItems().map((i) => i.label)).toEqual(["Resume"]);
    expect(headerItems()).toEqual([]);
    expect(headerItems([{ label: "X", href: "/x/", ready: true, inHeader: true }]).map((i) => i.label)).toEqual(["X"]);
    expect(headerItems([{ label: "Y", href: "/y/", ready: false, inHeader: true }])).toEqual([]);
    expect(headerItems([{ label: "Z", href: "/z/", ready: true, inHeader: false }])).toEqual([]);
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
