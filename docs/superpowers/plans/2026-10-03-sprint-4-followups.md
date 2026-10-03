# Sprint 4 Follow-ups

Sprint 4 (visual direction: tokens, Dither Kit, Work home, Life side) is complete on branch `sprint-4`. The final whole-branch review deferred the items below, each labelled with the sprint that should pick it up. Items fixed before merge are not listed. The S3 follow-ups in `2026-10-03-s3-followups.md` still apply where their status section says so.

## Before merge (Onur, on the Vercel preview of `sprint-4`)

- **CDN caching check.** Pages must still be served from the edge. Preview URLs sit behind Vercel Authentication, so add `-H "x-vercel-protection-bypass: $BYPASS"` or use `vercel curl`. There is no view cookie any more.
  ```bash
  U=https://<preview>.vercel.app
  for p in / /life/ /life/photos/stabilo/; do for i in 1 2; do
    curl -sI "$U$p" | grep -iE '^(cache-control|x-vercel-cache|x-matched-path|age):'; echo; done; done
  ```
  It passes when:
  - the second request in each pair is `HIT` or `STALE`;
  - the browser-facing `cache-control` has no `s-maxage`;
  - page hits do not show up as function invocations in the logs.

  If every request is a MISS, wrap the header in `if (!process.env.VERCEL)`.
- **Draft copy.** Confirm or rewrite the lead line, the bio, the placeholder captions, the experience notes and "25+ app templates". Only confirmed facts stay in `content/*.ts`.
- **Org logos.** Approve the monogram fallbacks or supply the logo files (PrimeTek, Orkestra, Bilkent).
- **Portrait.** Supply a photo if wanted: `images-src/portrait.jpg`, then `npm run images`. Without one, the Life side shows the "w00f" dither avatar.
- **Life switch.** Watch the side-change transition and the typing pace with real data (the typing lasts 1.5s whatever the data volume).
- **Copy details.** FIG chip casing (mixed case or uppercase), and whether the label column repeating "Designer who builds" next to the lead is wanted.

## Sprint 5 (Work I)

- Shell e2e: assert an empty nav, and use `exact: true` on the Sources heading, once the first nav item flips to ready. The home e2e check that no section row renders an empty cell holds as long as `sectionLink` returns `undefined` for unready items.
- Stale comments: `page-header` ("display headline") and `/system/` ("S3 review surface").
- `nebuu` (`content/work-index.ts`) and `Nebuu` (`content/experience.ts`) differ in casing.

## Sprint 7 (admin)

- `summarizeHealth` is dead, and so is the DataTable `wrap` prop.
- `SourcesTable` is a client component and does not need to be.
- `/system/` lost its fixture coverage for the Sources synced column.
- `PREFERENCE_COOKIE` is an unused export.

## Sprint 8 (launch)

- `Toggle` and the ghost button use `border-line`, which is low contrast.
- The build-line e2e hard-codes `v2.0.0`.
- `LiveClock` renders `--:--` in the server HTML.
- `PrimaryButton`'s glyph should be `↗` when the booking URL is external.

## Sprint 11 (polish)

- `html[data-side]` hard-codes `#0B0B0C`; the `html` background is set only after hydration (`SideSync`).
- Fonts: Plex Sans 500 is unused, and the font e2e checks only the variable names.
- Dither Kit tests: no `DitherAvatar` colour-override test, the seed test checks only channel 0, no unit tests for the `useTokenColor` paint path, and `getComputedStyle` runs on every snapshot. Tuples are passed by reference. The kit README notes need a pass.
- Life switch: dead transition classes and an unused `group`; the hit target is small; there are no tests for modified clicks or the reduced-motion path.
- `OrgMark` sits slightly low.
- Unit-test gaps on the home.
- E2E: the typing test's timing is tied to data volume, the reduced-motion e2e is near trivial, and the fixtures readout has no photo or writing lines.
- Focus is lost when typing ends.
- `/system/` carries duplicate `life-switch` test ids.
- `app/life/not-found.tsx`: the comment wording.
