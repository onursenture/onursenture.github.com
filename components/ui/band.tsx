import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { MetaLabel } from "./meta-label";
import { TextLink } from "./text-link";

// A full-width site section: a top rule, a header row (label · source on the
// left, an optional "All →" link on the right), then the content.
export function Band({
  label,
  source,
  href,
  linkLabel = "All",
  id,
  className,
  children,
  "data-section": dataSection,
}: {
  label: string;
  source?: string;
  href?: string;
  linkLabel?: string;
  id?: string;
  className?: string;
  children: ReactNode;
  "data-section"?: string;
}) {
  return (
    <section id={id} data-section={dataSection} className={cx("scroll-mt-20 border-t pt-4", className)}>
      <header className="mb-8 flex items-baseline justify-between gap-6">
        <MetaLabel as="h2">
          {label}
          {source ? <span>· {source}</span> : null}
        </MetaLabel>
        {href ? (
          <TextLink href={href} className="type-mono-11 tracking-[0.02em] uppercase">
            {linkLabel}
          </TextLink>
        ) : null}
      </header>
      {children}
    </section>
  );
}
