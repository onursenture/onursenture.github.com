import { Band } from "@/components/ui/band";
import { type IndexEntry, IndexRow } from "@/components/ui/index-row";
import type { GlyphStatus } from "@/components/ui/status-glyph";
import type { LabEntry } from "@/content/lab-index";

export const LAB_STATUS: Record<NonNullable<LabEntry["status"]>, { glyph: GlyphStatus; label: string }> = {
  live: { glyph: "ok", label: "live" },
  wip: { glyph: "late", label: "in progress" },
};

export function labIndexEntry(entry: LabEntry): IndexEntry {
  const status = entry.status ? LAB_STATUS[entry.status] : undefined;
  return {
    title: entry.title,
    meta: entry.description,
    years: entry.year,
    href: entry.href,
    status: status?.glyph,
    statusLabel: status?.label,
  };
}

// The home page's second index. Hidden while the list is empty; no "All →"
// until /lab ships (S5).
export function LabBand({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Band label="Lab" id="lab">
      {entries.map((entry) => (
        <IndexRow key={entry.title} entry={labIndexEntry(entry)} />
      ))}
    </Band>
  );
}
