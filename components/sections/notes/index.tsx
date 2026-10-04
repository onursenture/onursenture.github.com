import { NoteList } from "@/components/notes/note-list";
import { getPublishedNotes } from "@/lib/notes/read";
import type { PublishedNote } from "@/lib/notes/types";
import { onSide } from "@/lib/notes/views";
import type { SectionDefinition } from "../types";

function Render({ data }: { data: PublishedNote[] }) {
  return <NoteList notes={data} side="life" dates="full" />;
}

// The latest three Life notes (and both-side ones) on /life/. app/life/page.tsx
// leaves the section out while there are none.
export const notes: SectionDefinition<PublishedNote[]> = {
  id: "notes",
  title: "Notes",
  load: async () => ({ data: onSide(await getPublishedNotes(), "life").slice(0, 3), lastSuccessAt: null }),
  Render,
  href: "/life/notes/",
};
