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

- [ ] Root cause of the stale `/life/` seen on `next start` after publish-due: a render still in flight when "notes" is revalidated is stored afterwards with a write-time stamp, so Next's tag check treats it as fresh. Mitigated by publish-due's delayed second revalidation (5 s, via `after()`). Still check once on production (Vercel) with a real scheduled note.

**Controller (Task 13):**

- [ ] Push `publish-notes.yml` and the `sync.yml` warm-up cleanup to `master`, **after** the merge, so the cron never calls a missing endpoint.

**Later:**

- [ ] Bluesky cross-posting.
- [ ] Media cleanup for deleted notes' Blob files.
