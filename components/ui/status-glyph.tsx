import { cx } from "@/lib/cx";

// The S1 glyph set: ● ok (active, live, synced), ○ empty, ◐ late or
// partial, and ● in --color-danger for an error. × is the close action, not
// a status.
export type GlyphStatus = "ok" | "empty" | "late" | "error";

export const STATUS_GLYPHS: Record<GlyphStatus, string> = {
  ok: "●",
  empty: "○",
  late: "◐",
  error: "●",
};

// Set in Neue Haas Grotesk Text, where the three glyphs share one size.
// With a label, the glyph is announced as that word; without one it is
// decorative and the surrounding text must carry the meaning.
export function StatusGlyph({
  status,
  label,
  className,
}: {
  status: GlyphStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      data-status={status}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx("font-sans", status === "error" && "text-danger", className)}
    >
      {STATUS_GLYPHS[status]}
    </span>
  );
}
