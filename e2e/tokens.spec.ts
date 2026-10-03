import { expect, test } from "@playwright/test";

const bodyColors = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return { bg: style.backgroundColor, fg: style.color };
  });

test("the light tokens reach the page", async ({ page }) => {
  await page.goto("/");
  expect(await bodyColors(page)).toEqual({ bg: "rgb(250, 250, 248)", fg: "rgb(31, 31, 34)" });
});

test("body text is IBM Plex Mono, lead lines Plex Sans, and the name Doto", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('link[href*="typekit"]')).toHaveCount(0);
  const fonts = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return {
      body: getComputedStyle(document.body).fontFamily,
      mono: root.getPropertyValue("--font-mono"),
      sans: root.getPropertyValue("--font-sans"),
      name: root.getPropertyValue("--font-name"),
    };
  });
  expect(fonts.body).toContain("IBM Plex Mono");
  expect(fonts.sans).toContain("IBM Plex Sans");
  expect(fonts.name).toContain("Doto");
});

test.describe("when the OS prefers dark", () => {
  test.use({ colorScheme: "dark" });

  test("the Work side stays light, with or without JavaScript", async ({ page, browser, baseURL }) => {
    await page.goto("/");
    expect(await bodyColors(page)).toEqual({ bg: "rgb(250, 250, 248)", fg: "rgb(31, 31, 34)" });
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: "dark" });
    const plain = await context.newPage();
    await plain.goto(`${baseURL}/`);
    expect(await bodyColors(plain)).toEqual({ bg: "rgb(250, 250, 248)", fg: "rgb(31, 31, 34)" });
    await context.close();
  });
});
