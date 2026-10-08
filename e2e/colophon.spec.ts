import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies: Record<string, string> };
const nextMajor = /(\d+)\./.exec(pkg.dependencies.next)?.[1];

test("/colophon/ names the stack with versions from package.json, credits Dither Kit and links the changelog", async ({ page }) => {
  await page.goto("/colophon/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Colophon.");
  for (const label of ["Built", "Stack", "Type", "Texture", "Data", "Source", "Agent", "History"]) {
    await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.locator("#stack")).toContainText(`Next.js ${nextMajor}`);
  await expect(page.getByRole("link", { name: /Dither Kit/ })).toHaveAttribute("href", "https://www.tripwire.sh/dither-kit");
  await expect(page.locator("#history").getByRole("link", { name: /changelog/ })).toHaveAttribute("href", "/changelog/");
  await expect(page.locator("#agent").getByRole("link", { name: /onur\.md/ })).toHaveAttribute("href", "/onur.md");
  await expect(page).toHaveTitle("Colophon · Onur Senture");
});
