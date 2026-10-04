import type { Metadata } from "next";
import { NotePage } from "@/components/notes/note-page";
import { noteMetadata } from "@/lib/notes/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { PLACEHOLDER_TID, onSide } from "@/lib/notes/views";

// Life and both-side notes; a both-side note's canonical URL is its Work page
// (noteMetadata).
export async function generateStaticParams() {
  const tids = onSide(await getPublishedNotes(), "life").map((note) => ({ tid: note.tid }));
  return tids.length > 0 ? tids : [{ tid: PLACEHOLDER_TID }];
}

export async function generateMetadata({ params }: PageProps<"/life/notes/[tid]">): Promise<Metadata> {
  const { tid } = await params;
  const note = onSide(await getPublishedNotes(), "life").find((item) => item.tid === tid);
  return note ? noteMetadata(note) : {};
}

export default async function LifeNotePage({ params }: PageProps<"/life/notes/[tid]">) {
  return <NotePage side="life" tid={(await params).tid} />;
}
