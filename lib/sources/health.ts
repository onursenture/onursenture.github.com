import type { SourceId } from "./types";

// What the public pages know about a source's freshness. Error details stay
// admin-only (S7), so there is no public error state.
export interface SourceStatus {
  id: SourceId;
  label: string;
  intervalMinutes: number;
  // ISO timestamp of the last successful sync, null if never synced.
  lastSuccessAt: string | null;
}

// ok: synced within 2× its interval. late: synced, but longer ago. never:
// no successful sync yet.
export type Health = "ok" | "late" | "never";

export const HEALTH_LABELS: Record<Health, string> = {
  ok: "synced",
  late: "late",
  never: "never synced",
};

// `now` is null while prerendering and before hydration; until the client
// knows the time, any past sync counts as ok.
export function sourceHealth(lastSuccessAt: string | null, intervalMinutes: number, now: number | null): Health {
  const time = lastSuccessAt ? Date.parse(lastSuccessAt) : NaN;
  if (Number.isNaN(time)) return "never";
  if (now === null) return "ok";
  return now - time <= 2 * intervalMinutes * 60_000 ? "ok" : "late";
}

export interface HealthSummary {
  ok: number;
  total: number;
  // The most recent successful sync across all sources.
  latest: string | null;
  // ok when every source is ok, never when none ever synced, else late.
  overall: Health;
}

export function summarizeHealth(statuses: SourceStatus[], now: number | null): HealthSummary {
  const healths = statuses.map((s) => sourceHealth(s.lastSuccessAt, s.intervalMinutes, now));
  const ok = healths.filter((h) => h === "ok").length;
  const synced = statuses.map((s) => s.lastSuccessAt).filter((at): at is string => at !== null);
  const latest = synced.length > 0 ? synced.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b)) : null;
  const overall: Health =
    ok === statuses.length ? "ok" : healths.every((h) => h === "never") ? "never" : "late";
  return { ok, total: statuses.length, latest, overall };
}
