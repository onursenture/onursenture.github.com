import { expect, type Page, test } from "@playwright/test";

const viewOf = (page: Page) => page.locator("[data-view]").getAttribute("data-view");

test("defaults to the site view", async ({ page }) => {
  await page.goto("/");
  expect(await viewOf(page)).toBe("site");
});

test("?view=dashboard switches and persists via cookie", async ({ page }) => {
  await page.goto("/?view=dashboard");
  expect(await viewOf(page)).toBe("dashboard");
  await page.goto("/");
  expect(await viewOf(page)).toBe("dashboard");
});

test("the toggle switches view in place and survives a reload", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("view-toggle").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await page.reload();
  expect(await viewOf(page)).toBe("dashboard");
  await page.getByTestId("view-toggle").click();
  await expect(page.locator('[data-view="site"]')).toBeVisible();
});

test("internal view prefixes redirect to clean URLs", async ({ page }) => {
  await page.goto("/dashboard/");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
});

test("theme cookie applies before paint and the toggle cycles it", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByTestId("theme-toggle").click(); // dark → system
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await page.getByTestId("theme-toggle").click(); // system → light
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("unknown pages 404", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
});
