"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePageAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { Block, ProductPage } from "@/content/work/types";
import type { DocEditorInit } from "@/lib/admin/results";
import { uniqueId } from "@/lib/content/ids";
import type { ImageEntry } from "@/lib/images/plan";
import { pageImages } from "@/lib/work/derive";
import { EditorFrame } from "../editor-frame";
import { SortableList } from "../sortable-list";
import { useDocEditor } from "../use-doc-editor";
import { useKeyedList } from "../use-keyed-list";
import { AddBlock } from "./add-block";
import { BlockCard, blockLabel } from "./block-card";
import { HeaderFields } from "./header-fields";

export interface PageEditorProps {
  init: DocEditorInit<ProductPage>;
  locked: { blocks: string[]; images: string[] };
  entries: Record<string, ImageEntry>;
  live: boolean;
  hasRepo: boolean;
}

// A product page's editor (spec §2.3): header fields, then the blocks as
// collapsible, reorderable cards; the open card is the one the preview outlines.
// The route keys this by document, so switching pages remounts it.
export function PageEditor({ init, locked, entries: initialEntries, live, hasRepo }: PageEditorProps) {
  const router = useRouter();
  const editor = useDocEditor(init);
  const page = editor.value;
  // Task 12 turns this into state so uploads can add entries.
  const entries = initialEntries;
  const [openKey, setOpenKey] = useState<string | null>(null);
  const set = (patch: Partial<ProductPage>) => editor.setValue((previous) => ({ ...previous, ...patch }));
  const blocks = useKeyedList(page.blocks, (next) => set({ blocks: next }));
  const lockedBlocks = new Set(locked.blocks);
  const lockedImages = new Set(locked.images);
  const pageImageIds = pageImages(page).map((image) => image.id);
  const openIndex = openKey ? blocks.keys.indexOf(openKey) : -1;
  const focusId = openIndex >= 0 ? page.blocks[openIndex].id : null;
  // Field messages go away with the first edit; the banner keeps the list.
  const shown = editor.status === "invalid" ? editor.issues : [];

  function addBlock(kind: Block["kind"]) {
    const taken = page.blocks.map((block) => block.id);
    const block: Block =
      kind === "text"
        ? { kind, id: uniqueId("", taken, "block"), heading: "", body: [""] }
        : kind === "images"
          ? { kind, id: uniqueId("", taken, "images"), columns: 3, images: [] }
          : kind === "then"
            ? { kind, id: uniqueId("then", taken, "then"), year: "", body: [""] }
            : { kind, id: uniqueId("icon-set", taken, "icon-set") };
    setOpenKey(blocks.insert(kind === "then" ? 0 : page.blocks.length, block));
  }

  function removeBlock(index: number) {
    const block = page.blocks[index];
    const pinned = block.kind === "images" && block.images.some((image) => image.pin);
    const question = pinned ? `Delete "${blockLabel(block)}"? Its pinned image leaves Selected work.` : `Delete "${blockLabel(block)}"?`;
    if (window.confirm(question)) blocks.remove(index);
  }

  async function deletePage() {
    if (!window.confirm(`Delete ${page.title}? It leaves the site at once.`)) return;
    await editor.flush();
    const result = await deletePageAction(page.slug);
    if (result.status === "ok") router.push("/admin/");
    else if (result.status === "invalid") editor.report(result.issues);
    else editor.report([{ doc: init.docKey, at: "", message: result.status === "unauthorized" ? "signed out" : "the database is unavailable" }]);
  }

  const extra = (
    <>
      {hasRepo && editor.publishedAt ? (
        <Button variant="text" onClick={() => void editor.reset()}>
          Reset to repo version
        </Button>
      ) : null}
      <Button variant="text" onClick={() => void deletePage()}>
        Delete page
      </Button>
    </>
  );

  return (
    <EditorFrame
      crumbs={["Work", page.title || page.slug]}
      editor={editor}
      preview={`/admin/preview/work/${page.slug}/`}
      focusId={focusId}
      openHref={live ? `/work/${page.slug}/` : undefined}
      extraActions={extra}
    >
      <div className="flex flex-col gap-6">
        {live ? null : <p className="border border-line px-3 py-2 type-meta text-fg-muted">New page: not on the site until you publish it.</p>}
        <HeaderFields page={page} docKey={init.docKey} issues={shown} onChange={set} />
        <section className="flex flex-col gap-2">
          <h2 className="type-label text-fg-muted">Blocks</h2>
          <SortableList
            keys={blocks.keys}
            onMove={blocks.move}
            // The then block stays first.
            canMove={(from, to) => page.blocks[from].kind !== "then" && !(page.blocks[0]?.kind === "then" && to === 0)}
          >
            {(index, controls) => {
              const block = page.blocks[index];
              return (
                <BlockCard
                  block={block}
                  index={index}
                  docKey={init.docKey}
                  slug={page.slug}
                  primetek={page.org === "primetek"}
                  controls={controls}
                  open={openKey === blocks.keys[index]}
                  locked={lockedBlocks.has(block.id)}
                  takenBlockIds={page.blocks.filter((_, i) => i !== index).map((item) => item.id)}
                  lockedImages={lockedImages}
                  pageImageIds={pageImageIds}
                  entries={entries}
                  issues={shown}
                  onToggle={() => setOpenKey(openKey === blocks.keys[index] ? null : blocks.keys[index])}
                  onChange={(next) => blocks.update(index, next)}
                  onRemove={() => removeBlock(index)}
                />
              );
            }}
          </SortableList>
          <AddBlock page={page} onAdd={addBlock} />
        </section>
      </div>
    </EditorFrame>
  );
}
