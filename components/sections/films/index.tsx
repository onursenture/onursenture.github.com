import { Cover } from "@/components/ui/cover";
import { DataTable } from "@/components/ui/data-table";
import { profile } from "@/content/profile";
import { formatDate } from "@/lib/format";
import type { Film } from "@/lib/sources/letterboxd";
import { readSource } from "@/lib/sources/read";
import { formatRating } from "@/lib/sources/rating";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

// A row of posters with rating and year.
function Site({ data }: { data: Film[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className="grid grid-cols-3 gap-x-4 gap-y-8 md:grid-cols-6 md:gap-x-6">
      {data.map((film) => (
        <li key={film.link}>
          <a href={film.link} rel="noopener noreferrer" className="group flex flex-col gap-2">
            <Cover src={film.poster} alt="" />
            <span className="type-sans-14 group-hover:underline group-hover:underline-offset-[0.2em]">
              {film.title}
            </span>
            <span className="type-mono-12 text-fg-muted">
              {[formatRating(film.ratingValue), film.year].filter(Boolean).join(" · ")}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data }: { data: Film[] }) {
  return (
    <DataTable
      caption="Films"
      rows={data}
      rowKey={(film) => film.link}
      columns={[
        { header: "Title", cell: (film) => <ItemLink href={film.link}>{film.title}</ItemLink> },
        { header: "Year", cell: (film) => film.year ?? "", mono: true },
        { header: "Rating", cell: (film) => formatRating(film.ratingValue), mono: true },
        {
          header: "Watched",
          cell: (film) => (film.watchedDate ? formatDate(film.watchedDate) : ""),
          mono: true,
          align: "right",
        },
      ]}
    />
  );
}

export const films: SectionDefinition<Film[]> = {
  id: "films",
  title: "Films",
  visibility: "both",
  load: () => readSource("letterboxd"),
  Site,
  Dashboard,
  source: "Letterboxd",
  synced: true,
  href: `https://letterboxd.com/${profile.social.letterboxd}/`,
  count: (data) => data.length,
  span: 6,
};
