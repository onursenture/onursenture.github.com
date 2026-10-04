# Sprint 9 follow-ups

**Before merge (Onur, on the Vercel preview):**

- [ ] The draft copy: "What I'm making, in short." and "Off the clock."
- [ ] The look of the home Notes row, `/notes/` and a note page.

**After merge (production):**

- [ ] The migration ran: the `notes` table exists.
- [ ] A first real note from Onur's phone, with a photo (HEIC conversion).
- [ ] A scheduled note goes live within ~10 minutes of its time.
- [ ] `/feed.xml` validates (W3C feed validator).

**Resolved, check once on production:**

- [ ] Root cause of the stale `/life/` seen on `next start` after publish-due: a render still in flight when "notes" is revalidated is stored afterwards with a write-time stamp, so Next's tag check treats it as fresh. Known and not mitigated: it is rare in practice (a render of a notes page has to be in flight exactly while the cron revalidates, and the workflow's warm-up requests start after the response), and the worst case is a page keeping the old list until its own revalidate. Still check once on production (Vercel) with a real scheduled note.

**Controller (Task 13):**

- [ ] Push `publish-notes.yml` and the `sync.yml` warm-up cleanup to `master`, **after** the merge, so the cron never calls a missing endpoint.

**Later:**

- [ ] Close the publish-due race: a second revalidation from a separate request (e.g. publish-notes.yml sleeps ~5 s and calls a revalidate-only mode of the endpoint), verified by checking the tags manifest moves.
- [ ] Bluesky cross-posting.
- [ ] Media cleanup for deleted notes' Blob files.
