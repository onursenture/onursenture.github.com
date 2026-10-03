import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

// A link with a trailing →, underlined on hover. External links use → too
// (Neue Haas Grotesk has no ↗) and never pass the referrer or window.opener.
export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const content = (
    <>
      <span className="group-hover:underline group-hover:underline-offset-[0.2em]">{children}</span>
      <span aria-hidden="true"> →</span>
    </>
  );
  const classes = cx("group inline", className);
  return isExternal(href) ? (
    <a href={href} rel="noopener noreferrer" className={classes}>
      {content}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
