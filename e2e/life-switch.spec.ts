import { expect, test } from "@playwright/test";

test("the Work side has the switch off; it navigates to the always-dark Life side and back", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "light", url: baseURL! }]);
  await page.goto("/");
  const off = page.getByRole("switch", { name: "Life" }).filter({ visible: true });
  await expect(off).toHaveAttribute("aria-checked", "false");
  await expect(page.locator('[data-side="life"]')).toHaveCount(0);

  await off.click();
  await expect(page).toHaveURL(/\/life\/$/);
  const life = page.locator('div[data-side="life"]').filter({ visible: true });
  await expect(life).toBeVisible();
  // Dark tokens on the Life side even though the theme is light.
  await expect
    .poll(() => life.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe("rgb(11, 11, 12)");
  await expect(page.locator("html")).toHaveAttribute("data-side", "life");
  await expect(page.getByRole("switch", { name: "Life" }).filter({ visible: true })).toHaveAttribute("aria-checked", "true");

  await page.goBack();
  // The pathname must be exactly "/": a bare /\/$/ also matches /life/.
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-side", "life");
});

test("the switch is a real link (works without JavaScript)", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  await expect(page.getByRole("switch", { name: "Life" }).first()).toHaveAttribute("href", "/life/");
  await context.close();
});

test("Space toggles the focused switch", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("switch", { name: "Life" }).filter({ visible: true });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/\/life\/$/);
});

test("the footer carries the build line", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("build-line")).toHaveText(/^v2\.0\.0 · updated [A-Z][a-z]{2} \d{1,2}, \d{4}/);
});
