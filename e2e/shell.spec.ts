import { expect, test } from "@playwright/test";

test("the Work shell has the top bar, the switch and the footer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Onur Senture" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("link", { name: /Book a call/ })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Life" }).filter({ visible: true })).toBeVisible();

  const footer = page.locator("footer");
  await expect(footer).toContainText(`© ${new Date().getFullYear()} Onur Senture`);
  for (const name of ["GitHub", "Letterboxd", "Goodreads", "X", "Dribbble"]) {
    await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(footer.locator('[data-slot="paddle"]')).toHaveCount(1);
});

test("the Life shell has the name linking to /life/ and no theme control", async ({ page }) => {
  await page.goto("/life/");
  await expect(page.getByRole("link", { name: "Onur Senture" })).toHaveAttribute("href", "/life/");
  await expect(page.getByTestId("theme-toggle")).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Life" })).toHaveAttribute("aria-checked", "true");
});

test("the Work side has no theme control, no nav and no menu button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("theme-toggle")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Theme" })).toHaveCount(0);
  await expect(page.locator("header nav")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /menu/i })).toHaveCount(0);
});

test("the Work side is light even when the OS prefers dark", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/");
  // The shell div (--color-bg #FAFAF8); body's first child is not it.
  const shell = page.locator("div.min-h-dvh").filter({ visible: true }).first();
  await expect(shell).toHaveCSS("background-color", "rgb(250, 250, 248)");
  const body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(body).toBe("rgb(250, 250, 248)");
  await context.close();
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the header shows the name and the Life switch side by side, and no Menu", async ({ page }) => {
    await page.goto("/");
    const name = await page.getByRole("link", { name: "Onur Senture" }).boundingBox();
    const life = await page.getByRole("switch", { name: "Life" }).filter({ visible: true }).boundingBox();
    expect(name && life).toBeTruthy();
    expect(life!.x).toBeGreaterThan(name!.x + name!.width - 1);
    expect(Math.abs(life!.y + life!.height / 2 - (name!.y + name!.height / 2))).toBeLessThan(12);
    await expect(page.getByRole("button", { name: "Menu" })).toHaveCount(0);
  });
});
