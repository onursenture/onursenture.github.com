"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { syncNowAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import type { SourceRow } from "@/lib/admin/sources";

export function SourcesPanel({ rows }: { rows: SourceRow[] | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!rows) return <p className="type-meta text-fg-muted">Database unavailable.</p>;

  function sync() {
    setMessage(null);
    start(async () => {
      const result = await syncNowAction();
      if (result.status === "ok") {
        const failed = result.results.filter((r) => r.status === "error").length;
        setMessage(failed ? `${failed} source${failed > 1 ? "s" : ""} failed` : "All sources synced");
        router.refresh();
      } else setMessage(result.status === "unauthorized" ? "Signed out — sign in again" : "Database unavailable");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="type-meta">
        {rows.map((row) => (
          <li key={row.id} className="grid grid-cols-[120px_1fr_auto] gap-x-4 border-t border-line py-1.5">
            <span className="text-fg">{row.label}</span>
            <span className="truncate text-fg-muted">
              {row.lastError ? (
                <span className="text-danger">
                  <StatusGlyph status="error" /> {row.lastError}
                </span>
              ) : row.lastSuccessAt ? (
                <>
                  <StatusGlyph status="ok" /> <RelativeTime iso={row.lastSuccessAt} />
                </>
              ) : (
                <>
                  <StatusGlyph status="empty" /> never synced
                </>
              )}
            </span>
            <span className="text-right tabular-nums text-fg-muted">{row.itemCount}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <Button onClick={sync} disabled={pending}>
          {pending ? "Syncing…" : "Sync now"}
        </Button>
        {message ? (
          <p role="status" className="type-meta text-fg-muted">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
