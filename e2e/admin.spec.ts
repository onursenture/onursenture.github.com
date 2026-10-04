import { expect, test } from "@playwright/test";

test("/admin/ asks a signed-out visitor to sign in with GitHub and is never indexed", async ({ page }) => {
  await page.goto("/admin/");
  const signIn = page.getByRole("link", { name: "Sign in with GitHub" });
  await expect(signIn).toHaveAttribute("href", "/api/auth/signin/?next=%2Fadmin%2F");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { name: "Pages" })).toHaveCount(0);
});

test("robots.txt keeps crawlers out of the admin and the API", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("Disallow: /admin/");
  expect(body).toContain("Disallow: /api/");
});

test("the test sign-in route doesn't exist outside the admin e2e", async ({ request }) => {
  expect((await request.get("/api/auth/test-signin/", { maxRedirects: 0 })).status()).toBe(404);
});

test("sign-in goes to GitHub, or says it isn't configured", async ({ request }) => {
  const response = await request.get("/api/auth/signin/", { maxRedirects: 0 });
  expect([307, 503]).toContain(response.status());
  if (response.status() === 307) expect(response.headers().location).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
});
