"use client";

import { cx } from "@/lib/cx";
import { formatMonthDay } from "@/lib/format";
import { utcToZoned } from "@/lib/notes/schedule";
import type { Note } from "@/lib/notes/types";

export type Filter = "all" | "draft" | "scheduled" | "published";

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["draft", "Drafts"],
  ["scheduled", "Scheduled"],
  ["published", "Published"],
];

const SIDE = { work: "Work", life: "Life", both: "Both" } as const;

function firstLine(note: Note): string {
  const line = note.text.split("\n")[0]?.trim();
  if (line) return line;
  if (note.embed?.kind === "images") return note.embed.images.length === 1 ? "1 image" : `${note.embed.images.length} images`;
  return "Empty note";
}

// Draft · "Oct 6 · 09:00" (scheduled, in the accent) · "Oct 4 · Work" (published).
function Pill({ note }: { note: Note }) {
  const base = "shrink-0 border px-1.5 type-label";
  if (note.status === "draft") return <span className={cx(base, "text-fg-muted")}>Draft</span>;
  if (note.status === "scheduled" && note.publishAt) {
    return <span className={cx(base, "border-accent text-accent")}>{`${formatMonthDay(note.publishAt)} · ${utcToZoned(note.publishAt).time}`}</span>;
  }
  return <span className={cx(base, "text-fg-muted")}>{`${formatMonthDay(note.publishedAt ?? note.updatedAt)} · ${SIDE[note.side]}`}</span>;
}

// Mockup B's timeline: every note in one list, filtered by status; a row loads
// its note into the compose box. Rows are off while a write or upload runs.
export function Timeline({
  notes,
  filter,
  onFilter,
  activeId,
  onOpen,
  disabled,
}: {
  notes: Note[];
  filter: Filter;
  onFilter: (next: Filter) => void;
  activeId: string | null;
  onOpen: (id: string) => void;
  disabled: boolean;
}) {
  const shown = filter === "all" ? notes : notes.filter((note) => note.status === filter);
  return (
    <section aria-label="Notes" className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 type-meta">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => onFilter(key)}
            className={filter === key ? "text-fg underline underline-offset-[0.2em]" : "text-fg-muted hover:text-fg"}
          >
            {label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="type-meta text-fg-muted">No notes here yet.</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((note) => (
            <li key={note.id} className="border-t">
              <button
                type="button"
                data-testid="note-row"
                aria-current={note.id === activeId ? "true" : undefined}
                disabled={disabled}
                onClick={() => onOpen(note.id)}
                className={cx(
                  "flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left disabled:pointer-events-none disabled:opacity-40",
                  note.id === activeId && "text-accent",
                )}
              >
                <span className="min-w-0 truncate type-body">{firstLine(note)}</span>
                <Pill note={note} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
