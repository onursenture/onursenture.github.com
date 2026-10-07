import { existsSync, readdirSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import sharp from "sharp";
import { LEAVE_QUESTION } from "../lib/admin/leave-guard";

test.describe.configure({ mode: "serial" });

const MEDIA = ".e2e-admin/media/media/photos";
const files = () => (existsSync(MEDIA) ? readdirSync(MEDIA) : []);

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

// Next keeps a route it left mounted but hidden, hence :visible.
const status = (page: Page) => page.locator('p[role="status"]:visible').first();
const row = (page: Page, text: string) => page.getByTestId("photo-row").filter({ hasText: text });
// The admin's in-page confirmation (a native modal <dialog>, not window.confirm).
const ask = (page: Page) => page.getByRole("dialog");
const breadcrumbAdmin = (page: Page) => page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Admin" });

test("an upload becomes a draft with the EXIF date and camera, and renditions without metadata", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await page.getByLabel("Add photo").setInputFiles(".e2e-admin/fixtures/exif-gps.jpg");
  await expect(status(page)).toHaveText("Draft saved");
  await expect(page.getByLabel("Date")).toHaveValue("2026-08-17");
  await expect(page.getByLabel("Camera")).toHaveValue("Fujifilm X100VI");
  await expect(page.getByText("EXIF", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeDisabled();

  const jpgs = files().filter((file) => file.endsWith(".jpg"));
  expect(jpgs.length).toBeGreaterThan(0);
  for (const file of jpgs) expect((await sharp(`${MEDIA}/${file}`).metadata()).exif, file).toBeUndefined();

  await page.getByLabel("Title").fill("E2E Kızılcıklı akşam");
  await expect(status(page)).toHaveText("Unsaved changes");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(status(page)).toHaveText("Draft saved");
  await page.reload();
  await expect(row(page, "E2E Kızılcıklı akşam")).toContainText("Draft");
});

test("publishing puts the photo on /life/photos/ and in the feed, at a slug from its title", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await row(page, "E2E Kızılcıklı akşam").click();
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(status(page)).toHaveText("Published");
  await expect(row(page, "E2E Kızılcıklı akşam")).toContainText("Live");

  await page.goto("/life/photos/");
  await expect(page.getByRole("link", { name: "E2E Kızılcıklı akşam" })).toHaveAttribute("href", "/life/photos/e2e-kizilcikli-aksam/");
  await page.goto("/life/photos/e2e-kizilcikli-aksam/");
  await expect(page.getByRole("heading", { name: "E2E Kızılcıklı akşam" })).toBeVisible();
  await expect(page.locator("main")).toContainText("Fujifilm X100VI");
  await expect(page.locator("main time")).toHaveAttribute("datetime", "2026-08-17");
  expect(await (await page.request.get("/feed.xml")).text()).toContain("/life/photos/e2e-kizilcikli-aksam/");
});

test("renaming keeps the URL; deleting makes it a 404 and removes the renditions", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await row(page, "E2E Kızılcıklı akşam").click();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await page.getByLabel("Title").fill("E2E renamed");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(status(page)).toHaveText("Saved");
  await page.goto("/life/photos/e2e-kizilcikli-aksam/");
  await expect(page.getByRole("heading", { name: "E2E renamed" })).toBeVisible();

  await signIn(page, "/admin/photos/");
  await row(page, "E2E renamed").click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(ask(page)).toHaveAccessibleName("Delete this photo? This can't be undone.");
  await ask(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(status(page)).toHaveText("Deleted");
  expect(files()).toEqual([]);
  expect((await page.goto("/life/photos/e2e-kizilcikli-aksam/"))?.status()).toBe(404);
});

test("an image under 1280px on the long side is refused", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await page.getByLabel("Add photo").setInputFiles(".e2e-admin/fixtures/small.png");
  await expect(status(page)).toHaveText("Can't upload:");
  await expect(page.getByText("The image is 800×600; photos need at least 1280px on the long side.")).toBeVisible();
  await expect(page.getByTestId("photo-row")).toHaveCount(0);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the whole flow fits a 390px screen", async ({ page }) => {
    await signIn(page, "/admin/photos/");
    await page.getByLabel("Add photo").setInputFiles(".e2e-admin/fixtures/exif-gps.jpg");
    await expect(status(page)).toHaveText("Draft saved");
    await page.getByLabel("Title").fill("E2E phone photo");
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(status(page)).toHaveText("Published");
    await expect(row(page, "E2E phone photo")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the confirmation dialog fits a 375px screen with a 16px gutter", async ({ page }) => {
    await signIn(page, "/admin/photos/");
    await row(page, "E2E phone photo").click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(ask(page)).toBeVisible();
    const box = await ask(page).boundingBox();
    expect(box?.x ?? 0).toBeGreaterThanOrEqual(16);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375 - 16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await ask(page).getByRole("button", { name: "Cancel" }).click();
    await expect(ask(page)).toHaveCount(0);
  });
});

test("a leave confirmation answered Cancel (button, Esc or backdrop) keeps the page and the edit", async ({ page }) => {
  await signIn(page, "/admin/photos/");
  await row(page, "E2E phone photo").click();
  await page.getByLabel("Title").fill("E2E phone photo, edited");
  await expect(status(page)).toHaveText("Unsaved changes");

  // The question opens with focus on Cancel; each way of cancelling stays put.
  await breadcrumbAdmin(page).click();
  await expect(ask(page)).toHaveAccessibleName(LEAVE_QUESTION);
  await expect(ask(page).getByRole("button", { name: "Cancel" })).toBeFocused();
  await ask(page).getByRole("button", { name: "Cancel" }).click();
  await expect(ask(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin\/photos\/$/);
  await expect(page.getByLabel("Title")).toHaveValue("E2E phone photo, edited");

  await breadcrumbAdmin(page).click();
  await expect(ask(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(ask(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin\/photos\/$/);

  await breadcrumbAdmin(page).click();
  await expect(ask(page)).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(ask(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/admin\/photos\/$/);
  await expect(page.getByLabel("Title")).toHaveValue("E2E phone photo, edited");
  await expect(status(page)).toHaveText("Unsaved changes");
});

// Firefox Focus on iOS answers window.confirm with "no" and shows nothing
// (and window.alert with nothing). The admin must not depend on either.
test("with window.confirm answering no, as in Firefox Focus: delete and the leave guard still work", async ({ page }) => {
  await page.addInitScript(() => {
    window.confirm = () => false;
    window.alert = () => {};
  });
  await signIn(page, "/admin/photos/");
  await page.getByLabel("Add photo").setInputFiles(".e2e-admin/fixtures/exif-gps.jpg");
  await expect(status(page)).toHaveText("Draft saved");
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(ask(page)).toHaveAccessibleName("Delete this photo? This can't be undone.");
  await ask(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(status(page)).toHaveText("Deleted");

  await page.getByLabel("Add photo").setInputFiles(".e2e-admin/fixtures/exif-gps.jpg");
  await expect(status(page)).toHaveText("Draft saved");
  await page.getByLabel("Title").fill("E2E focus photo");
  await expect(status(page)).toHaveText("Unsaved changes");
  await breadcrumbAdmin(page).click();
  await expect(ask(page)).toHaveAccessibleName(LEAVE_QUESTION);
  await ask(page).getByRole("button", { name: "Leave" }).click();
  await expect(page).toHaveURL(/\/admin\/$/);
  await expect(ask(page)).toHaveCount(0);

  // Clean up the draft the second upload left behind.
  await page.goto("/admin/photos/");
  await row(page, "Draft").first().click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await ask(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(status(page)).toHaveText("Deleted");
});
