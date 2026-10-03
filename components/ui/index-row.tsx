import Link from "next/link";
import { cx } from "@/lib/cx";
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

// One row of the Swiss index: year | title + inline meta | role | →. Empty
// fields render nothing (no dashes, no placeholders) but keep their grid
// columns, so rows line up when S4 fills them in. With an href the whole row
// is the link and the title underlines on hover; without one it is plain text.
export function IndexRow({ entry }: { entry: IndexEntry }) {
  const { title, meta, years, role, era, href, status, statusLabel } = entry;
  const body = (
    <>
      <span className="col-span-12 type-mono-13 max-md:empty:hidden md:col-span-2">{years}</span>
      <span className="col-span-11 md:col-span-6">
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
      <span className="col-span-12 type-mono-13 text-fg-muted max-md:order-last max-md:empty:hidden md:col-span-3">
        {role}
      </span>
      <span aria-hidden="true" className="col-span-1 text-right type-sans-20">
        {href ? "→" : null}
      </span>
    </>
  );
  const classes = "group grid grid-cols-12 items-baseline gap-x-6 gap-y-1 border-b py-6";
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
