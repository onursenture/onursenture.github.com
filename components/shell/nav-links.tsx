"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";
import { type NavItem, isActive } from "@/lib/nav";

// The same list at two densities: the site top bar (Text 14) and the
// dashboard sidebar or mobile menu (Text 13, full width). Hover underlines;
// the active item is inverted.
export function NavLinks({ items, placement }: { items: NavItem[]; placement: "bar" | "list" }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main">
      <ul className={placement === "bar" ? "flex items-center gap-1" : "flex flex-col"}>
        {items.map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center",
                  placement === "bar" ? "h-7 px-2 type-sans-14" : "h-8 w-full px-3 type-sans-13",
                  active ? "bg-fg text-bg" : "hover:underline hover:underline-offset-[0.2em]",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
