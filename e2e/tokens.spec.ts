import { expect, test } from "@playwright/test";

const bodyColors = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return { bg: style.backgroundColor, fg: style.color };
  });

test("the light and dark tokens reach the page", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "light", url: baseURL! }]);
  await page.goto("/");
  expect(await bodyColors(page)).toEqual({ bg: "rgb(250, 250, 248)", fg: "rgb(31, 31, 34)" });

  await context.addCookies([{ name: "theme", value: "dark", url: baseURL! }]);
  await page.reload();
  expect(await bodyColors(page)).toEqual({ bg: "rgb(11, 11, 12)", fg: "rgb(237, 237, 237)" });
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

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, colorScheme: "dark" });

  test("the OS color scheme applies", async ({ page }) => {
    await page.goto("/");
    expect(await bodyColors(page)).toEqual({ bg: "rgb(11, 11, 12)", fg: "rgb(237, 237, 237)" });
  });
});
