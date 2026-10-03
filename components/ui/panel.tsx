import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// Columns a panel spans on the dashboard's 12-column grid. Below xl (1280px)
// every panel stacks full width: the dashboard already gives 240px to the
// sidebar, so before that the 4- and 6-column panels (Status, Sources,
// Writing, Films, Books) are too narrow for their rows and tables. At 1280px
// the narrowest are about 320px (4 columns, tables need ~265) and 488px
// (6 columns; the Books table needs ~487 and wraps its author names below
// xl to fit the stacked layout). Literal class names, so Tailwind can see
// them.
export type PanelSpan = 3 | 4 | 6 | 8 | 12;
const SPANS: Record<PanelSpan, string> = {
  3: "xl:col-span-3",
  4: "xl:col-span-4",
  6: "xl:col-span-6",
  8: "xl:col-span-8",
  12: "xl:col-span-12",
};

// The dashboard content grid: 12 columns, 16px gutters, one column below xl.
export function PanelGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-start gap-4 p-4 xl:grid-cols-12 md:p-6">{children}</div>;
}

// A dashboard container: a 36px header (title, optional count, right slot)
// over the body. Square, 1px --color-line border, --color-surface fill.
export function Panel({
  title,
  count,
  right,
  span = 12,
  id,
  className,
  children,
  "data-section": dataSection,
}: {
  title: string;
  count?: number | string;
  right?: ReactNode;
  span?: PanelSpan;
  id?: string;
  className?: string;
  children: ReactNode;
  "data-section"?: string;
}) {
  return (
    <section
      id={id}
      data-section={dataSection}
      className={cx("col-span-1 flex min-w-0 scroll-mt-16 flex-col border bg-surface", SPANS[span], className)}
    >
      <header className="flex h-9 shrink-0 items-center justify-between gap-3 border-b px-3">
        <h2 className="type-sans-13-medium">{title}</h2>
        <div className="flex items-center gap-3 type-mono-11 text-fg-muted">
          {count !== undefined ? <span>{count}</span> : null}
          {right}
        </div>
      </header>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
