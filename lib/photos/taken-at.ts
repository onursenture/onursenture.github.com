import { utcToZoned } from "../notes/schedule";

// A photo's time taken (spec §1.1): wall-clock "YYYY-MM-DDTHH:mm:ss" with no
// zone, as EXIF DateTimeOriginal is. Fixed width, so it sorts as a string.
export const TAKEN_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

// The pattern lets 2026-02-30 or 0000-00-00 through; a round trip doesn't.
export function isTakenAt(value: string): boolean {
  if (!TAKEN_AT_PATTERN.test(value)) return false;
  const time = Date.parse(`${value}Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 19) === value;
}

// The Istanbul wall clock at `now`: the date of a photo without EXIF.
export function wallClock(now: Date): string {
  const { date, time } = utcToZoned(now.toISOString());
  return `${date}T${time}:${String(now.getUTCSeconds()).padStart(2, "0")}`;
}

// The date input gives a day; the time of day stays, since it orders
// same-day photos. Null for an invalid day.
export function withDay(takenAt: string, day: string): string | null {
  const next = `${day}${takenAt.slice(10)}`;
  return isTakenAt(next) ? next : null;
}
