import type { NoteLinkCard } from "@/lib/notes/types";
import { hostname } from "@/lib/sources/http";

// A note's link card: a hairline box, the title (else the URL), then the site
// name (else the host) and ↗. The whole card is the link.
export function LinkCard({ card }: { card: NoteLinkCard }) {
  return (
    <a href={card.url} rel="noopener noreferrer" className="block border px-3 py-2 hover:border-fg">
      <span className="block type-body text-fg">{card.title || card.url}</span>
      <span className="block type-meta text-fg-muted">
        {card.siteName || hostname(card.url)}
        <span aria-hidden="true">{" ↗"}</span>
      </span>
    </a>
  );
}
