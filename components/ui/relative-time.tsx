"use client";

import { formatDateTime, formatRelative } from "@/lib/format";
import { useNow } from "./use-now";

// "2h ago" once hydrated. The prerendered HTML carries the absolute time,
// which stays in the title for hover.
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const now = useNow();
  const absolute = formatDateTime(iso);
  return (
    <time dateTime={iso} title={absolute} className={className}>
      {now === null ? absolute : formatRelative(iso, now)}
    </time>
  );
}
