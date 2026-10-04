"use client";

import type { ComposerSnapshot, NoteComposerState } from "@/lib/admin/note-composer";
import { QUARTER_TIMES } from "@/lib/notes/schedule";
import { CONTROL } from "../fields";

// Schedule: off by default; on, a date and a quarter-hour time in Istanbul.
// A published note can't be scheduled, so it shows nothing.
export function ScheduleField({ composer, snap, disabled }: { composer: NoteComposerState; snap: ComposerSnapshot; disabled: boolean }) {
  if (snap.editing?.status === "published") return null;
  const { schedule } = snap;
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-h-8 items-center gap-2 type-body">
        <input type="checkbox" checked={schedule.on} disabled={disabled} onChange={(event) => composer.setSchedule({ on: event.target.checked })} />
        Schedule
      </label>
      {schedule.on ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="type-label text-fg-muted">Date</span>
            <input type="date" value={schedule.date} disabled={disabled} onChange={(event) => composer.setSchedule({ date: event.target.value })} className={CONTROL} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="type-label text-fg-muted">Time</span>
            <select value={schedule.time} disabled={disabled} onChange={(event) => composer.setSchedule({ time: event.target.value })} className={CONTROL}>
              {QUARTER_TIMES.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <span className="pb-1.5 type-meta text-fg-muted">Istanbul</span>
        </>
      ) : null}
    </div>
  );
}
