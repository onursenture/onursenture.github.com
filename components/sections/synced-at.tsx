import { formatDateTime } from "@/lib/format";

export function SyncedAt({ at }: { at: string | null }) {
  return (
    <p className="text-xs opacity-60">
      {at ? (
        <>
          Synced <time dateTime={at}>{formatDateTime(at)}</time>
        </>
      ) : (
        "Not synced yet"
      )}
    </p>
  );
}
