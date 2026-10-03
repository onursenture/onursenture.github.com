"use client";

import { RelativeTime } from "@/components/ui/relative-time";
import { type GlyphStatus, StatusGlyph } from "@/components/ui/status-glyph";
import { useNow } from "@/components/ui/use-now";
import { type Health, type SourceStatus, summarizeHealth } from "@/lib/sources/health";

const GLYPHS: Record<Health, GlyphStatus> = { ok: "ok", late: "late", never: "empty" };

// Health depends on the current time, so it is computed on the client.

// "● 5/5 synced · 12m ago" under the sidebar toggles.
export function SyncLine({ statuses }: { statuses: SourceStatus[] }) {
  const summary = summarizeHealth(statuses, useNow());
  return (
    <p data-testid="sync-line" className="flex flex-wrap items-center gap-x-1.5 type-mono-11 text-fg-muted">
      <StatusGlyph status={GLYPHS[summary.overall]} />
      <span>
        {summary.ok}/{summary.total} synced
      </span>
      {summary.latest ? (
        <>
          <span aria-hidden="true">·</span>
          <RelativeTime iso={summary.latest} />
        </>
      ) : null}
    </p>
  );
}
