import Link from "next/link";
import type { ReactNode } from "react";
import { Picture } from "@/components/picture";
import { Band } from "@/components/ui/band";
import { Cover } from "@/components/ui/cover";
import { MetaLabel } from "@/components/ui/meta-label";
import { getPhotos } from "@/lib/content/photos";
import { readSource } from "@/lib/sources/read";
import { stars } from "@/lib/sources/stars";

// Four columns at md, two below, inside the 1200px container.
const PHOTO_SIZES = "(min-width: 1248px) 282px, (min-width: 768px) calc((100vw - 120px) / 4), calc((100vw - 48px) / 2)";

function Tile({
  label,
  href,
  media,
  title,
  detail,
}: {
  label: string;
  href: string;
  media: ReactNode;
  title?: string;
  detail?: string;
}) {
  return (
    <Link href={href} data-tile={label} className="group flex min-w-0 flex-col gap-3">
      <MetaLabel>{label}</MetaLabel>
      {media}
      <span className="flex flex-col gap-1">
        {title ? (
          <span className="type-sans-16 group-hover:underline group-hover:underline-offset-[0.2em]">{title}</span>
        ) : null}
        {detail ? <span className="type-mono-12 text-fg-muted">{detail}</span> : null}
      </span>
    </Link>
  );
}

// The home page's personal strip: what Onur is reading, the latest film,
// the newest photo and the latest saved article. Each tile links to its
// section on /life/; an empty source drops its tile.
export async function OffTheClock() {
  const [books, films, articles, photos] = await Promise.all([
    readSource("goodreads"),
    readSource("letterboxd"),
    readSource("instapaper"),
    getPhotos(),
  ]);
  const book = books.data.currentlyReading[0];
  const film = films.data[0];
  const photo = photos[0];
  const article = articles.data[0];

  const tiles = [
    book ? (
      <Tile
        key="book"
        label="Reading"
        href="/life/#books"
        media={<Cover src={book.cover} alt="" />}
        title={book.title}
        detail={book.author}
      />
    ) : null,
    film ? (
      <Tile
        key="film"
        label="Watched"
        href="/life/#films"
        media={<Cover src={film.poster} alt="" />}
        title={film.title}
        detail={stars(film.ratingValue)}
      />
    ) : null,
    photo ? (
      <Tile
        key="photo"
        label="Photo"
        href="/life/#photos"
        media={
          <Picture image={photo.image} alt="" sizes={PHOTO_SIZES} className="aspect-[2/3] w-full object-cover" />
        }
        title={photo.title}
        detail={photo.camera}
      />
    ) : null,
    article ? (
      <Tile
        key="article"
        label="Saved"
        href="/life/#articles"
        media={
          <span className="flex aspect-[2/3] flex-col justify-end border bg-surface p-4">
            <span className="type-sans-20 group-hover:underline group-hover:underline-offset-[0.2em]">
              {article.title}
            </span>
          </span>
        }
        detail={[article.domain, article.minutes ? `${article.minutes} min` : ""].filter(Boolean).join(" · ")}
      />
    ) : null,
  ].filter(Boolean);

  if (tiles.length === 0) return null;
  return (
    <Band label="Off the clock" href="/life/" linkLabel="Life" id="off-the-clock">
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">{tiles}</div>
    </Band>
  );
}
