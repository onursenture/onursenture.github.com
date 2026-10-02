"use client";

import { useRouter } from "next/navigation";
import { VIEW_COOKIE, type View } from "@/lib/view/views";

export function ViewToggle({ current }: { current: View }) {
  const router = useRouter();
  const next: View = current === "site" ? "dashboard" : "site";

  function toggle() {
    document.cookie = `${VIEW_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    // Re-requests the current URL; the proxy now rewrites to the other
    // variant. Also drops the client router cache so later navigations
    // don't serve prefetched pages of the old view.
    router.refresh();
  }

  return (
    <button type="button" onClick={toggle} data-testid="view-toggle">
      {next === "dashboard" ? "Dashboard view" : "Site view"}
    </button>
  );
}
