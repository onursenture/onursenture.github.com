import { expect, test } from "@playwright/test";
import { eras, releases } from "../content/changelog";
import { anchorOf } from "../lib/changelog";

test("/changelog/ lists every release newest first, each at its anchor, then the eras", async ({ page }) => {
  await page.goto("/changelog/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Changelog.");
  const ids = await page.locator("main section[id^='v']").evaluateAll((sections) => sections.map((s) => s.id));
  expect(ids).toEqual(releases.map((r) => anchorOf(r.version)));
  const newest = page.locator(`#${anchorOf(releases[0].version)}`);
  await expect(newest.getByRole("heading", { level: 2 })).toContainText(`v${releases[0].version}`);
  await expect(newest).toContainText(releases[0].title);
  for (const item of releases[0].items) await expect(newest).toContainText(item);
  const earlier = page.locator("#earlier");
  for (const era of eras) await expect(earlier).toContainText(`v${era.major} · ${era.name}`);
  // Scoped to main: the footer gets its own Colophon link in Task 6.
  await expect(page.locator("main").getByRole("link", { name: /Colophon/ })).toHaveAttribute("href", "/colophon/");
});

test("/changelog/ has a description", async ({ page }) => {
  await page.goto("/changelog/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /^Every release of the current site/);
  await expect(page).toHaveTitle("Changelog · Onur Senture");
});
