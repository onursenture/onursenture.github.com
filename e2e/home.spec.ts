import { expect, test } from "@playwright/test";

test("the home leads with the lead line, the role and a live Ankara clock", async ({ page }) => {
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toContainText("Designer who builds.");
  await expect(h1).toContainText("From components to complete apps, designed and built end to end.");
  await expect(page.getByLabel("Local time in Ankara")).toHaveText(/^\d{2}:\d{2}$/);
  await expect(page.locator("#identity")).toContainText("Open to work");
});

test("the bio names PrimeTek, Orkestra and Bilkent with inline marks", async ({ page }) => {
  await page.goto("/");
  const identity = page.locator("#identity");
  for (const name of ["PrimeTek", "Orkestra Studios", "Bilkent"]) await expect(identity).toContainText(name);
});

test("Work shows four numbered placeholders with captions, unlinked", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#work");
  for (const label of ["FIG. 01 · PrimeOne", "FIG. 02 · PrimeBlocks", "FIG. 03 · PrimeIcons", "FIG. 04 · Premium admin dashboards"]) {
    await expect(work).toContainText(label);
  }
  await expect(work.getByRole("link")).toHaveCount(0);
});

test("Experience is a tree with confirmed dates", async ({ page }) => {
  await page.goto("/");
  const tree = page.locator("#experience");
  await expect(tree).toContainText("Jun 2013–now");
  await expect(tree).toContainText("May 2016–Apr 2026");
  await expect(tree).toContainText("Apr 2014–Mar 2016");
  await expect(tree).toContainText("└─");
  await expect(tree.getByRole("list", { name: "PrimeTek work" }).getByRole("listitem")).toHaveCount(4);
});

test("Latest work shows the empty state without data, and links to GitHub", async ({ page }) => {
  await page.goto("/");
  const latest = page.locator("#latest");
  await expect(latest).toContainText("Nothing here yet.");
  await expect(latest.getByRole("link", { name: "GitHub ↗" })).toHaveAttribute("href", "https://github.com/onursenture");
});

test("Lab lists every entry with a decorative avatar; only linked entries link", async ({ page }) => {
  await page.goto("/");
  const lab = page.locator("#lab");
  await expect(lab).toContainText("onursenture.com");
  await expect(lab).toContainText("Project 02");
  await expect(lab.getByRole("link")).toHaveCount(1);
  await expect(lab.getByRole("img", { name: "in progress" })).toHaveCount(3);
});

test("every canvas on the home is decorative", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas").first()).toBeAttached();
  const unlabelled = await page
    .locator("canvas")
    .evaluateAll((canvases) => canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length);
  expect(unlabelled).toBe(0);
});
