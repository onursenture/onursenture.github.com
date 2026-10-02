import { expect, test } from "@playwright/test";

test("photo pages keep their URLs and serve AVIF with a JPEG fallback", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page.getByRole("heading", { name: "Stabilo" })).toBeVisible();
  await expect(page.locator('picture source[type="image/avif"]')).toHaveAttribute(
    "srcset",
    /\/images\/photos\/stabilo-640\.avif 640w/,
  );
  const img = page.locator("picture img");
  await expect(img).toHaveAttribute("width", "2560");
  await expect(img).toHaveAttribute("height", "1440");
  expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
});

test("photo pages emit an absolute JPEG og:image", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://onursenture.com/images/photos/stabilo-2560.jpg",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("the photos index links every photo", async ({ page }) => {
  await page.goto("/photos/");
  await expect(page.locator('main a[href^="/photos/"]')).toHaveCount(5);
});
