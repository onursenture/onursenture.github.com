import Link from "next/link";
import type { ReactNode } from "react";
import { isExternal } from "@/components/ui/text-link";
import { cx } from "@/lib/cx";

// A title link inside a list or table row: no arrow (the row is not a call
// to action), underlined on hover. External links never pass the referrer.
export function ItemLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const classes = cx("hover:underline hover:underline-offset-[0.2em]", className);
  return isExternal(href) ? (
    <a href={href} rel="noopener noreferrer" className={classes}>
      {children}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
