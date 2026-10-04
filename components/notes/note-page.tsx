import { notFound } from "next/navigation";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { formatDate, formatNoteStamp } from "@/lib/format";
import { getPublishedNotes } from "@/lib/notes/read";
import { type NotesSide, adjacentNotes, notePathOn, notesBase, noteTitle, onSide } from "@/lib/notes/views";
import { LinkCard } from "./link-card";
import { NoteImages } from "./note-images";
import { NoteText } from "./note-text";

// A note's own page (spec §3.4): the text at the lead size (regular weight,
// like the mockup), images whole, the date and time, then the newer and older
// note on the same side. A note that isn't on this side is a 404.
export async function NotePage({ side, tid }: { side: NotesSide; tid: string }) {
  const notes = onSide(await getPublishedNotes(), side);
  const note = notes.find((item) => item.tid === tid);
  if (!note) notFound();
  const { newer, older } = adjacentNotes(notes, tid);
  const embed = note.embed;
  return (
    <main className="pb-8">
      <SectionRow
        labelAs="div"
        label={
          <ItemLink href={notesBase(side)} className="text-fg-muted">
            ← Notes
          </ItemLink>
        }
      >
        <article lang={note.lang === "tr" ? "tr" : undefined} className="flex flex-col gap-3">
          <h1 className="sr-only">Note from {formatDate(note.publishedAt)}</h1>
          <NoteText text={note.text} className="type-lead" style={{ fontWeight: 400 }} />
          {embed?.kind === "images" && embed.images.length > 0 ? <NoteImages images={embed.images} full /> : null}
          {embed?.kind === "link" ? <LinkCard card={embed} /> : null}
          <p className="type-meta text-fg-muted">
            <time dateTime={note.publishedAt}>{formatNoteStamp(note.publishedAt)}</time>
          </p>
        </article>
      </SectionRow>
      {newer || older ? (
        <>
          <DitherRule className="mx-4 md:mx-10" />
          <SectionRow label="More">
            <div className="flex flex-col gap-2 type-body sm:flex-row sm:justify-between sm:gap-6">
              {newer ? <ItemLink href={notePathOn(newer, side)}>← {noteTitle(newer)}</ItemLink> : <span />}
              {older ? (
                <ItemLink href={notePathOn(older, side)} className="sm:text-right">
                  {noteTitle(older)} →
                </ItemLink>
              ) : null}
            </div>
          </SectionRow>
        </>
      ) : null}
    </main>
  );
}
