import { expect, test } from "@playwright/test";

test("the site home leads with the identity line and a live meta line", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "From components to complete apps, designed and built end to end.",
  );
  const meta = page.getByTestId("meta-line");
  await expect(meta).toContainText("DESIGNER + BUILDER");
  await expect(meta).toContainText("ANKARA");
  await expect(meta).toContainText("OPEN TO ROLES");
  // Prerendered as --:--; after hydration it shows the time, whatever it is.
  await expect(page.getByLabel("Local time in Ankara")).toHaveText(/^\d{2}:\d{2}$/);
});

test("the work index lists the confirmed entries as plain rows", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#work");
  for (const text of [
    "PrimeOne",
    "80+ components",
    "PrimeBlocks",
    "500 UI blocks",
    "PrimeIcons",
    "hand-drawn icon set",
    "Premium admin dashboards",
    "nebuu",
    "ongoing, Orkestra",
  ]) {
    await expect(work).toContainText(text);
  }
  await expect(work.getByRole("link")).toHaveCount(0);
});

test("the Lab index lists every entry and links out only where it has a link", async ({ page }) => {
  await page.goto("/");
  const lab = page.locator("#lab");
  await expect(lab.getByRole("heading", { name: "Lab" })).toBeVisible();
  await expect(lab).toContainText("Project 02");
  await expect(lab).toContainText("Project 03");
  await expect(lab.getByRole("img", { name: "in progress" })).toHaveCount(3);
  await expect(lab.getByRole("link")).toHaveCount(1);
  const site = lab.getByRole("link", { name: /onursenture\.com/ });
  await expect(site).toHaveAttribute("href", "https://github.com/onursenture/onursenture.github.com");
  await expect(site).toHaveAttribute("rel", "noopener noreferrer");
});

test("Off the clock keeps the photo tile and links to Life", async ({ page }) => {
  await page.goto("/");
  const strip = page.locator("#off-the-clock");
  // This run has no database, so the source tiles drop out.
  await expect(strip.locator("[data-tile]")).toHaveCount(1);
  await expect(strip.locator('[data-tile="Photo"]')).toHaveAttribute("href", "/life/#photos");
  await expect(strip.getByRole("link", { name: "Life", exact: true })).toHaveAttribute("href", "/life/");
});
