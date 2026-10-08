import { expect, test } from "@playwright/test";

test("/life/ is the boot readout, then a row for every section, with empty states", async ({ page }) => {
  await page.goto("/life/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("Booting w00f...");
  await expect(now).toContainText("Human detected.");
  await expect(now).toContainText("idle");
  for (const id of ["films", "books", "theatre", "articles", "photos"]) {
    await expect(page.locator(`[data-section="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-section="github"]')).toHaveCount(0);
  await expect(page.locator('[data-section="films"]')).toContainText("Nothing here yet.");
});

test("the archive sections link their All to the archive pages", async ({ page }) => {
  await page.goto("/life/");
  for (const [section, href] of [
    ["films", "/life/films/"],
    ["books", "/life/books/"],
    ["theatre", "/life/theatre/"],
    ["articles", "/life/saved/"],
  ] as const) {
    await expect(page.locator(`[data-section="${section}"]`).getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", href);
  }
  await expect(page.locator('[data-section="writing"]')).toHaveCount(0);
});

test("the server HTML of a direct load has the readout complete, with no typing", async ({ page }) => {
  const html = await (await page.request.get("/life/")).text();
  expect(html).toContain("Human detected.");
  expect(html).toContain("idle");
});

test("the home tiles' /life fragments each resolve to one element", async ({ page }) => {
  for (const id of ["books", "films", "photos", "articles"]) {
    await page.goto(`/life/#${id}`);
    await expect(page.locator(`[id="${id}"]`), `#${id}`).toHaveCount(1);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("arriving from the switch shows the readout at once", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("switch", { name: "Life" }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/life\/$/);
    // No typing: the last boot line is complete immediately.
    await expect(page.getByRole("region", { name: "Now" }).filter({ visible: true })).toContainText("Human detected.", { timeout: 300 });
  });
});

test("arriving from the switch types the readout in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("switch", { name: "Life" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  const now = page.getByRole("region", { name: "Now" }).filter({ visible: true });
  // Mid-typing the last boot line is not complete yet; by ~1.5s it is.
  await expect(now).not.toContainText("Human detected.", { timeout: 200 });
  await expect(now).toContainText("Human detected.", { timeout: 3000 });
});

test("every canvas on /life/ is decorative", async ({ page }) => {
  await page.goto("/life/");
  await expect(page.locator("canvas").first()).toBeAttached();
  const unlabelled = await page
    .locator("canvas")
    .evaluateAll((canvases) => canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length);
  expect(unlabelled).toBe(0);
});

test("entering Life through the switch types the readout every time, not only the first", async ({ page }) => {
  await page.goto("/");
  const toggle = () => page.getByRole("switch", { name: "Life" }).filter({ visible: true });
  for (const entry of [1, 2, 3]) {
    await toggle().click();
    await expect(page).toHaveURL(/\/life\/$/);
    const now = page.getByRole("region", { name: "Now" }).filter({ visible: true });
    await expect(now, `entry ${entry} starts typing`).not.toContainText("Human detected.", { timeout: 200 });
    await expect(now, `entry ${entry} finishes`).toContainText("Human detected.", { timeout: 3000 });
    await toggle().click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  }
});

test("the Now block starts at the same left edge as the home bio", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const bio = await page.locator("#identity h1").boundingBox();
  await page.goto("/life/");
  const readout = await page.locator('section[aria-label="Now"] .type-boot').boundingBox();
  expect(Math.abs(bio!.x - readout!.x)).toBeLessThan(1);
});

test("the avatar is the 96px illustration, decorative, at the start of the label column", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/life/");
  const avatar = page.locator('section[aria-label="Now"] picture img');
  await expect(avatar).toHaveAttribute("alt", "");
  await expect(avatar).toHaveAttribute("src", "/images/avatar-192.webp");
  const box = await avatar.boundingBox();
  expect([box!.width, box!.height]).toEqual([96, 96]);
  // The label column starts at the md:px-10 gutter.
  expect(box!.x).toBe(40);
});

test("the readout points agents to onur.md after the boot lines", async ({ page }) => {
  await page.goto("/life/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("Not human? → onur.md");
  await expect(now.getByRole("link", { name: "onur.md" })).toHaveAttribute("href", "/onur.md");
});
