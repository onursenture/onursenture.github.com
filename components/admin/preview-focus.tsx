"use client";

import { useEffect } from "react";

// Runs inside the preview iframe. The editor posts { type: "preview-focus", id }
// (same origin only); the matching row (every block row's id is its block id)
// scrolls to the top and gets an accent outline.
//
// The page streams in after hydration, so two things are done to stay out of
// its way: the outline is a stylesheet rule rather than an attribute on the row
// (an attribute set before the row hydrates is a hydration mismatch), and the
// scroll is repeated while the page is still growing (a scroll before the
// content below arrives has nowhere to go).
export function PreviewFocus() {
  useEffect(() => {
    const style = document.createElement("style");
    document.head.append(style);
    let observer: ResizeObserver | null = null;
    let stop: ReturnType<typeof setTimeout> | undefined;

    function settle() {
      observer?.disconnect();
      clearTimeout(stop);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; id?: string | null };
      if (data?.type !== "preview-focus") return;
      settle();
      const id = data.id;
      if (!id || !document.getElementById(id)) {
        style.textContent = "";
        return;
      }
      style.textContent = `#${CSS.escape(id)} { outline: 2px solid var(--color-accent); outline-offset: -2px; }`;
      const scroll = () => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
      scroll();
      observer = new ResizeObserver(scroll);
      observer.observe(document.documentElement);
      stop = setTimeout(settle, 1500);
    }

    window.addEventListener("message", onMessage);
    // A reader scrolling the preview wins over the settle.
    window.addEventListener("wheel", settle, { passive: true });
    window.addEventListener("touchmove", settle, { passive: true });
    window.parent.postMessage({ type: "preview-ready" }, window.location.origin);
    return () => {
      settle();
      style.remove();
      window.removeEventListener("message", onMessage);
      window.removeEventListener("wheel", settle);
      window.removeEventListener("touchmove", settle);
    };
  }, []);
  return null;
}
