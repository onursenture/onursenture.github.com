import { expect, test } from "@playwright/test";

test("the header counts the set from the package", async ({ page }) => {
  await page.goto("/work/primeicons/");
  await expect(page.locator("dl")).toContainText("v7.0.0 · 313 icons");
});

test("the Grid is the live icon set, searchable, with no chips or density", async ({ page }) => {
  await page.goto("/work/primeicons/?view=grid");
  await expect(page.getByRole("group", { name: "Filter" })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Density" })).toHaveCount(0);
  await expect(page.getByText("313 of 313 icons")).toBeVisible();
  await page.getByRole("searchbox").fill("chart-bar");
  await expect(page.getByText("1 of 313 icons")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Copy pi pi-/ })).toHaveCount(1);
  await expect(page.getByText("PrimeIcons 7.0.0 © PrimeTek, MIT License")).toBeVisible();
});

test("clicking an icon copies its class name", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/work/primeicons/?view=grid");
  const button = page.getByRole("button", { name: "Copy pi pi-chart-bar" });
  await button.click();
  await expect(button).toContainText("copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pi pi-chart-bar");
});

test("the Index lists the class names", async ({ page }) => {
  await page.goto("/work/primeicons/?view=index");
  await expect(page.locator('[data-view="index"] li')).toHaveCount(313);
  await expect(page.locator('[data-view="index"]')).toContainText("pi-chart-bar");
});
