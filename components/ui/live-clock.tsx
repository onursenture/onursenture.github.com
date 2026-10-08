"use client";

import { formatClock } from "@/lib/format";
import { useNow } from "./use-now";

// HH:mm in a time zone, ticking each minute. Prerendered pages show --:--
// until hydration, so the HTML never carries a stale time. The place is
// visually hidden text: <time> may not carry an aria-label.
export function LiveClock({ timeZone, place }: { timeZone: string; place: string }) {
  const now = useNow();
  const time = now === null ? null : formatClock(now, timeZone);
  return (
    <>
      <span className="sr-only">{`Local time in ${place}: `}</span>
      <time data-testid="local-time" dateTime={time ?? undefined}>
        {time ?? "--:--"}
      </time>
    </>
  );
}
