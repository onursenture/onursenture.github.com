import type { ReactNode } from "react";
import type { View } from "@/lib/view/views";

// A page's title. In the dashboard it is the slim top bar of the content
// column (48px; 40px on mobile, under the Menu bar): title, a mono meta, and
// a right-hand context slot. The title stays on one line and truncates; the
// meta never squeezes it and is hidden below md. On the site it is a display
// headline.
export function PageHeader({
  view,
  title,
  meta,
  context,
}: {
  view: View;
  title: string;
  meta?: ReactNode;
  context?: ReactNode;
}) {
  if (view === "dashboard") {
    return (
      <header className="flex h-10 items-center justify-between gap-4 border-b px-4 md:h-12 md:px-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 title={title} className="min-w-0 truncate type-sans-14-medium">
            {title}
          </h1>
          {meta ? <span className="shrink-0 type-mono-12 whitespace-nowrap text-fg-muted max-md:hidden">{meta}</span> : null}
        </div>
        {context ? <div className="flex shrink-0 items-center gap-3 type-mono-12 text-fg-muted">{context}</div> : null}
      </header>
    );
  }
  return (
    <header className="flex flex-col gap-4 pt-16 md:pt-24">
      <h1 className="type-display-64">{title}</h1>
      {meta ? <p className="type-mono-12 text-fg-muted">{meta}</p> : null}
    </header>
  );
}
