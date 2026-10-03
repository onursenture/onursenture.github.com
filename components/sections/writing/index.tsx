import { formatDate } from "@/lib/format";
import { readSource } from "@/lib/sources/read";
import type { Post } from "@/lib/sources/writing";
import { Empty } from "../empty";
import { ItemLink } from "../item-link";
import type { SectionDefinition } from "../types";

function Render({ data }: { data: Post[] }) {
  // w00f.org has no posts yet; the empty state is the normal case for now.
  if (data.length === 0) return <Empty />;
  return (
    <ul className="border-t">
      {data.map((post) => (
        <li key={post.link} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b py-3">
          <ItemLink href={post.link} className="type-body">
            {post.title}
          </ItemLink>
          <time dateTime={post.date} className="type-meta text-fg-muted">
            {formatDate(post.date)}
          </time>
        </li>
      ))}
    </ul>
  );
}


export const writing: SectionDefinition<Post[]> = {
  id: "writing",
  title: "Writing",
  load: () => readSource("writing"),
  Render,
  source: "w00f.org",
  href: "https://w00f.org/",
};
