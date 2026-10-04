"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import type { DocEditorState } from "./use-doc-editor";

function StatusText({ editor }: { editor: DocEditorState }) {
  const pathname = usePathname();
  switch (editor.status) {
    case "dirty":
      return <>Editing…</>;
    case "saving":
      return <>Saving…</>;
    case "publishing":
      return <>Publishing…</>;
    case "conflict":
      return (
        <span className="text-danger">
          A newer draft exists —{" "}
          <button type="button" className="underline" onClick={() => window.location.reload()}>
            reload
          </button>
        </span>
      );
    case "signed-out":
      return (
        <span className="text-danger">
          Signed out —{" "}
          <a className="underline" href={`/api/auth/signin/?next=${encodeURIComponent(pathname)}`}>
            sign in again
          </a>
        </span>
      );
    case "offline":
      return <span className="text-danger">{editor.retrying ? "Offline — retrying" : "Offline — try again"}</span>;
    case "unavailable":
      return (
        <span className="text-danger">
          {editor.retrying ? "Database unavailable — retrying" : editor.blocked ? "Database unavailable" : "Database unavailable — try again"}
        </span>
      );
    case "invalid":
      return <span className="text-danger">Fix the issues to publish</span>;
    case "published":
      return (
        <>
          <StatusGlyph status="ok" /> Published
        </>
      );
    default:
      if (editor.hasDraft) {
        return (
          <>
            <StatusGlyph status="late" /> Draft saved{editor.savedAt ? <> <RelativeTime iso={editor.savedAt} /></> : null}
          </>
        );
      }
      return editor.publishedAt ? (
        <>
          <StatusGlyph status="ok" /> Published <RelativeTime iso={editor.publishedAt} />
        </>
      ) : (
        <>
          <StatusGlyph status="empty" /> Repo version
        </>
      );
  }
}

// Save status, Discard draft and Publish: the same controls on every editor.
// hideDiscard: there is nothing to go back to (a page never published).
export function DocToolbar({ editor, extra, hideDiscard = false }: { editor: DocEditorState; extra?: ReactNode; hideDiscard?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      <p role="status" aria-live="polite" className="type-meta text-fg-muted">
        <StatusText editor={editor} />
      </p>
      {extra}
      {hideDiscard ? null : (
        <Button variant="text" onClick={() => void editor.discard()} disabled={!editor.hasDraft}>
          Discard draft
        </Button>
      )}
      <Button variant="primary" onClick={() => void editor.publish()} disabled={!editor.canPublish}>
        Publish
      </Button>
    </div>
  );
}
