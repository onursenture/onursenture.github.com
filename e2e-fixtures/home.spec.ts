import { expect, test } from "@playwright/test";

// Runs against a SOURCE_FIXTURES=1 build (see e2e-fixtures/life.spec.ts).

test("Latest work shows GitHub's total with its period, and the chart", async ({ page }) => {
  await page.goto("/");
  const latest = page.locator("#latest");
  await expect(latest).toContainText("7 contributions in the last 12 months");
  await expect(latest.locator("canvas").first()).toBeAttached();
});
