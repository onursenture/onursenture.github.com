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
