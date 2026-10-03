import { expect, test } from "@playwright/test";

test("an unknown URL 404s inside the Work shell", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Theme" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
});

test("an unknown /life/ URL 404s inside the Life layout", async ({ page }) => {
  const response = await page.goto("/life/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Life" })).toHaveAttribute("href", "/life/");
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
  const response = await page.goto("/life/photos/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Onur Senture" })).toBeVisible();
});
