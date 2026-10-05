import type { ArchiveItem } from "@/lib/life/archive";
import { RemoteImage } from "./remote-image";

// Tiles at least 84px wide, as many as fit: 3–4 across at 390px.
export const TILE_GRID = "grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-x-2.5 gap-y-3";

export function initialOf(title: string): string {
  const first = Array.from(title.trim())[0];
  return first ? first.toLocaleUpperCase("tr") : "·";
}

// A 2:3 poster or cover with up to two caption lines (title) and its meta
// lines. The whole tile links to the item upstream.
export function ArchiveTile({ item }: { item: ArchiveItem }) {
  const body = (
    <>
      <RemoteImage src={item.image} initial={initialOf(item.title)} width={84} className="mb-1" />
      <span className="line-clamp-2 type-label text-fg group-hover:underline group-hover:underline-offset-[0.2em]">
        {item.title}
      </span>
      {item.meta.map((line, index) => (
        <span key={index} className="truncate type-label text-fg-muted">
          {line}
        </span>
      ))}
    </>
  );
  return (
    <li title={item.fullTitle}>
      {item.href ? (
        <a href={item.href} rel="noopener noreferrer" className="group flex flex-col gap-0.5">
          {body}
        </a>
      ) : (
        <div className="flex flex-col gap-0.5">{body}</div>
      )}
    </li>
  );
}
