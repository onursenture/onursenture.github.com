import { expect, test } from "@playwright/test";

const PRIMITIVES = [
  "MetaLabel",
  "StatusGlyph",
  "Chip",
  "EraStamp",
  "TextLink",
  "Button",
  "Toggle",
  "RelativeTime",
  "LiveClock",
  "Cover",
  "Stat",
  "Panel",
  "DataTable",
  "Band",
  "IndexRow",
  "Empty",
  "Picture",
];

for (const view of ["site", "dashboard"]) {
  test(`/system/ renders every primitive and the type scale in the ${view} view`, async ({ page }) => {
    await page.goto(`/system/?view=${view}`);
    await expect(page.locator("[data-view]")).toHaveAttribute("data-view", view);
    for (const name of PRIMITIVES) {
      await expect(page.locator(`[data-primitive="${name}"]`)).toBeVisible();
    }
    await expect(page.locator("[data-type]")).toHaveCount(17);
  });
}

test("/system/ is not indexed", async ({ page }) => {
  await page.goto("/system/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});
