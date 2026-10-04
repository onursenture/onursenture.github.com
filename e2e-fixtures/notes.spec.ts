import { expect, test } from "@playwright/test";
import { fixtureNotes } from "../lib/notes/fixtures";
import { onSide } from "../lib/notes/views";

const notes = fixtureNotes();
const work = onSide(notes, "work");
const byId = (n: number) => notes.find((note) => note.id === `fixture-${n}`)!;

test("the home Notes row shows the latest three Work notes, between Selected work and Experience", async ({ page }) => {
  await page.goto("/");
  const ids = await page.locator("main > section").evaluateAll((sections) => sections.map((s) => s.id));
  expect(ids.indexOf("notes")).toBe(ids.indexOf("selected-work") + 1);
  expect(ids.indexOf("experience")).toBe(ids.indexOf("notes") + 1);
  const row = page.locator("#notes");
  await expect(row.getByRole("heading", { name: "Notes", exact: true })).toBeVisible();
  await expect(row.locator("article")).toHaveCount(3);
  await expect(row.locator("article").first()).toContainText("Shipped /resume.pdf.");
  await expect(row.locator("article").nth(1)).toContainText("Notes editor, first pass.");
  await expect(row.locator("article").nth(1).locator("img")).toHaveCount(2);
  await expect(row.locator("article").nth(1)).toContainText("Oct 3, 2026");
  await row.getByRole("link", { name: "All notes" }).click();
  await expect(page).toHaveURL(/\/notes\/$/);
});

test("/notes/ runs by year and pages after 30", async ({ page }) => {
  await page.goto("/notes/");
  await expect(page.getByRole("heading", { name: "2026", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2025", exact: true })).toBeVisible();
  await expect(page.locator("main article")).toHaveCount(30);
  await expect(page.locator("main article").first()).toContainText("Oct 4");
  await page.getByRole("link", { name: "Older notes →" }).click();
  await expect(page).toHaveURL(/\/notes\/page\/2\/$/);
  await expect(page.locator("main:visible article")).toHaveCount(work.length - 30);
  await expect(page.getByRole("link", { name: "← Newer notes" })).toHaveAttribute("href", "/notes/");
});

test("a note page shows the note in full, with its neighbours and metadata", async ({ page }) => {
  const note = byId(2);
  await page.goto(`/notes/${note.tid}/`);
  await expect(page.locator("main article")).toContainText("Notes editor, first pass.");
  await expect(page.locator("main article img")).toHaveCount(2);
  await expect(page.locator("main article img").first()).toHaveAttribute("alt", "A fixture photo");
  await expect(page.locator("main article")).toContainText("Oct 3, 2026 · 14:15");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://onursenture.com/notes/${note.tid}/`);
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /\.jpg$/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.getByRole("link", { name: /^← Shipped \/resume\.pdf/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Good walkthrough.*→$/ })).toBeVisible();
});

test("links, mentions and tags follow Bluesky's rules; a link card links out", async ({ page }) => {
  await page.goto(`/notes/${byId(4).tid}/`);
  const article = page.locator("main article");
  await expect(article.getByRole("link", { name: "@w00f.org" })).toHaveAttribute("href", "https://bsky.app/profile/w00f.org");
  await expect(article.getByRole("link", { name: "#atproto" })).toHaveCount(0);
  await expect(article.getByRole("link", { name: /ATProto, POSSE, and Personal Sites/ })).toHaveAttribute("href", "https://stevedylan.dev/posts/using-atproto-for-posse/");
});

test("a Life-only note has no Work page", async ({ page }) => {
  expect((await page.goto(`/notes/${byId(3).tid}/`))?.status()).toBe(404);
});
