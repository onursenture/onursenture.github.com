"use client";

import { useEffect } from "react";

// Runs inside the preview iframe. The editor posts { type: "preview-focus", id }
// (same origin only); the matching row (every block row's id is its block id)
// scrolls to the top and gets an accent outline.
export function PreviewFocus() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; id?: string | null };
      if (data?.type !== "preview-focus") return;
      current?.removeAttribute("data-preview-focus");
      current = data.id ? document.getElementById(data.id) : null;
      if (!current) return;
      current.setAttribute("data-preview-focus", "");
      current.scrollIntoView({ block: "start", behavior: "instant" });
    }
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return null;
}
