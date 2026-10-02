import { formatDate } from "@/lib/format";
import { readSource } from "@/lib/sources/read";
import type { Post } from "@/lib/sources/writing";
import { Empty } from "../empty";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Post[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul>
      {data.map((post) => (
        <li key={post.link}>
          <a href={post.link}>{post.title}</a> · {formatDate(post.date)}
        </li>
      ))}
    </ul>
  );
}

function Dashboard({ data, lastSuccessAt }: { data: Post[]; lastSuccessAt: string | null }) {
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      <Site data={data} />
    </>
  );
}

export const writing: SectionDefinition<Post[]> = {
  id: "writing",
  title: "Writing",
  visibility: "both",
  load: () => readSource("writing"),
  Site,
  Dashboard,
};
