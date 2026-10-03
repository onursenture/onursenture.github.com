import { expect, type Page, test } from "@playwright/test";

type Recorded = { __viewTransitions: string[][] };

// Wraps document.startViewTransition to record each call and, once the
// transition is ready, which pseudo-elements animate and for how long.
async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const calls: string[][] = [];
    (window as unknown as Recorded).__viewTransitions = calls;
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((update: ViewTransitionUpdateCallback) => {
      const transition = start(update);
      const animated: string[] = [];
      calls.push(animated);
      transition.ready.then(
        () => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null;
            if (effect?.pseudoElement) animated.push(`${effect.pseudoElement} ${effect.getTiming().duration}`);
          }
        },
        () => {},
      );
      return transition;
    }) as typeof document.startViewTransition;
  });
}

const recorded = (page: Page) => page.evaluate(() => (window as unknown as Recorded).__viewTransitions);

const viewButton = (page: Page, name: "Site" | "Dashboard") =>
  page.getByRole("group", { name: "View" }).getByRole("button", { name });

test("switching view morphs the nav in one 250ms view transition", async ({ page }) => {
  await recordViewTransitions(page);
  await page.goto("/");
  await viewButton(page, "Dashboard").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await expect.poll(() => recorded(page)).toEqual([
    expect.arrayContaining(["::view-transition-group(shell-nav) 250"]),
  ]);
});

test("navigating between pages starts no view transition", async ({ page }) => {
  await recordViewTransitions(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Life" }).click();
  await expect(page).toHaveURL(/\/life\/$/);
  expect(await recorded(page)).toEqual([]);
});

test.describe("with prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the view switch is instant", async ({ page }) => {
    await recordViewTransitions(page);
    await page.goto("/");
    await viewButton(page, "Dashboard").click();
    await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
    expect(await recorded(page)).toEqual([]);
  });
});
