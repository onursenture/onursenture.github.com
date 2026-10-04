"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deletePageAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { Block, ProductPage, WorkImage } from "@/content/work/types";
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
import { UploadSlot } from "./upload-slot";

export interface PageEditorProps {
  init: DocEditorInit<ProductPage>;
  locked: { blocks: string[]; images: string[] };
  entries: Record<string, ImageEntry>;
  live: boolean;
  hasRepo: boolean;
  uploadMode: "blob" | "local" | null;
}

function deleteMessage(result: Exclude<Awaited<ReturnType<typeof deletePageAction>>, { status: "ok" }>): string {
  switch (result.status) {
    case "unauthorized":
      return "Signed out — sign in again.";
    case "unavailable":
      return "Database unavailable.";
    case "invalid": {
      const reasons = result.issues.map((issue) => issue.message).join("; ");
      const experience = result.issues.some((issue) => issue.doc === "experience");
      return `Can't delete: ${reasons}${experience ? ". Remove it from Experience first." : "."}`;
    }
    default:
      return "Couldn't delete this page. Reload and try again.";
  }
}

// A product page's editor (spec §2.3): header fields, then the blocks as
// collapsible, reorderable cards; the open card is the one the preview outlines.
// The route keys this by document, so switching pages remounts it.
export function PageEditor({ init, locked, entries: initialEntries, live, hasRepo, uploadMode }: PageEditorProps) {
  const router = useRouter();
  const editor = useDocEditor(init);
  const page = editor.value;
  const [entries, setEntries] = useState(initialEntries);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const set = (patch: Partial<ProductPage>) => editor.setValue((previous) => ({ ...previous, ...patch }));
  const blocks = useKeyedList(page.blocks, (next) => set({ blocks: next }));
  const lockedBlocks = new Set(locked.blocks);
  const lockedImages = new Set(locked.images);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteAlert = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (deleteError) deleteAlert.current?.scrollIntoView({ block: "nearest" });
  }, [deleteError]);
  const pageImageIds = pageImages(page).map((image) => image.id);
  const openIndex = openKey ? blocks.keys.indexOf(openKey) : -1;
  const focusId = openIndex >= 0 ? page.blocks[openIndex].id : null;
  // Field messages go away with the first edit; the banner keeps the list.
  const shown = editor.status === "invalid" ? editor.issues : [];

  // After a publish here, reload the server props: the page is now live and
  // its block and image ids are locked. The route keys this editor by
  // document, so the refresh keeps the session (and its state) as it is.
  const publishedAt = editor.publishedAt;
  const seenPublishedAt = useRef(init.publishedAt);
  useEffect(() => {
    if (publishedAt === seenPublishedAt.current) return;
    seenPublishedAt.current = publishedAt;
    router.refresh();
  }, [publishedAt, router]);

  function addBlock(kind: Block["kind"]) {
    // Published ids are reserved for good: a new block never takes the id of
    // one that was deleted.
    const taken = [...page.blocks.map((block) => block.id), ...locked.blocks];
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

  // Points an image at its upload. Functional and keyed by the image's id as
  // of now (the slot reports through its latest props, so a rename during the
  // upload is followed), never by the list index from when the file was picked:
  // edits, reorders and a second upload made in the meantime all survive.
  function pointImageAt(id: string, key: string) {
    editor.setValue((previous) => ({
      ...previous,
      blocks: previous.blocks.map((block) =>
        block.kind === "images" ? { ...block, images: block.images.map((image) => (image.id === id ? { ...image, image: key } : image)) } : block,
      ),
    }));
  }

  function removeBlock(index: number) {
    const block = page.blocks[index];
    const pinned = block.kind === "images" && block.images.some((image) => image.pin);
    const question = pinned ? `Delete "${blockLabel(block)}"? Its pinned image leaves Selected work.` : `Delete "${blockLabel(block)}"?`;
    if (window.confirm(question)) blocks.remove(index);
  }

  // Delete problems get their own line: they are not publish issues, so they
  // leave the editor's status (and Publish) alone.
  async function deletePage() {
    const question = live ? `Delete ${page.title || page.slug}? It leaves the site at once.` : "Delete this draft page?";
    if (!window.confirm(question)) return;
    setDeleteError(null);
    await editor.flush();
    const result = await deletePageAction(page.slug);
    if (result.status === "ok") router.push("/admin/");
    else setDeleteError(deleteMessage(result));
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
      // A page never published has no version to go back to; Delete page
      // removes the draft instead.
      hideDiscard={!live && !editor.publishedAt}
    >
      <div className="flex flex-col gap-6">
        {deleteError ? (
          <p ref={deleteAlert} role="alert" className="border border-danger bg-danger-bg px-3 py-2 type-meta text-danger">
            {deleteError}
          </p>
        ) : null}
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
                  takenBlockIds={[...page.blocks.filter((_, i) => i !== index).map((item) => item.id), ...locked.blocks.filter((id) => id !== block.id)]}
                  lockedImages={lockedImages}
                  pageImageIds={pageImageIds}
                  entries={entries}
                  issues={shown}
                  renderUpload={(image: WorkImage) => (
                    <UploadSlot
                      slug={page.slug}
                      imageId={image.id}
                      mode={uploadMode}
                      hasImage={Boolean(image.image)}
                      onUploaded={(key, entry) => {
                        setEntries((current) => ({ ...current, [key]: entry }));
                        pointImageAt(image.id, key);
                      }}
                    />
                  )}
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
