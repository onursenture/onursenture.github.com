import Link from "next/link";
import type { PublishedNote } from "@/lib/notes/types";
import { LinkCard } from "./link-card";
import { NoteImages } from "./note-images";
import { NoteText } from "./note-text";

// One note in a list (mockup A, "stream"): the text, its attachment, then the
// muted date linking to the note's page.
export function NoteItem({ note, href, date }: { note: PublishedNote; href: string; date: string }) {
  const embed = note.embed;
  return (
    <article lang={note.lang === "tr" ? "tr" : undefined} className="flex flex-col gap-2 type-body">
      <NoteText text={note.text} />
      {embed?.kind === "images" && embed.images.length > 0 ? <NoteImages images={embed.images} /> : null}
      {embed?.kind === "link" ? <LinkCard card={embed} /> : null}
      <p className="type-meta">
        <Link href={href} className="text-fg-muted hover:underline hover:underline-offset-[0.2em]">
          <time dateTime={note.publishedAt}>{date}</time>
        </Link>
      </p>
    </article>
  );
}
