import { expect, type Page, test } from "@playwright/test";

const viewOf = (page: Page) => page.locator("[data-view]").getAttribute("data-view");

test("defaults to the site view", async ({ page }) => {
  await page.goto("/");
  expect(await viewOf(page)).toBe("site");
});

test("?view=dashboard switches, redirects to a clean URL, and persists via cookie", async ({ page }) => {
  await page.goto("/?view=dashboard");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  expect(await viewOf(page)).toBe("dashboard");
  await page.goto("/");
  expect(await viewOf(page)).toBe("dashboard");
});

test("the toggle works after arriving via a ?view= link", async ({ page }) => {
  await page.goto("/?view=dashboard");
  await page.getByTestId("view-toggle").click();
  await expect(page.locator('[data-view="site"]')).toBeVisible();
  await page.reload();
  expect(await viewOf(page)).toBe("site");
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

// A 404 looks the same whether or not the proxy ran (the not-found page does
// not render inside the [view] layout), so probe with ?view=, which only the
// proxy answers (with a redirect).
test("only /api and /_next skip the proxy, not paths that merely start with them", async ({ request }) => {
  const proxied = await request.get("/apiary/?view=dashboard", { maxRedirects: 0 });
  expect(proxied.status()).toBe(307);
  expect(proxied.headers()["location"]).toMatch(/\/apiary\/$/);

  const skipped = await request.get("/api/anything/?view=dashboard", { maxRedirects: 0 });
  expect(skipped.status()).toBe(404);
});

test("unknown pages 404", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
});
