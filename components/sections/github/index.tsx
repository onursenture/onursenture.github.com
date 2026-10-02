import type { Contributions } from "@/lib/sources/github";
import { readSource } from "@/lib/sources/read";
import { SyncedAt } from "../synced-at";
import type { SectionDefinition } from "../types";

function Site({ data }: { data: Contributions }) {
  return <p>{data.total} contributions in the last year</p>;
}

function Dashboard({ data, lastSuccessAt }: { data: Contributions; lastSuccessAt: string | null }) {
  const days = data.weeks.flatMap((w) => w.days);
  const activeDays = days.filter((d) => d.count > 0).length;
  return (
    <>
      <SyncedAt at={lastSuccessAt} />
      <dl>
        <dt>Contributions</dt>
        <dd>{data.total}</dd>
        <dt>Active days</dt>
        <dd>
          {activeDays} / {days.length}
        </dd>
      </dl>
    </>
  );
}

export const github: SectionDefinition<Contributions> = {
  id: "github",
  title: "GitHub",
  visibility: "both",
  load: () => readSource("github"),
  Site,
  Dashboard,
};
