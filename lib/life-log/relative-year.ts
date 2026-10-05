// tiyatrolar.com.tr shows only relative times ("5 ay önce"). The year is
// worked out from them at sync time, in Istanbul, which is the precision the
// Theatre archive shows (spec §2.4).
const istanbulDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function istanbulParts(at: Date): { y: number; m: number; d: number } {
  const [y, m, d] = istanbulDay.format(at).split("-").map(Number);
  return { y, m, d };
}

const MS = { saniye: 1_000, dakika: 60_000, saat: 3_600_000 } as const;

export function yearFromAgo(ago: string, now: Date): number | null {
  const text = ago.trim();
  if (text === "az önce") return istanbulParts(now).y;
  const match = /^(\d+)\s+(saniye|dakika|saat|gün|hafta|ay|yıl)\s+önce$/.exec(text);
  if (!match) return null;
  const n = Number(match[1]);
  const unit = match[2];
  if (unit === "saniye" || unit === "dakika" || unit === "saat") {
    return istanbulParts(new Date(now.getTime() - n * MS[unit])).y;
  }
  const { y, m, d } = istanbulParts(now);
  if (unit === "yıl") return y - n;
  // Calendar arithmetic on the Istanbul date, in UTC to avoid DST shifts.
  const date = new Date(Date.UTC(y, m - 1, d));
  if (unit === "gün") date.setUTCDate(date.getUTCDate() - n);
  if (unit === "hafta") date.setUTCDate(date.getUTCDate() - 7 * n);
  if (unit === "ay") date.setUTCMonth(date.getUTCMonth() - n);
  return date.getUTCFullYear();
}
