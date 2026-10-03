import { expect, test } from "@playwright/test";
import { entry, media, tagged, total } from "./primeone";

const e30 = entry("3-0");

test("switching views updates the URL and the page", async ({ page }) => {
  await page.goto("/work/primeone/");
  const views = page.getByRole("group", { name: "View" });
  await views.getByRole("button", { name: "Grid" }).click();
  await expect(page).toHaveURL(/\/work\/primeone\/\?view=grid$/);
  const grid = page.locator('[data-view="grid"]');
  await expect(grid).toBeVisible();
  // The hero plus every entry's figures.
  await expect(grid.locator("[data-media]")).toHaveCount(total);
  await expect(page.getByRole("group", { name: "Filter" }).getByRole("button", { name: /^All/ })).toHaveAttribute("aria-pressed", "true");

  await views.getByRole("button", { name: "Index" }).click();
  await expect(page).toHaveURL(/\?view=index$/);
  await expect(page.locator('[data-view="index"] li')).toHaveCount(media.length);

  await views.getByRole("button", { name: "Log" }).click();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(page.locator('[data-view="log"]')).toBeVisible();
});

test("chips filter by entry or tag with computed counts", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid");
  const filter = page.getByRole("group", { name: "Filter" });
  await filter.getByRole("button", { name: /^Tokens/ }).click();
  await expect(page).toHaveURL(/\?view=grid&tag=tokens$/);
  await expect(page.locator('[data-view="grid"] [data-media]')).toHaveCount(tagged("tokens").length);
  await filter.getByRole("button", { name: new RegExp(`^${e30.heading.replace(".", "\\.")}`) }).click();
  await expect(page.locator('[data-view="grid"] [data-media]')).toHaveCount(e30.media.length);
});

test("density changes the grid and is kept in the URL", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid");
  await page.getByRole("group", { name: "Density" }).getByRole("button", { name: "∞" }).click();
  await expect(page).toHaveURL(/\?view=grid&density=inf$/);
  await expect(page.locator('[data-view="grid"]')).toHaveAttribute("data-density", "inf");
});

test("a deep link opens the filtered view after hydration", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid&tag=3-0&density=2");
  await expect(page.locator('[data-view="grid"]')).toHaveAttribute("data-density", "2");
  await expect(page.locator('[data-view="grid"] [data-media]')).toHaveCount(e30.media.length);
  await expect(page.getByRole("group", { name: "Filter" }).getByRole("button", { name: new RegExp(`^${e30.heading.replace(".", "\\.")}`) })).toHaveAttribute("aria-pressed", "true");
});

test("unknown query values fall back to the Log", async ({ page }) => {
  await page.goto("/work/primeone/?view=wall&tag=nope");
  await expect(page.locator('[data-view="log"]')).toBeVisible();
});

test("all figures of 3.0 render in its Log entry, as a grid", async ({ page }) => {
  await page.goto("/work/primeone/");
  const block = page.locator("#entry-3-0");
  await expect(block.locator("[data-media]")).toHaveCount(e30.media.length);
  for (const item of e30.media) await expect(block.locator(`[data-media="${item.id}"]`)).toBeVisible();
  await expect(block.getByRole("button", { name: /in Grid/ })).toHaveCount(0);
  await expect(block.locator("[data-entry-media]")).toHaveClass(/md:grid-cols-2/);
});

test("the server HTML is the Log whatever the query", async ({ request }) => {
  const html = await (await request.get("/work/primeone/?view=grid")).text();
  expect(html).toContain('data-view="log"');
  expect(html).not.toContain('data-view="grid"');
});
