"use client";

import { useState } from "react";
import { DitherGradient } from "@/components/dither-kit/gradient";
import { cx } from "@/lib/cx";
import { useTokenColor } from "./use-token-color";

// 14px band across the top of every page: ink, solid along the top edge and
// dissolving downward (the spec's "fading" strip, with the kit's linear ramp).
export function DitherStrip() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const ink = useTokenColor(el, "--color-fg");
  return (
    <div ref={setEl} aria-hidden="true" className="relative h-3.5 w-full overflow-hidden">
      {ink ? <DitherGradient from={ink} direction="down" cell={2} opacity={0.85} /> : null}
    </div>
  );
}

// 4px section separator: the muted ink at half opacity, dissolving downward.
export function DitherRule({ className }: { className?: string }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const line = useTokenColor(el, "--color-fg-muted");
  return (
    <div ref={setEl} aria-hidden="true" className={cx("relative h-1 overflow-hidden", className)}>
      {line ? <DitherGradient from={line} direction="down" cell={2} opacity={0.5} /> : null}
    </div>
  );
}

// 120px accent wash rising from the bottom of the page, under the footer.
export function FooterWash() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const accent = useTokenColor(el, "--color-accent");
  return (
    <div ref={setEl} aria-hidden="true" className="relative h-30 w-full overflow-hidden">
      {accent ? <DitherGradient from={accent} direction="up" cell={3} /> : null}
    </div>
  );
}

// The wash behind a work image placeholder (components/work/media-figure.tsx):
// a faint ink dither rising from the
// bottom, the same on every slot (Onur 2026-10-03: barely there, vertical,
// black and white). Fills its positioned parent. A span, so it is valid inside
// the buttons that open a figure.
export function PlaceholderWash() {
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  const ink = useTokenColor(el, "--color-fg");
  return (
    <span ref={setEl} aria-hidden="true" className="absolute inset-0 block">
      {ink ? <DitherGradient from={ink} direction="up" cell={3} opacity={0.14} /> : null}
    </span>
  );
}
