import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { auditRoutes } from "../e2e/a11y-routes";

const appDir = join(__dirname, "..", "app");

// app/**/page.tsx outside app/admin, as "(work)/notes/[tid]".
function pageRoutes(): string[] {
  return (readdirSync(appDir, { recursive: true }) as string[])
    .map((file) => file.split("\\").join("/"))
    .filter((file) => file.endsWith("/page.tsx") && !file.startsWith("admin/"))
    .map((file) => file.slice(0, -"/page.tsx".length))
    .sort();
}

describe("the axe guard's route list", () => {
  it("names every public page route exactly once", () => {
    const listed = auditRoutes().map((r) => r.route);
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed].sort()).toEqual(pageRoutes());
  });
});
