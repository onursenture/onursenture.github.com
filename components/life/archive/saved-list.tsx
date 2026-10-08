import type { SavedItem } from "@/lib/life/archive";
import { cx } from "@/lib/cx";
import { initialOf } from "./archive-tile";
import { RemoteImage } from "./remote-image";

// The Saved list (mockup reading-list option 3): site and length in the label
// column, title and description in the 480px column, a 16:10 image on the
// right. Below lg: image on top, then the text, then site and length.
const SAVED_ROW = "grid grid-cols-1 gap-3 px-4 py-5 md:px-10 lg:grid-cols-[200px_minmax(0,480px)_1fr] lg:gap-7";

export function SavedList({ items, eager = 0 }: { items: SavedItem[]; eager?: number }) {
  return (
    <ul aria-label="Saved articles">
      {items.map((item, index) => (
        <li key={item.link} className="border-t first:border-t-0">
          <a href={item.link} rel="noopener noreferrer" className={cx(SAVED_ROW, "group")}>
            <span className="order-3 flex flex-col type-meta text-fg-muted lg:order-1">
              <span className="truncate">{item.site}</span>
              {item.minutes ? <span>{item.minutes} min</span> : null}
            </span>
            <span className="order-2 flex min-w-0 flex-col gap-1">
              <span className="type-lead text-fg group-hover:underline group-hover:underline-offset-[0.2em]">{item.title}</span>
              {item.description ? <span className="line-clamp-2 type-meta text-fg-soft">{item.description}</span> : null}
            </span>
            <span className="order-1 block w-full lg:order-3 lg:w-[104px] lg:justify-self-end">
              <RemoteImage src={item.image} initial={initialOf(item.site)} shape="wide" width={208} priority={index < eager} />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
