import { ItemLink } from "@/components/sections/item-link";
import type { WorkIndexRow } from "@/lib/work/index-groups";

// A hairline table: years · title · kind · →. The kind drops under 480px.
export function WorkTable({ rows }: { rows: WorkIndexRow[] }) {
  return (
    <ul className="type-body">
      {rows.map((row) => (
        <li
          key={row.href}
          className="grid grid-cols-[10ch_minmax(0,1fr)_2ch] gap-3 border-b py-1.5 last:border-b-0 min-[480px]:grid-cols-[10ch_minmax(0,1fr)_16ch_2ch]"
        >
          <span className="text-fg-muted">{row.years}</span>
          <ItemLink href={row.href} className="text-accent">
            {row.title}
          </ItemLink>
          <span className="hidden text-fg-muted min-[480px]:block">{row.kind}</span>
          <span aria-hidden="true" className="text-fg-muted">
            →
          </span>
        </li>
      ))}
    </ul>
  );
}
