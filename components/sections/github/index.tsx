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

// All three figures cover the 12-month window GitHub returns, so a streak
// that crosses the window start is cut short; the labels say so. With no
// weeks there is nothing to count, so the tiles are left out, not shown as 0.
function Dashboard({ data }: { data: Contributions }) {
  if (data.weeks.length === 0) {
    return (
      <div className="p-3">
        <Empty />
      </div>
    );
  }
  const stats = contributionStats(data);
  return (
    <div className="flex flex-col gap-4 p-3">
      <StatRow>
        <Stat label="Contributions · 12 mo" value={stats.total} />
        <Stat label="Active days · 12 mo" value={stats.activeDays} />
        <Stat label="Longest streak · 12 mo" value={stats.longestStreak} />
      </StatRow>
      <Heatmap data={data} />
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
