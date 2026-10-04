import { expect, test } from "@playwright/test";

test("with no notes the home has no Notes row and /notes/ says so", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#notes")).toHaveCount(0);
  await page.goto("/notes/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Notes What I'm making, in short.");
  await expect(page.getByText("No notes yet.")).toBeVisible();
  await expect(page.getByRole("link", { name: "RSS" })).toHaveAttribute("href", "/feed.xml");
});

test("unknown note pages and pages past the last are 404s", async ({ page }) => {
  expect((await page.goto("/notes/2222222222222/"))?.status()).toBe(404);
  expect((await page.goto("/notes/page/2/"))?.status()).toBe(404);
  expect((await page.goto("/notes/page/1/"))?.status()).toBe(404);
});
