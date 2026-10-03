import { expect, test } from "@playwright/test";

test("the site shell has the top bar, the active nav item and the footer", async ({ page }) => {
  await page.goto("/life/");
  const nav = page.getByRole("navigation", { name: "Main" });
  // Only ready sections are listed; S3 ships Life.
  await expect(nav.getByRole("link")).toHaveText(["Life"]);
  await expect(nav.getByRole("link", { name: "Life" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Onur Senture" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /Book a call/ })).toHaveCount(0);

  const footer = page.locator("footer");
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Onur Senture`);
  for (const name of ["GitHub", "Letterboxd", "Goodreads", "X", "Dribbble"]) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(footer.locator('[data-slot="paddle"]')).toHaveCount(1);
});

test("the dashboard sidebar lists Overview first, then the toggles and the sync line", async ({ page }) => {
  await page.goto("/?view=dashboard");
  const sidebar = page.locator("aside");
  const nav = sidebar.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveText(["Overview", "Life"]);
  await expect(nav.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await expect(sidebar.getByRole("group", { name: "Theme" })).toBeVisible();
  await expect(sidebar.getByRole("group", { name: "View" })).toBeVisible();
  // This run has no database, so no source has synced.
  await expect(sidebar.getByTestId("sync-line")).toHaveText(/○\s*0\/5 synced/);
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the site menu opens full-screen and closes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Life" })).toBeVisible();
    await expect(menu.getByRole("group", { name: "View" })).toBeVisible();
    await menu.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toBeHidden();
  });

  test("the dashboard menu opens the sidebar as a slide-over", async ({ page }) => {
    await page.goto("/?view=dashboard");
    await expect(page.locator("aside")).toBeHidden();
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(menu.getByTestId("sync-line")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("switching view from the menu leaves the new page usable", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).getByRole("button", { name: "Dashboard" }).click();
    await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Overview" })).toBeVisible();
  });
});
