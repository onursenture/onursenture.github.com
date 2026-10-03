"use client";

import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// The mobile menu (below md): a native modal <dialog>, full-screen. Its
// content mounts only while open, so the toggles inside never duplicate the desktop ones in the
// DOM. Following a link, or clicking the backdrop, closes it.
export function MenuDialog({ title, children }: { title: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) ref.current?.showModal();
  }, [open]);

  // A navigation to the other side hides this tree (Next keeps it mounted but hidden) and
  // runs effect cleanups; close the modal then, or the new page stays inert.
  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);

  // Growing past md hides this menu (md:hidden), but a modal <dialog> stays
  // open inside a display:none ancestor and keeps the rest of the page inert.
  // 48rem is Tailwind's md, so the two switch at the same width.
  useEffect(() => {
    const media = window.matchMedia("(min-width: 48rem)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) ref.current?.close();
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
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
        className="m-0 h-dvh w-full max-h-none max-w-none bg-bg p-0 text-fg"
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
