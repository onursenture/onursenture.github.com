import { expect, test } from "@playwright/test";

// Runs against a build made with SOURCE_FIXTURES=1 (`npm run e2e:fixtures`),
// so every source carries the rows recorded in tests/fixtures/.

test("Life rows show real items from every source", async ({ page }) => {
  await page.goto("/life/");
  const films = page.locator('[data-section="films"]');
  await expect(films.locator("li")).toHaveCount(3);
  await expect(films).toContainText("Love & Other Drugs");
  await expect(films).toContainText("2010");
  await expect(films).not.toContainText("3.5");
  await expect(films).not.toContainText("\u2605");
  const books = page.locator('[data-section="books"]');
  await expect(books).toContainText("Harry Potter and the Deathly Hallows");
  await expect(books).toContainText("Hacı Komünist");
  // Ratings are never rendered: each Read row is a title and an author only.
  for (const title of ["Joseph Müller-Brockman", "Bozkır", "Hacı Komünist"]) {
    await expect(books.locator("li", { hasText: title }).locator("span.type-meta")).toHaveCount(1);
  }
  await expect(books).not.toContainText("\u2605");
  const articles = page.locator('[data-section="articles"]');
  await expect(articles).toContainText("Jurassic Park computers in excruciating detail");
  await expect(articles).toContainText("fabiensanglard.net · 13 min");
  await expect(page.locator('[data-section="writing"]')).toContainText("Second post");
  await expect(page.getByText("Nothing here yet.")).toHaveCount(0);
  await expect(page.locator('[data-section="sync-status"]')).toHaveCount(0);
});

test("the Theatre row and the readout's last play come from the theatre archive", async ({ page }) => {
  await page.goto("/life/");
  const theatre = page.locator('[data-section="theatre"]');
  await expect(theatre.locator("li")).toHaveCount(4);
  await expect(theatre.locator("li").first()).toContainText("Adel Seni Seçti");
  await expect(theatre.locator("li").first()).toContainText("Ankara Devlet Tiyatrosu");
  const order = await page.locator("[data-section]").evaluateAll((els) => els.map((el) => el.getAttribute("data-section")));
  expect(order.slice(0, 4)).toEqual(["films", "books", "theatre", "articles"]);
  await expect(page.getByRole("region", { name: "Now" }).locator("li", { hasText: "last play:" })).toContainText("Adel Seni Seçti");
});

test("Saved on the home shows at most five articles", async ({ page }) => {
  await page.goto("/life/");
  expect(await page.locator('[data-section="articles"] li').count()).toBeLessThanOrEqual(5);
});

test("Books Reading lists every book being read, in compact covers", async ({ page }) => {
  await page.goto("/life/");
  const titles = [
    "Harry Potter and the Deathly Hallows (Harry Potter, #7)",
    "Educated",
    "Mutluluğun Mimarisi",
    "The Design of Everyday Things",
    "Piranesi",
  ];
  const reading = page.locator('[data-section="books"] ul').first();
  await expect(reading.locator("li")).toHaveCount(titles.length);
  for (const title of titles) await expect(reading).toContainText(title);
  // The readout's reading line names every one of them.
  const line = page.getByRole("region", { name: "Now" }).locator("li", { hasText: "reading:" });
  for (const title of titles) await expect(line).toContainText(title);
  // Compact: ten columns at 1440, four at 390, one truncated caption line each.
  for (const [width, columns] of [
    [1440, 10],
    [390, 4],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    const tracks = await reading.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(tracks, `${width}px: columns`).toBe(columns);
    const cover = await reading.locator("li").first().locator("img, span").first().boundingBox();
    expect(cover!.width, `${width}px: cover is small`).toBeLessThanOrEqual(width === 1440 ? 100 : 90);
  }
});

test("the Life photos row is compact", async ({ page }) => {
  for (const [width, columns] of [
    [1440, 10],
    [390, 4],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/life/");
    const row = page.locator('[data-section="photos"] ul').first();
    const tracks = await row.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    expect(tracks, `${width}px: columns`).toBe(columns);
  }
});

test("the readout shows the newest item from each source", async ({ page }) => {
  await page.goto("/life/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("last watched: Love & Other Drugs");
  await expect(now).not.toContainText("3.5");
  await expect(now).toContainText(
    "reading: Harry Potter and the Deathly Hallows (Harry Potter, #7), Educated, Mutluluğun Mimarisi, The Design of Everyday Things, Piranesi",
  );
  await expect(now.getByText(/^reading:/)).toHaveCount(1);
  await expect(now).toContainText("saved: Jurassic Park computers in excruciating detail · fabiensanglard.net · 13 min");
  await expect(now).toContainText("contributions, last 12 months: 7");
  await expect(now).not.toContainText("★");
});

test("a long reading line is one visual line but keeps its full text", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/life/");
    const line = page.getByRole("region", { name: "Now" }).locator("li", { hasText: "reading:" });
    await expect(line).toContainText("The Design of Everyday Things, Piranesi");
    const { cut, height, lineHeight } = await line.evaluate((el) => ({
      cut: el.scrollWidth > el.clientWidth,
      height: el.getBoundingClientRect().height,
      lineHeight: parseFloat(getComputedStyle(el).lineHeight),
    }));
    expect(cut, `${width}px: the line is cut with an ellipsis`).toBe(true);
    expect(height, `${width}px: one line high`).toBeLessThanOrEqual(lineHeight + 1);
  }
});

test("typing the readout in causes no layout jump", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("switch", { name: "Life" }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  // Sample the Now block's height on every frame while the text types in.
  const heights = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = [];
        const start = performance.now();
        const tick = () => {
          const now = [...document.querySelectorAll('section[aria-label="Now"]')].find(
            (el) => (el as HTMLElement).offsetParent !== null,
          );
          if (now) samples.push(now.getBoundingClientRect().height);
          if (performance.now() - start < 2000) requestAnimationFrame(tick);
          else resolve(samples);
        };
        tick();
      }),
  );
  expect(heights.length).toBeGreaterThan(10);
  expect(new Set(heights).size, `heights seen: ${[...new Set(heights)].join(", ")}`).toBe(1);
});
