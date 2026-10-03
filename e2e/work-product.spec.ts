import { expect, test } from "@playwright/test";
import { productPages } from "../content/work";
import { pageImages } from "../lib/work/derive";

for (const page of productPages) {
  test(`${page.title} renders its header, its blocks in order and their anchors`, async ({ page: tab }) => {
    await tab.goto(`/work/${page.slug}/`);
    await expect(tab).toHaveTitle(`${page.title} · Onur Senture`);
    const main = tab.locator("main");
    await expect(tab.getByRole("heading", { level: 1 })).toContainText(`${page.title}.`);
    await expect(main).toContainText(page.intro);
    for (const fact of page.facts) await expect(main.locator("dl")).toContainText(fact.value);
    await expect(tab.getByRole("link", { name: "← Home" })).toHaveAttribute("href", "/");
    // Every block is a row anchored at its id, in content order.
    const ids = await main.locator("section[id]").evaluateAll((sections) => sections.map((s) => s.id));
    expect(ids).toEqual(page.blocks.map((block) => block.id));
    await expect(main.locator("#what-i-did h2")).toHaveText("What I did");
    await expect(main.locator("#highlights [data-media]")).toHaveCount(pageImages(page).length);
    await expect(main.locator("#highlights ul")).toHaveAttribute("data-columns", "3");
    // No release log, posts or version detail.
    await expect(main.locator('[data-view], [id^="entry-"], [id^="post-"]')).toHaveCount(0);
  });
}

test("a block anchor scrolls its row into view", async ({ page }) => {
  await page.goto("/work/templates/#highlights");
  await expect(page.locator("#highlights")).toBeInViewport();
});

test("Templates shows the six named templates and credits Genesis's designer", async ({ page }) => {
  await page.goto("/work/templates/");
  const block = page.locator("#highlights");
  await expect(block.locator("figcaption")).toHaveCount(6);
  for (const name of ["Apollo", "Diamond", "Ultima", "Verona", "Atlantis", "Genesis"]) await expect(block).toContainText(name);
  await expect(block.locator("[data-credits]")).toHaveText("Design: Ümit Çelik");
});

test("the product pages link out only to @w00f posts (there are none today)", async ({ page }) => {
  for (const { slug } of productPages) {
    await page.goto(`/work/${slug}/`);
    await expect(page.locator("main")).toBeVisible();
    const hrefs = await page.locator('main a[href^="http"]').evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href));
    for (const href of hrefs) expect(href, slug).toMatch(/^https:\/\/(x|twitter)\.com\/w00f\/status\//);
  }
});

test("a page with only placeholders has no og:image", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
});

test("an unknown product 404s inside the Work shell", async ({ page }) => {
  const response = await page.goto("/work/unknown/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found." })).toBeVisible();
});

test("every canvas on a product page is decorative", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.locator("canvas").first()).toBeAttached();
  const unlabelled = await page
    .locator("canvas")
    .evaluateAll((canvases) => canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length);
  expect(unlabelled).toBe(0);
});

for (const path of ["/work/", "/work", "/work/archive/", "/work/archive"]) {
  test(`${path} redirects permanently to the home`, async ({ page, request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.locator("#selected-work")).toBeVisible();
  });
}

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("blocks stack and the images grid has one column", async ({ page }) => {
    await page.goto("/work/primeone/");
    const label = await page.locator("#highlights h2").boundingBox();
    const cells = page.locator("#highlights li");
    const first = await cells.nth(0).boundingBox();
    const second = await cells.nth(1).boundingBox();
    expect(first!.y).toBeGreaterThan(label!.y);
    expect(Math.round(first!.x)).toBe(Math.round(second!.x));
    expect(second!.y).toBeGreaterThan(first!.y);
    expect(Math.round(first!.width)).toBe(390 - 32);
  });
});
