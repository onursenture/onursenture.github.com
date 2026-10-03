import { expect, test } from "@playwright/test";

test("/work/ lists PrimeTek's work and the Archive, and marks Work active", async ({ page }) => {
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
  await expect(group.getByRole("link", { name: "primefaces.org" })).toHaveAttribute("href", "https://primefaces.org");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "page");
});

test("a case study keeps Work active in the nav", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Work" })).toHaveAttribute("aria-current", "page");
});

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the table drops the kind column", async ({ page }) => {
    await page.goto("/work/");
    await expect(page.locator("#primetek").getByText("design system")).toBeHidden();
  });
});
