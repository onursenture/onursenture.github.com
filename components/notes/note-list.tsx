import { formatDate, formatMonthDay } from "@/lib/format";
import type { PublishedNote } from "@/lib/notes/types";
import { type NotesSide, notePathOn } from "@/lib/notes/views";
import { NoteItem } from "./note-item";

// Notes separated by hairlines. Links stay on the side being browsed.
// "month-day" only under a year label (/notes/); elsewhere the full date.
export function NoteList({ notes, side, dates }: { notes: PublishedNote[]; side: NotesSide; dates: "full" | "month-day" }) {
  return (
    <ul className="flex flex-col">
      {notes.map((note) => (
        <li key={note.tid} className="border-t py-4 first:border-t-0 first:pt-0 last:pb-0">
          <NoteItem note={note} href={notePathOn(note, side)} date={dates === "full" ? formatDate(note.publishedAt) : formatMonthDay(note.publishedAt)} />
        </li>
      ))}
    </ul>
  );
}
