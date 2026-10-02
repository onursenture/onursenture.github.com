import { expect, test } from "@playwright/test";

test("sync rejects requests without the secret", async ({ request }) => {
  const response = await request.post("/api/sync/");
  expect(response.status()).toBe(401);
});

test("sync 404s an unknown source", async ({ request }) => {
  const response = await request.post("/api/sync/nope/");
  expect(response.status()).toBe(404);
});
