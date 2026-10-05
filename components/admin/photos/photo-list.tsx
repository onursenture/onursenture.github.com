"use client";

import { PictureView } from "@/components/picture-view";
import { cx } from "@/lib/cx";
import { formatDate } from "@/lib/format";
import { type StoredPhoto, photoDay } from "@/lib/photos/types";

// Mockup A's list: every photo, drafts first. A row loads its photo into the
// form; rows are off while a write or an upload runs.
export function PhotoList({
  photos,
  activeId,
  onOpen,
  disabled,
}: {
  photos: StoredPhoto[];
  activeId: string | null;
  onOpen: (id: string) => void;
  disabled: boolean;
}) {
  if (photos.length === 0) return <p className="type-meta text-fg-muted">No photos yet.</p>;
  return (
    <section aria-label="Photos">
      <ul className="flex flex-col">
        {photos.map((photo) => (
          <li key={photo.id} className="border-t">
            <button
              type="button"
              data-testid="photo-row"
              aria-current={photo.id === activeId ? "true" : undefined}
              disabled={disabled}
              onClick={() => onOpen(photo.id)}
              className={cx(
                "grid min-h-14 w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 py-2 text-left disabled:pointer-events-none disabled:opacity-40",
                photo.id === activeId && "text-accent",
              )}
            >
              <span className="block size-11 overflow-hidden bg-line">
                <PictureView image={photo.image.key} entry={photo.image} alt="" sizes="44px" className="size-11 object-cover" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate type-body">{photo.title || "Untitled"}</span>
                <span className="type-meta text-fg-muted">{formatDate(photoDay(photo))}</span>
              </span>
              <span className={cx("shrink-0 border px-1.5 type-label", photo.status === "draft" ? "border-accent text-accent" : "text-fg-muted")}>
                {photo.status === "draft" ? "Draft" : "Live"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
