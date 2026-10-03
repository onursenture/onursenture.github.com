import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { type GlyphStatus, StatusGlyph } from "./status-glyph";

// Mono uppercase label: section headers, column labels, small facts.
export function MetaLabel({
  children,
  status,
  as: Tag = "span",
  className,
}: {
  children: ReactNode;
  status?: GlyphStatus;
  as?: "span" | "p" | "h2" | "h3" | "dt";
  className?: string;
}) {
  return (
    <Tag
      className={cx(
        "inline-flex items-center gap-1.5 type-mono-11 tracking-[0.02em] text-fg-muted uppercase",
        className,
      )}
    >
      {status ? <StatusGlyph status={status} /> : null}
      {children}
    </Tag>
  );
}
