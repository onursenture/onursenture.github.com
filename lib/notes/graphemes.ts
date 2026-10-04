// Client-safe text helpers (no @atproto/api here: the admin composer imports
// this). Graphemes are what Bluesky counts: 👍🏽 is one.
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

export function graphemeCount(text: string): number {
  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const _ of segmenter.segment(text)) count++;
  return count;
}

// The first `max` graphemes of the trimmed text, with "…" when it was cut.
export function truncateGraphemes(text: string, max: number): string {
  const trimmed = text.trim();
  const parts = Array.from(segmenter.segment(trimmed), (part) => part.segment);
  if (parts.length <= max) return trimmed;
  return `${parts.slice(0, max).join("").trimEnd()}…`;
}
