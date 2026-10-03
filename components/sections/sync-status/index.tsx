import { SourcesTable } from "@/components/sources/sources-table";
import type { SourceStatus } from "@/lib/sources/health";
import { readSourceStatuses } from "@/lib/sources/status";
import type { SectionDefinition } from "../types";

// Dashboard-only: how fresh each external source is.
export const syncStatus: SectionDefinition<SourceStatus[]> = {
  id: "sync-status",
  title: "Sources",
  visibility: "dashboard",
  load: async () => ({ data: await readSourceStatuses(), lastSuccessAt: null }),
  Site: () => null,
  Dashboard: ({ data }) => <SourcesTable statuses={data} />,
  count: (data) => data.length,
  span: 4,
};
