import type { MediaView } from "@/lib/work/derive";

// Every figure as a mono list row: number, caption, group, tags, credits.
export function IndexView({ media, onOpen }: { media: MediaView[]; onOpen?: (id: string) => void }) {
  return (
    <ol data-view="index" className="px-4 py-6 type-meta md:px-10">
      {media.map((item) => (
        <li key={item.id} className="border-b border-dashed last:border-b-0">
          <button
            type="button"
            data-media={item.id}
            onClick={() => onOpen?.(item.id)}
            className="grid w-full grid-cols-[8ch_minmax(0,1fr)] gap-3 py-1.5 text-left hover:text-accent md:grid-cols-[8ch_minmax(0,1fr)_14ch_18ch_18ch]"
          >
            <span className="text-fg-muted">{item.label.replace("FIG. ", "")}</span>
            <span className="truncate">{item.caption}</span>
            <span className="hidden truncate text-fg-muted md:block">{item.group}</span>
            <span className="hidden truncate text-fg-muted md:block">{item.tags.join(", ")}</span>
            <span className="hidden truncate text-fg-muted md:block">{item.credits.map((c) => c.name).join(", ")}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
