"use client";

import { useRouter } from "next/navigation";
import { addTransitionType, startTransition } from "react";
import { Toggle } from "@/components/ui/toggle";
import { serializeCookie } from "@/lib/view/cookies";
import { VIEW_SWITCH } from "@/lib/view/transition";
import { VIEW_COOKIE, type View } from "@/lib/view/views";

const OPTIONS = [
  { value: "site", label: "Site" },
  { value: "dashboard", label: "Dashboard" },
] as const satisfies readonly { value: View; label: string }[];

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
      // variant. Also drops the client router cache so later navigations
      // don't serve prefetched pages of the old view.
      router.refresh();
    });
  }

  return <Toggle label="View" testId="view-toggle" options={OPTIONS} value={current} onChange={choose} />;
}
