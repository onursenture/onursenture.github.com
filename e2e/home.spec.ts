import { expect, test } from "@playwright/test";

test("the home leads with the lead line, the role and a live Ankara clock", async ({ page }) => {
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toContainText("Designer who builds.");
  await expect(h1).toContainText("From components to complete apps, designed and built end to end.");
  await expect(page.getByLabel("Local time in Ankara")).toHaveText(/^\d{2}:\d{2}$/);
  await expect(page.locator("#identity")).toContainText("Open to work");
});

test("the sections run Lab, Work, Experience, Contributions, each label a heading", async ({ page }) => {
  await page.goto("/");
  const names = ["Lab", "Work", "Experience", "Contributions"];
  for (const name of names) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest work" })).toHaveCount(0);
  await expect(page.locator("main h1, main h2")).toHaveText([/Designer who builds\./, ...names]);
});

test("the bio names PrimeTek, Orkestra and Bilkent with inline marks", async ({ page }) => {
  await page.goto("/");
  const identity = page.locator("#identity");
  for (const name of ["PrimeTek", "Orkestra Studios", "Bilkent"]) await expect(identity).toContainText(name);
});

test("Work shows four numbered tiles, each linking to its case study", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#work");
  for (const label of ["FIG. 01 · PrimeOne", "FIG. 02 · PrimeBlocks", "FIG. 03 · PrimeIcons", "FIG. 04 · Templates"]) {
    await expect(work).toContainText(label);
  }
  await expect(work.getByRole("list").getByRole("link")).toHaveCount(4);
  await expect(work.getByRole("link", { name: /PrimeOne/ })).toHaveAttribute("href", "/work/primeone/");
  await expect(page.locator("#work").getByRole("link", { name: "All work" })).toHaveAttribute("href", "/work/");
});

test("Experience is a tree with confirmed dates", async ({ page }) => {
  await page.goto("/");
  const tree = page.locator("#experience");
  await expect(tree).toContainText("Jun 2013–now");
  await expect(tree).toContainText("May 2016–Apr 2026");
  await expect(tree).toContainText("Apr 2014–Mar 2016");
  await expect(tree).toContainText("└─");
  await expect(tree.getByRole("list", { name: "PrimeTek work" }).getByRole("listitem")).toHaveCount(4);
  await expect(tree.getByRole("link", { name: "PrimeIcons" })).toHaveAttribute("href", "/work/primeicons/");
});

test("Contributions shows the empty state without data, and links to GitHub", async ({ page }) => {
  await page.goto("/");
  const contributions = page.locator("#contributions");
  await expect(contributions).toContainText("Nothing here yet.");
  await expect(contributions.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/onursenture");
});

test("Lab lists text rows without avatars; only linked entries link", async ({ page }) => {
  await page.goto("/");
  const lab = page.locator("#lab");
  await expect(lab).toContainText("onursenture.com");
  await expect(lab).not.toContainText("Project 0");
  await expect(lab.getByRole("link")).toHaveCount(1);
  await expect(lab.getByRole("img", { name: "in progress" })).toHaveCount(1);
  await expect(lab.locator("canvas")).toHaveCount(0);
});

test("every canvas on the home is decorative", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("canvas").first()).toBeAttached();
  const unlabelled = await page
    .locator("canvas")
    .evaluateAll((canvases) => canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length);
  expect(unlabelled).toBe(0);
});

test("no section row renders an empty cell (it adds a gap below lg)", async ({ page }) => {
  await page.goto("/");
  const empty = await page
    .locator("main section > div > *")
    .evaluateAll((cells) => cells.filter((cell) => !cell.textContent?.trim() && !cell.querySelector("canvas, img, svg")).length);
  expect(empty).toBe(0);
});

test("a leftover view cookie from the old dashboard view is ignored", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "view", value: "dashboard", url: baseURL! }]);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-view]")).toHaveCount(0);
});
