import type { ReactNode } from "react";
import { MetaLabel } from "./meta-label";

// A dashboard metric tile.
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border bg-surface p-3">
      <MetaLabel as="dt">{label}</MetaLabel>
      <dd className="type-sans-28-medium">{value}</dd>
    </div>
  );
}

// Lays out Stat tiles in one row (stacking two per row on mobile).
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-4 md:auto-cols-fr md:grid-flow-col md:grid-cols-none">{children}</dl>
  );
}
