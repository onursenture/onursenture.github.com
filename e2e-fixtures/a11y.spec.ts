import { expect, test } from "@playwright/test";
import { auditRoutes } from "../e2e/a11y-routes";
import { expectNoViolations } from "../e2e/axe";
import { fixtureNotes } from "../lib/notes/fixtures";
import { NOTES_PAGE_SIZE, onSide } from "../lib/notes/views";
import { fixturePhotos } from "../lib/photos/fixtures";

const notes = fixtureNotes();
const data = {
  workNoteTid: notes.find((n) => n.side === "work")?.tid,
  lifeNoteTid: notes.find((n) => n.side === "life")?.tid,
  photoSlug: fixturePhotos()[0]?.slug,
  workNotesPage2: onSide(notes, "work").length > NOTES_PAGE_SIZE,
  lifeNotesPage2: onSide(notes, "life").length > NOTES_PAGE_SIZE,
};

// The route list drops a route whose data is missing, so a fixture change
// could silently shrink the audit: fail instead.
test("the fixtures have the data the audit needs", () => {
  expect(data.workNoteTid).toBeTruthy();
  expect(data.lifeNoteTid).toBeTruthy();
  expect(data.photoSlug).toBeTruthy();
});

// Every public route at phone and desktop width, with the recorded fixture data.
for (const { route, path } of auditRoutes(data)) {
  if (!path) continue;
  for (const width of [390, 1440]) {
    test(`axe (fixtures): ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expectNoViolations(page, `${route} at ${width}px`);
    });
  }
}

// A note page sets its own `alternates` canonical; the Markdown alternate link
// lives in the root layout so it still reaches <head> there.
test("a note page still links /onur.md as its Markdown alternate", async ({ page }) => {
  expect(data.workNoteTid).toBeTruthy();
  await page.goto(`/notes/${data.workNoteTid}/`);
  await expect(page.locator('head link[rel="alternate"][type="text/markdown"]')).toHaveAttribute("href", "/onur.md");
});
