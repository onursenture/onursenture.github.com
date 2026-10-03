import { expect, test } from "@playwright/test";
import { primeonePosts } from "../content/work/posts/primeone";
import { templatesPosts } from "../content/work/posts/templates";

const POSTS = '[data-view="posts"]';

// The expected rows come from the data, so growing the content never breaks these.
const total = primeonePosts.length;
const count = (entryId: string) => primeonePosts.filter((post) => post.entryId === entryId).length;
const newestFirst = [...primeonePosts].sort((a, b) => (a.date === b.date ? (BigInt(a.id) < BigInt(b.id) ? 1 : -1) : a.date < b.date ? 1 : -1));
const first = newestFirst[0];
const last = newestFirst[newestFirst.length - 1];

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
  await expect(rows).toHaveCount(total);
  await expect(rows.first()).toHaveAttribute("id", `post-${first.id}`);
  await expect(rows.last()).toHaveAttribute("id", `post-${last.id}`);
  await expect(rows.first()).toContainText(`@${first.account}`);
  const link = rows.first().getByRole("link", { name: /^Post on X, / });
  await expect(link).toHaveAttribute("href", `https://x.com/${first.account}/status/${first.id}`);
  await expect(link).toHaveAccessibleName(/^Post on X, \d{1,2} [A-Z][a-z]{2} \d{4}, @/);
  await expect(link).toContainText("post");
  await expect(link).toContainText("↗");
  // The names differ per row (day, year and account), not just "post".
  const names = await rows.getByRole("link", { name: /^Post on X, / }).evaluateAll((els) => els.map((el) => el.getAttribute("aria-label")));
  expect(new Set(names).size).toBe(new Set(primeonePosts.map((post) => `${post.date}${post.account}`)).size);
  // Same day: the higher id comes first.
  await expect(page.locator(`${POSTS} li[id^="post-18545"]`).first()).toHaveAttribute("id", "post-1854537901700186303");
});

test("choosing a release chip narrows the posts and writes the tag to the URL", async ({ page }) => {
  await page.goto("/work/primeone/?view=posts");
  const filter = page.getByRole("group", { name: "Filter" });
  await expect(filter.getByRole("button", { name: new RegExp(`^All ${total}`) })).toHaveAttribute("aria-pressed", "true");
  await filter.getByRole("button", { name: /^3\.0/ }).click();
  await expect(page).toHaveURL(/\?view=posts&tag=3-0$/);
  await expect(page.locator(`${POSTS} li`)).toHaveCount(count("3-0"));
  await expect(page.getByRole("group", { name: "Density" })).toHaveCount(0);
});

test("a deep link opens the filtered Posts view", async ({ page }) => {
  await page.goto("/work/primeone/?view=posts&tag=4-0");
  await expect(page.locator(`${POSTS} li`)).toHaveCount(count("4-0"));
  await expect(page.getByRole("group", { name: "Filter" }).getByRole("button", { name: /^4\.0/ })).toHaveAttribute("aria-pressed", "true");
});

test("moving from a posts-only filter to the Grid resets the filter", async ({ page }) => {
  // PrimeBlocks 3.0 has posts but no figures, so its chip only filters Posts.
  await page.goto("/work/primeblocks/?view=posts&tag=3-0");
  await page.getByRole("group", { name: "View" }).getByRole("button", { name: "Grid" }).click();
  await expect(page).toHaveURL(/\/work\/primeblocks\/\?view=grid$/);
  await expect(page.locator('[data-view="grid"] [data-media]')).not.toHaveCount(0);
});

test("the server HTML is still the Log", async ({ request }) => {
  const html = await (await request.get("/work/primeone/?view=posts")).text();
  expect(html).toContain('data-view="log"');
  expect(html).not.toContain('data-view="posts"');
});

test("the Diamond chip on Templates shows only Diamond posts", async ({ page }) => {
  await page.goto("/work/templates/?view=posts&tag=diamond");
  const rows = page.locator(`${POSTS} li`);
  const diamond = templatesPosts.filter((post) => post.entryId === "diamond");
  expect(diamond.length).toBeGreaterThanOrEqual(2);
  await expect(rows).toHaveCount(diamond.length);
  const ids = diamond.map((post) => `post-${post.id}`);
  for (const row of await rows.all()) expect(ids).toContain(await row.getAttribute("id"));
  const hrefs = await rows.getByRole("link", { name: /^Post on X, / }).evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href));
  for (const href of hrefs) expect(diamond.map((post) => post.id)).toContain(href.split("/status/")[1]);
  await expect(page.getByRole("group", { name: "Filter" }).getByRole("button", { name: /^Diamond \d/ })).toHaveAttribute("aria-pressed", "true");
});
