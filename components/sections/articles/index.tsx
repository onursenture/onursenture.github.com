import type { Article } from "@/lib/sources/instapaper";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

const minutes = (article: Article) => (article.minutes ? `${article.minutes} min` : "");

// title · domain · minutes
function Render({ data }: { data: Article[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className="border-t">
      {data.map((article) => (
        <li key={article.link} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b py-3">
          <ItemLink href={article.link} className="type-body">
            {article.title}
          </ItemLink>
          <span className="type-meta text-fg-muted">
            {[article.domain, minutes(article)].filter(Boolean).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}


export const articles: SectionDefinition<Article[]> = {
  id: "articles",
  title: "Saved",
  // Every liked article is on /life/saved/; the home lists the latest five.
  load: async () => {
    const view = await readSource("instapaper");
    return { ...view, data: view.data.slice(0, 5) };
  },
  Render,
  source: "Instapaper",
  href: "/life/saved/",
};
