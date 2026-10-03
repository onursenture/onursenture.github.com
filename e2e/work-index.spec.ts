import { expect, test } from "@playwright/test";

test("/work/ lists PrimeTek's work and the Archive", async ({ page }) => {
  await page.goto("/work/");
  await expect(page).toHaveTitle("Work · Onur Senture");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Work.");
  const group = page.locator("#primetek");
  await expect(group).toContainText("PrimeTek");
  await expect(group).toContainText("Design lead");
  await expect(group).toContainText("May 2016–Apr 2026");
  for (const [name, href] of [
    ["PrimeOne", "/work/primeone/"],
    ["PrimeBlocks", "/work/primeblocks/"],
    ["PrimeIcons", "/work/primeicons/"],
    ["Templates", "/work/templates/"],
    ["Archive", "/work/archive/"],
  ]) {
    await expect(group.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the table drops the kind column", async ({ page }) => {
    await page.goto("/work/");
    await expect(page.locator("#primetek").getByText("design system")).toBeHidden();
  });
});
