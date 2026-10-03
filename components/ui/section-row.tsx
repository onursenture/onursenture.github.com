import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

// One section on the Sprint 4 grid: a 200px label column, a content column of
// up to 480px (`wide` lets content take the action column too) and a
// right-aligned action. Below lg the three stack.
export function SectionRow({
  id,
  label,
  action,
  wide = false,
  children,
  "data-section": dataSection,
}: {
  id?: string;
  label: ReactNode;
  action?: ReactNode;
  wide?: boolean;
  children: ReactNode;
  "data-section"?: string;
}) {
  return (
    <section id={id} data-section={dataSection} className="scroll-mt-20">
      <div className="grid gap-4 px-4 py-8 md:px-10 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7 lg:py-[30px]">
        <div className="type-body text-fg">{label}</div>
        <div className={cx("min-w-0", wide && "lg:col-span-2")}>{children}</div>
        {action && !wide ? <div className="type-meta text-fg-muted lg:text-right">{action}</div> : null}
      </div>
    </section>
  );
}
