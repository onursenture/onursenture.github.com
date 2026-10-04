"use client";

import { type ReactNode, useId } from "react";
import { optional } from "@/lib/admin/list";
import type { Issue } from "@/lib/content/issues";
import { cx } from "@/lib/cx";
import { useKeyedList } from "./use-keyed-list";

// Form controls for the admin editors, on the site tokens. Every control sits
// in a <label>, so its visible label is its accessible name.

const CONTROL_BASE =
  "min-w-0 rounded-control border border-line bg-bg px-2 py-1.5 type-body text-fg focus:border-accent focus:outline-none disabled:text-fg-muted";
export const CONTROL = `w-full ${CONTROL_BASE}`;

export function IssueText({ issues, id }: { issues?: Issue[]; id?: string }) {
  if (!issues?.length) return null;
  return (
    <p id={id} className="type-meta text-danger">
      {issues.map((issue) => issue.message).join("; ")}
    </p>
  );
}

// What a control needs to point at its hint or issue text.
export interface ControlProps {
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

// The label wraps the caption and the control only, so the caption is the
// control's accessible name; the hint or issue text is a sibling it is
// described by. A control that is not one of the fields below can take the
// ControlProps from the function form of children.
export function Field({
  label,
  hint,
  issues,
  children,
}: {
  label: string;
  hint?: ReactNode;
  issues?: Issue[];
  children: ReactNode | ((control: ControlProps) => ReactNode);
}) {
  const id = useId();
  const invalid = Boolean(issues?.length);
  const describedBy = invalid || hint ? id : undefined;
  const control: ControlProps = { "aria-describedby": describedBy, "aria-invalid": invalid ? true : undefined };
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label className="flex min-w-0 flex-col gap-1">
        <span className="type-label text-fg-muted">{label}</span>
        {typeof children === "function" ? children(control) : children}
      </label>
      {invalid ? (
        <IssueText id={id} issues={issues} />
      ) : hint ? (
        <span id={id} className="type-meta text-fg-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  issues,
  placeholder,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  issues?: Issue[];
  placeholder?: string;
  disabled?: boolean;
  type?: "text" | "month";
}) {
  return (
    <Field label={label} hint={hint} issues={issues}>
      {(control) => (
        <input type={type} value={value} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={CONTROL} {...control} />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  issues,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: ReactNode;
  issues?: Issue[];
}) {
  return (
    <Field label={label} hint={hint} issues={issues}>
      {(control) => <textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className={CONTROL} {...control} />}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} className={CONTROL}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="self-start type-meta text-accent hover:underline">
      + {children}
    </button>
  );
}

export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="shrink-0 px-1 type-meta text-fg-muted hover:text-danger">
      ×
    </button>
  );
}

// Body paragraphs: one textarea each, added and removed in place.
export function ParagraphsField({ label, value, onChange, issues }: { label: string; value: string[]; onChange: (next: string[]) => void; issues?: Issue[] }) {
  const list = useKeyedList(value, onChange);
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1 type-label text-fg-muted">{label}</legend>
      {value.map((text, index) => (
        <div key={list.keys[index]} className="flex items-start gap-1">
          <textarea aria-label={`${label} ${index + 1}`} value={text} rows={3} onChange={(event) => list.update(index, event.target.value)} className={CONTROL} />
          <RemoveButton label={`Remove ${label.toLowerCase()} ${index + 1}`} onClick={() => list.remove(index)} />
        </div>
      ))}
      <AddButton onClick={() => list.insert(value.length, "")}>Add paragraph</AddButton>
      <IssueText issues={issues} />
    </fieldset>
  );
}

export interface PairColumn<T> {
  key: keyof T & string;
  label: string;
  // Blank becomes undefined (optional fields such as a credit's role).
  optional?: boolean;
  className?: string;
}

// Rows of short text pairs: links, sources, credits, facts.
export function PairsField<T extends { [K in keyof T]: string | undefined }>({
  legend,
  value,
  onChange,
  columns,
  create,
  addLabel,
  removable,
  issues,
}: {
  legend: string;
  value: T[];
  onChange: (next: T[]) => void;
  columns: PairColumn<T>[];
  create: () => T;
  addLabel: string;
  removable?: (item: T) => boolean;
  issues?: Issue[];
}) {
  const list = useKeyedList(value, onChange);
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-1 type-label text-fg-muted">{legend}</legend>
      {value.map((item, index) => (
        <div key={list.keys[index]} className="flex items-center gap-1">
          {columns.map((column) => (
            <input
              key={column.key}
              aria-label={`${legend} ${index + 1} ${column.label}`}
              placeholder={column.label}
              value={item[column.key] ?? ""}
              onChange={(event) => {
                const text = event.target.value;
                list.update(index, { ...item, [column.key]: column.optional ? optional(text) : text } as T);
              }}
              // A column with its own width drops the full-width default.
              className={column.className ? cx(CONTROL_BASE, column.className) : CONTROL}
            />
          ))}
          {removable?.(item) === false ? (
            <span className="w-5 shrink-0" />
          ) : (
            <RemoveButton label={`Remove ${legend.toLowerCase()} ${index + 1}`} onClick={() => list.remove(index)} />
          )}
        </div>
      ))}
      <AddButton onClick={() => list.insert(value.length, create())}>{addLabel}</AddButton>
      <IssueText issues={issues} />
    </fieldset>
  );
}
