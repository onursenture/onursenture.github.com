import { expect, test } from "@playwright/test";

const bodyColors = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return { bg: style.backgroundColor, fg: style.color };
  });

test("the light and dark tokens reach the page", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "light", url: baseURL! }]);
  await page.goto("/");
  expect(await bodyColors(page)).toEqual({ bg: "rgb(255, 255, 255)", fg: "rgb(0, 0, 0)" });

  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.reload();
  expect(await bodyColors(page)).toEqual({ bg: "rgb(0, 0, 0)", fg: "rgb(242, 242, 242)" });
});

test("body text is Neue Haas Grotesk Text and mono is Fragment Mono", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="stylesheet"][href="https://use.typekit.net/jgu1ygn.css"]')).toHaveCount(1);
  const fonts = await page.evaluate(() => ({
    body: getComputedStyle(document.body).fontFamily,
    mono: getComputedStyle(document.documentElement).getPropertyValue("--font-mono"),
  }));
  expect(fonts.body).toMatch(/^"?neue-haas-grotesk-text"?, "Helvetica Neue"/);
  expect(fonts.mono).toContain("Fragment Mono");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, colorScheme: "dark" });

  test("the OS color scheme applies", async ({ page }) => {
    await page.goto("/");
    expect(await bodyColors(page)).toEqual({ bg: "rgb(0, 0, 0)", fg: "rgb(242, 242, 242)" });
  });
});
