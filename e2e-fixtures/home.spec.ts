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
  await expect(strip.locator('[data-tile="Watched"]')).toContainText("★★★½");
  await expect(strip.locator('[data-tile="Photo"] img')).toHaveAttribute("alt", "");
  await expect(strip.locator('[data-tile="Saved"]')).toContainText("Jurassic Park computers in excruciating detail");
  await expect(strip.locator('[data-tile="Saved"]')).toContainText("fabiensanglard.net · 13 min");
});
