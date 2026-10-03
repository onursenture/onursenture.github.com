import type { ReactNode } from "react";

// A page's title: a display headline with an optional mono meta line.
export function PageHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 pt-16 md:pt-24">
      <h1 className="type-display-64">{title}</h1>
      {meta ? <p className="type-mono-12 text-fg-muted">{meta}</p> : null}
    </header>
  );
}
