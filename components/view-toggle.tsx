"use client";

import { useRouter } from "next/navigation";
import { Toggle } from "@/components/ui/toggle";
import { serializeCookie } from "@/lib/view/cookies";
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
    // Re-requests the current URL; the proxy now rewrites to the other
    // variant. Also drops the client router cache so later navigations
    // don't serve prefetched pages of the old view.
    router.refresh();
  }

  return <Toggle label="View" testId="view-toggle" options={OPTIONS} value={current} onChange={choose} />;
}
