import Link from "next/link";
import { cx } from "@/lib/cx";

// The Films year index: every year with films (Doto) plus Undated.
export function YearIndex({ entries }: { entries: { label: string; href: string; current: boolean; doto: boolean }[] }) {
  return (
    <nav aria-label="Years">
      <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {entries.map((entry) => (
          <li key={entry.href}>
            <Link
              href={entry.href}
              aria-current={entry.current ? "page" : undefined}
              className={cx(
                entry.doto ? "type-name" : "type-body",
                entry.current ? "text-fg" : "text-fg-muted hover:text-fg hover:underline hover:underline-offset-[0.2em]",
              )}
            >
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
