import type { Metadata } from "next";
import { Fragment } from "react";
import { BootReadout } from "@/components/life/boot-readout";
import { Avatar } from "@/components/life/avatar";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { DitherRule } from "@/components/ui/dither";
import { ROW_GRID } from "@/components/ui/section-row";
import { getPhotos } from "@/lib/content/photos";
import { buildReadout } from "@/lib/life/readout";
import { pageMetadata } from "@/lib/metadata";
import { readSource } from "@/lib/sources/read";

export const metadata: Metadata = pageMetadata("Life");

export default async function LifePage() {
  const [films, books, articles, writing, github, photos] = await Promise.all([
    readSource("letterboxd"),
    readSource("goodreads"),
    readSource("instapaper"),
    readSource("writing"),
    readSource("github"),
    getPhotos(),
  ]);
  const lines = buildReadout({
    film: films.data[0],
    books: books.data.currentlyReading,
    article: articles.data[0],
    photo: photos[0],
    post: writing.data[0],
    contributions: github.data,
  });
  return (
    <main className="pb-8">
      <h1 className="sr-only">Life</h1>
      <section aria-label="Now" className={`${ROW_GRID} grid-cols-1`}>
        <Avatar />
        <BootReadout lines={lines} />
      </section>
      {lifeSections.map((section) => (
        <Fragment key={section.id}>
          <DitherRule className="mx-4 md:mx-10" />
          <SectionBlock section={section} />
        </Fragment>
      ))}
    </main>
  );
}
