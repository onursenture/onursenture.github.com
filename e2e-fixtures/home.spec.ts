import { expect, test } from "@playwright/test";

// Runs against a SOURCE_FIXTURES=1 build (see e2e-fixtures/life.spec.ts).

test("Off the clock shows four tiles with real titles", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator("#off-the-clock");
  await expect(strip.locator("[data-tile]")).toHaveCount(4);
  await expect(strip.locator('[data-tile="Reading"]')).toContainText(
    "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
  );
  await expect(strip.locator('[data-tile="Reading"]')).toContainText("J.K. Rowling");
  await expect(strip.locator('[data-tile="Watched"]')).toContainText("Love & Other Drugs");
  await expect(strip.locator('[data-tile="Watched"]')).toContainText("3.5");
  await expect(strip.locator('[data-tile="Photo"] img')).toHaveAttribute("alt", "");
  await expect(strip.locator('[data-tile="Saved"]')).toContainText("Jurassic Park computers in excruciating detail");
  await expect(strip.locator('[data-tile="Saved"]')).toContainText("fabiensanglard.net · 13 min");
});

test("the dashboard home fills the metrics, Activity and Sources", async ({ page }) => {
  await page.goto("/?view=dashboard");
  // 7 contributions over 12 months; 3 books being read.
  const stats = page.getByTestId("stat-row");
  await expect(stats.locator("dt")).toHaveText(["Contributions · 12 mo", "Reading now"]);
  await expect(stats.locator("dd")).toHaveText(["7", "3"]);

  const activity = page.locator("#activity li");
  await expect(activity).toHaveCount(8);
  await expect(activity.first()).toContainText("Watched");
  await expect(activity.first()).toContainText("Love & Other Drugs");
  await expect(activity.nth(3)).toContainText("Finished");
  await expect(activity.last()).toContainText("Saved");
  await expect(activity.last()).toContainText("Leaving Mozilla");

  const sources = page.locator("#sources");
  await expect(sources.locator("[data-health]")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(0);
  await expect(page.getByTestId("sync-line")).not.toContainText("○");
});
