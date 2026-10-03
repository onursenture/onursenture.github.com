import { expect, test } from "@playwright/test";

// Runs against a build made with SOURCE_FIXTURES=1 (`npm run e2e:fixtures`),
// so every source carries the rows recorded in tests/fixtures/.

test("site view shows real rows from every source", async ({ page }) => {
  await page.goto("/life/");
  await expect(page.locator('[data-section="films"]')).toContainText("Love & Other Drugs");
  await expect(page.locator('[data-section="books"]')).toContainText("Hacı Komünist");
  await expect(page.locator('[data-section="articles"]')).toContainText("Leaving Mozilla");
  await expect(page.locator('[data-section="writing"]')).toContainText("Second post");
  await expect(page.locator('[data-section="github"]')).toContainText("7 contributions");
  await expect(page.getByText("Not synced yet")).toHaveCount(0);
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
});

test("dashboard view shows a table row and a Synced time", async ({ page }) => {
  await page.goto("/life/?view=dashboard");
  const films = page.locator('[data-section="films"]');
  await expect(films.getByRole("row", { name: /Love & Other Drugs/ })).toBeVisible();
  await expect(films.getByText(/^Synced/)).toBeVisible();
  await expect(films.locator('time[datetime="2026-10-02T12:00:00.000Z"]')).toBeVisible();
  await expect(page.locator('[data-section="github"]')).toContainText("Contributions");
  await expect(page.locator('[data-section="sync-status"]')).toBeVisible();
  await expect(page.locator('[data-section="sync-status"]')).not.toContainText("never");
  await expect(page.getByText("Not synced yet")).toHaveCount(0);
});
