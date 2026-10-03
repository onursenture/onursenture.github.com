import { expect, test } from "@playwright/test";

test("the header counts the set from the package", async ({ page }) => {
  await page.goto("/work/primeicons/");
  await expect(page.locator("dl")).toContainText("v7.0.0 · 313 icons");
});

test("the page shows the live icon set after the Log, searchable, with no view bar", async ({ page }) => {
  await page.goto("/work/primeicons/");
  await expect(page.locator('[data-view="log"]')).toBeVisible();
  for (const name of ["View", "Filter", "Density"]) await expect(page.getByRole("group", { name })).toHaveCount(0);
  await expect(page.getByText("313 of 313 icons")).toBeVisible();
  await page.getByRole("searchbox").fill("chart-bar");
  await expect(page.getByText("1 of 313 icons")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Copy pi pi-/ })).toHaveCount(1);
  await expect(page.getByText("PrimeIcons 7.0.0 © PrimeTek, MIT License")).toBeVisible();
});

test("clicking an icon copies its class name", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/work/primeicons/");
  const button = page.getByRole("button", { name: "Copy pi pi-chart-bar" });
  await button.click();
  await expect(button).toContainText("copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pi pi-chart-bar");
});

test("the old ?view=index URL is ignored: the same page, no index list", async ({ page }) => {
  await page.goto("/work/primeicons/?view=index");
  await expect(page.locator('[data-view="log"]')).toBeVisible();
  await expect(page.locator('[data-view="index"]')).toHaveCount(0);
  await expect(page.getByText("313 of 313 icons")).toBeVisible();
});

test("the server HTML already has the icons and the licence line", async ({ request }) => {
  // React separates adjacent text nodes with <!-- --> in server HTML.
  const html = (await (await request.get("/work/primeicons/")).text()).replaceAll("<!-- -->", "");
  expect(html).toContain("PrimeIcons 7.0.0 © PrimeTek, MIT License");
  expect(html).toContain("Copy pi pi-chart-bar");
});
