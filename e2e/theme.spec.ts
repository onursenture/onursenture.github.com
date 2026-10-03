import { expect, type Page, test } from "@playwright/test";

// Role locators skip hidden elements, so these keep working after a client
// navigation, when Next keeps the previous route's tree mounted but hidden.
const themeButton = (page: Page, name: "Light" | "Dark" | "Auto") =>
  page.getByRole("group", { name: "Theme" }).getByRole("button", { name });

test("the theme cookie applies before paint and the toggle sets light, dark and auto", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeButton(page, "Dark")).toHaveAttribute("aria-pressed", "true");
  await themeButton(page, "Auto").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await themeButton(page, "Light").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("the theme toggle marks the current option with aria-pressed", async ({ page }) => {
  await page.goto("/");
  await expect(themeButton(page, "Auto")).toHaveAttribute("aria-pressed", "true");
  await expect(themeButton(page, "Dark")).toHaveAttribute("aria-pressed", "false");
});

test("a leftover view cookie from the old dashboard view is ignored", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "view", value: "dashboard", url: baseURL! }]);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-view]")).toHaveCount(0);
});

test("/photos/ URLs redirect permanently to /life/photos/", async ({ request }) => {
  const index = await request.get("/photos/", { maxRedirects: 0 });
  expect(index.status()).toBe(308);
  expect(index.headers()["location"]).toBe("/life/photos/");
  const photo = await request.get("/photos/stabilo/", { maxRedirects: 0 });
  expect(photo.status()).toBe(308);
  expect(photo.headers()["location"]).toBe("/life/photos/stabilo/");
});
