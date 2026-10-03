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

test("photo pages emit an absolute JPEG og:image on top of the shared defaults", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://onursenture.com/images/photos/stabilo-2560.jpg",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Onur Senture");
});

test("photo pages link to the previous and next photo", async ({ page }) => {
  await page.goto("/photos/stabilo/");
  const more = page.getByRole("navigation", { name: "More photos" });
  await expect(more.getByRole("link")).toHaveText(["Bold, Vakıf Building →", "Kızılcıklı →"]);
  await more.getByRole("link", { name: "Kızılcıklı" }).click();
  await expect(page).toHaveURL(/\/photos\/kizilcikli\/$/);
  // The oldest photo has no next.
  await expect(page.getByRole("navigation", { name: "More photos" }).getByRole("link")).toHaveCount(1);
});

test("the photos index links every photo with decorative thumbnails", async ({ page }) => {
  await page.goto("/photos/");
  await expect(page.locator('main a[href^="/photos/"]')).toHaveCount(5);
  await expect(page.locator('main img[alt=""]')).toHaveCount(5);
  await expect(page.locator("main picture source").first()).toHaveAttribute(
    "sizes",
    "(min-width: 1248px) 384px, (min-width: 768px) calc((100vw - 96px) / 3), calc((100vw - 48px) / 2)",
  );
});

test("the dashboard photos grid declares its own sizes", async ({ page }) => {
  await page.goto("/photos/?view=dashboard");
  await expect(page.locator("main picture source").first()).toHaveAttribute(
    "sizes",
    "(min-width: 768px) calc((100vw - 336px) / 4), calc((100vw - 48px) / 2)",
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

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("a long dashboard photo title stays on one line in the 40px bar", async ({ page }) => {
    await page.goto("/photos/bazi-kotu-aliskanliklarin-politik-tarihi/?view=dashboard");
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveText("Bazı Kötü Alışkanlıkların Politik Tarihi");
    const header = page.locator("main > header");
    expect((await header.boundingBox())!.height).toBe(40);
    // One line of 14px type (it truncates with an ellipsis rather than
    // wrapping when it is longer than the bar), and the meta is hidden so it
    // cannot squeeze the title.
    expect((await title.boundingBox())!.height).toBeLessThan(24);
    expect(await title.evaluate((el) => getComputedStyle(el).textOverflow)).toBe("ellipsis");
    await expect(header.locator("span")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);
  });
});
