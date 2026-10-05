import { expect, test } from "@playwright/test";

test("/feed.xml is valid RSS with no items when there are no notes or photos", async ({ request }) => {
  const response = await request.get("/feed.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/rss+xml; charset=utf-8");
  const xml = await response.text();
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).not.toContain("<item>");
});
