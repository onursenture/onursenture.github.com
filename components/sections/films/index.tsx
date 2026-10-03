import { Cover } from "@/components/ui/cover";
import { profile } from "@/content/profile";
import type { Film } from "@/lib/sources/letterboxd";
import { readSource } from "@/lib/sources/read";
import { formatRating } from "@/lib/sources/rating";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";

// A row of posters with rating and year.
function Render({ data }: { data: Film[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className="grid grid-cols-3 gap-x-4 gap-y-8 md:grid-cols-6 md:gap-x-6">
      {data.map((film) => (
        <li key={film.link}>
          <a href={film.link} rel="noopener noreferrer" className="group flex flex-col gap-2">
            <Cover src={film.poster} alt="" />
            <span className="type-body group-hover:underline group-hover:underline-offset-[0.2em]">
              {film.title}
            </span>
            <span className="type-meta text-fg-muted">
              {[formatRating(film.ratingValue), film.year].filter(Boolean).join(" · ")}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}


export const films: SectionDefinition<Film[]> = {
  id: "films",
  title: "Films",
  load: () => readSource("letterboxd"),
  Render,
  source: "Letterboxd",
  href: `https://letterboxd.com/${profile.social.letterboxd}/`,
};
