import { DataTable } from "@/components/ui/data-table";
import { RelativeTime } from "@/components/ui/relative-time";
import type { SourceStatus } from "@/lib/sources/health";
import { HealthGlyph, HealthLabel } from "./source-health";

// One row per external source: health glyph and name, status, last sync.
export function SourcesTable({ statuses }: { statuses: SourceStatus[] }) {
  return (
    <DataTable
      caption="Source sync status"
      rows={statuses}
      rowKey={(status) => status.id}
      columns={[
        {
          header: "Source",
          cell: (status) => (
            <span className="inline-flex items-center gap-2">
              <HealthGlyph status={status} />
              {status.label}
            </span>
          ),
        },
        { header: "Status", cell: (status) => <HealthLabel status={status} />, mono: true },
        {
          header: "Last sync",
          cell: (status) => (status.lastSuccessAt ? <RelativeTime iso={status.lastSuccessAt} /> : "never"),
          mono: true,
          align: "right",
        },
      ]}
    />
  );
}
