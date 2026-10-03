import { expect, test } from "@playwright/test";

test("the Archive lists dated rows, newest first, linking only @w00f posts", async ({ page }) => {
  await page.goto("/work/archive/");
  await expect(page).toHaveTitle("Archive · Onur Senture");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Archive.");
  await expect(page.locator('[data-view="archive"] h2')).toHaveText(["2025", "2024", "2023", "2021", "2020", "2019", "2018"]);
  const editor = page.locator("#archive-visual-theme-editor");
  await expect(editor).toContainText("Nov 2024");
  await expect(editor.getByRole("link", { name: "Post on X, Visual Theme Editor, Nov 2024" })).toHaveAttribute("href", "https://x.com/w00f/status/1857050715224494345");
  // A source that is not an @w00f post is not linked at all.
  await expect(page.locator("#archive-saga-vela-arya")).toBeVisible();
  await expect(page.locator("#archive-saga-vela-arya").getByRole("link")).toHaveCount(0);
  await expect(page.locator("#archive-sigma").getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "← Work" })).toHaveAttribute("href", "/work/");
});
