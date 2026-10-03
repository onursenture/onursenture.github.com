// A rating as stars: 3.5 → "★★★½", 4 → "★★★★". Letterboxd rates 0.5–5 in
// half steps, Goodreads 1–5. Unrated (null or 0) is an empty string.
export function stars(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return "";
  const halves = Math.round(Math.min(value, 5) * 2);
  return "★".repeat(Math.floor(halves / 2)) + (halves % 2 === 1 ? "½" : "");
}
