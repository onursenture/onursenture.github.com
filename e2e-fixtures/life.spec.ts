import { expect, test } from "@playwright/test";

// Runs against a build made with SOURCE_FIXTURES=1 (`npm run e2e:fixtures`),
// so every source carries the rows recorded in tests/fixtures/.

test("Life rows show real items from every source", async ({ page }) => {
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
    await expect(books.locator("li", { hasText: title }).locator("span.type-meta").last()).toHaveText(rating);
  }
  await expect(books).not.toContainText("\u2605");
  const articles = page.locator('[data-section="articles"]');
  await expect(articles).toContainText("Jurassic Park computers in excruciating detail");
  await expect(articles).toContainText("fabiensanglard.net · 13 min");
  await expect(page.locator('[data-section="writing"]')).toContainText("Second post");
  await expect(page.getByText("Nothing here yet.")).toHaveCount(0);
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
});

test("the readout shows the newest item from each source", async ({ page }) => {
  await page.goto("/life/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("last watched: Love & Other Drugs 3.5");
  await expect(now).toContainText("reading: Harry Potter and the Deathly Hallows (Harry Potter, #7), J.K. Rowling");
  await expect(now).toContainText("saved: Jurassic Park computers in excruciating detail · fabiensanglard.net · 13 min");
  await expect(now).toContainText("contributions, last 12 months: 7");
  await expect(now).not.toContainText("★");
});
