"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import type { ComposerSnapshot, NoteComposerState } from "@/lib/admin/note-composer";
import { cx } from "@/lib/cx";
import { MAX_GRAPHEMES, type NoteLang, type NoteSide } from "@/lib/notes/types";
import { CONTROL } from "../fields";
import { Attachments } from "./attachments";
import { ScheduleField } from "./schedule-field";

const STATUS_WORD = { draft: "Draft", scheduled: "Scheduled", published: "Published" } as const;

export function statusText(snap: ComposerSnapshot): string {
  if (snap.busy) return "Saving…";
  if (snap.uploads > 0) return "Uploading…";
  switch (snap.status) {
    case "conflict":
      return "This note changed in another tab. Reload to continue.";
    case "missing":
      return "This note was deleted elsewhere. Reload to continue.";
    case "unauthorized":
      return "Signed out — sign in again.";
    case "unavailable":
      return "Database unavailable — try again.";
  }
  if (snap.blocked) return "Database unavailable: notes can't be saved.";
  if (snap.status === "invalid") return "Can't publish yet:";
  if (snap.dirty) return "Unsaved changes";
  switch (snap.status) {
    case "saved":
      return snap.editing?.status === "draft" ? "Draft saved" : "Saved";
    case "published":
      return "Published";
    case "scheduled":
      return "Scheduled";
    case "unscheduled":
      return "Unscheduled";
    case "deleted":
      return "Deleted";
    default:
      return "";
  }
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (next: T) => void;
  disabled: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded-control border">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          disabled={disabled}
          onClick={() => onChange(key)}
          className={cx("min-h-8 px-3 type-meta", value === key ? "bg-fg text-bg" : "text-fg hover:bg-line")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

// Mockup B's compose box: always on top of /admin/notes/.
export function ComposeBox({
  composer,
  snap,
  uploadMode,
  onNew,
}: {
  composer: NoteComposerState;
  snap: ComposerSnapshot;
  uploadMode: "blob" | "local" | null;
  onNew: () => void;
}) {
  const disabled = snap.busy || snap.blocked;
  // Switching notes mid-write or mid-upload would drop the result.
  const switching = snap.busy || snap.uploads > 0;
  const left = MAX_GRAPHEMES - snap.count;
  const textId = useId();
  return (
    <section aria-label="Compose" className="flex flex-col gap-3">
      {snap.editing ? (
        <div className="flex items-baseline justify-between gap-3 type-meta text-fg-muted">
          <span>Editing · {STATUS_WORD[snap.editing.status]}</span>
          <button type="button" onClick={onNew} disabled={switching} className="hover:text-fg disabled:pointer-events-none disabled:opacity-40">
            Cancel
          </button>
        </div>
      ) : null}
      {/* The label doesn't wrap the textarea: a wrapped textarea's text becomes part of the label's name. */}
      <div className="flex flex-col gap-1">
        <label htmlFor={textId} className="type-label text-fg-muted">
          Note
        </label>
        <textarea
          id={textId}
          rows={4}
          value={snap.value.text}
          disabled={disabled}
          lang={snap.value.lang}
          placeholder="What are you making?"
          onChange={(event) => composer.edit({ text: event.target.value })}
          className={cx(CONTROL, "min-h-24 resize-y")}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmented<NoteSide>
          label="Side"
          options={[
            ["work", "Work"],
            ["life", "Life"],
            ["both", "Both"],
          ]}
          value={snap.value.side}
          onChange={(side) => composer.edit({ side })}
          disabled={disabled}
        />
        <Segmented<NoteLang>
          label="Language"
          options={[
            ["en", "EN"],
            ["tr", "TR"],
          ]}
          value={snap.value.lang}
          onChange={(lang) => composer.edit({ lang })}
          disabled={disabled}
        />
        <span aria-live="polite" className={cx("ml-auto type-meta", snap.over ? "text-danger" : "text-fg-muted")}>
          {left} left
        </span>
      </div>
      <Attachments composer={composer} snap={snap} uploadMode={uploadMode} disabled={disabled} />
      <ScheduleField composer={composer} snap={snap} disabled={disabled} />
      <div className="flex flex-wrap items-center gap-2">
        <p role="status" className="mr-auto type-meta text-fg-muted">
          {statusText(snap)}
        </p>
        {snap.editing ? (
          <Button
            variant="text"
            disabled={disabled || snap.uploads > 0}
            onClick={() => {
              if (window.confirm("Delete this note? This can't be undone.")) void composer.remove();
            }}
          >
            Delete
          </Button>
        ) : null}
        {snap.editing?.status === "scheduled" ? (
          <Button variant="ghost" disabled={disabled || snap.uploads > 0} onClick={() => void composer.unschedule()}>
            Unschedule
          </Button>
        ) : null}
        {snap.saveLabel ? (
          <Button variant="ghost" disabled={!snap.canSave} onClick={() => void composer.save()}>
            {snap.saveLabel}
          </Button>
        ) : null}
        <Button variant="primary" disabled={!snap.canPrimary} onClick={() => void composer.primaryAction()}>
          {snap.primaryLabel}
        </Button>
      </div>
      {snap.issues.length > 0 ? (
        <ul className="flex flex-col gap-0.5 type-meta text-danger">
          {snap.issues.map((issue) => (
            <li key={`${issue.at}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
