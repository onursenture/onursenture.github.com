import { expect, test } from "@playwright/test";
import { primeonePosts } from "../content/work/posts/primeone";
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

test("the PrimeOne log is newest first and links an entry's @w00f post only", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.locator('[data-view="log"] h2')).toHaveText(primeone.groups.map((group) => group.year));
  const e30 = entry("3-0");
  const overview = byId("overview-3-0");
  const block = page.locator("#entry-3-0");
  await expect(block).toContainText(e30.heading);
  await expect(block).toContainText(`· ${e30.month}`);
  // 3.0's proof post is from @primereact, so the entry shows no link of its own.
  await expect(block.getByRole("link", { name: /^Post on X, 3\.0/ })).toHaveCount(0);
  const kit = page.locator("#entry-kit-2022");
  const post = kit.getByRole("link", { name: `Post on X, ${entry("kit-2022").heading}, ${entry("kit-2022").month} ${entry("kit-2022").year}` });
  await expect(post).toHaveAttribute("href", "https://x.com/w00f/status/1551880003134128128");
  await expect(post).toContainText("post");
  await expect(block.locator('[data-media="overview-3-0"]')).toContainText(`${overview.label} · ${overview.caption}`);
  await expect(block.locator("[data-media]")).toHaveCount(e30.media.length);
});

test("every figure of 3.0 renders in its Log entry, one column wide by default", async ({ page }) => {
  await page.goto("/work/primeone/");
  const e30 = entry("3-0");
  const block = page.locator("#entry-3-0");
  await expect(block.locator("[data-media]")).toHaveCount(e30.media.length);
  for (const item of e30.media) await expect(block.locator(`[data-media="${item.id}"]`)).toBeVisible();
  const grid = block.locator("[data-entry-media]");
  await expect(grid).toHaveAttribute("data-columns", "1");
  await expect(grid).not.toHaveClass(/grid-cols/);
  // One figure per row: every cell shares the same left edge and width.
  const boxes = await block.locator("[data-media]").evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [Math.round(r.left), Math.round(r.width)]));
  expect(new Set(boxes.map(([left]) => left)).size).toBe(1);
  expect(new Set(boxes.map(([, width]) => width)).size).toBe(1);
});

test("a case study has no view bar and no Grid, Index or Posts view", async ({ page }) => {
  await page.goto("/work/primeone/");
  await expect(page.locator('[data-view="log"]')).toBeVisible();
  for (const name of ["View", "Filter", "Density"]) await expect(page.getByRole("group", { name })).toHaveCount(0);
  for (const name of ["Grid", "Index", "Posts", "Log"]) await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
  await expect(page.locator('[data-view="grid"], [data-view="index"], [data-view="posts"]')).toHaveCount(0);
});

test("the old ?view, ?tag and ?density params are ignored: /work/primeone/?view=grid is the Log", async ({ page }) => {
  await page.goto("/work/primeone/?view=grid&tag=tokens&density=inf");
  await expect(page.locator('[data-view="log"]')).toBeVisible();
  await expect(page.locator("#entry-3-0")).toBeVisible();
  await expect(page.locator('[data-view="grid"], [data-density]')).toHaveCount(0);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("the server HTML is the same Log whatever the query", async ({ request }) => {
  const html = await (await request.get("/work/primeone/?view=grid")).text();
  expect(html).toContain('data-view="log"');
  expect(html).not.toContain('data-view="grid"');
});

// Pages with no @w00f post (the index) have no external links at all.
for (const [path, minimum] of [["/work/", 0], ["/work/primeone/", 1], ["/work/templates/", 1], ["/work/archive/", 1]] as const) {
  test(`${path} links out only to @w00f posts`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    const hrefs = await page.locator('main a[href^="http"]').evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href));
    expect(hrefs.length).toBeGreaterThanOrEqual(minimum);
    for (const href of hrefs) expect(href).toMatch(/^https:\/\/(x|twitter)\.com\/w00f\/status\//);
  });
}

test("every case study links out only to @w00f posts", async ({ page }) => {
  for (const [slug] of STUDIES) {
    await page.goto(`/work/${slug}/`);
    const hrefs = await page.locator('main a[href^="http"]').evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href));
    for (const href of hrefs) expect(href, slug).toMatch(/^https:\/\/(x|twitter)\.com\/w00f\/status\//);
  }
});

test("an entry's posts sit under it, oldest first; only @w00f posts are links", async ({ page }) => {
  await page.goto("/work/primeone/");
  const rows = page.locator("#entry-3-0").getByRole("list", { name: "Posts" }).getByRole("listitem");
  const expected = primeonePosts.filter((post) => post.entryId === "3-0").sort((a, b) => a.date.localeCompare(b.date) || (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  await expect(rows).toHaveCount(expected.length);
  await expect(rows.first()).toHaveAttribute("id", `post-${expected[0].id}`);
  await expect(rows.last()).toHaveAttribute("id", `post-${expected[expected.length - 1].id}`);
  for (const post of expected) {
    const row = page.locator(`li#post-${post.id}`);
    await expect(row).toContainText(`@${post.account}`);
    await expect(row).toContainText(post.summary);
    if (post.account === "w00f") {
      const link = row.getByRole("link");
      await expect(link).toHaveAttribute("href", `https://x.com/w00f/status/${post.id}`);
      await expect(link).toHaveAccessibleName(/^Post on X, /);
    } else {
      await expect(row.getByRole("link")).toHaveCount(0);
    }
  }
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
