import { COVER_GRID, Cover, EAGER_TILES } from "@/components/ui/cover";
import { posterCrop } from "@/lib/life-log/films";
import type { Film } from "@/lib/sources/letterboxd";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";

// A row of posters with the year.
function Render({ data }: { data: Film[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className={COVER_GRID}>
      {data.map((film, index) => (
        <li key={film.link}>
          <a href={film.link} rel="noopener noreferrer" className="group flex flex-col gap-1">
            {/* The archive's 230×345 crop: the RSS poster is 600×900 for a 96px tile. */}
            <Cover src={posterCrop(film.poster)} alt="" width={96} priority={index < EAGER_TILES} className="mb-1" />
            <span className="type-label truncate text-fg group-hover:underline group-hover:underline-offset-[0.2em]">
              {film.title}
            </span>
            <span className="type-label truncate text-fg-muted">{film.year}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export const films: SectionDefinition<Film[]> = {
  id: "films",
  title: "Films",
  // The snapshot keeps the whole RSS window (it feeds the archive); the home
  // row shows the latest six.
  load: async () => {
    const view = await readSource("letterboxd");
    return { ...view, data: view.data.slice(0, 6) };
  },
  Render,
  source: "Letterboxd",
  href: "/life/films/",
};
