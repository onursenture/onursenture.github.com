import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// A square status chip. Inverted for "live"; danger only for errors (the one
// place --color-danger-bg appears).
export function Chip({
  tone = "inverted",
  children,
}: {
  tone?: "inverted" | "danger";
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center px-2 type-label",
        tone === "inverted" ? "bg-fg text-bg" : "bg-danger-bg text-danger",
      )}
    >
      {children}
    </span>
  );
}
