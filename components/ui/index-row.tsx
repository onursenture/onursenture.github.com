import Link from "next/link";
import { cx } from "@/lib/cx";
import { visibleColumns } from "@/lib/index-columns";
import { EraStamp } from "./era-stamp";
import { type GlyphStatus, StatusGlyph } from "./status-glyph";
import { isExternal } from "./text-link";

export interface IndexEntry {
  title: string;
  // Inline fact after the title, e.g. "80+ components".
  meta?: string;
  years?: string;
  role?: string;
  // Era stamp parts without the year, e.g. "iOS 6 · pre-flat".
  era?: string;
  href?: string;
  // Optional leading glyph (the Lab index: ● live, ◐ wip) and its label.
  status?: GlyphStatus;
  statusLabel?: string;
}

// Which optional columns a row renders. A list passes what its entries use;
// a bare IndexRow keeps both.
export interface IndexColumns {
  years: boolean;
  role: boolean;
}

// Title span on the 12-column md grid: 12 minus the arrow (1), the year (2)
// and the role (3) when present. Literal class names, so Tailwind sees them.
const TITLE_SPAN = {
  "true-true": "md:col-span-6",
  "true-false": "md:col-span-9",
  "false-true": "md:col-span-8",
  "false-false": "md:col-span-11",
} as const;

// One row of the Swiss index: year | title + inline meta | role | →. Empty
// fields render nothing (no dashes, no placeholders). In a list, a column no
// entry fills is dropped (see IndexList), so titles start in the first
// column. With an href the whole row is the link and the title underlines on
// hover; without one it is plain text.
//
// Below md the row is a two-track grid, the title and a content-sized arrow,
// with year and role spanning the full row; a 12-column arrow cell would be
// narrower than the glyph at phone widths.
export function IndexRow({
  entry,
  columns = { years: true, role: true },
}: {
  entry: IndexEntry;
  columns?: IndexColumns;
}) {
  const { title, meta, years, role, era, href, status, statusLabel } = entry;
  const body = (
    <>
      {columns.years ? (
        <span className="col-span-2 type-mono-13 max-md:empty:hidden">{years}</span>
      ) : null}
      <span className={cx("col-span-1", TITLE_SPAN[`${columns.years}-${columns.role}`])}>
        {status ? <StatusGlyph status={status} label={statusLabel} className="mr-2 type-sans-20" /> : null}
        <span className={cx("type-sans-20", href && "group-hover:underline group-hover:underline-offset-[0.15em]")}>
          {title}
        </span>
        {meta ? <span className="ml-3 type-mono-12 text-fg-muted">{meta}</span> : null}
        {era ? (
          <span className="mt-1 block">
            <EraStamp parts={[era]} />
          </span>
        ) : null}
      </span>
      {columns.role ? (
        <span className="col-span-2 type-mono-13 text-fg-muted max-md:order-last max-md:empty:hidden md:col-span-3">
          {role}
        </span>
      ) : null}
      <span aria-hidden="true" className="col-span-1 text-right type-sans-20">
        {href ? "→" : null}
      </span>
    </>
  );
  const classes =
    "group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b py-6 md:grid-cols-12 md:gap-x-6";
  if (!href) return <div className={classes}>{body}</div>;
  return isExternal(href) ? (
    <a href={href} rel="noopener noreferrer" className={classes}>
      {body}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {body}
    </Link>
  );
}

// A list of rows that drops the year and role columns when no entry has a
// value for them.
export function IndexList({ entries }: { entries: IndexEntry[] }) {
  const shown = visibleColumns(entries, ["years", "role"]);
  const columns = { years: shown.includes("years"), role: shown.includes("role") };
  return (
    <>
      {entries.map((entry) => (
        <IndexRow key={entry.title} entry={entry} columns={columns} />
      ))}
    </>
  );
}
