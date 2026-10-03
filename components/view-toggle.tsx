"use client";

import { useRouter } from "next/navigation";
import { addTransitionType, startTransition, useEffect } from "react";
import { Toggle } from "@/components/ui/toggle";
import { cookiePattern, serializeCookie } from "@/lib/view/cookies";
import { VIEW_SWITCH } from "@/lib/view/transition";
import { VIEWS, VIEW_COOKIE, type View, isView, resolveView } from "@/lib/view/views";

const OPTIONS = [
  { value: "site", label: "Site" },
  { value: "dashboard", label: "Dashboard" },
] as const satisfies readonly { value: View; label: string }[];

const VIEW_COOKIE_PATTERN = cookiePattern(VIEW_COOKIE, VIEWS.join("|"));

export function ViewToggle({ current }: { current: View }) {
  const router = useRouter();

  function choose(next: View) {
    if (next === current) return;
    document.cookie = serializeCookie(VIEW_COOKIE, next);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startTransition(() => {
      // Without the type no <ViewTransition> activates, so React never
      // starts a view transition and the swap is instant.
      if (!reduceMotion) addTransitionType(VIEW_SWITCH);
      // Re-requests the current URL; the proxy now rewrites to the other
      // variant. Also invalidates the prefetched segments, and visible links
      // prefetch again; proxy.ts keeps the browser's HTTP cache from
      // answering those with the old view.
      router.refresh();
    });
  }

  return <Toggle label="View" testId="view-toggle" options={OPTIONS} value={current} onChange={choose} />;
}

// The view a history entry was rendered in: the [view] segment of the route
// tree Next keeps in history.state. That field is private, so any other shape
// returns null and leaves the entry to Next.
function historyEntryView(state: unknown): View | null {
  const tree = (state as { __PRIVATE_NEXTJS_INTERNALS_TREE?: { tree?: unknown } } | null)
    ?.__PRIVATE_NEXTJS_INTERNALS_TREE?.tree;
  const segment = Array.isArray(tree) ? tree[1]?.children?.[0] : undefined;
  return Array.isArray(segment) && segment[0] === "view" && isView(segment[1]) ? segment[1] : null;
}

// Back/forward to an entry rendered before a view switch. Next restores the
// entry's stored route tree from its client cache without asking the server
// (restore-reducer, FreshnessPolicy.HistoryTraversal), and that cache is wrong
// for the old view: when the switch's refresh got the other view back, Next
// resolved the old view's segments to null and kept them in its BFCache, so
// the restore suspends forever and the previous page stays on screen under
// the new URL. For such an entry, skip the restore and navigate to the URL
// instead: the proxy answers with the cookie's view and the entry is replaced.
export function ViewHistoryGuard() {
  const router = useRouter();

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      const entryView = historyEntryView(event.state);
      const cookieView = resolveView(null, document.cookie.match(VIEW_COOKIE_PATTERN)?.[1]);
      if (entryView === null || entryView === cookieView) return;
      // Capturing on window runs before Next's own popstate listener.
      event.stopImmediatePropagation();
      router.replace(`${location.pathname}${location.search}${location.hash}`, { scroll: false });
    }
    window.addEventListener("popstate", onPopState, { capture: true });
    return () => window.removeEventListener("popstate", onPopState, { capture: true });
  }, [router]);

  return null;
}
