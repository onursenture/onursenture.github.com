import { test } from "@playwright/test";
import { auditRoutes } from "./a11y-routes";
import { expectNoViolations } from "./axe";

// Every public route at phone and desktop width, in the empty-state build.
for (const { route, path } of auditRoutes()) {
  if (!path) continue;
  for (const width of [390, 1440]) {
    test(`axe: ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expectNoViolations(page, `${route} at ${width}px`);
    });
  }
}
