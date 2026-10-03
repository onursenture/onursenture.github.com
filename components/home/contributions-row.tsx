import { Empty } from "@/components/sections/empty";
import { ContributionChart } from "@/components/ui/contribution-chart";
import { readSource } from "@/lib/sources/read";
import { weeklyTotals } from "@/lib/sources/weekly";

// The figure always names its period, and comes from GitHub's own total.
export async function Contributions() {
  const { data } = await readSource("github");
  if (data.weeks.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-2">
      <p className="type-meta text-fg-muted">
        {data.total.toLocaleString("en-US")} contributions in the last 12 months
      </p>
      <ContributionChart weeks={weeklyTotals(data)} />
    </div>
  );
}
