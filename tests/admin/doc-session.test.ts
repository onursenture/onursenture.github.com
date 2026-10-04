import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type DocActions, DocSession } from "@/lib/admin/doc-session";
import type { ActionResult, DocEditorInit } from "@/lib/admin/results";

// The repo has no DOM test environment, so the editing rules live in
// DocSession (no React) and are tested here; use-doc-editor.ts only binds it.

function deferred<R>() {
  let resolve!: (value: R) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<R>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const init: DocEditorInit<string> = { docKey: "lab", value: "v0", draftUpdatedAt: null, hasDraft: false, publishedAt: null, available: true };
const saved = (n: number): ActionResult<{ draftUpdatedAt: string }> => ({ status: "ok", draftUpdatedAt: `t${n}` });

function setup(start: Partial<DocEditorInit<string>> = {}) {
  let n = 0;
  const actions = {
    save: vi.fn(async () => saved(++n)),
    publish: vi.fn(async (): Promise<ActionResult<{ publishedAt: string }>> => ({ status: "ok", publishedAt: "p1" })),
    discard: vi.fn(async (): Promise<ActionResult> => ({ status: "ok" })),
    reset: vi.fn(async (): Promise<ActionResult> => ({ status: "ok" })),
  };
  return { actions, session: new DocSession<string>({ ...init, ...start }, actions satisfies DocActions) };
}

const edit = (session: DocSession<string>, value: string) => session.setValue(() => value);

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

// Long enough for any timer the session might have scheduled (it has none).
const LONG = 60_000;

describe("manual save", () => {
  it("writes nothing until save(), then saves the latest value and bumps the preview", async () => {
    const { actions, session } = setup();
    edit(session, "a");
    edit(session, "b");
    await vi.advanceTimersByTimeAsync(LONG);
    expect(actions.save).not.toHaveBeenCalled();
    expect(session.getSnapshot()).toMatchObject({ status: "dirty", previewVersion: 0, canSave: true });
    expect(session.hasUnsaved).toBe(true);
    await session.save();
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.save).toHaveBeenCalledWith("lab", "b", null);
    expect(session.getSnapshot()).toMatchObject({ status: "saved", hasDraft: true, savedAt: "t1", previewVersion: 1, canSave: false });
    expect(session.hasUnsaved).toBe(false);
  });

  it("has nothing to save before an edit", async () => {
    const { actions, session } = setup();
    expect(session.getSnapshot().canSave).toBe(false);
    await session.save();
    expect(actions.save).not.toHaveBeenCalled();
  });

  it("counts a save in flight as unsaved, and can't save again until it lands", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    const done = session.save();
    await vi.advanceTimersByTimeAsync(0);
    expect(session.getSnapshot()).toMatchObject({ status: "saving", canSave: false });
    expect(session.hasUnsaved).toBe(true);
    first.resolve(saved(1));
    await done;
    expect(session.hasUnsaved).toBe(false);
  });

  it("keeps an edit made during a save unsaved, and saves it next with the new expected time", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    const done = session.save();
    await vi.advanceTimersByTimeAsync(0);
    edit(session, "b");
    expect(session.getSnapshot().canSave).toBe(false);
    first.resolve(saved(1));
    await done;
    expect(session.getSnapshot()).toMatchObject({ status: "dirty", value: "b", canSave: true, previewVersion: 1 });
    expect(session.hasUnsaved).toBe(true);
    await vi.advanceTimersByTimeAsync(LONG);
    expect(actions.save).toHaveBeenCalledTimes(1);
    await session.save();
    expect(actions.save).toHaveBeenNthCalledWith(2, "lab", "b", "t1");
    expect(session.getSnapshot()).toMatchObject({ status: "saved", previewVersion: 2 });
  });

  it("returns the queued save to a second press instead of queueing another", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    const one = session.save();
    const two = session.save();
    expect(two).toBe(one);
    first.resolve(saved(1));
    await two;
    expect(actions.save).toHaveBeenCalledTimes(1);
  });

  it("can't save while a publish, discard or reset is in flight, even after an edit", async () => {
    const release = deferred<ActionResult<{ publishedAt: string }>>();
    const { actions, session } = setup();
    actions.publish.mockImplementationOnce(() => release.promise);
    edit(session, "a");
    const done = session.publish();
    await vi.advanceTimersByTimeAsync(0);
    edit(session, "b");
    expect(session.getSnapshot().canSave).toBe(false);
    release.resolve({ status: "ok", publishedAt: "p1" });
    await done;
    expect(session.getSnapshot().canSave).toBe(true);

    const discarding = deferred<ActionResult>();
    actions.discard.mockImplementationOnce(() => discarding.promise);
    const discard = session.discard();
    edit(session, "c");
    expect(session.getSnapshot().canSave).toBe(false);
    discarding.resolve({ status: "unavailable" });
    await discard;
    expect(session.getSnapshot().canSave).toBe(true);
  });
});

describe("leaving without saving", () => {
  it("abandon() goes back to the init value and leaves nothing unsaved or written", async () => {
    const { actions, session } = setup();
    edit(session, "a");
    session.abandon();
    expect(session.getSnapshot()).toMatchObject({ value: "v0", status: "idle", canSave: false, canPublish: false });
    expect(session.hasUnsaved).toBe(false);
    await session.save();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(actions.save).not.toHaveBeenCalled();
  });

  it("abandon() goes back to the last saved draft, so a later publish can't carry the dropped edit", async () => {
    const { actions, session } = setup();
    edit(session, "a");
    await session.save();
    edit(session, "b");
    session.abandon();
    expect(session.getSnapshot()).toMatchObject({ value: "a", hasDraft: true, canSave: false });
    await session.publish();
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.save).toHaveBeenCalledWith("lab", "a", null);
    expect(actions.publish).toHaveBeenCalledWith("lab", "t1");
  });

  it("shows the stored value when a save in flight lands after abandon()", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    const done = session.save();
    await vi.advanceTimersByTimeAsync(0);
    session.abandon();
    expect(session.hasUnsaved).toBe(true);
    first.resolve(saved(1));
    await done;
    expect(session.getSnapshot()).toMatchObject({ value: "a", status: "saved" });
    expect(session.hasUnsaved).toBe(false);
  });

  it("idle() waits for a save in flight and writes no unsaved edit", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    void session.save();
    await vi.advanceTimersByTimeAsync(0);
    edit(session, "b");
    let settled = false;
    const waiting = session.idle().then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    first.resolve(saved(1));
    await waiting;
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(session.hasUnsaved).toBe(true);
  });
});

describe("a failed save", () => {
  it("keeps the edit unsaved after a dropped network, with no retry, until saved again", async () => {
    const { actions, session } = setup();
    actions.save.mockRejectedValueOnce(new Error("offline"));
    edit(session, "a");
    await session.save();
    expect(session.getSnapshot()).toMatchObject({ status: "offline", blocked: false, canSave: true, previewVersion: 0 });
    expect(session.hasUnsaved).toBe(true);
    await vi.advanceTimersByTimeAsync(LONG);
    expect(actions.save).toHaveBeenCalledTimes(1);
    await session.save();
    expect(actions.save).toHaveBeenCalledTimes(2);
    expect(session.getSnapshot()).toMatchObject({ status: "saved", hasDraft: true });
    expect(session.hasUnsaved).toBe(false);
  });

  it("treats a database error mid-session like the network: unsaved, not retried, not blocking", async () => {
    const { actions, session } = setup();
    actions.save.mockResolvedValueOnce({ status: "unavailable" });
    edit(session, "a");
    await session.save();
    expect(session.getSnapshot()).toMatchObject({ status: "unavailable", blocked: false, canSave: true });
    expect(session.hasUnsaved).toBe(true);
    await vi.advanceTimersByTimeAsync(LONG);
    expect(actions.save).toHaveBeenCalledTimes(1);
    edit(session, "b");
    await session.save();
    expect(actions.save).toHaveBeenLastCalledWith("lab", "b", null);
    expect(session.getSnapshot()).toMatchObject({ status: "saved", hasDraft: true });
    expect(session.hasUnsaved).toBe(false);
  });

  it("blocks on a conflict and writes nothing more", async () => {
    const { actions, session } = setup();
    actions.save.mockResolvedValueOnce({ status: "conflict" });
    edit(session, "a");
    await session.save();
    expect(session.getSnapshot()).toMatchObject({ status: "conflict", blocked: true, canSave: false, canPublish: false });
    edit(session, "b");
    await session.save();
    await session.publish();
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.publish).not.toHaveBeenCalled();
    expect(session.hasUnsaved).toBe(true);
  });

  it("blocks when signed out", async () => {
    const { actions, session } = setup();
    actions.save.mockResolvedValueOnce({ status: "unauthorized" });
    edit(session, "a");
    await session.save();
    expect(session.getSnapshot()).toMatchObject({ status: "signed-out", blocked: true, canSave: false });
    edit(session, "b");
    await session.save();
    expect(actions.save).toHaveBeenCalledTimes(1);
  });

  it("stays blocked when there was no database from the start", async () => {
    const { actions, session } = setup({ available: false });
    expect(session.getSnapshot()).toMatchObject({ status: "unavailable", blocked: true, canSave: false, canPublish: false });
    edit(session, "a");
    expect(session.getSnapshot().canSave).toBe(false);
    await session.save();
    expect(actions.save).not.toHaveBeenCalled();
    expect(session.hasUnsaved).toBe(true);
    await session.publish();
    expect(actions.publish).not.toHaveBeenCalled();
  });

  it("does not publish an edit that failed to save", async () => {
    const { actions, session } = setup();
    actions.save.mockRejectedValue(new Error("offline"));
    edit(session, "a");
    await session.publish();
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.publish).not.toHaveBeenCalled();
    expect(session.getSnapshot().status).toBe("offline");
    expect(session.hasUnsaved).toBe(true);
  });

  it("does not publish after a save that came back invalid", async () => {
    const { actions, session } = setup();
    actions.save.mockResolvedValueOnce({ status: "invalid", issues: [{ doc: "lab", at: "", message: "too large" }] });
    edit(session, "a");
    await session.publish();
    expect(actions.publish).not.toHaveBeenCalled();
    expect(session.getSnapshot().status).toBe("invalid");
  });
});

describe("publish", () => {
  it("publishes the draft time of a draft saved by hand", async () => {
    const { actions, session } = setup();
    edit(session, "a");
    await session.save();
    await session.publish();
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.publish).toHaveBeenCalledWith("lab", "t1");
    expect(session.getSnapshot()).toMatchObject({ status: "published", hasDraft: false, savedAt: null, publishedAt: "p1", issues: [] });
  });

  it("saves unsaved changes first, then publishes the draft time it saved", async () => {
    const { actions, session } = setup();
    edit(session, "a");
    expect(session.getSnapshot().canPublish).toBe(true);
    await session.publish();
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.save).toHaveBeenCalledWith("lab", "a", null);
    expect(actions.publish).toHaveBeenCalledWith("lab", "t1");
    expect(session.getSnapshot()).toMatchObject({ status: "published", hasDraft: false, savedAt: null, publishedAt: "p1", issues: [] });
    expect(session.hasUnsaved).toBe(false);
  });

  it("waits for a save in flight", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    void session.save();
    const done = session.publish();
    await vi.advanceTimersByTimeAsync(0);
    expect(actions.publish).not.toHaveBeenCalled();
    first.resolve(saved(1));
    await done;
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.publish).toHaveBeenCalledWith("lab", "t1");
  });

  it("ends dirty, not published, when an edit arrives mid-publish, and keeps it for the next save", async () => {
    const release = deferred<ActionResult<{ publishedAt: string }>>();
    const { actions, session } = setup();
    actions.publish.mockImplementationOnce(() => release.promise);
    edit(session, "a");
    const done = session.publish();
    await vi.advanceTimersByTimeAsync(0);
    expect(session.getSnapshot().status).toBe("publishing");
    edit(session, "b");
    release.resolve({ status: "ok", publishedAt: "p1" });
    await done;
    expect(session.getSnapshot()).toMatchObject({ status: "dirty", hasDraft: true, publishedAt: "p1", value: "b", canSave: true });
    await vi.advanceTimersByTimeAsync(LONG);
    expect(actions.save).toHaveBeenCalledTimes(1);
    await session.save();
    expect(actions.save).toHaveBeenLastCalledWith("lab", "b", null);
    expect(session.getSnapshot().status).toBe("saved");
  });

  it("blocks the editor on a conflict and writes nothing more", async () => {
    const { actions, session } = setup();
    actions.publish.mockResolvedValueOnce({ status: "conflict" });
    edit(session, "a");
    await session.publish();
    expect(session.getSnapshot()).toMatchObject({ status: "conflict", canPublish: false, canSave: false, blocked: true });
    edit(session, "b");
    await session.save();
    expect(actions.save).toHaveBeenCalledTimes(1);
  });

  it("says try again when a publish loses the network, and never retries it", async () => {
    const { actions, session } = setup();
    actions.publish.mockRejectedValueOnce(new Error("offline"));
    edit(session, "a");
    await session.publish();
    expect(session.getSnapshot()).toMatchObject({ status: "offline", canPublish: true });
    await vi.advanceTimersByTimeAsync(LONG);
    expect(actions.publish).toHaveBeenCalledTimes(1);
    await session.publish();
    expect(session.getSnapshot().status).toBe("published");
  });

  it("does not block after a database error on publish", async () => {
    const { actions, session } = setup();
    actions.publish.mockResolvedValueOnce({ status: "unavailable" });
    edit(session, "a");
    await session.publish();
    expect(session.getSnapshot()).toMatchObject({ status: "unavailable", blocked: false, canPublish: true });
    edit(session, "b");
    await session.save();
    expect(actions.save).toHaveBeenLastCalledWith("lab", "b", "t1");
  });

  it("keeps the issues after a later save, leaving Publish enabled, and clears them on success", async () => {
    const { actions, session } = setup();
    const issues = [{ doc: "lab" as const, at: "0/title", message: "is required" }];
    actions.publish.mockResolvedValueOnce({ status: "invalid", issues });
    edit(session, "a");
    await session.publish();
    expect(session.getSnapshot()).toMatchObject({ status: "invalid", issues, canPublish: false });
    edit(session, "b");
    await session.save();
    expect(session.getSnapshot()).toMatchObject({ status: "saved", issues, canPublish: true });
    await session.publish();
    expect(session.getSnapshot()).toMatchObject({ status: "published", issues: [] });
  });
});

describe("discard", () => {
  it("drops the unsaved edit, but keeps it if the discard fails", async () => {
    const { actions, session } = setup();
    actions.discard.mockResolvedValueOnce({ status: "unavailable" });
    edit(session, "a");
    const result = await session.discard();
    expect(result.status).toBe("unavailable");
    expect(session.hasUnsaved).toBe(true);
    expect(session.getSnapshot().canSave).toBe(true);
    expect(actions.save).not.toHaveBeenCalled();
    expect((await session.discard()).status).toBe("ok");
    expect(session.hasUnsaved).toBe(false);
    expect(session.getSnapshot().canSave).toBe(false);
  });

  it("keeps an edit made while a failing discard ran", async () => {
    const release = deferred<ActionResult>();
    const { actions, session } = setup();
    actions.discard.mockImplementationOnce(() => release.promise);
    const done = session.discard();
    await vi.advanceTimersByTimeAsync(0);
    edit(session, "b");
    release.resolve({ status: "unavailable" });
    await done;
    expect(session.hasUnsaved).toBe(true);
    await session.save();
    expect(actions.save).toHaveBeenCalledWith("lab", "b", null);
  });

  it("says try again after a discard loses the network", async () => {
    const { actions, session } = setup();
    actions.discard.mockRejectedValueOnce(new Error("offline"));
    const result = await session.discard();
    session.failed(result);
    expect(session.getSnapshot()).toMatchObject({ status: "offline", blocked: false });
  });
});
