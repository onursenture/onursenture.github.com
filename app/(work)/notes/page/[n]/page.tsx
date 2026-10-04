import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesIndex } from "@/components/notes/notes-index";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { onSide, pageCount, parsePage } from "@/lib/notes/views";

// Pages 2 and on; page 1 is /notes/. Under cacheComponents this must return
// at least one param, so "2" stands in when there is a single page (its page
// is a 404 until there are more than 30 notes).
export async function generateStaticParams() {
  const pages = pageCount(onSide(await getPublishedNotes(), "work").length);
  return pages > 1 ? Array.from({ length: pages - 1 }, (_, i) => ({ n: String(i + 2) })) : [{ n: "2" }];
}

export async function generateMetadata({ params }: PageProps<"/notes/page/[n]">): Promise<Metadata> {
  return pageMetadata(`Notes, page ${(await params).n}`);
}

export default async function NotesPageN({ params }: PageProps<"/notes/page/[n]">) {
  const page = parsePage((await params).n);
  if (page === null || page < 2) notFound();
  return <NotesIndex side="work" page={page} />;
}
