// Scheduling (Sprint 9 spec §4.1, §5): quarter hours in Istanbul time. The
// browser sends a date and a time as typed; the server turns them into UTC.

export const NOTE_TIME_ZONE = "Europe/Istanbul";
const QUARTER_MS = 15 * 60_000;

export const QUARTER_TIMES: string[] = Array.from({ length: 96 }, (_, i) => {
  const hours = String(Math.floor(i / 4)).padStart(2, "0");
  const minutes = String((i % 4) * 15).padStart(2, "0");
  return `${hours}:${minutes}`;
});

function zonedParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(ms);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

// Minutes the zone is ahead of UTC at this instant.
function offsetMinutes(ms: number, timeZone: string): number {
  const p = zonedParts(ms, timeZone);
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60_000);
}

export function zonedToUtc(date: string, time: string, timeZone = NOTE_TIME_ZONE): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  const guess = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  // Twice, so an instant next to an offset change lands on the right side.
  const first = guess - offsetMinutes(guess, timeZone) * 60_000;
  return new Date(guess - offsetMinutes(first, timeZone) * 60_000);
}

export function utcToZoned(iso: string, timeZone = NOTE_TIME_ZONE): { date: string; time: string } {
  const p = zonedParts(new Date(iso).getTime(), timeZone);
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

// Istanbul's offset is a whole number of hours, so a UTC quarter hour is an
// Istanbul one.
export function isQuarterHour(date: Date): boolean {
  return date.getTime() % QUARTER_MS === 0;
}

export function nextQuarter(now: Date): Date {
  return new Date((Math.floor(now.getTime() / QUARTER_MS) + 1) * QUARTER_MS);
}

export function scheduleIssue(publishAt: Date, now: Date): string | null {
  if (Number.isNaN(publishAt.getTime())) return "Pick a date and a time.";
  if (!isQuarterHour(publishAt)) return "Pick a time on the quarter hour.";
  if (publishAt.getTime() <= now.getTime()) return "Pick a time in the future.";
  return null;
}
