"use client";

import type { PinRef } from "@/content/pins";
import type { PinItem } from "@/lib/admin/pin-items";
import type { DocEditorInit } from "@/lib/admin/results";
import { renditionUrl } from "@/lib/images/plan";
import { pad2 } from "@/lib/work/derive";
import { DocToolbar } from "./doc-toolbar";
import { IssuesList } from "./issues-list";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

// The home's Selected work order (spec §2.2): drag or ↑/↓, then Publish. Pin
// and unpin happen on the image card in each page's editor.
export function PinsEditor({ init, items }: { init: DocEditorInit<{ order: PinRef[] }>; items: PinItem[] }) {
  const editor = useDocEditor(init);
  const order = editor.value.order;
  const list = useKeyedList(order, (next) => editor.setValue(() => ({ order: next })));
  const byRef = new Map(items.map((item) => [`${item.slug}/${item.imageId}`, item]));
  if (order.length === 0) return <p className="type-meta text-fg-muted">Nothing is pinned. Pin an image from its page&apos;s editor.</p>;
  return (
    <div className="flex flex-col gap-3">
      <DocToolbar editor={editor} />
      <IssuesList issues={editor.issues} blocking={editor.status === "invalid"} context={{ doc: editor.docKey, value: editor.value }} />
      <SortableList keys={list.keys} onMove={list.move}>
        {(index, controls) => {
          const ref = order[index];
          const item = byRef.get(`${ref.slug}/${ref.imageId}`);
          return (
            <div data-pin={`${ref.slug}/${ref.imageId}`} className="flex items-center gap-3 border-t border-line py-1.5">
              {controls}
              {item?.entry ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={renditionUrl(item.imageKey, item.entry.widths[0], "jpg", item.entry.baseUrl)} alt="" className="aspect-[16/10] w-16 border border-line object-cover" />
              ) : (
                <span aria-hidden="true" className="aspect-[16/10] w-16 border border-dashed border-line" />
              )}
              <span className="type-meta text-fg-muted tabular-nums">FIG. {pad2(index + 1)}</span>
              <span className="min-w-0 flex-1 truncate type-body">{item?.title ?? ref.imageId}</span>
              <span className="type-meta text-fg-muted">{item?.pageTitle ?? ref.slug}</span>
            </div>
          );
        }}
      </SortableList>
    </div>
  );
}
