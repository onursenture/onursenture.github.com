import { expect, test } from "@playwright/test";
import { fixtureNotes } from "../lib/notes/fixtures";
import { canonicalPath } from "../lib/notes/views";

test("/feed.xml carries the notes, newest first, before older photos", async ({ request }) => {
  const xml = await (await request.get("/feed.xml")).text();
  const [newest] = fixtureNotes();
  const first = xml.split("<item>")[1];
  expect(first).toContain(`<link>https://onursenture.com${canonicalPath(newest)}</link>`);
  // The note HTML is escaped once as HTML (the apostrophe becomes &apos;) and again as XML text.
  expect(xml).toContain("Bugün Ankara&amp;apos;da ilk yağmur.");
});

test("/feed.xml carries the fixture photos with their JPEG renditions", async ({ request }) => {
  const xml = await (await request.get("/feed.xml")).text();
  expect(xml).toContain("<link>https://onursenture.com/life/photos/night-boulevard/</link>");
  expect(xml).toContain("https://onursenture.com/images/fixtures/photo-wide-1280.jpg");
});
