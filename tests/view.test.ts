import { describe, expect, it } from "vitest";
import { isView, resolveView } from "@/lib/view/views";

describe("resolveView", () => {
  it("prefers a valid query over the cookie", () => {
    expect(resolveView("dashboard", "site")).toBe("dashboard");
  });

  it("falls back to the cookie, then to site", () => {
    expect(resolveView(null, "dashboard")).toBe("dashboard");
    expect(resolveView(null, undefined)).toBe("site");
  });

  it("ignores invalid values", () => {
    expect(resolveView("admin", "evil")).toBe("site");
    expect(isView("Site")).toBe(false);
  });
});
