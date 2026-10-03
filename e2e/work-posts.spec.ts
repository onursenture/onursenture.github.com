import { expect, test } from "@playwright/test";

const POSTS = '[data-view="posts"]';

test("a study with posts has a Posts button that switches to the view", async ({ page }) => {
  await page.goto("/work/primeone/");
  const views = page.getByRole("group", { name: "View" });
  await expect(views.getByRole("button", { name: "Posts" })).toBeVisible();
  await views.getByRole("button", { name: "Posts" }).click();
  await expect(page).toHaveURL(/\/work\/primeone\/\?view=posts$/);
  await expect(page.locator(POSTS)).toBeVisible();
});

test("rows are newest first, with links to the posts on X", async ({ page }) => {
  await page.goto("/work/primeone/?view=posts");
  const rows = page.locator(`${POSTS} li`);
  await expect(rows).toHaveCount(8);
  await expect(rows.first()).toHaveAttribute("id", "post-2013200903923245079");
  await expect(rows.last()).toHaveAttribute("id", "post-1551880003134128128");
  await expect(rows.first()).toContainText("19 Jan");
  await expect(rows.first()).toContainText("@primevue");
  const link = rows.first().getByRole("link", { name: /^post/ });
  await expect(link).toHaveAttribute("href", "https://x.com/primevue/status/2013200903923245079");
  await expect(link).toContainText("↗");
  // Same day: the higher id comes first.
  await expect(page.locator(`${POSTS} li[id^="post-18545"]`).first()).toHaveAttribute("id", "post-1854537901700186303");
});

test("choosing a release chip narrows the posts and writes the tag to the URL", async ({ page }) => {
  await page.goto("/work/primeone/?view=posts");
  const filter = page.getByRole("group", { name: "Filter" });
  await expect(filter.getByRole("button", { name: /^All 8/ })).toHaveAttribute("aria-pressed", "true");
  await filter.getByRole("button", { name: /^3\.0/ }).click();
  await expect(page).toHaveURL(/\?view=posts&tag=3-0$/);
  await expect(page.locator(`${POSTS} li`)).toHaveCount(2);
  await expect(page.getByRole("group", { name: "Density" })).toHaveCount(0);
});

test("a deep link opens the filtered Posts view", async ({ page }) => {
  await page.goto("/work/primeone/?view=posts&tag=4-0");
  await expect(page.locator(`${POSTS} li`)).toHaveCount(2);
  await expect(page.getByRole("group", { name: "Filter" }).getByRole("button", { name: /^4\.0/ })).toHaveAttribute("aria-pressed", "true");
});

test("moving from a posts-only filter to the Grid resets the filter", async ({ page }) => {
  await page.goto("/work/primeone/?view=posts&tag=2-0");
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Grid" }).click();
  await expect(page).toHaveURL(/\/work\/primeone\/\?view=grid$/);
  await expect(page.locator('[data-view="grid"] [data-media]')).not.toHaveCount(0);
});

test("a study without posts falls back to the Log and shows no Posts button", async ({ page }) => {
  await page.goto("/work/primeblocks/?view=posts");
  await expect(page.locator('[data-view="log"]')).toBeVisible();
  await expect(page.locator(POSTS)).toHaveCount(0);
  await expect(page.getByRole("group", { name: "View" }).getByRole("button", { name: "Posts" })).toHaveCount(0);
});

test("the server HTML is still the Log", async ({ request }) => {
  const html = await (await request.get("/work/primeone/?view=posts")).text();
  expect(html).toContain('data-view="log"');
  expect(html).not.toContain('data-view="posts"');
});
