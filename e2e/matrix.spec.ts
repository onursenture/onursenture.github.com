import { expect, type Page, test } from "@playwright/test";

type Probe = { __themeAtBody?: string | null };

const BACKGROUND = { light: "rgb(255, 255, 255)", dark: "rgb(0, 0, 0)" };
const SURFACE = { light: "rgb(250, 250, 250)", dark: "rgb(10, 10, 10)" };

const viewButton = (page: Page, name: "Site" | "Dashboard") =>
  page.getByRole("group", { name: "View" }).getByRole("button", { name });

for (const view of ["site", "dashboard"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`every page renders in the ${view} view with the ${theme} theme`, async ({ page, context, baseURL }) => {
      await context.addCookies([
        { name: "view", value: view, url: baseURL! },
        { name: "theme", value: theme, url: baseURL! },
      ]);
      for (const path of ["/", "/life/", "/photos/", "/photos/stabilo/", "/system/"]) {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("[data-view]")).toHaveAttribute("data-view", view);
        await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
        expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(BACKGROUND[theme]);
      }
      if (view === "dashboard") {
        const sidebar = page.locator("aside").locator("..");
        expect(await sidebar.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(SURFACE[theme]);
      }
    });
  }
}

test("the theme is set before the body exists, so the first paint is right", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (!document.body) return;
      (window as unknown as Probe).__themeAtBody = document.documentElement.dataset.theme ?? null;
      observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto("/");
  expect(await page.evaluate(() => (window as unknown as Probe).__themeAtBody)).toBe("dark");
});

test("back and forward after a view toggle keep the chosen view", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Life" }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  await viewButton(page, "Dashboard").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  // Next keeps earlier trees mounted but hidden; check the visible one.
  await expect(page.locator("[data-view]:visible")).toHaveAttribute("data-view", "dashboard");

  await page.goForward();
  await expect(page).toHaveURL(/\/life\/$/);
  await expect(page.locator("[data-view]:visible")).toHaveAttribute("data-view", "dashboard");
});

test("an invalid ?view= is ignored: default view, no cookie, URL kept", async ({ page, context }) => {
  await page.goto("/?view=admin");
  await expect(page).toHaveURL(/\/\?view=admin$/);
  await expect(page.locator("[data-view]")).toHaveAttribute("data-view", "site");
  expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("view");
});
