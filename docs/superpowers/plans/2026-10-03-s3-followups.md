# S3 Follow-ups

## Status after Sprint 4

Closed in Sprint 4:
- `TextLink` no longer orphans its arrow (non-breaking space), and its test names say what they check.
- Photo detail "Previous" is "← Previous" (Plex has `←`).
- The title format has one source (`TITLE_TEMPLATE` / `fullTitle` in `lib/metadata.ts`).
- `PageHeader`'s site-branch test is moot: it lost its view branch.
- Closed by removing the dashboard view: the scrolled dashboard to site slide, the cross-tab stale view, the `ViewHistoryGuard` private-API risk, the "Known trade-offs" below, and the dashboard density items under S7.

Moot after Sprint 4 (they only concerned the removed dashboard view): the S7 items for Stat and PanelGrid on `/system/`, the dashboard heatmap at 390px (S8), the panel header counts (S8) and the "dashboard detail" e2e for the photo page (S8). The other items under the old S7 and S8 headings stay open for the sprints that now own them (Sprint 7 admin, Sprint 10 personal layer). "Before merge" is the historical `s3` checklist.

Moved to Sprint 8 (launch), as the Sprint 4 spec §7 names them:
- DataTable at 390px
- the ThemeToggle hydration flash
- 404 titles
- menu dialog tests
- CSP

The sections below keep their original S-numbers from the S3 plan; read them against this status.

S3 (design system and shell) is complete on branch `s3`. The per-task reviews and the final whole-branch review deferred the items below, each labelled with the sprint that should pick it up. Items fixed before merge are not listed. The S2 follow-ups for S3 are all closed except the Adobe kit domains, which are covered under "Before merge" below.

## Before merge (Onur, on the Vercel preview of `s3`)

- **CDN caching check.** `proxy.ts` sends `Cache-Control: public, max-age=0, must-revalidate`, the header Vercel already sends browsers. Confirm on the preview that pages are still served from the edge. Preview URLs sit behind Vercel Authentication, so add `-H "x-vercel-protection-bypass: $BYPASS"` or use `vercel curl`.
  ```bash
  U=https://<preview>.vercel.app
  for v in site dashboard; do for i in 1 2; do
    curl -sI -b "view=$v" "$U/life/" | grep -iE '^(cache-control|x-vercel-cache|x-matched-path|age):'; echo; done; done
  ```
  It passes when:
  - the second request in each pair is `HIT` or `STALE`;
  - the browser-facing `cache-control` has no `s-maxage`;
  - page hits do not show up as function invocations in the logs.

  If every request is a MISS, wrap the header in `if (!process.env.VERCEL)`.
- **Fonts.** In DevTools → Network, check that the Neue Haas files load from `use.typekit.net/af/…` with no Helvetica fallback. The Adobe kit `jgu1ygn` must list `onursenture.com`, `*.vercel.app` and `localhost`.
- **View switch, by hand.** On `/life/`, toggle the view twice, then click home and Life. The shell must always match the toggle.
- **Motion (Onur's call).**
  - When the page is scrolled, a dashboard → site switch slides the page 500–700px during the fade, because Next resets `scrollY`. The untested alternative, `::view-transition-group(.shell-fade) { animation: none }`, would turn the slide into a jump.
  - On a phone, the full-screen menu disappears as soon as the transition starts. It sits in the top layer, so this is inherent.

## S4 (portfolio)

- `TextLink`: keep " →" from orphaning (nbsp); fix the overclaiming button test name.
- `PageHeader`: test its site branch once more site pages use it.
- Photo detail: "Previous" points forward (→). The glyph set has no ←, so drop the glyph on "Previous".
- Title format is duplicated in `pageMetadata` and the root `title.template`.

## S6 (launch)

- **Cross-tab stale view.** Changing the view in another tab leaves this tab in its old view on Back, Forward or a link click. The cause is Next's in-memory segment cache (300s stale time), not HTTP, so the proxy header can't fix it. The toggle also ignores a click on the already-pressed option while out of sync. Fix: a `ViewSync` that compares the rendered view with the cookie on `focus`/`visibilitychange` and on pathname change, then calls `router.refresh()`.
- DataTable at 390px: the scroller needs `tabIndex=0`, `role="region"` and an `aria-label`. Books' Date column still clips.
- `ThemeToggle` shows "Auto" pressed until hydration. Key the pressed fill on `html[data-theme-preference]`.
- 404s: unknown URLs return an empty document until JS runs, and the tab title stays "Onur Senture". Render React 19 `<title>` in both not-found components, and recheck after the next Next upgrade.
- Menu dialog: add tests for backdrop close and link close; lock body scroll.
- Launch checklist: replace the Lab placeholders "Project 02/03" (`placeholder: true`).
- Tokens: no-shadow guard on source only, no type-scale asserts, no light-OS no-JS case, no font-load assert. Also: `crossOrigin` on the `p.typekit.net` preconnect, the render-blocking kit CSS, and the 1px focus ring (AAA).
- CSP: hash `themeScript` when a CSP is added.

## S7 (admin and dashboard polish)

- Fixture e2e never asserts hydrated health. Use `page.clock.setFixedTime`.
- Activity: truncated titles have no `title` attribute.
- At 390px: the third Stat sits alone at half width; stat labels break mid-label ("12 / MO"), so nowrap the "· 12 mo" tail.
- DataTable density: `min-w-24` squeezes titles at 390 (keep `min-w-40` below md). Books Author has no headroom at 1280, so drop `xl:whitespace-nowrap`.
- `/system/`: add PanelGrid, Panel span and a real Cover; replace hardcoded counts; fix nested h2.

## S8 (personal layer)

- Panel header counts are capped sample sizes (Films is always 6, Activity 8). Drop them or label them.
- Heatmap at 390px: scroll to the newest weeks on mount; make the scroller focusable.
- Bare ratings on the site: add `aria-label="Rated 3.5 of 5"` or a visually hidden label.
- Photo detail: date as `<time>` in the dashboard; e2e for previous/next and the dashboard detail; a back link to `/photos/`.

## Known trade-offs (accepted)

- `ViewHistoryGuard` reads Next's private `history.state.__PRIVATE_NEXTJS_INTERNALS_TREE`. A Next upgrade could silently disable it. `e2e/matrix.spec.ts` (Back/Forward after a toggle) would catch that. Recheck on every Next upgrade.
- The two Next behaviours above (stale restore after `router.refresh()`; cookie-blind RSC caching) are upstream issues and could be reported.
