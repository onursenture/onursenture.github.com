# Sprint 9 follow-ups

**Before merge (Onur, on the Vercel preview):**

- [ ] The draft copy: "What I'm making, in short." and "Off the clock."
- [ ] The look of the home Notes row, `/notes/` and a note page.

**After merge (production):**

- [ ] The migration ran: the `notes` table exists.
- [ ] A first real note from Onur's phone, with a photo (HEIC conversion).
- [ ] A scheduled note goes live within ~10 minutes of its time.
- [ ] `/feed.xml` validates (W3C feed validator).

**To investigate (production):**

- [ ] On `next start`, after publish-due, `/life/` was seen staying stale (cache HIT without the new note) for 20s+ when a browser had visited `/life/notes/` first; the admin e2e avoids that sequence. Check on production (Vercel) with a real scheduled Life note.

**Controller (Task 13):**

- [ ] Push `publish-notes.yml` and the `sync.yml` warm-up cleanup to `master`, **after** the merge, so the cron never calls a missing endpoint.

**Later:**

- [ ] Bluesky cross-posting.
- [ ] Media cleanup for deleted notes' Blob files.
