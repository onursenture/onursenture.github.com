# Sprint 7 follow-ups

## Pre-merge checks for Onur (on the Vercel preview, then production)

1. Preview: the public pages look exactly as before (home, a product page, Life). The admin is not reachable for sign-in on previews (one OAuth callback host); that is expected.
2. After merging (production): sign in at https://onursenture.vercel.app/admin/ with GitHub. Another GitHub account must get "Not allowed".
3. Upload one real 2560×1600 image into a slot, publish, and check the page and its `og:image` (a Blob JPEG URL). This is the first run of Blob mode against a real token: the e2e only covers local media, and the Blob upload route's 401 probe (how the editor tells "signed out" from a failed upload) has never been exercised against Vercel. If the upload fails or says "Signed out" while you are signed in, look here first.
4. Run a CDN check on a published page: `curl -sI https://onursenture.vercel.app/work/nebuu/ | grep -i x-vercel-cache` twice → HIT on the second.
5. Edit a Lab row, publish, and confirm the home updates within a few seconds.

## Deferred

- Version history of publishes, and rollback.
- Cleaning up unreferenced media. A replaced or removed image, and any upload whose draft was never published, stays in Blob and in the `media` table.
- A deleted published block or image id becomes reusable once the deletion is published: ids are locked from the currently published page, so after publish nothing reserves the old id. Old `#anchor` and `?fig=` links could then point at different content. Keeping a tombstone list of retired ids would close it.
- Exporting published content back into the repo (`content/`), for git history.
- After launch (Sprint 8): update the production OAuth app's URLs to onursenture.com.
