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
        // A 404 also renders inside the shell, so check the page is real.
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
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

const HOME_HEADING = {
  site: "From components to complete apps, designed and built end to end.",
  dashboard: "Overview",
} as const;

for (const [from, to] of [
  ["site", "dashboard"],
  ["dashboard", "site"],
] as const) {
  test(`back and forward after a toggle from ${from} to ${to} keep the chosen view`, async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: "view", value: from, url: baseURL! }]);
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Life" }).click();
    await expect(page).toHaveURL(/\/life\/$/);
    await viewButton(page, to === "site" ? "Site" : "Dashboard").click();
    await expect(page.locator(`[data-view="${to}"]`)).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
    // The URL alone is not enough: the page itself must be the home page.
    await expect(page).toHaveTitle("Onur Senture");
    // Next keeps earlier trees mounted but hidden; check the visible one.
    await expect(page.getByRole("heading", { level: 1, name: HOME_HEADING[to] })).toBeVisible();
    await expect(page.locator("[data-view]:visible")).toHaveAttribute("data-view", to);

    await page.goForward();
    await expect(page).toHaveURL(/\/life\/$/);
    await expect(page).toHaveTitle("Life · Onur Senture");
    await expect(page.getByRole("heading", { level: 1, name: "Life" })).toBeVisible();
    await expect(page.locator("[data-view]:visible")).toHaveAttribute("data-view", to);
  });
}

test("an invalid ?view= is ignored: default view, no cookie, URL kept", async ({ page, context }) => {
  const response = await page.goto("/?view=admin");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/\?view=admin$/);
  await expect(page.locator("[data-view]")).toHaveAttribute("data-view", "site");
  expect((await context.cookies()).map((cookie) => cookie.name)).not.toContain("view");
});

const PAGES = {
  home: { title: "Onur Senture", heading: HOME_HEADING },
  life: { title: "Life · Onur Senture", heading: { site: "Life", dashboard: "Life" } },
} as const;

// The visible page must agree with the cookie on every axis: the shell, the
// pressed View option, and the page itself (a stale shell can wrap a fresh
// page, so the URL and the heading alone don't catch it).
async function expectCoherent(page: Page, view: "site" | "dashboard", which: keyof typeof PAGES) {
  expect(await page.evaluate(() => document.cookie.match(/(?:^|;\s*)view=(site|dashboard)/)?.[1])).toBe(view);
  await expect(page).toHaveTitle(PAGES[which].title);
  await expect(page.getByRole("heading", { level: 1, name: PAGES[which].heading[view] })).toBeVisible();
  await expect(page.locator("[data-view]:visible")).toHaveAttribute("data-view", view);
  await expect(viewButton(page, view === "site" ? "Site" : "Dashboard")).toHaveAttribute("aria-pressed", "true");
  await expect(viewButton(page, view === "site" ? "Dashboard" : "Site")).toHaveAttribute("aria-pressed", "false");
}

for (const [start, other] of [
  ["site", "dashboard"],
  ["dashboard", "site"],
] as const) {
  test(`navigating after a ${start} → ${other} → ${start} round trip keeps the ${start} shell`, async ({
    page,
    context,
    baseURL,
  }) => {
    await context.addCookies([{ name: "view", value: start, url: baseURL! }]);
    await page.goto("/life/");
    await viewButton(page, other === "site" ? "Site" : "Dashboard").click();
    await expectCoherent(page, other, "life");
    await viewButton(page, start === "site" ? "Site" : "Dashboard").click();
    await expectCoherent(page, start, "life");

    await page.getByRole("link", { name: "Onur Senture", exact: true }).click();
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
    await expectCoherent(page, start, "home");

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Life" }).click();
    await expect(page).toHaveURL(/\/life\/$/);
    await expectCoherent(page, start, "life");
  });
}
