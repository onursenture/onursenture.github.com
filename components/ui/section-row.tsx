import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// The row's grid, shared with the Life "Now" block so the two cannot drift:
// 200px label column, 480px content column, then the action column from lg.
export const ROW_GRID = "grid grid-cols-1 gap-4 px-4 py-8 md:px-10 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7 lg:py-[30px]";

// One section on the Sprint 4 grid: a 200px label column, a content column of
// up to 480px (`wide` lets content take the action column too, and from lg the
// action moves under the label) and a right-aligned action. Below lg the three
// stack: label, content, action.
export function SectionRow({
  id,
  label,
  labelAs: LabelTag = "h2",
  action,
  wide = false,
  children,
  "data-section": dataSection,
}: {
  id?: string;
  label: ReactNode;
  // The label is the section's heading, unless the content holds the page h1.
  labelAs?: "h2" | "div";
  action?: ReactNode;
  wide?: boolean;
  children: ReactNode;
  "data-section"?: string;
}) {
  return (
    <section id={id} data-section={dataSection} className="scroll-mt-20">
      <div className={ROW_GRID}>
        {action && wide ? (
          // A wide row's content takes the action column. From lg the action
          // sits under the label; below lg it follows the content (below).
          <div>
            <LabelTag className="type-body font-normal text-fg">{label}</LabelTag>
            <div className="mt-1 hidden type-meta text-fg-muted lg:block">{action}</div>
          </div>
        ) : label == null ? (
          // No label: keep the label column from lg, and leave no empty cell
          // (and gap) below lg.
          <div aria-hidden="true" className="hidden lg:block" />
        ) : (
          <LabelTag className="type-body font-normal text-fg">{label}</LabelTag>
        )}
        <div className={cx("min-w-0", wide && "lg:col-span-2")}>{children}</div>
        {action && wide ? <div className="type-meta text-fg-muted lg:hidden">{action}</div> : null}
        {action && !wide ? <div className="type-meta text-fg-muted lg:text-right">{action}</div> : null}
      </div>
    </section>
  );
}
