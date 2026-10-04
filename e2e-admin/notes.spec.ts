import { readFileSync, writeFileSync } from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import { LEAVE_QUESTION } from "../lib/admin/leave-guard";
import { notesFileFor } from "../lib/notes/file-store";
import { TID_PATTERN } from "../lib/notes/tid";
import type { Note } from "../lib/notes/types";

test.describe.configure({ mode: "serial" });

const NOTES_FILE = notesFileFor(".e2e-admin/content.json");
const SECRET = "e2e-sync-secret";

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

// The composer's status line. Next keeps a route it left mounted but hidden,
// hence :visible.
const status = (page: Page) => page.locator('p[role="status"]:visible').first();
// A role locator: the Timeline section is also labelled "Notes".
const box = (page: Page) => page.getByRole("textbox", { name: "Note", exact: true });
const row = (page: Page, text: string) => page.getByTestId("note-row").filter({ hasText: text });

async function publishDue(page: Page): Promise<number> {
  const response = await page.request.post("/api/notes/publish-due/", { headers: { Authorization: `Bearer ${SECRET}` } });
  expect(response.status()).toBe(200);
  return ((await response.json()) as { published: number }).published;
}

test("a draft is saved by hand, survives a reload, then publishes to the home and /notes/", async ({ page }) => {
  await signIn(page, "/admin/notes/");
  await box(page).fill("E2E draft note");
  await page.getByRole("radio", { name: "Work" }).click();
  await expect(status(page)).toHaveText("Unsaved changes");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(status(page)).toHaveText("Draft saved");

  await page.reload();
  await expect(row(page, "E2E draft note")).toContainText("Draft");
  await row(page, "E2E draft note").click();
  await expect(box(page)).toHaveValue("E2E draft note");
  await box(page).fill("E2E published note, see w00f.org");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(status(page)).toHaveText("Published");
  await expect(box(page)).toHaveValue("");

  await page.goto("/");
  await expect(page.locator("#notes article").first()).toContainText("E2E published note");
  await expect(page.locator("#notes article").first().getByRole("link", { name: "w00f.org" })).toHaveAttribute("href", "https://w00f.org");
  await page.goto("/notes/");
  await page.locator("main article").first().locator("time").click();
  await expect(page).toHaveURL(/\/notes\/[2-7a-z]{13}\/$/);
  expect(page.url().split("/").at(-2)).toMatch(TID_PATTERN);
});

test("editing a published note keeps its URL; deleting it makes the URL a 404", async ({ page }) => {
  await page.goto("/notes/");
  await page.locator("main article").first().locator("time").click();
  await expect(page).toHaveURL(/\/notes\/[2-7a-z]{13}\/$/);
  const url = page.url();

  await signIn(page, "/admin/notes/");
  await page.getByRole("button", { name: "Published", exact: true }).click();
  await row(page, "E2E published note").click();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await box(page).fill("E2E edited note");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(status(page)).toHaveText("Saved");

  await page.goto(url);
  await expect(page.locator("main article")).toContainText("E2E edited note");

  await signIn(page, "/admin/notes/");
  await row(page, "E2E edited note").click();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(status(page)).toHaveText("Deleted");
  expect((await page.goto(url))?.status()).toBe(404);
});

test("a scheduled Life note goes live only when publish-due runs after its time", async ({ page }) => {
  await signIn(page, "/admin/notes/");
  await box(page).fill("E2E scheduled note");
  await page.getByRole("radio", { name: "Life" }).click();
  await page.getByLabel("Schedule", { exact: true }).check();
  await expect(page.getByLabel("Time")).toHaveValue(/^\d{2}:(00|15|30|45)$/);
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(status(page)).toHaveText("Scheduled");
  await page.getByRole("button", { name: "Scheduled", exact: true }).click();
  await expect(row(page, "E2E scheduled note")).toContainText(/\d{2}:\d{2}/);

  expect(await publishDue(page)).toBe(0);
  // Wait for the /life/ prefetch from this page to finish: a render still in
  // flight when publish-due revalidates "notes" is stored afterwards and looks
  // fresh to Next's tag check (stamped at write time), so /life/ would keep the
  // old list. publish-due's delayed second revalidation covers that in
  // production; the test waits so it doesn't depend on that delay.
  await page.goto("/life/notes/", { waitUntil: "networkidle" });
  await expect(page.locator("main")).not.toContainText("E2E scheduled note");

  // Move it into the past, as if its quarter hour had come.
  const data = JSON.parse(readFileSync(NOTES_FILE, "utf8")) as { notes: Record<string, Note> };
  const note = Object.values(data.notes).find((n) => n.text === "E2E scheduled note")!;
  note.publishAt = new Date(Date.now() - 60_000).toISOString();
  writeFileSync(NOTES_FILE, JSON.stringify(data, null, 2));

  expect(await publishDue(page)).toBe(1);
  await page.goto("/life/notes/");
  await expect(page.locator("main article").first()).toContainText("E2E scheduled note");
  await page.goto("/life/");
  await expect(page.getByRole("region", { name: "Now" })).toContainText("note: E2E scheduled note");
  expect(await publishDue(page)).toBe(0);
});

test("an image needs alt text to publish; a link card replaces images after a confirm", async ({ page }) => {
  await signIn(page, "/admin/notes/");
  await box(page).fill("E2E image note");
  await page.getByRole("radio", { name: "Work" }).click();
  await page.getByLabel("Add images").setInputFiles(".e2e-admin/fixtures/four-three.png");
  await expect(page.getByLabel("Alt text 1")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(status(page)).toHaveText("Can't publish yet:");
  await expect(page.getByText("Image 1 needs alt text.")).toBeVisible();

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Link", exact: true }).click();
  await expect(page.getByLabel("Alt text 1")).toHaveCount(0);
  await page.getByLabel("Link URL").fill("https://example.com/");
  await page.getByRole("button", { name: "Fetch card" }).click();
  await expect(page.getByRole("button", { name: "Remove link" })).toBeVisible({ timeout: 15_000 });

  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByLabel("Add images").setInputFiles(".e2e-admin/fixtures/four-three.png");
  await page.getByLabel("Alt text 1").fill("A blue square");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(status(page)).toHaveText("Published");
  await page.goto("/notes/");
  await expect(page.locator("main article").first().locator("img")).toHaveAttribute("alt", "A blue square");
});

test("leaving with an unsaved note asks first", async ({ page }) => {
  await signIn(page, "/admin/notes/");
  await box(page).fill("E2E unsaved");
  const asked = page.waitForEvent("dialog").then(async (dialog) => {
    const message = dialog.message();
    await dialog.dismiss();
    return message;
  });
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Admin" }).click();
  expect(await asked).toBe(LEAVE_QUESTION);
  await expect(page).toHaveURL(/\/admin\/notes\/$/);
  await expect(box(page)).toHaveValue("E2E unsaved");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("composes, uploads and publishes without sideways scrolling", async ({ page }) => {
    await signIn(page, "/admin/notes/");
    await box(page).fill("E2E phone note");
    await page.getByRole("radio", { name: "Both" }).click();
    await page.getByLabel("Add images").setInputFiles(".e2e-admin/fixtures/four-three.png");
    await page.getByLabel("Alt text 1").fill("From the phone run");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    const rowBox = await page.getByTestId("note-row").first().boundingBox();
    expect(rowBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: "Publish", exact: true }).click();
    await expect(status(page)).toHaveText("Published");
    await page.goto("/life/notes/");
    await expect(page.locator("main article").first()).toContainText("E2E phone note");
  });
});
