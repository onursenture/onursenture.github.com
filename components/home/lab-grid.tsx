import { ItemLink } from "@/components/sections/item-link";
import { isExternal } from "@/components/ui/text-link";
import type { LabEntry } from "@/content/lab-index";

// Things Onur builds, stacked one text row each (title, year, then the
// description); new entries go on the end. Hidden while the list is empty.
export function LabGrid({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="flex flex-col gap-4">
      {entries.map((entry) => (
        <li key={entry.title} className="flex flex-col gap-1 type-body">
          <span className="flex items-baseline gap-1.5">
            {entry.href ? (
              <ItemLink href={entry.href}>
                {entry.title}
                {isExternal(entry.href) ? <span aria-hidden="true"> ↗</span> : null}
              </ItemLink>
            ) : (
              <span>{entry.title}</span>
            )}
            {entry.year ? <span className="type-meta text-fg-muted">· {entry.year}</span> : null}
          </span>
          <span className="type-meta text-fg-muted">{entry.description}</span>
        </li>
      ))}
    </ul>
  );
}
