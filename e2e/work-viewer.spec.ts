import { expect, test } from "@playwright/test";
import { productPages } from "../content/work";
import { buildProductPage, pad2 } from "../lib/work/derive";

// PrimeOne as the page derives it (labels, counts and order don't depend on
// the images), so the expectations grow with the content.
const primeone = buildProductPage(productPages.find((page) => page.slug === "primeone")!, () => undefined);
const images = primeone.images;
const total = images.length;
const position = (index: number) => `${pad2(index + 1)} / ${pad2(total)}`;
const viewer = (page: import("@playwright/test").Page) => page.getByRole("dialog");
const figure = (page: import("@playwright/test").Page, id: string) => page.locator(`#highlights [data-media="${id}"]`);

test("clicking an image opens the viewer with ?fig=, in the Life palette", async ({ page }) => {
  await page.goto("/work/primeone/");
  await figure(page, images[1].id).click();
  await expect(viewer(page)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`\\?fig=${images[1].id}$`));
  await expect(viewer(page)).toContainText(position(1));
  await expect(viewer(page)).toContainText(`${images[1].label} · ${images[1].caption}`);
  await expect(viewer(page)).toHaveAttribute("aria-label", `PrimeOne, ${images[1].label}`);
  // The viewer keeps the Life palette on the light Work side.
  await expect(viewer(page)).toHaveCSS("background-color", "rgb(11, 11, 12)");
});

test("Back closes the viewer and stays on the page", async ({ page }) => {
  await page.goto("/work/primeone/");
  await figure(page, images[0].id).click();
  await expect(viewer(page)).toBeVisible();
  await page.goBack();
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PrimeOne.");
});

test("arrows step and wrap, replacing the URL; Esc closes and returns focus", async ({ page }) => {
  await page.goto("/work/primeone/");
  const first = figure(page, images[0].id);
  await first.click();
  await page.keyboard.press("ArrowRight");
  await expect(viewer(page)).toContainText(position(1));
  await expect(page).toHaveURL(new RegExp(`\\?fig=${images[1].id}$`));
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(viewer(page)).toContainText(position(total - 1));
  await page.keyboard.press("Escape");
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(first).toBeFocused();
});

test("a ?fig= deep link opens the viewer on load; closing drops the param and focuses the figure", async ({ page }) => {
  const shown = images[2];
  await page.goto(`/work/primeone/?fig=${shown.id}`);
  await expect(viewer(page)).toBeVisible();
  await expect(viewer(page)).toContainText(`${shown.label} · ${shown.caption}`);
  await viewer(page).getByRole("button", { name: "Close viewer" }).click();
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(figure(page, shown.id)).toBeFocused();
});

test("an unknown ?fig= and the old ?view params are ignored", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid&tag=tokens&fig=tokens-3-0");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PrimeOne.");
  await expect(viewer(page)).toBeHidden();
});

test("the strip steps through every figure on the page", async ({ page }) => {
  await page.goto(`/work/primeone/?fig=${images[0].id}`);
  await expect(viewer(page)).toBeVisible();
  await expect(viewer(page).getByRole("list", { name: "All figures" }).getByRole("button")).toHaveCount(total);
  const other = images[total - 1];
  await viewer(page).getByRole("button", { name: `Show ${other.label}` }).click();
  await expect(viewer(page)).toContainText(`${other.label} · ${other.caption}`);
  await expect(page).toHaveURL(new RegExp(`\\?fig=${other.id}$`));
});

test("the viewer's top line names the block, and credits the designer", async ({ page }) => {
  await page.goto("/work/templates/?fig=genesis");
  await expect(viewer(page)).toContainText("Templates · Highlights");
  await expect(viewer(page).locator("[data-credits]")).toHaveText("Design: Ümit Çelik");
});

test("the server HTML has no viewer open, whatever the query", async ({ request }) => {
  const html = await (await request.get(`/work/primeone/?fig=${images[0].id}`)).text();
  expect(html).not.toContain("<dialog");
  expect(html).toContain('id="highlights"');
});

test.describe("at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("a swipe steps to the next figure", async ({ page }) => {
    await page.goto(`/work/primeone/?fig=${images[0].id}`);
    const stage = viewer(page).locator("[data-stage]");
    const box = (await stage.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.75, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 5 });
    await page.mouse.up();
    await expect(viewer(page)).toContainText(position(1));
  });
});
