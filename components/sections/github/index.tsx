import { Stat, StatRow } from "@/components/ui/stat";
import { profile } from "@/content/profile";
import type { Contributions } from "@/lib/sources/github";
import { contributionStats } from "@/lib/sources/github-stats";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";
import { Heatmap } from "./heatmap";

function Site({ data }: { data: Contributions }) {
  if (data.weeks.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-4">
      <Heatmap data={data} />
      <p className="type-mono-12 text-fg-muted">{data.total} contributions in the last year</p>
    </div>
  );
}

function Dashboard({ data }: { data: Contributions }) {
  const stats = contributionStats(data);
  return (
    <div className="flex flex-col gap-4 p-3">
      <StatRow>
        <Stat label="Contributions" value={stats.total} />
        <Stat label="Active days" value={stats.activeDays} />
        <Stat label="Longest streak" value={stats.longestStreak} />
      </StatRow>
      {data.weeks.length === 0 ? <Empty /> : <Heatmap data={data} />}
    </div>
  );
}

export const github: SectionDefinition<Contributions> = {
  id: "github",
  title: "GitHub",
  visibility: "both",
  load: () => readSource("github"),
  Site,
  Dashboard,
  synced: true,
  href: `https://github.com/${profile.social.github}`,
  span: 12,
};
