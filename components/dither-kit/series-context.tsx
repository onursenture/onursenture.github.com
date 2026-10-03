"use client"

// Vendored from Dither Kit (https://www.tripwire.sh/r/core.json), MIT licence.
// Local changes: see components/dither-kit/README.md.

import { createContext, use } from "react"
import type { Seed } from "./palette"

export type SeriesContextValue = {
  dataKey: string
  seed: Seed
  dimmed: boolean
}

export const SeriesContext = createContext<SeriesContextValue | null>(null)

/** Boundary guard for series-scoped markers (`<Dot>`, `<ActiveDot>`). */
export function useSeries(part: string) {
  const ctx = use(SeriesContext)
  if (!ctx) {
    throw new Error(
      `<${part} /> must be rendered inside a series (e.g. <Area />).`
    )
  }
  return ctx
}
