// The admin's confirmation question as plain TypeScript, so it is tested
// without a DOM. components/admin/confirm-dialog.tsx binds it to React and
// shows it in a native <dialog>. It replaces window.confirm, which some
// browsers (Firefox Focus on iOS) answer "no" at once without showing anything.

export interface ConfirmRequest {
  question: string;
  // The label of the confirming button, e.g. "Delete" or "Leave".
  confirmLabel: string;
}

// At most one question is open. Open: the request. Closed: null.
export type ConfirmSnapshot = ConfirmRequest | null;

export class ConfirmState {
  private open: { request: ConfirmRequest; resolve: (answer: boolean) => void } | null = null;
  private listeners = new Set<() => void>();
  private snapshot: ConfirmSnapshot = null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ConfirmSnapshot => this.snapshot;

  // Resolves true when confirmed, false when cancelled. A question asked while
  // another is open is refused (false) and the open one stays.
  ask = (request: ConfirmRequest): Promise<boolean> => {
    if (this.open) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      // A copy, so each question is a distinct snapshot even when a caller
      // passes the same object again.
      this.snapshot = { ...request };
      this.open = { request: this.snapshot, resolve };
      this.emit();
    });
  };

  // Settles the open question; nothing happens when none is open.
  answer = (confirmed: boolean) => {
    const open = this.open;
    if (!open) return;
    this.open = null;
    this.snapshot = null;
    this.emit();
    open.resolve(confirmed);
  };

  private emit() {
    for (const listener of this.listeners) listener();
  }
}
