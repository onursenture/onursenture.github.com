import type { Metadata } from "next";
import { Fragment } from "react";
import { BootReadout } from "@/components/life/boot-readout";
import { Avatar } from "@/components/life/avatar";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { DitherRule } from "@/components/ui/dither";
import { ROW_GRID } from "@/components/ui/section-row";
import { getPhotos } from "@/lib/content/photos";
import { latestPlays } from "@/lib/life/archive";
import { buildReadout } from "@/lib/life/readout";
import { readLifeLog } from "@/lib/life-log/read";
import { pageMetadata } from "@/lib/metadata";
import { getPublishedNotes } from "@/lib/notes/read";
import { notePathOn, noteTitle, onSide } from "@/lib/notes/views";
import { readSource } from "@/lib/sources/read";

export const metadata: Metadata = pageMetadata("Life");

export default async function LifePage() {
  const [films, books, articles, writing, github, photos, allNotes, theatreRows] = await Promise.all([
    readSource("letterboxd"),
    readSource("goodreads"),
    readSource("instapaper"),
    readSource("writing"),
    readSource("github"),
    getPhotos(),
    getPublishedNotes(),
    readLifeLog("theatre"),
  ]);
  const [latestPlay] = latestPlays(theatreRows, 1);
  const lifeNotes = onSide(allNotes, "life");
  const latestNote = lifeNotes[0];
  const lines = buildReadout({
    film: films.data[0],
    play: latestPlay ? { title: latestPlay.title, link: latestPlay.href } : undefined,
    books: books.data.currentlyReading,
    article: articles.data[0],
    photo: photos[0],
    note: latestNote ? { text: noteTitle(latestNote), href: notePathOn(latestNote, "life") } : undefined,
    post: writing.data[0],
    contributions: github.data,
  });
  return (
    <main className="pb-8">
      <h1 className="sr-only">Life</h1>
      <section aria-label="Now" className={ROW_GRID}>
        <Avatar />
        <BootReadout lines={lines} />
      </section>
      {lifeSections
        .filter((section) => section.id !== "notes" || lifeNotes.length > 0)
        // w00f.org has no posts yet: the Writing row appears with the first one.
        .filter((section) => section.id !== "writing" || writing.data.length > 0)
        .map((section) => (
          <Fragment key={section.id}>
            <DitherRule className="mx-4 md:mx-10" />
            <SectionBlock section={section} />
          </Fragment>
        ))}
    </main>
  );
}
