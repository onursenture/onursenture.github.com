import { expect, test } from "@playwright/test";

test("the Work shell has the top bar, the switch and the footer", async ({ page }) => {
  await page.goto("/");
  // Work is the first ready section (Sprint 5).
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link")).toHaveCount(1);
  await expect(nav.getByRole("link", { name: "Work" })).toHaveAttribute("href", "/work/");
  await expect(page.getByRole("link", { name: "Onur Senture" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /Book a call/ })).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Theme" }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Life" }).filter({ visible: true })).toBeVisible();

  const footer = page.locator("footer");
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Onur Senture`);
  for (const name of ["GitHub", "Letterboxd", "Goodreads", "X", "Dribbble"]) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(footer.locator('[data-slot="paddle"]')).toHaveCount(1);
});

test("the Life shell has the name linking to /life/ and no theme toggle", async ({ page }) => {
  await page.goto("/life/");
  await expect(page.getByRole("link", { name: "Onur Senture" })).toHaveAttribute("href", "/life/");
  await expect(page.getByRole("group", { name: "Theme" })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Life" })).toHaveAttribute("aria-checked", "true");
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the header shows the name, the Life switch and Menu; the menu holds the theme toggle", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await expect(page.getByRole("link", { name: "Onur Senture" })).toBeVisible();
    await expect(page.getByRole("switch", { name: "Life" }).filter({ visible: true })).toBeVisible();
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu.getByRole("group", { name: "Theme" })).toBeVisible();
    await menu.getByRole("button", { name: "Close menu" }).click();
    await expect(menu).toBeHidden();
  });

  test("the menu closes when the viewport grows to desktop width", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("dialog", { name: "Menu" })).toBeVisible();
    await page.setViewportSize({ width: 1000, height: 844 });
    // An open modal <dialog> inside a display:none ancestor would leave the
    // rest of the page inert.
    await expect(page.locator("dialog")).toHaveJSProperty("open", false);
    await expect(page.getByRole("link", { name: "Onur Senture" })).toBeVisible();
  });
});
