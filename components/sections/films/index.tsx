import { formatDate } from "@/lib/format";
import type { Film } from "@/lib/sources/letterboxd";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Film[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul>
      {data.map((film) => (
        <li key={film.link}>
          <a href={film.link}>{film.title}</a> {film.rating}
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data, lastSuccessAt }: { data: Film[]; lastSuccessAt: string | null }) {
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      {data.length === 0 ? (
        <Empty />
      ) : (
        <table>
          <tbody>
            {data.map((film) => (
              <tr key={film.link}>
                <td>{film.title}</td>
                <td>{film.year}</td>
                <td>{film.ratingValue ?? "–"}</td>
                <td>{film.watchedDate ? formatDate(film.watchedDate) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export const films: SectionDefinition<Film[]> = {
  id: "films",
  title: "Films",
  visibility: "both",
  load: () => readSource("letterboxd"),
  Site,
  Dashboard,
};
