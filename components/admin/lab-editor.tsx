"use client";

import type { LabEntry } from "@/content/lab-index";
import { optional } from "@/lib/admin/list";
import type { DocEditorInit } from "@/lib/admin/results";
import { issuesAt } from "@/lib/content/issues";
import { EditorFrame } from "./editor-frame";
import { AddButton, RemoveButton, TextAreaField, TextField } from "./fields";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

// The home's Lab rows: add, edit, reorder, remove (spec §2.4).
export function LabEditor({ init }: { init: DocEditorInit<LabEntry[]> }) {
  const editor = useDocEditor(init);
  const entries = editor.value;
  const list = useKeyedList(entries, (next) => editor.setValue(() => next));
  // Field messages go away with the first edit; the banner keeps the list.
  const at = (path: string) => (editor.status === "invalid" ? issuesAt(editor.issues, "lab", path) : []);

  return (
    <EditorFrame crumbs={["Lab"]} editor={editor} preview="/admin/preview/home/" focusId="lab" openHref="/#lab">
      <div className="flex flex-col gap-4">
        <p className="type-meta text-fg-muted">Things you build, in display order. The Lab row hides while the list is empty.</p>
        <SortableList keys={list.keys} onMove={list.move}>
          {(index, controls) => {
            const entry = entries[index];
            return (
              <div data-testid="lab-row" className="flex flex-col gap-2 border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  {controls}
                  <RemoveButton label={`Remove ${entry.title || "entry"}`} onClick={() => list.remove(index)} />
                </div>
                <TextField label="Title" value={entry.title} onChange={(title) => list.update(index, { ...entry, title })} issues={at(`${index}/title`)} />
                <TextAreaField
                  label="Description"
                  value={entry.description}
                  rows={2}
                  onChange={(description) => list.update(index, { ...entry, description })}
                  issues={at(`${index}/description`)}
                />
                <div className="grid grid-cols-[96px_1fr] gap-2">
                  <TextField label="Year" value={entry.year ?? ""} onChange={(year) => list.update(index, { ...entry, year: optional(year) })} />
                  <TextField
                    label="Link"
                    value={entry.href ?? ""}
                    placeholder="https://"
                    onChange={(href) => list.update(index, { ...entry, href: optional(href) })}
                    issues={at(`${index}/href`)}
                  />
                </div>
              </div>
            );
          }}
        </SortableList>
        <AddButton onClick={() => list.insert(entries.length, { title: "", description: "" })}>Add entry</AddButton>
      </div>
    </EditorFrame>
  );
}
