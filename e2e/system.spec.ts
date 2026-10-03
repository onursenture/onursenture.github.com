import { expect, test } from "@playwright/test";

const PRIMITIVES = [
  "DitherStrip",
  "DitherRule",
  "MediaPlaceholder",
  "PrimaryButton",
  "Heatmap",
  "FooterWash",
  "MetaLabel",
  "StatusGlyph",
  "Chip",
  "EraStamp",
  "TextLink",
  "Button",
  "RelativeTime",
  "LiveClock",
  "Cover",
  "DataTable",
  "Empty",
  "Picture",
  "OrgMark",
  "LifeSwitch",
];

test("/system/ renders every primitive, the type scale and the Sources row", async ({ page }) => {
  await page.goto("/system/");
  await expect(page.locator("main")).toHaveCount(1);
  for (const name of PRIMITIVES) {
    await expect(page.locator(`[data-primitive="${name}"]`)).toBeVisible();
  }
  await expect(page.locator("[data-type]")).toHaveCount(6);
  // This run has no database, so every source is never synced.
  const sources = page.locator("section", { has: page.getByRole("heading", { name: "Sources", exact: true }) });
  await expect(sources).toBeVisible();
  await expect(sources.locator("tbody tr")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(5);
});

test("the Life palette block is dark on the light page", async ({ page }) => {
  await page.goto("/system/");
  const palette = page.getByTestId("life-palette");
  await expect(palette).toBeVisible();
  await expect(palette).toHaveCSS("background-color", "rgb(11, 11, 12)");
  await expect(palette.locator("canvas").first()).toBeAttached();
  await expect(palette.locator(".type-boot")).toBeVisible();
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
