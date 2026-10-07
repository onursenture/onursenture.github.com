"use client";

import { usePathname } from "next/navigation";
import { type MouseEvent, type ReactNode, Suspense, createContext, useContext, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
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
      {/* usePathname is dynamic data: it needs a boundary or the admin pages cannot prerender. */}
      <Suspense fallback={null}>
        <CancelOnNavigate state={state} />
      </Suspense>
    </ConfirmContext>
  );
}

// The question belongs to the page that asked it. Next keeps that page mounted
// but hidden after Back or a link, and the buttons would still run its
// continuation (a delete the user can no longer see): cancel it when the path
// changes. On the first render nothing is open, so that answer is a no-op.
function CancelOnNavigate({ state }: { state: ConfirmState }) {
  const pathname = usePathname();
  useEffect(() => {
    state.answer(false);
  }, [pathname, state]);
  return null;
}

function ConfirmDialog({ state }: { state: ConfirmState }) {
  const request = useSyncExternalStore(state.subscribe, state.getSnapshot, state.getSnapshot);
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // The question the dialog was opened for, so a late close event (it fires
  // after close() returns) never answers the next question.
  const shown = useRef<ConfirmRequest | null>(null);
  const titleId = useId();

  // Every change of the current question: open the modal if needed, remember
  // which question it shows, and put focus on Cancel. A question that replaces
  // another in one render (answer, then ask) never left the dialog, so focus
  // would otherwise stay on the old confirm button.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (request) {
      shown.current = request;
      if (!dialog.open) dialog.showModal();
      cancelRef.current?.focus();
    } else if (dialog.open) {
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
      // Closed by anything else: settle the question it was opened for. A
      // close event is queued after close() returns, so one that arrives while
      // the dialog is open again belongs to the previous question: ignore it.
      onClose={() => {
        if (ref.current?.open) return;
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
