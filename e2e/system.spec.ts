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
  // Ratings are numbers in mono, never stars.
  await expect(page.locator('[data-primitive="Rating"]')).toContainText("3.5 · 4");
  await expect(page.locator('[data-primitive="Rating"]')).not.toContainText("\u2605");
  // This run has no database, so every source is never synced.
  const sources = page.locator("section", { has: page.getByRole("heading", { name: "Sources", exact: true }) });
  await expect(sources).toBeVisible();
  await expect(sources.locator("tbody tr")).toHaveCount(5);
  await expect(sources.locator('[data-health="never"]')).toHaveCount(5);
});

test("the Life palette block is dark under the light theme", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "theme", value: "light", url: baseURL! }]);
  await page.goto("/system/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
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
