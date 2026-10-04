import { revalidateTag } from "next/cache";
import { getNoteStore } from "@/lib/notes/get-store";
import { publishDue } from "@/lib/notes/operations";
import type { NoteStore } from "@/lib/notes/store";
import { NOTES_TAG } from "@/lib/notes/tags";
import { isAuthorized } from "@/lib/sync/auth";

// POST /api/notes/publish-due/: called every 15 minutes by
// .github/workflows/publish-notes.yml (on master) with
// Authorization: Bearer $SYNC_SECRET. Publishes the scheduled notes that are
// due. { expire: 0 } so the warm-up requests right after get the new list,
// not the stale one.
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"), process.env.SYNC_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  let store: NoteStore | null;
  try {
    store = getNoteStore();
  } catch {
    store = null;
  }
  if (!store) return Response.json({ error: "no note store" }, { status: 503 });
  try {
    const published = await publishDue(store, new Date());
    if (published.length > 0) revalidateTag(NOTES_TAG, { expire: 0 });
    return Response.json({ published: published.length });
  } catch (e) {
    console.warn("[notes] publish-due failed:", e instanceof Error ? e.message : e);
    return Response.json({ error: "publishing failed" }, { status: 500 });
  }
}
