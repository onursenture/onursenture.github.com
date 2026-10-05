import { expect, test } from "@playwright/test";

test("old /photos/ URLs redirect, and photo pages serve AVIF with a JPEG fallback", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page).toHaveURL(/\/life\/photos\/stabilo\/$/);
  await expect(page.getByRole("heading", { name: "Stabilo" })).toBeVisible();
  await expect(page.locator('main picture source[type="image/avif"]')).toHaveAttribute("srcset", /\/images\/fixtures\/photo-portrait-640\.avif 640w/);
  const img = page.locator("main picture img");
  await expect(img).toHaveAttribute("width", "1600");
  await expect(img).toHaveAttribute("height", "2000");
  await expect(img).toHaveAttribute("alt", "Stabilo");
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator("main time")).toHaveAttribute("datetime", "2026-04-11");
});

test("a photo page uses its alt text, its camera and a JPEG og:image", async ({ page }) => {
  await page.goto("/life/photos/kizilcikli/");
  await expect(page.locator("main picture img")).toHaveAttribute("alt", "Evening light over a hillside village");
  await expect(page.locator("main")).toContainText("Fujifilm X100VI");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://onursenture.com/images/fixtures/photo-landscape-2560.jpg");
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", "Evening light over a hillside village");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Onur Senture");
});

test("photo pages link to the newer and the older photo", async ({ page }) => {
  await page.goto("/life/photos/kizilcikli/");
  const more = page.getByRole("navigation", { name: "More photos" });
  await expect(more.getByRole("link")).toHaveText(["Night Boulevard", "Stabilo"]);
  await expect(more).toContainText("← Previous");
  await expect(more).toContainText("Next →");
  await more.getByRole("link", { name: "Stabilo" }).click();
  await expect(page).toHaveURL(/\/life\/photos\/stabilo\/$/);
  // The oldest photo has no next.
  await expect(page.getByRole("navigation", { name: "More photos" }).getByRole("link")).toHaveCount(1);
});

test("the photos index links every photo with decorative thumbnails", async ({ page }) => {
  await page.goto("/life/photos/");
  await expect(page.locator('main a[href^="/life/photos/"]')).toHaveCount(3);
  await expect(page.locator('main img[alt=""]')).toHaveCount(3);
  await expect(page.locator("main picture source").first()).toHaveAttribute("sizes", "(min-width: 768px) calc((100vw - 128px) / 3), calc((100vw - 48px) / 2)");
});

test("an unknown slug and the placeholder are 404s", async ({ page }) => {
  expect((await page.goto("/life/photos/nope/"))?.status()).toBe(404);
  expect((await page.goto("/life/photos/_/"))?.status()).toBe(404);
});
