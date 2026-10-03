import { Band } from "@/components/ui/band";
import { DataTable } from "@/components/ui/data-table";
import { type IndexEntry, IndexList } from "@/components/ui/index-row";
import { Panel } from "@/components/ui/panel";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import type { LabEntry } from "@/content/lab-index";
import { visibleColumns } from "@/lib/index-columns";

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
      <IndexList entries={entries.map(labIndexEntry)} />
    </Band>
  );
}

// The same list as a dashboard panel. Also hidden while empty. The status
// glyph in the Project cell carries the status, so there is no Status column,
// and Year is dropped while no entry has one.
export function LabPanel({ entries }: { entries: LabEntry[] }) {
  if (entries.length === 0) return null;
  const showYear = visibleColumns(entries, ["year"]).length > 0;
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
          ...(showYear ? [{ header: "Year", cell: (entry: LabEntry) => entry.year ?? "", mono: true }] : []),
        ]}
      />
    </Panel>
  );
}
