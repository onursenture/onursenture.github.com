import { expect, test } from "@playwright/test";
import { productPages } from "../content/work";
import { buildPins } from "../lib/work/derive";

const pins = buildPins(productPages, () => undefined);

test("the home leads with the lead line, the role and a live Ankara clock", async ({ page }) => {
  await page.goto("/");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toContainText("Designer who builds.");
  await expect(h1).toContainText("From components to complete apps, designed and built end to end.");
  await expect(page.getByLabel("Local time in Ankara")).toHaveText(/^\d{2}:\d{2}$/);
  await expect(page.locator("#identity")).toContainText("Open to work");
});

test("the sections run Lab, Selected work, Experience, Contributions, each label a heading", async ({ page }) => {
  await page.goto("/");
  const names = ["Lab", "Selected work", "Experience", "Contributions"];
  for (const name of names) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest work" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Work", exact: true })).toHaveCount(0);
  const ids = await page.locator("main > section").evaluateAll((sections) => sections.map((s) => s.id));
  expect(ids).toEqual(["identity", "lab", "selected-work", "experience", "contributions"]);
  await expect(page.locator("main h1, main h2")).toHaveText([/Designer who builds\./, ...names]);
});

test("the bio names PrimeTek, Orkestra and Bilkent with inline marks", async ({ page }) => {
  await page.goto("/");
  const identity = page.locator("#identity");
  for (const name of ["PrimeTek", "Orkestra Studios", "Bilkent"]) await expect(identity).toContainText(name);
});

test("Selected work shows the four pins in order, each linking to its images block", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#selected-work");
  const items = work.getByRole("listitem");
  await expect(items).toHaveCount(4);
  expect(pins.map((pin) => pin.slug)).toEqual(["primeone", "primeblocks", "primeicons", "templates"]);
  for (const [index, pin] of pins.entries()) {
    const item = items.nth(index);
    await expect(item).toContainText(pin.pin.title);
    await expect(item).toContainText(pin.pin.note);
    await expect(item).toContainText(`FIG. 0${index + 1} · ${pin.pin.title}`);
    // One link per item for assistive tech: the source link. The frame links
    // to the same place, hidden and out of the tab order.
    const source = item.getByRole("link");
    await expect(source).toHaveCount(1);
    await expect(source).toHaveAccessibleName(pin.pageTitle);
    await expect(source).toHaveAttribute("href", `/work/${pin.slug}/#highlights`);
    await expect(item.locator('a[aria-hidden="true"][tabindex="-1"]')).toHaveAttribute("href", `/work/${pin.slug}/#highlights`);
  }
  await expect(work.getByRole("link", { name: "All work" })).toHaveCount(0);
});

test("a Selected work source link lands on its product page's images block", async ({ page }) => {
  await page.goto("/");
  await page.locator("#selected-work").getByRole("link", { name: "PrimeIcons" }).click();
  await expect(page).toHaveURL(/\/work\/primeicons\/#highlights$/);
  await expect(page.locator("#highlights")).toBeInViewport();
});

test("Selected work sizes its frames for three columns in the wide row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const grid = page.locator("#selected-work ul");
  const frames = await page.locator("#selected-work li > a").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
  // The 308px in `sizes` is the real gap between the grid and the viewport edge.
  const box = await grid.boundingBox();
  expect(Math.round(1440 - box!.width)).toBe(308);
  // Three columns, 16px gaps: (100vw - 308px - 32px) / 3.
  for (const width of frames) expect(Math.round(width)).toBe(Math.round((1440 - 308 - 32) / 3));
});

test("Experience shows product rows with confirmed dates", async ({ page }) => {
  await page.goto("/");
  const tree = page.locator("#experience");
  await expect(tree).toContainText("Jun 2013–now");
  await expect(tree).toContainText("May 2016–Apr 2026");
  await expect(tree).toContainText("Apr 2014–Mar 2016");
  const products = tree.getByRole("list", { name: "PrimeTek work" });
  await expect(products.getByRole("listitem")).toHaveCount(4);
  await expect(products.getByRole("link")).toHaveCount(4);
  await expect(tree.getByRole("link", { name: "PrimeIcons" })).toHaveAttribute("href", "/work/primeicons/");
  // Nebuu has no page: plain text, not a link.
  await expect(tree).toContainText("Nebuu");
  await expect(tree.getByRole("link", { name: "Nebuu" })).toHaveCount(0);
  const text = (await tree.textContent()) ?? "";
  expect(text).not.toMatch(/[├└]/);
});

test("Contributions shows the empty state without data, and links to GitHub", async ({ page }) => {
  await page.goto("/");
  const contributions = page.locator("#contributions");
  await expect(contributions).toContainText("Nothing here yet.");
  await expect(contributions.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/onursenture");
});

test("Lab lists text rows without glyphs or avatars; only linked entries link", async ({ page }) => {
  await page.goto("/");
  const lab = page.locator("#lab");
  await expect(lab).toContainText("onursenture.com");
  await expect(lab).not.toContainText("Project 0");
  await expect(lab.getByRole("link")).toHaveCount(1);
  await expect(lab.getByRole("img")).toHaveCount(0);
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

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("Selected work has one column", async ({ page }) => {
    await page.goto("/");
    const lefts = await page.locator("#selected-work li").evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
    expect(lefts).toHaveLength(4);
    expect(new Set(lefts).size).toBe(1);
    const width = await page.locator("#selected-work li").first().evaluate((el) => el.getBoundingClientRect().width);
    expect(Math.round(width)).toBe(390 - 32);
    // The truncated note never widens the page.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
});
