import { ItemLink } from "@/components/sections/item-link";
import { OrgMark } from "@/components/ui/org-mark";
import { type ExperienceEntry, formatSpan } from "@/content/experience";
import { ORGS } from "@/content/orgs";

// Each role is a header line; its products are hairline rows underneath. A
// product links only when it has a page of its own.
export function ExperienceList({ entries }: { entries: ExperienceEntry[] }) {
  return (
    <ul className="flex flex-col gap-6 type-body">
      {entries.map((entry) => (
        <li key={entry.org}>
          <div className="flex items-baseline justify-between gap-4">
            <span>
              <OrgMark org={entry.org} /> <span className="text-fg">{ORGS[entry.org].name}</span>{" "}
              <span className="text-fg-muted">· {entry.role}</span>
            </span>
            <span className="shrink-0 type-meta text-fg-muted">{formatSpan(entry.start, entry.end)}</span>
          </div>
          {entry.children.length > 0 ? (
            <ul aria-label={`${ORGS[entry.org].name} work`} className="mt-2 grid grid-cols-[minmax(0,140px)_1fr] gap-x-4">
              {entry.children.map((child) => (
                <li key={child.title} className="col-span-2 grid grid-cols-subgrid border-t border-line py-1.5">
                  <span>
                    {child.href ? (
                      <ItemLink href={child.href} className="text-accent">
                        {child.title}
                      </ItemLink>
                    ) : (
                      <span className="text-fg">{child.title}</span>
                    )}
                  </span>
                  <span className="text-fg-muted">{child.note}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
