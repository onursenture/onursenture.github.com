import { COVER_GRID, Cover } from "@/components/ui/cover";
import { initialOf } from "@/components/life/archive/archive-tile";
import { TileFallback } from "@/components/life/archive/tile-fallback";
import { type ArchiveItem, latestPlays } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";

// The latest six plays as a cover row, like Films: poster, title, company.
function Render({ data }: { data: ArchiveItem[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className={COVER_GRID}>
      {data.map((play) => (
        <li key={play.key}>
          <a href={play.href} rel="noopener noreferrer" className="group flex flex-col gap-1">
            {play.image ? (
              <Cover src={play.image} alt="" width={96} className="mb-1" />
            ) : (
              <TileFallback initial={initialOf(play.title)} className="mb-1" />
            )}
            <span className="type-label truncate text-fg group-hover:underline group-hover:underline-offset-[0.2em]">
              {play.title}
            </span>
            <span className="type-label truncate text-fg-muted">{play.meta[0] ?? ""}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export const theatre: SectionDefinition<ArchiveItem[]> = {
  id: "theatre",
  title: "Theatre",
  load: async () => ({ data: latestPlays(await readLifeLog("theatre"), 6), lastSuccessAt: null }),
  Render,
  source: "tiyatrolar.com.tr",
  href: "/life/theatre/",
};
