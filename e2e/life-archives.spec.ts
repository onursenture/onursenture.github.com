import { expect, test } from "@playwright/test";

test("every archive route renders inside the Life shell without a database", async ({ page }) => {
  for (const [path, title] of [
    ["/life/films/", "Films"],
    ["/life/books/", "Books"],
    ["/life/theatre/", "Theatre"],
    ["/life/saved/", "Saved"],
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('div[data-side="life"]')).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    await expect(page.getByRole("link", { name: "← Life" })).toHaveAttribute("href", "/life/");
  }
  expect((await page.goto("/life/films/1999/"))?.status()).toBe(404);
});

test("without a database, Theatre still shows the committed history", async ({ page }) => {
  await page.goto("/life/theatre/");
  await expect(page.locator("section#year-2026")).toContainText("Adel Seni Seçti");
  await page.goto("/life/");
  await expect(page.locator('[data-section="theatre"] li').first()).toContainText("Adel Seni Seçti");
});
