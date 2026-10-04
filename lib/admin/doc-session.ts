import type { Issue } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";
import type { ActionResult, DocEditorInit } from "./results";

// One document's editing session (spec §2.3) without React, so its rules can
// be tested: local value, a draft written only when the user saves (Save draft
// or Cmd/Ctrl+S), optimistic concurrency through draftUpdatedAt, publish ordered
// after the saves in flight (and saving the unsaved edit first), and a preview
// version that bumps after each write so the preview reloads only then. A
// failed save is not retried: the edit stays unsaved and the user saves again.
// components/admin/use-doc-editor.ts binds it to React.

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

// A conflict or a lost session ends the session's writes until the page is
// reloaded or signed in again, and so does a database that was missing from
// the start. A database error during the session is treated like the network:
// the edit stays unsaved and the user can save again.

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
  // Writes are stopped for good (conflict, signed out, no database at all).
  blocked: boolean;
  // There is an unsaved edit and nothing stops a save now (Save draft, Cmd+S).
  canSave: boolean;
}

// A request that threw (the network, not the server).
type Outcome<R> = R | { status: "network" };

export class DocSession<T> {
  readonly docKey: DocKey;
  private snapshot: SessionSnapshot<T>;
  private listeners = new Set<() => void>();
  private expected: string | null;
  private pending = false;
  // A save request is on its way: its edit isn't stored yet.
  private saving = false;
  private blocked: boolean;
  private chain: Promise<unknown> = Promise.resolve();

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
      blocked: this.blocked,
      canSave: false,
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

  // An edit is not stored yet (typed, in flight, or failed): leaving loses it.
  get hasUnsaved() {
    return this.pending || this.saving;
  }

  setValue = (update: (previous: T) => T) => {
    const value = update(this.snapshot.value);
    this.pending = true;
    this.set({ value, ...(this.blocked ? {} : { status: "dirty" as const }) });
  };

  // Writes the unsaved edit as the draft, after the work in flight. Nothing to
  // write (or a stopped session) is a no-op that still waits for that work.
  save = (): Promise<void> => this.enqueue(() => this.write());

  publish = (): Promise<void> => {
    return this.enqueue(async () => {
      await this.write();
      // An edit that did not reach the server, or a stopped session: no publish.
      if (this.blocked || this.pending) return;
      this.set({ status: "publishing" });
      const result = await this.attempt(() => this.actions.publish(this.docKey, this.expected));
      if (result.status === "ok") {
        this.expected = null;
        // An edit made while publishing stays unsaved, for the next save.
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
    const hadPending = this.pending;
    this.pending = false;
    this.set({});
    return this.enqueue(async () => {
      const result = await this.attempt(() => action(this.docKey));
      // Keep an edit made while the action ran, as well as the one it dropped.
      if (result.status !== "ok" && hadPending && !this.pending) {
        this.pending = true;
        this.set({});
      }
      return result;
    });
  };

  discard = () => this.replace(this.actions.discard);
  reset = () => this.replace(this.actions.reset);

  // Show issues that came from another action (delete page, upload).
  report = (issues: Issue[]) => {
    this.set({ issues, ...(issues.length ? { status: "invalid" as const } : {}) });
  };

  // Shows a failed request. Nothing is retried: the user tries again.
  failed(result: ActionResult | { status: "network" }) {
    if (result.status === "invalid") {
      this.set({ issues: result.issues, status: "invalid" });
    } else if (result.status === "network") {
      this.set({ status: "offline" });
    } else if (result.status === "unavailable") {
      // Not blocking: the database was there when the session started.
      this.set({ status: "unavailable" });
    } else if (result.status === "conflict" || result.status === "unauthorized") {
      this.blocked = true;
      this.set({ status: result.status === "conflict" ? "conflict" : "signed-out" });
    }
  }

  private async write(): Promise<void> {
    if (!this.pending || this.blocked) return;
    this.pending = false;
    this.saving = true;
    this.set({ status: "saving" });
    const result = await this.attempt(() => this.actions.save(this.docKey, this.snapshot.value, this.expected));
    this.saving = false;
    if (result.status === "ok") {
      this.expected = result.draftUpdatedAt;
      this.set({
        savedAt: result.draftUpdatedAt,
        hasDraft: true,
        status: this.pending ? "dirty" : "saved",
        previewVersion: this.snapshot.previewVersion + 1,
      });
      return;
    }
    // The edit is still only in memory: keep it unsaved so leaving warns and
    // the next save sends the latest value.
    this.pending = true;
    this.failed(result);
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

  private computeCanPublish(snapshot: SessionSnapshot<T>) {
    const busy = snapshot.status === "saving" || snapshot.status === "publishing" || snapshot.status === "invalid" || this.blocked;
    return !busy && (snapshot.hasDraft || this.pending || snapshot.status === "dirty");
  }

  private set(patch: Partial<SessionSnapshot<T>>) {
    const next = { ...this.snapshot, ...patch, blocked: this.blocked };
    const canSave = this.pending && !this.saving && !this.blocked && next.status !== "publishing";
    this.snapshot = { ...next, canPublish: this.computeCanPublish(next), canSave };
    for (const listener of this.listeners) listener();
  }
}
