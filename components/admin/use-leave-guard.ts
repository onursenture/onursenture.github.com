"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useEffectEvent, useRef } from "react";
import { LEAVE_QUESTION, leavesPage } from "@/lib/admin/leave-guard";
import { useConfirm } from "./confirm-dialog";

// The in-app half of the unsaved-changes guard (the browser's own beforeunload
// prompt covers closing and reloading, and each editor keeps that). A click on
// a link that takes this tab to another page of the site, while hasUnsaved()
// says there is something to lose, is always stopped (capture phase on window,
// so it runs before next/link's handler) and answered with the in-page confirm
// dialog, never window.confirm: some browsers answer that with "no" at once.
// "Leave" calls onLeave (drop the edit), then navigates with the router. Cancel
// stays on the page.
//
// Returns isLeaving(): true from a confirmed Leave until the editor remounts.
// The navigation may turn into a full page load (a link to another root
// layout), so the editor's beforeunload listener must stay quiet then.
export function useLeaveGuard(hasUnsaved: () => boolean, onLeave?: () => void): () => boolean {
  const router = useRouter();
  const confirm = useConfirm();
  const leaving = useRef(false);

  const onClick = useEffectEvent(async (event: MouseEvent) => {
    if (leaving.current || !hasUnsaved() || !(event.target instanceof Element)) return;
    const anchor = event.target.closest("a[href]");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const target = { href: anchor.href, target: anchor.target, download: anchor.hasAttribute("download") };
    if (!leavesPage(event, target, window.location.href)) return;
    event.preventDefault();
    event.stopPropagation();
    if (!(await confirm({ question: LEAVE_QUESTION, confirmLabel: "Leave" }))) return;
    leaving.current = true;
    onLeave?.();
    const url = new URL(anchor.href);
    // Route handlers (/api/...) are not pages: they need a real navigation.
    if (url.pathname.startsWith("/api/")) window.location.assign(url.href);
    else router.push(`${url.pathname}${url.search}${url.hash}`);
  });

  useEffect(() => {
    leaving.current = false;
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, []);

  return useCallback(() => leaving.current, []);
}
