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

test("/llms.txt is plain text in the llms.txt shape and links onur.md first", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("text/plain; charset=utf-8");
  const txt = await response.text();
  expect(txt.startsWith("# Onur Senture\n\n> ")).toBe(true);
  expect(txt).toContain("## Profile\n\n- [onur.md](https://onursenture.com/onur.md)");
});

for (const path of ["/", "/life/", "/resume/", "/changelog/"]) {
  test(`${path} links the Markdown profile in <head>`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('head link[rel="alternate"][type="text/markdown"]')).toHaveAttribute("href", "/onur.md");
  });
}
