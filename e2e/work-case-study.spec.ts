import { expect, test } from "@playwright/test";
import { byId, entry, primeone } from "./primeone";

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
  await expect(page.locator('[data-view="log"] h2')).toHaveText(primeone.groups.map((group) => group.year));
  const e30 = entry("3-0");
  const overview = byId("overview-3-0");
  const block = page.locator("#entry-3-0");
  await expect(block).toContainText(e30.heading);
  await expect(block).toContainText(`· ${e30.month}`);
  const post = block.getByRole("link", { name: `Post on X, ${e30.heading}, ${e30.month} ${e30.year}` });
  await expect(post).toHaveAttribute("href", "https://x.com/primereact/status/1854528709304205531");
  await expect(post).toContainText("post");
  await expect(block.locator('[data-media="overview-3-0"]')).toContainText(`${overview.label} · ${overview.caption}`);
  await expect(block.locator("[data-media]")).toHaveCount(e30.media.length);
  await expect(block.getByRole("button", { name: /in Grid/ })).toHaveCount(0);
});

test("Templates credits Genesis's designer and counts its coverage from the data", async ({ page }) => {
  await page.goto("/work/templates/");
  await expect(page.locator("#entry-genesis [data-credits]")).toHaveText("Design: Ümit Çelik");
  await expect(page.locator("#entry-genesis").getByRole("list", { name: "Frameworks" })).toContainText("React");
  await expect(page.locator("dl")).toContainText(/Coverage\s*28 templates · 9 remasters · 1 page$/);
  // Verona's cover and its landing page both show in its entry.
  await expect(page.locator("#entry-verona [data-media]")).toHaveCount(2);
  await expect(page.locator('#entry-verona [data-media="verona-landing"]')).toBeVisible();
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
