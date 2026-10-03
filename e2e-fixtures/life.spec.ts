import { expect, test } from "@playwright/test";

// Runs against a build made with SOURCE_FIXTURES=1 (`npm run e2e:fixtures`),
// so every source carries the rows recorded in tests/fixtures/.

test("bands show real rows from every source", async ({ page }) => {
  await page.goto("/life/");
  const films = page.locator('[data-section="films"]');
  await expect(films.locator("li")).toHaveCount(3);
  await expect(films).toContainText("Love & Other Drugs");
  await expect(films).toContainText("3.5 · 2010");
  await expect(films).not.toContainText("\u2605");
  const books = page.locator('[data-section="books"]');
  await expect(books).toContainText("Harry Potter and the Deathly Hallows");
  await expect(books).toContainText("Hacı Komünist");
  for (const [title, rating] of [
    ["Joseph Müller-Brockman", "2"],
    ["Bozkır", "3"],
    ["Hacı Komünist", "4"],
  ]) {
    await expect(books.locator("li", { hasText: title }).locator("span.type-mono-12").last()).toHaveText(rating);
  }
  await expect(books).not.toContainText("\u2605");
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
