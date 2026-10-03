import { expect, test } from "@playwright/test";

const STUDIES = [
  ["primeone", "PrimeOne"],
  ["primeblocks", "PrimeBlocks"],
  ["primeicons", "PrimeIcons"],
  ["templates", "Templates"],
] as const;

for (const [slug, title] of STUDIES) {
  test(`${title} renders its header, hero and release log`, async ({ page }) => {
    await page.goto(`/work/${slug}/`);
    await expect(page).toHaveTitle(`${title} · Onur Senture`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`${title}.`);
    await expect(page.getByText("Design lead", { exact: true })).toBeVisible();
    await expect(page.locator('[data-media="cover"]')).toContainText("FIG. 01");
    await expect(page.locator('[data-view="log"] h2').first()).toHaveText(/^\d{4}$/);
    await expect(page.getByRole("link", { name: "← Work" })).toHaveAttribute("href", "/work/");
  });
}

test("the PrimeOne log is newest first and links each entry's post", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.locator('[data-view="log"] h2')).toHaveText(["2026", "2024", "2023", "2022"]);
  const entry = page.locator("#entry-3-0");
  await expect(entry).toContainText("3.0");
  await expect(entry).toContainText("· Nov");
  await expect(entry.getByRole("link", { name: "post" })).toHaveAttribute("href", "https://x.com/w00f/status/1854537901700186303");
  await expect(entry.locator('[data-media="overview-3-0"]')).toContainText("FIG. 06.1 · Overview");
  await expect(entry.getByRole("button", { name: "+1 in Grid →" })).toBeVisible();
});

test("Templates credits Genesis and counts its coverage from the data", async ({ page }) => {
  await page.goto("/work/templates/");
  await expect(page.locator("#entry-genesis [data-credits]")).toHaveText("Design: Ümit Çelik · Implementation: Taner Ergin");
  await expect(page.locator("#entry-genesis").getByRole("list", { name: "Frameworks" })).toContainText("React");
  await expect(page.locator("dl")).toContainText(/Coverage\s*34 templates · 1 page$/);
  await expect(page.locator("#entry-verona").getByRole("button", { name: "+1 page in Grid →" })).toBeVisible();
});

test("an unknown case study 404s inside the Work shell", async ({ page }) => {
  const response = await page.goto("/work/unknown/");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found." })).toBeVisible();
});

test("every canvas on a case study is decorative", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.locator("canvas").first()).toBeAttached();
  const unlabelled = await page
    .locator("canvas")
    .evaluateAll((canvases) => canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length);
  expect(unlabelled).toBe(0);
});
