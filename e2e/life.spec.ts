import { expect, test } from "@playwright/test";

test("site view renders every source section with an empty state", async ({ page }) => {
  await page.goto("/life/");
  for (const id of ["films", "books", "articles", "writing", "github"]) {
    await expect(page.locator(`[data-section="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
});

test("dashboard view adds dashboard-only sections", async ({ page }) => {
  await page.goto("/life/?view=dashboard");
  await expect(page.locator('[data-section="sync-status"]')).toBeVisible();
  await expect(page.locator('[data-section="films"]')).toContainText("Not synced yet");
});

test("client navigation after a toggle lands on the new view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Dashboard" }).click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Life" }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await expect(page.locator('[data-section="sync-status"]')).toBeVisible();
});

test("/dashboard/life/ redirects to /life/", async ({ page }) => {
  await page.goto("/dashboard/life/");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/life\/$/);
});
