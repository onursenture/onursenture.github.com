import { type Page, expect, test } from "@playwright/test";

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

// The fixtures' Disclosure Day poster and the Jurassic Park og:image are
// deliberately broken. Each test answers them with a 404 itself, so the check
// doesn't depend on what the real hosts return today.
const breakImage = (page: Page, url: string) =>
  page.route(url, (route) => route.fulfill({ status: 404, contentType: "text/plain", body: "gone" }));

test("a film poster that fails to load becomes the dither tile with its initial", async ({ page }) => {
  const poster = "https://a.ltrbxd.com/resized/film-poster/1/1/5/9/2/disclosure-day-0-230-0-345-crop.jpg";
  await breakImage(page, poster);
  // The server renders the poster; only the browser finds it broken.
  expect(await (await page.request.get("/life/films/")).text()).toContain(`src="${poster}"`);
  await page.goto("/life/films/");
  const tile = page.locator("li", { hasText: "Disclosure Day" });
  await tile.scrollIntoViewIfNeeded(); // the poster is lazy
  await expect(tile.locator("img")).toHaveCount(0);
  await expect(tile.getByText("D", { exact: true })).toBeVisible();
});

test("/life/saved/ lists articles with the enriched description and the image fallback", async ({ page }) => {
  const image = "https://fabiensanglard.net/jurrasic_park_computers/og.jpg";
  await breakImage(page, image);
  expect(await (await page.request.get("/life/saved/")).text()).toContain(`src="${image}"`);
  await page.goto("/life/saved/");
  const rows = page.getByRole("list", { name: "Saved articles" }).locator("li");
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("fabiensanglard.net");
  await expect(rows.first()).toContainText("13 min");
  await expect(rows.first()).toContainText("researched every computer");
  // The og:image fails and the row falls back to the wide tile with the
  // site's initial: no broken-image glyph.
  await expect(rows.first().locator("img")).toHaveCount(0);
  await expect(rows.first().getByText("F", { exact: true })).toBeVisible();
  // The second article never had a usable image.
  await expect(rows.nth(1).locator("img")).toHaveCount(0);
});
