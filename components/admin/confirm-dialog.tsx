"use client";

import { type MouseEvent, type ReactNode, createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { type ConfirmRequest, ConfirmState } from "@/lib/admin/confirm";

// The admin's confirmation: an in-page native modal <dialog> instead of
// window.confirm, which some browsers (Firefox Focus on iOS) answer "no" at
// once without showing anything, so every Delete and every unsaved-changes
// guard did nothing there. lib/admin/confirm.ts holds the state; AdminShell
// mounts one provider for the whole console. Components call useConfirm():
//   if (await confirm({ question, confirmLabel: "Delete" })) ...
// Esc, a click on the backdrop and Cancel all answer false. Focus starts on
// Cancel: every question here is destructive or drops work.

type Confirm = (request: ConfirmRequest) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm needs a <ConfirmProvider> above it.");
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state] = useState(() => new ConfirmState());
  return (
    <ConfirmContext value={state.ask}>
      {children}
      <ConfirmDialog state={state} />
    </ConfirmContext>
  );
}

function ConfirmDialog({ state }: { state: ConfirmState }) {
  const request = useSyncExternalStore(state.subscribe, state.getSnapshot, state.getSnapshot);
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // The question the dialog was opened for, so a late close event (it fires
  // after close() returns) never answers the next question.
  const shown = useRef<ConfirmRequest | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (request && !dialog.open) {
      shown.current = request;
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!request && dialog.open) {
      dialog.close();
    }
  }, [request]);

  // Leaving the admin with a question open: close the modal (it would leave
  // the next page inert) and settle the promise.
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      dialog?.close();
      state.answer(false);
    };
  }, [state]);

  function onClick(event: MouseEvent<HTMLDialogElement>) {
    // The dialog has no padding of its own, so a click on it (not on its
    // content) is a click on the backdrop.
    if (event.target === event.currentTarget) state.answer(false);
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc: the browser closes the dialog itself; this settles the question.
      onCancel={() => state.answer(false)}
      // Closed by anything else: settle the question it was opened for.
      onClose={() => {
        if (shown.current !== null && shown.current === state.getSnapshot()) state.answer(false);
        shown.current = null;
      }}
      onClick={onClick}
      className="m-auto w-[calc(100%-2rem)] max-w-[360px] border border-line bg-bg p-0 text-fg backdrop:bg-fg/30"
    >
      {request ? (
        <div className="flex flex-col gap-4 p-4">
          <p id={titleId} className="type-body">
            {request.question}
          </p>
          <div className="flex justify-end gap-2">
            <Button ref={cancelRef} variant="ghost" onClick={() => state.answer(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => state.answer(true)}>
              {request.confirmLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
