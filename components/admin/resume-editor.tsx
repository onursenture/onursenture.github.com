"use client";

import { type ReactNode, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import type { Resume } from "@/content/resume";
import { optional } from "@/lib/admin/list";
import type { ResumeEditorData } from "@/lib/admin/resume";
import { type Issue, issuesAt } from "@/lib/content/issues";
import { EditorFrame } from "./editor-frame";
import { AddButton, CONTROL, Field, IssueText, RemoveButton, TextAreaField, TextField } from "./fields";
import { SortableList } from "./sortable-list";
import { useDocEditor } from "./use-doc-editor";
import { useKeyedList } from "./use-keyed-list";

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-2 type-body text-fg">{title}</legend>
      {note ? <p className="type-meta text-fg-muted">{note}</p> : null}
      {children}
    </fieldset>
  );
}

// One Experience org's bullets: add, edit, reorder, remove.
function Bullets({ name, meta, bullets, issues, onChange }: { name: string; meta: string; bullets: string[]; issues: Issue[]; onChange: (next: string[]) => void }) {
  const list = useKeyedList(bullets, onChange);
  return (
    <section data-testid="resume-role" className="flex flex-col gap-2 border border-line p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="type-body text-fg">{name}</h3>
        <span className="truncate type-meta text-fg-muted">{meta}</span>
      </div>
      <SortableList keys={list.keys} onMove={list.move}>
        {(index, controls) => (
          <div className="flex items-start gap-1">
            {controls}
            <textarea aria-label={`${name} bullet ${index + 1}`} rows={2} value={bullets[index]} onChange={(event) => list.update(index, event.target.value)} className={CONTROL} />
            <RemoveButton label={`Remove ${name} bullet ${index + 1}`} onClick={() => list.remove(index)} />
          </div>
        )}
      </SortableList>
      <AddButton onClick={() => list.insert(bullets.length, "")}>Add bullet</AddButton>
      <IssueText issues={issues} named />
    </section>
  );
}

// The resume (Sprint 8 spec §4.1): contact, summary, bullets per Experience
// org, projects, skills, education. Orgs, roles and dates come from Experience.
export function ResumeEditor({ data }: { data: ResumeEditorData }) {
  const editor = useDocEditor(data.init);
  const resume = editor.value;
  const set = (patch: Partial<Resume>) => editor.setValue((previous) => ({ ...previous, ...patch }));
  // Field messages go away with the first edit; the banner keeps the list.
  const at = (path: string) => (editor.status === "invalid" ? issuesAt(editor.issues, "resume", path) : []);
  const projects = useKeyedList(resume.projects, (projects) => set({ projects }));
  const skills = useKeyedList(resume.skills, (skills) => set({ skills }));
  const education = useKeyedList(resume.education, (education) => set({ education }));
  const [source, setSource] = useState("");

  function addFromSource() {
    const item = data.sources.find((option) => `${option.kind}:${option.href}` === source);
    if (!item) return;
    projects.insert(resume.projects.length, { title: item.title, line: "", href: item.href });
    setSource("");
  }

  return (
    <EditorFrame
      crumbs={["Resume"]}
      editor={editor}
      preview="/admin/preview/resume/"
      openHref="/resume/"
      extraActions={
        <a href="/admin/preview/resume.pdf" target="_blank" rel="noopener" className={buttonClass("ghost")}>
          Preview PDF ↗
        </a>
      }
    >
      <div className="flex flex-col gap-8">
        <Group title="Contact">
          <TextField label="Email" value={resume.contact.email} hint="Blank hides it." onChange={(email) => set({ contact: { ...resume.contact, email } })} issues={at("contact/email")} />
          <TextField
            label="LinkedIn handle"
            value={resume.contact.linkedin}
            placeholder="the part after linkedin.com/in/"
            onChange={(linkedin) => set({ contact: { ...resume.contact, linkedin } })}
            issues={at("contact/linkedin")}
          />
        </Group>

        <Group title="Summary">
          <TextAreaField label="Summary" rows={4} value={resume.summary} hint="2–3 sentences. Blank hides the row." onChange={(summary) => set({ summary })} />
        </Group>

        <Group title="Experience" note="Organisations, roles and dates come from Experience; add the bullets here.">
          {data.roles.map((role, index) => (
            <Bullets
              key={role.org}
              name={role.name}
              meta={[role.role, role.span].filter(Boolean).join(" · ")}
              bullets={resume.roles[index]?.bullets ?? []}
              issues={at(`roles/${index}`)}
              onChange={(bullets) => set({ roles: resume.roles.map((item, i) => (i === index ? { ...item, bullets } : item)) })}
            />
          ))}
        </Group>

        <Group title="Projects">
          <SortableList keys={projects.keys} onMove={projects.move}>
            {(index, controls) => {
              const project = resume.projects[index];
              return (
                <div data-testid="resume-project" className="flex flex-col gap-2 border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    {controls}
                    <RemoveButton label={`Remove ${project.title || "project"}`} onClick={() => projects.remove(index)} />
                  </div>
                  <TextField label="Title" value={project.title} onChange={(title) => projects.update(index, { ...project, title })} issues={at(`projects/${index}/title`)} />
                  <TextAreaField label="Line" rows={2} value={project.line} onChange={(line) => projects.update(index, { ...project, line })} issues={at(`projects/${index}/line`)} />
                  <TextField
                    label="Link"
                    value={project.href ?? ""}
                    placeholder="/work/<slug>/ or https://"
                    onChange={(href) => projects.update(index, { ...project, href: optional(href) })}
                    issues={at(`projects/${index}/href`)}
                  />
                </div>
              );
            }}
          </SortableList>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Add from">
              <select value={source} onChange={(event) => setSource(event.target.value)} className={CONTROL}>
                <option value="">Pick a page or Lab entry</option>
                {data.sources.map((option) => (
                  <option key={`${option.kind}:${option.href}`} value={`${option.kind}:${option.href}`}>
                    {option.kind} · {option.title}
                  </option>
                ))}
              </select>
            </Field>
            <AddButton onClick={addFromSource} disabled={!source}>Add from list</AddButton>
            <AddButton onClick={() => projects.insert(resume.projects.length, { title: "", line: "" })}>Add blank</AddButton>
          </div>
        </Group>

        <Group title="Skills">
          <SortableList keys={skills.keys} onMove={skills.move}>
            {(index, controls) => {
              const skill = resume.skills[index];
              return (
                <div data-testid="resume-skill" className="flex flex-col gap-2 border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    {controls}
                    <RemoveButton label={`Remove ${skill.group || "group"}`} onClick={() => skills.remove(index)} />
                  </div>
                  <TextField label="Group" value={skill.group} onChange={(group) => skills.update(index, { ...skill, group })} issues={at(`skills/${index}/group`)} />
                  <TextField label="Items" value={skill.items} hint="One line, comma-separated." onChange={(items) => skills.update(index, { ...skill, items })} issues={at(`skills/${index}/items`)} />
                </div>
              );
            }}
          </SortableList>
          <AddButton onClick={() => skills.insert(resume.skills.length, { group: "", items: "" })}>Add group</AddButton>
        </Group>

        <Group title="Education">
          <SortableList keys={education.keys} onMove={education.move}>
            {(index, controls) => {
              const entry = resume.education[index];
              return (
                <div data-testid="resume-education" className="flex flex-col gap-2 border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    {controls}
                    <RemoveButton label={`Remove ${entry.degree || "entry"}`} onClick={() => education.remove(index)} />
                  </div>
                  <TextField label="Degree" value={entry.degree} onChange={(degree) => education.update(index, { ...entry, degree })} issues={at(`education/${index}/degree`)} />
                  <TextField label="School" value={entry.school} onChange={(school) => education.update(index, { ...entry, school })} issues={at(`education/${index}/school`)} />
                  <TextField label="Years" value={entry.years ?? ""} hint="e.g. 2005–2010" onChange={(years) => education.update(index, { ...entry, years: optional(years) })} />
                </div>
              );
            }}
          </SortableList>
          <AddButton onClick={() => education.insert(resume.education.length, { degree: "", school: "" })}>Add entry</AddButton>
        </Group>
      </div>
    </EditorFrame>
  );
}
