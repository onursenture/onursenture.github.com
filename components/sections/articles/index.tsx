import { DataTable } from "@/components/ui/data-table";
import { profile } from "@/content/profile";
import { formatDate } from "@/lib/format";
import type { Article } from "@/lib/sources/instapaper";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

const minutes = (article: Article) => (article.minutes ? `${article.minutes} min` : "");

// title · domain · minutes
function Site({ data }: { data: Article[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className="border-t">
      {data.map((article) => (
        <li key={article.link} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b py-3">
          <ItemLink href={article.link} className="type-sans-16">
            {article.title}
          </ItemLink>
          <span className="type-mono-12 text-fg-muted">
            {[article.domain, minutes(article)].filter(Boolean).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data }: { data: Article[] }) {
  return (
    <DataTable
      caption="Saved articles"
      rows={data}
      rowKey={(article) => article.link}
      columns={[
        { header: "Title", cell: (article) => <ItemLink href={article.link}>{article.title}</ItemLink> },
        { header: "Domain", cell: (article) => article.domain, mono: true },
        { header: "Length", cell: minutes, mono: true, align: "right" },
        { header: "Saved", cell: (article) => formatDate(article.date), mono: true, align: "right" },
      ]}
    />
  );
}

export const articles: SectionDefinition<Article[]> = {
  id: "articles",
  title: "Saved",
  visibility: "both",
  load: () => readSource("instapaper"),
  Site,
  Dashboard,
  source: "Instapaper",
  synced: true,
  href: `https://www.instapaper.com/p/${profile.social.instapaper}`,
  count: (data) => data.length,
  span: 8,
};
