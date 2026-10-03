import { expect, test } from "@playwright/test";

test("old /photos/ URLs redirect, and photo pages serve AVIF with a JPEG fallback", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page).toHaveURL(/\/life\/photos\/stabilo\/$/);
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

test("photo pages emit an absolute JPEG og:image on top of the shared defaults", async ({ page }) => {
  await page.goto("/life/photos/stabilo/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://onursenture.com/images/photos/stabilo-2560.jpg",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Onur Senture");
});

test("photo pages link to the previous and next photo", async ({ page }) => {
  await page.goto("/life/photos/stabilo/");
  const more = page.getByRole("navigation", { name: "More photos" });
  await expect(more.getByRole("link")).toHaveText(["Bold, Vakıf Building", "Kızılcıklı"]);
  await expect(more).toContainText("← Previous");
  await expect(more).toContainText("Next →");
  await expect(more.getByRole("link", { name: "Bold, Vakıf Building" })).toHaveAttribute("href", /^\/life\/photos\/[a-z0-9-]+\/$/);
  await expect(more.getByRole("link", { name: "Kızılcıklı" })).toHaveAttribute("href", "/life/photos/kizilcikli/");
  await more.getByRole("link", { name: "Kızılcıklı" }).click();
  await expect(page).toHaveURL(/\/life\/photos\/kizilcikli\/$/);
  // The oldest photo has no next.
  await expect(page.getByRole("navigation", { name: "More photos" }).getByRole("link")).toHaveCount(1);
});

test("the photos index links every photo with decorative thumbnails", async ({ page }) => {
  await page.goto("/life/photos/");
  await expect(page.locator('main a[href^="/life/photos/"]')).toHaveCount(5);
  await expect(page.locator('main img[alt=""]')).toHaveCount(5);
  await expect(page.locator("main picture source").first()).toHaveAttribute(
    "sizes",
    "(min-width: 1248px) 384px, (min-width: 768px) calc((100vw - 96px) / 3), calc((100vw - 48px) / 2)",
  );
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
