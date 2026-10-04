"use client";

import type { ReactNode } from "react";
import type { Block, WorkImage } from "@/content/work/types";
import { followId, uniqueId } from "@/lib/content/ids";
import { type Issue, issuesAt } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";
import type { ImageEntry } from "@/lib/images/plan";
import { imageKey } from "@/lib/work/derive";
import { AddButton, IssueText, PairsField, ParagraphsField, RemoveButton, TextField } from "../fields";
import { SortableList } from "../sortable-list";
import { useKeyedList } from "../use-keyed-list";
import { ImageCard } from "./image-card";

export function blockLabel(block: Block): string {
  switch (block.kind) {
    case "then":
      return `Then · ${block.year || "year"}`;
    case "icons":
      return block.heading || "Icon set";
    case "images":
      return block.heading || "Images";
    default:
      return block.heading || "Untitled";
  }
}

const FALLBACK: Record<Block["kind"], string> = { text: "block", images: "images", then: "then", icons: "icon-set" };

export interface BlockCardProps {
  block: Block;
  index: number;
  docKey: DocKey;
  slug: string;
  primetek: boolean;
  controls: ReactNode;
  open: boolean;
  locked: boolean;
  takenBlockIds: string[];
  lockedImages: Set<string>;
  pageImageIds: string[];
  entries: Record<string, ImageEntry>;
  // The issues to show now (none until a publish has failed).
  issues: Issue[];
  // Task 12: renders the upload area for one image.
  renderUpload?: (image: WorkImage, update: (image: WorkImage) => void) => ReactNode;
  onToggle: () => void;
  onChange: (block: Block) => void;
  onRemove: () => void;
}

export function BlockCard(props: BlockCardProps) {
  const { block, index, docKey, controls, open, locked, issues, onToggle, onChange, onRemove } = props;
  const label = blockLabel(block);
  // validateWork places issues at the block id, zod at blocks/<index>.
  const mine = [...issuesAt(issues, docKey, block.id), ...issuesAt(issues, docKey, `blocks/${index}`)];
  const heading = "heading" in block ? (block.heading ?? "") : "";
  const setHeading = (next: string) =>
    onChange({ ...block, heading: next, id: followId(block.id, heading, next, props.takenBlockIds, FALLBACK[block.kind], locked) } as Block);

  return (
    <div data-block={block.id} className="border border-line bg-bg">
      <div className="flex items-center gap-2 px-2 py-1.5">
        {controls}
        <button type="button" aria-expanded={open} onClick={onToggle} className="flex min-w-0 flex-1 items-baseline gap-2 text-left">
          <span className="border border-line px-1 type-label text-fg-muted">{block.kind}</span>
          <span className="truncate type-body">{label}</span>
        </button>
        <span className="type-label text-fg-muted">
          {block.id}
          {locked ? " · locked" : ""}
        </span>
        <RemoveButton label={`Delete block ${label}`} onClick={onRemove} />
      </div>
      {mine.length > 0 && !open ? <p className="px-2 pb-1.5 type-meta text-danger">Needs attention</p> : null}
      {open ? (
        <div className="flex flex-col gap-3 border-t border-line p-3">
          {block.kind === "then" ? (
            <TextField label="Year" value={block.year} onChange={(year) => onChange({ ...block, year })} />
          ) : (
            <TextField label={block.kind === "text" ? "Heading" : "Heading (optional)"} value={heading} onChange={setHeading} />
          )}
          <TextField
            label="Id"
            value={block.id}
            disabled={locked}
            hint={locked ? "Published: permanent" : "The #anchor Selected work links to; permanent once published"}
            onChange={(id) => onChange({ ...block, id })}
          />
          {block.kind === "text" ? (
            <>
              <ParagraphsField label="Body" value={block.body} onChange={(body) => onChange({ ...block, body })} />
              {props.primetek ? null : (
                <PairsField
                  legend="Links"
                  value={block.links ?? []}
                  onChange={(links) => onChange({ ...block, links: links.length ? links : undefined })}
                  columns={[
                    { key: "label", label: "Label", className: "w-32 shrink-0" },
                    { key: "href", label: "https://" },
                  ]}
                  create={() => ({ label: "", href: "" })}
                  addLabel="Add link"
                />
              )}
            </>
          ) : null}
          {block.kind === "then" ? (
            <>
              <ParagraphsField label="Body" value={block.body} onChange={(body) => onChange({ ...block, body })} />
              {props.primetek ? null : (
                <PairsField
                  legend="Sources"
                  value={block.sources ?? []}
                  onChange={(sources) => onChange({ ...block, sources: sources.length ? sources : undefined })}
                  columns={[
                    { key: "label", label: "Label", className: "w-32 shrink-0" },
                    { key: "href", label: "https://" },
                  ]}
                  create={() => ({ label: "", href: "" })}
                  addLabel="Add source"
                />
              )}
            </>
          ) : null}
          {block.kind === "icons" ? <p className="type-meta text-fg-muted">The live PrimeIcons 7.0.0 set, rendered from the pinned package.</p> : null}
          {block.kind === "images" ? <ImagesField {...props} block={block} /> : null}
          <IssueText issues={mine} />
        </div>
      ) : null}
    </div>
  );
}

function ImagesField(props: BlockCardProps & { block: Extract<Block, { kind: "images" }> }) {
  const { block, onChange, slug, lockedImages, pageImageIds, entries, issues, docKey } = props;
  const list = useKeyedList(block.images, (images) => onChange({ ...block, images }));
  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex items-center gap-2">
        <legend className="mb-1 type-label text-fg-muted">Columns</legend>
        {([1, 2, 3] as const).map((columns) => (
          <label key={columns} className="flex items-center gap-1 type-body">
            <input type="radio" name={`columns-${block.id}`} checked={(block.columns ?? 1) === columns} onChange={() => onChange({ ...block, columns })} />
            {columns}
          </label>
        ))}
      </fieldset>
      <span className="type-label text-fg-muted">Images</span>
      <SortableList keys={list.keys} onMove={list.move}>
        {(index, controls) => {
          const image = block.images[index];
          const key = image.image ?? imageKey(slug, image.id);
          const update = (next: WorkImage) => list.update(index, next);
          return (
            <ImageCard
              image={image}
              imageKey={key}
              entry={entries[key]}
              controls={controls}
              locked={lockedImages.has(image.id)}
              takenIds={pageImageIds.filter((id) => id !== image.id)}
              issues={issuesAt(issues, docKey, `${block.id}/${image.id}`)}
              uploadSlot={props.renderUpload?.(image, update)}
              onChange={update}
              onRemove={() => {
                const question = image.pin ? `Remove ${image.caption || image.id}? It leaves Selected work.` : `Remove ${image.caption || image.id}?`;
                if (window.confirm(question)) list.remove(index);
              }}
            />
          );
        }}
      </SortableList>
      <AddButton onClick={() => list.insert(block.images.length, { id: uniqueId("", pageImageIds, "image") })}>Add image</AddButton>
    </div>
  );
}
