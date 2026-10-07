"use client";

import { type ReactNode, useId } from "react";
import { PictureView } from "@/components/picture-view";
import { Button } from "@/components/ui/button";
import type { EditorSnapshot, PhotoEditorState } from "@/lib/admin/photo-editor";
import { useConfirm } from "../confirm-dialog";
import { CONTROL } from "../fields";

// The preview fills the 720px column (688px inside its padding) or the phone width.
const PREVIEW_SIZES = "(min-width: 752px) 688px, calc(100vw - 32px)";

function Field({ id, label, aside, children }: { id: string; label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="type-label text-fg-muted">
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

const Exif = ({ on }: { on: boolean }) => (on ? <span className="type-label text-accent">EXIF</span> : null);

// Mockup A's form: the open photo, its four fields and the actions.
export function PhotoForm({ editor, snap, onClose }: { editor: PhotoEditorState; snap: EditorSnapshot; onClose: () => void }) {
  const ids = { title: useId(), alt: useId(), date: useId(), camera: useId() };
  const confirm = useConfirm();
  const editing = snap.editing;
  if (!editing) return null;
  const disabled = snap.busy || snap.uploading || snap.blocked;
  return (
    <section aria-label="Photo" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 type-meta text-fg-muted">
        <span>Editing · {editing.status === "draft" ? "Draft" : "Live"}</span>
        <button type="button" onClick={onClose} disabled={snap.busy || snap.uploading} className="hover:text-fg disabled:pointer-events-none disabled:opacity-40">
          Close
        </button>
      </div>
      <PictureView image={editing.image.key} entry={editing.image} alt="" sizes={PREVIEW_SIZES} className="max-h-[60vh] w-full object-contain" />
      <Field id={ids.title} label="Title">
        <input id={ids.title} value={snap.value.title} disabled={disabled} onChange={(event) => editor.edit({ title: event.target.value })} className={CONTROL} />
      </Field>
      <Field id={ids.alt} label="Alt text" aside={<span className="type-label text-fg-muted">optional</span>}>
        <input
          id={ids.alt}
          value={snap.value.alt}
          disabled={disabled}
          placeholder="Falls back to the title"
          onChange={(event) => editor.edit({ alt: event.target.value })}
          className={CONTROL}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id={ids.date} label="Date" aside={<Exif on={snap.exifDate} />}>
          <input
            id={ids.date}
            type="date"
            value={snap.value.takenAt.slice(0, 10)}
            disabled={disabled}
            onChange={(event) => editor.setDay(event.target.value)}
            className={CONTROL}
          />
        </Field>
        <Field id={ids.camera} label="Camera" aside={<Exif on={snap.exifCamera} />}>
          <input id={ids.camera} value={snap.value.camera} disabled={disabled} onChange={(event) => editor.edit({ camera: event.target.value })} className={CONTROL} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="text"
          disabled={disabled}
          onClick={async () => {
            if (await confirm({ question: "Delete this photo? This can't be undone.", confirmLabel: "Delete" })) void editor.remove();
          }}
          className="mr-auto"
        >
          Delete
        </Button>
        {snap.saveLabel ? (
          <Button variant="ghost" disabled={!snap.canSave} onClick={() => void editor.save()}>
            {snap.saveLabel}
          </Button>
        ) : null}
        <Button variant="primary" disabled={!snap.canPrimary} onClick={() => void editor.primaryAction()}>
          {snap.primaryLabel}
        </Button>
      </div>
    </section>
  );
}
