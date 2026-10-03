"use client";

import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cx } from "@/lib/cx";

// The mobile menu (below md): a native modal <dialog>, full-screen for the
// site and a 312px slide-over for the dashboard. Its content mounts only
// while open, so the toggles inside never duplicate the desktop ones in the
// DOM. Following a link, or clicking the backdrop, closes it.
export function MenuDialog({
  variant,
  title,
  children,
}: {
  variant: "full" | "slide";
  title: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) ref.current?.showModal();
  }, [open]);

  // A view switch hides this tree (Next keeps it mounted but hidden) and
  // runs effect cleanups; close the modal then, or the new page stays inert.
  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);

  function onClick(event: MouseEvent<HTMLDialogElement>) {
    const target = event.target as HTMLElement;
    if (target === event.currentTarget || target.closest("a")) ref.current?.close();
  }

  return (
    <>
      <Button variant="text" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        Menu
      </Button>
      <dialog
        ref={ref}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={onClick}
        className={cx(
          "m-0 h-dvh max-h-none p-0 text-fg",
          variant === "full"
            ? "w-full max-w-none bg-bg"
            : "w-78 max-w-[calc(100%-3rem)] border-r bg-surface backdrop:bg-bg/70",
        )}
      >
        {open ? (
          <div className="flex h-full flex-col">
            <div className="flex h-12 shrink-0 items-center justify-between border-b pr-1 pl-4">
              {title}
              <Button variant="text" aria-label="Close menu" onClick={() => ref.current?.close()}>
                ×
              </Button>
            </div>
            {children}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
