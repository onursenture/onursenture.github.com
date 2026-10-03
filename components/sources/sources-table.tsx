"use client";

import { DataTable } from "@/components/ui/data-table";
import { RelativeTime } from "@/components/ui/relative-time";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { useNow } from "@/components/ui/use-now";
import { HEALTH_LABELS, type Health, type SourceStatus, sourceHealth } from "@/lib/sources/health";

const GLYPHS: Record<Health, GlyphStatus> = { ok: "ok", late: "late", never: "empty" };

// One row per external source: health glyph and name, status, last sync.
export function SourcesTable({ statuses }: { statuses: SourceStatus[] }) {
  // Health depends on the current time, so it is computed on the client.
  const now = useNow();
  const healthOf = (status: SourceStatus) => sourceHealth(status.lastSuccessAt, status.intervalMinutes, now);
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
              <StatusGlyph status={GLYPHS[healthOf(status)]} />
              {status.label}
            </span>
          ),
        },
        {
          header: "Status",
          cell: (status) => {
            const health = healthOf(status);
            return <span data-health={health}>{HEALTH_LABELS[health]}</span>;
          },
          mono: true,
        },
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
