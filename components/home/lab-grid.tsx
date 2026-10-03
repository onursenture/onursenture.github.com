import { ItemLink } from "@/components/sections/item-link";
import { LabAvatar } from "@/components/ui/lab-avatar";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { isExternal } from "@/components/ui/text-link";
import type { LabEntry } from "@/content/lab-index";

const STATUS: Record<NonNullable<LabEntry["status"]>, { glyph: GlyphStatus; label: string }> = {
  live: { glyph: "ok", label: "live" },
  wip: { glyph: "late", label: "in progress" },
};

// Things Onur builds, three-up, each with a dither avatar from its name.
// Hidden while the list is empty.
export function LabGrid({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
      {entries.map((entry) => (
        <li key={entry.title} className="flex flex-col gap-1.5 type-body">
          <LabAvatar name={entry.title} />
          <span className="flex items-baseline gap-1.5">
            {entry.status ? <StatusGlyph status={STATUS[entry.status].glyph} label={STATUS[entry.status].label} /> : null}
            {entry.href ? (
              <ItemLink href={entry.href}>
                {entry.title}
                {isExternal(entry.href) ? <span aria-hidden="true"> ↗</span> : null}
              </ItemLink>
            ) : (
              <span>{entry.title}</span>
            )}
          </span>
          <span className="type-meta text-fg-muted">{entry.description}</span>
        </li>
      ))}
    </ul>
  );
}
