import { expect, test } from "@playwright/test";
import { fixtureNotes } from "../lib/notes/fixtures";

const notes = fixtureNotes();
const byId = (n: number) => notes.find((note) => note.id === `fixture-${n}`)!;

test("/life/ shows the latest three Life notes above Writing, and a note line in the readout", async ({ page }) => {
  await page.goto("/life/");
  const sections = await page.locator("[data-section]").evaluateAll((els) => els.map((el) => el.getAttribute("data-section")));
  expect(sections.indexOf("notes")).toBe(sections.indexOf("writing") - 1);
  const section = page.locator('[data-section="notes"]');
  await expect(section.locator("article")).toHaveCount(3);
  await expect(section.locator("article").first()).toContainText("Notes editor, first pass.");
  await expect(section.locator('article[lang="tr"]')).toContainText("Bugün Ankara'da ilk yağmur.");
  await expect(section.getByRole("link", { name: "All" })).toHaveAttribute("href", "/life/notes/");
  const now = page.getByRole("region", { name: "Now" });
  await expect(now).toContainText("note: Notes editor, first pass.");
});

test("/life/notes/ lists Life notes; a both-side note's Life page is canonical on Work", async ({ page }) => {
  await page.goto("/life/notes/");
  await expect(page.locator("main article")).toHaveCount(3);
  const both = byId(2);
  await page.goto(`/life/notes/${both.tid}/`);
  await expect(page.locator("main article")).toContainText("Notes editor, first pass.");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://onursenture.com/notes/${both.tid}/`);
  await expect(page.locator('div[data-side="life"]')).toBeVisible();
});

test("a Work-only note has no Life page", async ({ page }) => {
  expect((await page.goto(`/life/notes/${byId(1).tid}/`))?.status()).toBe(404);
});
