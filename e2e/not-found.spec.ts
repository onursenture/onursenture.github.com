import { expect, test } from "@playwright/test";

test("an unknown URL 404s inside the Work shell", async ({ page }) => {
  const response = await page.goto("/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found." })).toBeVisible();
  // The shell is the Work one: the Life switch is there, and it is off.
  await expect(page.getByRole("switch", { name: "Life" }).filter({ visible: true })).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
});

test("an unknown /life/ URL 404s inside the Life shell", async ({ page }) => {
  const response = await page.goto("/life/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found." })).toBeVisible();
  await expect(page.locator('div[data-side="life"]')).toBeVisible();
  await expect(page.getByRole("switch", { name: "Life" }).filter({ visible: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Nothing here. Not even a film.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Life" })).toHaveAttribute("href", "/life/");
});

test("an unknown photo 404s inside the shell", async ({ page }) => {
  const response = await page.goto("/life/photos/nope/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Onur Senture" })).toBeVisible();
});

test("a path outside both layouts 404s with the title", async ({ page }) => {
  const response = await page.goto("/missing.md");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Not found · Onur Senture");
});

for (const path of ["/does-not-exist/", "/life/does-not-exist/"]) {
  test(`${path} is titled "Not found"`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle("Not found · Onur Senture");
  });
}
