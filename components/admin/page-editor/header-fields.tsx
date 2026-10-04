"use client";

import type { ProductPage } from "@/content/work/types";
import { type Issue, issuesAt } from "@/lib/content/issues";
import type { DocKey } from "@/lib/content/keys";
import { PairsField, TextAreaField, TextField } from "../fields";

const REQUIRED_FACTS = ["Role", "Years", "At"];

// The page header: title and kind (the Experience note), the lead, the intro,
// the facts and, on Orkestra pages, the Live links. `issues` are the ones to
// show now (the editor passes none until a publish has failed).
export function HeaderFields({
  page,
  docKey,
  issues,
  onChange,
}: {
  page: ProductPage;
  docKey: DocKey;
  issues: Issue[];
  onChange: (patch: Partial<ProductPage>) => void;
}) {
  const at = (path: string) => issuesAt(issues, docKey, path);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="type-label text-fg-muted">Header</h2>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Title" value={page.title} onChange={(title) => onChange({ title })} issues={at("title")} />
        <TextField label="Kind" value={page.kind} hint="e.g. word game" onChange={(kind) => onChange({ kind })} />
      </div>
      <TextField label="Lead" value={page.lead.strong} onChange={(strong) => onChange({ lead: { ...page.lead, strong } })} issues={at("lead")} />
      <TextAreaField label="Lead, continued" rows={2} value={page.lead.rest} onChange={(rest) => onChange({ lead: { ...page.lead, rest } })} />
      <TextAreaField label="Intro" rows={4} value={page.intro} onChange={(intro) => onChange({ intro })} issues={at("intro")} />
      <PairsField
        legend="Facts"
        value={page.facts}
        onChange={(facts) => onChange({ facts })}
        columns={[
          { key: "label", label: "Label", className: "w-28 shrink-0" },
          { key: "value", label: "Value" },
        ]}
        create={() => ({ label: "", value: "" })}
        addLabel="Add fact"
        removable={(fact) => !REQUIRED_FACTS.includes(fact.label)}
        issues={at("facts")}
      />
      {page.org === "primetek" ? (
        <p className="type-meta text-fg-muted">PrimeTek pages carry no external links.</p>
      ) : (
        <PairsField
          legend="Live links"
          value={page.links ?? []}
          onChange={(links) => onChange({ links: links.length ? links : undefined })}
          columns={[
            { key: "label", label: "Label", className: "w-32 shrink-0" },
            { key: "href", label: "https://" },
          ]}
          create={() => ({ label: "", href: "" })}
          addLabel="Add link"
          issues={at("links")}
        />
      )}
    </section>
  );
}
