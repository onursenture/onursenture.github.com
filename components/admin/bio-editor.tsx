"use client";

import { type ReactNode, useRef } from "react";
import { ORGS, type OrgId } from "@/content/orgs";
import type { BioSegment, ProfileCopy } from "@/content/profile";
import type { DocEditorInit } from "@/lib/admin/results";
import { bioToText, textToBio } from "@/lib/content/bio-tokens";
import { type Issue, issuesAt } from "@/lib/content/issues";
import { EditorFrame } from "./editor-frame";
import { AddButton, CONTROL, IssueText, RemoveButton, TextAreaField, TextField } from "./fields";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

const ORG_IDS = Object.keys(ORGS) as OrgId[];

function Paragraph({
  index,
  segments,
  controls,
  issues,
  onChange,
  onRemove,
}: {
  index: number;
  segments: BioSegment[];
  controls: ReactNode;
  issues: Issue[];
  onChange: (segments: BioSegment[]) => void;
  onRemove: () => void;
}) {
  const area = useRef<HTMLTextAreaElement>(null);
  const text = bioToText(segments);
  function insert(org: OrgId) {
    const start = area.current?.selectionStart ?? text.length;
    const end = area.current?.selectionEnd ?? start;
    onChange(textToBio(`${text.slice(0, start)}{${org}}${text.slice(end)}`));
  }
  return (
    <div className="flex flex-col gap-2 border border-line p-3">
      <div className="flex items-center justify-between gap-2">
        {controls}
        <RemoveButton label={`Remove paragraph ${index + 1}`} onClick={onRemove} />
      </div>
      <textarea ref={area} aria-label={`Paragraph ${index + 1}`} rows={4} value={text} onChange={(event) => onChange(textToBio(event.target.value))} className={CONTROL} />
      <div className="flex flex-wrap gap-x-3 gap-y-1 type-meta">
        <span className="text-fg-muted">Insert</span>
        {ORG_IDS.map((org) => (
          <button key={org} type="button" onClick={() => insert(org)} className="text-accent hover:underline">
            {`{${org}}`}
          </button>
        ))}
      </div>
      <IssueText issues={issues} />
    </div>
  );
}

// The home's lead and bio (spec §2.4). Organisation marks are {org} tokens.
export function BioEditor({ init }: { init: DocEditorInit<ProfileCopy> }) {
  const editor = useDocEditor(init);
  const copy = editor.value;
  const set = (patch: Partial<ProfileCopy>) => editor.setValue((previous) => ({ ...previous, ...patch }));
  const paragraphs = useKeyedList(copy.bio, (bio) => set({ bio }));
  // Field messages go away with the first edit; the banner keeps the list.
  const at = (path: string) => (editor.status === "invalid" ? issuesAt(editor.issues, "profile", path) : []);
  return (
    <EditorFrame crumbs={["Bio"]} editor={editor} preview="/admin/preview/home/" focusId="identity" openHref="/">
      <div className="flex flex-col gap-4">
        <TextField label="Lead" value={copy.lead.strong} onChange={(strong) => set({ lead: { ...copy.lead, strong } })} issues={at("lead/strong")} />
        <TextAreaField label="Lead, continued" rows={2} value={copy.lead.rest} onChange={(rest) => set({ lead: { ...copy.lead, rest } })} />
        <span className="type-label text-fg-muted">Bio</span>
        <SortableList keys={paragraphs.keys} onMove={paragraphs.move}>
          {(index, controls) => (
            <Paragraph
              index={index}
              segments={copy.bio[index]}
              controls={controls}
              issues={at(`bio/${index}`)}
              onChange={(segments) => paragraphs.update(index, segments)}
              onRemove={() => paragraphs.remove(index)}
            />
          )}
        </SortableList>
        <AddButton onClick={() => paragraphs.insert(copy.bio.length, [""])}>Add paragraph</AddButton>
      </div>
    </EditorFrame>
  );
}
