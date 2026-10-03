import type { ReactNode } from "react";

// A page's title: a display headline with an optional mono meta line.
export function PageHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 px-4 pt-10 md:px-10 md:pt-14">
      <h1 className="type-name uppercase">{title}</h1>
      {meta ? <p className="type-meta text-fg-muted">{meta}</p> : null}
    </header>
  );
}
