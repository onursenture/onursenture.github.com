import { describe, expect, it } from "vitest";
import { filterIcons, recolorIcon } from "@/lib/work/icons";
import { loadIcons } from "@/lib/work/primeicons";

describe("recolorIcon", () => {
  it("paints a bare icon with currentColor and hides it from assistive tech", () => {
    const out = recolorIcon('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g id="check"><path d="M1"/></g></svg>');
    expect(out).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><g><path d="M1"/></g></svg>');
  });

  it("drops the root size, keeps fill=none, and maps black and white to tokens", () => {
    const out = recolorIcon(
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill="black" d="M1"/><rect width="2" height="2" fill="white"/><path stroke="#000" d="M2"/></svg>',
    );
    expect(out).toBe(
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1"/><rect width="2" height="2" style="fill:var(--color-bg)"/><path stroke="currentColor" d="M2"/></svg>',
    );
  });
});

describe("filterIcons", () => {
  const icons = ["arrow-up", "arrow-down", "chart-bar", "user"].map((name) => ({ name, svg: "" }));

  it("matches every term, case-insensitively; an empty query keeps all", () => {
    expect(filterIcons(icons, "").map((i) => i.name)).toHaveLength(4);
    expect(filterIcons(icons, "ARROW").map((i) => i.name)).toEqual(["arrow-up", "arrow-down"]);
    expect(filterIcons(icons, "arrow down").map((i) => i.name)).toEqual(["arrow-down"]);
    expect(filterIcons(icons, "nope")).toEqual([]);
  });
});

describe("loadIcons", () => {
  it("reads the pinned MIT release: 7.0.0 and its 313 SVGs", () => {
    const set = loadIcons();
    expect(set.version).toBe("7.0.0");
    expect(set.icons).toHaveLength(313);
    expect(set.icons.find((i) => i.name === "chart-bar")?.svg).toMatch(/^<svg[^>]*aria-hidden="true"/);
    for (const icon of set.icons) {
      expect(icon.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(icon.svg).not.toContain(' id="');
    }
  });
});
