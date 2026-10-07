"use client";

import { type ExperienceChild, type ExperienceEntry, safeSpan } from "@/content/experience";
import { ORGS, type OrgId } from "@/content/orgs";
import { optional } from "@/lib/admin/list";
import type { DocEditorInit } from "@/lib/admin/results";
import { type Issue, issuesAt } from "@/lib/content/issues";
import { useConfirm } from "./confirm-dialog";
import { EditorFrame } from "./editor-frame";
import { AddButton, CONTROL, Field, IssueText, RemoveButton, SelectField, TextField } from "./fields";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

type PageOption = { href: string; title: string };
const ORG_OPTIONS = (Object.keys(ORGS) as OrgId[]).map((id) => ({ value: id, label: ORGS[id].name }));
// The role's span, once its months are real; "dates" until then.
function spanOf(role: ExperienceEntry): string {
  return safeSpan(role.start, role.end) || "dates";
}

function Products({
  role,
  roleIndex,
  pages,
  at,
  onChange,
}: {
  role: ExperienceEntry;
  roleIndex: number;
  pages: PageOption[];
  at: (path: string) => Issue[];
  onChange: (children: ExperienceChild[]) => void;
}) {
  const list = useKeyedList(role.children, onChange);
  return (
    <div className="flex flex-col gap-2">
      <span className="type-label text-fg-muted">Products</span>
      <SortableList keys={list.keys} onMove={list.move}>
        {(index, controls) => {
          const child = role.children[index];
          return (
            <div data-testid="experience-product" className="flex flex-col gap-2 border border-line p-2">
              <div className="flex items-center justify-between gap-2">
                {controls}
                <RemoveButton label={`Remove ${child.title || "product"}`} onClick={() => list.remove(index)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Title" value={child.title} onChange={(title) => list.update(index, { ...child, title })} />
                <TextField label="Note" value={child.note} onChange={(note) => list.update(index, { ...child, note })} />
              </div>
              <Field label="Page">
                <select
                  value={child.href ?? ""}
                  onChange={(event) => {
                    const href = event.target.value || undefined;
                    const page = pages.find((item) => item.href === href);
                    list.update(index, { ...child, href, title: child.title || page?.title || "", years: href ? undefined : child.years });
                  }}
                  className={CONTROL}
                >
                  <option value="">No page (give its years)</option>
                  {pages.map((page) => (
                    <option key={page.href} value={page.href}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </Field>
              {child.href ? null : <TextField label="Years" value={child.years ?? ""} hint="e.g. 2014–2016" onChange={(years) => list.update(index, { ...child, years: optional(years) })} />}
              <IssueText issues={at(`${roleIndex}/children/${index}`)} named />
            </div>
          );
        }}
      </SortableList>
      <AddButton onClick={() => list.insert(role.children.length, { title: "", note: "" })}>Add product</AddButton>
    </div>
  );
}

// The home's Experience (spec §2.4): roles and their product rows, both reorderable.
export function ExperienceEditor({ init, pages }: { init: DocEditorInit<ExperienceEntry[]>; pages: PageOption[] }) {
  const editor = useDocEditor(init);
  const confirm = useConfirm();
  const roles = editor.value;
  const list = useKeyedList(roles, (next) => editor.setValue(() => next));
  // Field messages go away with the first edit; the banner keeps the list.
  const at = (path: string) => (editor.status === "invalid" ? issuesAt(editor.issues, "experience", path) : []);
  return (
    <EditorFrame crumbs={["Experience"]} editor={editor} preview="/admin/preview/home/" focusId="experience" openHref="/#experience">
      <div className="flex flex-col gap-4">
        <SortableList keys={list.keys} onMove={list.move}>
          {(index, controls) => {
            const role = roles[index];
            const update = (patch: Partial<ExperienceEntry>) => list.update(index, { ...role, ...patch });
            return (
              <div data-testid="experience-role" className="flex flex-col gap-3 border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  {controls}
                  <span className="truncate type-meta text-fg-muted">
                    {ORGS[role.org].name} · {spanOf(role)}
                  </span>
                  <RemoveButton
                    label={`Remove ${ORGS[role.org].name}`}
                    onClick={async () => {
                      if (await confirm({ question: `Remove the ${ORGS[role.org].name} role and its products?`, confirmLabel: "Remove" })) list.remove(index);
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <SelectField label="Organisation" value={role.org} options={ORG_OPTIONS} onChange={(org) => update({ org })} />
                  <TextField label="Role" value={role.role} onChange={(value) => update({ role: value })} issues={at(`${index}/role`)} />
                  <TextField label="Start" type="month" value={role.start} onChange={(start) => update({ start })} issues={at(`${index}/start`)} />
                  <div className="flex flex-col gap-1">
                    <TextField label="End" type="month" value={role.end ?? ""} disabled={role.end === null} onChange={(end) => update({ end })} issues={at(`${index}/end`)} />
                    <label className="flex items-center gap-2 type-meta">
                      <input type="checkbox" checked={role.end === null} onChange={(event) => update({ end: event.target.checked ? null : role.start })} />
                      Ongoing
                    </label>
                  </div>
                </div>
                <Products role={role} roleIndex={index} pages={pages} at={at} onChange={(children) => update({ children })} />
              </div>
            );
          }}
        </SortableList>
        <AddButton onClick={() => list.insert(roles.length, { org: "orkestra", role: "", start: "", end: null, children: [] })}>Add role</AddButton>
      </div>
    </EditorFrame>
  );
}
