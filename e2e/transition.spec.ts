import { expect, type Page, test } from "@playwright/test";

type Call = { animated: string[]; oldEasing: string };
type Recorded = { __viewTransitions: Call[] };

// Wraps document.startViewTransition to record each call and, once the
// transition is ready, which pseudo-elements animate and for how long, plus
// the timing function our CSS gives the outgoing shell. Chromium's default
// duration is also 250ms, so the easing is what proves our rules apply.
async function recordViewTransitions(page: Page) {
  await page.addInitScript(() => {
    const calls: Call[] = [];
    (window as unknown as Recorded).__viewTransitions = calls;
    const start = document.startViewTransition?.bind(document);
    if (!start) return;
    document.startViewTransition = ((update: ViewTransitionUpdateCallback) => {
      const transition = start(update);
      const call: Call = { animated: [], oldEasing: "" };
      calls.push(call);
      transition.ready.then(
        () => {
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null;
            if (effect?.pseudoElement) call.animated.push(`${effect.pseudoElement} ${effect.getTiming().duration}`);
          }
          call.oldEasing = getComputedStyle(document.documentElement, "::view-transition-old(shell)").animationTimingFunction;
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

test("switching view cross-fades the page in one 250ms ease-out view transition", async ({ page }) => {
  await recordViewTransitions(page);
  await page.goto("/");
  await viewButton(page, "Dashboard").click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await expect.poll(() => recorded(page)).toEqual([
    {
      animated: expect.arrayContaining(["::view-transition-old(shell) 250", "::view-transition-new(shell) 250"]),
      oldEasing: "ease-out",
    },
  ]);
  const [call] = await recorded(page);
  expect(call.animated.filter((name) => name.includes("shell-nav"))).toEqual([]);
  // Exactly one transition, even once the animation has finished.
  await page.waitForTimeout(400);
  expect(await recorded(page)).toHaveLength(1);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("switching view from the menu cross-fades the page too", async ({ page }) => {
    await recordViewTransitions(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Menu" }).click();
    await page.getByRole("dialog").getByRole("group", { name: "View" }).getByRole("button", { name: "Dashboard" }).click();
    await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
    await expect.poll(() => recorded(page)).toEqual([
      { animated: expect.arrayContaining(["::view-transition-old(shell) 250", "::view-transition-new(shell) 250"]), oldEasing: "ease-out" },
    ]);
    await page.waitForTimeout(400);
    expect(await recorded(page)).toHaveLength(1);
  });
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
