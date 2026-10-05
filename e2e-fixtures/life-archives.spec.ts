import { expect, test } from "@playwright/test";

// SOURCE_FIXTURES=1: tests/fixtures/life-log.json, enrichments.json and the
// recorded source responses.

test("/life/films/ shows the newest year by month with real counts and no release years", async ({ page }) => {
  await page.goto("/life/films/");
  await expect(page.getByRole("heading", { level: 2, name: "2026" })).toBeVisible();
  // The year section contains the month section too; the month is the innermost (last) match.
  const september = page.locator("section", { has: page.getByRole("heading", { level: 3, name: /September/ }) }).last();
  await expect(september).toContainText("2 films");
  await expect(september.locator("li")).toHaveCount(2);
  await expect(september).toContainText("Sep 26");
  await expect(september).not.toContainText("2010");
  await expect(page.locator('[aria-current="page"]')).toHaveText("2026");
  await expect(page.locator("main")).not.toContainText("★");
});

test("the year index moves between years and to the undated films", async ({ page }) => {
  await page.goto("/life/films/");
  await page.getByRole("navigation", { name: "Years" }).getByRole("link", { name: "2025" }).click();
  await expect(page).toHaveURL(/\/life\/films\/2025\/$/);
  await expect(page.getByRole("heading", { level: 3, name: /December/ }).first()).toBeVisible();
  await expect(page.locator("main:visible")).toContainText("Dec 14 · ↻");
  await page.getByRole("navigation", { name: "Years" }).getByRole("link", { name: "Undated" }).click();
  await expect(page).toHaveURL(/\/life\/films\/undated\/$/);
  await expect(page.locator("main:visible #undated li")).toHaveText([/Amélie/, /The Matrix/]);
});

test("/life/books/ has Reading now, then reads by month", async ({ page }) => {
  await page.goto("/life/books/");
  await expect(page.getByRole("heading", { level: 2, name: "Reading now" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "2026" })).toBeVisible();
  for (const month of ["August", "July", "June"]) {
    await expect(page.getByRole("heading", { level: 3, name: new RegExp(month) })).toBeVisible();
  }
  await expect(page.locator("main")).toContainText("Hacı Komünist");
  await expect(page.locator("main")).toContainText("Jul 18");
});

test("/life/theatre/ shows years with the company and 'and earlier' on the oldest", async ({ page }) => {
  await page.goto("/life/theatre/");
  const y2015 = page.locator("section#year-2015");
  await expect(y2015).toContainText("2 plays");
  await expect(y2015).toContainText("and earlier");
  await expect(page.locator("section#year-2026")).toContainText("Ankara Devlet Tiyatrosu");
  await expect(page.locator("section#year-2026")).not.toContainText("and earlier");
});

test("/life/saved/ lists articles with the enriched description and the image fallback", async ({ page }) => {
  await page.goto("/life/saved/");
  const rows = page.getByRole("list", { name: "Saved articles" }).locator("li");
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("fabiensanglard.net");
  await expect(rows.first()).toContainText("13 min");
  await expect(rows.first()).toContainText("researched every computer");
  await expect(rows.first().locator("img")).toHaveAttribute("src", "https://fabiensanglard.net/jurrasic_park_computers/og.jpg");
  await expect(rows.nth(1).locator("img")).toHaveCount(0);
});
