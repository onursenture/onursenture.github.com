import { expect, test } from "@playwright/test";

test("the Work side has the switch off; it navigates to the always-dark Life side and back", async ({ page }) => {
  await page.goto("/");
  const off = page.getByRole("switch", { name: "Life" }).filter({ visible: true });
  await expect(off).toHaveAttribute("aria-checked", "false");
  await expect(page.locator('[data-side="life"]')).toHaveCount(0);

  await off.click();
  await expect(page).toHaveURL(/\/life\/$/);
  const life = page.locator('div[data-side="life"]').filter({ visible: true });
  await expect(life).toBeVisible();
  // Dark tokens on the Life side; the Work side is light.
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

test("the Life switch sits next to the name, in the same place on both sides", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const work = await page.getByRole("switch", { name: /life/i }).filter({ visible: true }).boundingBox();
  await page.goto("/life/");
  const life = await page.getByRole("switch", { name: /life/i }).filter({ visible: true }).boundingBox();
  expect(work && life).toBeTruthy();
  expect(Math.abs(work!.x - life!.x)).toBeLessThan(1);
  expect(Math.abs(work!.y - life!.y)).toBeLessThan(1);
  expect(work!.x).toBeLessThan(720); // left half, next to the name
});
