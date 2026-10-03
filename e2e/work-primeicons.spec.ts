import { expect, test } from "@playwright/test";

test("the icon set is the last block, after the highlights, searchable", async ({ page }) => {
  await page.goto("/work/primeicons/");
  const ids = await page.locator("main section[id]").evaluateAll((sections) => sections.map((s) => s.id));
  expect(ids).toEqual(["what-i-did", "highlights", "icon-set"]);
  const set = page.locator("#icon-set");
  await expect(set.getByRole("heading", { name: "Icon set" })).toBeVisible();
  await expect(set.getByText("313 of 313 icons")).toBeVisible();
  await set.getByRole("searchbox").fill("chart-bar");
  await expect(set.getByText("1 of 313 icons")).toBeVisible();
  await expect(set.getByRole("button", { name: /^Copy pi pi-/ })).toHaveCount(1);
  await expect(set.getByText("PrimeIcons 7.0.0 © PrimeTek, MIT License")).toBeVisible();
});

test("clicking an icon copies its class name", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/work/primeicons/");
  const button = page.getByRole("button", { name: "Copy pi pi-chart-bar" });
  await button.click();
  await expect(button).toContainText("copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("pi pi-chart-bar");
});

test("the server HTML already has the icons and the licence line", async ({ request }) => {
  // React separates adjacent text nodes with <!-- --> in server HTML.
  const html = (await (await request.get("/work/primeicons/")).text()).replaceAll("<!-- -->", "");
  expect(html).toContain("PrimeIcons 7.0.0 © PrimeTek, MIT License");
  expect(html).toContain("Copy pi pi-chart-bar");
});

test("only PrimeIcons has the icon set", async ({ page }) => {
  for (const slug of ["primeone", "primeblocks", "templates"]) {
    await page.goto(`/work/${slug}/`);
    await expect(page.locator("[data-icons]")).toHaveCount(0);
  }
});
