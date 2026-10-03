import { expect, test } from "@playwright/test";

test("/life/ is the boot readout, then a row for every section, with empty states", async ({ page }) => {
  await page.goto("/life/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("Booting w00f...");
  await expect(now).toContainText("Human detected.");
  await expect(now).toContainText("idle");
  for (const id of ["films", "books", "articles", "writing", "photos"]) {
    await expect(page.locator(`[data-section="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-section="github"]')).toHaveCount(0);
  await expect(page.locator('[data-section="films"]')).toContainText("Nothing here yet.");
});

test("a direct load renders the readout complete, with no typing", async ({ page }) => {
  await page.goto("/life/");
  await expect(page.getByRole("region", { name: "Now" })).toContainText("Human detected.");
});

test("the photos row links every photo and its All link goes to /life/photos/", async ({ page }) => {
  await page.goto("/life/");
  const photos = page.locator('[data-section="photos"]');
  await expect(photos.locator("li a")).toHaveCount(5);
  await expect(photos.getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", "/life/photos/");
});

test("the home tiles' /life fragments each resolve to one element", async ({ page }) => {
  for (const id of ["books", "films", "photos", "articles"]) {
    await page.goto(`/life/#${id}`);
    await expect(page.locator(`[id="${id}"]`), `#${id}`).toHaveCount(1);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("arriving from the switch shows the readout at once", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("switch", { name: "Life" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/life\/$/);
    // No typing: the last boot line is complete immediately.
    await expect(page.getByRole("region", { name: "Now" }).filter({ visible: true })).toContainText("Human detected.", { timeout: 300 });
  });
});

test("arriving from the switch types the readout in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("switch", { name: "Life" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  const now = page.getByRole("region", { name: "Now" }).filter({ visible: true });
  // Mid-typing the last boot line is not complete yet; by ~1.5s it is.
  await expect(now).not.toContainText("Human detected.", { timeout: 200 });
  await expect(now).toContainText("Human detected.", { timeout: 3000 });
});
