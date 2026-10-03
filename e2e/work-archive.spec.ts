import { expect, test } from "@playwright/test";

test("the Archive lists dated rows, newest first, each linking its post", async ({ page }) => {
  await page.goto("/work/archive/");
  await expect(page).toHaveTitle("Archive · Onur Senture");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Archive.");
  await expect(page.locator('[data-view="archive"] h2')).toHaveText(["2025", "2024", "2023", "2021", "2018"]);
  const editor = page.locator("#archive-visual-theme-editor");
  await expect(editor).toContainText("Nov 2024");
  await expect(editor.getByRole("link", { name: "post" })).toHaveAttribute("href", "https://x.com/w00f/status/1857050715224494345");
  await expect(page.getByRole("link", { name: "← Work" })).toHaveAttribute("href", "/work/");
});
