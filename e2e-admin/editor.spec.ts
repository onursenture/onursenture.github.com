import { type Page, expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

// The toolbar status. dnd-kit adds its own role="status" element, so the
// selector names the paragraph.
const status = (page: Page) => page.locator('p[role="status"]').first();

async function saved(page: Page) {
  await expect(status(page)).toContainText("Draft saved", { timeout: 10_000 });
}

async function publish(page: Page) {
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(status(page)).toContainText("Published", { timeout: 15_000 });
}

test("the admin home lists pages, home documents, Selected work and sources", async ({ page }) => {
  await signIn(page, "/admin/");
  for (const name of ["Pages", "Home", "Selected work", "Sources"]) await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const nebuu = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "Nebuu", exact: true }) });
  await expect(nebuu).toContainText("repo");
  await expect(page.getByText("Database unavailable.")).toBeVisible();
});

test("Lab: add an entry, see it in the preview, publish it to the home", async ({ page }) => {
  await signIn(page, "/admin/lab/");
  await page.getByRole("button", { name: "Add entry" }).click();
  const row = page.getByTestId("lab-row").last();
  await row.getByLabel("Title").fill("E2E Lab");
  await row.getByLabel("Description").fill("Added by the admin e2e.");
  await row.getByLabel("Year").fill("2026");
  await saved(page);
  await expect(page.frameLocator('iframe[title="Preview"]').locator("#lab")).toContainText("E2E Lab");
  await publish(page);
  await page.goto("/");
  await expect(page.locator("#lab")).toContainText("E2E Lab");
});

test("Nebuu: add, move and delete blocks, upload an image, publish", async ({ page }) => {
  page.on("dialog", (dialog) => void dialog.accept());
  await signIn(page, "/admin/work/nebuu/");

  await page.getByRole("button", { name: "+ Text" }).click();
  await page.getByLabel("Heading", { exact: true }).fill("E2E notes");
  await page.getByLabel("Body 1", { exact: true }).fill("Written by the admin e2e.");
  const notes = page.locator("li", { has: page.locator('[data-block="e2e-notes"]') });
  await notes.getByRole("button", { name: "Move up" }).first().click();
  await page.getByRole("button", { name: "Delete block Editions" }).click();

  // Each card's toggle is its only button with aria-expanded (the remove
  // buttons also carry the card's name).
  await page.locator('[data-block="highlights"] button[aria-expanded]').first().click();
  const cards = page.locator('[data-image="cards"]');
  await cards.locator("button[aria-expanded]").click();
  await cards.getByLabel("Upload image").setInputFiles(".e2e-admin/fixtures/four-three.png");
  await expect(cards.getByRole("alert")).toContainText("must be 16:10");
  await cards.getByLabel("Upload image").setInputFiles(".e2e-admin/fixtures/wide.png");
  await expect(cards.locator("img")).toBeVisible({ timeout: 20_000 });
  await saved(page);
  await publish(page);

  await page.goto("/work/nebuu/");
  await expect(page.getByRole("heading", { name: "E2E notes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Editions" })).toHaveCount(0);
  const ids = await page.locator("main section[id]").evaluateAll((sections) => sections.map((section) => section.id));
  expect(ids.indexOf("e2e-notes")).toBeLessThan(ids.indexOf("highlights"));
  await expect(page.locator('#highlights img[src*="/api/media-dev/media/work/nebuu/cards-"]')).toHaveCount(1);
});

test("Bio: edit the lead and publish it to the home", async ({ page }) => {
  await signIn(page, "/admin/bio/");
  await page.getByLabel("Lead, continued").fill("Edited by the admin e2e.");
  await saved(page);
  await publish(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Edited by the admin e2e.");
});

test("Selected work: move Nebuu up one place", async ({ page }) => {
  await signIn(page, "/admin/");
  await page.locator("li", { has: page.locator('[data-pin="nebuu/game"]') }).getByRole("button", { name: "Move up" }).click();
  await saved(page);
  await publish(page);
  await page.goto("/");
  await expect(page.locator("#selected-work li").nth(3)).toContainText("Nebuu");
});

test("New page: create, publish, see it live, then delete it", async ({ page }) => {
  page.on("dialog", (dialog) => void dialog.accept());
  await signIn(page, "/admin/work/new/");
  await page.getByLabel("Title").fill("E2E Page");
  await page.getByLabel("Kind").fill("test page");
  await page.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/admin\/work\/e2e-page\/$/);
  await expect(page.getByText("New page: not on the site until you publish it.")).toBeVisible();
  // Never published: nothing to go back to, so no Discard draft.
  await expect(page.getByRole("button", { name: "Discard draft" })).toHaveCount(0);

  await page.getByLabel("Intro").fill("A page made by the admin e2e.");
  await page.getByLabel("Facts 2 Value").fill("2026");
  await page.locator('[data-block="what-i-did"] button[aria-expanded]').click();
  await page.getByLabel("Body 1", { exact: true }).fill("Built it.");
  await saved(page);
  await publish(page);
  // The publish refreshes the server props: the page is live now.
  await expect(page.getByText("New page: not on the site until you publish it.")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open page ↗" })).toHaveAttribute("href", "/work/e2e-page/");
  await expect(page.getByRole("button", { name: "Discard draft" })).toBeVisible();

  await page.goto("/work/e2e-page/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("E2E Page.");

  await signIn(page, "/admin/work/e2e-page/");
  await page.getByRole("button", { name: "Delete page" }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
  expect((await page.request.get("/work/e2e-page/")).status()).toBe(404);
});

test("the footer offers Edit after sign-in", async ({ page }) => {
  await signIn(page, "/admin/");
  await page.goto("/work/nebuu/");
  await expect(page.locator("footer").getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/admin/work/nebuu/");
});
