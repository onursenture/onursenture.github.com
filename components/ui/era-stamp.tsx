import { cx } from "@/lib/cx";

// Places a project in its time: "● 2013 · iOS 6 · pre-flat". Inside a work
// index row the year column already shows the year, so pass the parts
// without it there.
export function EraStamp({
  parts,
  dot = true,
  className,
}: {
  parts: string[];
  dot?: boolean;
  className?: string;
}) {
  if (parts.length === 0) return null;
  return (
    <span className={cx("inline-flex items-center gap-1 type-mono-11 text-fg-muted", className)}>
      {dot ? (
        <span aria-hidden="true" className="font-sans">
          ●
        </span>
      ) : null}
      {parts.join(" · ")}
    </span>
  );
}
