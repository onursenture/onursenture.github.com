import { expect, test } from "@playwright/test";
import { resume } from "../content/resume";

test("/onur.md is Markdown with the profile and no email address", async ({ request }) => {
  const response = await request.get("/onur.md");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("text/markdown; charset=utf-8");
  const md = await response.text();
  expect(md.startsWith("# Onur Senture\n")).toBe(true);
  for (const heading of ["## Profile", "## Experience", "## Resume", "## Contact"]) expect(md).toContain(heading);
  expect(md).toContain("https://onursenture.com/resume.pdf");
  if (resume.contact.email) expect(md).not.toContain(resume.contact.email);
  expect(md).not.toContain("mailto:");
});

test("the colophon's onur.md link opens the file", async ({ page }) => {
  await page.goto("/colophon/");
  await page.locator("#agent").getByRole("link", { name: /onur\.md/ }).click();
  await expect(page).toHaveURL(/\/onur\.md$/);
  await expect(page.locator("body")).toContainText("# Onur Senture");
});
