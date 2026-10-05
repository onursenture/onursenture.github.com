import { expect, test } from "@playwright/test";

test("without a database the photos index renders empty", async ({ page }) => {
  const response = await page.goto("/life/photos/");
  expect(response?.status()).toBe(200);
  await expect(page.locator('main a[href^="/life/photos/"]')).toHaveCount(0);
});

test("pages without a photo share the defaults: site name, summary card, no image", async ({ page }) => {
  for (const [path, title] of [
    ["/", "Onur Senture"],
    ["/life/", "Life · Onur Senture"],
  ]) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Onur Senture");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary");
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
  }
});

test("/photos/ URLs redirect permanently to /life/photos/", async ({ request }) => {
  const index = await request.get("/photos/", { maxRedirects: 0 });
  expect(index.status()).toBe(308);
  expect(index.headers()["location"]).toBe("/life/photos/");
  const photo = await request.get("/photos/stabilo/", { maxRedirects: 0 });
  expect(photo.status()).toBe(308);
  expect(photo.headers()["location"]).toBe("/life/photos/stabilo/");
});
