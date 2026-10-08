import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  // Mono, muted: numbers, dates, years, domains. Stays on one line.
  mono?: boolean;
  // Lets a mono cell wrap (names, which can be long) below xl.
  wrap?: boolean;
}

// A dense table with a real header row. When there are no rows it
// renders one empty-state row instead of an empty body.
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  empty = "Nothing here yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  caption?: string;
  empty?: string;
}) {
  return (
    // Focusable and named, so keyboard users can scroll a table wider than the screen (axe scrollable-region-focusable).
    <div tabIndex={0} role="region" aria-label={`${caption ?? "Table"} (scrolls sideways)`} className="overflow-x-auto">
      <table className="w-full border-collapse">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b">
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={cx(
                  "h-8 px-3 font-normal whitespace-nowrap type-label text-fg-muted",
                  column.align === "right" ? "text-right" : "text-left",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-9 px-3 type-meta text-fg-muted">
                <span aria-hidden="true" className="font-sans">
                  ○
                </span>{" "}
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="border-b last:border-b-0">
                {columns.map((column, columnIndex) => (
                  <td
                    key={columnIndex}
                    className={cx(
                      "h-9 px-3 align-middle",
                      // Text cells keep a readable width; on narrow screens
                      // the table scrolls sideways instead of squeezing them.
                      column.mono ? cx("type-meta text-fg-muted", column.wrap ? "xl:whitespace-nowrap" : "whitespace-nowrap") : "min-w-24 type-body",
                      column.align === "right" ? "text-right" : "text-left",
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
