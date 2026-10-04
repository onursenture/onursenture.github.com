"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Credit, WorkImage } from "@/content/work/types";
import { optional } from "@/lib/admin/list";
import { followId } from "@/lib/content/ids";
import type { Issue } from "@/lib/content/issues";
import { type ImageEntry, renditionUrl } from "@/lib/images/plan";
import { IssueText, PairsField, RemoveButton, TextField } from "../fields";

function Thumb({ entry, imageKey }: { entry?: ImageEntry; imageKey: string }) {
  if (!entry) {
    return (
      <span aria-hidden="true" className="flex aspect-[16/10] w-16 shrink-0 items-center justify-center border border-dashed border-line type-label text-fg-muted">
        16:10
      </span>
    );
  }
  // A plain thumbnail of the smallest rendition; not a page image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={renditionUrl(imageKey, entry.widths[0], "jpg", entry.baseUrl)} alt="" className="aspect-[16/10] w-16 shrink-0 border border-line object-cover" />;
}

// One image slot: thumbnail or placeholder, upload (Task 12's slot), caption,
// id, credits and the Selected work pin. `issues` are the ones to show now.
export function ImageCard({
  image,
  imageKey,
  entry,
  controls,
  locked,
  takenIds,
  issues,
  uploadSlot,
  onChange,
  onRemove,
}: {
  image: WorkImage;
  imageKey: string;
  entry?: ImageEntry;
  controls: ReactNode;
  locked: boolean;
  takenIds: string[];
  issues: Issue[];
  uploadSlot?: ReactNode;
  onChange: (image: WorkImage) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const name = image.caption || image.id;
  return (
    <div data-image={image.id} className="border border-line">
      <div className="flex items-center gap-2 p-1.5">
        {controls}
        <Thumb entry={entry} imageKey={imageKey} />
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="min-w-0 flex-1 truncate text-left type-body">
          {name}
        </button>
        {image.pin ? <span className="bg-accent px-1 type-label text-[#fff]">Pinned</span> : null}
        <RemoveButton label={`Remove image ${name}`} onClick={onRemove} />
      </div>
      {issues.length > 0 && !open ? <p className="px-2 pb-1.5 type-meta text-danger">Needs attention</p> : null}
      {open ? (
        <div className="flex flex-col gap-3 border-t border-line p-2">
          {uploadSlot}
          {image.image ? (
            <Button
              variant="text"
              className="self-start"
              onClick={() => {
                const next = { ...image };
                delete next.image;
                onChange(next);
              }}
            >
              Use the placeholder
            </Button>
          ) : null}
          <TextField
            label="Caption"
            value={image.caption ?? ""}
            onChange={(caption) =>
              onChange({ ...image, caption: optional(caption), id: followId(image.id, image.caption ?? "", caption, takenIds, "image", locked) })
            }
          />
          <TextField
            label="Id"
            value={image.id}
            disabled={locked}
            hint={locked ? "Published: permanent" : "Names the file and ?fig= links; permanent once published"}
            onChange={(id) => onChange({ ...image, id })}
          />
          <PairsField
            legend="Credits"
            value={image.credits ?? []}
            onChange={(credits) => onChange({ ...image, credits: credits.length ? credits : undefined })}
            columns={[
              { key: "name", label: "Name" },
              { key: "role", label: "Role", optional: true, className: "w-28 shrink-0" },
            ]}
            create={(): Credit => ({ name: "" })}
            addLabel="Add credit"
          />
          <label className="flex items-center gap-2 type-body">
            <input
              type="checkbox"
              checked={Boolean(image.pin)}
              onChange={(event) => onChange({ ...image, pin: event.target.checked ? { title: image.caption ?? "", note: "" } : undefined })}
            />
            Pin to Selected work
          </label>
          {image.pin ? (
            <>
              <TextField label="Pin title" hint="2–4 words" value={image.pin.title} onChange={(title) => onChange({ ...image, pin: { ...image.pin!, title } })} />
              <TextField label="Pin note" hint="One line, optional" value={image.pin.note} onChange={(note) => onChange({ ...image, pin: { ...image.pin!, note } })} />
            </>
          ) : null}
          <IssueText issues={issues} />
        </div>
      ) : null}
    </div>
  );
}
