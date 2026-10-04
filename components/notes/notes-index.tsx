import { notFound } from "next/navigation";
import { Fragment } from "react";
import { Empty } from "@/components/sections/empty";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { getPublishedNotes } from "@/lib/notes/read";
import { type NotesSide, groupByYear, onSide, pageOf, pagePath } from "@/lib/notes/views";
import { NoteList } from "./note-list";

// Draft copy (spec §3.3, §3.5): Onur approves it in the follow-ups.
const HEADER = {
  work: { href: "/", back: "← Home", line: "What I'm making, in short." },
  life: { href: "/life/", back: "← Life", line: "Off the clock." },
} as const;

// /notes/ and /life/notes/ (mockup A): a header row, then one row per year
// (the year in Doto in the label column), 30 notes per page, the pager in a
// row of its own after the last year.
export async function NotesIndex({ side, page }: { side: NotesSide; page: number }) {
  const slice = pageOf(onSide(await getPublishedNotes(), side), page);
  if (!slice) notFound();
  const header = HEADER[side];
  const groups = groupByYear(slice.items);
  const pager =
    slice.pages > 1 ? (
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {slice.page > 1 ? <ItemLink href={pagePath(side, slice.page - 1)}>← Newer notes</ItemLink> : null}
        {slice.page < slice.pages ? <ItemLink href={pagePath(side, slice.page + 1)}>Older notes →</ItemLink> : null}
      </div>
    ) : null;

  const rows = [
    <SectionRow
      key="header"
      labelAs="div"
      label={
        <ItemLink href={header.href} className="text-fg-muted">
          {header.back}
        </ItemLink>
      }
      // A plain <a>: the feed is XML, not a page next/link can navigate to.
      action={
        <a href="/feed.xml" className="hover:underline hover:underline-offset-[0.2em]">
          RSS
        </a>
      }
    >
      <h1 className="type-lead">
        Notes <span className="text-fg-muted">{header.line}</span>
      </h1>
    </SectionRow>,
    ...(groups.length === 0
      ? [
          <SectionRow key="empty" label={null}>
            <Empty>No notes yet.</Empty>
          </SectionRow>,
        ]
      : groups.map((group) => (
          <SectionRow
            key={group.year}
            id={`year-${group.year}`}
            label={<span className="type-name">{group.year}</span>}
          >
            <NoteList notes={group.notes} side={side} dates="month-day" />
          </SectionRow>
        ))),
    ...(pager
      ? [
          <SectionRow key="pager" label={null}>
            {pager}
          </SectionRow>,
        ]
      : []),
  ];

  return (
    <main className="pb-8">
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          {row}
        </Fragment>
      ))}
    </main>
  );
}
