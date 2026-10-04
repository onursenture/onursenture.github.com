# Sprint 7 follow-ups

## Pre-merge checks for Onur (on the Vercel preview, then production)

0. Before merging: the setup task's accounts and env are in place. The GitHub OAuth App exists with both redirect URIs (production and localhost); `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` and `ADMIN_GITHUB_ID` are set for Production in Vercel, and `ADMIN_GITHUB_ID` is the bare numeric id with no leading or trailing whitespace or newline; a Vercel Blob store is connected to the project for Production (so `BLOB_READ_WRITE_TOKEN` is set there).
1. Preview: the public pages look exactly as before (home, a product page, Life). The admin is not reachable for sign-in on previews (AUTH_* is Production-only); that is expected.
2. After merging (production): the production build log shows `[migrate] done` (the `content_docs` and `media` tables exist). The test sign-in is off in production: `curl -o /dev/null -w '%{http_code}' https://onursenture.vercel.app/api/auth/test-signin/` → `404`.
3. Sign in at https://onursenture.vercel.app/admin/ with GitHub. Another GitHub account must get "Not allowed".
4. Upload one real 2560×1600 image into a slot, publish, and check the page and its `og:image` (a Blob JPEG URL). This is the first run of Blob mode against a real token: the e2e only covers local media, and the Blob upload route's 401 probe (how the editor tells "signed out" from a failed upload) has never been exercised against Vercel. If the upload fails or says "Signed out" while you are signed in, look here first.
5. Run a CDN check on a published page: `curl -sI https://onursenture.vercel.app/work/nebuu/ | grep -i x-vercel-cache` twice → HIT on the second.
6. Edit a Lab row, publish, and confirm the home updates within a few seconds.
7. Cross-client check after that publish: open the home in a different browser (or a private window, signed out) and on a phone on cellular, and confirm both show the new Lab row, so the change reached the CDN and not just your session.

## Deferred

- Version history of publishes, and rollback.
- Cleaning up unreferenced media. A replaced or removed image, and any upload whose draft was never published, stays in Blob and in the `media` table.
- A deleted published block or image id becomes reusable once the deletion is published: ids are locked from the currently published page, so after publish nothing reserves the old id. Old `#anchor` and `?fig=` links could then point at different content. Keeping a tombstone list of retired ids would close it.
- Restore a deleted repo page (no UI): once Delete page removes a repo page from the published `work-index`, the admin has no way to list it again; it takes a manual edit of the `work-index` row.
- Exporting published content back into the repo (`content/`), for git history.
- After launch (Sprint 12): add `https://onursenture.com/api/auth/callback/` to the OAuth app's Redirect URIs and update its homepage URL.
