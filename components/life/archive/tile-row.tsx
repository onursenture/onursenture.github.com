import type { ReactNode } from "react";
import type { ArchiveItem } from "@/lib/life/archive";
import { ArchiveTile, TILE_GRID } from "./archive-tile";

// A label column (heading plus muted lines) and a strip of tiles that runs to
// the page's right edge. Rows in a group are split by a hairline.
export const TILE_ROW = "grid grid-cols-1 gap-3 px-4 py-5 md:px-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-7";

export function TileRow({
  heading,
  lines = [],
  items,
  as: Heading = "h3",
  id,
  eager = 0,
}: {
  heading: ReactNode;
  lines?: string[];
  items: ArchiveItem[];
  as?: "h2" | "h3";
  id?: string;
  // How many leading tiles load eagerly (the page's first row).
  eager?: number;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t first:border-t-0">
      <div className={TILE_ROW}>
        <Heading className="type-body font-normal text-fg">
          {heading}
          {lines.map((line) => (
            <span key={line} className="block type-meta text-fg-muted">
              {line}
            </span>
          ))}
        </Heading>
        <ul className={TILE_GRID}>
          {items.map((item, index) => (
            <ArchiveTile key={item.key} item={item} priority={index < eager} />
          ))}
        </ul>
      </div>
    </section>
  );
}
