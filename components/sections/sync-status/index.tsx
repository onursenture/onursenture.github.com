import { formatDateTime } from "@/lib/format";
import { readSource } from "@/lib/sources/read";
import { SOURCE_IDS, type SourceId } from "@/lib/sources/types";
import type { SectionDefinition } from "../types";

type Status = { id: SourceId; lastSuccessAt: string | null }[];

async function load() {
  const views = await Promise.all(SOURCE_IDS.map((id) => readSource(id)));
  const data: Status = SOURCE_IDS.map((id, i) => ({
    id,
    lastSuccessAt: views[i].lastSuccessAt,
  }));
  return { data, lastSuccessAt: null };
}

function Dashboard({ data }: { data: Status }) {
  return (
    <table>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>{row.lastSuccessAt ? formatDateTime(row.lastSuccessAt) : "never"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Dashboard-only: when each external source last synced.
export const syncStatus: SectionDefinition<Status> = {
  id: "sync-status",
  title: "Sources",
  visibility: "dashboard",
  load,
  Site: () => null,
  Dashboard,
};
