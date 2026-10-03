// A rating as a plain number for display in mono: 3.5 → "3.5", 4 → "4".
// Letterboxd rates 0.5–5 in half steps, Goodreads 1–5. Unrated (null or 0)
// is an empty string, so callers show nothing.
export function formatRating(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return "";
  return String(Math.round(value * 10) / 10);
}
