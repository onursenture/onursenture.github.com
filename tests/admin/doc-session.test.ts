import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTOSAVE_MS, type DocActions, DocSession } from "@/lib/admin/doc-session";
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

describe("autosave", () => {
  it("saves the latest value one second after the last edit", async () => {
    const { actions, session } = setup();
    edit(session, "a");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS - 1);
    edit(session, "b");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS - 1);
    expect(actions.save).not.toHaveBeenCalled();
    expect(session.getSnapshot().status).toBe("dirty");
    await vi.advanceTimersByTimeAsync(1);
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.save).toHaveBeenCalledWith("lab", "b", null);
    expect(session.getSnapshot()).toMatchObject({ status: "saved", hasDraft: true, savedAt: "t1", previewVersion: 1 });
    expect(session.hasUnsaved).toBe(false);
  });

  it("keeps an edit made during a save, and saves it next with the new expected time", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(session.getSnapshot().status).toBe("saving");
    edit(session, "b");
    first.resolve(saved(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(session.getSnapshot()).toMatchObject({ status: "dirty", value: "b" });
    expect(session.hasUnsaved).toBe(true);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(actions.save).toHaveBeenNthCalledWith(2, "lab", "b", "t1");
    expect(session.getSnapshot().status).toBe("saved");
  });

  it("flushes a pending edit at once, as an unmount does", async () => {
    const { actions, session } = setup();
    edit(session, "a");
    await session.flush();
    session.dispose();
    expect(actions.save).toHaveBeenCalledWith("lab", "a", null);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 5);
    expect(actions.save).toHaveBeenCalledTimes(1);
  });
});

describe("a failed save", () => {
  it("keeps the edit pending and retries with backoff when the network drops", async () => {
    const { actions, session } = setup();
    actions.save.mockRejectedValueOnce(new Error("offline")).mockRejectedValueOnce(new Error("offline"));
    edit(session, "a");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(session.getSnapshot()).toMatchObject({ status: "offline", retrying: true });
    expect(session.hasUnsaved).toBe(true);
    await vi.advanceTimersByTimeAsync(1999);
    expect(actions.save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(actions.save).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3999);
    expect(actions.save).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(actions.save).toHaveBeenCalledTimes(3);
    expect(session.getSnapshot()).toMatchObject({ status: "saved", hasDraft: true });
    expect(session.hasUnsaved).toBe(false);
  });

  it("stops retrying once the editor is gone", async () => {
    const { actions, session } = setup();
    actions.save.mockRejectedValue(new Error("offline"));
    edit(session, "a");
    const done = session.flush();
    session.dispose();
    await done;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(actions.save).toHaveBeenCalledTimes(1);
  });

  it("treats a database error mid-session like the network: pending, retried, not blocking", async () => {
    const { actions, session } = setup();
    actions.save.mockResolvedValueOnce({ status: "unavailable" }).mockResolvedValueOnce({ status: "unavailable" });
    edit(session, "a");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(session.getSnapshot()).toMatchObject({ status: "unavailable", retrying: true, blocked: false });
    expect(session.hasUnsaved).toBe(true);
    await vi.advanceTimersByTimeAsync(2000);
    expect(actions.save).toHaveBeenCalledTimes(2);
    edit(session, "b");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(actions.save).toHaveBeenCalledTimes(3);
    expect(actions.save).toHaveBeenLastCalledWith("lab", "b", null);
    expect(session.getSnapshot()).toMatchObject({ status: "saved", hasDraft: true });
    expect(session.hasUnsaved).toBe(false);
  });

  it("stays blocked when there was no database from the start", async () => {
    const { actions, session } = setup({ available: false });
    expect(session.getSnapshot()).toMatchObject({ status: "unavailable", blocked: true, retrying: false, canPublish: false });
    edit(session, "a");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 3);
    expect(actions.save).not.toHaveBeenCalled();
    expect(session.hasUnsaved).toBe(true);
    await session.publish();
    expect(actions.publish).not.toHaveBeenCalled();
  });

  it("warns on leaving while a save is in flight", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(session.getSnapshot().status).toBe("saving");
    expect(session.hasUnsaved).toBe(true);
    first.resolve(saved(1));
    await vi.advanceTimersByTimeAsync(0);
    expect(session.hasUnsaved).toBe(false);
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
  it("saves first, then publishes the draft time it saved", async () => {
    const { actions, session } = setup();
    edit(session, "a");
    await session.publish();
    expect(actions.save).toHaveBeenCalledTimes(1);
    expect(actions.publish).toHaveBeenCalledWith("lab", "t1");
    expect(session.getSnapshot()).toMatchObject({ status: "published", hasDraft: false, savedAt: null, publishedAt: "p1", issues: [] });
  });

  it("waits for a save in flight", async () => {
    const first = deferred<ActionResult<{ draftUpdatedAt: string }>>();
    const { actions, session } = setup();
    actions.save.mockImplementationOnce(() => first.promise);
    edit(session, "a");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    const done = session.publish();
    await vi.advanceTimersByTimeAsync(0);
    expect(actions.publish).not.toHaveBeenCalled();
    first.resolve(saved(1));
    await done;
    expect(actions.publish).toHaveBeenCalledWith("lab", "t1");
  });

  it("ends dirty, not published, when an edit arrives mid-publish, and saves it as a new draft", async () => {
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
    expect(session.getSnapshot()).toMatchObject({ status: "dirty", hasDraft: true, publishedAt: "p1", value: "b" });
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(actions.save).toHaveBeenLastCalledWith("lab", "b", null);
    expect(session.getSnapshot().status).toBe("saved");
  });

  it("blocks the editor on a conflict and writes nothing more", async () => {
    const { actions, session } = setup();
    actions.publish.mockResolvedValueOnce({ status: "conflict" });
    edit(session, "a");
    await session.publish();
    expect(session.getSnapshot()).toMatchObject({ status: "conflict", canPublish: false, blocked: true });
    edit(session, "b");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);
    expect(actions.save).toHaveBeenCalledTimes(1);
  });

  it("says try again, not retrying, when a publish loses the network", async () => {
    const { actions, session } = setup();
    actions.publish.mockRejectedValueOnce(new Error("offline"));
    edit(session, "a");
    await session.publish();
    expect(session.getSnapshot()).toMatchObject({ status: "offline", retrying: false, canPublish: true });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(actions.publish).toHaveBeenCalledTimes(1);
    await session.publish();
    expect(session.getSnapshot().status).toBe("published");
  });

  it("does not block after a database error on publish", async () => {
    const { actions, session } = setup();
    actions.publish.mockResolvedValueOnce({ status: "unavailable" });
    edit(session, "a");
    await session.publish();
    expect(session.getSnapshot()).toMatchObject({ status: "unavailable", retrying: false, blocked: false, canPublish: true });
    edit(session, "b");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
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
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
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
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS * 2);
    expect(actions.save).not.toHaveBeenCalled();
    expect((await session.discard()).status).toBe("ok");
    expect(session.hasUnsaved).toBe(false);
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
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MS);
    expect(actions.save).toHaveBeenCalledWith("lab", "b", null);
  });

  it("says try again after a discard loses the network", async () => {
    const { actions, session } = setup();
    actions.discard.mockRejectedValueOnce(new Error("offline"));
    const result = await session.discard();
    session.failed(result);
    expect(session.getSnapshot()).toMatchObject({ status: "offline", retrying: false });
  });
});
