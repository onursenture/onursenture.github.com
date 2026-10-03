"use client";

import { useEffect } from "react";

// Marks <html> while the Life side is mounted, so overscroll and the area
// around the page match it (globals.css: html[data-side="life"]). Hiding
// the tree after a navigation runs the cleanup.
export function SideSync({ side }: { side: "life" }) {
  useEffect(() => {
    document.documentElement.dataset.side = side;
    return () => {
      delete document.documentElement.dataset.side;
    };
  }, [side]);
  return null;
}
