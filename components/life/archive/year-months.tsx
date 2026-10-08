import { type YearGroup, countLabel } from "@/lib/life/archive";
import { TILE_ROW, TileRow } from "./tile-row";

// One year: its Doto heading, then one row per month (name and real count in
// the label column, the month's tiles beside it). `eager` applies to the
// first month only.
export function YearMonths({ group, noun, eager = 0 }: { group: YearGroup; noun: string; eager?: number }) {
  return (
    <section id={`year-${group.year}`} aria-labelledby={`year-${group.year}-heading`} className="scroll-mt-20">
      <div className={TILE_ROW}>
        <h2 id={`year-${group.year}-heading`} className="type-name">
          {group.year}
        </h2>
      </div>
      <div className="border-t">
        {group.months.map((month, index) => (
          <TileRow
            key={month.month}
            heading={month.label}
            lines={[countLabel(month.items.length, noun)]}
            items={month.items}
            eager={index === 0 ? eager : 0}
          />
        ))}
      </div>
    </section>
  );
}
