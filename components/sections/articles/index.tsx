import { formatDate } from "@/lib/format";
import type { Article } from "@/lib/sources/instapaper";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Article[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul>
      {data.map((article) => (
        <li key={article.link}>
          <a href={article.link}>{article.title}</a> · {article.domain}
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data, lastSuccessAt }: { data: Article[]; lastSuccessAt: string | null }) {
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      {data.length === 0 ? (
        <Empty />
      ) : (
        <table>
          <tbody>
            {data.map((article) => (
              <tr key={article.link}>
                <td>{article.title}</td>
                <td>{article.domain}</td>
                <td>{article.minutes ? `${article.minutes} min` : ""}</td>
                <td>{formatDate(article.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export const articles: SectionDefinition<Article[]> = {
  id: "articles",
  title: "Saved articles",
  visibility: "both",
  load: () => readSource("instapaper"),
  Site,
  Dashboard,
};
