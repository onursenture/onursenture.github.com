import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

// A link with a trailing arrow, underlined on hover: → inside the site, ↗
// when it leaves (Sprint 4 lifted the S3 ban; Plex has the glyph). A
// non-breaking space keeps the arrow with the last word. External links
// never pass the referrer or window.opener.
export function TextLink({
  href,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  // Replaces the accessible name when several links share the same visible text.
  ariaLabel?: string;
}) {
  const external = isExternal(href);
  const content = (
    <>
      <span className="group-hover:underline group-hover:underline-offset-[0.2em]">{children}</span>
      <span aria-hidden="true">{external ? "\u00a0\u2197" : "\u00a0\u2192"}</span>
    </>
  );
  const classes = cx("group inline", className);
  return external ? (
    <a href={href} rel="noopener noreferrer" aria-label={ariaLabel} className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href} aria-label={ariaLabel} className={classes}>
      {content}
    </Link>
  );
}
