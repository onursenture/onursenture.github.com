"use client";

import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

// Ticks on each wall-clock minute.
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, MINUTE - (Date.now() % MINUTE));
  };
  schedule();
  return () => clearTimeout(timer);
}

// Rounded to the minute so the snapshot is stable between ticks.
function getSnapshot(): number {
  return Math.floor(Date.now() / MINUTE) * MINUTE;
}

// Pages are prerendered, so the server (and hydration) has no "now".
function getServerSnapshot(): null {
  return null;
}

// The current time in ms, to the minute; null until hydrated.
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
