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

test("the work index collapses the empty year and role columns", async ({ page }) => {
  await page.goto("/");
  const work = page.locator("#work");
  await expect(work.locator("div.group")).toHaveCount(5);
  // Titles start at the section's left edge, not after an empty year track.
  const sectionLeft = await work.evaluate((el) => el.getBoundingClientRect().left);
  const titleLefts = await work
    .locator("div.group > span:first-child")
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
  expect(titleLefts).toHaveLength(5);
  for (const left of titleLefts) expect(left).toBeCloseTo(sectionLeft, 0);
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

test("the dashboard home shows the metric row and the Overview panels", async ({ page }) => {
  await page.goto("/?view=dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Overview");
  // No database, so no source has data: the metric tiles are left out
  // rather than shown as 0.
  await expect(page.getByTestId("stat-row")).toHaveCount(0);

  // No entry has years or a role yet, so those columns are not rendered.
  const work = page.locator("#work");
  await expect(work.getByRole("columnheader")).toHaveText(["Project", "Notes"]);
  await expect(work.locator("tbody tr")).toHaveCount(5);
  // The Lab table carries status in the Project cell's glyph, not a column.
  const lab = page.locator("#lab");
  await expect(lab.getByRole("columnheader")).toHaveText(["Project", "Description", "Year"]);
  await expect(lab.locator("tbody tr")).toHaveCount(3);
  await expect(page.locator("#status")).toContainText("Open to roles");
  await expect(page.locator("#activity")).toContainText("No activity yet.");
});

test("the Sources panel lists every source as never synced without a database", async ({ page }) => {
  await page.goto("/?view=dashboard");
  const sources = page.locator("#sources");
  await expect(sources.locator("tbody tr")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(5);
});

for (const width of [320, 390]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test("index rows never scroll the page sideways and keep the → inside the gutter", async ({ page }) => {
      await page.goto("/");
      const scroll = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scroll.scrollWidth).toBe(scroll.clientWidth);

      // The Lab index has a linked row, so it has an arrow.
      const arrow = page.locator("#lab a").first().locator('span[aria-hidden="true"]').last();
      await expect(arrow).toHaveText("→");
      const box = await arrow.boundingBox();
      expect(box).not.toBeNull();
      // 16px page gutter on the right.
      expect(box!.x + box!.width).toBeLessThanOrEqual(width - 16 + 0.5);
      expect(box!.x).toBeGreaterThanOrEqual(0);
    });
  });
}
