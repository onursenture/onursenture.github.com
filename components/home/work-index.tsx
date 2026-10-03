import type { Column } from "@/components/ui/data-table";
import { TextLink } from "@/components/ui/text-link";
import type { WorkEntry } from "@/content/work-index";
import { visibleColumns } from "@/lib/index-columns";

const OPTIONAL: Record<"years" | "role", Column<WorkEntry>> = {
  years: { header: "Years", cell: (entry) => entry.years ?? "", mono: true },
  role: { header: "Role", cell: (entry) => entry.role ?? "", mono: true },
};

// The Work table's columns. Years and Role are left out while no entry has a
// value, and return on their own once one does.
export function workColumns(entries: WorkEntry[]): Column<WorkEntry>[] {
  return [
    { header: "Project", cell: (entry) => (entry.href ? <TextLink href={entry.href}>{entry.title}</TextLink> : entry.title) },
    { header: "Notes", cell: (entry) => entry.meta ?? "", mono: true },
    ...visibleColumns(entries, ["years", "role"]).map((key) => OPTIONAL[key]),
  ];
}
