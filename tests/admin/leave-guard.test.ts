import { describe, expect, it } from "vitest";
import { isSaveShortcut, leavesPage } from "@/lib/admin/leave-guard";

const keys = { key: "s", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };

describe("isSaveShortcut", () => {
  it("takes Cmd+S and Ctrl+S, in either case", () => {
    expect(isSaveShortcut({ ...keys, metaKey: true })).toBe(true);
    expect(isSaveShortcut({ ...keys, ctrlKey: true })).toBe(true);
    expect(isSaveShortcut({ ...keys, key: "S", metaKey: true })).toBe(true);
  });

  it("ignores a plain s, other keys and other modifiers", () => {
    expect(isSaveShortcut(keys)).toBe(false);
    expect(isSaveShortcut({ ...keys, key: "a", metaKey: true })).toBe(false);
    expect(isSaveShortcut({ ...keys, metaKey: true, shiftKey: true })).toBe(false);
    expect(isSaveShortcut({ ...keys, ctrlKey: true, altKey: true })).toBe(false);
  });
});

describe("leavesPage", () => {
  const here = "https://onursenture.com/admin/work/nebuu/";
  const click = { button: 0, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, defaultPrevented: false };
  const anchor = { href: "/admin/", target: "", download: false };

  it("asks on a plain click to another page of the site", () => {
    expect(leavesPage(click, anchor, here)).toBe(true);
    expect(leavesPage(click, { ...anchor, href: "https://onursenture.com/" }, here)).toBe(true);
    expect(leavesPage(click, { ...anchor, href: "/admin/work/nebuu/?tab=1", target: "_self" }, here)).toBe(true);
  });

  it("lets new tabs, downloads, hash links, other origins and handled clicks through", () => {
    expect(leavesPage({ ...click, metaKey: true }, anchor, here)).toBe(false);
    expect(leavesPage({ ...click, ctrlKey: true }, anchor, here)).toBe(false);
    expect(leavesPage({ ...click, shiftKey: true }, anchor, here)).toBe(false);
    expect(leavesPage({ ...click, button: 1 }, anchor, here)).toBe(false);
    expect(leavesPage({ ...click, defaultPrevented: true }, anchor, here)).toBe(false);
    expect(leavesPage(click, { ...anchor, target: "_blank" }, here)).toBe(false);
    expect(leavesPage(click, { ...anchor, download: true }, here)).toBe(false);
    expect(leavesPage(click, { ...anchor, href: "#highlights" }, here)).toBe(false);
    expect(leavesPage(click, { ...anchor, href: "https://github.com/w00f" }, here)).toBe(false);
    expect(leavesPage(click, { ...anchor, href: "mailto:someone@example.com" }, here)).toBe(false);
  });
});
