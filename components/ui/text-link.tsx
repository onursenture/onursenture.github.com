import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

// A link with a trailing arrow, underlined on hover: → inside the site, ↗
// when it leaves (Sprint 4 lifted the S3 ban; Plex has the glyph). A
// non-breaking space keeps the arrow with the last word. External links
// never pass the referrer or window.opener. An internal href that names a
// file (/onur.md, /resume.pdf) is a route handler, not a page, so it gets a
// plain <a> instead of next/link's client navigation.
export function TextLink({
  href,
  children,
  className,
  ariaLabel,
  underline = "hover",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  // Replaces the accessible name when several links share the same visible text.
  ariaLabel?: string;
  // "always" for a link inside running text, where colour alone can't mark it (WCAG 1.4.1).
  underline?: "hover" | "always";
}) {
  const external = isExternal(href);
  const file = !external && /\.[a-z0-9]+$/i.test(href.split("#")[0]);
  const content = (
    <>
      <span
        className={underline === "always" ? "underline decoration-1 underline-offset-[0.2em]" : "group-hover:underline group-hover:underline-offset-[0.2em]"}
      >
        {children}
      </span>
      <span aria-hidden="true">{external ? "\u00a0\u2197" : "\u00a0\u2192"}</span>
    </>
  );
  const classes = cx("group inline", className);
  return external || file ? (
    <a href={href} rel={external ? "noopener noreferrer" : undefined} aria-label={ariaLabel} className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href} aria-label={ariaLabel} className={classes}>
      {content}
    </Link>
  );
}
