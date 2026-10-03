import { expect, test } from "@playwright/test";

const viewer = (page: import("@playwright/test").Page) => page.getByRole("dialog");

test("the hero opens the viewer on the full set, with its URL", async ({ page }) => {
  await page.goto("/work/primeone/");
  await page.locator('[data-media="cover"]').click();
  await expect(viewer(page)).toBeVisible();
  await expect(page).toHaveURL(/\?fig=cover$/);
  await expect(viewer(page)).toContainText("01 / 06");
  await expect(viewer(page)).toHaveAttribute("aria-label", "PrimeOne, FIG. 01");
});

test("arrows step and wrap, replacing the URL; Esc closes and returns focus", async ({ page }) => {
  await page.goto("/work/primeone/");
  const hero = page.locator('[data-media="cover"]');
  await hero.click();
  await page.keyboard.press("ArrowRight");
  await expect(viewer(page)).toContainText("02 / 06");
  await expect(page).toHaveURL(/\?fig=variables-4-0$/);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(viewer(page)).toContainText("06 / 06");
  await page.keyboard.press("Escape");
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(hero).toBeFocused();
});

test("Back closes the viewer and stays on the page", async ({ page }) => {
  await page.goto("/work/primeone/");
  await page.locator('[data-media="cover"]').click();
  await expect(viewer(page)).toBeVisible();
  await page.goBack();
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PrimeOne.");
});

test("a ?fig= deep link opens the viewer on load; closing drops the param", async ({ page }) => {
  await page.goto("/work/primeone/?fig=tokens-3-0");
  await expect(viewer(page)).toBeVisible();
  await expect(viewer(page)).toContainText("FIG. 06.2 · Tokens");
  await viewer(page).getByRole("button", { name: "Close viewer" }).click();
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
});

test("from the Grid the viewer steps through the filtered set", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid&tag=tokens");
  await page.locator('[data-view="grid"] [data-media="tokens-3-0"]').click();
  await expect(viewer(page)).toContainText("02 / 03");
  await expect(page).toHaveURL(/\?view=grid&tag=tokens&fig=tokens-3-0$/);
});

test("G toggles the grid inside the viewer", async ({ page }) => {
  await page.goto("/work/primeone/?fig=cover");
  await page.keyboard.press("g");
  await expect(viewer(page).getByRole("list", { name: "All figures" }).getByRole("button")).toHaveCount(6);
  await viewer(page).getByRole("button", { name: "Show FIG. 05.1" }).click();
  await expect(viewer(page)).toContainText("FIG. 05.1 · Tokens");
});

test("the viewer's top line names the figure's entry and month", async ({ page }) => {
  await page.goto("/work/templates/?fig=genesis-cover");
  await expect(viewer(page)).toContainText("Genesis · Dec 2024");
});

test.describe("at 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("a swipe steps to the next figure", async ({ page }) => {
    await page.goto("/work/primeone/?fig=cover");
    const stage = viewer(page).locator("[data-stage]");
    const box = (await stage.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.75, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 5 });
    await page.mouse.up();
    await expect(viewer(page)).toContainText("02 / 06");
  });
});
