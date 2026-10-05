import { COVER_GRID } from "@/components/ui/cover";
import { initialOf } from "@/components/life/archive/archive-tile";
import { RemoteImage } from "@/components/life/archive/remote-image";
import { type ArchiveItem, latestPlays } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { Empty } from "../empty";
import type { SectionDefinition } from "../types";

// The latest six plays as a cover row, like Films: poster, title, company.
function Render({ data }: { data: ArchiveItem[] }) {
  if (data.length === 0) return <Empty />;
  return (
    <ul className={COVER_GRID}>
      {data.map((play) => {
        const body = (
          <>
            <RemoteImage src={play.image} initial={initialOf(play.title)} width={96} className="mb-1" />
            <span className="type-label truncate text-fg group-hover:underline group-hover:underline-offset-[0.2em]">
              {play.title}
            </span>
            <span className="type-label truncate text-fg-muted">{play.meta[0] ?? ""}</span>
          </>
        );
        return (
          <li key={play.key}>
            {play.href ? (
              <a href={play.href} rel="noopener noreferrer" className="group flex flex-col gap-1">
                {body}
              </a>
            ) : (
              <div className="flex flex-col gap-1">{body}</div>
            )}
          </li>
        );
      })}
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
