"use client";

import { useCallback, useEffect, useRef } from "react";
import { cx } from "@/lib/cx";

// The draft preview: the real page in an iframe, reloaded after each save
// (`version`), scrolled to and outlining the block being edited (PreviewFocus).
export function PreviewPane({ src, version, focusId, className }: { src: string; version: number; focusId: string | null; className?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: "preview-focus", id: focusId }, window.location.origin);
  }, [focusId]);

  useEffect(() => {
    send();
    function onMessage(event: MessageEvent) {
      if (event.origin === window.location.origin && (event.data as { type?: string })?.type === "preview-ready") send();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  // Below lg the pane is display:none until its tab is opened, and a hidden
  // page can't scroll: send the focus again when the pane appears.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let shown = element.offsetWidth > 0;
    const observer = new ResizeObserver(() => {
      const now = element.offsetWidth > 0;
      if (now && !shown) send();
      shown = now;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [send]);

  return (
    <div className={cx("relative bg-bg", className)}>
      <span className="absolute top-2 right-3 z-10 border border-line bg-bg px-1.5 type-label text-fg-muted">Preview · draft</span>
      <iframe ref={frame} title="Preview" src={`${src}?v=${version}`} onLoad={send} className="h-full w-full border-0" />
    </div>
  );
}
