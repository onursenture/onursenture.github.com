import { Empty } from "@/components/sections/empty";
import { Heatmap, contributionsLabel } from "@/components/ui/heatmap";
import { readSource } from "@/lib/sources/read";

// The figure always names its period, and comes from GitHub's own total.
export async function Contributions() {
  const { data } = await readSource("github");
  if (data.weeks.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-3">
      <p className="type-meta text-fg-muted">{contributionsLabel(data.total)}</p>
      <Heatmap data={data} />
    </div>
  );
}
