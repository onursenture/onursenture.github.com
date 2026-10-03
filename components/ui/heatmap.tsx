import { cx } from "@/lib/cx";
import type { Contributions } from "@/lib/sources/github";

// GitHub's five levels (0–4) in the accent: an empty cell is the line colour,
// then the accent mixed into it at 25, 50 and 75%, then the full accent
// (Onur 2026-10-03: the greens clashed with the palette).
const LEVELS = [
  "bg-line",
  "bg-[color-mix(in_srgb,var(--color-accent)_25%,var(--color-line))]",
  "bg-[color-mix(in_srgb,var(--color-accent)_50%,var(--color-line))]",
  "bg-[color-mix(in_srgb,var(--color-accent)_75%,var(--color-line))]",
  "bg-accent",
];

// The sentence that names the figure and its period; the visible line and the
// heatmap's accessible name both use it so they can't drift.
export function contributionsLabel(total: number): string {
  return `${total.toLocaleString("en-US")} contributions in the last 12 months`;
}

// One column per week, Sunday on top. The first week is usually partial, so
// it is padded down to its first day's weekday.
export function Heatmap({ data }: { data: Contributions }) {
  const firstDay = data.weeks[0]?.days[0];
  const offset = firstDay ? new Date(`${firstDay.date}T00:00:00Z`).getUTCDay() : 0;
  return (
    <div className="overflow-x-auto">
      <div
        role="img"
        aria-label={contributionsLabel(data.total)}
        className="grid w-max grid-flow-col grid-rows-7 gap-[3px]"
      >
        {Array.from({ length: offset }, (_, i) => (
          <span key={`pad-${i}`} className="size-2.5" />
        ))}
        {data.weeks.flatMap((week) =>
          week.days.map((day) => (
            <span
              key={day.date}
              title={`${day.count} on ${day.date}`}
              className={cx("size-2.5", LEVELS[day.level] ?? LEVELS[0])}
            />
          )),
        )}
      </div>
    </div>
  );
}
