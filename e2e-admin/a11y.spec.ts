import { type Page, expect, test } from "@playwright/test";
import { expectNoAdminLabelViolations } from "../e2e/axe";

test.describe.configure({ mode: "serial" });

async function signIn(page: Page, next: string) {
  await page.goto(`/api/auth/test-signin/?next=${encodeURIComponent(next)}`);
  await expect(page).toHaveURL(new RegExp(`${next.replaceAll("/", "\\/")}$`));
}

const PAGES = [
  "/admin/",
  "/admin/notes/",
  "/admin/photos/",
  "/admin/bio/",
  "/admin/lab/",
  "/admin/experience/",
  "/admin/resume/",
  "/admin/work/primeone/",
  "/admin/work/new/",
];

test("every admin console page names its controls", async ({ page }) => {
  await signIn(page, "/admin/");
  for (const path of PAGES) {
    await page.goto(path);
    await expect(page.locator("main, [role='main'], body").first()).toBeVisible();
    await expectNoAdminLabelViolations(page, path);
  }
});
