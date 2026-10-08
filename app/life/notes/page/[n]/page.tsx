import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesIndex } from "@/components/notes/notes-index";
import { DESCRIPTIONS } from "@/content/descriptions";
import { describedMetadata } from "@/lib/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { onSide, pageCount, parsePage } from "@/lib/notes/views";

// As /notes/page/[n]/, on the Life side.
export async function generateStaticParams() {
  const pages = pageCount(onSide(await getPublishedNotes(), "life").length);
  return pages > 1 ? Array.from({ length: pages - 1 }, (_, i) => ({ n: String(i + 2) })) : [{ n: "2" }];
}

export async function generateMetadata({ params }: PageProps<"/life/notes/page/[n]">): Promise<Metadata> {
  return describedMetadata(`Life notes, page ${(await params).n}`, DESCRIPTIONS.lifeNotes);
}

export default async function LifeNotesPageN({ params }: PageProps<"/life/notes/page/[n]">) {
  const page = parsePage((await params).n);
  if (page === null || page < 2) notFound();
  return <NotesIndex side="life" page={page} />;
}
