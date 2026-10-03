import type { Metadata } from "next";
import { Fragment } from "react";
import { BootReadout } from "@/components/life/boot-readout";
import { DitherPortrait } from "@/components/life/dither-portrait";
import { lifeSections } from "@/components/sections/life";
import { SectionBlock } from "@/components/sections/section-block";
import { DitherRule } from "@/components/ui/dither";
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
    book: books.data.currentlyReading[0],
    article: articles.data[0],
    photo: photos[0],
    post: writing.data[0],
    contributions: github.data,
  });
  return (
    <main className="pb-8">
      <h1 className="sr-only">Life</h1>
      <section aria-label="Now" className="mx-auto grid max-w-[640px] gap-6 px-4 py-10 sm:grid-cols-[96px_1fr] md:py-14">
        <DitherPortrait />
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
