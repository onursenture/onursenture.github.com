import { expect, test } from "@playwright/test";

test("renders a band for every section, with empty states", async ({ page }) => {
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
  await expect(photos.getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", "/life/photos/");
});

test("the home tiles' /life fragments each resolve to one element", async ({ page }) => {
  for (const id of ["books", "films", "photos", "articles"]) {
    await page.goto(`/life/#${id}`);
    await expect(page.locator(`[id="${id}"]`), `#${id}`).toHaveCount(1);
  }
});
