"use client";

import { formatClock } from "@/lib/format";
import { useNow } from "./use-now";

// HH:mm in a time zone, ticking each minute. Prerendered pages show --:--
// until hydration, so the HTML never carries a stale time.
export function LiveClock({ timeZone, place }: { timeZone: string; place: string }) {
  const now = useNow();
  const time = now === null ? null : formatClock(now, timeZone);
  return (
    <time aria-label={`Local time in ${place}`} dateTime={time ?? undefined}>
      {time ?? "--:--"}
    </time>
  );
}
