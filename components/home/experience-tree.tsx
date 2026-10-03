import { ItemLink } from "@/components/sections/item-link";
import { type ExperienceEntry, formatSpan } from "@/content/experience";
import { ORGS } from "@/content/orgs";

// Orgs with their products branching underneath, like a file tree.
export function ExperienceTree({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <ul className="flex flex-col gap-3 type-body">
      {entries.map((entry) => (
        <li key={entry.org}>
          <div className="flex items-baseline justify-between gap-4">
            <span>
              {ORGS[entry.org].name} <span className="text-fg-muted">· {entry.role}</span>
            </span>
            <span className="shrink-0 type-meta text-fg-muted">{formatSpan(entry.start, entry.end)}</span>
          </div>
          {entry.children.length > 0 ? (
            <ul aria-label={`${ORGS[entry.org].name} work`}>
              {entry.children.map((child, index) => (
                <li key={child.title} className="grid grid-cols-[4ch_13ch_1fr] text-fg-muted">
                  <span aria-hidden="true">{index === entry.children.length - 1 ? "└─" : "├─"}</span>
                  {child.href ? (
                    <ItemLink href={child.href} className="text-accent">
                      {child.title}
                    </ItemLink>
                  ) : (
                    <span className="text-fg">{child.title}</span>
                  )}
                  <span>{child.note}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
