import { RelativeTime } from "@/components/ui/relative-time";

// A source panel's header context: when it last synced.
export function SyncedAt({ at }: { at: string | null }) {
  return <span>{at ? <>Synced <RelativeTime iso={at} /></> : "Not synced yet"}</span>;
}
