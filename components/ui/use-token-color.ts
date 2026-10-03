"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Rgb } from "@/components/dither-kit/palette";

export function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace(/^#/, "");
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

// Tokens no longer change at runtime (the Work side is light only and the
// Life side is always dark), so there is nothing to subscribe to: the value
// is read once the element exists.
function subscribe() {
  return () => {};
}

// A colour token read from the element's computed style, so a subtree that
// redefines it (the Life side) gets its own value. Pass the element from a
// callback ref held in state (`const [el, setEl] = useState(null)` and
// `ref={setEl}`): null until mounted, so the canvas never paints on the
// server.
export function useTokenColor(element: HTMLElement | null, token: `--color-${string}`): Rgb | null {
  const value = useSyncExternalStore(
    subscribe,
    () => (element ? getComputedStyle(element).getPropertyValue(token) : ""),
    () => "",
  );
  return useMemo(() => parseHex(value), [value]);
}
