import { expect, test } from "@playwright/test";

const PRIMITIVES = [
  "DitherStrip",
  "DitherRule",
  "MediaPlaceholder",
  "PrimaryButton",
  "LabAvatar",
  "ContributionChart",
  "FooterWash",
  "MetaLabel",
  "StatusGlyph",
  "Chip",
  "EraStamp",
  "TextLink",
  "Button",
  "Toggle",
  "RelativeTime",
  "LiveClock",
  "Rating",
  "Cover",
  "DataTable",
  "Empty",
  "Picture",
];

test("/system/ renders every primitive, the type scale and the Sources band", async ({ page }) => {
  await page.goto("/system/");
  await expect(page.locator("main")).toHaveCount(1);
  for (const name of PRIMITIVES) {
    await expect(page.locator(`[data-primitive="${name}"]`)).toBeVisible();
  }
  await expect(page.locator("[data-type]")).toHaveCount(6);
  // Ratings are numbers in mono, never stars.
  await expect(page.locator('[data-primitive="Rating"]')).toContainText("3.5 · 4");
  await expect(page.locator('[data-primitive="Rating"]')).not.toContainText("\u2605");
  // This run has no database, so every source is never synced.
  const sources = page.locator("section", { has: page.getByRole("heading", { name: "Sources" }) });
  await expect(sources).toBeVisible();
  await expect(sources.locator("tbody tr")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(5);
});

test("every canvas on /system/ is decorative", async ({ page }) => {
  await page.goto("/system/");
  await expect(page.locator("canvas").first()).toBeAttached();
  const unlabelled = await page.locator("canvas").evaluateAll((canvases) =>
    canvases.filter((c) => !c.closest('[aria-hidden="true"]')).length,
  );
  expect(unlabelled).toBe(0);
});

test("/system/ is not indexed", async ({ page }) => {
  await page.goto("/system/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});
