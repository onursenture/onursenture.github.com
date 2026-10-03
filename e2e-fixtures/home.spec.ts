import { expect, test } from "@playwright/test";

// Runs against a SOURCE_FIXTURES=1 build (see e2e-fixtures/life.spec.ts).

test("Contributions shows GitHub's total with its period, and the heatmap", async ({ page }) => {
  await page.goto("/");
  const contributions = page.locator("#contributions");
  await expect(contributions).toContainText("7 contributions in the last 12 months");
  await expect(contributions.getByRole("img", { name: /contributions in the last year/ })).toBeVisible();
});
