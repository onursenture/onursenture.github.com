import { expect, test } from "@playwright/test";
import { byId, entry, media, position, total } from "./primeone";

const viewer = (page: import("@playwright/test").Page) => page.getByRole("dialog");

test("the hero opens the viewer on the full set, with its URL", async ({ page }) => {
  await page.goto("/work/primeone/");
  await page.locator('[data-media="cover"]').click();
  await expect(viewer(page)).toBeVisible();
  await expect(page).toHaveURL(/\?fig=cover$/);
  await expect(viewer(page)).toContainText(position(0));
  await expect(viewer(page)).toHaveAttribute("aria-label", `PrimeOne, ${media[0].label}`);
  // The viewer keeps the Life palette on the light Work side.
  await expect(viewer(page)).toHaveCSS("background-color", "rgb(11, 11, 12)");
});

test("arrows step and wrap, replacing the URL; Esc closes and returns focus", async ({ page }) => {
  await page.goto("/work/primeone/");
  const hero = page.locator('[data-media="cover"]');
  await hero.click();
  await page.keyboard.press("ArrowRight");
  await expect(viewer(page)).toContainText(position(1));
  await expect(page).toHaveURL(new RegExp(`\\?fig=${media[1].id}$`));
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(viewer(page)).toContainText(position(total - 1));
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
  const figure = byId("tokens-3-0");
  await page.goto(`/work/primeone/?fig=${figure.id}`);
  await expect(viewer(page)).toBeVisible();
  await expect(viewer(page)).toContainText(`${figure.label} · ${figure.caption}`);
  await viewer(page).getByRole("button", { name: "Close viewer" }).click();
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
});

test("a deep-linked viewer returns focus to the figure's button on close", async ({ page }) => {
  // Nothing is focused on load, so there is no opener to remember. The Log
  // shows every figure, so the button exists to take the focus back.
  const shown = entry("3-0").media[1].id;
  await page.goto(`/work/primeone/?fig=${shown}`);
  await expect(viewer(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer(page)).toBeHidden();
  await expect(page).toHaveURL(/\/work\/primeone\/$/);
  await expect(page.locator(`[data-media="${shown}"]:visible`)).toBeFocused();
});

test("a figure in a Log entry's grid opens the viewer on the full set", async ({ page }) => {
  await page.goto("/work/primeone/");
  const figure = byId("tokens-3-0");
  const cell = page.locator(`#entry-3-0 [data-media="${figure.id}"]`);
  await cell.click();
  await expect(viewer(page)).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`\\?fig=${figure.id}$`));
  await expect(viewer(page)).toContainText(`${figure.label} · ${figure.caption}`);
  await expect(viewer(page)).toContainText(position(media.findIndex((item) => item.id === figure.id)));
  await page.keyboard.press("Escape");
  await expect(cell).toBeFocused();
});

test("the viewer has no Grid toggle and ignores the G key; the strip steps through every figure", async ({ page }) => {
  await page.goto("/work/primeone/?fig=cover");
  await expect(viewer(page)).toBeVisible();
  await expect(viewer(page).getByRole("button", { name: /^(Grid|Single)$/ })).toHaveCount(0);
  await page.keyboard.press("g");
  await expect(viewer(page).getByRole("list", { name: "All figures" }).getByRole("button")).toHaveCount(total);
  await expect(viewer(page)).toContainText(position(0));
  const other = media[3];
  await viewer(page).getByRole("button", { name: `Show ${other.label}` }).click();
  await expect(viewer(page)).toContainText(`${other.label} · ${other.caption}`);
  await expect(page).toHaveURL(new RegExp(`\\?fig=${other.id}$`));
});

test("an old view URL with ?fig= still opens the viewer on the Log's full set, and Back closes it", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid&tag=tokens&fig=tokens-3-0");
  await expect(viewer(page)).toBeVisible();
  await expect(page.locator('[data-view="log"]')).toBeAttached();
  const index = media.findIndex((item) => item.id === "tokens-3-0");
  await expect(viewer(page)).toContainText(position(index));
  await viewer(page).getByRole("button", { name: "Close viewer" }).click();
  await expect(viewer(page)).toBeHidden();
  await expect(page.locator('#entry-3-0 [data-media="tokens-3-0"]:visible')).toBeFocused();
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
    await expect(viewer(page)).toContainText(position(1));
  });
});
