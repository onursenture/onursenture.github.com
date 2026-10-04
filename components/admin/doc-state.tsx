import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import type { DocRow } from "@/lib/admin/overview";

// ○ repo · ● published 2h ago · ◐ draft · ◐ new · not live
export function DocState({ row }: { row: Pick<DocRow, "state" | "publishedAt"> }) {
  switch (row.state) {
    case "draft":
      return (
        <span>
          <StatusGlyph status="late" /> draft
        </span>
      );
    case "new":
      return (
        <span>
          <StatusGlyph status="late" /> new · not live
        </span>
      );
    case "published":
      return (
        <span>
          <StatusGlyph status="ok" /> published{row.publishedAt ? <> <RelativeTime iso={row.publishedAt} /></> : null}
        </span>
      );
    default:
      return (
        <span>
          <StatusGlyph status="empty" /> repo
        </span>
      );
  }
}
