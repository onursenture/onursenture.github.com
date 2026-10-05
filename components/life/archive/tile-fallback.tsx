"use client";

import { useState } from "react";
import { DitherGradient } from "@/components/dither-kit/gradient";
import { useTokenColor } from "@/components/ui/use-token-color";
import { cx } from "@/lib/cx";

// An archive tile with no image: the accent dither rising from the bottom
// and the title's initial in Doto. Decorative; the caption names the item.
export function TileFallback({
  initial,
  shape = "poster",
  className,
}: {
  initial: string;
  shape?: "poster" | "wide";
  className?: string;
}) {
  const [el, setEl] = useState<HTMLSpanElement | null>(null);
  const accent = useTokenColor(el, "--color-accent");
  return (
    <span
      ref={setEl}
      aria-hidden="true"
      className={cx(
        "relative flex w-full items-center justify-center overflow-hidden bg-line",
        shape === "poster" ? "aspect-[2/3]" : "aspect-[16/10]",
        className,
      )}
    >
      <span className="absolute inset-0 block">
        {accent ? <DitherGradient from={accent} direction="up" cell={3} opacity={0.55} /> : null}
      </span>
      <span className="relative bg-bg px-1.5 py-0.5 type-name">{initial}</span>
    </span>
  );
}
