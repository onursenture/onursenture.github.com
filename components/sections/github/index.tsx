import { profile } from "@/content/profile";
import type { Contributions } from "@/lib/sources/github";
import { readSource } from "@/lib/sources/read";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";
import { Heatmap } from "./heatmap";

function Render({ data }: { data: Contributions }) {
  if (data.weeks.length === 0) return <Empty />;
  return (
    <div className="flex flex-col gap-4">
      <Heatmap data={data} />
      <p className="type-mono-12 text-fg-muted">{data.total} contributions in the last year</p>
    </div>
  );
}

export const github: SectionDefinition<Contributions> = {
  id: "github",
  title: "GitHub",
  load: () => readSource("github"),
  Render,
  href: `https://github.com/${profile.social.github}`,
};
