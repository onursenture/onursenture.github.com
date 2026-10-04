import type { Issue } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";
import type { ActionResult, DocEditorInit } from "./results";

// One document's editing session (spec §2.3) without React, so its rules can
// be tested with fake timers: local value, autosave ~1s after the last change
// (one request in flight at a time, the latest value wins), optimistic
// concurrency through draftUpdatedAt, publish ordered after the autosave,
// retry with backoff when the network drops, and a preview version that bumps
// after each write so the preview reloads. components/admin/use-doc-editor.ts
// binds it to React.

export const AUTOSAVE_MS = 1000;
export const RETRY_MS = [2000, 4000, 8000, 30_000];

export type EditorStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "publishing"
  | "published"
  | "offline"
  | "conflict"
  | "signed-out"
  | "unavailable"
  | "invalid";

// These end the session's writes until the page is reloaded or signed in again.
const BLOCKING: EditorStatus[] = ["conflict", "signed-out", "unavailable"];

export interface DocActions {
  save: (key: DocKey, value: unknown, expected: string | null) => Promise<ActionResult<{ draftUpdatedAt: string }>>;
  publish: (key: DocKey, expected: string | null) => Promise<ActionResult<{ publishedAt: string }>>;
  discard: (key: DocKey) => Promise<ActionResult>;
  reset: (key: DocKey) => Promise<ActionResult>;
}

export interface SessionSnapshot<T> {
  value: T;
  status: EditorStatus;
  hasDraft: boolean;
  savedAt: string | null;
  publishedAt: string | null;
  issues: Issue[];
  previewVersion: number;
  canPublish: boolean;
}

// A request that threw (the network, not the server) is retried; the server's
// own answers are not.
type Outcome<R> = R | { status: "network" };

export class DocSession<T> {
  readonly docKey: DocKey;
  private snapshot: SessionSnapshot<T>;
  private listeners = new Set<() => void>();
  private expected: string | null;
  private pending = false;
  private blocked: boolean;
  // The last save failed: its edit is still unsaved, so publishing must wait.
  private saveFailed = false;
  private retries = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private chain: Promise<unknown> = Promise.resolve();
  // False while the owning component is unmounted: no more retries then.
  private attached = true;

  constructor(
    init: DocEditorInit<T>,
    private actions: DocActions,
  ) {
    this.docKey = init.docKey;
    this.expected = init.draftUpdatedAt;
    this.blocked = !init.available;
    this.snapshot = {
      value: init.value,
      status: init.available ? "idle" : "unavailable",
      hasDraft: init.hasDraft,
      savedAt: init.draftUpdatedAt,
      publishedAt: init.publishedAt,
      issues: [],
      previewVersion: 0,
      canPublish: false,
    };
    this.snapshot.canPublish = this.computeCanPublish(this.snapshot);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  // An edit is not saved yet (typed, in flight, or failed): leaving loses it.
  get hasUnsaved() {
    return this.pending;
  }

  setValue = (update: (previous: T) => T) => {
    const value = update(this.snapshot.value);
    this.pending = true;
    this.set({ value, ...(this.blocked ? {} : { status: "dirty" as const }) });
    this.schedule(AUTOSAVE_MS);
  };

  flush = (): Promise<void> => {
    this.clearTimer();
    return this.enqueue(() => this.save());
  };

  publish = (): Promise<void> => {
    this.clearTimer();
    return this.enqueue(async () => {
      await this.save();
      // An edit that did not reach the server, or a stopped session: no publish.
      if (this.blocked || this.pending || this.saveFailed) return;
      this.set({ status: "publishing" });
      const result = await this.attempt(() => this.actions.publish(this.docKey, this.expected));
      if (result.status === "ok") {
        this.expected = null;
        // An edit made while publishing is a new draft the autosave will write.
        this.set({
          issues: [],
          hasDraft: this.pending,
          savedAt: null,
          publishedAt: result.publishedAt,
          status: this.pending ? "dirty" : "published",
          previewVersion: this.snapshot.previewVersion + 1,
        });
        return;
      }
      this.failed(result);
      if (this.pending && !this.blocked) this.set({ status: "dirty" });
    });
  };

  // Discard and reset: run after the saves in flight, drop the unsaved edit.
  // The caller reloads on "ok" and calls failed() otherwise.
  replace = (action: (key: DocKey) => Promise<ActionResult>): Promise<ActionResult | { status: "network" }> => {
    this.clearTimer();
    const hadPending = this.pending;
    this.pending = false;
    return this.enqueue(async () => {
      const result = await this.attempt(() => action(this.docKey));
      if (result.status === "ok") this.saveFailed = false;
      else this.pending = hadPending;
      return result;
    });
  };

  discard = () => this.replace(this.actions.discard);
  reset = () => this.replace(this.actions.reset);

  // Show issues that came from another action (delete page, upload).
  report = (issues: Issue[]) => {
    this.set({ issues, ...(issues.length ? { status: "invalid" as const } : {}) });
  };

  failed(result: ActionResult | { status: "network" }) {
    if (result.status === "invalid") {
      this.set({ issues: result.issues, status: "invalid" });
    } else if (result.status === "network") {
      this.set({ status: "offline" });
    } else {
      const status: EditorStatus = result.status === "conflict" ? "conflict" : result.status === "unauthorized" ? "signed-out" : "unavailable";
      this.blocked = BLOCKING.includes(status);
      this.set({ status });
    }
  }

  attach() {
    this.attached = true;
  }

  // Stops the timers; the owner calls flush() first to save a last edit.
  dispose() {
    this.attached = false;
    this.clearTimer();
  }

  private async save(): Promise<void> {
    if (!this.pending || this.blocked) return;
    this.pending = false;
    this.set({ status: "saving" });
    const result = await this.attempt(() => this.actions.save(this.docKey, this.snapshot.value, this.expected));
    if (result.status === "ok") {
      this.expected = result.draftUpdatedAt;
      this.saveFailed = false;
      this.retries = 0;
      this.set({
        savedAt: result.draftUpdatedAt,
        hasDraft: true,
        status: this.pending ? "dirty" : "saved",
        previewVersion: this.snapshot.previewVersion + 1,
      });
      return;
    }
    // The edit is still only in memory: keep it pending so leaving warns and
    // the next save (or retry) sends the latest value.
    this.pending = true;
    this.saveFailed = true;
    this.failed(result);
    if (result.status === "network" && this.attached) this.schedule(RETRY_MS[Math.min(this.retries++, RETRY_MS.length - 1)]);
  }

  private async attempt<R extends { status: string }>(request: () => Promise<R>): Promise<Outcome<R>> {
    try {
      return await request();
    } catch {
      return { status: "network" };
    }
  }

  private enqueue<R>(work: () => Promise<R>): Promise<R> {
    const run = this.chain.then(work);
    this.chain = run.catch(() => undefined);
    return run;
  }

  private schedule(ms: number) {
    this.clearTimer();
    this.timer = setTimeout(() => void this.flush(), ms);
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private computeCanPublish(snapshot: SessionSnapshot<T>) {
    const busy = snapshot.status === "saving" || snapshot.status === "publishing" || snapshot.status === "invalid" || BLOCKING.includes(snapshot.status);
    return !busy && (snapshot.hasDraft || this.pending || snapshot.status === "dirty");
  }

  private set(patch: Partial<SessionSnapshot<T>>) {
    const next = { ...this.snapshot, ...patch };
    this.snapshot = { ...next, canPublish: this.computeCanPublish(next) };
    for (const listener of this.listeners) listener();
  }
}
