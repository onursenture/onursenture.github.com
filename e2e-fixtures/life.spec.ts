import { expect, test } from "@playwright/test";

// Runs against a build made with SOURCE_FIXTURES=1 (`npm run e2e:fixtures`),
// so every source carries the rows recorded in tests/fixtures/.

test("site bands show real rows from every source", async ({ page }) => {
  await page.goto("/life/");
  const films = page.locator('[data-section="films"]');
  await expect(films.locator("li")).toHaveCount(3);
  await expect(films).toContainText("Love & Other Drugs");
  await expect(films).toContainText("★★★½ · 2010");
  const books = page.locator('[data-section="books"]');
  await expect(books).toContainText("Harry Potter and the Deathly Hallows");
  await expect(books).toContainText("Hacı Komünist");
  await expect(books).toContainText("★★★★");
  const articles = page.locator('[data-section="articles"]');
  await expect(articles).toContainText("Jurassic Park computers in excruciating detail");
  await expect(articles).toContainText("fabiensanglard.net · 13 min");
  await expect(page.locator('[data-section="writing"]')).toContainText("Second post");
  const github = page.locator('[data-section="github"]');
  await expect(github).toContainText("7 contributions");
  await expect(github.getByRole("img", { name: "7 contributions in the last year" })).toBeVisible();
  await expect(page.getByText("Nothing here yet.")).toHaveCount(0);
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
});

test("dashboard panels show table rows, sync times and GitHub stats", async ({ page }) => {
  await page.goto("/life/?view=dashboard");
  const films = page.locator('[data-section="films"]');
  await expect(films.getByRole("row", { name: /Love & Other Drugs/ })).toBeVisible();
  await expect(films.getByText(/^Synced/)).toBeVisible();
  await expect(films.locator('time[datetime="2026-10-02T12:00:00.000Z"]')).toBeVisible();
  await expect(page.locator('[data-section="books"] tbody tr')).toHaveCount(6);
  const github = page.locator('[data-section="github"]');
  await expect(github.locator("dt")).toHaveText(["Contributions", "Active days", "Longest streak"]);
  await expect(github.locator("dd")).toHaveText(["7", "3", "3"]);
  const sources = page.locator('[data-section="sync-status"]');
  await expect(sources.locator("[data-health]")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(0);
  await expect(page.getByText("Not synced yet")).toHaveCount(0);
});
