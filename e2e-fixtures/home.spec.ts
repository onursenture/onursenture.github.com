import { expect, test } from "@playwright/test";

// Runs against a SOURCE_FIXTURES=1 build (see e2e-fixtures/life.spec.ts).

test("Contributions shows GitHub's total with its period, and the heatmap", async ({ page }) => {
  await page.goto("/");
  const contributions = page.locator("#contributions");
  await expect(contributions).toContainText("7 contributions in the last 12 months");
  const heatmap = contributions.getByRole("img", { name: "7 contributions in the last 12 months" });
  await expect(heatmap).toBeVisible();
  // tests/fixtures/github.json: 5 days; the 4-contribution day is level 4.
  await expect(heatmap.locator("[title]")).toHaveCount(5);
  // Level 4 is the full accent (#2F55F5).
  await expect(heatmap.locator('[title="4 on 2026-09-30"]')).toHaveCSS("background-color", "rgb(47, 85, 245)");
});
