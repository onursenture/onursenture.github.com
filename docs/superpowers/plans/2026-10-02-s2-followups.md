# S2 Follow-ups

S2 (platform skeleton) is complete and live at https://onursenture.vercel.app (production branch `v2`). The per-task and whole-branch reviews deferred the items below. Each one names the sprint that should pick it up. Items fixed in the final fix wave are not listed.

## Before launch (Sprint 12)

- **Fixture mode guard.** Add a `VERCEL_ENV !== "production"` guard to the `SOURCE_FIXTURES` branch in `lib/sources/read.ts`. Fixture mode is env-gated today, but a misconfigured env would silently mask the database.
- **Sync cadence.** Raise the `isDue` slack to about 30 min and key "due" on `lastSuccessAt`, not `lastAttemptAt`, in `lib/sync/run.ts`. GitHub Actions start jitter currently skips about 1 in 5 hourly runs, and a failure waits a full interval before retrying.
- **Warm-up after a partial failure.** Add `if: ${{ !cancelled() }}` to the "Warm the cache" step in `.github/workflows/sync.yml` (master). Right now a single failing source (HTTP 502) skips the warm-up for every source.
- **CLAUDE.md wording.** Fix the `trailingSlash` line. The real hazard is that `curl` without `-L` does not follow the 308 redirect and still exits 0. The current wording says a POST "doesn't survive" the redirect, which is not the issue.
- **npm audit.** Re-check the dev-only esbuild advisories that come from `drizzle-kit`.
- **Cutover reminders.**
  - Switch the Vercel production branch back to `master`.
  - Remove the Ignored Build Step for master.
  - Disable GitHub Pages after DNS moves.

## S3 (design system and shell)

- **View transition.** S1 wants a View Transition on view switch, but `router.refresh()` returns nothing to await. Use React `<ViewTransition>` with `startTransition`, or Next 16's `experimental.viewTransition`.
- **Where `data-view` lives.** It sits on an inner div (`app/[view]/layout.tsx`), so `dashboard:` cannot style `html` or `body`. Either use `:has()` or move the html shell into `app/[view]/layout.tsx` with `global-not-found`. The 404 page currently renders outside the view layout, with no nav and no toggles.
- **Toggles.**
  - Centralize the cookie attributes, which are duplicated across `proxy.ts` and both toggles.
  - Terminate the theme-cookie regex with `(?:;|$)`.
  - Add `aria-pressed` to the toggles and use consistent labels.
  - Add a `prefers-color-scheme` CSS fallback for visitors without JavaScript.
- **e2e gaps to cover:**
  - paint-timing of the theme
  - theme × view
  - back/forward after a toggle
  - `assertView` not-found
  - invalid `?view=`
- **Dashboard tables.** Add `<thead>`/`<th>` to the dashboard tables.
- **OG defaults.** Add shared OG/Twitter defaults in `app/layout.tsx` (`twitter:card=summary`) and spread them into page metadata. A page-level `openGraph` replaces the parent's instead of merging with it.
- **Photo grid.** Make `sizes` match the actual grid, and use `alt=""` on linked thumbnails.
- **Letterboxd stars.** Derive the star display from `ratingValue`, not from the title regex.
- **Goodreads fixture.** It reuses one shelf for both "Currently reading" and "Read", so rows duplicate in fixture mode. Add a separate currently-reading fixture.
- **Relative times.** Times like "2h ago" must be computed on the client, because pages are prerendered.
- **Adobe Fonts.**
  - Kit domains: `onursenture.com`, `*.vercel.app` previews, `localhost`.
  - Add `preconnect` to `use.typekit.net` and `p.typekit.net`.
  - If a CSP is added, hash `themeScript` (nonces force dynamic rendering).

## S4/S5 (portfolio)

- **Source image size.** `images-src/` commits originals to git. Set a size policy (pre-downscale to about 2× the largest target) or use LFS.
- **Image manifest vs disk.** Add a Vitest that checks the manifest against the files on disk. Renditions are never pruned.
- **Encoder settings.** `IMAGE_SETTINGS` and the encoder literals in `scripts/images.ts` are two sources of truth. Export one `ENCODER_OPTIONS` constant and use it for both when the settings are tuned.

## S7 (admin)

- **Migrations.**
  - The neon-http migrator is not transactional, so use the neon-serverless `Pool` or `drizzle-kit migrate`.
  - Previews do not migrate and share the production DB. Consider a Neon branch per preview.
  - Add a CI drift check: `drizzle-kit generate` followed by `git diff --exit-code`.
- **Sync error handling.**
  - Split persisting from fetching in `syncSource`.
  - A store error currently aborts `syncAll` and returns an unstructured 500. The same applies to `store.get` in the `[source]` route.
- **Server Actions.** Use `updateTag` in Server Actions for read-your-writes.
- **Tests.**
  - Add route-level sync tests: the 503 path, the happy path, and that auth is checked before the DB.
  - Reset the mock in `respond.test.ts`.
  - Type `syncStatusCode` as `200 | 502`.
- **Source health panel.** Surface zod issues in it; `toSourceView` currently drops them.

## S8 (personal layer)

- **GitHub.** Switch to the `contributionLevel` enum for the heatmap; colour matching maps unknown colours to 0. Also surface GraphQL `errors[0].message` instead of a generic ZodError.
- **URL validation.** Validate upstream URLs as http(s) before rendering `og:image` or links.
- **`fetchText` headers.** Handle `Headers` instances and tuple arrays, which are currently dropped by the spread.
- **Goodreads reviews.**
  - `<br>` tags glue paragraphs together; replace them before `.text()`.
  - Add a blurb-only fixture item so the "user_review only" test can actually fail.
- **Instapaper.** The strict number fields make one bad bookmark fail the whole parse.

## Known trade-offs (accepted)

- A source that legitimately drops from N>0 items to 0 is recorded as an error until it is non-empty again. This is the price of the empty-overwrite guard.
- `/api/sync/<id>/` returns 404 before checking auth. Source ids are public.
- Responses vary by cookie without `Vary: Cookie`. This is fine on Vercel; do not put another CDN in front of it.
- Paths containing a dot bypass the proxy. Keep slugs dot-free.
