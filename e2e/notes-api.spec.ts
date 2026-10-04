import { expect, test } from "@playwright/test";

// The cron endpoint is closed without the sync secret (unset in this run).
test("publish-due refuses a request without the sync secret", async ({ request }) => {
  const response = await request.post("/api/notes/publish-due/");
  expect(response.status()).toBe(401);
});
