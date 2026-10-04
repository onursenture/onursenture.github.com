import { expect, test } from "@playwright/test";
import { booking, bookingEnabled, calLink, calUrl } from "../content/booking";

const byId = (id: string) => booking.types.find((type) => type.id === id)!;

test.describe("booking set up", () => {
  test.skip(!bookingEnabled(), "booking is not set up in content/booking.ts");

  test("lists the call types and asks cal.com for nothing until one is chosen", async ({ page }) => {
    const calls: string[] = [];
    await page.route("https://app.cal.com/**", (route) => {
      calls.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "text/javascript", body: "/* cal.com stub */" });
    });
    await page.goto("/book/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Book a call.");
    for (const type of booking.types) await expect(page.getByRole("link", { name: `Choose ${type.title}` })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(calls).toEqual([]);

    const project = byId("project");
    await page.getByRole("link", { name: `Choose ${project.title}` }).click();
    await expect(page).toHaveURL(/\/book\/#project$/);
    const region = page.getByRole("region", { name: `Calendar for ${project.title}` });
    await expect(region).toBeVisible();
    await expect(region).toHaveAttribute("data-cal-link", calLink(project));
    await expect(region).toBeFocused();
    await expect.poll(() => calls.some((url) => url.endsWith("/embed/embed.js"))).toBe(true);
    await expect(page.getByRole("link", { name: /Open on cal\.com/ })).toHaveAttribute("href", calUrl(project));
    // The calendar stays in the 480px content column.
    expect((await region.boundingBox())!.width).toBeLessThanOrEqual(480);
  });

  test("a hash opens that type, the fallback stays when cal.com is blocked, and Back leaves the page", async ({ page }) => {
    await page.route("https://app.cal.com/**", (route) => route.abort());
    await page.goto("/");
    await page.goto("/book/#mentoring");
    const mentoring = byId("mentoring");
    await expect(page.getByRole("region", { name: `Calendar for ${mentoring.title}` })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open on cal\.com/ })).toHaveAttribute("href", calUrl(mentoring));
    const role = byId("role");
    await page.getByRole("link", { name: `Choose ${role.title}` }).click();
    await expect(page).toHaveURL(/\/book\/#role$/);
    await page.goBack();
    await expect(page).toHaveURL(/:\d+\/$/);
  });

  test("without JavaScript every row links to cal.com", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/book/");
    for (const type of booking.types) await expect(page.getByRole("link", { name: `Choose ${type.title}` })).toHaveAttribute("href", calUrl(type));
    await context.close();
  });
});

test.describe("booking not set up", () => {
  test.skip(bookingEnabled(), "booking is set up");

  test("/book/ is a 404 and no page links it", async ({ page }) => {
    expect((await page.goto("/book/"))?.status()).toBe(404);
    for (const path of ["/", "/resume/"]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "Book a call" })).toHaveCount(0);
    }
  });
});
