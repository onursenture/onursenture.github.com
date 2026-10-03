import { expect, test } from "@playwright/test";

test("the site shell has the top bar and the footer", async ({ page }) => {
  await page.goto("/life/");
  // No nav item is ready yet, so the list is empty.
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Onur Senture" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /Book a call/ })).toHaveCount(0);

  const footer = page.locator("footer");
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Onur Senture`);
  for (const name of ["GitHub", "Letterboxd", "Goodreads", "X", "Dribbble"]) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(footer.locator('[data-slot="paddle"]')).toHaveCount(1);
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the site menu opens full-screen and closes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
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
