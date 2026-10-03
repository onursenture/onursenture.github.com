import { DataTable } from "@/components/ui/data-table";
import { formatDate } from "@/lib/format";
import { readSource } from "@/lib/sources/read";
import type { Post } from "@/lib/sources/writing";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Post[] }) {
  // w00f.org has no posts yet; the empty state is the normal case for now.
  if (data.length === 0) return <Empty />;
  return (
    <ul className="border-t">
      {data.map((post) => (
        <li key={post.link} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b py-3">
          <ItemLink href={post.link} className="type-sans-16">
            {post.title}
          </ItemLink>
          <time dateTime={post.date} className="type-mono-12 text-fg-muted">
            {formatDate(post.date)}
          </time>
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data }: { data: Post[] }) {
  return (
    <DataTable
      caption="Writing"
      rows={data}
      rowKey={(post) => post.link}
      columns={[
        { header: "Title", cell: (post) => <ItemLink href={post.link}>{post.title}</ItemLink> },
        { header: "Date", cell: (post) => formatDate(post.date), mono: true, align: "right" },
      ]}
    />
  );
}

export const writing: SectionDefinition<Post[]> = {
  id: "writing",
  title: "Writing",
  visibility: "both",
  load: () => readSource("writing"),
  Site,
  Dashboard,
  source: "w00f.org",
  synced: true,
  href: "https://w00f.org/",
  count: (data) => data.length,
  span: 4,
};
