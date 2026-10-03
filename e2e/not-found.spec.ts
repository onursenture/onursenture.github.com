import { expect, test } from "@playwright/test";

test("an unknown URL 404s inside the site shell", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("[data-view]")).toHaveAttribute("data-view", "site");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("group", { name: "View" })).toBeVisible();
});

test("an unknown URL 404s inside the dashboard shell", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "view", value: "dashboard", url: baseURL! }]);
  const response = await page.goto("/deeply/nested/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("[data-view]")).toHaveAttribute("data-view", "dashboard");
  await expect(page.locator("aside").getByRole("navigation", { name: "Main" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

// Under Cache Components these 404s arrive as an error shell that React
// renders on the client, so the inline theme script never runs; the theme
// toggle applies the cookie instead.
test("a 404 keeps the theme from the cookie", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.goto("/nope/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("group", { name: "Theme" }).getByRole("button", { name: "Dark" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("an unknown photo 404s inside the shell", async ({ page }) => {
  const response = await page.goto("/photos/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
});

// Paths with a dot skip the proxy, so "[view]" receives an invalid value and
// assertView() 404s before any shell renders.
test("an invalid view segment 404s", async ({ page }) => {
  const response = await page.goto("/not.a.view/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("[data-view]")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});
