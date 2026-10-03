// Vendored from Dither Kit (https://www.tripwire.sh/r/core.json), MIT licence.
// Local changes: see components/dither-kit/README.md.
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Tailwind-aware className combiner — local copy so the chart pack is
 * self-contained and portable as a registry. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
