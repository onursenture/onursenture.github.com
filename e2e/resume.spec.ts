import { expect, test } from "@playwright/test";
import { bookingEnabled } from "../content/booking";
import { resume } from "../content/resume";

test("the resume shows every section of the repo draft on the site grid, with no header nav", async ({ page }) => {
  await page.goto("/resume/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Onur Senture");
  for (const name of ["Summary", "Experience", "Projects", "Skills", "Education"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Awards" })).toHaveCount(0);
  const experience = page.locator("#experience");
  for (const name of ["Orkestra Studios", "PrimeTek", "Etiya"]) await expect(experience).toContainText(name);
  for (const role of resume.roles) for (const bullet of role.bullets) await expect(experience).toContainText(bullet);
  await expect(experience.getByRole("link", { name: "PrimeOne", exact: true })).toHaveAttribute("href", "/work/primeone/");
  await expect(page.locator("#projects").getByRole("link", { name: "PrimeOne" })).toHaveAttribute("href", "/work/primeone/");
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
});

test("the header links the PDF and, while booking is set up, Book a call, as text links", async ({ page }) => {
  await page.goto("/resume/");
  const header = page.locator("#resume");
  await expect(header.getByRole("link", { name: "Download PDF" })).toHaveAttribute("href", "/resume.pdf");
  const book = header.getByRole("link", { name: "Book a call" });
  if (bookingEnabled()) await expect(book).toHaveAttribute("href", "/book/");
  else await expect(book).toHaveCount(0);
  await expect(header.locator("a[class*='bg-']")).toHaveCount(0);
});

test("the email is a mailto link after hydration and never one string in the HTML", async ({ page, request }) => {
  test.skip(!resume.contact.email, "the repo resume has no email");
  const html = await (await request.get("/resume/")).text();
  expect(html).not.toContain(resume.contact.email);
  await page.goto("/resume/");
  await expect(page.locator("#resume").getByRole("link", { name: resume.contact.email })).toHaveAttribute("href", `mailto:${resume.contact.email}`);
});
