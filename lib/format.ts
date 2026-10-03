// Dates render on prerendered pages, so they are absolute (a relative "2h
// ago" would go stale) and pinned to Onur's time zone for stable output.
const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "Europe/Istanbul",
});
const dateTimeFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function formatDate(iso: string): string {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? "" : dateFormat.format(time);
}

export function formatDateTime(iso: string): string {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? "" : dateTimeFormat.format(time);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Client-side only (RelativeTime): "just now", "12m ago", "5h ago", "3d ago",
// then the absolute date after 30 days. Future times (clock skew) count as
// just now.
export function formatRelative(iso: string, now: number): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const elapsed = now - time;
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 30 * DAY) return `${Math.floor(elapsed / DAY)}d ago`;
  return formatDate(iso);
}

// Client-side only (LiveClock): 24-hour HH:mm in an IANA time zone.
export function formatClock(time: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(time);
}
