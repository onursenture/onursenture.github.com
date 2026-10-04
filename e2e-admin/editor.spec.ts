import { type Page, expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

// The toolbar status. dnd-kit adds its own role="status" element, so the
// selector names the paragraph; Next keeps a route it left mounted but hidden,
// hence :visible.
const status = (page: Page) => page.locator('p[role="status"]:visible').first();

// Drafts are saved only by hand: Save draft (or Cmd/Ctrl+S). Publish saves an
// unsaved edit first, so a test that publishes needs no save of its own.
async function saveDraft(page: Page) {
  await page.getByRole("button", { name: "Save draft" }).click();
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

test("Lab: edits stay unsaved until saved by hand, leaving warns, publish to the home", async ({ page }) => {
  await signIn(page, "/admin/lab/");
  const preview = page.frameLocator('iframe[title="Preview"]').locator("#lab");
  await expect(preview).toBeVisible();
  await page.getByRole("button", { name: "Add entry" }).click();
  const row = page.getByTestId("lab-row").last();
  await row.getByLabel("Title").fill("E2E Lab");
  await row.getByLabel("Description").fill("Added by the admin e2e.");
  await row.getByLabel("Year").fill("2026");

  // No autosave: the edit stays local and the preview keeps the last draft.
  await expect(status(page)).toHaveText("Unsaved changes");
  await expect(page.getByRole("button", { name: "Save draft" })).toBeEnabled();
  await page.waitForTimeout(2000);
  await expect(status(page)).toHaveText("Unsaved changes");
  await expect(preview).not.toContainText("E2E Lab");

  // The shortcut saves, and the preview reloads with the draft.
  await page.keyboard.press("ControlOrMeta+s");
  await expect(status(page)).toContainText("Draft saved", { timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
  await expect(preview).toContainText("E2E Lab");

  // Leaving with an unsaved edit asks first; Cancel stays on the page.
  await row.getByLabel("Description").fill("Edited again by the admin e2e.");
  await expect(status(page)).toHaveText("Unsaved changes");
  const asked = page.waitForEvent("dialog").then(async (dialog) => {
    const message = dialog.message();
    await dialog.dismiss();
    return message;
  });
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Admin" }).click();
  expect(await asked).toBe("You have unsaved changes. Leave without saving?");
  await expect(page).toHaveURL(/\/admin\/lab\/$/);
  await expect(row.getByLabel("Description")).toHaveValue("Edited again by the admin e2e.");

  // Accepting leaves and drops the edit: coming back (in-app, then after a
  // reload) shows the saved draft, with nothing unsaved.
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Admin" }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
  await page.getByRole("link", { name: "Lab", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/lab\/$/);
  const back = page.getByTestId("lab-row").filter({ visible: true }).last();
  await expect(back.getByLabel("Description")).toHaveValue("Added by the admin e2e.");
  await expect(status(page)).not.toHaveText("Unsaved changes");
  await page.reload();
  await expect(page.getByTestId("lab-row").last().getByLabel("Description")).toHaveValue("Added by the admin e2e.");
  await expect(status(page)).toContainText("Draft saved");

  // Cmd/Ctrl+S inside the preview saves too.
  await page.getByTestId("lab-row").last().getByLabel("Description").fill("Edited again by the admin e2e.");
  await page.frameLocator('iframe[title="Preview"]').locator("#lab h2").click();
  await page.keyboard.press("ControlOrMeta+s");
  await expect(status(page)).toContainText("Draft saved", { timeout: 10_000 });
  await expect(preview).toContainText("Edited again by the admin e2e.");

  await publish(page);
  await page.goto("/");
  await expect(page.locator("#lab")).toContainText("E2E Lab");
  await expect(page.locator("#lab")).toContainText("Edited again by the admin e2e.");
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
  // Publish saves the unsaved edits first.
  await publish(page);

  await page.goto("/work/nebuu/");
  await expect(page.getByRole("heading", { name: "E2E notes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Editions" })).toHaveCount(0);
  const ids = await page.locator("main section[id]").evaluateAll((sections) => sections.map((section) => section.id));
  expect(ids.indexOf("e2e-notes")).toBeLessThan(ids.indexOf("highlights"));
  await expect(page.locator('#highlights img[src*="/api/media-dev/media/work/nebuu/cards-"]')).toHaveCount(1);
});

// A cancelable beforeunload, as closing the tab sends: true when the page asks.
const asksBeforeUnload = (page: Page) =>
  page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });

test("Bio: an edit left by Back still warns on close, then publish it to the home", async ({ page }) => {
  await signIn(page, "/admin/");
  await page.getByRole("link", { name: "Bio", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/bio\/$/);
  await page.getByLabel("Lead, continued").fill("Edited by the admin e2e.");
  await expect(status(page)).toHaveText("Unsaved changes");
  expect(await asksBeforeUnload(page)).toBe(true);
  // Back is a soft navigation with no prompt; the edit stays in the hidden
  // editor, so closing the tab still asks, and Forward shows it again.
  await page.goBack();
  await expect(page).toHaveURL(/\/admin\/$/);
  expect(await asksBeforeUnload(page)).toBe(true);
  await page.goForward();
  await expect(page).toHaveURL(/\/admin\/bio\/$/);
  await expect(page.getByLabel("Lead, continued")).toHaveValue("Edited by the admin e2e.");
  await saveDraft(page);
  expect(await asksBeforeUnload(page)).toBe(false);
  await publish(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Edited by the admin e2e.");
});

test("Selected work: move Nebuu up one place", async ({ page }) => {
  await signIn(page, "/admin/");
  await page.locator("li", { has: page.locator('[data-pin="nebuu/game"]') }).getByRole("button", { name: "Move up" }).click();
  await expect(status(page)).toHaveText("Unsaved changes");
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
  await saveDraft(page);
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

test("Gonna: a publish issue names its field, opens its card, and a pin publishes without a note", async ({ page }) => {
  await signIn(page, "/admin/work/gonna/");
  const block = page.locator('[data-block="highlights"]');
  await block.locator("button[aria-expanded]").first().click();
  const card = page.locator('[data-image="gonna-iphone"]');
  await card.locator("button[aria-expanded]").click();
  await card.getByLabel("Pin to Selected work").check();
  await card.getByLabel("Pin title").fill("");
  await expect(card.getByText("One line, optional")).toBeVisible();
  // Close both cards: the banner has to open them again.
  await block.locator("button[aria-expanded]").first().click();
  // Publish saves first, then refuses.
  await page.getByRole("button", { name: "Publish" }).click();

  const banner = page.getByRole("alert").filter({ hasText: "Publishing is blocked:" });
  const issue = banner.getByRole("button", { name: "Gonna › Highlights › Gonna for iPhone › Pin title: is required" });
  await expect(issue).toBeVisible();
  await issue.click();
  const toggle = card.locator("button[aria-expanded]");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toBeFocused();
  await expect(card).toContainText("Pin title: is required");
  // The form column scrolled, not the document.
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(card).toBeInViewport();

  await card.getByLabel("Pin title").fill("Gonna for iPhone");
  // After an edit the banner keeps the label as text, no longer a button.
  const found = page.getByRole("alert").filter({ hasText: "The last publish attempt found:" });
  await expect(found).toContainText("Gonna › Highlights › Gonna for iPhone › Pin title: is required");
  await expect(found.getByRole("button")).toHaveCount(0);
  await saveDraft(page);
  await publish(page);
  await expect(page.getByRole("alert").filter({ hasText: "Gonna for iPhone" })).toHaveCount(0);

  await page.goto("/");
  const item = page.locator("#selected-work li").filter({ hasText: "Gonna for iPhone" });
  await expect(item).toHaveCount(1);
  await expect(item.locator("p.text-fg-muted")).toHaveCount(0);
});
