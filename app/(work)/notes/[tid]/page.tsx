import type { Metadata } from "next";
import { NotePage } from "@/components/notes/note-page";
import { noteMetadata } from "@/lib/notes/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { PLACEHOLDER_TID, onSide } from "@/lib/notes/views";

// Work and both-side notes. Notes published later render on first visit and
// are cached with the notes tag. At least one param (cacheComponents): the
// placeholder TID is never a real note, so its page is a 404.
export async function generateStaticParams() {
  const tids = onSide(await getPublishedNotes(), "work").map((note) => ({ tid: note.tid }));
  return tids.length > 0 ? tids : [{ tid: PLACEHOLDER_TID }];
}

export async function generateMetadata({ params }: PageProps<"/notes/[tid]">): Promise<Metadata> {
  const { tid } = await params;
  const note = onSide(await getPublishedNotes(), "work").find((item) => item.tid === tid);
  return note ? noteMetadata(note) : {};
}

export default async function WorkNotePage({ params }: PageProps<"/notes/[tid]">) {
  return <NotePage side="work" tid={(await params).tid} />;
}
