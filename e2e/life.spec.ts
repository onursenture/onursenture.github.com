import { expect, test } from "@playwright/test";

test("site view renders a band for every section, with empty states", async ({ page }) => {
  await page.goto("/life/");
  for (const id of ["films", "books", "articles", "writing", "github", "photos"]) {
    await expect(page.locator(`[data-section="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
  await expect(page.locator('[data-section="films"]')).toContainText("Nothing here yet.");
});

test("the photos band links every photo with a decorative thumbnail", async ({ page }) => {
  await page.goto("/life/");
  const photos = page.locator('[data-section="photos"]');
  await expect(photos.locator("li a")).toHaveCount(5);
  await expect(photos.locator('li img[alt=""]')).toHaveCount(5);
  await expect(photos.getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", "/photos/");
});

test("dashboard view shows panels with real table headers", async ({ page }) => {
  await page.goto("/life/?view=dashboard");
  await expect(page.locator('[data-section="sync-status"]')).toBeVisible();
  const films = page.locator('[data-section="films"]');
  await expect(films).toContainText("Not synced yet");
  await expect(films.locator('thead th[scope="col"]')).toHaveText(["Title", "Year", "Rating", "Watched"]);
  await expect(page.locator('[data-section="photos"] tbody tr')).toHaveCount(5);
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
