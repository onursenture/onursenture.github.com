import { Band } from "@/components/ui/band";
import { DataTable } from "@/components/ui/data-table";
import { type IndexEntry, IndexRow } from "@/components/ui/index-row";
import { Panel } from "@/components/ui/panel";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
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

// The same list as a dashboard panel. Also hidden while empty.
export function LabPanel({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Panel title="Lab" count={entries.length} id="lab">
      <DataTable
        caption="Lab"
        rows={entries}
        rowKey={(entry) => entry.title}
        columns={[
          {
            header: "Project",
            cell: (entry) => (
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                {entry.status ? (
                  <StatusGlyph status={LAB_STATUS[entry.status].glyph} label={LAB_STATUS[entry.status].label} />
                ) : null}
                {entry.href ? <TextLink href={entry.href}>{entry.title}</TextLink> : entry.title}
              </span>
            ),
          },
          { header: "Description", cell: (entry) => entry.description },
          { header: "Year", cell: (entry) => entry.year ?? "", mono: true },
          { header: "Status", cell: (entry) => entry.status ?? "", mono: true },
        ]}
      />
    </Panel>
  );
}
